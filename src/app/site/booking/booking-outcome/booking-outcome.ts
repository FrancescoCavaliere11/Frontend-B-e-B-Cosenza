import {Component, OnDestroy, OnInit, computed, inject, isDevMode, output, signal} from '@angular/core';
import {BookingFlowStore} from '../booking-flow.store';
import {SITE_ROUTES} from '../../config/navigation.config';
import {BOOKING_UI} from '../booking.copy';

const CLOCK_TICK_MS = 1000;

/**
 * Esito: «controlla l'email» con il tempo rimasto per confermare
 * (pagamento in struttura), oppure «pagamento ricevuto» (online).
 */
@Component({
  selector: 'site-booking-outcome',
  standalone: false,
  templateUrl: './booking-outcome.html',
  styleUrl: './booking-outcome.css',
})
export class BookingOutcome implements OnInit, OnDestroy {
  readonly finished = output<void>();

  protected readonly store = inject(BookingFlowStore);
  protected readonly ui = BOOKING_UI.done;
  protected readonly booking = computed(() => this.store.created()?.booking ?? null);
  /** Solo in sviluppo, con le email spente: link di conferma diretto. */
  protected readonly devConfirmLink = computed(() => {
    const token = this.store.created()?.confirmationToken;
    return isDevMode() && token ? {path: SITE_ROUTES.bookingConfirm, token} : null;
  });

  private readonly now = signal(Date.now());
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly holdLabel = computed(() => {
    const expires = this.booking()?.holdExpiresAt;
    if (!expires) return null;
    const remaining = Math.max(0, Date.parse(expires) - this.now());
    const minutes = Math.floor(remaining / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, '0');
    const time = new Intl.DateTimeFormat('it-IT', {hour: '2-digit', minute: '2-digit'}).format(new Date(expires));
    return `${time} (${minutes}:${seconds})`;
  });

  ngOnInit(): void {
    this.timer = setInterval(() => this.now.set(Date.now()), CLOCK_TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
