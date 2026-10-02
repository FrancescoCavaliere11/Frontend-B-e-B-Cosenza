import {inject} from '@angular/core';
import {CanActivateFn, Router, UrlTree} from '@angular/router';
import {map, Observable, of} from 'rxjs';
import {AuthService} from '../service/auth-service';

/**
 * Protegge l'area amministrativa.
 *
 * La verifica vera la fa il backend: ogni endpoint admin risponde 401/403
 * a prescindere da questa guard. Qui si evita soltanto di mostrare una
 * schermata che non potrebbe caricare nulla.
 *
 * - utente già noto e admin → accesso immediato
 * - utente sconosciuto → `GET /users/me` (il cookie HttpOnly non è leggibile da JS)
 * - nessuna sessione o ruolo diverso da admin → `/login`
 */
export const adminGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const loginTree = router.createUrlTree(['/login']);

  const cachedUser = authService.currentUser();
  if (cachedUser?.role === 'admin') {
    return of(true);
  }

  return authService.checkCurrentUser().pipe(
    map(user => (user?.role === 'admin' ? true : loginTree))
  );
};
