import {Injectable, inject} from '@angular/core';
import {ScriptLoaderService} from '../services/script-loader.service';
import {EXTERNAL_SCRIPTS, PUBLIC_KEYS} from '../config/site.config';

interface TurnstileApi {
  render(container: HTMLElement, options: {sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void; theme?: string}): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

/**
 * Cloudflare Turnstile, caricato solo nel passo dei dati. Senza chiave
 * pubblica non si carica nulla: il backend con `CAPTCHA_ENABLED=false`
 * accetta `captcha_token` nullo.
 */
@Injectable({providedIn: 'root'})
export class CaptchaService {
  private readonly scripts = inject(ScriptLoaderService);

  readonly isEnabled = PUBLIC_KEYS.turnstileSiteKey.length > 0;

  async render(container: HTMLElement, onToken: (token: string | null) => void): Promise<() => void> {
    if (!this.isEnabled) return () => undefined;
    await this.scripts.load(EXTERNAL_SCRIPTS.turnstile);
    const api = window.turnstile;
    if (!api) throw new Error('Turnstile non disponibile');
    const id = api.render(container, {
      sitekey: PUBLIC_KEYS.turnstileSiteKey,
      callback: token => onToken(token),
      'expired-callback': () => onToken(null),
      theme: 'light',
    });
    return () => api.remove(id);
  }
}
