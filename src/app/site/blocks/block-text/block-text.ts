import {Component, input} from '@angular/core';
import {TextBlock} from '../../models/site.models';

/** Testo centrato: etichetta, titolo, paragrafi, azione e linea di collegamento. */
@Component({
  selector: 'site-block-text',
  standalone: false,
  templateUrl: './block-text.html',
  styleUrl: './block-text.css',
})
export class BlockText {
  readonly block = input.required<TextBlock>();
}
