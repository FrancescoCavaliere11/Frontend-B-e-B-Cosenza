import {Component, OnInit, inject, signal} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {GuestBookingService} from '../../http/guest-booking.service';
import {SiteError, toSiteError} from '../../http/site-error';
import {PublicBooking} from '../../models/booking-public.models';
import {takeTokenFromUrl} from '../../booking/booking-token';
import {SITE_ROUTES} from '../../config/navigation.config';
import {BOOKING_UI} from '../../booking/booking.copy';

/**
 * Pagina del link «Conferma» dell'email. Distingue «già confermata» (409)
 * da «link non valido» (400) e «tempo scaduto» (410): il backend manda già
 * il messaggio giusto per ciascuno.
 */
@Component({
  selector: 'site-booking-confirm',
  standalone: false,
  templateUrl: './booking-confirm.html',
})
export class BookingConfirmPage implements OnInit {
  private readonly api = inject(GuestBookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  protected readonly ui = BOOKING_UI;
  protected readonly routes = SITE_ROUTES;
  protected readonly booking = signal<PublicBooking | null>(null);
  protected readonly error = signal<SiteError | null>(null);
  protected readonly isWorking = signal(true);

  ngOnInit(): void {
    const token = takeTokenFromUrl(this.route, this.location);
    if (!token) {
      this.isWorking.set(false);
      this.error.set({status: 400, message: this.ui.confirm.missingToken, retryAfter: null, fieldErrors: {}});
      return;
    }
    this.api.confirm(token).subscribe({
      next: booking => {
        this.booking.set(booking);
        this.isWorking.set(false);
      },
      error: error => {
        this.error.set(toSiteError(error));
        this.isWorking.set(false);
      },
    });
  }
}
