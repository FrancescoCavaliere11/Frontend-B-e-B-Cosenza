import {DestroyRef, Injectable, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Subject, debounceTime, finalize, switchMap, tap, catchError, EMPTY, Observable} from 'rxjs';
import {BookingAvailabilityService} from '../../service/booking-availability-service';
import {AvailabilityResponseSchema, BOOKING_RULES} from '../../schemas/booking-schema';
import {PaymentOption} from '../../schemas/booking-enums';
import {GuestBookingService} from '../http/guest-booking.service';
import {SiteError, toSiteError} from '../http/site-error';
import {SiteRoomsService} from '../services/site-rooms.service';
import {CreatedBooking, GuestData, GuestQuote} from '../models/booking-public.models';
import {nightsBetween} from '../../utils/booking-format';
import {BOOKING_UI} from './booking.copy';

export type BookingStep = 'search' | 'summary' | 'guest' | 'payment' | 'done';
export type SearchMode = 'dates' | 'room';

/** Una camera sceglibile, con ciò che serve a mostrarla e a contarne i posti. */
export interface SelectableRoom {
  id: string;
  name: string;
  capacity: number;
  /** Subtotale del soggiorno (modalità per date) o prezzo a notte (per camera). */
  price: string | null;
  fitsAll: boolean;
}

/** Passi raggiungibili da ciascun passo (macchina a stati del pannello). */
const TRANSITIONS: Readonly<Record<BookingStep, ReadonlyArray<BookingStep>>> = {
  search: ['summary'],
  summary: ['search', 'guest'],
  guest: ['summary', 'payment', 'done'],
  payment: ['done'],
  done: [],
};

/** Ritardo prima di cercare: si aspetta che l'utente finisca di scegliere. */
const SEARCH_DEBOUNCE_MS = 350;
/** Margine prima della scadenza del preventivo oltre il quale lo si rinnova. */
const QUOTE_SAFETY_MS = 30_000;
const DEFAULT_GUESTS = 2;

/**
 * Stato del flusso di prenotazione dell'ospite (pattern Facade + State
 * machine): i componenti leggono signal e chiamano metodi, mai l'HTTP.
 * Fornito dal pannello: ogni apertura riparte da zero.
 */
@Injectable()
export class BookingFlowStore {
  private readonly availabilityApi = inject(BookingAvailabilityService);
  private readonly bookingApi = inject(GuestBookingService);
  private readonly catalog = inject(SiteRoomsService);
  private readonly destroyRef = inject(DestroyRef);

  /* --- Stato --- */
  readonly step = signal<BookingStep>('search');
  readonly mode = signal<SearchMode>('dates');
  readonly checkIn = signal<string | null>(null);
  readonly checkOut = signal<string | null>(null);
  readonly guests = signal(DEFAULT_GUESTS);
  readonly selectedIds = signal<ReadonlyArray<string>>([]);
  readonly availability = signal<AvailabilityResponseSchema | null>(null);
  readonly unavailableNights = signal<ReadonlySet<string>>(new Set());
  readonly paymentOption = signal<PaymentOption>(PaymentOption.PAY_ON_ARRIVAL);
  readonly quote = signal<GuestQuote | null>(null);
  readonly created = signal<CreatedBooking | null>(null);
  readonly isPaid = signal(false);
  readonly guestEmail = signal<string>('');

  readonly isSearching = signal(false);
  readonly isLoadingOccupancy = signal(false);
  readonly isBusy = signal(false);
  readonly error = signal<SiteError | null>(null);

  /* --- Derivati --- */
  readonly nights = computed(() => {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    return checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  });

  readonly hasDates = computed(() => this.nights() > 0);

  /** Camere fra cui scegliere, secondo la modalità. */
  readonly rooms = computed<SelectableRoom[]>(() => {
    if (this.mode() === 'dates') {
      return (this.availability()?.rooms ?? []).map(room => ({
        id: room.id, name: room.name, capacity: room.capacity, price: room.subtotal, fitsAll: room.fits_all_guests,
      }));
    }
    return this.catalog.rooms()
      .filter(room => room.id !== null)
      .map(room => ({
        id: room.id!, name: room.name, capacity: room.capacity ?? 0, price: room.price,
        fitsAll: (room.capacity ?? 0) >= this.guests(),
      }));
  });

  readonly selectedRooms = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.rooms().filter(room => ids.has(room.id));
  });

  readonly selectedCapacity = computed(() => this.selectedRooms().reduce((sum, room) => sum + room.capacity, 0));

  /** Messaggio che spiega perché non si può proseguire, o `null`. */
  readonly searchBlocker = computed<string | null>(() => {
    if (!this.hasDates()) return BOOKING_UI.search.pickDates;
    if (!this.selectedIds().length) return BOOKING_UI.search.pickRooms;
    if (this.selectedCapacity() < this.guests()) return BOOKING_UI.search.notEnoughBeds(this.guests(), this.selectedCapacity());
    return null;
  });

  private readonly searches = new Subject<void>();
  private occupancyWindow: {from: string; to: string} | null = null;

  constructor() {
    this.searches.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      switchMap(() => this.fetchAvailability()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  /* --- Passo 1: ricerca --- */

  setMode(mode: SearchMode): void {
    if (mode === this.mode()) return;
    this.mode.set(mode);
    // Cambiare modalità azzera date e camere (come nel back-office).
    this.checkIn.set(null);
    this.checkOut.set(null);
    this.selectedIds.set([]);
    this.availability.set(null);
    this.unavailableNights.set(new Set());
    this.error.set(null);
  }

  /** Apertura dalla scheda di una camera: modalità «per camera», camera già scelta. */
  presetRoom(roomId: string): void {
    this.setMode('room');
    this.selectedIds.set([roomId]);
  }

  setRange(checkIn: string | null, checkOut: string | null): void {
    this.checkIn.set(checkIn);
    this.checkOut.set(checkOut);
    if (this.mode() === 'dates') {
      this.selectedIds.set([]);
      this.requestSearch();
    }
  }

  setGuests(count: number): void {
    const guests = Math.min(Math.max(1, count), BOOKING_RULES.MAX_GUESTS);
    this.guests.set(guests);
    if (this.mode() === 'dates') {
      this.selectedIds.set([]);
      this.requestSearch();
    }
  }

  toggleRoom(id: string): void {
    const ids = this.selectedIds();
    if (ids.includes(id)) {
      this.selectedIds.set(ids.filter(item => item !== id));
    } else if (ids.length < BOOKING_RULES.MAX_ROOMS) {
      this.selectedIds.set([...ids, id]);
    }
    if (this.mode() === 'room') this.checkSelectionAgainstOccupancy();
  }

  selectRooms(ids: ReadonlyArray<string>): void {
    this.selectedIds.set(ids.slice(0, BOOKING_RULES.MAX_ROOMS));
  }

  /** Calendario «per camera»: notti occupate delle camere scelte nella finestra visibile. */
  loadOccupancy(from: string, to: string): void {
    this.occupancyWindow = {from, to};
    const ids = this.selectedIds();
    if (!ids.length) {
      this.unavailableNights.set(new Set());
      return;
    }
    this.isLoadingOccupancy.set(true);
    this.availabilityApi.getOccupancy([...ids], from, to).pipe(
      finalize(() => this.isLoadingOccupancy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: response => {
        this.unavailableNights.set(new Set(response.unavailable_nights));
        this.dropDatesIfTaken();
      },
      error: error => this.error.set(toSiteError(error)),
    });
  }

  /* --- Passo 2: riepilogo e preventivo --- */

  continueToSummary(): void {
    if (this.searchBlocker()) return;
    this.paymentOption.set(PaymentOption.PAY_ON_ARRIVAL);
    this.fetchQuote(() => this.go('summary'));
  }

  setPaymentOption(option: PaymentOption): void {
    if (option === this.paymentOption()) return;
    this.paymentOption.set(option);
    this.fetchQuote();
  }

  continueToGuest(): void {
    if (this.quote()) this.go('guest');
  }

  /* --- Passo 3: dati dell'ospite --- */

  submitGuest(guest: GuestData, captchaToken: string | null, website: string | null): void {
    const quote = this.quote();
    if (!quote || this.isBusy()) return;

    // Preventivo in scadenza: lo si rinnova prima di spenderlo.
    if (Date.parse(quote.quoteExpiresAt) - Date.now() < QUOTE_SAFETY_MS) {
      this.fetchQuote(() => this.submitGuest(guest, captchaToken, website));
      return;
    }

    this.run(this.bookingApi.create({
      quote_token: quote.quoteToken,
      guest,
      accept_terms: true,
      captcha_token: captchaToken,
      website,
    }), created => {
      this.created.set(created);
      this.guestEmail.set(guest.email);
      this.go(created.booking.paymentOption === PaymentOption.PAY_NOW ? 'payment' : 'done');
    }, error => this.onCreateError(error));
  }

  /* --- Passo 4: pagamento --- */

  markPaid(): void {
    this.isPaid.set(true);
    this.go('done');
  }

  back(): void {
    const previous: Partial<Record<BookingStep, BookingStep>> = {summary: 'search', guest: 'summary'};
    const target = previous[this.step()];
    if (target) this.go(target);
  }

  clearError(): void {
    this.error.set(null);
  }

  /* --- Interni --- */

  private go(step: BookingStep): void {
    if (!TRANSITIONS[this.step()].includes(step)) return;
    this.error.set(null);
    this.step.set(step);
  }

  private requestSearch(): void {
    this.availability.set(null);
    if (this.hasDates()) this.searches.next();
  }

  private fetchAvailability(): Observable<unknown> {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) return EMPTY;

    this.isSearching.set(true);
    this.error.set(null);
    return this.availabilityApi.checkAvailability({check_in: checkIn, check_out: checkOut, guest_count: this.guests()}).pipe(
      tap(response => {
        this.availability.set(response);
        const single = response.rooms.filter(room => room.fits_all_guests);
        // Una sola camera adatta: la si propone già scelta.
        if (single.length === 1 && !response.suggested_combinations.length) this.selectRooms([single[0].id]);
      }),
      catchError(error => {
        this.error.set(toSiteError(error));
        return EMPTY;
      }),
      finalize(() => this.isSearching.set(false)),
    );
  }

  private fetchQuote(then?: () => void): void {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) return;
    this.run(this.bookingApi.quote({
      check_in: checkIn,
      check_out: checkOut,
      guest_count: this.guests(),
      room_ids: [...this.selectedIds()],
      payment_option: this.paymentOption(),
    }), quote => {
      this.quote.set(quote);
      then?.();
    });
  }

  private onCreateError(error: SiteError): void {
    // Preventivo scaduto o non più valido: lo si ricalcola e si avvisa.
    if (error.status === 422 && !Object.keys(error.fieldErrors).length) {
      this.fetchQuote(() => this.error.set({...error, message: BOOKING_UI.guest.quoteRefreshed}));
      return;
    }
    // Camere non più libere: si torna alla ricerca, date e ospiti restano.
    if (error.status === 409 || error.status === 410) {
      this.step.set('search');
      this.selectedIds.set([]);
      this.requestSearch();
    }
    this.error.set(error);
  }

  /** Camere cambiate nella modalità «per camera»: si rilegge l'occupazione. */
  private checkSelectionAgainstOccupancy(): void {
    if (this.occupancyWindow) this.loadOccupancy(this.occupancyWindow.from, this.occupancyWindow.to);
  }

  /** Se una notte scelta non è più libera per le camere selezionate, le date si azzerano. */
  private dropDatesIfTaken(): void {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    if (!checkIn || !checkOut) return;
    const taken = [...this.unavailableNights()].some(night => night >= checkIn && night < checkOut);
    if (!taken) return;
    this.checkIn.set(null);
    this.checkOut.set(null);
    this.error.set({status: 409, message: BOOKING_UI.search.datesTaken, retryAfter: null, fieldErrors: {}});
  }

  private run<T>(request: Observable<T>, onSuccess: (value: T) => void, onError?: (error: SiteError) => void): void {
    this.isBusy.set(true);
    this.error.set(null);
    request.pipe(
      finalize(() => this.isBusy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: onSuccess,
      error: raw => {
        const error = toSiteError(raw);
        if (onError) onError(error);
        else this.error.set(error);
      },
    });
  }
}
