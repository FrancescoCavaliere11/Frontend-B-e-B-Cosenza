import {AfterViewInit, Component, DestroyRef, ElementRef, inject, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BookingFlowStore} from '../booking-flow.store';
import {CaptchaService} from '../captcha.service';
import {BOOKING_RULES} from '../../../schemas/booking-schema';
import {PaymentOption} from '../../../schemas/booking-enums';
import {
  CUSTOM_PREFIX_PATTERN, DEFAULT_PHONE_PREFIX, ITALIAN_MOBILE_FIRST_DIGIT, OTHER_PHONE_PREFIX, PHONE_PREFIXES, normalizePrefix,
} from '../../../schemas/phone-prefixes';
import {EMAIL_PATTERN, italianMobileValidator, phoneDigitsOf, phoneDigitsValidator} from '../../../validators/validators';
import {SITE_ROUTES} from '../../config/navigation.config';
import {BOOKING_UI} from '../booking.copy';
import {UI} from '../../i18n/it';

type GuestField = 'firstname' | 'lastname' | 'email' | 'phone_number' | 'phone_custom_prefix' | 'accept_terms';

/**
 * Passo 3: dati dell'ospite. Stesse regole del backend e del back-office
 * (nome 2–50, email, cellulare con prefisso), più honeypot e captcha.
 */
@Component({
  selector: 'site-booking-guest-form',
  standalone: false,
  templateUrl: './booking-guest-form.html',
  styleUrl: './booking-guest-form.css',
})
export class BookingGuestForm implements AfterViewInit {
  protected readonly store = inject(BookingFlowStore);
  protected readonly captcha = inject(CaptchaService);
  protected readonly ui = BOOKING_UI.guest;
  protected readonly common = UI.common;
  protected readonly validation = UI.validation;
  protected readonly routes = SITE_ROUTES;
  protected readonly prefixes = PHONE_PREFIXES;
  protected readonly otherPrefix = OTHER_PHONE_PREFIX;
  protected readonly isPayNow = this.store.paymentOption() === PaymentOption.PAY_NOW;

  protected readonly submitted = signal(false);
  protected readonly captchaToken = signal<string | null>(null);
  protected readonly captchaFailed = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private readonly captchaHost = viewChild<ElementRef<HTMLElement>>('captcha');

  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstname: ['', [Validators.required, Validators.minLength(BOOKING_RULES.NAME_MIN_LENGTH), Validators.maxLength(BOOKING_RULES.NAME_MAX_LENGTH)]],
    lastname: ['', [Validators.required, Validators.minLength(BOOKING_RULES.NAME_MIN_LENGTH), Validators.maxLength(BOOKING_RULES.NAME_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    phone_prefix: [DEFAULT_PHONE_PREFIX],
    phone_custom_prefix: [{value: '', disabled: true}, [Validators.required, Validators.pattern(CUSTOM_PREFIX_PATTERN)]],
    phone_number: ['', [Validators.required, phoneDigitsValidator(BOOKING_RULES.PHONE_DIGITS)]],
    accept_terms: [false, [Validators.requiredTrue]],
    website: [''],
  }, {
    validators: italianMobileValidator('phone_prefix', 'phone_number', DEFAULT_PHONE_PREFIX, ITALIAN_MOBILE_FIRST_DIGIT),
  });

  constructor() {
    this.form.controls.phone_prefix.valueChanges.pipe(takeUntilDestroyed()).subscribe(prefix => {
      const custom = this.form.controls.phone_custom_prefix;
      if (prefix === OTHER_PHONE_PREFIX) custom.enable();
      else custom.disable();
    });
  }

  ngAfterViewInit(): void {
    const host = this.captchaHost()?.nativeElement;
    if (!host || !this.captcha.isEnabled) return;
    this.captcha.render(host, token => this.captchaToken.set(token))
      .then(dispose => this.destroyRef.onDestroy(dispose))
      .catch(() => this.captchaFailed.set(true));
  }

  protected isCustomPrefix(): boolean {
    return this.form.controls.phone_prefix.value === OTHER_PHONE_PREFIX;
  }

  /** Messaggio d'errore di un campo, solo dopo che l'utente ci è passato. */
  protected errorOf(field: GuestField): string | null {
    const control: AbstractControl = this.form.controls[field];
    const serverError = this.store.error()?.fieldErrors[field];
    if (serverError) return serverError;
    if (!(control.touched || this.submitted())) return null;

    if (field === 'phone_number' && this.form.hasError('italianMobile')) return this.ui.errors.italianMobile;
    if (!control.errors) return null;
    if (control.hasError('required')) return field === 'accept_terms' ? this.validation.terms : this.validation.required;
    if (control.hasError('requiredTrue')) return this.validation.terms;
    if (control.hasError('minlength')) return this.validation.minLength(BOOKING_RULES.NAME_MIN_LENGTH);
    if (control.hasError('maxlength')) return this.validation.maxLength(BOOKING_RULES.NAME_MAX_LENGTH);
    if (control.hasError('pattern')) return field === 'email' ? this.validation.email : this.ui.errors.prefix;
    if (control.hasError('phoneDigits')) return this.ui.errors.phoneDigits(BOOKING_RULES.PHONE_DIGITS);
    return null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || (this.captcha.isEnabled && !this.captchaToken())) return;

    const value = this.form.getRawValue();
    const prefix = value.phone_prefix === OTHER_PHONE_PREFIX ? normalizePrefix(value.phone_custom_prefix) : value.phone_prefix;
    this.store.submitGuest({
      firstname: value.firstname.trim(),
      lastname: value.lastname.trim(),
      email: value.email.trim(),
      phone_number: `${prefix}${phoneDigitsOf(value.phone_number)}`,
    }, this.captchaToken(), value.website || null);
  }
}
