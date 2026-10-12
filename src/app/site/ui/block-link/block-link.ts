import {Component, inject, input} from '@angular/core';
import {BlockLink} from '../../models/site.models';
import {BookingPanelService} from '../../services/booking-panel.service';

/** Link d'azione di un blocco: rotta, sito esterno o apertura della prenotazione. */
@Component({
  selector: 'site-block-link',
  standalone: false,
  template: `
    @switch (link().kind) {
      @case ('route') { <a [class]="appearance()" [routerLink]="routePath()">{{ link().label }}</a> }
      @case ('external') { <a [class]="appearance()" [href]="externalHref()" target="_blank" rel="noopener">{{ link().label }}</a> }
      @case ('booking') { <button type="button" [class]="appearance()" (click)="booking.open()">{{ link().label }}</button> }
    }
  `,
})
export class BlockLinkComponent {
  readonly link = input.required<BlockLink>();
  readonly appearance = input('button');

  protected readonly booking = inject(BookingPanelService);

  protected routePath(): string {
    const link = this.link();
    return link.kind === 'route' ? link.path : '';
  }

  protected externalHref(): string {
    const link = this.link();
    return link.kind === 'external' ? link.href : '';
  }
}
