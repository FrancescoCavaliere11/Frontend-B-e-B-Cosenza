import {Component, OnInit, computed, inject} from '@angular/core';
import {SiteExtrasService} from '../../services/site-extras.service';
import {SERVICES_PAGE} from '../../content/services.content';
import {EditorialBlock, TextBlock} from '../../models/site.models';

/** Servizi extra come racconto a righe alternate. */
@Component({
  selector: 'site-services',
  standalone: false,
  template: `<div class="page-start"><site-block-renderer [blocks]="blocks()" /></div>`,
})
export class ServicesPage implements OnInit {
  private readonly extras = inject(SiteExtrasService);

  private readonly intro: TextBlock = {
    type: 'text',
    eyebrow: SERVICES_PAGE.eyebrow,
    title: SERVICES_PAGE.title,
    paragraphs: [SERVICES_PAGE.intro],
    size: 'large',
    line: true,
  };

  protected readonly blocks = computed<EditorialBlock[]>(() => [
    this.intro,
    ...this.extras.items().map((item, index): EditorialBlock => ({
      type: 'split',
      media: item.media,
      title: item.name,
      paragraphs: [item.description],
      note: item.note,
      reverse: index % 2 === 1,
    })),
    {type: 'text', paragraphs: [], link: {kind: 'booking', label: 'Prenota il tuo soggiorno'}},
  ]);

  ngOnInit(): void {
    this.extras.load();
  }
}
