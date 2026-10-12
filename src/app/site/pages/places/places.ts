import {Component} from '@angular/core';
import {PLACES, PLACES_PAGE} from '../../content/places.content';
import {EditorialBlock} from '../../models/site.models';
import {placePath} from '../../config/navigation.config';

/** Collage asimmetrico dei luoghi; il racconto si apre sopra. */
@Component({
  selector: 'site-places',
  standalone: false,
  template: `<div class="page-start"><site-block-renderer [blocks]="blocks" /></div><router-outlet />`,
})
export class PlacesPage {
  protected readonly blocks: EditorialBlock[] = [
    {type: 'text', eyebrow: PLACES_PAGE.eyebrow, title: PLACES_PAGE.title, paragraphs: [PLACES_PAGE.intro], size: 'large', line: true},
    ...PLACES.map((place): EditorialBlock => ({
      type: 'editorial',
      media: place.cover,
      caption: place.name,
      meta: place.distance,
      placement: place.placement,
      path: placePath(place.slug),
    })),
  ];
}
