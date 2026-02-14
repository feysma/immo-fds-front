import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdminPropertyService,
  PropertyCreateRequest,
} from '../../../core/services/admin-property.service';
import { EnumValueResponse } from '../../../core/models/property.model';

const ENERGY_LABELS: Record<string, string> = {
  A_PLUS_PLUS: 'A++', A_PLUS: 'A+', A: 'A', B: 'B',
  C: 'C', D: 'D', E: 'E', F: 'F', G: 'G',
};

@Component({
  selector: 'app-admin-property-new',
  imports: [ReactiveFormsModule],
  templateUrl: './admin-property-new.component.html',
  styleUrl: './admin-property-new.component.scss',
})
export class AdminPropertyNewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminPropertyService);

  // ─── État ─────────────────────────────────────────────────────────────────
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly propertyTypes = signal<EnumValueResponse[]>([]);
  readonly provinces = signal<EnumValueResponse[]>([]);

  readonly energyRatingOptions = Object.entries(ENERGY_LABELS).map(([value, label]) => ({ value, label }));

  // ─── Formulaire ───────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    // Infos principales
    title:           ['', Validators.required],
    description:     [''],
    propertyType:    ['', Validators.required],
    transactionType: ['', Validators.required],
    price:           [null as number | null, [Validators.required, Validators.min(1)]],
    // Caractéristiques
    surface:          [null as number | null],
    bedrooms:         [null as number | null],
    bathrooms:        [null as number | null],
    rooms:            [null as number | null],
    floors:           [null as number | null],
    constructionYear: [null as number | null],
    energyRating:     [''],
    // Équipements (booléens)
    garden:   [false],
    garage:   [false],
    terrace:  [false],
    basement: [false],
    elevator: [false],
    furnished:[false],
    // Localisation
    street:     ['', Validators.required],
    number:     [''],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    city:       ['', Validators.required],
    province:   ['', Validators.required],
    latitude:   [null as number | null],
    longitude:  [null as number | null],
  });

  ngOnInit(): void {
    this.adminService.getPropertyTypes().subscribe((t) => this.propertyTypes.set(t));
    this.adminService.getProvinces().subscribe((p) => this.provinces.set(p));
  }

  // ─── Soumission ───────────────────────────────────────────────────────────
  onSave(): void {
    if (this.form.invalid || this.isSaving()) return;
    this.saveError.set(null);
    this.isSaving.set(true);

    const f = this.form.getRawValue();

    const body: PropertyCreateRequest = {
      title:           f.title!,
      description:     f.description || undefined,
      propertyType:    f.propertyType!,
      transactionType: f.transactionType!,
      price:           f.price!,
      surface:         f.surface,
      bedrooms:        f.bedrooms,
      bathrooms:       f.bathrooms,
      rooms:           f.rooms,
      floors:          f.floors,
      constructionYear:f.constructionYear,
      energyRating:    f.energyRating || null,
      garden:          f.garden!,
      garage:          f.garage!,
      terrace:         f.terrace!,
      basement:        f.basement!,
      elevator:        f.elevator!,
      furnished:       f.furnished!,
      street:          f.street!,
      number:          f.number || null,
      postalCode:      f.postalCode!,
      city:            f.city!,
      province:        f.province!,
      latitude:        f.latitude,
      longitude:       f.longitude,
    };

    this.adminService.createProperty(body).subscribe({
      next: (created) => {
        this.router.navigate(['/admin/properties', created.reference]);
      },
      error: () => {
        this.isSaving.set(false);
        this.saveError.set('Une erreur est survenue lors de la création.');
      },
    });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/admin/properties']);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  hasError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
