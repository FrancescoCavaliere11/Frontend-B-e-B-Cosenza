import {Component, computed, effect, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {SiteRoomsService} from '../../services/site-rooms.service';
import {BookingPanelService} from '../../services/booking-panel.service';
import {SITE_ROUTES} from '../../config/navigation.config';
import {formatAmount} from '../../../utils/booking-format';
import {UI} from '../../i18n/it';

/** Scheda camera in overlay: galleria percorribile, racconto, dotazioni, prenotazione. */
@Component({
  selector: 'site-room-detail',
  standalone: false,
  templateUrl: './room-detail.html',
  styleUrl: './room-detail.css',
})
export class RoomDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly booking = inject(BookingPanelService);
  protected readonly catalog = inject(SiteRoomsService);
  protected readonly ui = UI;

  private readonly slug = toSignal(this.route.paramMap.pipe(map(params => params.get('slug') ?? '')), {initialValue: ''});

  protected readonly room = computed(() => this.catalog.bySlug(this.slug()));
  protected readonly price = computed(() => {
    const price = this.room()?.price;
    return price ? formatAmount(price) : null;
  });
  protected readonly features = computed(() => {
    const room = this.room();
    return room ? [...room.details, ...room.amenities] : [];
  });

  constructor() {
    this.catalog.load();
    // Slug inesistente (o camera disattivata): si torna all'indice.
    effect(() => {
      const state = this.catalog.state();
      if ((state === 'ready' || state === 'preview') && !this.room()) this.close();
    });
  }

  protected bookRoom(): void {
    const id = this.room()?.id;
    this.booking.open(id ? {roomId: id} : null);
  }

  protected close(): void {
    this.router.navigateByUrl(SITE_ROUTES.rooms);
  }
}
