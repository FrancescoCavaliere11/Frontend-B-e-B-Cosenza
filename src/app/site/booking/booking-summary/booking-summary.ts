import {Component, computed, inject} from '@angular/core';
import {BookingFlowStore} from '../booking-flow.store';
import {StripeService} from '../stripe.service';
import {PaymentOption} from '../../../schemas/booking-enums';
import {BOOKING_RULES} from '../../../schemas/booking-schema';
import {formatAmount, formatStayRange} from '../../../utils/booking-format';
import {BOOKING_UI} from '../booking.copy';
import {UI} from '../../i18n/it';

/** Passo 2: righe del preventivo, modo di pagamento, totale. */
@Component({
  selector: 'site-booking-summary',
  standalone: false,
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.css',
})
export class BookingSummary {
  protected readonly store = inject(BookingFlowStore);
  protected readonly ui = BOOKING_UI.summary;
  protected readonly search = BOOKING_UI.search;
  protected readonly options = PaymentOption;
  protected readonly discountPercent = BOOKING_RULES.PAY_NOW_DISCOUNT_PERCENT;
  /** Senza chiave pubblica Stripe il pagamento online non si offre. */
  protected readonly canPayOnline = inject(StripeService).isEnabled;
  protected readonly formatAmount = formatAmount;
  protected readonly back = UI.common.back;

  protected readonly stay = computed(() => {
    const quote = this.store.quote();
    return quote ? formatStayRange(quote.checkIn, quote.checkOut) : '';
  });

  protected readonly hasDiscount = computed(() => Number(this.store.quote()?.discountAmount ?? 0) > 0);
}
