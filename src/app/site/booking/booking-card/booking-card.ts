import {Component, computed, inject, input} from '@angular/core';
import {PublicBooking} from '../../models/booking-public.models';
import {formatAmount, formatInstant, formatStayRange} from '../../../utils/booking-format';
import {BookingStatus, PAYMENT_OPTION_LABELS} from '../../../schemas/booking-enums';
import {BookingPanelService} from '../../services/booking-panel.service';
import {BOOKING_UI} from '../booking.copy';

/** Riepilogo di una prenotazione esistente (esito, conferma, gestione, consulta). */
@Component({
  selector: 'site-booking-card',
  standalone: false,
  templateUrl: './booking-card.html',
  styleUrl: './booking-card.css',
})
export class BookingCard {
  readonly booking = input.required<PublicBooking>();
  readonly freeUntil = input<string | null>(null);
  /** Sostituisce l'etichetta dello stato. */
  readonly statusLabel = input<string | null>(null);

  protected readonly ui = BOOKING_UI;
  protected readonly bookingPanel = inject(BookingPanelService);
  protected readonly isCancelled = computed(() => this.booking().status === BookingStatus.CANCELLED);
  protected readonly isExpired = computed(() => this.booking().status === BookingStatus.EXPIRED);
  protected readonly formatAmount = formatAmount;
  protected readonly stay = computed(() => formatStayRange(this.booking().checkIn, this.booking().checkOut));
  protected readonly rooms = computed(() => this.booking().rooms.map(room => room.roomName).join(', '));
  protected readonly payment = computed(() => PAYMENT_OPTION_LABELS[this.booking().paymentOption]);
  protected readonly status = computed(() => this.statusLabel() ?? BOOKING_UI.status[this.booking().status]);
  /** Il termine di cancellazione ha senso solo per una prenotazione ancora attiva. */
  protected readonly freeUntilLabel = computed(() => {
    if (this.isCancelled() || this.isExpired()) return null;
    const value = this.freeUntil() ?? this.booking().cancellationDeadline;
    return value ? formatInstant(value) : null;
  });
}
