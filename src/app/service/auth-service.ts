import {Injectable, signal} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {catchError, finalize, map, Observable, of, shareReplay, switchMap, tap} from 'rxjs';
import {Environment} from '../utils/environments';
import {SHOWS_OWN_ERRORS, SKIP_SESSION_REFRESH} from '../security/interceptor';


interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${Environment.getInstance().apiUrl}/auth`;

  currentUser = signal<User | null>(null);

  /** Rinnovo in corso, condiviso: più richieste scadute insieme ne fanno partire uno solo. */
  private refreshInFlight$: Observable<void> | null = null;

  constructor(private http: HttpClient) {}

  /** Richieste di autenticazione: errori mostrati dalla pagina, nessun rinnovo automatico. */
  private authContext(): HttpContext {
    return new HttpContext().set(SHOWS_OWN_ERRORS, true).set(SKIP_SESSION_REFRESH, true);
  }

  login(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http.post(`${this.apiUrl}/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // La pagina di login mostra da sé i propri errori (401, 429): senza,
      // l'avviso globale ne mostrerebbe un secondo.
      context: this.authContext(),
    }).pipe(
      switchMap(() => this.checkCurrentUser())
    );
  }

  /**
   * Rinnova la sessione (`POST /auth/refresh`): il backend revoca la coppia di
   * token vecchia ed emette quella nuova nei cookie (debito #30).
   *
   * Un solo rinnovo alla volta: un secondo rinnovo con lo stesso refresh token
   * verrebbe respinto come riuso.
   */
  refreshSession(): Observable<void> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<unknown>(`${this.apiUrl}/refresh`, null, {context: this.authContext()}).pipe(
        map(() => undefined),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay(1),
      );
    }
    return this.refreshInFlight$;
  }

  /**
   * Esce: il backend revoca i token e cancella i cookie. L'utente viene
   * dimenticato anche se la chiamata fallisce: restare «dentro» dopo aver
   * premuto «Esci» sarebbe peggio.
   */
  logout(): Observable<void> {
    return this.http.post<unknown>(`${this.apiUrl}/logout`, null, {context: this.authContext()}).pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this.currentUser.set(null)),
    );
  }

  checkCurrentUser(): Observable<User | null> {
    return this.http.get<User>(`${Environment.getInstance().apiUrl}/users/me`).pipe(
      tap(user => {
        this.currentUser.set(user);
      }),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }
}
