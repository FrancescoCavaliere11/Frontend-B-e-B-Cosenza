import {Injectable, inject} from '@angular/core';
import {ScriptLoaderService} from '../services/script-loader.service';
import {EXTERNAL_SCRIPTS, PUBLIC_KEYS} from '../config/site.config';

/** Sottoinsieme di Stripe.js usato qui (Payment Element). */
export interface StripeElement { mount(target: HTMLElement): void; destroy(): void; }
export interface StripeElements { create(type: 'payment', options?: Record<string, unknown>): StripeElement; }
export interface StripeConfirmResult { error?: {message?: string}; paymentIntent?: {status: string}; }
export interface StripeClient {
  elements(options: {clientSecret: string; appearance?: Record<string, unknown>; locale?: string}): StripeElements;
  confirmPayment(options: {elements: StripeElements; redirect: 'if_required'; confirmParams: {return_url: string}}): Promise<StripeConfirmResult>;
}

declare global {
  interface Window { Stripe?: (publishableKey: string) => StripeClient; }
}

/**
 * Stripe.js caricato dal dominio di Stripe al momento del pagamento
 * (è il modo raccomandato: i dati della carta restano in un iframe Stripe).
 */
@Injectable({providedIn: 'root'})
export class StripeService {
  private readonly scripts = inject(ScriptLoaderService);
  private client: StripeClient | null = null;

  readonly isEnabled = PUBLIC_KEYS.stripePublishableKey.length > 0;

  async load(): Promise<StripeClient> {
    if (this.client) return this.client;
    await this.scripts.load(EXTERNAL_SCRIPTS.stripe);
    if (!window.Stripe) throw new Error('Stripe.js non disponibile');
    this.client = window.Stripe(PUBLIC_KEYS.stripePublishableKey);
    return this.client;
  }
}
