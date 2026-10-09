import {Injectable} from '@angular/core';
import {HttpClient, HttpContext, HttpParams} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {Environment} from '../utils/environments';
import {
  AdminBookingCreateRequest,
  BookingDetailSchema,
  BookingSearchFilters,
  PaginatedBookingsSchema,
} from '../schemas/booking-schema';
import {BookingStatus} from '../schemas/booking-enums';
import {SHOWS_OWN_ERRORS} from '../security/interceptor';

/**
 * Accesso alle API amministrative delle prenotazioni (`/admin/bookings`).
 *
 * A differenza degli altri servizi admin non c'è cache `hasLoaded`: l'elenco
 * è paginato e filtrato dal server, quindi si tiene solo la **pagina
 * corrente**, che le operazioni di scrittura aggiorneranno in loco.
 */
@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private apiUrl = Environment.getInstance().apiUrl + '/admin/bookings/';

  private currentPageSubject = new BehaviorSubject<PaginatedBookingsSchema | null>(null);
  public currentPage$ = this.currentPageSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** `GET /admin/bookings/` — elenco filtrato e paginato. */
  searchBookings(filters: BookingSearchFilters): Observable<PaginatedBookingsSchema> {
    return this.http.get<any>(this.apiUrl, {params: this.buildSearchParams(filters)}).pipe(
      map(response => new PaginatedBookingsSchema(response)),
      tap(page => this.currentPageSubject.next(page))
    );
  }

  /**
   * `GET /admin/bookings/{id}` — dettaglio completo con cronologia.
   *
   * Nessuna cache: dagli incrementi successivi la prenotazione cambia
   * mentre l'admin la guarda, e una copia vecchia sarebbe un errore.
   */
  getBooking(id: string): Observable<BookingDetailSchema> {
    return this.http.get<any>(`${this.apiUrl}${encodeURIComponent(id)}`).pipe(
      map(response => new BookingDetailSchema(response))
    );
  }

  /**
   * `POST /admin/bookings/` — crea una prenotazione per conto di un ospite.
   *
   * La risposta contiene anche il `confirmation_token` quando la conferma via
   * email non è saltata: è la credenziale dell'ospite, viaggia solo nella sua
   * email e qui viene scartata, senza mostrarla né registrarla.
   */
  createBooking(request: AdminBookingCreateRequest): Observable<BookingDetailSchema> {
    return this.http.post<any>(this.apiUrl, request).pipe(
      map(response => new BookingDetailSchema(response.booking))
    );
  }

  /**
   * `POST /admin/bookings/{id}/status` — cambio di stato disposto dall'admin.
   *
   * La risposta è la prenotazione aggiornata, cronologia compresa: non serve
   * rileggerla. L'errore lo mostra la scheda accanto ai pulsanti, quindi
   * niente alert globale (`SHOWS_OWN_ERRORS`).
   *
   * La motivazione si invia solo se c'è: il backend la vuole assente, non
   * vuota, quando è facoltativa.
   */
  changeStatus(id: string, newStatus: BookingStatus, reason?: string): Observable<BookingDetailSchema> {
    const body = reason ? {new_status: newStatus, reason} : {new_status: newStatus};
    return this.http.post<any>(`${this.apiUrl}${encodeURIComponent(id)}/status`, body, {
      context: new HttpContext().set(SHOWS_OWN_ERRORS, true),
    }).pipe(
      map(response => new BookingDetailSchema(response))
    );
  }

  /**
   * Converte i filtri in query string, tralasciando i campi vuoti.
   * `status` si ripete una volta per valore, come si aspetta FastAPI.
   */
  private buildSearchParams(filters: BookingSearchFilters): HttpParams {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('page_size', filters.page_size)
      .set('sort', filters.sort);

    for (const status of filters.status ?? []) {
      params = params.append('status', status);
    }

    const optional: Array<[string, string | undefined]> = [
      ['date_from', filters.date_from],
      ['date_to', filters.date_to],
      ['room_id', filters.room_id],
      ['email', filters.email],
      ['code', filters.code],
    ];
    for (const [key, value] of optional) {
      if (value) {
        params = params.set(key, value);
      }
    }

    return params;
  }
}
