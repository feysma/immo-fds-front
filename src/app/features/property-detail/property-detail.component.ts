import { Component, OnInit, HostListener, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PropertyService } from '../../core/services/property.service';
import { PropertyDetailResponse } from '../../core/models/property.model';
import { PropertyPlaceholderComponent } from '../../shared/components/property-placeholder/property-placeholder.component';

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

const ENERGY_COLORS: Record<string, string> = {
  A_PLUS_PLUS: 'bg-green-700 text-white',
  A_PLUS: 'bg-green-600 text-white',
  A: 'bg-green-500 text-white',
  B: 'bg-lime-500 text-white',
  C: 'bg-yellow-400 text-gray-900',
  D: 'bg-orange-400 text-white',
  E: 'bg-orange-600 text-white',
  F: 'bg-red-500 text-white',
  G: 'bg-red-700 text-white',
};

@Component({
  selector: 'app-property-detail',
  imports: [CurrencyPipe, DatePipe, PropertyPlaceholderComponent],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.scss',
})
export class PropertyDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly propertyService = inject(PropertyService);

  readonly isLoading = signal(true);
  readonly property = signal<PropertyDetailResponse | null>(null);
  readonly notFound = signal(false);
  readonly activeImageIndex = signal(0);

  readonly typeLabel = computed(() => {
    const p = this.property();
    return p ? (PROPERTY_TYPE_LABELS[p.propertyType] ?? p.propertyType) : '';
  });

  readonly provinceLabel = computed(() => {
    const p = this.property();
    return p ? (PROVINCE_LABELS[p.province] ?? p.province) : '';
  });

  readonly isSale = computed(() => this.property()?.transactionType === 'SALE');

  readonly energyClass = computed(() => {
    const rating = this.property()?.energyRating;
    return rating ? (ENERGY_COLORS[rating] ?? 'bg-gray-400 text-white') : '';
  });

  readonly energyLabel = computed(() => {
    const rating = this.property()?.energyRating;
    if (!rating) return null;
    return rating.replace('_PLUS_PLUS', '++').replace('_PLUS', '+');
  });

  readonly fullAddress = computed(() => {
    const p = this.property();
    if (!p) return '';
    const num = p.number ? ` ${p.number}` : '';
    return `${p.street}${num}, ${p.postalCode} ${p.city}`;
  });

  readonly hasImages = computed(() => (this.property()?.images.length ?? 0) > 0);

  readonly activeImageUrl = computed(() => {
    const p = this.property();
    if (!p || !this.hasImages()) return null;
    const img = p.images[this.activeImageIndex()];
    return this.propertyService.getImageUrl(p.reference, img.id);
  });

  readonly amenities = computed(() => {
    const p = this.property();
    if (!p) return [];
    return [
      { label: 'Jardin', active: p.garden, icon: 'tree' },
      { label: 'Garage', active: p.garage, icon: 'garage' },
      { label: 'Terrasse', active: p.terrace, icon: 'terrace' },
      { label: 'Cave', active: p.basement, icon: 'basement' },
      { label: 'Ascenseur', active: p.elevator, icon: 'elevator' },
      { label: 'Meublé', active: p.furnished, icon: 'furnished' },
    ].filter((a) => a.active);
  });

  ngOnInit(): void {
    const reference = this.route.snapshot.paramMap.get('reference');
    if (!reference) {
      this.router.navigate(['/properties']);
      return;
    }

    this.propertyService.getPropertyByReference(reference).subscribe({
      next: (property) => {
        this.property.set(property);
        this.isLoading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }

  prevImage(): void {
    const count = this.property()?.images.length ?? 0;
    if (count > 1) this.activeImageIndex.update((i) => (i - 1 + count) % count);
  }

  nextImage(): void {
    const count = this.property()?.images.length ?? 0;
    if (count > 1) this.activeImageIndex.update((i) => (i + 1) % count);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const count = this.property()?.images.length ?? 0;
    if (count <= 1) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextImage();
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/properties']);
    }
  }

  getImageUrl(reference: string, imageId: number): string {
    return this.propertyService.getImageUrl(reference, imageId);
  }

  requestVisit(): void {
    // TODO: navigation vers formulaire de visite
  }

  contact(): void {
    // TODO: navigation vers formulaire de contact
  }
}
