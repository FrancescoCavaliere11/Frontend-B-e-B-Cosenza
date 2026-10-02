import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, map, Observable, tap} from 'rxjs';
import {Environment} from '../utils/environments';
import {BookingSearchFilters, PaginatedBookingsSchema} from '../schemas/booking-schema';

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
