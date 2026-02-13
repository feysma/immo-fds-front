import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import {
  EnumValueResponse,
  PageResponse,
  PropertySummaryResponse,
} from '../models/property.model';
import { USE_MOCK } from '../mocks/app.mock';
import { getMockPage, MOCK_PROPERTY_TYPES, MOCK_PROVINCES } from '../mocks/properties.mock';
import { AuthService } from './auth.service';

const API_BASE = 'http://localhost:8080/api/v1/admin/properties';

export interface AdminPropertySearchParams {
  propertyType?: string;
  transactionType?: string;
  status?: string;
  province?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

@Injectable({ providedIn: 'root' })
export class AdminPropertyService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
  }

  searchProperties(
    params: AdminPropertySearchParams
  ): Observable<PageResponse<PropertySummaryResponse>> {
    if (USE_MOCK) {
      // Réutilise le mock public mais sans filtre de statut
      // (l'admin voit tous les statuts)
      return of(getMockPage({ ...params, size: params.size ?? 20 })).pipe(delay(300));
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<PageResponse<PropertySummaryResponse>>(API_BASE, {
      params: httpParams,
      headers: this.authHeaders,
    });
  }

  getPropertyTypes(): Observable<EnumValueResponse[]> {
    if (USE_MOCK) return of(MOCK_PROPERTY_TYPES);
    return this.http.get<EnumValueResponse[]>(
      'http://localhost:8080/api/v1/public/properties/types'
    );
  }

  getProvinces(): Observable<EnumValueResponse[]> {
    if (USE_MOCK) return of(MOCK_PROVINCES);
    return this.http.get<EnumValueResponse[]>(
      'http://localhost:8080/api/v1/public/properties/provinces'
    );
  }
}
