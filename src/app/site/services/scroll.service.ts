import {DOCUMENT, Injectable, NgZone, inject, signal} from '@angular/core';

export type ScrollDirection = 'up' | 'down';

/** Pixel di scroll oltre i quali la pagina si considera «scorsa». */
const SCROLLED_THRESHOLD = 1;
/** Movimento minimo per cambiare direzione: evita tremolii. */
const DIRECTION_THRESHOLD = 10;

/**
 * Posizione e direzione dello scroll come signal.
 * Un solo listener passivo, aggiornato una volta per frame.
 */
@Injectable({providedIn: 'root'})
export class ScrollService {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly zone = inject(NgZone);

  readonly y = signal(0);
  readonly direction = signal<ScrollDirection>('up');
  readonly hasScrolled = signal(false);

  private lastY = 0;
  private frame = 0;
  private listening = false;

  private readonly onScroll = (): void => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  };

  start(): void {
    if (this.listening || !this.window) return;
    this.listening = true;
    this.zone.runOutsideAngular(() => this.window!.addEventListener('scroll', this.onScroll, {passive: true}));
    this.update();
  }

  stop(): void {
    if (!this.listening || !this.window) return;
    this.window.removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.listening = false;
  }

  /** Torna in cima senza animazione (cambio pagina). */
  toTop(): void {
    this.window?.scrollTo({top: 0, left: 0, behavior: 'instant'});
    this.lastY = 0;
    this.update();
  }

  private update(): void {
    const y = Math.max(0, this.window?.scrollY ?? 0);
    this.y.set(y);
    this.hasScrolled.set(y > SCROLLED_THRESHOLD);
    if (Math.abs(y - this.lastY) >= DIRECTION_THRESHOLD) {
      this.direction.set(y > this.lastY ? 'down' : 'up');
      this.lastY = y;
    }
  }
}
