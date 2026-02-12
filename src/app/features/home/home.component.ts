import { Component, inject, signal } from '@angular/core';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { PropertyService } from '../../core/services/property.service';
import { PropertySearchParams } from '../../core/models/property.model';

@Component({
  selector: 'app-home',
  imports: [SearchFormComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly propertyService = inject(PropertyService);

  readonly stats = [
    { value: '500+', label: 'Biens disponibles' },
    { value: '11', label: 'Provinces couvertes' },
    { value: '98%', label: 'Clients satisfaits' },
  ];

  readonly isLoading = this.propertyService.isLoading;
  readonly totalResults = this.propertyService.totalResults;
  readonly lastSearchParams = signal<PropertySearchParams | null>(null);

  onSearch(params: PropertySearchParams): void {
    this.lastSearchParams.set(params);
    this.propertyService.isLoading.set(true);

    this.propertyService.searchProperties(params).subscribe({
      next: (page) => {
        this.propertyService.results.set(page);
        this.propertyService.isLoading.set(false);
      },
      error: () => {
        this.propertyService.isLoading.set(false);
      },
    });
  }
}
