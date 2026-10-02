import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {catchError, debounceTime, distinctUntilChanged, EMPTY, map, Subject, switchMap, takeUntil} from 'rxjs';
import {BookingService} from '../../../service/booking-service';
import {RoomService} from '../../../service/room-service';
import {RoomSchema} from '../../../schemas/room-schema';
import {
  BookingListItemSchema,
  BookingSearchFilters,
  CODE_MAX_LENGTH,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
  PaginatedBookingsSchema,
} from '../../../schemas/booking-schema';
import {
  BOOKING_SORT_OPTIONS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_ORDER,
  BOOKING_STATUS_TONES,
  BookingStatus,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from '../../../schemas/booking-enums';
import {formatAmount, formatStayRange, nightsBetween} from '../../../utils/booking-format';
import {dateRangeValidator} from '../../../validators/validators';

/** Controllo sintattico minimo: il resto lo valida il backend (`EmailStr`). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-booking-screen',
  standalone: false,
  templateUrl: './booking-screen.html',
  styleUrls: [
    './booking-screen.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/layout.css'
  ]
})
export class BookingScreen implements OnInit, OnDestroy {
  protected readonly statusOrder = BOOKING_STATUS_ORDER;
  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly statusTones = BOOKING_STATUS_TONES;
  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly paymentTones = PAYMENT_STATUS_TONES;
  protected readonly sortOptions = BOOKING_SORT_OPTIONS;
  protected readonly formatStayRange = formatStayRange;
  protected readonly formatAmount = formatAmount;
  protected readonly nightsBetween = nightsBetween;

  searchControl: FormControl<string | null>;
  filtersForm: FormGroup;
  selectedStatuses: BookingStatus[] = [];

  /** Errore sul campo di ricerca: finché c'è, la ricerca non parte. */
  searchError: string | null = null;

  page = 1;
  readonly pageSize = DEFAULT_PAGE_SIZE;

  currentPage: PaginatedBookingsSchema | null = null;
  bookings: BookingListItemSchema[] = [];
  rooms: RoomSchema[] = [];

  isLoading = false;

  /** Ogni emissione rilancia la ricerca; `switchMap` annulla quella in volo. */
  private query$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private bookingService: BookingService,
    private roomService: RoomService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.searchControl = this.formBuilder.control('');
    this.filtersForm = this.formBuilder.group(
      {
        date_from: [''],
        date_to: [''],
        room_id: [''],
        sort: [DEFAULT_SORT],
      },
      {validators: dateRangeValidator('date_from', 'date_to')}
    );
  }

  ngOnInit(): void {
    this.setupQueryStream();
    this.setupFilterTriggers();
    this.loadRooms();
    this.query$.next();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ------------------------------------------------------------------ //
  // Caricamento                                                         //
  // ------------------------------------------------------------------ //

  private setupQueryStream(): void {
    this.query$.pipe(
      switchMap(() => {
        this.isLoading = true;
        this.cdr.detectChanges();

        return this.bookingService.searchBookings(this.buildFilters()).pipe(
          catchError(err => {
            // Il messaggio lo mostra l'interceptor globale.
            console.error('Errore nel caricamento delle prenotazioni:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
            return EMPTY;
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(page => {
      this.currentPage = page;
      this.bookings = page.items;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  private setupFilterTriggers(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      // Confronto sul testo ripulito: aggiungere uno spazio in coda non
      // deve far partire una nuova richiesta identica alla precedente.
      map(value => (value ?? '').trim()),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());

    this.filtersForm.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  private loadRooms(): void {
    // Riusa la cache del RoomService: se la schermata Stanze l'ha già
    // caricata, qui non parte nessuna richiesta.
    this.roomService.loadAllRooms().pipe(takeUntil(this.destroy$)).subscribe({
      error: err => console.error('Errore nel caricamento delle camere:', err),
    });
    this.roomService.rooms$.pipe(takeUntil(this.destroy$)).subscribe(rooms => {
      this.rooms = [...rooms].sort((a, b) => a.number - b.number);
      this.cdr.detectChanges();
    });
  }

  /** Riparte dalla prima pagina, se i filtri sono validi. */
  applyFilters(): void {
    this.searchError = this.validateSearchText();
    if (this.searchError || this.filtersForm.invalid) {
      this.cdr.detectChanges();
      return;
    }
    this.page = 1;
    this.query$.next();
  }

  private buildFilters(): BookingSearchFilters {
    const {date_from, date_to, room_id, sort} = this.filtersForm.value;
    const text = this.searchText();
    const isEmail = text.includes('@');

    return {
      status: this.selectedStatuses.length ? [...this.selectedStatuses] : undefined,
      date_from: date_from || undefined,
      date_to: date_to || undefined,
      room_id: room_id || undefined,
      email: isEmail ? text : undefined,
      code: !isEmail && text ? text : undefined,
      sort: sort || DEFAULT_SORT,
      page: this.page,
      page_size: this.pageSize,
    };
  }

  /**
   * Testo di ricerca senza spazi ai bordi: chi incolla un codice dall'email si
   * porta dietro uno spazio, e non deve trovare una lista vuota per questo.
   */
  private searchText(): string {
    return (this.searchControl.value ?? '').trim();
  }

  /**
   * Il backend confronta codice ed email **esatti**: un'email incompleta
   * produrrebbe un 422 a ogni tasto, e un codice oltre il limite non può
   * esistere. Meglio fermarsi qui, con un messaggio.
   */
  private validateSearchText(): string | null {
    const text = this.searchText();
    if (!text) return null;

    if (text.includes('@')) {
      return EMAIL_PATTERN.test(text) ? null : 'Inserisci un indirizzo email completo';
    }
    return text.length > CODE_MAX_LENGTH
      ? `Il codice prenotazione non supera i ${CODE_MAX_LENGTH} caratteri`
      : null;
  }

  // ------------------------------------------------------------------ //
  // Filtri per stato                                                    //
  // ------------------------------------------------------------------ //

  isStatusSelected(status: BookingStatus): boolean {
    return this.selectedStatuses.includes(status);
  }

  onStatusToggle(status: BookingStatus, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedStatuses = isChecked
      ? [...this.selectedStatuses, status]
      : this.selectedStatuses.filter(s => s !== status);
    this.applyFilters();
  }

  onResetFilters(): void {
    this.selectedStatuses = [];
    this.searchControl.setValue('', {emitEvent: false});
    // L'ordinamento non è un filtro: «Azzera filtri» lo lascia com'è.
    this.filtersForm.reset(
      {date_from: '', date_to: '', room_id: '', sort: this.filtersForm.value.sort},
      {emitEvent: false}
    );
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    const {date_from, date_to, room_id} = this.filtersForm.value;
    return !!(this.selectedStatuses.length || date_from || date_to || room_id || this.searchText());
  }

  /** `Mario Rossi`, oppure il solo cognome se il nome manca. */
  guestName(item: BookingListItemSchema): string {
    return [item.guest_firstname, item.guest_lastname].filter(Boolean).join(' ');
  }

  /** Nomi delle camere, oppure il loro numero se il backend non li ha inviati. */
  roomsLabel(item: BookingListItemSchema): string {
    if (item.room_names.length) return item.room_names.join(', ');
    return `${item.rooms_count} ${item.rooms_count === 1 ? 'camera' : 'camere'}`;
  }

  checkIsInvalidDateRange(): boolean {
    return this.filtersForm.hasError('dateRange');
  }

  // ------------------------------------------------------------------ //
  // Paginazione                                                         //
  // ------------------------------------------------------------------ //

  goToPage(page: number): void {
    const pages = this.currentPage?.pages ?? 0;
    if (this.isLoading || page < 1 || page > pages || page === this.page) return;
    this.page = page;
    this.query$.next();
  }
}
