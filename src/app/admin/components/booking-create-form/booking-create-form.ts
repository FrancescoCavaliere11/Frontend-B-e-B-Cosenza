import {Component, DestroyRef, OnInit, inject, output, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {catchError, debounceTime, EMPTY, finalize, map, merge, Subject, switchMap} from 'rxjs';
import {Cancel01Icon} from '@hugeicons/core-free-icons';
import {BookingAvailabilityService} from '../../../service/booking-availability-service';
import {BookingService} from '../../../service/booking-service';
import {RoomService} from '../../../service/room-service';
import {
  AdminBookingCreateRequest,
  AvailabilityResponseSchema,
  BOOKING_RULES,
  BookingDetailSchema,
  BookingQuoteSchema,
  RoomCombinationSchema,
  StaySearch,
} from '../../../schemas/booking-schema';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_OPTION_LABELS,
  PaymentMethod,
  PaymentOption,
} from '../../../schemas/booking-enums';
import {addDaysIso, formatAmount, formatStayDate, formatStayRange, nightsBetween, todayIso} from '../../../utils/booking-format';
import {StayRange, VisibleRange} from '../../../shared/components/stay-calendar/stay-calendar';
import {EMAIL_PATTERN, stayRulesValidator} from '../../../validators/validators';

/** Camera proposta nel form: dalla disponibilità (date future) o dall'elenco camere (passate). */
interface RoomOption {
  id: string;
  number: number;
  name: string;
  capacity: number;
  pricePerNight: string;
}

/** Metodi registrabili dal back-office: la carta online passa solo da Stripe. */
const MANUAL_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.CASH_ON_SITE,
  PaymentMethod.POS_ON_SITE,
  PaymentMethod.BANK_TRANSFER,
];

/** Attesa dopo l'ultima modifica prima di interrogare il backend (API con limite per IP). */
const LOOKUP_DEBOUNCE_MS = 400;

/**
 * Le due strade per scegliere camere e date (decisione H1):
 * - `dates`: prima le date, poi le camere libere (predefinita);
 * - `rooms`: prima le camere, poi le date libere per tutte da un calendario.
 */
export type SearchMode = 'dates' | 'rooms';

/**
 * Form di creazione di una prenotazione per conto di un ospite.
 *
 * Per un arrivo da oggi in poi chiede disponibilità e preventivo al backend;
 * per un arrivo nel passato propone tutte le camere attive e chiede una
 * conferma esplicita prima di salvare. Salva da sé ed emette la prenotazione
 * creata: la schermata deve solo chiudere il pannello e ricaricare la lista.
 *
 * Le regole del pagamento (F2) sono applicate qui, ma il backend resta
 * l'autorità: ogni suo `422`/`409` arriva tramite l'interceptor e il form
 * resta compilato.
 */
@Component({
  selector: 'app-booking-create-form',
  standalone: false,
  templateUrl: './booking-create-form.html',
  styleUrls: [
    './booking-create-form.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
  ],
})
export class BookingCreateForm implements OnInit {
  created = output<BookingDetailSchema>();
  cancel = output<void>();

  protected readonly Cancel01Icon = Cancel01Icon;
  protected readonly rules = BOOKING_RULES;
  protected readonly PaymentOption = PaymentOption;
  protected readonly paymentOptions = [PaymentOption.PAY_ON_ARRIVAL, PaymentOption.PAY_NOW];
  protected readonly paymentOptionLabels = PAYMENT_OPTION_LABELS;
  protected readonly paymentMethods = MANUAL_PAYMENT_METHODS;
  protected readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected readonly formatAmount = formatAmount;
  protected readonly formatStayDate = formatStayDate;
  protected readonly formatStayRange = formatStayRange;
  protected readonly today = todayIso();

  form: FormGroup;

  /** Disponibilità delle date correnti; `null` per date passate o non valide. */
  protected readonly availability = signal<AvailabilityResponseSchema | null>(null);
  protected readonly isCheckingAvailability = signal(false);
  protected readonly availabilityError = signal<string | null>(null);

  protected readonly quote = signal<BookingQuoteSchema | null>(null);
  protected readonly isQuoting = signal(false);
  protected readonly quoteError = signal<string | null>(null);

  /** Camere attive, per gli arrivi nel passato. */
  private readonly enabledRooms = signal<RoomOption[]>([]);

  /** Camere tolte dalla selezione perché non più libere nelle nuove date. */
  protected readonly removedRoomsNotice = signal<string | null>(null);
  protected readonly isManualSelectionOpen = signal(false);
  protected readonly isConfirmingPast = signal(false);
  protected readonly isSaving = signal(false);

  /** Modalità di ricerca corrente. */
  protected readonly searchMode = signal<SearchMode>('dates');

  /** Modalità «Per camera»: notti occupate dei mesi mostrati dal calendario. */
  protected readonly unavailableNights = signal<ReadonlySet<string>>(new Set<string>());
  protected readonly isLoadingOccupancy = signal(false);
  protected readonly occupancyError = signal<string | null>(null);
  /** Date azzerate perché non più libere per tutte le camere scelte. */
  protected readonly datesClearedNotice = signal<string | null>(null);
  /** Mesi mostrati dal calendario; non letta dal template. */
  private visibleRange: VisibleRange | null = null;

  private readonly lookup$ = new Subject<void>();
  private readonly occupancy$ = new Subject<void>();
  private readonly quote$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private formBuilder: FormBuilder,
    private availabilityService: BookingAvailabilityService,
    private bookingService: BookingService,
    private roomService: RoomService,
  ) {
    this.form = this.formBuilder.group({
      stay: this.formBuilder.group(
        {
          check_in: ['', Validators.required],
          check_out: ['', Validators.required],
          guest_count: [2, [Validators.required, Validators.min(1), Validators.max(BOOKING_RULES.MAX_GUESTS)]],
        },
        {
          validators: stayRulesValidator('check_in', 'check_out', {
            minNights: BOOKING_RULES.MIN_NIGHTS,
            maxNights: BOOKING_RULES.MAX_NIGHTS,
            maxAdvanceDays: BOOKING_RULES.MAX_ADVANCE_DAYS,
          }),
        }
      ),
      room_ids: this.formBuilder.control<string[]>([]),
      payment: this.formBuilder.group({
        payment_option: [PaymentOption.PAY_ON_ARRIVAL],
        skip_email_confirmation: [true],
        mark_as_paid: [false],
        payment_method: [''],
      }),
      guest: this.formBuilder.group({
        firstname: ['', this.nameValidators()],
        lastname: ['', this.nameValidators()],
        email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
        phone_number: ['', [Validators.required, Validators.pattern(new RegExp(`^\\d{${BOOKING_RULES.PHONE_LENGTH}}$`))]],
      }),
      admin_notes: ['', Validators.maxLength(BOOKING_RULES.NOTES_MAX_LENGTH)],
    });
  }

  ngOnInit(): void {
    this.setupLookupStream();
    this.setupOccupancyStream();
    this.setupQuoteStream();
    this.setupPaymentRules();
    this.loadEnabledRooms();

    this.stayGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isConfirmingPast.set(false);
      this.lookup$.next();
    });
    merge(this.roomIdsControl.valueChanges, this.paymentOptionControl.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.quote$.next());

    // «Per camera»: cambiare camere cambia sia il calendario sia la verifica
    // delle date già scelte.
    this.roomIdsControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.searchMode() !== 'rooms') return;
      this.occupancy$.next();
      if (this.currentStay()) this.lookup$.next();
    });
  }

  // ------------------------------------------------------------------ //
  // Accesso ai controlli                                                //
  // ------------------------------------------------------------------ //

  get stayGroup(): FormGroup { return this.form.get('stay') as FormGroup; }
  get paymentGroup(): FormGroup { return this.form.get('payment') as FormGroup; }
  get guestGroup(): FormGroup { return this.form.get('guest') as FormGroup; }
  get roomIdsControl(): FormControl<string[]> { return this.form.get('room_ids') as FormControl<string[]>; }
  get paymentOptionControl(): FormControl { return this.paymentGroup.get('payment_option') as FormControl; }
  get notesControl(): FormControl { return this.form.get('admin_notes') as FormControl; }

  private nameValidators() {
    return [
      Validators.required,
      Validators.minLength(BOOKING_RULES.NAME_MIN_LENGTH),
      Validators.maxLength(BOOKING_RULES.NAME_MAX_LENGTH),
    ];
  }

  // ------------------------------------------------------------------ //
  // Soggiorno                                                           //
  // ------------------------------------------------------------------ //

  /** Ricerca corrente, o `null` se date e ospiti non sono ancora validi. */
  private currentStay(): StaySearch | null {
    if (this.stayGroup.invalid) return null;
    const {check_in, check_out, guest_count} = this.stayGroup.getRawValue();
    return {check_in, check_out, guest_count: Number(guest_count)};
  }

  /** Arrivo prima di oggi (fuso della struttura): niente disponibilità né preventivo. */
  isPastStay(): boolean {
    const checkIn: string = this.stayGroup.get('check_in')?.value;
    return !!checkIn && checkIn < todayIso();
  }

  nights(): number {
    const {check_in, check_out} = this.stayGroup.getRawValue();
    return check_in && check_out ? nightsBetween(check_in, check_out) : 0;
  }

  maxCheckIn(): string {
    return addDaysIso(todayIso(), BOOKING_RULES.MAX_ADVANCE_DAYS);
  }

  /** La partenza può essere al più presto la notte dopo l'arrivo. */
  minCheckOut(): string | null {
    const checkIn: string = this.stayGroup.get('check_in')?.value;
    return checkIn ? addDaysIso(checkIn, BOOKING_RULES.MIN_NIGHTS) : null;
  }

  stayError(): string | null {
    const touched = this.stayGroup.get('check_in')?.touched || this.stayGroup.get('check_out')?.touched;
    const guests = this.stayGroup.get('guest_count');

    if (guests?.invalid && guests.touched) {
      return `Gli ospiti devono essere fra 1 e ${BOOKING_RULES.MAX_GUESTS}`;
    }
    if (!touched) return null;

    switch (this.stayGroup.errors?.['stay']) {
      case 'order': return 'La partenza deve essere successiva all\'arrivo';
      case 'minNights': return `Il soggiorno minimo è di ${BOOKING_RULES.MIN_NIGHTS} notte`;
      case 'maxNights': return `Il soggiorno non può superare ${BOOKING_RULES.MAX_NIGHTS} notti`;
      case 'advance': return `Non si può prenotare con più di ${BOOKING_RULES.MAX_ADVANCE_DAYS} giorni di anticipo`;
      default: return null;
    }
  }

  // ------------------------------------------------------------------ //
  // Disponibilità                                                       //
  // ------------------------------------------------------------------ //

  private setupLookupStream(): void {
    this.lookup$.pipe(
      debounceTime(LOOKUP_DEBOUNCE_MS),
      map(() => this.currentStay()),
      switchMap(stay => {
        this.availabilityError.set(null);
        this.removedRoomsNotice.set(null);

        this.availability.set(null);

        if (!stay) {
          // Date ancora incomplete o non valide: si aspetta, senza toccare
          // le camere già scelte.
          this.isCheckingAvailability.set(false);
          return EMPTY;
        }

        if (this.isPastStay()) {
          // Nessuna verifica per il passato: restano le camere scelte che
          // sono fra quelle attive.
          this.isCheckingAvailability.set(false);
          this.pruneSelection();
          this.quote$.next();
          return EMPTY;
        }

        this.isCheckingAvailability.set(true);
        return this.availabilityService.checkAvailability(stay).pipe(
          catchError(err => {
            console.error('Errore nella verifica della disponibilità:', err?.status);
            this.availability.set(null);
            this.availabilityError.set('Impossibile verificare la disponibilità');
            return EMPTY;
          }),
          finalize(() => this.isCheckingAvailability.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(availability => {
      this.availability.set(availability);
      if (this.searchMode() === 'rooms') {
        this.clearDatesIfRoomsNotFree(availability);
      } else {
        this.pruneSelection();
      }
      this.quote$.next();
    });
  }

  retryAvailability(): void {
    this.lookup$.next();
  }

  /** Toglie dalla selezione le camere che non sono più fra quelle proposte, e lo dice. */
  private pruneSelection(): void {
    const offered = new Set(this.roomOptions().map(room => room.id));
    const selected = this.roomIdsControl.value;
    const kept = selected.filter(id => offered.has(id));
    if (kept.length === selected.length) return;

    const removed = selected
      .filter(id => !offered.has(id))
      .map(id => this.lastKnownRoomName(id))
      .join(', ');
    this.roomIdsControl.setValue(kept);
    this.removedRoomsNotice.set(
      `Non più disponibili nelle nuove date, tolte dalla selezione: ${removed}`
    );
  }

  private lastKnownRoomName(id: string): string {
    const room = this.enabledRooms().find(option => option.id === id);
    return room ? this.roomLabel(room) : 'una camera';
  }

  // ------------------------------------------------------------------ //
  // Camere                                                              //
  // ------------------------------------------------------------------ //

  private loadEnabledRooms(): void {
    this.roomService.loadAllRooms().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: err => console.error('Errore nel caricamento delle camere:', err?.status),
    });
    this.roomService.rooms$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(rooms => {
      this.enabledRooms.set(
        rooms
          .filter(room => room.enabled)
          .sort((a, b) => a.number - b.number)
          .map(room => ({
            id: room.id,
            number: room.number,
            name: room.name,
            capacity: room.capacity,
            pricePerNight: String(room.price),
          }))
      );
    });
  }

  /**
   * Camere selezionabili: le libere per le date future, tutte le attive per
   * quelle passate e per la modalità «Per camera» (dove le date si scelgono dopo).
   */
  roomOptions(): RoomOption[] {
    if (this.isPastStay() || this.searchMode() === 'rooms') return this.enabledRooms();

    return (this.availability()?.rooms ?? []).map(room => ({
      id: room.id,
      number: room.number,
      name: room.name,
      capacity: room.capacity,
      pricePerNight: room.price_per_night,
    }));
  }

  combinations(): RoomCombinationSchema[] {
    if (this.isPastStay() || this.searchMode() === 'rooms') return [];
    return this.availability()?.suggested_combinations ?? [];
  }

  /** `Girasole (101)`: il numero tra parentesi accanto al nome. */
  roomLabel(room: Pick<RoomOption, 'name' | 'number'>): string {
    return `${room.name} (${room.number})`;
  }

  /** `Girasole (101) + Lavanda (102)`, dai dati già presenti nella disponibilità. */
  combinationLabel(combination: RoomCombinationSchema): string {
    const byId = new Map(this.roomOptions().map(room => [room.id, room]));
    return combination.room_ids
      .map(id => byId.get(id))
      .filter((room): room is RoomOption => !!room)
      .map(room => this.roomLabel(room))
      .join(' + ');
  }

  isCombinationSelected(combination: RoomCombinationSchema): boolean {
    const selected = this.roomIdsControl.value;
    return selected.length === combination.room_ids.length
      && combination.room_ids.every(id => selected.includes(id));
  }

  selectCombination(combination: RoomCombinationSchema): void {
    this.roomIdsControl.setValue([...combination.room_ids]);
    this.roomIdsControl.markAsTouched();
  }

  isRoomSelected(id: string): boolean {
    return this.roomIdsControl.value.includes(id);
  }

  toggleRoom(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = this.roomIdsControl.value;
    this.roomIdsControl.setValue(checked ? [...selected, id] : selected.filter(roomId => roomId !== id));
    this.roomIdsControl.markAsTouched();
  }

  toggleManualSelection(): void {
    this.isManualSelectionOpen.update(open => !open);
  }

  /** Il pannello manuale è sempre aperto quando non ci sono combinazioni da proporre. */
  showManualSelection(): boolean {
    return this.isManualSelectionOpen() || this.combinations().length === 0;
  }

  selectedCapacity(): number {
    const selected = new Set(this.roomIdsControl.value);
    return this.roomOptions()
      .filter(room => selected.has(room.id))
      .reduce((total, room) => total + room.capacity, 0);
  }

  roomsError(): string | null {
    const count = this.roomIdsControl.value.length;
    const guests = Number(this.stayGroup.get('guest_count')?.value) || 0;

    if (count > BOOKING_RULES.MAX_ROOMS) {
      return `Si possono prenotare al massimo ${BOOKING_RULES.MAX_ROOMS} camere insieme`;
    }
    if (count > 0 && this.selectedCapacity() < guests) {
      return `Le camere scelte ospitano al massimo ${this.selectedCapacity()} persone`;
    }
    if (count === 0 && this.roomIdsControl.touched) {
      return 'Scegli almeno una camera';
    }
    return null;
  }

  private areRoomsValid(): boolean {
    const count = this.roomIdsControl.value.length;
    return count > 0 && count <= BOOKING_RULES.MAX_ROOMS && this.roomsError() === null;
  }

  // ------------------------------------------------------------------ //
  // Modalità «Per camera» (incremento 3b)                               //
  // ------------------------------------------------------------------ //

  /**
   * Cambio di modalità: camere e date si azzerano, perché le due strade le
   * scelgono in ordine opposto (J5). Ospiti, pagamento, ospite e note restano.
   */
  setSearchMode(mode: SearchMode): void {
    if (mode === this.searchMode()) return;
    this.searchMode.set(mode);
    this.clearRoomsAndDates();
  }

  private clearRoomsAndDates(): void {
    this.roomIdsControl.setValue([]);
    this.roomIdsControl.markAsUntouched();
    this.stayGroup.patchValue({check_in: '', check_out: ''});
    this.stayGroup.get('check_in')?.markAsUntouched();
    this.stayGroup.get('check_out')?.markAsUntouched();
    this.availability.set(null);
    this.availabilityError.set(null);
    this.quote.set(null);
    this.quoteError.set(null);
    this.removedRoomsNotice.set(null);
    this.datesClearedNotice.set(null);
    this.isManualSelectionOpen.set(false);
    this.isConfirmingPast.set(false);
    this.unavailableNights.set(new Set<string>());
    this.occupancyError.set(null);
  }

  /** Il calendario ha cambiato mesi: si ricarica l'occupazione di quelli mostrati. */
  onVisibleRangeChange(range: VisibleRange): void {
    this.visibleRange = range;
    this.occupancy$.next();
  }

  /** Arrivo e partenza scelti sul calendario finiscono negli stessi campi della modalità «Per date». */
  onCalendarRangeChange(range: StayRange): void {
    this.datesClearedNotice.set(null);
    this.stayGroup.patchValue({check_in: range.checkIn ?? '', check_out: range.checkOut ?? ''});
  }

  checkInValue(): string | null {
    return this.stayGroup.get('check_in')?.value || null;
  }

  checkOutValue(): string | null {
    return this.stayGroup.get('check_out')?.value || null;
  }

  retryOccupancy(): void {
    this.occupancy$.next();
  }

  private setupOccupancyStream(): void {
    this.occupancy$.pipe(
      debounceTime(LOOKUP_DEBOUNCE_MS),
      switchMap(() => {
        this.occupancyError.set(null);
        const roomIds = [...this.roomIdsControl.value];
        const range = this.occupancyWindow();

        if (this.searchMode() !== 'rooms' || !range
          || roomIds.length === 0 || roomIds.length > BOOKING_RULES.MAX_ROOMS) {
          this.isLoadingOccupancy.set(false);
          return EMPTY;
        }

        this.isLoadingOccupancy.set(true);
        return this.availabilityService.getOccupancy(roomIds, range.from, range.to).pipe(
          catchError(err => {
            console.error('Errore nel caricamento del calendario:', err?.status);
            this.occupancyError.set('Impossibile caricare le disponibilità del calendario');
            return EMPTY;
          }),
          finalize(() => this.isLoadingOccupancy.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(occupancy => {
      const nights = new Set(occupancy.unavailable_nights);
      this.unavailableNights.set(nights);
      this.clearDatesIfNightsTaken(nights);
    });
  }

  /**
   * Finestra da chiedere al backend: i mesi mostrati, senza il passato e
   * senza superare l'ultimo giorno prenotabile. Due mesi stanno sempre
   * sotto il limite di 92 giorni.
   */
  private occupancyWindow(): VisibleRange | null {
    if (!this.visibleRange) return null;
    const lastDay = addDaysIso(this.today, BOOKING_RULES.MAX_ADVANCE_DAYS + BOOKING_RULES.MAX_NIGHTS);
    const from = this.visibleRange.from < this.today ? this.today : this.visibleRange.from;
    const to = this.visibleRange.to > lastDay ? lastDay : this.visibleRange.to;
    return to > from ? {from, to} : null;
  }

  /**
   * Dopo aver cambiato camere, con il solo arrivo scelto: se quella notte ora
   * è occupata, l'arrivo si rifà. Con arrivo e partenza decide la verifica di
   * disponibilità, che sa anche *quali* camere non sono libere.
   */
  private clearDatesIfNightsTaken(nights: ReadonlySet<string>): void {
    const checkIn = this.checkInValue();
    if (!checkIn || this.checkOutValue() || !nights.has(checkIn)) return;
    this.clearDates(
      `Il ${formatStayDate(checkIn)} non è libero per tutte le camere scelte: scegli un altro giorno di arrivo.`
    );
  }

  /**
   * Seconda verifica, sulla disponibilità del backend: copre anche notti
   * fuori dai mesi mostrati e prenotazioni arrivate nel frattempo.
   */
  private clearDatesIfRoomsNotFree(availability: AvailabilityResponseSchema): void {
    const free = new Set(availability.rooms.map(room => room.id));
    const busy = this.roomIdsControl.value.filter(id => !free.has(id));
    if (busy.length === 0) return;

    const names = busy.map(id => this.lastKnownRoomName(id)).join(', ');
    const range = formatStayRange(availability.check_in, availability.check_out);
    this.clearDates(
      `Per il soggiorno ${range} ${busy.length === 1 ? 'non è libera' : 'non sono libere'}: ${names}. `
      + 'Scegli nuove date, oppure togli la camera.'
    );
  }

  private clearDates(notice: string): void {
    this.stayGroup.patchValue({check_in: '', check_out: ''});
    this.availability.set(null);
    this.quote.set(null);
    this.datesClearedNotice.set(notice);
  }

  // ------------------------------------------------------------------ //
  // Preventivo                                                          //
  // ------------------------------------------------------------------ //

  private setupQuoteStream(): void {
    this.quote$.pipe(
      debounceTime(LOOKUP_DEBOUNCE_MS),
      switchMap(() => {
        this.quoteError.set(null);
        const stay = this.currentStay();

        // Il preventivo parte solo se la disponibilità più recente conferma
        // tutte le camere scelte: altrimenti il backend risponderebbe 409, con
        // l'avviso dell'interceptor, mentre la verifica le sta già togliendo.
        if (!stay || this.isPastStay() || !this.areRoomsValid() || !this.allSelectedRoomsFree()) {
          this.quote.set(null);
          this.isQuoting.set(false);
          return EMPTY;
        }

        this.isQuoting.set(true);
        return this.availabilityService.getQuote({
          ...stay,
          room_ids: [...this.roomIdsControl.value],
          payment_option: this.paymentOptionControl.value,
        }).pipe(
          catchError(err => {
            console.error('Errore nel calcolo del preventivo:', err?.status);
            this.quote.set(null);
            this.quoteError.set('Impossibile calcolare il prezzo');
            return EMPTY;
          }),
          finalize(() => this.isQuoting.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(quote => this.quote.set(quote));
  }

  private allSelectedRoomsFree(): boolean {
    const availability = this.availability();
    if (!availability) return false;
    const free = new Set(availability.rooms.map(room => room.id));
    return this.roomIdsControl.value.every(id => free.has(id));
  }

  retryQuote(): void {
    this.quote$.next();
  }

  hasDiscount(): boolean {
    return Number(this.quote()?.discount_amount ?? 0) > 0;
  }

  /** Camera di una riga del preventivo, dai dati già presenti nel form (numero e posti). */
  roomOf(roomId: string): RoomOption | null {
    return this.roomOptions().find(room => room.id === roomId) ?? null;
  }

  isPayNow(): boolean {
    return this.paymentOptionControl.value === PaymentOption.PAY_NOW;
  }

  // ------------------------------------------------------------------ //
  // Pagamento (decisione F2)                                            //
  // ------------------------------------------------------------------ //

  /**
   * - pagamento anticipato ⇒ «segna come pagata» e «salta conferma» attivi e bloccati;
   * - «segna come pagata» ⇒ «salta conferma» attivo e bloccato, metodo obbligatorio;
   * - senza incasso il metodo non esiste.
   */
  private setupPaymentRules(): void {
    const markAsPaid = this.paymentGroup.get('mark_as_paid')!;

    merge(this.paymentOptionControl.valueChanges, markAsPaid.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyPaymentRules());
  }

  private applyPaymentRules(): void {
    const skip = this.paymentGroup.get('skip_email_confirmation')!;
    const markAsPaid = this.paymentGroup.get('mark_as_paid')!;
    const method = this.paymentGroup.get('payment_method')!;
    const payNow = this.paymentOptionControl.value === PaymentOption.PAY_NOW;

    if (payNow) {
      markAsPaid.setValue(true, {emitEvent: false});
      markAsPaid.disable({emitEvent: false});
    } else if (markAsPaid.disabled) {
      // Si torna da «anticipato»: l'incasso era imposto, non scelto.
      markAsPaid.enable({emitEvent: false});
      markAsPaid.setValue(false, {emitEvent: false});
    }

    if (markAsPaid.value) {
      skip.setValue(true, {emitEvent: false});
      skip.disable({emitEvent: false});
      method.setValidators(Validators.required);
    } else {
      skip.enable({emitEvent: false});
      method.clearValidators();
      method.setValue('', {emitEvent: false});
    }
    method.updateValueAndValidity({emitEvent: false});
  }

  isMarkedAsPaid(): boolean {
    return !!this.paymentGroup.getRawValue().mark_as_paid;
  }

  willWaitForConfirmation(): boolean {
    return !this.paymentGroup.getRawValue().skip_email_confirmation;
  }

  // ------------------------------------------------------------------ //
  // Ospite e note                                                       //
  // ------------------------------------------------------------------ //

  fieldError(path: string): string | null {
    const control = this.form.get(path);
    // Solo dopo che l'utente ha lasciato il campo: non mentre scrive.
    if (!control || !control.invalid || !control.touched) return null;

    switch (path) {
      case 'guest.firstname':
      case 'guest.lastname':
        return `Da ${BOOKING_RULES.NAME_MIN_LENGTH} a ${BOOKING_RULES.NAME_MAX_LENGTH} caratteri`;
      case 'guest.email':
        return 'Inserisci un indirizzo email completo';
      case 'guest.phone_number':
        return `Il telefono deve avere ${BOOKING_RULES.PHONE_LENGTH} cifre, solo numeri`;
      case 'payment.payment_method':
        return 'Indica il metodo con cui l\'ospite ha pagato';
      case 'admin_notes':
        return `Al massimo ${BOOKING_RULES.NOTES_MAX_LENGTH} caratteri`;
      default:
        return null;
    }
  }

  notesLength(): number {
    return (this.notesControl.value ?? '').length;
  }

  // ------------------------------------------------------------------ //
  // Invio                                                               //
  // ------------------------------------------------------------------ //

  canSubmit(): boolean {
    return this.form.valid
      && this.areRoomsValid()
      && !this.isSaving()
      // Per le date future la scelta deve poggiare su una disponibilità aggiornata.
      && (this.isPastStay() || (!!this.availability() && !this.isCheckingAvailability()));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.roomIdsControl.markAsTouched();
    if (!this.canSubmit()) return;

    // Un arrivo nel passato è ammesso dal backend di proposito: l'unica
    // difesa contro un refuso nella data è chiedere conferma.
    if (this.isPastStay() && !this.isConfirmingPast()) {
      this.isConfirmingPast.set(true);
      return;
    }
    this.save();
  }

  cancelPastConfirmation(): void {
    this.isConfirmingPast.set(false);
  }

  private save(): void {
    this.isConfirmingPast.set(false);
    this.isSaving.set(true);

    this.bookingService.createBooking(this.buildRequest()).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: booking => {
        this.reset();
        this.created.emit(booking);
      },
      // Il messaggio del backend lo mostra l'interceptor; il form resta compilato.
      error: err => console.error('Errore nella creazione della prenotazione:', err?.status),
    });
  }

  private buildRequest(): AdminBookingCreateRequest {
    const stay = this.currentStay()!;
    const payment = this.paymentGroup.getRawValue();
    const guest = this.guestGroup.getRawValue();
    const notes = (this.notesControl.value ?? '').trim();

    return {
      ...stay,
      room_ids: [...this.roomIdsControl.value],
      payment_option: payment.payment_option,
      ...(payment.mark_as_paid ? {payment_method: payment.payment_method} : {}),
      guest: {
        // Il backend rifiuta gli spazi ai bordi invece di toglierli.
        firstname: guest.firstname.trim(),
        lastname: guest.lastname.trim(),
        email: guest.email.trim(),
        phone_number: guest.phone_number.trim(),
      },
      skip_email_confirmation: !!payment.skip_email_confirmation,
      mark_as_paid: !!payment.mark_as_paid,
      ...(notes ? {admin_notes: notes} : {}),
    };
  }

  onCancel(): void {
    this.reset();
    this.cancel.emit();
  }

  /** Riporta il form allo stato iniziale. */
  reset(): void {
    this.form.reset({
      stay: {check_in: '', check_out: '', guest_count: 2},
      room_ids: [],
      payment: {
        payment_option: PaymentOption.PAY_ON_ARRIVAL,
        skip_email_confirmation: true,
        mark_as_paid: false,
        payment_method: '',
      },
      guest: {firstname: '', lastname: '', email: '', phone_number: ''},
      admin_notes: '',
    });
    this.applyPaymentRules();
    this.availability.set(null);
    this.availabilityError.set(null);
    this.quote.set(null);
    this.quoteError.set(null);
    this.removedRoomsNotice.set(null);
    this.isManualSelectionOpen.set(false);
    this.isConfirmingPast.set(false);
    this.searchMode.set('dates');
    this.unavailableNights.set(new Set<string>());
    this.occupancyError.set(null);
    this.datesClearedNotice.set(null);
  }
}
