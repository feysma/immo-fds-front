import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EnumValueResponse,
  PageResponse,
  PropertySearchParams,
  PropertySummaryResponse,
} from '../models/property.model';

const API_BASE = 'http://localhost:8080/api/v1/public/properties';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly http = inject(HttpClient);

  // Signals pour l'état global de la recherche
  readonly searchParams = signal<PropertySearchParams>({});
  readonly isLoading = signal(false);
  readonly results = signal<PageResponse<PropertySummaryResponse> | null>(null);
  readonly totalResults = computed(() => this.results()?.totalElements ?? 0);

  searchProperties(params: PropertySearchParams): Observable<PageResponse<PropertySummaryResponse>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<PageResponse<PropertySummaryResponse>>(API_BASE, { params: httpParams });
  }

  getPropertyTypes(): Observable<EnumValueResponse[]> {
    return this.http.get<EnumValueResponse[]>(`${API_BASE}/types`);
  }

  getProvinces(): Observable<EnumValueResponse[]> {
    return this.http.get<EnumValueResponse[]>(`${API_BASE}/provinces`);
  }
}
