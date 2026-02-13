import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AdminPropertyService, AdminPropertySearchParams } from '../../../core/services/admin-property.service';
import { PropertyService } from '../../../core/services/property.service';
import { PropertySummaryResponse, EnumValueResponse, PageResponse } from '../../../core/models/property.model';
import { PropertyPlaceholderComponent } from '../../../shared/components/property-placeholder/property-placeholder.component';

/** Labels français pour les statuts */
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publié',
  SOLD: 'Vendu',
  RENTED: 'Loué',
  ARCHIVED: 'Archivé',
};

/** Classes Tailwind pour les badges de statut */
const STATUS_CLASSES: Record<string, string> = {
  DRAFT:     'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  SOLD:      'bg-blue-100 text-blue-700',
  RENTED:    'bg-violet-100 text-violet-700',
  ARCHIVED:  'bg-amber-100 text-amber-700',
};

const TRANSACTION_LABELS: Record<string, string> = {
  SALE: 'Vente',
  RENT: 'Location',
};

@Component({
  selector: 'app-admin-properties',
  imports: [ReactiveFormsModule, CurrencyPipe, PropertyPlaceholderComponent],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.scss',
})
export class AdminPropertiesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly adminPropertyService = inject(AdminPropertyService);
  private readonly propertyService = inject(PropertyService);

  // ─── État ────────────────────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly page = signal<PageResponse<PropertySummaryResponse> | null>(null);
  readonly currentPage = signal(0);

  readonly propertyTypes = signal<EnumValueResponse[]>([]);
  readonly provinces = signal<EnumValueResponse[]>([]);

  readonly totalElements = computed(() => this.page()?.totalElements ?? 0);
  readonly totalPages = computed(() => this.page()?.totalPages ?? 0);
  readonly properties = computed(() => this.page()?.content ?? []);

  // ─── Formulaire de filtres ────────────────────────────────────────────────
  readonly filters = this.fb.group({
    search:          [''],
    propertyType:    [''],
    transactionType: [''],
    status:          [''],
    province:        [''],
    minPrice:        [null as number | null],
    maxPrice:        [null as number | null],
    sortBy:          ['createdAt'],
    sortDir:         ['desc'],
  });

  ngOnInit(): void {
    this.adminPropertyService.getPropertyTypes().subscribe((types) => this.propertyTypes.set(types));
    this.adminPropertyService.getProvinces().subscribe((provinces) => this.provinces.set(provinces));
    this.load();
  }

  // ─── Helpers d'affichage ─────────────────────────────────────────────────
  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'bg-gray-100 text-gray-500';
  }

  transactionLabel(type: string): string {
    return TRANSACTION_LABELS[type] ?? type;
  }

  typeLabel(propertyTypes: EnumValueResponse[], type: string): string {
    return propertyTypes.find((t) => t.value === type)?.label ?? type;
  }

  imageUrl(reference: string, imageId: number): string {
    return this.propertyService.getImageUrl(reference, imageId);
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  // ─── Chargement ──────────────────────────────────────────────────────────
  load(page = this.currentPage()): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    const f = this.filters.value;
    const params: AdminPropertySearchParams = {
      page,
      size: 20,
      sortBy:  f.sortBy  ?? 'createdAt',
      sortDir: (f.sortDir as 'asc' | 'desc') ?? 'desc',
    };

    if (f.propertyType)    params.propertyType    = f.propertyType;
    if (f.transactionType) params.transactionType = f.transactionType;
    if (f.status)          params.status          = f.status;
    if (f.province)        params.province        = f.province;
    if (f.search)          params.city            = f.search;
    if (f.minPrice != null) params.minPrice       = f.minPrice;
    if (f.maxPrice != null) params.maxPrice       = f.maxPrice;

    this.adminPropertyService.searchProperties(params).subscribe({
      next: (res) => {
        this.page.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    this.load(0);
  }

  resetFilters(): void {
    this.filters.reset({
      search: '',
      propertyType: '',
      transactionType: '',
      status: '',
      province: '',
      minPrice: null,
      maxPrice: null,
      sortBy: 'createdAt',
      sortDir: 'desc',
    });
    this.load(0);
  }

  goToPage(p: number): void {
    if (p >= 0 && p < this.totalPages()) {
      this.load(p);
    }
  }

  get pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];
    for (
      let i = Math.max(0, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }
    return range;
  }
}
