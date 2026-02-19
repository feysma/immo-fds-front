import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { PropertyService } from '../../core/services/property.service';
import { ContactService } from '../../core/services/contact.service';
import { PropertySummaryResponse } from '../../core/models/property.model';
import { PropertyPlaceholderComponent } from '../../shared/components/property-placeholder/property-placeholder.component';
import { FooterPublicComponent } from '../../shared/components/footer-public/footer-public.component';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: 'Maison',
  APARTMENT: 'Appartement',
  STUDIO: 'Studio',
  LOFT: 'Loft',
  OFFICE: 'Bureau',
  RETAIL_SPACE: 'Commerce',
  WAREHOUSE: 'Entrepôt',
  LAND: 'Terrain',
  GARAGE: 'Garage',
  PARKING_SPOT: 'Parking',
};

@Component({
  selector: 'app-visit-request',
  imports: [ReactiveFormsModule, CurrencyPipe, PropertyPlaceholderComponent, FooterPublicComponent],
  templateUrl: './visit-request.component.html',
  styleUrl: './visit-request.component.scss',
})
export class VisitRequestComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly contactService = inject(ContactService);

  // Query params de la liste (/properties?...) transmis via Router state.
  private listQueryParams: Record<string, string> = {};

  readonly isLoadingProperty = signal(true);
  readonly property = signal<PropertySummaryResponse | null>(null);
  readonly notFound = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly typeLabel = computed(() => {
    const p = this.property();
    return p ? (PROPERTY_TYPE_LABELS[p.propertyType] ?? p.propertyType) : '';
  });

  readonly imageUrl = computed(() => {
    const p = this.property();
    if (!p || p.primaryImageId == null) return null;
    return this.propertyService.getImageUrl(p.reference, p.primaryImageId);
  });

  readonly isSale = computed(() => this.property()?.transactionType === 'SALE');

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName:  ['', [Validators.required, Validators.maxLength(100)]],
    email:     ['', [Validators.required, Validators.email]],
    phone:     [''],
    message:   ['', Validators.maxLength(1000)],
  });

  ngOnInit(): void {
    // Récupère les query params de la liste transmis via Router state.
    // history.state persiste après la fin de la navigation, contrairement à getCurrentNavigation().
    this.listQueryParams = (history.state?.['listQueryParams'] as Record<string, string>) ?? {};

    const reference = this.route.snapshot.paramMap.get('reference');
    if (!reference) {
      this.router.navigate(['/properties']);
      return;
    }

    // On cherche le bien dans les résultats mis en cache par le service,
    // ou on le charge via la recherche (un seul bien par référence).
    this.propertyService.searchProperties({ page: 0, size: 100 }).subscribe({
      next: (page) => {
        const found = page.content.find((p) => p.reference === reference);
        if (found) {
          this.property.set(found);
          this.isLoadingProperty.set(false);
        } else {
          this.notFound.set(true);
          this.isLoadingProperty.set(false);
        }
      },
      error: () => {
        this.notFound.set(true);
        this.isLoadingProperty.set(false);
      },
    });
  }

  fieldInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const reference = this.property()!.reference;
    const v = this.form.getRawValue();

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.contactService.submitVisitRequest({
      firstName:         v.firstName!,
      lastName:          v.lastName!,
      email:             v.email!,
      phone:             v.phone || undefined,
      message:           v.message || undefined,
      propertyReference: reference,
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
    const ref = this.property()?.reference;
    this.router.navigate(ref ? ['/properties', ref] : ['/properties'], {
      state: { listQueryParams: this.listQueryParams },
    });
  }

  goToProperties(): void {
    this.router.navigate(['/properties'], { queryParams: this.listQueryParams });
  }
}
