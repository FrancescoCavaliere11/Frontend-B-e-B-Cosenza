import {Component, input} from '@angular/core';
import {EditorialBlock} from '../../models/site.models';

/** Blocchi che si susseguono con il ritmo «media → media» più ampio. */
const MEDIA_TYPES: ReadonlySet<EditorialBlock['type']> = new Set(['card', 'media', 'editorial']);

/**
 * Dispatcher dei blocchi editoriali (pattern Strategy): a ogni `type`
 * il suo componente. Aggiungere un blocco non tocca le pagine.
 */
@Component({
  selector: 'site-block-renderer',
  standalone: false,
  templateUrl: './block-renderer.html',
  host: {'class': 'blocks'},
})
export class BlockRenderer {
  readonly blocks = input.required<ReadonlyArray<EditorialBlock>>();
  /** Il primo blocco media della pagina si carica subito (LCP). */
  readonly eagerFirst = input(false);

  protected isMedia(block: EditorialBlock): boolean {
    return MEDIA_TYPES.has(block.type);
  }
}
