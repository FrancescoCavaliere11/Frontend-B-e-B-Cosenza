import {Component} from '@angular/core';
import {SITE_ROUTES} from '../../config/navigation.config';
import {UI} from '../../i18n/it';

@Component({
  selector: 'site-not-found',
  standalone: false,
  template: `
    <section class="page-start wrapper section prose prose--large">
      <h1 class="type-title">{{ ui.errors.notFoundTitle }}</h1>
      <p>{{ ui.errors.notFoundText }}</p>
      <p><a class="button" [routerLink]="home">{{ ui.nav.home }}</a></p>
    </section>
  `,
})
export class NotFoundPage {
  protected readonly ui = UI;
  protected readonly home = SITE_ROUTES.home;
}
