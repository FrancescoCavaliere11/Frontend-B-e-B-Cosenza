/**
 * Aritmetica di calendario su date `YYYY-MM-DD`.
 *
 * Come in `booking-format.ts`, tutto passa da `Date.UTC`: nessun fuso orario
 * può spostare una data di un giorno. Le stringhe `YYYY-MM-DD` si confrontano
 * correttamente anche come testo (`'2026-11-05' < '2026-11-12'`).
 */
import {addDaysIso} from './booking-format';

const LOCALE = 'it-IT';

function toUtc(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Primo giorno del mese di una data: `2026-11-17` → `2026-11-01`. */
export function monthStartIso(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

/** Sposta un primo-del-mese di `months` mesi: `2026-12-01`, +1 → `2027-01-01`. */
export function addMonthsIso(monthStart: string, months: number): string {
  const date = toUtc(monthStart);
  return toIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)));
}

/** Giorni del mese di `monthStart`. */
export function daysInMonth(monthStart: string): number {
  const date = toUtc(monthStart);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

/** Giorno della settimana con il lunedì come primo: lunedì 0, domenica 6. */
export function weekdayMondayFirst(value: string): number {
  return (toUtc(value).getUTCDay() + 6) % 7;
}

/** Tutte le date del mese, in ordine. */
export function monthDays(monthStart: string): string[] {
  return Array.from({length: daysInMonth(monthStart)}, (_, index) => addDaysIso(monthStart, index));
}

const MONTH_LABEL = new Intl.DateTimeFormat(LOCALE, {month: 'long', year: 'numeric', timeZone: 'UTC'});
const LONG_DATE = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

const DAY_MONTH = new Intl.DateTimeFormat(LOCALE, {day: 'numeric', month: 'long', timeZone: 'UTC'});

/** `2026-11-12` → `12 novembre`. */
export function formatDayMonth(value: string): string {
  return DAY_MONTH.format(toUtc(value));
}

/** `2026-11-01` → `novembre 2026`. */
export function formatMonthLabel(monthStart: string): string {
  return MONTH_LABEL.format(toUtc(monthStart));
}

/** `2026-11-12` → `giovedì 12 novembre 2026`, per le etichette lette dagli screen reader. */
export function formatLongDate(value: string): string {
  return LONG_DATE.format(toUtc(value));
}

/** Iniziali dei giorni, dal lunedì. */
export const WEEKDAY_INITIALS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'] as const;
