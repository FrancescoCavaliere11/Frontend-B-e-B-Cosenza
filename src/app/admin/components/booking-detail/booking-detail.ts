import {Component, computed, input, output} from '@angular/core';
import {Cancel01Icon} from '@hugeicons/core-free-icons';
import {BookingDetailSchema, BookingStatusHistorySchema} from '../../../schemas/booking-schema';
import {
  AUDIT_ACTOR_LABELS,
  BOOKING_CHANNEL_LABELS,
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_TONES,
  BookingStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_OPTION_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  visiblePaymentStatus,
} from '../../../schemas/booking-enums';
import {formatAmount, formatInstant, formatStayDate} from '../../../utils/booking-format';

/** Stati in cui la prenotazione occupa ancora le camere in modo provvisorio. */
const PENDING_STATUSES: ReadonlySet<BookingStatus> = new Set([
  BookingStatus.PENDING_CONFIRMATION,
  BookingStatus.PENDING_PAYMENT,
]);

/** Stati in cui ha ancora senso la scadenza dell'annullamento gratuito. */
const CANCELLABLE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  ...PENDING_STATUSES,
  BookingStatus.CONFIRMED,
]);

/** Riga «etichetta → valore» della sezione date. */
interface KeyDate {
  label: string;
  value: string;
}

/**
 * Scheda di dettaglio di una prenotazione, mostrata dentro la riga aperta
 * dell'elenco.
 *
 * Solo presentazione: non chiama il backend. Caricamento, errore e nuovo
 * tentativo li governa la schermata che la ospita, così la stessa scheda
 * potrà essere riusata dalle azioni degli incrementi successivi.
 */
@Component({
  selector: 'app-booking-detail',
  standalone: false,
  templateUrl: './booking-detail.html',
  styleUrls: [
    './booking-detail.css',
    '../../../../styles.css',
    '../../../../../public/css/typography.css',
    '../../../../../public/css/form.css',
    '../../../../../public/css/badge.css',
  ],
})
export class BookingDetail {
  /** Intestazione disponibile subito, dalla riga dell'elenco. */
  headline = input<string>('');
  code = input<string>('');

  booking = input<BookingDetailSchema | null>(null);
  isLoading = input<boolean>(false);
  error = input<string | null>(null);

  close = output<void>();
  retry = output<void>();

  protected readonly Cancel01Icon = Cancel01Icon;
  protected readonly statusLabels = BOOKING_STATUS_LABELS;
  protected readonly statusTones = BOOKING_STATUS_TONES;
  protected readonly paymentLabels = PAYMENT_STATUS_LABELS;
  protected readonly paymentTones = PAYMENT_STATUS_TONES;
  protected readonly paymentOptionLabels = PAYMENT_OPTION_LABELS;
  protected readonly paymentMethodLabels = PAYMENT_METHOD_LABELS;
  protected readonly channelLabels = BOOKING_CHANNEL_LABELS;
  protected readonly actorLabels = AUDIT_ACTOR_LABELS;
  protected readonly formatAmount = formatAmount;
  protected readonly formatInstant = formatInstant;
  protected readonly formatStayDate = formatStayDate;

  /** Badge del pagamento, o `null` se va nascosto (vedi `visiblePaymentStatus`). */
  protected readonly paymentBadge = computed(() => {
    const booking = this.booking();
    return booking ? visiblePaymentStatus(booking.status, booking.payment_status) : null;
  });

  protected readonly hasDiscount = computed(() => Number(this.booking()?.discount_amount ?? 0) > 0);

  /** Solo le date valorizzate e pertinenti allo stato attuale. */
  protected readonly keyDates = computed<KeyDate[]>(() => {
    const booking = this.booking();
    if (!booking) return [];

    const dates: Array<KeyDate | null> = [
      {label: 'Creata il', value: formatInstant(booking.created_at)},
      booking.confirmed_at
        ? {label: 'Confermata il', value: formatInstant(booking.confirmed_at)}
        : null,
      booking.hold_expires_at && PENDING_STATUSES.has(booking.status)
        ? {label: 'Blocco fino a', value: formatInstant(booking.hold_expires_at)}
        : null,
      booking.hold_expires_at && booking.status === BookingStatus.EXPIRED
        ? {label: 'Scaduta il', value: formatInstant(booking.hold_expires_at)}
        : null,
      booking.cancellation_deadline && CANCELLABLE_STATUSES.has(booking.status)
        ? {label: 'Annullabile gratis fino a', value: formatInstant(booking.cancellation_deadline)}
        : null,
      booking.cancelled_at
        ? {label: 'Annullata il', value: formatInstant(booking.cancelled_at)}
        : null,
    ];
    return dates.filter((date): date is KeyDate => date !== null);
  });

  protected guestName(booking: BookingDetailSchema): string {
    return [booking.guest_firstname, booking.guest_lastname].filter(Boolean).join(' ');
  }

  /** `tel:` senza spazi, che alcuni dispositivi non accettano. */
  protected phoneHref(phone: string): string {
    return `tel:${phone.replace(/\s+/g, '')}`;
  }

  /** «Creata» per la prima voce, altrimenti lo stato di partenza. */
  protected historyFrom(entry: BookingStatusHistorySchema): string {
    return entry.from_status ? this.statusLabels[entry.from_status] : 'Creata';
  }
}
