import { Component, input, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PropertySummaryResponse } from '../../../core/models/property.model';
import { PropertyService } from '../../../core/services/property.service';

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
  imports: [CurrencyPipe],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.scss',
})
export class PropertyCardComponent {
  private readonly router = inject(Router);
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
    this.router.navigate(['/properties', this.property().reference]);
  }
}
