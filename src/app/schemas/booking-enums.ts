/**
 * Enumerazioni del modulo Booking, specchio di `src/data/enumerators.py`.
 *
 * I valori coincidono con quelli del backend (nome = valore). Le etichette
 * italiane vivono qui, accanto all'enum, così ogni schermata le legge dallo
 * stesso posto.
 */

export enum BookingStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  NO_SHOW = 'NO_SHOW',
}

export enum PaymentOption {
  PAY_NOW = 'PAY_NOW',
  PAY_ON_ARRIVAL = 'PAY_ON_ARRIVAL',
}

export enum PaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  STRIPE_CARD = 'STRIPE_CARD',
  CASH_ON_SITE = 'CASH_ON_SITE',
  POS_ON_SITE = 'POS_ON_SITE',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum BookingChannel {
  PUBLIC_GUEST = 'PUBLIC_GUEST',
  PUBLIC_USER = 'PUBLIC_USER',
  ADMIN_BACKOFFICE = 'ADMIN_BACKOFFICE',
}

export enum AuditActorType {
  GUEST = 'GUEST',
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

/** Ordinamento dell'elenco — `BookingSortOrder` del backend. */
export enum BookingSortOrder {
  CHECK_IN_DESC = 'CHECK_IN_DESC',
  CHECK_IN_ASC = 'CHECK_IN_ASC',
  CREATED_DESC = 'CREATED_DESC',
}

/** Voci del menu «Ordina per», nell'ordine in cui compaiono. */
export const BOOKING_SORT_OPTIONS: ReadonlyArray<{ value: BookingSortOrder; label: string }> = [
  { value: BookingSortOrder.CREATED_DESC, label: 'Ultime inserite' },
  { value: BookingSortOrder.CHECK_IN_ASC, label: 'Arrivo più vicino' },
  { value: BookingSortOrder.CHECK_IN_DESC, label: 'Arrivo più lontano' },
];

/** Tono visivo di un badge: corrisponde a una classe CSS `.badge.<tone>`. */
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING_CONFIRMATION]: 'In attesa di conferma',
  [BookingStatus.PENDING_PAYMENT]: 'In attesa di pagamento',
  [BookingStatus.CONFIRMED]: 'Confermata',
  [BookingStatus.CHECKED_IN]: 'Arrivato',
  [BookingStatus.COMPLETED]: 'Conclusa',
  [BookingStatus.CANCELLED]: 'Annullata',
  [BookingStatus.EXPIRED]: 'Scaduta',
  [BookingStatus.NO_SHOW]: 'Non presentato',
};

export const BOOKING_STATUS_TONES: Record<BookingStatus, BadgeTone> = {
  [BookingStatus.PENDING_CONFIRMATION]: 'warning',
  [BookingStatus.PENDING_PAYMENT]: 'warning',
  [BookingStatus.CONFIRMED]: 'success',
  [BookingStatus.CHECKED_IN]: 'brand',
  [BookingStatus.COMPLETED]: 'neutral',
  [BookingStatus.CANCELLED]: 'danger',
  [BookingStatus.EXPIRED]: 'neutral',
  [BookingStatus.NO_SHOW]: 'danger',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.NOT_REQUIRED]: 'Non richiesto',
  [PaymentStatus.PENDING]: 'Da incassare',
  [PaymentStatus.AUTHORIZED]: 'Autorizzato',
  [PaymentStatus.PAID]: 'Pagato',
  [PaymentStatus.FAILED]: 'Fallito',
  [PaymentStatus.REFUNDED]: 'Rimborsato',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'Rimborsato in parte',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, BadgeTone> = {
  [PaymentStatus.NOT_REQUIRED]: 'neutral',
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.AUTHORIZED]: 'brand',
  [PaymentStatus.PAID]: 'success',
  [PaymentStatus.FAILED]: 'danger',
  [PaymentStatus.REFUNDED]: 'neutral',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'neutral',
};

export const PAYMENT_OPTION_LABELS: Record<PaymentOption, string> = {
  [PaymentOption.PAY_NOW]: 'Pagamento anticipato',
  [PaymentOption.PAY_ON_ARRIVAL]: 'Pagamento in struttura',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.STRIPE_CARD]: 'Carta (online)',
  [PaymentMethod.CASH_ON_SITE]: 'Contanti',
  [PaymentMethod.POS_ON_SITE]: 'POS',
  [PaymentMethod.BANK_TRANSFER]: 'Bonifico',
};

export const BOOKING_CHANNEL_LABELS: Record<BookingChannel, string> = {
  [BookingChannel.PUBLIC_GUEST]: 'Sito — ospite',
  [BookingChannel.PUBLIC_USER]: 'Sito — utente registrato',
  [BookingChannel.ADMIN_BACKOFFICE]: 'Back-office',
};

export const AUDIT_ACTOR_LABELS: Record<AuditActorType, string> = {
  [AuditActorType.GUEST]: 'Ospite',
  [AuditActorType.USER]: 'Utente',
  [AuditActorType.ADMIN]: 'Amministratore',
  [AuditActorType.SYSTEM]: 'Sistema',
};

/** Ordine in cui gli stati compaiono nei filtri. */
export const BOOKING_STATUS_ORDER: BookingStatus[] = [
  BookingStatus.PENDING_CONFIRMATION,
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
  BookingStatus.CANCELLED,
  BookingStatus.EXPIRED,
];
