import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {Environment} from '../utils/environments';
import {
  AvailabilityResponseSchema,
  BookingQuoteRequest,
  BookingQuoteSchema,
  OccupancyResponseSchema,
  StaySearch,
} from '../schemas/booking-schema';

/**
 * Disponibilità e preventivi (`/bookings/availability`, `/bookings/quote`).
 *
 * Sono API **pubbliche**, separate da `BookingService` (area admin): la
 * prenotazione autonoma dell'ospite potrà riusare questo servizio senza
 * dipendere dal back-office. Entrambe valgono solo da oggi in poi e hanno
 * un limite di richieste per IP: chi le chiama deve attendere che l'utente
 * smetta di scrivere e annullare le richieste superate.
 */
@Injectable({
  providedIn: 'root',
})
export class BookingAvailabilityService {
  private apiUrl = Environment.getInstance().apiUrl + '/bookings/';

  constructor(private http: HttpClient) {}

  /** `GET /bookings/availability` — camere libere e combinazioni suggerite. */
  checkAvailability(search: StaySearch): Observable<AvailabilityResponseSchema> {
    const params = new HttpParams()
      .set('check_in', search.check_in)
      .set('check_out', search.check_out)
      .set('guest_count', search.guest_count);

    return this.http.get<any>(`${this.apiUrl}availability`, {params}).pipe(
      map(response => new AvailabilityResponseSchema(response))
    );
  }

  /**
   * `GET /bookings/occupancy` — notti non disponibili per le camere indicate
   * nella finestra `[dateFrom, dateTo)` (al massimo 92 giorni, da oggi).
   * `room_ids` si ripete una volta per camera, come si aspetta FastAPI.
   */
  getOccupancy(roomIds: string[], dateFrom: string, dateTo: string): Observable<OccupancyResponseSchema> {
    let params = new HttpParams().set('date_from', dateFrom).set('date_to', dateTo);
    for (const roomId of roomIds) {
      params = params.append('room_ids', roomId);
    }
    return this.http.get<any>(`${this.apiUrl}occupancy`, {params}).pipe(
      map(response => new OccupancyResponseSchema(response))
    );
  }

  /** `POST /bookings/quote` — importi per camere, date e opzione di pagamento. */
  getQuote(request: BookingQuoteRequest): Observable<BookingQuoteSchema> {
    return this.http.post<any>(`${this.apiUrl}quote`, request).pipe(
      map(response => new BookingQuoteSchema(response))
    );
  }
}
