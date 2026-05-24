import {Injectable, signal} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {catchError, Observable, of, switchMap, tap} from 'rxjs';
import {Environment} from '../utils/environments';


interface User {
  id: number;
  email: string;
  name: string;
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
