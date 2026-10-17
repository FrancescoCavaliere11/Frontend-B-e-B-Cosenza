import type {CountryCode} from 'libphonenumber-js';

/** Prefissi proposti nel menu del telefono; per gli altri Paesi c'è «Altro prefisso». */
export interface PhonePrefix {
  code: string;
  country: string;
  iso: CountryCode;
}

export const DEFAULT_PHONE_PREFIX = '+39';

/** Valore del menu per «Altro prefisso»: il prefisso si scrive a mano. */
export const OTHER_PHONE_PREFIX = 'other';

export const PHONE_PREFIXES: ReadonlyArray<PhonePrefix> = [
  {code: '+39', country: 'Italia', iso: 'IT'},
  {code: '+49', country: 'Germania', iso: 'DE'},
  {code: '+33', country: 'Francia', iso: 'FR'},
  {code: '+44', country: 'Regno Unito', iso: 'GB'},
  {code: '+34', country: 'Spagna', iso: 'ES'},
  {code: '+41', country: 'Svizzera', iso: 'CH'},
  {code: '+43', country: 'Austria', iso: 'AT'},
  {code: '+31', country: 'Paesi Bassi', iso: 'NL'},
  {code: '+32', country: 'Belgio', iso: 'BE'},
  {code: '+1', country: 'Stati Uniti e Canada', iso: 'US'},
];

/** Prefisso scritto a mano: «+» facoltativo, da 1 a 4 cifre, senza zero iniziale. */
export const CUSTOM_PREFIX_PATTERN = /^\+?[1-9]\d{0,3}$/;

/** `44` o `+44` → `+44`. */
export function normalizePrefix(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export interface PhonePrefixChoice {
  code: string;
  country: PhonePrefix | null;
}

/** `null` se il prefisso scritto a mano non è valido. */
export function resolvePhonePrefix(selected: string, custom: string): PhonePrefixChoice | null {
  if (selected === OTHER_PHONE_PREFIX) {
    return CUSTOM_PREFIX_PATTERN.test(custom.trim()) ? {code: normalizePrefix(custom), country: null} : null;
  }
  return {code: selected, country: PHONE_PREFIXES.find(prefix => prefix.code === selected) ?? null};
}
