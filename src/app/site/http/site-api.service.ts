import {HttpClient, HttpContext} from '@angular/common/http';
import {Injectable, inject} from '@angular/core';
import {Observable, map} from 'rxjs';
import {Environment} from '../../utils/environments';
import {SHOWS_OWN_ERRORS} from '../../security/interceptor';
import {PublicRoom} from '../models/site.models';
import {ExtraServiceSchema} from '../../schemas/extra-service-schema';

/** Contesto di ogni richiesta del sito: gli errori li mostra la pagina. */
export const SITE_HTTP_CONTEXT = new HttpContext().set(SHOWS_OWN_ERRORS, true);

/**
 * Letture pubbliche dei cataloghi (camere, servizi extra).
 *
 * Separato dai service dell'admin, che hanno cache e credenziali proprie
 * del back-office. Le camere arrivano da `GET /room/enabled` (lacuna B1):
 * solo quelle in vendita, già ordinate.
 */
@Injectable({providedIn: 'root'})
export class SiteApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = Environment.getInstance().apiUrl;

  getRooms(): Observable<PublicRoom[]> {
    return this.http.get<PublicRoom[]>(`${this.apiUrl}/room/enabled`, {context: SITE_HTTP_CONTEXT});
  }

  getExtraServices(): Observable<ExtraServiceSchema[]> {
    return this.http.get<unknown[]>(`${this.apiUrl}/extra-service/`, {context: SITE_HTTP_CONTEXT}).pipe(
      map(list => list.map(item => new ExtraServiceSchema(item)))
    );
  }
}
