import { Component } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {passwordStrengthValidator} from '../../../validators/validators';
import {AuthService} from '../../../service/auth-service';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css', '../../../../styles.css'],
})
export class LoginPage {
  loginForm: FormGroup
  isLoading = false

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordStrengthValidator()]]
    })
  }

  checkIsValidEmail(){
    return this.loginForm.get('email')?.touched && this.loginForm.get('email')?.invalid
  }

  checkIsValidPassword(){
    return this.loginForm.get('password')?.touched && (this.loginForm.get('password')?.invalid
      || this.loginForm.get('password')?.errors?.['passwordStrength'])
  }

  onSubmit() {
    if(this.isLoading) return

    if(this.loginForm.invalid){
      this.loginForm.markAllAsTouched()
      return;
    }

    this.isLoading = true;

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: (user) => {
        console.log("Login completato con successo per:", user);

        this.isLoading = false;
        // todo this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;

        if (err.status === 401) {
          alert(err.error?.detail || 'Credenziali non valide.')
        } else {
          alert('Errore di connessione. Riprova più tardi.')
        }
        console.error("Errore durante il login:", err);
      }
    });
  }
}
