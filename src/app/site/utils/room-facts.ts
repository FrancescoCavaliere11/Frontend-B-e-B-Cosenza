import {RoomView} from '../models/site.models';
import {formatAmount} from '../../utils/booking-format';
import {UI} from '../i18n/it';

/** «fino a 2 ospiti · da 120,00 € a notte»: riga di sintesi di card e scheda. */
export function roomFacts(room: RoomView): string {
  return `${UI.common.upToGuests(room.capacity)} · ${UI.rooms.priceFrom(formatAmount(room.price))}`;
}
