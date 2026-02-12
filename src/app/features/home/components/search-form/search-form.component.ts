import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyService } from '../../../../core/services/property.service';
import { PropertySearchParams } from '../../../../core/models/property.model';

const TRANSACTION_OPTIONS = [
  { value: 'SALE', label: 'Acheter' },
  { value: 'RENT', label: 'Louer' },
] as const;

const PROPERTY_TYPE_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'HOUSE', label: 'Maison' },
  { value: 'APARTMENT', label: 'Appartement' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'LOFT', label: 'Loft' },
  { value: 'OFFICE', label: 'Bureau' },
  { value: 'RETAIL_SPACE', label: 'Commerce' },
  { value: 'LAND', label: 'Terrain' },
  { value: 'GARAGE', label: 'Garage' },
] as const;

const PROVINCE_OPTIONS = [
  { value: '', label: 'Toute la Belgique' },
  { value: 'BRUXELLES_CAPITALE', label: 'Bruxelles-Capitale' },
  { value: 'BRABANT_WALLON', label: 'Brabant wallon' },
  { value: 'BRABANT_FLAMAND', label: 'Brabant flamand' },
  { value: 'ANVERS', label: 'Anvers' },
  { value: 'LIMBOURG', label: 'Limbourg' },
  { value: 'LIEGE', label: 'Liège' },
  { value: 'NAMUR', label: 'Namur' },
  { value: 'HAINAUT', label: 'Hainaut' },
  { value: 'LUXEMBOURG', label: 'Luxembourg' },
  { value: 'FLANDRE_OCCIDENTALE', label: 'Flandre occidentale' },
  { value: 'FLANDRE_ORIENTALE', label: 'Flandre orientale' },
] as const;

@Component({
  selector: 'app-search-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.scss',
})
export class SearchFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);

  readonly transactionOptions = TRANSACTION_OPTIONS;
  readonly propertyTypeOptions = PROPERTY_TYPE_OPTIONS;
  readonly provinceOptions = PROVINCE_OPTIONS;

  readonly showAdvanced = signal(false);

  readonly form = this.fb.group({
    transactionType: ['SALE', Validators.required],
    propertyType: [''],
    province: [''],
    city: [''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    minBedrooms: [null as number | null],
  });

  ngOnInit(): void {
    // Pré-remplir avec les derniers paramètres si on revient de la page résultats
    const existing = this.propertyService.searchParams();
    if (Object.keys(existing).length > 0) {
      this.form.patchValue(existing as any);
      if (existing.minPrice || existing.maxPrice || existing.minBedrooms) {
        this.showAdvanced.set(true);
      }
    }
  }

  toggleAdvanced(): void {
    this.showAdvanced.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const params: PropertySearchParams = {
      transactionType: (raw.transactionType as any) || undefined,
      propertyType: raw.propertyType ? (raw.propertyType as any) : undefined,
      province: raw.province ? (raw.province as any) : undefined,
      city: raw.city?.trim() || undefined,
      minPrice: raw.minPrice ?? undefined,
      maxPrice: raw.maxPrice ?? undefined,
      minBedrooms: raw.minBedrooms ?? undefined,
    };

    // Nettoyage des valeurs undefined
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = String(v);
      }
    });

    this.propertyService.searchParams.set(params);

    // Navigation vers la page résultats avec query params
    this.router.navigate(['/properties'], { queryParams: cleanParams });
  }

  resetForm(): void {
    this.form.reset({ transactionType: 'SALE' });
    this.showAdvanced.set(false);
    this.propertyService.searchParams.set({});
  }
}
