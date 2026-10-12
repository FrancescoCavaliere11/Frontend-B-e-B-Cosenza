import {DOCUMENT, Injectable, computed, inject, signal, untracked} from '@angular/core';

const LOCKED_CLASS = 'is-scroll-locked';

/**
 * Blocco dello scroll della pagina con proprietari multipli: drawer,
 * overlay, galleria e pannello di prenotazione possono aprirsi uno sopra
 * l'altro, e lo scroll torna solo quando l'ultimo si chiude.
 */
@Injectable({providedIn: 'root'})
export class ScrollLockService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly owners = signal<ReadonlySet<string>>(new Set());

  readonly isLocked = computed(() => this.owners().size > 0);

  lock(owner: string): void {
    this.update(owners => owners.add(owner));
  }

  unlock(owner: string): void {
    this.update(owners => owners.delete(owner));
  }

  private update(change: (owners: Set<string>) => void): void {
    // `untracked`: lock/unlock si chiamano anche dentro un effect, che
    // altrimenti dipenderebbe dal signal che scrive (ciclo infinito).
    const next = new Set(untracked(this.owners));
    change(next);
    this.owners.set(next);
    this.root.classList.toggle(LOCKED_CLASS, next.size > 0);
  }
}
