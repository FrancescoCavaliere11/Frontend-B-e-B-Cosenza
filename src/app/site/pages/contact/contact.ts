import {Component, computed, inject, signal} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {CONTACT_GROUPS, CONTACT_PAGE} from '../../content/contact.content';
import {SITE, osmEmbedUrl} from '../../config/site.config';
import {TextBlock} from '../../models/site.models';

/**
 * Contatti: recapiti, orari, come arrivare, informazioni utili e mappa.
 * La mappa (OpenStreetMap) si carica solo al clic: nessuna richiesta a
 * terzi finché l'ospite non la chiede.
 */
@Component({
  selector: 'site-contact',
  standalone: false,
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class ContactPage {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly page = CONTACT_PAGE;
  protected readonly groups = CONTACT_GROUPS;
  protected readonly mailHref = `${SITE.email.href}?subject=${encodeURIComponent(CONTACT_PAGE.mailSubject)}`;
  protected readonly isMapVisible = signal(false);
  protected readonly mapUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(osmEmbedUrl(SITE.geo.lat, SITE.geo.lng))
  );

  protected readonly intro: TextBlock = {
    type: 'text',
    eyebrow: CONTACT_PAGE.eyebrow,
    title: CONTACT_PAGE.title,
    paragraphs: [CONTACT_PAGE.intro],
    size: 'large',
    line: true,
  };
}
