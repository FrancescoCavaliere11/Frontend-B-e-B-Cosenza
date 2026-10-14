import {HttpContextToken, HttpErrorResponse, HttpInterceptorFn, HttpStatusCode} from '@angular/common/http';
import {Environment} from '../utils/environments';
import {catchError, of, switchMap, throwError} from 'rxjs';
import {AuthService} from '../service/auth-service';
import {inject} from '@angular/core';
import {Router} from '@angular/router';

/**
 * Per le richieste il cui errore la schermata mostra da sé, vicino a ciò che
 * l'ha causato: l'alert globale sarebbe un doppione. Il 401 resta comunque
 * gestito (redirect al login).
 */
export const SHOWS_OWN_ERRORS = new HttpContextToken<boolean>(() => false);

/**
 * Richieste che non devono tentare il rinnovo della sessione su un 401: login,
 * rinnovo e logout. Senza, un refresh fallito ne chiederebbe un altro.
 */
export const SKIP_SESSION_REFRESH = new HttpContextToken<boolean>(() => false);

/** Prefisso delle rotte SPA protette da `adminGuard`. */
const ADMIN_AREA_PREFIX = '/admin';

/** Pagina di accesso all'area admin. */
const LOGIN_PAGE = '/login';

/**
 * L'alert globale è un comportamento del back-office. Il sito pubblico
 * mostra ogni errore dentro la pagina, vicino a ciò che l'ha causato.
 */
function usesGlobalAlert(url: string): boolean {
  return url.startsWith(ADMIN_AREA_PREFIX) || url.startsWith(LOGIN_PAGE);
}

export const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.startsWith(Environment.getInstance().apiUrl)) {
    req = req.clone({
      withCredentials: true
    });
  }

  /** Sessione finita davvero: utente dimenticato e, nell'area admin, ritorno al login. */
  const endSession = (): void => {
    authService.currentUser.set(null);
    // Il redirect vale solo per l'area amministrativa: le pagine pubbliche
    // possono ricevere un 401 senza che l'utente debba essere portato al login.
    if (router.url.startsWith(ADMIN_AREA_PREFIX)) {
      router.navigate(['/login']);
    }
  };

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== HttpStatusCode.Unauthorized) return throwError(() => error);
      if (req.context.get(SKIP_SESSION_REFRESH)) {
        endSession();
        return throwError(() => error);
      }

      // L'access token dura 15 minuti: si rinnova la sessione (un solo rinnovo
      // condiviso da tutte le richieste in corso) e si ripete la richiesta.
      // Anche se il rinnovo fallisce la si ripete una volta: un'altra scheda
      // potrebbe aver appena rinnovato, e i cookie sono già quelli nuovi.
      return authService.refreshSession().pipe(
        catchError(() => of(undefined)),
        switchMap(() => next(req)),
        catchError((retryError: HttpErrorResponse) => {
          if (retryError.status === HttpStatusCode.Unauthorized) endSession();
          return throwError(() => retryError);
        }),
      );
    })
  );
};


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Il 401 è gestito da `withCredentialsInterceptor` (redirect al login)
      // e, sul login, dalla pagina stessa: un alert qui sarebbe un doppione.
      if (
        error.status === HttpStatusCode.Unauthorized
        || req.context.get(SHOWS_OWN_ERRORS)
        || !usesGlobalAlert(router.url)
      ) {
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
