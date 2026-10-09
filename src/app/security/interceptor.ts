import {HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpStatusCode} from '@angular/common/http';
import {Environment} from '../utils/environments';
import {catchError, throwError} from 'rxjs';
import {AuthService} from '../service/auth-service';
import {inject} from '@angular/core';
import {Router} from '@angular/router';

/**
 * Per le richieste il cui errore la schermata mostra da sé, vicino a ciò che
 * l'ha causato: l'alert globale sarebbe un doppione. Il 401 resta comunque
 * gestito (redirect al login).
 */
export const SHOWS_OWN_ERRORS = new HttpContextToken<boolean>(() => false);

/** Prefisso delle rotte SPA protette da `adminGuard`. */
const ADMIN_AREA_PREFIX = '/admin';

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.startsWith(Environment.getInstance().apiUrl)) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === HttpStatusCode.Unauthorized) {
        console.warn('Sessione scaduta o non valida.');

        authService.currentUser.set(null);

        // Il redirect vale solo per l'area amministrativa: le pagine
        // pubbliche possono ricevere un 401 senza che l'utente debba
        // essere portato al login.
        if (router.url.startsWith(ADMIN_AREA_PREFIX)) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Il 401 è gestito da `withCredentialsInterceptor` (redirect al login)
      // e, sul login, dalla pagina stessa: un alert qui sarebbe un doppione.
      if (error.status === HttpStatusCode.Unauthorized || req.context.get(SHOWS_OWN_ERRORS)) {
        return throwError(() => error);
      }

      alert(errorMessageOf(error));
      return throwError(() => error);
    })
  );
};

/**
 * Testo da mostrare per un errore del backend.
 *
 * Gli errori di dominio hanno `message`; le `HTTPException` di FastAPI (es. il
 * 403 di `RoleChecker`) rispondono invece con `detail`.
 */
export function errorMessageOf(error: HttpErrorResponse): string {
  if (typeof error.error?.message === 'string') return error.error.message;
  if (typeof error.error?.detail === 'string') return error.error.detail;
  return 'Si è verificato un errore imprevisto.';
}
