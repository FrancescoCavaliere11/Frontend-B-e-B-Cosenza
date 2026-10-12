import {DOCUMENT, Directive, ElementRef, effect, inject, input} from '@angular/core';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', 'iframe', '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Tiene il focus da tastiera dentro l'elemento finché `siteFocusTrap` è
 * vero (drawer, overlay, galleria, prenotazione) e lo restituisce a chi
 * lo aveva quando si disattiva.
 */
@Directive({
  selector: '[siteFocusTrap]',
  standalone: false,
  host: {'(keydown.tab)': 'onTab($event)', '(keydown.shift.tab)': 'onTab($event)'},
})
export class FocusTrapDirective {
  readonly siteFocusTrap = input(false);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private previous: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.siteFocusTrap()) {
        this.previous = this.document.activeElement as HTMLElement | null;
        queueMicrotask(() => (this.focusables()[0] ?? this.element).focus({preventScroll: true}));
      } else if (this.previous) {
        this.previous.focus({preventScroll: true});
        this.previous = null;
      }
    });
  }

  protected onTab(event: Event): void {
    if (!this.siteFocusTrap()) return;
    const items = this.focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const backwards = (event as KeyboardEvent).shiftKey;
    const active = this.document.activeElement;
    if (backwards && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!backwards && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(this.element.querySelectorAll<HTMLElement>(FOCUSABLE))
      .filter(item => item.offsetParent !== null || item === this.document.activeElement);
  }
}
