import {Component, OnInit, computed, inject} from '@angular/core';
import {SiteRoomsService} from '../../services/site-rooms.service';
import {ROOMS_PAGE} from '../../content/rooms.content';
import {CardBlock, EditorialBlock, RoomView, TextBlock} from '../../models/site.models';
import {roomPath} from '../../config/navigation.config';
import {roomFacts} from '../../utils/room-facts';
import {UI} from '../../i18n/it';

/** Indice delle camere: card sfalsate con carosello; il dettaglio si apre sopra. */
@Component({
  selector: 'site-rooms',
  standalone: false,
  templateUrl: './rooms.html',
})
export class RoomsPage implements OnInit {
  protected readonly catalog = inject(SiteRoomsService);
  protected readonly ui = UI;

  private readonly intro: TextBlock = {
    type: 'text',
    eyebrow: ROOMS_PAGE.eyebrow,
    title: ROOMS_PAGE.title,
    paragraphs: [ROOMS_PAGE.intro],
    size: 'large',
    line: true,
  };

  protected readonly blocks = computed<EditorialBlock[]>(() => [
    this.intro,
    ...this.catalog.rooms().map(room => this.toCard(room)),
  ]);

  ngOnInit(): void {
    this.catalog.load();
  }

  private toCard(room: RoomView): CardBlock {
    return {
      type: 'card',
      title: room.name,
      headline: roomFacts(room),
      media: room.gallery,
      placement: room.placement,
      link: {kind: 'route', label: UI.rooms.explore, path: roomPath(room.slug)},
    };
  }
}
