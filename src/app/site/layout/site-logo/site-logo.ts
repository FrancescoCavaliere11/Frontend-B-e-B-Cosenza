import {Component, input} from '@angular/core';
import {SITE} from '../../config/site.config';

/** Logotipo testuale: nome in serif, sottotitolo in maiuscoletto. */
@Component({
  selector: 'site-logo',
  standalone: false,
  templateUrl: './site-logo.html',
  styleUrl: './site-logo.css',
  host: {'[class.is-large]': 'size() === "large"'},
})
export class SiteLogo {
  readonly size = input<'header' | 'large'>('header');
  protected readonly site = SITE;
}
