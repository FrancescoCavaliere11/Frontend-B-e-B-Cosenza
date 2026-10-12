import {Component, input, signal} from '@angular/core';

let nextId = 0;

/**
 * Sezione richiudibile (footer su mobile, sottomenu del drawer).
 * Con `staticFrom = 'sm'` da 640px è sempre aperta e non cliccabile.
 */
@Component({
  selector: 'site-accordion',
  standalone: false,
  templateUrl: './accordion.html',
  styleUrl: './accordion.css',
  host: {
    '[class.is-open]': 'isOpen()',
    '[class.is-static-sm]': 'staticFrom() === "sm"',
  },
})
export class Accordion {
  readonly title = input.required<string>();
  readonly staticFrom = input<'sm' | null>(null);
  readonly titleClass = input('type-label');

  protected readonly isOpen = signal(false);
  protected readonly panelId = `accordion-${nextId++}`;

  protected toggle(): void {
    this.isOpen.update(open => !open);
  }
}
