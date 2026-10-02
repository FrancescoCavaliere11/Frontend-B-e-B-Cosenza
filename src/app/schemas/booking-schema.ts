import {BookingSortOrder, BookingStatus, PaymentStatus} from './booking-enums';

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
