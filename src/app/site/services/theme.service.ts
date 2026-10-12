import {DOCUMENT, Injectable, inject, signal, untracked} from '@angular/core';
import {DEFAULT_THEME, THEMES} from '../config/theme.config';
import {ThemeName} from '../models/site.models';

/**
 * Tema di colore della pagina.
 *
 * Scrive due variabili sullo `style` di `<html>`; la transizione di
 * `--dur-theme` (3 s) la fa il CSS. Chiunque usi `currentColor`,
 * `--site-bg` o `--site-fg` si adatta da solo.
 */
@Injectable({providedIn: 'root'})
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly current = signal<ThemeName>(DEFAULT_THEME);

  readonly theme = this.current.asReadonly();

  /** Sezioni che dichiarano un tema, nell'ordine del documento. */
  private readonly triggers = new Map<Element, ThemeName>();

  /**
   * Registra una sezione con il suo tema; restituisce la funzione per
   * toglierla. Il tema attivo lo decide `syncTriggers`.
   */
  registerTrigger(element: Element, theme: ThemeName): () => void {
    this.triggers.set(element, theme);
    this.syncTriggers();
    return () => this.triggers.delete(element);
  }

  /**
   * Applica il tema dell'ultima sezione il cui bordo superiore ha già
   * superato il centro del viewport. Calcolato dalla posizione e non da
   * eventi di intersezione: funziona anche saltando (tasto Fine, ancore).
   */
  syncTriggers(): void {
    if (!this.triggers.size) return;
    const center = (this.root.ownerDocument.defaultView?.innerHeight ?? 0) / 2;
    let active: ThemeName | null = null;
    let activeTop = -Infinity;
    this.triggers.forEach((theme, element) => {
      const top = element.getBoundingClientRect().top;
      if (top <= center && top > activeTop) {
        active = theme;
        activeTop = top;
      }
    });
    const first = this.triggers.values().next().value as ThemeName;
    this.apply(active ?? first);
  }

  apply(name: ThemeName): void {
    // `untracked`: chiamato dentro un effect, non deve dipendere dal tema che scrive.
    if (name === untracked(this.current) && this.root.style.getPropertyValue('--site-bg')) return;
    const theme = THEMES[name];
    this.root.style.setProperty('--site-bg', `var(${theme.background})`);
    this.root.style.setProperty('--site-fg', `var(${theme.text})`);
    this.current.set(name);
  }

  /** Toglie il tema dal documento (uscita dal sito verso l'admin). */
  reset(): void {
    this.root.style.removeProperty('--site-bg');
    this.root.style.removeProperty('--site-fg');
    this.current.set(DEFAULT_THEME);
  }
}
