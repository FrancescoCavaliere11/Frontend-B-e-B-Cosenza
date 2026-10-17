import {Injectable} from '@angular/core';
import {AbstractControl, ValidationErrors, ValidatorFn} from '@angular/forms';
import type {CountryCode, Examples} from 'libphonenumber-js';
import {resolvePhonePrefix} from '../schemas/phone-prefixes';
import {phoneDigitsOf} from './validators';

type MobileLibrary = typeof import('libphonenumber-js/mobile');

interface LoadedRules {
  library: MobileLibrary;
  examples: Examples;
}

export interface PhoneMobileError {
  prefix: string;
  country: string | null;
  example: string | null;
}

const PHONE_FORMAT = /^[\d\s.-]+$/;

/**
 * Regole dei cellulari per Paese (metadati «mobile» di libphonenumber).
 * La libreria si carica a parte e una sola volta, fuori dal pacchetto
 * iniziale; finché non c'è il form non blocca e decide il backend.
 */
@Injectable({providedIn: 'root'})
export class PhoneRulesService {
  private rules: LoadedRules | null = null;
  private loading: Promise<boolean> | null = null;

  /** `false` se il caricamento fallisce; la chiamata successiva riprova. */
  load(): Promise<boolean> {
    if (this.rules) return Promise.resolve(true);
    this.loading ??= Promise.all([
      import('libphonenumber-js/mobile'),
      import('libphonenumber-js/mobile/examples'),
    ]).then(([library, examples]) => {
      this.rules = {library, examples: examples.default};
      return true;
    }).catch(() => {
      this.loading = null;
      return false;
    });
    return this.loading;
  }

  /** `null` finché le regole non sono caricate. */
  isMobile(e164: string): boolean | null {
    if (!this.rules) return null;
    return this.rules.library.parsePhoneNumberFromString(e164)?.isValid() ?? false;
  }

  /** Esempio senza prefisso, come va scritto nel campo: `6 12 34 56 78`. */
  exampleFor(country: CountryCode | null): string | null {
    if (!this.rules || !country) return null;
    const example = this.rules.library.getExampleNumber(country, this.rules.examples);
    return example ? example.formatInternational().replace(/^\+\d+\s/, '') : null;
  }
}

export function phoneFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = (control.value ?? '').trim();
    return value && !PHONE_FORMAT.test(value) ? {phoneFormat: true} : null;
  };
}

/** Va sul campo del numero e legge il prefisso dai campi fratelli: rivalidarlo quando il prefisso cambia. */
export function mobilePhoneValidator(
  rules: PhoneRulesService,
  prefixKey = 'phone_prefix',
  customPrefixKey = 'phone_custom_prefix',
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const digits = phoneDigitsOf(control.value);
    const parent = control.parent;
    if (!digits || !/^\d+$/.test(digits) || !parent) return null;

    const prefix = resolvePhonePrefix(parent.get(prefixKey)?.value ?? '', parent.get(customPrefixKey)?.value ?? '');
    if (!prefix || rules.isMobile(`${prefix.code}${digits}`) !== false) return null;

    const error: PhoneMobileError = {
      prefix: prefix.code,
      country: prefix.country?.country ?? null,
      example: rules.exampleFor(prefix.country?.iso ?? null),
    };
    return {phoneMobile: error};
  };
}

export function phoneMobileMessage(error: PhoneMobileError): string {
  const where = error.country ? `${error.prefix} (${error.country})` : error.prefix;
  return `Numero di cellulare non valido per il prefisso ${where}${error.example ? `. Esempio: ${error.example}` : ''}`;
}
