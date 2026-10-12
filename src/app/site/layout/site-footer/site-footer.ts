import {Component} from '@angular/core';
import {SITE} from '../../config/site.config';
import {LEGAL_NAV, SITE_ROUTES} from '../../config/navigation.config';
import {UI} from '../../i18n/it';

/** Footer: orari, contatti, prenotazioni, note legali e social. */
@Component({
  selector: 'site-footer',
  standalone: false,
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.css',
})
export class SiteFooter {
  protected readonly site = SITE;
  protected readonly legal = LEGAL_NAV;
  protected readonly routes = SITE_ROUTES;
  protected readonly ui = UI;
}
