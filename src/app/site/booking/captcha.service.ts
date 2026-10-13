import {Injectable, inject} from '@angular/core';
import {ScriptLoaderService} from '../services/script-loader.service';
import {EXTERNAL_SCRIPTS, PUBLIC_KEYS} from '../config/site.config';

/** Opzioni del widget usate dal sito (sottoinsieme dell'API di Turnstile). */
interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  'timeout-callback': () => void;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  appearance: 'always' | 'execute' | 'interaction-only';
  size: 'normal' | 'flexible' | 'compact';
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

/** Widget montato: il form lo azzera dopo ogni invio e lo rimuove all'uscita. */
export interface CaptchaWidget {
  /** Chiede un token nuovo: quello precedente vale una volta sola. */
  reset(): void;
  remove(): void;
}

/**
 * Cloudflare Turnstile, caricato solo nel passo dei dati. Senza chiave
 * pubblica non si carica nulla: il backend con `CAPTCHA_ENABLED=false`
 * accetta `captcha_token` nullo.
 *
 * Il widget resta invisibile finché Cloudflare non chiede un'interazione
 * (`interaction-only`): nella maggior parte dei casi l'ospite non vede nulla.
 */
@Injectable({providedIn: 'root'})
export class CaptchaService {
  private readonly scripts = inject(ScriptLoaderService);

  readonly isEnabled = PUBLIC_KEYS.turnstileSiteKey.length > 0;

  /**
   * Monta il widget in `container`.
   *
   * @param onToken riceve il token, oppure `null` quando non è più valido
   *   (scaduto, errore, sfida non completata in tempo).
   */
  async render(container: HTMLElement, onToken: (token: string | null) => void): Promise<CaptchaWidget> {
    await this.scripts.load(EXTERNAL_SCRIPTS.turnstile);
    const api = window.turnstile;
    if (!api) throw new Error('Turnstile non disponibile');

    const clear = (): void => onToken(null);
    const id = api.render(container, {
      sitekey: PUBLIC_KEYS.turnstileSiteKey,
      callback: token => onToken(token),
      'expired-callback': clear,
      'error-callback': clear,
      'timeout-callback': clear,
      theme: 'light',
      language: 'it',
      appearance: 'interaction-only',
      size: 'flexible',
    });

    return {
      reset: () => { clear(); api.reset(id); },
      remove: () => api.remove(id),
    };
  }
}
