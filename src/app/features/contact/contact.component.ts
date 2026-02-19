import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { FooterPublicComponent } from '../../shared/components/footer-public/footer-public.component';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, FooterPublicComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  // Query params de la liste transmis via Router state (pour restaurer les filtres au retour).
  private listQueryParams: Record<string, string> = {};
  // Référence du bien contextuel (si on vient de la page détail).
  readonly fromPropertyReference = signal<string | null>(null);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName:  ['', [Validators.required, Validators.maxLength(100)]],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    message:   ['', [Validators.required, Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    const state = history.state as Record<string, unknown> | undefined;
    this.listQueryParams = (state?.['listQueryParams'] as Record<string, string>) ?? {};
    this.fromPropertyReference.set((state?.['fromPropertyReference'] as string) ?? null);
  }

  fieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) return;

    const v = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.contactService.submitGeneralContact({
      firstName: v.firstName!,
      lastName:  v.lastName!,
      email:     v.email!,
      phone:     v.phone || undefined,
      message:   v.message!,
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set('Une erreur est survenue. Veuillez réessayer.');
      },
    });
  }

  goBack(): void {
    const ref = this.fromPropertyReference();
    if (ref) {
      this.router.navigate(['/properties', ref], {
        state: { listQueryParams: this.listQueryParams },
      });
    } else {
      this.router.navigate(['/properties'], { queryParams: this.listQueryParams });
    }
  }

  goToProperties(): void {
    this.router.navigate(['/properties'], { queryParams: this.listQueryParams });
  }
}
