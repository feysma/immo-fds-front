import { Component, input, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PropertySummaryResponse } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';
import { PropertyPlaceholderComponent } from '../property-placeholder/property-placeholder.component';

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
  selector: 'app-property-card',
  imports: [CurrencyPipe, PropertyPlaceholderComponent],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly propertyService = inject(PropertyService);

  readonly property = input.required<PropertySummaryResponse>();

  get imageUrl(): string | null {
    const p = this.property();
    if (p.primaryImageId == null) return null;
    return this.propertyService.getImageUrl(p.reference, p.primaryImageId);
  }

  get typeLabel(): string {
    return PROPERTY_TYPE_LABELS[this.property().propertyType] ?? this.property().propertyType;
  }

  get isSale(): boolean {
    return this.property().transactionType === 'SALE';
  }

  get priceLabel(): string {
    const p = this.property();
    if (p.transactionType === 'RENT') return '/mois';
    return '';
  }

  navigateToDetail(): void {
    // Passe les query params courants dans le Router state pour que
    // les pages suivantes (detail, visit-request) puissent reconstituer
    // le lien de retour vers la liste avec ses filtres.
    const listQueryParams = this.route.snapshot.queryParams;
    this.router.navigate(['/properties', this.property().reference], {
      state: { listQueryParams },
    });
  }
}
