/**
 * Prefissi internazionali proposti nel campo telefono dell'ospite.
 *
 * Solo i Paesi più frequenti per la struttura, Italia per prima e
 * predefinita; per tutti gli altri c'è «Altro prefisso», libero. Il backend
 * accetta qualunque numero in formato E.164 e lo salva normalizzato
 * (`+393331234567`): questa lista è solo una comodità al banco (debito #32).
 */
export interface PhonePrefix {
  code: string;
  country: string;
}

export const DEFAULT_PHONE_PREFIX = '+39';

/** I cellulari italiani iniziano con 3: si accettano solo quelli. */
export const ITALIAN_MOBILE_FIRST_DIGIT = '3';

/** Valore del menu per «Altro prefisso»: il prefisso si scrive a mano. */
export const OTHER_PHONE_PREFIX = 'other';

export const PHONE_PREFIXES: ReadonlyArray<PhonePrefix> = [
  {code: '+39', country: 'Italia'},
  {code: '+49', country: 'Germania'},
  {code: '+33', country: 'Francia'},
  {code: '+44', country: 'Regno Unito'},
  {code: '+34', country: 'Spagna'},
  {code: '+41', country: 'Svizzera'},
  {code: '+43', country: 'Austria'},
  {code: '+31', country: 'Paesi Bassi'},
  {code: '+32', country: 'Belgio'},
  {code: '+1', country: 'Stati Uniti e Canada'},
];

/** Prefisso scritto a mano: «+» facoltativo, da 1 a 4 cifre, senza zero iniziale. */
export const CUSTOM_PREFIX_PATTERN = /^\+?[1-9]\d{0,3}$/;

/** `44` o `+44` → `+44`. */
export function normalizePrefix(value: string): string {
  const trimmed = value.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
