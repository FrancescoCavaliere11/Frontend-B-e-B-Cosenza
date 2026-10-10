/**
 * Geometria del tabellone: giorni della finestra, posizione delle barre,
 * notti occupate e riepilogo della giornata.
 *
 * Funzioni pure, senza Angular: il componente si limita a disegnare ciò che
 * calcolano qui. Le date sono stringhe `YYYY-MM-DD`, che si confrontano
 * correttamente anche come testo; l'aritmetica passa da `addDaysIso` e
 * `nightsBetween`, che lavorano in UTC (nessun fuso sposta un giorno).
 *
 * **Mezze giornate.** Ogni giorno occupa due colonne della griglia: la barra
 * di un soggiorno parte a metà del giorno di arrivo e finisce a metà di quello
 * di partenza, come nei planning alberghieri. Così una partenza e un arrivo
 * nello stesso giorno si vedono entrambi, uno accanto all'altro.
 */
import {addDaysIso, nightsBetween} from './booking-format';
import {weekdayMondayFirst} from './calendar-dates';
import {BookingStatus} from '../schemas/booking-enums';
import {PlanningRoomSchema, PlanningStaySchema} from '../schemas/booking-planning';

/** Ampiezze della finestra offerte dal tabellone. */
export type PlanningSpan = 14 | 31;

/** Giorni prima di oggi con cui si apre il tabellone: si vedono anche le partenze di stamattina. */
export const PLANNING_DAYS_BEFORE_TODAY = 1;

/** Stati temporanei: la barra è tratteggiata. */
const PENDING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.PENDING_CONFIRMATION,
  BookingStatus.PENDING_PAYMENT,
]);

export interface PlanningDay {
  date: string;
  /** Giorno del mese, per l'intestazione. */
  day: number;
  isWeekend: boolean;
  isToday: boolean;
  /** Primo giorno del mese o prima colonna: l'intestazione mostra anche il mese. */
  showsMonth: boolean;
}

export interface PlanningBar {
  stay: PlanningStaySchema;
  /** Linee di griglia (1-based), già spostate oltre la colonna delle camere. */
  columnStart: number;
  columnEnd: number;
  /** Il soggiorno comincia prima della finestra / finisce dopo. */
  clippedStart: boolean;
  clippedEnd: boolean;
  isPending: boolean;
}

export interface PlanningTodaySummary {
  arrivals: number;
  departures: number;
  occupiedRooms: number;
  totalRooms: number;
}

/** Fine (esclusa) di una finestra che parte da `from` e dura `span` giorni. */
export function windowEnd(from: string, span: number): string {
  return addDaysIso(from, span);
}

/** Inizio della finestra che mostra `date` come seconda colonna (vedi `PLANNING_DAYS_BEFORE_TODAY`). */
export function windowStartFor(date: string): string {
  return addDaysIso(date, -PLANNING_DAYS_BEFORE_TODAY);
}

/** Giorni della finestra `[from, to)`, con quanto serve all'intestazione. */
export function planningDays(from: string, to: string, today: string): PlanningDay[] {
  const count = nightsBetween(from, to);
  return Array.from({length: Math.max(count, 0)}, (_, index) => {
    const date = addDaysIso(from, index);
    const day = Number(date.slice(8, 10));
    return {
      date,
      day,
      isWeekend: weekdayMondayFirst(date) >= 5,
      isToday: date === today,
      showsMonth: index === 0 || day === 1,
    };
  });
}

/**
 * Posizione della barra di un soggiorno nella finestra `[from, to)`.
 *
 * Mezze colonne, contate da 0: l'arrivo del giorno `i` comincia alla mezza
 * colonna `2i + 1`, la partenza del giorno `j` finisce alla stessa `2j + 1`.
 * Ciò che sporge viene tagliato ai bordi e segnalato.
 *
 * `firstDayColumn` è la linea di griglia (1-based) del primo giorno: dopo la
 * colonna delle camere, è 2.
 */
export function planningBar(
  stay: PlanningStaySchema,
  from: string,
  to: string,
  firstDayColumn = 2,
): PlanningBar | null {
  const days = nightsBetween(from, to);
  const halves = days * 2;
  const start = nightsBetween(from, stay.check_in) * 2 + 1;
  const end = nightsBetween(from, stay.check_out) * 2 + 1;

  const visibleStart = Math.max(start, 0);
  const visibleEnd = Math.min(end, halves);
  if (visibleEnd <= visibleStart) return null;

  return {
    stay,
    columnStart: firstDayColumn + visibleStart,
    columnEnd: firstDayColumn + visibleEnd,
    clippedStart: start < 0,
    clippedEnd: end > halves,
    isPending: PENDING_STATUSES.has(stay.status),
  };
}

/** Chiave di una notte di una camera, per `occupiedNights`. */
export function nightKey(roomId: string, date: string): string {
  return `${roomId}|${date}`;
}

/**
 * Notti occupate nella finestra, per camera: la notte del giorno `d` è presa
 * se un soggiorno ha `check_in <= d < check_out`. Le celle libere si possono
 * cliccare per creare una prenotazione.
 */
export function occupiedNights(stays: PlanningStaySchema[], from: string, to: string): ReadonlySet<string> {
  const nights = new Set<string>();
  for (const stay of stays) {
    let date = stay.check_in > from ? stay.check_in : from;
    while (date < stay.check_out && date < to) {
      nights.add(nightKey(stay.room_id, date));
      date = addDaysIso(date, 1);
    }
  }
  return nights;
}

/**
 * Riepilogo di oggi, dai dati già caricati: arrivi e partenze contano le
 * **prenotazioni** (una su due camere vale uno), le camere occupate stanotte
 * le camere. Valido solo se la finestra contiene ieri e oggi: altrimenti le
 * partenze di oggi non sarebbero fra i soggiorni ricevuti, e il riepilogo
 * mentirebbe. In quel caso `null`.
 */
export function todaySummary(
  stays: PlanningStaySchema[],
  rooms: PlanningRoomSchema[],
  from: string,
  to: string,
  today: string,
): PlanningTodaySummary | null {
  if (!(from < today && today < to)) return null;

  const arrivals = new Set<string>();
  const departures = new Set<string>();
  const occupied = new Set<string>();
  for (const stay of stays) {
    if (stay.check_in === today) arrivals.add(stay.booking_id);
    if (stay.check_out === today) departures.add(stay.booking_id);
    if (stay.check_in <= today && today < stay.check_out) occupied.add(stay.room_id);
  }

  return {
    arrivals: arrivals.size,
    departures: departures.size,
    occupiedRooms: occupied.size,
    totalRooms: rooms.filter(room => room.enabled).length,
  };
}
