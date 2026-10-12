import {HttpClient} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable, map} from 'rxjs';
import {Environment} from '../../utils/environments';
import {BookingQuoteRequest} from '../../schemas/booking-schema';
import {SITE_HTTP_CONTEXT} from './site-api.service';
import {
  CreatedBooking, GuestBookingRequest, GuestQuote, ManagedBooking, PaymentIntent, PublicBooking,
  toGuestQuote, toManagedBooking, toPaymentIntent, toPublicBooking,
} from '../models/booking-public.models';

/**
 * API pubbliche della prenotazione dell'ospite (`/bookings/*`, `/payments/intent`).
 * I token dei link email viaggiano sempre nel body, mai nell'URL.
 */
@Injectable({providedIn: 'root'})
export class GuestBookingService {
  private readonly http = inject(HttpClient);
  private readonly bookingsUrl = `${Environment.getInstance().apiUrl}/bookings`;
  private readonly paymentsUrl = `${Environment.getInstance().apiUrl}/payments`;
  private readonly options = {context: SITE_HTTP_CONTEXT};

  quote(request: BookingQuoteRequest): Observable<GuestQuote> {
    return this.http.post<Record<string, unknown>>(`${this.bookingsUrl}/quote`, request, this.options).pipe(map(toGuestQuote));
  }

  create(request: GuestBookingRequest): Observable<CreatedBooking> {
    return this.http.post<Record<string, any>>(`${this.bookingsUrl}/`, request, this.options).pipe(
      map(data => ({booking: toPublicBooking(data['booking']), confirmationToken: data['confirmation_token'] ?? null}))
    );
  }

  confirm(token: string): Observable<PublicBooking> {
    return this.http.post<Record<string, unknown>>(`${this.bookingsUrl}/confirm`, {token}, this.options).pipe(map(toPublicBooking));
  }

  manage(token: string): Observable<ManagedBooking> {
    return this.http.post<Record<string, unknown>>(`${this.bookingsUrl}/manage`, {token}, this.options).pipe(map(toManagedBooking));
  }

  cancel(token: string, reason: string | null): Observable<PublicBooking> {
    return this.http.post<Record<string, unknown>>(`${this.bookingsUrl}/cancel`, {token, reason}, this.options).pipe(map(toPublicBooking));
  }

  lookup(code: string, email: string): Observable<PublicBooking> {
    return this.http.post<Record<string, unknown>>(`${this.bookingsUrl}/lookup`, {code, email}, this.options).pipe(map(toPublicBooking));
  }

  paymentIntent(code: string, email: string): Observable<PaymentIntent> {
    return this.http.post<Record<string, unknown>>(`${this.paymentsUrl}/intent`, {code, email}, this.options).pipe(map(toPaymentIntent));
  }
}
