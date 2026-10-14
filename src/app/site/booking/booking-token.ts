import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';

/** Nome del parametro dei link email (`email_service.py`: `?token=`). */
export const TOKEN_QUERY_PARAM = 'token';

/**
 * Legge il token del link email e lo toglie subito dall'indirizzo:
 * così non resta nella cronologia né finisce nel `Referer` di altre pagine
 * (`booking_api.md` §3.5). Il token viaggia poi solo nel body delle POST.
 *
 * Resta **solo in memoria**, non in `sessionStorage`: ricaricando la pagina va
 * riaperto il link. Scelta del 14/10/2026: salvarlo avrebbe permesso a chi usa
 * dopo di noi un computer condiviso di riaprire la scheda chiusa e gestire la
 * prenotazione.
 */
export function takeTokenFromUrl(route: ActivatedRoute, location: Location): string | null {
  const token = route.snapshot.queryParamMap.get(TOKEN_QUERY_PARAM);
  if (token) location.replaceState(location.path().split('?')[0]);
  return token;
}
