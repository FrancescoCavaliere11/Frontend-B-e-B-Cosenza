import {Component, DOCUMENT, ElementRef, OnDestroy, OnInit, inject, signal, viewChild} from '@angular/core';
import {BookingFlowStore} from '../booking-flow.store';
import {GuestBookingService} from '../../http/guest-booking.service';
import {StripeElement, StripeElements, StripeClient, StripeService} from '../stripe.service';
import {toSiteError} from '../../http/site-error';
import {formatAmount} from '../../../utils/booking-format';
import {SITE_ROUTES} from '../../config/navigation.config';
import {BOOKING_UI} from '../booking.copy';

type PaymentState = 'loading' | 'ready' | 'paying' | 'unavailable' | 'error';

/**
 * Passo 4 per il pagamento online: Payment Element di Stripe.
 * L'importo arriva dal backend (`/payments/intent`), mai dal client; la
 * conferma vera della prenotazione la fa il webhook (`payment_api.md` §1).
 */
@Component({
  selector: 'site-booking-payment',
  standalone: false,
  templateUrl: './booking-payment.html',
  styleUrl: './booking-payment.css',
})
export class BookingPayment implements OnInit, OnDestroy {
  protected readonly store = inject(BookingFlowStore);
  protected readonly ui = BOOKING_UI.payment;
  protected readonly state = signal<PaymentState>('loading');
  protected readonly amount = signal('');
  protected readonly message = signal<string | null>(null);

  private readonly api = inject(GuestBookingService);
  private readonly stripeService = inject(StripeService);
  private readonly document = inject(DOCUMENT);
  private readonly host = viewChild<ElementRef<HTMLElement>>('element');
  private stripe: StripeClient | null = null;
  private elements: StripeElements | null = null;
  private element: StripeElement | null = null;

  ngOnInit(): void {
    const booking = this.store.created()?.booking;
    if (!booking || !this.stripeService.isEnabled) {
      this.state.set('unavailable');
      return;
    }
    this.api.paymentIntent(booking.code, this.store.guestEmail()).subscribe({
      next: intent => {
        this.amount.set(formatAmount(intent.amount, intent.currency.toUpperCase()));
        this.mount(intent.clientSecret).catch(() => this.state.set('unavailable'));
      },
      error: error => {
        this.message.set(toSiteError(error).message);
        this.state.set('error');
      },
    });
  }

  ngOnDestroy(): void {
    this.element?.destroy();
  }

  protected async pay(): Promise<void> {
    if (!this.stripe || !this.elements || this.state() !== 'ready') return;
    this.state.set('paying');
    this.message.set(null);
    const code = this.store.created()?.booking.code ?? '';
    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required',
      confirmParams: {return_url: `${this.document.location.origin}${SITE_ROUTES.bookingLookup}?codice=${encodeURIComponent(code)}`},
    });
    if (result.error) {
      this.message.set(result.error.message ?? this.ui.failed);
      this.state.set('ready');
      return;
    }
    this.store.markPaid();
  }

  private async mount(clientSecret: string): Promise<void> {
    this.stripe = await this.stripeService.load();
    const styles = getComputedStyle(this.document.documentElement);
    this.elements = this.stripe.elements({
      clientSecret,
      locale: 'it',
      appearance: {
        theme: 'flat',
        variables: {
          colorPrimary: styles.getPropertyValue('--color-primary').trim(),
          colorText: styles.getPropertyValue('--color-espresso').trim(),
          colorBackground: styles.getPropertyValue('--color-white').trim(),
          borderRadius: styles.getPropertyValue('--radius-xs').trim(),
        },
      },
    });
    this.element = this.elements.create('payment');
    const host = this.host()?.nativeElement;
    if (!host) throw new Error('Contenitore del pagamento assente');
    this.element.mount(host);
    this.state.set('ready');
  }
}
