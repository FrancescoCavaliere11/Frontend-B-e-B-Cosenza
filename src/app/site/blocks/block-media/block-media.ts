import {Component, computed, input} from '@angular/core';
import {MediaBlock} from '../../models/site.models';
import {sizesFor} from '../../utils/media';

/** Una fotografia posata sulla griglia, con didascalia facoltativa. */
@Component({
  selector: 'site-block-media',
  standalone: false,
  templateUrl: './block-media.html',
})
export class BlockMedia {
  readonly block = input.required<MediaBlock>();
  readonly eager = input(false);
  protected readonly sizes = computed(() => sizesFor(this.block().placement));
}
