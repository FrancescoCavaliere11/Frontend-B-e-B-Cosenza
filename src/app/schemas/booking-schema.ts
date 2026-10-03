import {
  AuditActorType,
  BookingChannel,
  BookingSortOrder,
  BookingStatus,
  PaymentMethod,
  PaymentOption,
  PaymentStatus,
} from './booking-enums';

/**
 * Contratti del modulo Booking lato back-office.
 *
 * Due convenzioni del backend da rispettare ovunque:
 * - le date di soggiorno sono stringhe `YYYY-MM-DD`: restano stringhe,
 *   mai `Date` (il parsing le sposterebbe di un giorno a seconda del fuso);
 * - gli importi sono stringhe decimali (`"200.00"`): si mostrano, non ci si
 *   fanno calcoli in virgola mobile.
 */

/** Riga dell'elenco — `BookingListItemSchema`. */
export class BookingListItemSchema {
  id: string;
  code: string;
  status: BookingStatus;
  check_in: string;
  check_out: string;
  guest_firstname: string;
  guest_lastname: string;
  guest_email: string;
  guest_count: number;
  rooms_count: number;
  room_names: string[];
  total_price: string;
  payment_status: PaymentStatus;

  constructor(data: any) {
    this.id = data.id;
    this.code = data.code;
    this.status = data.status;
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.guest_firstname = data.guest_firstname;
    this.guest_lastname = data.guest_lastname;
    this.guest_email = data.guest_email;
    this.guest_count = data.guest_count;
    this.rooms_count = data.rooms_count;
    this.room_names = data.room_names ?? [];
    this.total_price = String(data.total_price);
    this.payment_status = data.payment_status;
  }
}

/** Pagina di risultati — `PaginatedBookingsSchema`. */
export class PaginatedBookingsSchema {
  items: BookingListItemSchema[];
  total: number;
  page: number;
  page_size: number;
  pages: number;

  constructor(data: any) {
    this.items = (data.items ?? []).map((item: any) => new BookingListItemSchema(item));
    this.total = data.total;
    this.page = data.page;
    this.page_size = data.page_size;
    this.pages = data.pages;
  }
}

/**
 * Filtri dell'elenco — `BookingSearchFiltersSchema`.
 * I campi assenti non vengono inviati.
 *
 * `code` ed `email` sono confronti **esatti** nel backend (il codice senza
 * distinzione fra maiuscole e minuscole, l'email anche).
 */
export interface BookingSearchFilters {
  status?: BookingStatus[];
  date_from?: string;
  date_to?: string;
  room_id?: string;
  email?: string;
  code?: string;
  sort: BookingSortOrder;
  page: number;
  page_size: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/** Ordinamento con cui si apre la schermata: le ultime prenotazioni inserite. */
export const DEFAULT_SORT = BookingSortOrder.CREATED_DESC;

/** Lunghezza massima del codice, come `BookingSearchFiltersSchema.code` nel backend. */
export const CODE_MAX_LENGTH = 20;

// ------------------------------------------------------------------ //
// Dettaglio — `GET /admin/bookings/{id}`                              //
// ------------------------------------------------------------------ //

/** Riga camera della prenotazione — `BookingRoomItemSchema`. */
export class BookingRoomItemSchema {
  room_id: string;
  room_name: string;
  room_number: number;
  check_in: string;
  check_out: string;
  nights: number;
  unit_price: string;
  line_total: string;

  constructor(data: any) {
    this.room_id = data.room_id;
    this.room_name = data.room_name;
    this.room_number = data.room_number;
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.nights = data.nights;
    this.unit_price = String(data.unit_price);
    this.line_total = String(data.line_total);
  }
}

/** Voce della cronologia — `BookingStatusHistorySchema`. `from_status` è nullo sulla creazione. */
export class BookingStatusHistorySchema {
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  actor_type: AuditActorType;
  reason: string | null;
  created_at: string;

  constructor(data: any) {
    this.from_status = data.from_status ?? null;
    this.to_status = data.to_status;
    this.actor_type = data.actor_type;
    this.reason = data.reason ?? null;
    this.created_at = data.created_at;
  }
}

/**
 * Vista completa per il back-office — `BookingSchema`.
 *
 * Gli istanti (`created_at`, `hold_expires_at`, …) restano stringhe ISO:
 * si formattano solo per la vista, nel fuso della struttura.
 * `created_by`, `last_updated_by` e `version` non sono letti: per un admin
 * sono un UUID che a schermo non dice nulla, e nessuna rotta usa la versione.
 */
export class BookingDetailSchema {
  id: string;
  code: string;
  status: BookingStatus;
  source_channel: BookingChannel;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;

  user_id: string | null;
  guest_firstname: string;
  guest_lastname: string;
  guest_email: string;
  guest_phone: string;

  rooms: BookingRoomItemSchema[];

  base_price: string;
  discount_amount: string;
  total_price: string;
  currency: string;

  payment_option: PaymentOption;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;

  hold_expires_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_deadline: string | null;
  cancellation_reason: string | null;
  admin_notes: string | null;

  created_at: string;
  updated_at: string;

  status_history: BookingStatusHistorySchema[];

  constructor(data: any) {
    this.id = data.id;
    this.code = data.code;
    this.status = data.status;
    this.source_channel = data.source_channel;
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.nights = data.nights;
    this.guest_count = data.guest_count;

    this.user_id = data.user_id ?? null;
    this.guest_firstname = data.guest_firstname;
    this.guest_lastname = data.guest_lastname;
    this.guest_email = data.guest_email;
    this.guest_phone = data.guest_phone;

    this.rooms = (data.rooms ?? []).map((room: any) => new BookingRoomItemSchema(room));

    this.base_price = String(data.base_price);
    this.discount_amount = String(data.discount_amount);
    this.total_price = String(data.total_price);
    this.currency = data.currency;

    this.payment_option = data.payment_option;
    this.payment_status = data.payment_status;
    this.payment_method = data.payment_method ?? null;

    this.hold_expires_at = data.hold_expires_at ?? null;
    this.confirmed_at = data.confirmed_at ?? null;
    this.cancelled_at = data.cancelled_at ?? null;
    this.cancellation_deadline = data.cancellation_deadline ?? null;
    this.cancellation_reason = data.cancellation_reason ?? null;
    this.admin_notes = data.admin_notes ?? null;

    this.created_at = data.created_at;
    this.updated_at = data.updated_at;

    this.status_history = (data.status_history ?? [])
      .map((entry: any) => new BookingStatusHistorySchema(entry));
  }
}

// ------------------------------------------------------------------ //
// Creazione da back-office — incremento 3                             //
// ------------------------------------------------------------------ //

/**
 * Regole di soggiorno replicate dal backend (`src/config/config.py` e
 * `booking_schema.py`). Servono solo a evitare errori prevedibili: se il
 * backend cambia, decide comunque lui, e il frontend mostra il suo messaggio.
 */
export const BOOKING_RULES = {
  MIN_NIGHTS: 1,
  MAX_NIGHTS: 30,
  MAX_ADVANCE_DAYS: 365,
  MAX_ROOMS: 5,
  MAX_GUESTS: 100,
  NOTES_MAX_LENGTH: 2000,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_LENGTH: 10,
  /** `online_payment_discount_percent`: sconto del pagamento anticipato. */
  PAY_NOW_DISCOUNT_PERCENT: 10,
} as const;

/** Parametri di una ricerca per date — `AvailabilityRequestSchema`. */
export interface StaySearch {
  check_in: string;
  check_out: string;
  guest_count: number;
}

/** Camera libera nell'intervallo — `AvailableRoomSchema`. */
export class AvailableRoomSchema {
  id: string;
  name: string;
  number: number;
  capacity: number;
  price_per_night: string;
  nights: number;
  subtotal: string;
  fits_all_guests: boolean;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.number = data.number;
    this.capacity = data.capacity;
    this.price_per_night = String(data.price_per_night);
    this.nights = data.nights;
    this.subtotal = String(data.subtotal);
    this.fits_all_guests = !!data.fits_all_guests;
  }
}

/** Combinazione minima di camere che ospita tutti — `RoomCombinationSchema`. */
export class RoomCombinationSchema {
  room_ids: string[];
  rooms_count: number;
  total_capacity: number;
  total_price: string;
  wasted_capacity: number;

  constructor(data: any) {
    this.room_ids = [...(data.room_ids ?? [])];
    this.rooms_count = data.rooms_count;
    this.total_capacity = data.total_capacity;
    this.total_price = String(data.total_price);
    this.wasted_capacity = data.wasted_capacity;
  }
}

/** Esito di `GET /bookings/availability`. Le combinazioni arrivano già ordinate. */
export class AvailabilityResponseSchema {
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  rooms: AvailableRoomSchema[];
  suggested_combinations: RoomCombinationSchema[];

  constructor(data: any) {
    this.check_in = data.check_in;
    this.check_out = data.check_out;
    this.nights = data.nights;
    this.guest_count = data.guest_count;
    this.rooms = (data.rooms ?? []).map((room: any) => new AvailableRoomSchema(room));
    this.suggested_combinations = (data.suggested_combinations ?? [])
      .map((combination: any) => new RoomCombinationSchema(combination));
  }
}

/** Richiesta di preventivo — `BookingQuoteRequestSchema`. */
export interface BookingQuoteRequest extends StaySearch {
  room_ids: string[];
  payment_option: PaymentOption;
}

/** Riga del preventivo, una per camera — `PriceLineSchema`. */
export class QuoteLineSchema {
  room_id: string;
  room_name: string;
  unit_price: string;
  nights: number;
  line_total: string;

  constructor(data: any) {
    this.room_id = data.room_id;
    this.room_name = data.room_name;
    this.unit_price = String(data.unit_price);
    this.nights = data.nights;
    this.line_total = String(data.line_total);
  }
}

/**
 * Preventivo — `BookingQuoteResponseSchema`, ridotto a righe e importi.
 * Il `quote_token` non viene letto: la creazione da back-office ricalcola il
 * prezzo da sola e non lo richiede.
 */
export class BookingQuoteSchema {
  nights: number;
  payment_option: PaymentOption;
  lines: QuoteLineSchema[];
  base_price: string;
  discount_amount: string;
  total_price: string;
  currency: string;

  constructor(data: any) {
    this.nights = data.nights;
    this.payment_option = data.payment_option;
    this.lines = (data.lines ?? []).map((line: any) => new QuoteLineSchema(line));
    this.base_price = String(data.base_price);
    this.discount_amount = String(data.discount_amount);
    this.total_price = String(data.total_price);
    this.currency = data.currency;
  }
}

/** Corpo di `POST /admin/bookings/` — `AdminBookingCreateSchema`, intestatario solo ospite. */
export interface AdminBookingCreateRequest extends StaySearch {
  room_ids: string[];
  payment_option: PaymentOption;
  payment_method?: PaymentMethod;
  guest: {
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
  };
  skip_email_confirmation: boolean;
  mark_as_paid: boolean;
  admin_notes?: string;
}
