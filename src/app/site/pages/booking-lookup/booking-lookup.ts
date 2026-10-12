import {Component, inject, signal} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {GuestBookingService} from '../../http/guest-booking.service';
import {SiteError, toSiteError} from '../../http/site-error';
import {PublicBooking} from '../../models/booking-public.models';
import {EMAIL_PATTERN} from '../../../validators/validators';
import {CODE_MAX_LENGTH} from '../../../schemas/booking-schema';
import {BOOKING_UI} from '../../booking/booking.copy';
import {UI} from '../../i18n/it';

const CODE_MIN_LENGTH = 3;
/** Parametro con cui Stripe riporta qui dopo un pagamento con redirect. */
const CODE_QUERY_PARAM = 'codice';

/** Consulta una prenotazione con codice ed email (sola lettura). */
@Component({
  selector: 'site-booking-lookup',
  standalone: false,
  templateUrl: './booking-lookup.html',
})
export class BookingLookupPage {
  private readonly api = inject(GuestBookingService);

  protected readonly ui = BOOKING_UI.lookup;
  protected readonly validation = UI.validation;
  protected readonly booking = signal<PublicBooking | null>(null);
  protected readonly error = signal<SiteError | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    code: [inject(ActivatedRoute).snapshot.queryParamMap.get(CODE_QUERY_PARAM) ?? '',
      [Validators.required, Validators.minLength(CODE_MIN_LENGTH), Validators.maxLength(CODE_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
  });

  protected hasError(name: 'code' | 'email'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.isLoading()) return;
    const {code, email} = this.form.getRawValue();
    this.isLoading.set(true);
    this.error.set(null);
    this.api.lookup(code.trim().toUpperCase(), email.trim()).subscribe({
      next: booking => {
        this.booking.set(booking);
        this.isLoading.set(false);
      },
      error: error => {
        this.booking.set(null);
        this.error.set(toSiteError(error));
        this.isLoading.set(false);
      },
    });
  }
}
