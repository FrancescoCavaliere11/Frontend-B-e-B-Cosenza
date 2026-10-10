import {Component, computed, input, output} from '@angular/core';
import {PlanningRoomSchema, PlanningStaySchema} from '../../../schemas/booking-planning';
import {BOOKING_STATUS_LABELS, BOOKING_STATUS_TONES} from '../../../schemas/booking-enums';
import {formatStayDate, formatStayRange} from '../../../utils/booking-format';
import {formatLongDate} from '../../../utils/calendar-dates';
import {
  nightKey,
  occupiedNights,
  PlanningBar,
  planningBar,
  PlanningDay,
  planningDays,
} from '../../../utils/planning-layout';

/** Clic su una barra: la schermata apre la scheda e, alla chiusura, riporta lì il focus. */
export interface PlanningStayClick {
  stay: PlanningStaySchema;
  trigger: HTMLElement;
}

/** Clic su una notte libera: la schermata apre «Nuova prenotazione» già compilata. */
export interface PlanningCellClick {
  room: PlanningRoomSchema;
  date: string;
}

const MONTH_SHORT = new Intl.DateTimeFormat('it-IT', {month: 'short', timeZone: 'UTC'});
const WEEKDAY_SHORT = new Intl.DateTimeFormat('it-IT', {weekday: 'short', timeZone: 'UTC'});

/**
 * Tabellone camere × giorni. Solo presentazione: riceve camere e soggiorni,
 * emette i clic. La geometria sta in `utils/planning-layout.ts`.
 *
 * Accessibilità: ogni barra è un pulsante con una descrizione completa,
 * raggiungibile con Tab. Le celle libere si cliccano solo con il mouse —
 * centinaia di tappe del Tab renderebbero il tabellone inutilizzabile da
 * tastiera; per creare c'è il pulsante «Nuova prenotazione» in testata.
 */
@Component({
  selector: 'app-planning-grid',
  standalone: false,
  templateUrl: './planning-grid.html',
  styleUrls: [
    './planning-grid.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/stay-tones.css',
  ],
})
export class PlanningGrid {
  rooms = input<PlanningRoomSchema[]>([]);
  stays = input<PlanningStaySchema[]>([]);
  /** Finestra `[dateFrom, dateTo)`. */
  dateFrom = input.required<string>();
  dateTo = input.required<string>();
  today = input.required<string>();
  /** Barra della prenotazione aperta nel pannello, evidenziata. */
  selectedBookingId = input<string | null>(null);

  stayClick = output<PlanningStayClick>();
  cellClick = output<PlanningCellClick>();

  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly statusTones = BOOKING_STATUS_TONES;

  protected readonly days = computed<PlanningDay[]>(() =>
    planningDays(this.dateFrom(), this.dateTo(), this.today())
  );

  /**
   * Prima colonna per le camere, poi due mezze colonne per giorno: larghe
   * almeno quanto serve a leggere, e più larghe se lo schermo avanza spazio.
   */
  protected readonly gridColumns = computed(() =>
    `var(--planning-room-width) repeat(${this.days().length * 2}, minmax(var(--planning-half-day-width), 1fr))`
  );

  /** Larghezza minima: colonna camere più tutti i giorni alla loro larghezza minima. */
  protected readonly minWidth = computed(() =>
    `calc(var(--planning-room-width) + ${this.days().length} * var(--planning-day-width))`
  );

  /** Barre per camera, già posizionate. */
  private readonly barsByRoom = computed(() => {
    const byRoom = new Map<string, PlanningBar[]>();
    for (const stay of this.stays()) {
      const bar = planningBar(stay, this.dateFrom(), this.dateTo());
      if (!bar) continue;
      const bars = byRoom.get(stay.room_id) ?? [];
      bars.push(bar);
      byRoom.set(stay.room_id, bars);
    }
    return byRoom;
  });

  private readonly occupied = computed(() =>
    occupiedNights(this.stays(), this.dateFrom(), this.dateTo())
  );

  /** Il tabellone ha la classe del mese quando i giorni sono molti: colonne più strette. */
  protected readonly isWide = computed(() => this.days().length > 14);

  barsOf(room: PlanningRoomSchema): PlanningBar[] {
    return this.barsByRoom().get(room.id) ?? [];
  }

  /** Notte libera e camera in vendita: la cella si può cliccare per creare. */
  isFree(room: PlanningRoomSchema, date: string): boolean {
    return room.enabled && !this.occupied().has(nightKey(room.id, date));
  }

  /** Linee di griglia del giorno `index` (1-based, dopo la colonna camere). */
  dayColumn(index: number): string {
    const start = 2 + index * 2;
    return `${start} / ${start + 2}`;
  }

  monthLabel(date: string): string {
    return MONTH_SHORT.format(this.toUtc(date)).replace('.', '');
  }

  weekdayLabel(date: string): string {
    return WEEKDAY_SHORT.format(this.toUtc(date)).replace('.', '');
  }

  /** «Mario Rossi, camera 101, 12 ott → 15 ott 2026, Confermata». */
  barLabel(bar: PlanningBar, room: PlanningRoomSchema): string {
    const stay = bar.stay;
    return `${stay.guest_name}, camera ${room.number}, `
      + `${formatStayRange(stay.check_in, stay.check_out)}, ${this.statusLabels[stay.status]}`;
  }

  /** Suggerimento al passaggio del mouse: codice e ospiti in più rispetto alla barra. */
  barTitle(bar: PlanningBar, room: PlanningRoomSchema): string {
    const guests = bar.stay.guest_count === 1 ? '1 ospite' : `${bar.stay.guest_count} ospiti`;
    return `${this.barLabel(bar, room)} · ${bar.stay.code} · ${guests}`;
  }

  cellTitle(room: PlanningRoomSchema, date: string): string {
    return `Nuova prenotazione: camera ${room.number}, arrivo il ${formatStayDate(date)}`;
  }

  dayAriaLabel(date: string): string {
    return formatLongDate(date);
  }

  onBarClick(bar: PlanningBar, event: MouseEvent): void {
    this.stayClick.emit({stay: bar.stay, trigger: event.currentTarget as HTMLElement});
  }

  onCellClick(room: PlanningRoomSchema, date: string): void {
    if (this.isFree(room, date)) this.cellClick.emit({room, date});
  }

  private toUtc(date: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
}
