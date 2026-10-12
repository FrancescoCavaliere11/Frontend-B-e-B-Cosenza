import {Component, OnInit, inject, signal} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {GuestBookingService} from '../../http/guest-booking.service';
import {SiteError, toSiteError} from '../../http/site-error';
import {ManagedBooking} from '../../models/booking-public.models';
import {takeTokenFromUrl} from '../../booking/booking-token';
import {BOOKING_UI} from '../../booking/booking.copy';

const REASON_MAX_LENGTH = 500;

/**
 * Pagina del link «Gestisci» dell'email: legge la prenotazione (il token
 * non si consuma leggendo) e permette di annullarla se la politica lo consente.
 * Il token resta solo in memoria: ricaricando la pagina va riaperto il link.
 */
@Component({
  selector: 'site-booking-manage',
  standalone: false,
  templateUrl: './booking-manage.html',
})
export class BookingManagePage implements OnInit {
  private readonly api = inject(GuestBookingService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private token: string | null = null;

  protected readonly ui = BOOKING_UI;
  protected readonly reasonMax = REASON_MAX_LENGTH;
  protected readonly managed = signal<ManagedBooking | null>(null);
  protected readonly error = signal<SiteError | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isConfirming = signal(false);
  protected readonly isCancelling = signal(false);
  protected readonly cancelled = signal(false);
  protected readonly reason = signal('');

  ngOnInit(): void {
    this.token = takeTokenFromUrl(this.route, this.location);
    if (!this.token) {
      this.isLoading.set(false);
      this.error.set({status: 400, message: this.ui.manage.missingToken, retryAfter: null, fieldErrors: {}});
      return;
    }
    this.api.manage(this.token).subscribe({
      next: managed => {
        this.managed.set(managed);
        this.isLoading.set(false);
      },
      error: error => {
        this.error.set(toSiteError(error));
        this.isLoading.set(false);
      },
    });
  }

  protected onReason(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value.slice(0, REASON_MAX_LENGTH));
  }

  protected cancel(): void {
    if (!this.token || this.isCancelling()) return;
    this.isCancelling.set(true);
    this.error.set(null);
    this.api.cancel(this.token, this.reason().trim() || null).subscribe({
      next: booking => {
        this.managed.update(managed => (managed ? {...managed, booking, cancellation: {...managed.cancellation, canCancel: false}} : managed));
        this.cancelled.set(true);
        this.isConfirming.set(false);
        this.isCancelling.set(false);
      },
      error: error => {
        this.error.set(toSiteError(error));
        this.isCancelling.set(false);
      },
    });
  }
}
