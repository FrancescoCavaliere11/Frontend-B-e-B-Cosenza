import {DOCUMENT, Injectable, inject} from '@angular/core';

/**
 * Carica uno script esterno una sola volta (Stripe.js, Turnstile).
 * Gli script di terze parti entrano solo nel passo che li usa.
 */
@Injectable({providedIn: 'root'})
export class ScriptLoaderService {
  private readonly document = inject(DOCUMENT);
  private readonly pending = new Map<string, Promise<void>>();

  load(src: string): Promise<void> {
    const existing = this.pending.get(src);
    if (existing) return existing;

    const promise = new Promise<void>((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.pending.delete(src);
        script.remove();
        reject(new Error(`Impossibile caricare ${src}`));
      };
      this.document.head.appendChild(script);
    });
    this.pending.set(src, promise);
    return promise;
  }
}
