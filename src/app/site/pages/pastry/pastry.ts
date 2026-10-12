import {Component} from '@angular/core';
import {PASTRY_ITEMS, PASTRY_PAGE} from '../../content/pastry.content';
import {MEDIA} from '../../content/media.registry';
import {SplitBlock, TextBlock} from '../../models/site.models';

/**
 * Pasticceria Elimè: chi è, come fare colazione lì, i dolci (mosaico che su
 * mobile diventa un carosello) e l'orario.
 */
@Component({
  selector: 'site-pastry',
  standalone: false,
  templateUrl: './pastry.html',
  styleUrl: './pastry.css',
})
export class PastryPage {
  protected readonly page = PASTRY_PAGE;
  protected readonly items = PASTRY_ITEMS;
  protected readonly slides = PASTRY_ITEMS.map(item => ({...item.media, caption: item.name}));

  protected readonly intro: TextBlock = {
    type: 'text',
    eyebrow: PASTRY_PAGE.eyebrow,
    title: PASTRY_PAGE.title,
    paragraphs: [PASTRY_PAGE.intro],
    size: 'large',
    line: true,
  };

  protected readonly story: SplitBlock = {
    type: 'split',
    media: MEDIA.breakfastTable,
    title: PASTRY_PAGE.storyTitle,
    paragraphs: PASTRY_PAGE.story,
    note: PASTRY_PAGE.hours,
  };

  protected readonly closing: TextBlock = {
    type: 'text',
    title: PASTRY_PAGE.quote,
    paragraphs: [PASTRY_PAGE.hours],
  };
}
