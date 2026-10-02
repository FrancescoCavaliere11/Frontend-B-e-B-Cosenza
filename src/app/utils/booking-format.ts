/**
 * Formattazione di date di soggiorno e importi del modulo Booking.
 *
 * Tutte le funzioni lavorano sulle stringhe restituite dal backend senza
 * passare da `new Date('YYYY-MM-DD')`, che interpreta la data come mezzanotte
 * UTC e la mostra il giorno prima in qualunque fuso a ovest di Greenwich.
 */

/** Fuso della struttura: lo stesso di `today_in_app_timezone()` nel backend. */
export const APP_TIMEZONE = 'Europe/Rome';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data odierna nel fuso della struttura, come `YYYY-MM-DD`. */
export function todayIso(): string {
  // `en-CA` formatta nativamente come YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** `2026-12-01` → `01/12/2026`. Restituisce il valore invariato se non è una data. */
export function formatStayDate(value: string | null | undefined): string {
  if (!value) return '—';
  const match = ISO_DATE.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

const SHORT_MONTH = new Intl.DateTimeFormat('it-IT', {month: 'short', timeZone: 'UTC'});

/** `2026-10-10` → `{giorno: 10, mese: 'ott', anno: 2026}`, senza passare dal fuso locale. */
function splitIsoDate(value: string): { day: number; month: string; year: number } | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const utc = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return {day: +match[3], month: SHORT_MONTH.format(utc).replace('.', ''), year: +match[1]};
}

/**
 * Intervallo di soggiorno in forma breve.
 *
 * - stesso anno: `10 ott → 12 ott 2026`
 * - a cavallo d'anno: `28 dic 2026 → 2 gen 2027`
 */
export function formatStayRange(checkIn: string, checkOut: string): string {
  const from = splitIsoDate(checkIn);
  const to = splitIsoDate(checkOut);
  if (!from || !to) return `${formatStayDate(checkIn)} → ${formatStayDate(checkOut)}`;

  const start = from.year === to.year
    ? `${from.day} ${from.month}`
    : `${from.day} ${from.month} ${from.year}`;
  return `${start} → ${to.day} ${to.month} ${to.year}`;
}

/** Notti fra due date `YYYY-MM-DD` (la partenza è esclusa dal soggiorno). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = ISO_DATE.exec(checkIn);
  const b = ISO_DATE.exec(checkOut);
  if (!a || !b) return 0;
  const start = Date.UTC(+a[1], +a[2] - 1, +a[3]);
  const end = Date.UTC(+b[1], +b[2] - 1, +b[3]);
  return Math.round((end - start) / 86_400_000);
}

/** Istante ISO 8601 (UTC) → `01/12/2026, 14:30` nel fuso della struttura. */
export function formatInstant(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: APP_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

/**
 * Importo decimale in stringa → `€ 200,00`.
 * Solo presentazione: nessun calcolo viene fatto sul numero risultante.
 */
export function formatAmount(value: string | null | undefined, currency = 'EUR'): string {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return value;
  return new Intl.NumberFormat('it-IT', {style: 'currency', currency}).format(amount);
}
