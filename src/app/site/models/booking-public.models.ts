import {BookingStatus, PaymentOption, PaymentStatus} from '../../schemas/booking-enums';

/**
 * Viste pubbliche del modulo Booking (`booking_api.md` §5.2, `payment_api.md`).
 * Gli importi restano stringhe decimali: mai convertiti per fare calcoli.
 */

export interface QuoteLine {
  roomId: string;
  roomName: string;
  unitPrice: string;
  nights: number;
  lineTotal: string;
}

/** `BookingQuoteResponseSchema`, compreso il token firmato. */
export interface GuestQuote {
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  paymentOption: PaymentOption;
  lines: QuoteLine[];
  basePrice: string;
  discountAmount: string;
  totalPrice: string;
  currency: string;
  quoteToken: string;
  quoteExpiresAt: string;
}

export interface PublicBookingRoom {
  roomName: string;
  roomNumber: number;
  nights: number;
  unitPrice: string;
  lineTotal: string;
}

/** `BookingPublicSchema`: niente id interni, solo il codice. */
export interface PublicBooking {
  code: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  guestFirstname: string;
  guestEmail: string;
  rooms: PublicBookingRoom[];
  basePrice: string;
  discountAmount: string;
  totalPrice: string;
  currency: string;
  paymentOption: PaymentOption;
  paymentStatus: PaymentStatus;
  holdExpiresAt: string | null;
  cancellationDeadline: string | null;
  confirmedAt: string | null;
}

export interface CreatedBooking {
  booking: PublicBooking;
  /** Solo in sviluppo (`EMAIL_ENABLED=false`): mai mostrato all'ospite. */
  confirmationToken: string | null;
}

export interface CancellationPolicy {
  canCancel: boolean;
  message: string | null;
  freeUntil: string | null;
}

export interface ManagedBooking {
  booking: PublicBooking;
  cancellation: CancellationPolicy;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: string;
  currency: string;
  bookingCode: string;
}

export interface GuestData {
  firstname: string;
  lastname: string;
  email: string;
  phone_number: string;
}

export interface GuestBookingRequest {
  quote_token: string;
  guest: GuestData;
  accept_terms: boolean;
  captcha_token: string | null;
  /** Honeypot: sempre vuoto da un utente reale. */
  website: string | null;
}

/* ------------------------------------------------------------------ */
/* Adattatori dal JSON del backend                                      */
/* ------------------------------------------------------------------ */

type Json = Record<string, any>;

const amount = (value: unknown): string => String(value ?? '');

export function toGuestQuote(data: Json): GuestQuote {
  return {
    checkIn: data['check_in'],
    checkOut: data['check_out'],
    nights: data['nights'],
    guestCount: data['guest_count'],
    paymentOption: data['payment_option'],
    lines: (data['lines'] ?? []).map((line: Json) => ({
      roomId: line['room_id'],
      roomName: line['room_name'],
      unitPrice: amount(line['unit_price']),
      nights: line['nights'],
      lineTotal: amount(line['line_total']),
    })),
    basePrice: amount(data['base_price']),
    discountAmount: amount(data['discount_amount']),
    totalPrice: amount(data['total_price']),
    currency: data['currency'],
    quoteToken: data['quote_token'],
    quoteExpiresAt: data['quote_expires_at'],
  };
}

export function toPublicBooking(data: Json): PublicBooking {
  return {
    code: data['code'],
    status: data['status'],
    checkIn: data['check_in'],
    checkOut: data['check_out'],
    nights: data['nights'],
    guestCount: data['guest_count'],
    guestFirstname: data['guest_firstname'],
    guestEmail: data['guest_email'],
    rooms: (data['rooms'] ?? []).map((room: Json) => ({
      roomName: room['room_name'],
      roomNumber: room['room_number'],
      nights: room['nights'],
      unitPrice: amount(room['unit_price']),
      lineTotal: amount(room['line_total']),
    })),
    basePrice: amount(data['base_price']),
    discountAmount: amount(data['discount_amount']),
    totalPrice: amount(data['total_price']),
    currency: data['currency'],
    paymentOption: data['payment_option'],
    paymentStatus: data['payment_status'],
    holdExpiresAt: data['hold_expires_at'] ?? null,
    cancellationDeadline: data['cancellation_deadline'] ?? null,
    confirmedAt: data['confirmed_at'] ?? null,
  };
}

export function toManagedBooking(data: Json): ManagedBooking {
  const cancellation: Json = data['cancellation'] ?? {};
  return {
    booking: toPublicBooking(data['booking']),
    cancellation: {
      canCancel: !!cancellation['can_cancel'],
      message: cancellation['message'] ?? null,
      freeUntil: cancellation['free_until'] ?? null,
    },
  };
}

export function toPaymentIntent(data: Json): PaymentIntent {
  return {
    clientSecret: data['client_secret'],
    amount: amount(data['amount']),
    currency: data['currency'],
    bookingCode: data['booking_code'],
  };
}
