import {Component, computed, input} from '@angular/core';
import {EditorialCardBlock} from '../../models/site.models';
import {sizesFor} from '../../utils/media';

/** Figura con didascalia in corsivo, per i collage asimmetrici. */
@Component({
  selector: 'site-block-editorial',
  standalone: false,
  templateUrl: './block-editorial.html',
  styleUrl: './block-editorial.css',
})
export class BlockEditorial {
  readonly block = input.required<EditorialCardBlock>();
  protected readonly sizes = computed(() => sizesFor(this.block().placement));
}
