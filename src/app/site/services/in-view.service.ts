import {Injectable, NgZone, inject} from '@angular/core';

export type InViewCallback = (isIntersecting: boolean) => void;

interface SharedObserver {
  observer: IntersectionObserver;
  /** Più callback per elemento: tema e comparsa possono osservare lo stesso nodo. */
  callbacks: Map<Element, Set<InViewCallback>>;
}

/**
 * IntersectionObserver condivisi: uno per configurazione, non uno per
 * elemento. Le callback girano fuori da Angular; chi aggiorna signal o
 * classi del DOM non ha bisogno di altro.
 */
@Injectable({providedIn: 'root'})
export class InViewService {
  private readonly zone = inject(NgZone);
  private readonly shared = new Map<string, SharedObserver>();

  observe(element: Element, callback: InViewCallback, rootMargin = '0px 0px -10% 0px', threshold = 0): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      callback(true);
      return () => undefined;
    }
    const {observer, callbacks} = this.sharedFor(rootMargin, threshold);
    const forElement = callbacks.get(element) ?? new Set<InViewCallback>();
    if (!forElement.size) observer.observe(element);
    forElement.add(callback);
    callbacks.set(element, forElement);

    return () => {
      forElement.delete(callback);
      if (forElement.size) return;
      callbacks.delete(element);
      observer.unobserve(element);
    };
  }

  private sharedFor(rootMargin: string, threshold: number): SharedObserver {
    const key = `${rootMargin}|${threshold}`;
    let shared = this.shared.get(key);
    if (!shared) {
      const callbacks = new Map<Element, Set<InViewCallback>>();
      const observer = this.zone.runOutsideAngular(() => new IntersectionObserver(entries => {
        for (const entry of entries) callbacks.get(entry.target)?.forEach(callback => callback(entry.isIntersecting));
      }, {rootMargin, threshold}));
      shared = {observer, callbacks};
      this.shared.set(key, shared);
    }
    return shared;
  }
}
