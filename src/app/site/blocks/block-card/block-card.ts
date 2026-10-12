import {Component, computed, inject, input} from '@angular/core';
import {CardBlock} from '../../models/site.models';
import {BookingPanelService} from '../../services/booking-panel.service';
import {sizesFor} from '../../utils/media';

/** Avanzamento del carosello dentro una card (ms). */
export const CARD_AUTOPLAY_MS = 4500;

/**
 * Card editoriale sfalsata. Su desktop il testo è sovrapposto e compare
 * in hover mentre la foto si sfoca; su mobile sta sotto la foto.
 * Più foto → carosello a dissolvenza che avanza da solo.
 */
@Component({
  selector: 'site-block-card',
  standalone: false,
  templateUrl: './block-card.html',
  styleUrl: './block-card.css',
})
export class BlockCard {
  readonly block = input.required<CardBlock>();
  readonly eager = input(false);

  protected readonly booking = inject(BookingPanelService);
  protected readonly autoplay = CARD_AUTOPLAY_MS;
  protected readonly sizes = computed(() => sizesFor(this.block().placement));
  protected readonly routePath = computed(() => {
    const link = this.block().link;
    return link.kind === 'route' ? link.path : null;
  });
}
