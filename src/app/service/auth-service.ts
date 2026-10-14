import {Injectable, signal} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {catchError, Observable, of, switchMap, tap} from 'rxjs';
import {Environment} from '../utils/environments';
import {SHOWS_OWN_ERRORS} from '../security/interceptor';


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

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);

    return this.http.post(`${this.apiUrl}/token`, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      // La pagina di login mostra da sé i propri errori (401, 429): senza,
      // l'avviso globale ne mostrerebbe un secondo.
      context: new HttpContext().set(SHOWS_OWN_ERRORS, true),
    }).pipe(
      switchMap(() => this.checkCurrentUser())
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
