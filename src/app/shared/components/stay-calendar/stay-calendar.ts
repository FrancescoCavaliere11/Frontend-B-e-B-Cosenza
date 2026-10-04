import {Component, DestroyRef, ElementRef, OnInit, computed, inject, input, output, signal} from '@angular/core';
import {addDaysIso, todayIso} from '../../../utils/booking-format';
import {
  WEEKDAY_INITIALS,
  addMonthsIso,
  formatDayMonth,
  formatLongDate,
  formatMonthLabel,
  monthDays,
  monthStartIso,
  weekdayMondayFirst,
} from '../../../utils/calendar-dates';

/** Intervallo scelto: solo l'arrivo dopo il primo clic, entrambe le date dopo il secondo. */
export interface StayRange {
  checkIn: string | null;
  checkOut: string | null;
}

/** Finestra di date mostrata: `[from, to)`, come le notti chieste al backend. */
export interface VisibleRange {
  from: string;
  to: string;
}

/** Cella di un giorno, con tutto ciò che il template deve sapere. */
interface DayCell {
  date: string;
  day: number;
  isUnavailable: boolean;
  /** Barrato: notte occupata e giorno non sceglibile ora (non se è una partenza possibile o scelta). */
  showUnavailable: boolean;
  isStart: boolean;
  isEnd: boolean;
  isInRange: boolean;
  isToday: boolean;
  isSelectable: boolean;
  label: string;
}

interface MonthView {
  start: string;
  label: string;
  days: DayCell[];
  /** Settimane da lunedì a domenica; `null` per i giorni fuori dal mese. */
  weeks: Array<Array<DayCell | null>>;
}

/** Sotto questa larghezza si mostra un mese solo. */
const SINGLE_MONTH_QUERY = '(max-width: 576px)';

/**
 * Calendario per scegliere arrivo e partenza fra le notti libere.
 *
 * Solo presentazione: riceve le notti non disponibili e restituisce le date
 * scelte; non chiama il backend. Chi lo ospita ascolta `visibleRangeChange`
 * per caricare l'occupazione dei mesi mostrati.
 *
 * Si ragiona per **notti**: la notte del giorno `d` è quella fra `d` e
 * `d + 1`. Una notte non disponibile impedisce di arrivare quel giorno, ma
 * non di partire: il primo giorno occupato dopo l'arrivo è una partenza
 * valida.
 */
@Component({
  selector: 'app-stay-calendar',
  standalone: false,
  templateUrl: './stay-calendar.html',
  styleUrls: [
    './stay-calendar.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
  ],
})
export class StayCalendar implements OnInit {
  /** Notti non disponibili, `YYYY-MM-DD`. */
  unavailableNights = input<ReadonlySet<string>>(new Set<string>());
  checkIn = input<string | null>(null);
  checkOut = input<string | null>(null);
  /** Primo arrivo possibile (di norma oggi). */
  minDate = input<string>(todayIso());
  /** Ultimo arrivo possibile. */
  maxDate = input<string | null>(null);
  maxNights = input<number>(30);
  isLoading = input<boolean>(false);

  rangeChange = output<StayRange>();
  visibleRangeChange = output<VisibleRange>();

  protected readonly weekdays = WEEKDAY_INITIALS;

  /** Primo mese mostrato. */
  protected readonly firstMonth = signal<string>(monthStartIso(todayIso()));
  protected readonly monthsShown = signal<number>(2);
  /** Giorno che riceve il focus da tastiera (tabindex mobile). */
  protected readonly focusedDate = signal<string | null>(null);
  /**
   * Navigazione da tastiera in corso: il giorno col focus viene evidenziato.
   * Si spegne al primo clic del mouse, per non lasciare un riquadro sul
   * giorno appena cliccato.
   */
  protected readonly isKeyboardNavigating = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly today = todayIso();

  protected readonly months = computed<MonthView[]>(() =>
    Array.from({length: this.monthsShown()}, (_, index) => this.buildMonth(addMonthsIso(this.firstMonth(), index)))
  );

  /**
   * Ultima partenza possibile dato l'arrivo: il primo giorno con la notte
   * occupata (quella notte non serve a chi parte) oppure arrivo + notti
   * massime, il primo dei due. `null` se non si sta scegliendo la partenza.
   */
  protected readonly lastCheckOut = computed<{date: string; reason: 'occupied' | 'maxNights'} | null>(() => {
    const checkIn = this.checkIn();
    if (!checkIn || this.checkOut()) return null;

    const limit = addDaysIso(checkIn, this.maxNights());
    for (let night = checkIn; night < limit; night = addDaysIso(night, 1)) {
      if (this.unavailableNights().has(night)) return {date: night, reason: 'occupied'};
    }
    return {date: limit, reason: 'maxNights'};
  });

  /** Suggerimento mostrato mentre si sceglie la partenza. */
  protected readonly checkOutHint = computed<string | null>(() => {
    const last = this.lastCheckOut();
    if (!last) return null;
    const why = last.reason === 'occupied'
      ? `la notte del ${formatDayMonth(last.date)} è occupata`
      : `non sono previsti soggiorni oltre ${this.maxNights()} notti`;
    return `Scegli la partenza, al più tardi il ${formatDayMonth(last.date)}: ${why}. `
      + 'Per cambiare l\'arrivo clicca di nuovo sul giorno di arrivo.';
  });

  protected readonly canGoBack = computed(() => this.firstMonth() > monthStartIso(this.minDate()));
  protected readonly canGoForward = computed(() => {
    const max = this.maxDate();
    if (!max) return true;
    const lastShown = addMonthsIso(this.firstMonth(), this.monthsShown() - 1);
    return lastShown < monthStartIso(max);
  });

  ngOnInit(): void {
    const start = this.checkIn() ?? this.minDate();
    this.firstMonth.set(monthStartIso(start < this.minDate() ? this.minDate() : start));
    this.watchViewport();
    this.emitVisibleRange();
  }

  // ------------------------------------------------------------------ //
  // Navigazione fra i mesi                                              //
  // ------------------------------------------------------------------ //

  previousMonth(): void {
    if (!this.canGoBack()) return;
    this.firstMonth.update(month => addMonthsIso(month, -1));
    this.emitVisibleRange();
  }

  nextMonth(): void {
    if (!this.canGoForward()) return;
    this.firstMonth.update(month => addMonthsIso(month, 1));
    this.emitVisibleRange();
  }

  private emitVisibleRange(): void {
    this.visibleRangeChange.emit({
      from: this.firstMonth(),
      to: addMonthsIso(this.firstMonth(), this.monthsShown()),
    });
  }

  private watchViewport(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia(SINGLE_MONTH_QUERY);
    const apply = () => {
      const shown = query.matches ? 1 : 2;
      if (shown === this.monthsShown()) return;
      this.monthsShown.set(shown);
      this.emitVisibleRange();
    };
    this.monthsShown.set(query.matches ? 1 : 2);
    query.addEventListener('change', apply);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', apply));
  }

  // ------------------------------------------------------------------ //
  // Regole di selezione                                                 //
  // ------------------------------------------------------------------ //

  /** Si sta scegliendo la partenza: c'è l'arrivo e non ancora la partenza. */
  private isChoosingCheckOut(): boolean {
    return !!this.checkIn() && !this.checkOut();
  }

  /** Arrivo possibile: nei limiti e con la notte libera. */
  private isValidCheckIn(date: string): boolean {
    const max = this.maxDate();
    return date >= this.minDate()
      && (!max || date <= max)
      && !this.unavailableNights().has(date);
  }

  /**
   * Partenza possibile dato l'arrivo: dopo l'arrivo, entro il massimo di
   * notti, e senza notti occupate in mezzo. Il primo giorno occupato è
   * ammesso: quella notte non serve a chi parte.
   */
  private isValidCheckOut(date: string): boolean {
    const checkIn = this.checkIn();
    const last = this.lastCheckOut();
    return !!checkIn && !!last && date > checkIn && date <= last.date;
  }

  /**
   * Mentre si sceglie la partenza sono attivi solo: le partenze possibili,
   * il giorno di arrivo (per annullarlo) e i giorni precedenti liberi (per
   * anticiparlo). Ciò che sta oltre l'ultima partenza possibile è spento.
   */
  private isSelectable(date: string): boolean {
    if (!this.isChoosingCheckOut()) return this.isValidCheckIn(date);

    const checkIn = this.checkIn()!;
    return this.isValidCheckOut(date)
      || date === checkIn
      || (date < checkIn && this.isValidCheckIn(date));
  }

  /** Vero fra la pressione del mouse e il focus che ne deriva. */
  private isPointerDown = false;

  onPointerDown(): void {
    this.isPointerDown = true;
    this.isKeyboardNavigating.set(false);
    // Il focus causato dal clic arriva subito dopo; poi si torna allo stato normale.
    setTimeout(() => this.isPointerDown = false);
  }

  /** Focus su un giorno: arrivato con Tab (non col mouse), si evidenzia subito. */
  onDayFocus(date: string): void {
    this.focusedDate.set(date);
    if (!this.isPointerDown) this.isKeyboardNavigating.set(true);
  }

  /** Il giorno su cui si trova chi naviga da tastiera. */
  protected isKeyboardFocused(cell: DayCell): boolean {
    return this.isKeyboardNavigating() && this.focusedDate() === cell.date;
  }

  select(date: string): void {
    if (this.isLoading() || !this.isSelectable(date)) return;
    this.focusedDate.set(date);

    if (this.isChoosingCheckOut()) {
      if (date === this.checkIn()) {
        // Secondo clic sull'arrivo: si annulla e si ricomincia.
        this.rangeChange.emit({checkIn: null, checkOut: null});
      } else if (this.isValidCheckOut(date)) {
        this.rangeChange.emit({checkIn: this.checkIn(), checkOut: date});
      } else {
        this.rangeChange.emit({checkIn: date, checkOut: null});
      }
      return;
    }
    // Primo clic, oppure a selezione completa: quel giorno è il nuovo arrivo.
    this.rangeChange.emit({checkIn: date, checkOut: null});
  }

  // ------------------------------------------------------------------ //
  // Tastiera                                                            //
  // ------------------------------------------------------------------ //

  /**
   * Frecce: un giorno o una settimana. Pagina su/giù o Maiusc + ← / →: un mese.
   * Invio e spazio li gestisce il pulsante.
   */
  onKeydown(event: KeyboardEvent, date: string): void {
    const steps: Record<string, number> = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7};
    // Cambio di mese: Pagina su/giù, oppure Maiusc + ← / → (comodo sul Mac, dove
    // Pagina su/giù richiede fn + ↑ / ↓).
    const monthDelta =
      event.key === 'PageUp' || (event.shiftKey && event.key === 'ArrowLeft') ? -1
      : event.key === 'PageDown' || (event.shiftKey && event.key === 'ArrowRight') ? 1
      : 0;
    let target: string | null = null;

    if (monthDelta !== 0) {
      target = this.sameDayInMonth(date, monthDelta);
    } else if (event.key in steps) {
      target = addDaysIso(date, steps[event.key]);
    }
    if (!target) return;

    event.preventDefault();
    this.isKeyboardNavigating.set(true);
    this.moveFocus(target);
  }

  /** Stesso giorno del mese `delta` mesi più in là; l'ultimo del mese se non esiste (31 gen → 28 feb). */
  private sameDayInMonth(date: string, delta: number): string {
    const day = Number(date.slice(8, 10));
    const month = addMonthsIso(monthStartIso(date), delta);
    const lastDay = monthDays(month).length;
    return `${month.slice(0, 8)}${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }

  private moveFocus(date: string): void {
    const firstShown = this.firstMonth();
    const afterShown = addMonthsIso(firstShown, this.monthsShown());

    if (date < firstShown) {
      if (!this.canGoBack()) return;
      this.previousMonth();
    } else if (date >= afterShown) {
      if (!this.canGoForward()) return;
      this.nextMonth();
    }

    this.focusedDate.set(date);
    // Il pulsante del giorno esiste solo dopo il prossimo rendering.
    setTimeout(() => {
      this.host.nativeElement.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`)?.focus();
    });
  }

  /** Un solo giorno per volta è raggiungibile con Tab: quello col focus, o l'arrivo, o il primo libero. */
  protected tabIndexFor(cell: DayCell, month: MonthView, monthIndex: number): number {
    const focused = this.focusedDate() ?? this.checkIn();
    const isVisible = (date: string) =>
      date >= this.firstMonth() && date < addMonthsIso(this.firstMonth(), this.monthsShown());
    if (focused && isVisible(focused)) return cell.date === focused ? 0 : -1;
    const firstSelectable = month.days.find(day => day.isSelectable);
    return monthIndex === 0 && firstSelectable?.date === cell.date ? 0 : -1;
  }

  // ------------------------------------------------------------------ //
  // Costruzione dei mesi                                                //
  // ------------------------------------------------------------------ //

  private buildMonth(start: string): MonthView {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    const unavailable = this.unavailableNights();

    const days = monthDays(start).map<DayCell>(date => {
      const isStart = date === checkIn;
      const isEnd = date === checkOut;
      const isInRange = !!checkIn && !!checkOut && date > checkIn && date < checkOut;
      const isUnavailable = unavailable.has(date);
      const isSelectable = this.isSelectable(date);

      return {
        date,
        day: Number(date.slice(8, 10)),
        isUnavailable,
        showUnavailable: isUnavailable && !isSelectable && !isEnd,
        isStart,
        isEnd,
        isInRange,
        isToday: date === this.today,
        isSelectable,
        label: this.describe(date, {isStart, isEnd, isInRange, isUnavailable, isSelectable}),
      };
    });

    const cells: Array<DayCell | null> = [
      ...Array.from({length: weekdayMondayFirst(start)}, () => null),
      ...days,
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = Array.from({length: cells.length / 7}, (_, week) => cells.slice(week * 7, week * 7 + 7));

    return {start, label: formatMonthLabel(start), days, weeks};
  }

  /** Etichetta letta dagli screen reader: data per esteso e stato. */
  private describe(
    date: string,
    state: Pick<DayCell, 'isStart' | 'isEnd' | 'isInRange' | 'isUnavailable' | 'isSelectable'>
  ): string {
    const parts = [formatLongDate(date)];
    if (state.isStart) parts.push(this.isChoosingCheckOut() ? 'arrivo, premi per annullarlo' : 'arrivo');
    if (state.isEnd) parts.push('partenza');
    if (state.isInRange) parts.push('nel soggiorno');
    if (state.isUnavailable) {
      parts.push(state.isSelectable ? 'notte non disponibile, possibile come partenza' : 'non disponibile');
    } else if (!state.isSelectable && !state.isStart && !state.isEnd) {
      parts.push('non selezionabile');
    }
    return parts.join(', ');
  }
}
