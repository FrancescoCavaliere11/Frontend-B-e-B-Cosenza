import {AfterViewInit, Component, DestroyRef, ElementRef, inject, signal, viewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AbstractControl, FormBuilder, Validators} from '@angular/forms';
import {BookingFlowStore} from '../booking-flow.store';
import {CaptchaService, CaptchaWidget} from '../captcha.service';
import {BOOKING_RULES} from '../../../schemas/booking-schema';
import {PaymentOption} from '../../../schemas/booking-enums';
import {
  CUSTOM_PREFIX_PATTERN, DEFAULT_PHONE_PREFIX, OTHER_PHONE_PREFIX, PHONE_PREFIXES, normalizePrefix,
} from '../../../schemas/phone-prefixes';
import {EMAIL_PATTERN, phoneDigitsOf} from '../../../validators/validators';
import {PhoneRulesService, mobilePhoneValidator, phoneFormatValidator, phoneMobileMessage} from '../../../validators/phone-rules';
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
  /** «Invia» premuto prima che il captcha producesse un token. */
  protected readonly captchaMissing = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private captchaWidget: CaptchaWidget | null = null;
  private readonly captchaHost = viewChild<ElementRef<HTMLElement>>('captcha');
  private readonly phoneRules = inject(PhoneRulesService);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    firstname: ['', [Validators.required, Validators.minLength(BOOKING_RULES.NAME_MIN_LENGTH), Validators.maxLength(BOOKING_RULES.NAME_MAX_LENGTH)]],
    lastname: ['', [Validators.required, Validators.minLength(BOOKING_RULES.NAME_MIN_LENGTH), Validators.maxLength(BOOKING_RULES.NAME_MAX_LENGTH)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
    phone_prefix: [DEFAULT_PHONE_PREFIX],
    phone_custom_prefix: [{value: '', disabled: true}, [Validators.required, Validators.pattern(CUSTOM_PREFIX_PATTERN)]],
    phone_number: ['', [Validators.required, phoneFormatValidator(), mobilePhoneValidator(this.phoneRules)]],
    accept_terms: [false, [Validators.requiredTrue]],
    website: [''],
  });

  constructor() {
    const phone = this.form.controls.phone_number;
    this.form.controls.phone_prefix.valueChanges.pipe(takeUntilDestroyed()).subscribe(prefix => {
      const custom = this.form.controls.phone_custom_prefix;
      if (prefix === OTHER_PHONE_PREFIX) custom.enable();
      else custom.disable();
      phone.updateValueAndValidity();
    });
    this.form.controls.phone_custom_prefix.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => phone.updateValueAndValidity());
    this.phoneRules.load().then(loaded => loaded && phone.updateValueAndValidity());
  }

  ngAfterViewInit(): void {
    const host = this.captchaHost()?.nativeElement;
    if (!host || !this.captcha.isEnabled) return;
    this.captcha.render(host, token => this.onCaptchaToken(token))
      .then(widget => {
        this.captchaWidget = widget;
        this.destroyRef.onDestroy(() => widget.remove());
      })
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

    if (!control.errors) return null;
    if (control.hasError('required')) return field === 'accept_terms' ? this.validation.terms : this.validation.required;
    if (control.hasError('requiredTrue')) return this.validation.terms;
    if (control.hasError('minlength')) return this.validation.minLength(BOOKING_RULES.NAME_MIN_LENGTH);
    if (control.hasError('maxlength')) return this.validation.maxLength(BOOKING_RULES.NAME_MAX_LENGTH);
    if (control.hasError('pattern')) return field === 'email' ? this.validation.email : this.ui.errors.prefix;
    if (control.hasError('phoneFormat')) return this.ui.errors.phoneFormat;
    if (control.hasError('phoneMobile')) return phoneMobileMessage(control.getError('phoneMobile'));
    return null;
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.captcha.isEnabled && !this.captchaToken()) {
      this.captchaMissing.set(true);
      return;
    }

    const value = this.form.getRawValue();
    const prefix = value.phone_prefix === OTHER_PHONE_PREFIX ? normalizePrefix(value.phone_custom_prefix) : value.phone_prefix;
    this.store.submitGuest({
      firstname: value.firstname.trim(),
      lastname: value.lastname.trim(),
      email: value.email.trim(),
      phone_number: `${prefix}${phoneDigitsOf(value.phone_number)}`,
    }, this.captchaToken(), value.website || null, () => this.captchaWidget?.reset());
  }

  private onCaptchaToken(token: string | null): void {
    this.captchaToken.set(token);
    if (token) this.captchaMissing.set(false);
  }
}
