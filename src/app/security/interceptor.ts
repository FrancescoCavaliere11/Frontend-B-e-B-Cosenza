import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {Environment} from '../utils/environments';
import {catchError, throwError} from 'rxjs';
import {AuthService} from '../service/auth-service';
import {inject} from '@angular/core';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.startsWith(Environment.getInstance().apiUrl)) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Sessione scaduta o non valida.');

        authService.currentUser.set(null);

        // todo router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Si è verificato un errore imprevisto.';

      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
      alert(errorMessage)
      return throwError(() => error);
    })
  );
};
