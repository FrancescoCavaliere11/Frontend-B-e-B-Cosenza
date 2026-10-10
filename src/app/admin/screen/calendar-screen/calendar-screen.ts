import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {catchError, EMPTY, finalize, Subject, switchMap} from 'rxjs';
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  LeftToRightListBulletIcon,
} from '@hugeicons/core-free-icons';
import {BookingService} from '../../../service/booking-service';
import {BookingDetailSchema} from '../../../schemas/booking-schema';
import {PlanningSchema, PlanningStaySchema} from '../../../schemas/booking-planning';
import {BadgeTone, BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES, BookingStatus} from '../../../schemas/booking-enums';
import {StatusChangeRequest} from '../../../schemas/booking-transitions';
import {PaymentChangeRequest} from '../../../schemas/booking-payments';
import {addDaysIso, formatStayRange, todayIso} from '../../../utils/booking-format';
import {formatLongDate} from '../../../utils/calendar-dates';
import {PlanningSpan, todaySummary, windowEnd, windowStartFor} from '../../../utils/planning-layout';
import {BookingDetailFacade} from '../../service/booking-detail-facade';
import {PlanningCellClick, PlanningStayClick} from '../../components/planning-grid/planning-grid';

/** Contenuto del pannello laterale. */
type Drawer =
  | {kind: 'detail'; stay: PlanningStaySchema}
  | {kind: 'create'; roomId: string | null; checkIn: string | null};

/** Voce della legenda dei soggiorni. */
interface StayLegendItem {
  label: string;
  tone: BadgeTone;
  pending: boolean;
}

/**
 * Stati che compaiono sul tabellone, nell'ordine della legenda. Etichette e
 * toni vengono dalle costanti dei badge: legenda, barre e badge non possono
 * divergere. Le due attese hanno lo stesso aspetto: una voce sola.
 */
const STAY_LEGEND: ReadonlyArray<StayLegendItem> = [
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
].map(status => ({
  label: BOOKING_STATUS_LABELS[status],
  tone: BOOKING_STATUS_TONES[status],
  pending: false,
})).concat({
  label: 'In attesa di conferma o di pagamento',
  tone: BOOKING_STATUS_TONES[BookingStatus.PENDING_CONFIRMATION],
  pending: true,
});

/** Ampiezze offerte, nell'ordine dei pulsanti. */
const SPAN_OPTIONS: ReadonlyArray<{value: PlanningSpan; label: string}> = [
  {value: 14, label: '2 settimane'},
  {value: 31, label: 'Mese'},
];

/**
 * Calendario: tabellone camere × giorni (incremento 7).
 *
 * Clic su una barra → scheda della prenotazione nel pannello laterale, con
 * le stesse azioni dell'Elenco (logica condivisa in `BookingDetailFacade`).
 * Clic su una notte libera → «Nuova prenotazione» con camera e arrivo già
 * scelti. Dopo ogni azione il tabellone si ricarica.
 */
@Component({
  selector: 'app-calendar-screen',
  standalone: false,
  templateUrl: './calendar-screen.html',
  styleUrls: [
    './calendar-screen.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/stay-tones.css',
  ],
  providers: [BookingDetailFacade],
})
export class CalendarScreen implements OnInit {
  protected readonly ArrowLeft01Icon = ArrowLeft01Icon;
  protected readonly ArrowRight01Icon = ArrowRight01Icon;
  protected readonly Add01Icon = Add01Icon;
  protected readonly LeftToRightListBulletIcon = LeftToRightListBulletIcon;
  protected readonly spanOptions = SPAN_OPTIONS;
  protected readonly stayLegend = STAY_LEGEND;

  protected readonly today = signal(todayIso());
  /** Primo giorno mostrato. Si apre su ieri: si vedono anche le partenze di stamattina. */
  protected readonly dateFrom = signal(windowStartFor(todayIso()));
  protected readonly span = signal<PlanningSpan>(14);
  protected readonly dateTo = computed(() => windowEnd(this.dateFrom(), this.span()));

  protected readonly planning = signal<PlanningSchema | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly drawer = signal<Drawer | null>(null);

  /** «12 ott → 25 ott 2026»: l'ultimo giorno mostrato, non quello escluso. */
  protected readonly rangeLabel = computed(() =>
    formatStayRange(this.dateFrom(), addDaysIso(this.dateTo(), -1))
  );

  /** «sabato 10 ottobre 2026», nel riquadro di oggi. */
  protected readonly todayLabel = computed(() => formatLongDate(this.today()));

  /** Riepilogo di oggi, solo se la finestra caricata lo permette. */
  protected readonly summary = computed(() => {
    const planning = this.planning();
    if (!planning) return null;
    return todaySummary(planning.stays, planning.rooms, planning.date_from, planning.date_to, this.today());
  });

  /** Prenotazione aperta nel pannello, evidenziata sul tabellone. */
  protected readonly selectedBookingId = computed(() => {
    const drawer = this.drawer();
    return drawer?.kind === 'detail' ? drawer.stay.booking_id : null;
  });

  private readonly drawerRef = viewChild<ElementRef<HTMLElement>>('drawerPanel');
  /** Barra o pulsante che ha aperto il pannello: ci torna il focus alla chiusura. */
  private lastTrigger: HTMLElement | null = null;

  /** Ogni emissione ricarica la finestra corrente; `switchMap` annulla la richiesta in volo. */
  private readonly load$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  constructor(
    private bookingService: BookingService,
    protected detail: BookingDetailFacade,
  ) {}

  ngOnInit(): void {
    this.load$.pipe(
      switchMap(() => {
        this.isLoading.set(true);
        this.loadError.set(null);
        return this.bookingService.getPlanning(this.dateFrom(), this.dateTo()).pipe(
          catchError(err => {
            // Solo lo stato HTTP: il corpo può contenere dati degli ospiti.
            console.error('Errore nel caricamento del calendario:', err?.status);
            this.loadError.set('Impossibile caricare il calendario');
            return EMPTY;
          }),
          finalize(() => this.isLoading.set(false))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(planning => this.planning.set(planning));

    // Un'azione nella scheda (annullamento, arrivo, incasso…) può cambiare le
    // barre: si ricarica la finestra, il pannello resta aperto.
    this.detail.updated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload());

    this.reload();
  }

  reload(): void {
    this.today.set(todayIso());
    this.load$.next();
  }

  // ------------------------------------------------------------------ //
  // Navigazione                                                         //
  // ------------------------------------------------------------------ //

  previous(): void {
    this.moveTo(addDaysIso(this.dateFrom(), -this.span()));
  }

  next(): void {
    this.moveTo(addDaysIso(this.dateFrom(), this.span()));
  }

  goToToday(): void {
    this.moveTo(windowStartFor(todayIso()));
  }

  /** Salto a una data: compare come seconda colonna, come oggi all'apertura. */
  onJumpDate(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) this.moveTo(windowStartFor(value));
  }

  setSpan(span: PlanningSpan): void {
    if (span === this.span()) return;
    this.span.set(span);
    this.reload();
  }

  isTodayShown(): boolean {
    return this.dateFrom() === windowStartFor(this.today());
  }

  private moveTo(dateFrom: string): void {
    if (dateFrom === this.dateFrom()) return;
    this.dateFrom.set(dateFrom);
    this.reload();
  }

  // ------------------------------------------------------------------ //
  // Pannello laterale                                                   //
  // ------------------------------------------------------------------ //

  onStayClick(click: PlanningStayClick): void {
    this.lastTrigger = click.trigger;
    this.drawer.set({kind: 'detail', stay: click.stay});
    this.detail.open(click.stay.booking_id);
    this.focusDrawer();
  }

  onCellClick(click: PlanningCellClick): void {
    this.lastTrigger = null;
    this.openCreate(click.room.id, click.date);
  }

  openCreate(roomId: string | null = null, checkIn: string | null = null, trigger?: HTMLElement): void {
    this.lastTrigger = trigger ?? this.lastTrigger;
    this.detail.close();
    this.drawer.set({kind: 'create', roomId, checkIn});
    this.focusDrawer();
  }

  closeDrawer(): void {
    if (!this.drawer()) return;
    this.drawer.set(null);
    this.detail.close();
    this.lastTrigger?.focus();
    this.lastTrigger = null;
  }

  /**
   * Esc chiude la scheda, ma non mentre è aperta una conferma dentro la
   * scheda: lì Esc torna ai pulsanti (lo gestisce `app-booking-detail`). Il
   * form di creazione si chiude solo con la sua «×», per non perdere un
   * modulo compilato con un tasto.
   */
  onDrawerEscape(event: Event): void {
    if (this.drawer()?.kind !== 'detail') return;
    if ((event.target as HTMLElement | null)?.closest('.action-confirm')) return;
    this.closeDrawer();
  }

  /** Dopo la creazione: tabellone ricaricato e scheda della nuova prenotazione aperta. */
  onBookingCreated(booking: BookingDetailSchema): void {
    const stay = new PlanningStaySchema({
      booking_id: booking.id,
      code: booking.code,
      room_id: booking.rooms[0]?.room_id ?? '',
      check_in: booking.check_in,
      check_out: booking.check_out,
      status: booking.status,
      payment_status: booking.payment_status,
      guest_name: `${booking.guest_firstname} ${booking.guest_lastname}`.trim(),
      guest_count: booking.guest_count,
      hold_expires_at: booking.hold_expires_at,
    });
    this.drawer.set({kind: 'detail', stay});
    this.detail.open(booking.id);
    this.reload();
  }

  onStatusChange(change: StatusChangeRequest): void {
    this.detail.changeStatus(change);
  }

  onPaymentChange(change: PaymentChangeRequest): void {
    this.detail.registerPayment(change);
  }

  /** Il focus va nel pannello appena è nel DOM: da tastiera si prosegue da lì. */
  private focusDrawer(): void {
    afterNextRender(() => this.drawerRef()?.nativeElement.focus(), {injector: this.injector});
  }
}
