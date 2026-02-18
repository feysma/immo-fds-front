import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { PropertySearchParams, PropertySummaryResponse } from '../../core/models/property.model';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { FooterPublicComponent } from '../../shared/components/footer-public/footer-public.component';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Plus récent' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'surface_desc', label: 'Surface décroissante' },
] as const;

const TRANSACTION_LABELS: Record<string, string> = {
  SALE: 'Vente',
  RENT: 'Location',
};

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

const PROVINCE_LABELS: Record<string, string> = {
  BRUXELLES_CAPITALE: 'Bruxelles-Capitale',
  BRABANT_WALLON: 'Brabant wallon',
  BRABANT_FLAMAND: 'Brabant flamand',
  ANVERS: 'Anvers',
  LIMBOURG: 'Limbourg',
  LIEGE: 'Liège',
  NAMUR: 'Namur',
  HAINAUT: 'Hainaut',
  LUXEMBOURG: 'Luxembourg',
  FLANDRE_OCCIDENTALE: 'Flandre occidentale',
  FLANDRE_ORIENTALE: 'Flandre orientale',
};

@Component({
  selector: 'app-properties',
  imports: [ReactiveFormsModule, PropertyCardComponent, FooterPublicComponent],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);

  readonly sortOptions = SORT_OPTIONS;
  readonly isLoading = signal(false);
  readonly properties = signal<PropertySummaryResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly currentParams = signal<PropertySearchParams>({});

  readonly sortForm = this.fb.group({ sort: ['createdAt_desc'] });

  readonly activeFilters = computed(() => {
    const p = this.currentParams();
    const filters: string[] = [];
    if (p.transactionType) filters.push(TRANSACTION_LABELS[p.transactionType] ?? p.transactionType);
    if (p.propertyType) filters.push(PROPERTY_TYPE_LABELS[p.propertyType] ?? p.propertyType);
    if (p.province) filters.push(PROVINCE_LABELS[p.province] ?? p.province);
    if (p.city) filters.push(p.city);
    if (p.minPrice != null) filters.push(`min ${p.minPrice.toLocaleString('fr-BE')} €`);
    if (p.maxPrice != null) filters.push(`max ${p.maxPrice.toLocaleString('fr-BE')} €`);
    if (p.minBedrooms != null) filters.push(`${p.minBedrooms}+ ch.`);
    return filters;
  });

  ngOnInit(): void {
    // Lire les paramètres de recherche depuis les query params de l'URL
    this.route.queryParams.subscribe((qp) => {
      const params: PropertySearchParams = {
        transactionType: (qp['transactionType'] as any) || undefined,
        propertyType: (qp['propertyType'] as any) || undefined,
        province: (qp['province'] as any) || undefined,
        city: qp['city'] || undefined,
        minPrice: qp['minPrice'] ? +qp['minPrice'] : undefined,
        maxPrice: qp['maxPrice'] ? +qp['maxPrice'] : undefined,
        minBedrooms: qp['minBedrooms'] ? +qp['minBedrooms'] : undefined,
        page: qp['page'] ? +qp['page'] : 0,
        size: 12,
      };
      this.currentPage.set(params.page ?? 0);
      this.currentParams.set(params);
      this.load(params);
    });

    // Rechargement au changement de tri — recharge avec les params courants, page 0
    this.sortForm.get('sort')!.valueChanges.subscribe(() => {
      const params = { ...this.currentParams(), page: 0 };
      this.currentPage.set(0);
      this.load(params);
    });
  }

  private load(params: PropertySearchParams): void {
    const [sortBy, sortDir] = (this.sortForm.get('sort')!.value ?? 'createdAt_desc').split('_');
    this.isLoading.set(true);
    this.propertyService
      .searchProperties({ ...params, sortBy, sortDir: sortDir as 'asc' | 'desc' })
      .subscribe({
        next: (page) => {
          this.properties.set(page.content);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  goToPage(page: number): void {
    const qp = { ...this.route.snapshot.queryParams, page: page > 0 ? page : undefined };
    this.router.navigate([], { queryParams: qp, queryParamsHandling: 'merge' });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i);
  }
}
