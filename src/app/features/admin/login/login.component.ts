import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { USE_MOCK } from '../../../core/mocks/app.mock';
import { MOCK_CREDENTIALS } from '../../../core/mocks/auth.mock';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isMock = USE_MOCK;

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  fillMockCredentials(): void {
    this.form.setValue({
      email: MOCK_CREDENTIALS.email,
      password: MOCK_CREDENTIALS.password,
    });
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { email, password } = this.form.getRawValue();

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err?.status === 401) {
          this.errorMessage.set('Email ou mot de passe incorrect.');
        } else {
          this.errorMessage.set('Une erreur est survenue. Veuillez réessayer.');
        }
      },
    });
  }
}
