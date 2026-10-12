import {Component, computed, effect, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {PLACES} from '../../content/places.content';
import {SITE_ROUTES} from '../../config/navigation.config';
import {directionsUrl} from '../../config/site.config';
import {UI} from '../../i18n/it';

/** Racconto di un luogo, in overlay sopra il collage. */
@Component({
  selector: 'site-place-detail',
  standalone: false,
  templateUrl: './place-detail.html',
  styleUrl: './place-detail.css',
})
export class PlaceDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly ui = UI;

  private readonly slug = toSignal(this.route.paramMap.pipe(map(params => params.get('slug') ?? '')), {initialValue: ''});
  protected readonly place = computed(() => PLACES.find(place => place.slug === this.slug()));
  protected readonly directions = computed(() => {
    const place = this.place();
    return place ? directionsUrl(place.mapsQuery) : '';
  });

  constructor() {
    effect(() => {
      if (this.slug() && !this.place()) this.close();
    });
  }

  protected close(): void {
    this.router.navigateByUrl(SITE_ROUTES.places);
  }
}
