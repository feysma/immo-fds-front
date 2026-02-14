import {
  Component, OnInit, OnDestroy,
  inject, signal,
  ElementRef, HostListener,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import {
  AdminPropertyService,
  PropertyCreateRequest,
} from '../../../core/services/admin-property.service';
import { EnumValueResponse } from '../../../core/models/property.model';
import {
  AddressAutocompleteService,
  AddressSuggestion,
} from '../../../core/services/address-autocomplete.service';
import { USE_ADDRESS_AUTOCOMPLETE } from '../../../core/mocks/app.mock';

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
export class AdminPropertyNewComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminPropertyService);
  private readonly autocompleteService = inject(AddressAutocompleteService);
  private readonly elementRef = inject(ElementRef);

  // ─── État formulaire ──────────────────────────────────────────────────────
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly propertyTypes = signal<EnumValueResponse[]>([]);
  readonly provinces = signal<EnumValueResponse[]>([]);

  readonly energyRatingOptions = Object.entries(ENERGY_LABELS).map(([value, label]) => ({ value, label }));

  // ─── État autocomplete ────────────────────────────────────────────────────
  readonly autocompleteEnabled = USE_ADDRESS_AUTOCOMPLETE;
  readonly suggestions      = signal<AddressSuggestion[]>([]);
  readonly isSearching      = signal(false);
  readonly showDropdown     = signal(false);

  private readonly streetInput$ = new Subject<string>();
  private readonly destroy$     = new Subject<void>();

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

    if (this.autocompleteEnabled) {
      this.streetInput$
        .pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap((query) => {
            if (query.length < 3) {
              this.suggestions.set([]);
              this.showDropdown.set(false);
              this.isSearching.set(false);
              return EMPTY;
            }
            this.isSearching.set(true);
            this.showDropdown.set(true);
            return this.autocompleteService.search(query);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((results) => {
          this.isSearching.set(false);
          this.suggestions.set(results);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Autocomplete ─────────────────────────────────────────────────────────
  onStreetInput(event: Event): void {
    if (!this.autocompleteEnabled) return;
    this.streetInput$.next((event.target as HTMLInputElement).value);
  }

  selectSuggestion(suggestion: AddressSuggestion): void {
    this.form.patchValue({
      street:     suggestion.road,
      number:     suggestion.houseNumber,
      postalCode: suggestion.postcode,
      city:       suggestion.city,
      province:   suggestion.province ?? '',
      latitude:   suggestion.lat,
      longitude:  suggestion.lon,
    });
    this.showDropdown.set(false);
    this.suggestions.set([]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showDropdown.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showDropdown.set(false);
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
