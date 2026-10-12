import {Component, input} from '@angular/core';
import {SplitBlock} from '../../models/site.models';

/** Foto e testo affiancati (impilati su mobile); `reverse` inverte i lati. */
@Component({
  selector: 'site-block-split',
  standalone: false,
  templateUrl: './block-split.html',
  styleUrl: './block-split.css',
})
export class BlockSplit {
  readonly block = input.required<SplitBlock>();
}
