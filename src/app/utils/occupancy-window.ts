import {BOOKING_RULES} from '../schemas/booking-schema';
import {VisibleRange} from '../shared/components/stay-calendar/stay-calendar';
import {addDaysIso} from './booking-format';

/**
 * Finestra da chiedere a `GET /bookings/occupancy` partendo dai mesi mostrati
 * dal calendario.
 *
 * Il calendario mostra mesi interi, quindi parte dal giorno 1 anche quando
 * oggi è il 14: il backend rifiuta con `422` un periodo che inizia nel passato
 * (`validate_occupancy_window`) o va oltre l'ultimo giorno prenotabile. Due
 * mesi stanno sempre sotto il limite di 92 giorni.
 *
 * Condivisa dal back-office e dal sito: prima esisteva solo nel back-office, e
 * il sito chiedeva il mese corrente dal giorno 1 ricevendo sempre `422`.
 *
 * @return la finestra ritagliata, o `null` se non resta nulla da chiedere.
 */
export function occupancyWindowOf(visible: VisibleRange, today: string): VisibleRange | null {
  const lastDay = addDaysIso(today, BOOKING_RULES.MAX_ADVANCE_DAYS + BOOKING_RULES.MAX_NIGHTS);
  const from = visible.from < today ? today : visible.from;
  const to = visible.to > lastDay ? lastDay : visible.to;
  return to > from ? {from, to} : null;
}
