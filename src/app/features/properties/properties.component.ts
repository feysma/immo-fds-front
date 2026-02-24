import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PropertyService } from '../../core/services/property.service';
import { PropertySearchParams, PropertySummaryResponse } from '../../core/models/property.model';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { FooterPublicComponent } from '../../shared/components/footer-public/footer-public.component';
import { environment } from '../../../environments/environment';

// Types GeoJSON inline — évite une dépendance explicite sur @types/geojson
type GeoPolygon = { type: 'Polygon'; coordinates: number[][][] };
type GeoMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };
type IsoPolygon = GeoPolygon | GeoMultiPolygon;

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
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly propertyService = inject(PropertyService);

  readonly mapboxToken = environment.mapboxAccessToken;

  readonly sortOptions = SORT_OPTIONS;
  readonly isLoading = signal(false);
  readonly properties = signal<PropertySummaryResponse[]>([]);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly currentParams = signal<PropertySearchParams>({});

  /** Polygone isochrone actif (null = pas de filtre géographique) */
  readonly isochronePolygon = signal<IsoPolygon | null>(null);

  readonly sortForm = this.fb.group({ sort: ['createdAt_desc'] });

  readonly isIsochroneActive = computed(() => this.isochronePolygon() !== null);

  /** Biens filtrés par le polygone isochrone côté client */
  readonly filteredProperties = computed(() => {
    const poly = this.isochronePolygon();
    const props = this.properties();
    if (!poly) return props;
    return props.filter(
      p => p.latitude != null && p.longitude != null &&
           this.pointInPolygon([p.longitude!, p.latitude!], poly)
    );
  });

  /** Compteur affiché : résultats filtrés si isochrone actif, sinon total API */
  readonly displayCount = computed(() =>
    this.isIsochroneActive() ? this.filteredProperties().length : this.totalElements()
  );

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
    // Import dynamique : le widget reste hors du bundle initial (~1.8 MB économisés)
    import('../../../../iso-search/isochrone-search.es.js');

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

    this.sortForm.get('sort')!.valueChanges.subscribe(() => {
      const params = { ...this.currentParams(), page: 0 };
      this.currentPage.set(0);
      this.load(params);
    });
  }

  onIsochroneChanged(event: Event): void {
    const { polygon } = (event as CustomEvent).detail as { polygon: IsoPolygon | null };
    this.isochronePolygon.set(polygon ?? null);
  }

  onIsochroneCleared(): void {
    this.isochronePolygon.set(null);
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

  // ── Point-in-polygon (ray-casting) ──────────────────────────────────────────

  private isPointInRing(point: [number, number], ring: number[][]): boolean {
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1];
      const xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  private pointInPolygon(point: [number, number], polygon: IsoPolygon): boolean {
    if (polygon.type === 'Polygon') {
      return this.isPointInRing(point, polygon.coordinates[0]);
    }
    // MultiPolygon : le point est dedans si au moins un polygone le contient
    return polygon.coordinates.some(poly => this.isPointInRing(point, poly[0]));
  }
}
