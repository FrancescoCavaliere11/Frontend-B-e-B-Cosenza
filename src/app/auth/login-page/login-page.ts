import { Component, signal } from '@angular/core';
import {Router} from '@angular/router';
import {HttpErrorResponse, HttpStatusCode} from '@angular/common/http';
import {errorMessageOf} from '../../security/interceptor';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {passwordStrengthValidator} from '../../validators/validators';
import {AuthService} from '../../service/auth-service';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.html',
  styleUrls: [
    './login-page.css',
    '../../../styles.css',
    '../../../../public/css/typography.css',
    '../../../../public/css/form.css'
  ],
})
export class LoginPage {
  loginForm: FormGroup
  /**
   * Signal e non campo semplice: l'app è zoneless, e un campo cambiato dentro
   * la risposta HTTP non aggiorna la vista. Il pulsante restava disabilitato
   * dopo un login fallito.
   */
  readonly isLoading = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator()]]
    })
  }

  checkIsInvalidEmail(){
    return this.loginForm.get('email')?.touched && this.loginForm.get('email')?.invalid
  }

  checkIsInvalidPassword(){
    return this.loginForm.get('password')?.touched && (this.loginForm.get('password')?.invalid
      || this.loginForm.get('password')?.errors?.['passwordStrength'])
  }

  onSubmit() {
    if(this.isLoading()) return

    if(this.loginForm.invalid){
      this.loginForm.markAllAsTouched()
      return;
    }

    this.isLoading.set(true);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin'], {replaceUrl: true});
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        alert(loginErrorMessage(err));
      }
    });
  }
}

/** Secondi di attesa suggeriti quando il backend non manda `Retry-After`. */
const DEFAULT_RETRY_SECONDS = 15 * 60;

/**
 * Messaggio per un login non riuscito.
 *
 * - 429: troppi tentativi, con i minuti di attesa da `Retry-After` (debito #19);
 * - rete assente: messaggio di connessione;
 * - altro (401 compreso): il messaggio del backend.
 */
export function loginErrorMessage(error: HttpErrorResponse): string {
  if (error.status === HttpStatusCode.TooManyRequests) {
    const seconds = Number(error.headers.get('Retry-After')) || DEFAULT_RETRY_SECONDS;
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return `Troppi tentativi di accesso. Riprova fra ${minutes} ${minutes === 1 ? 'minuto' : 'minuti'}.`;
  }
  if (error.status === 0) return 'Impossibile contattare il server. Controlla la connessione e riprova.';
  return errorMessageOf(error);
}
