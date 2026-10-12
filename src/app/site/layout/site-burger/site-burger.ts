import {Component, input, output} from '@angular/core';

/** Burger del menu mobile: due linee che diventano una X in due tempi. */
@Component({
  selector: 'site-burger',
  standalone: false,
  template: `
    <button type="button" class="burger" [class.is-open]="isOpen()" [attr.aria-label]="label()"
            [attr.aria-expanded]="isOpen()" aria-controls="site-drawer" (click)="toggled.emit()">
      <span class="burger__line"></span>
      <span class="burger__line"></span>
    </button>
  `,
  styleUrl: './site-burger.css',
})
export class SiteBurger {
  readonly isOpen = input(false);
  readonly label = input.required<string>();
  readonly toggled = output<void>();
}
