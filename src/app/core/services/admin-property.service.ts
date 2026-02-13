import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, delay, tap } from 'rxjs';
import {
  EnumValueResponse,
  PageResponse,
  PropertyDetailResponse,
  PropertySummaryResponse,
} from '../models/property.model';
import { USE_MOCK } from '../mocks/app.mock';
import { getMockPage, MOCK_PROPERTY_TYPES, MOCK_PROVINCES, MOCK_PROPERTIES } from '../mocks/properties.mock';
import { getMockDetail, MOCK_PROPERTY_DETAILS } from '../mocks/property-detail.mock';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/admin/properties`;

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

export interface PropertyUpdateRequest {
  title: string;
  description?: string;
  propertyType: string;
  transactionType: string;
  price: number;
  surface?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rooms?: number | null;
  floors?: number | null;
  constructionYear?: number | null;
  energyRating?: string | null;
  garden: boolean;
  garage: boolean;
  terrace: boolean;
  basement: boolean;
  elevator: boolean;
  furnished: boolean;
  street: string;
  number?: string | null;
  postalCode: string;
  city: string;
  province: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PropertyStatusUpdateRequest {
  status: string;
}

/** Transitions de statut valides selon les règles métier */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:     ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['SOLD', 'RENTED', 'ARCHIVED'],
  SOLD:      ['ARCHIVED'],
  RENTED:    ['ARCHIVED'],
  ARCHIVED:  ['DRAFT'],
};

@Injectable({ providedIn: 'root' })
export class AdminPropertyService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
  }

  // ─── Recherche ────────────────────────────────────────────────────────────
  searchProperties(
    params: AdminPropertySearchParams
  ): Observable<PageResponse<PropertySummaryResponse>> {
    if (USE_MOCK) {
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

  // ─── Détail ───────────────────────────────────────────────────────────────
  getPropertyByReference(reference: string): Observable<PropertyDetailResponse> {
    if (USE_MOCK) {
      const detail = getMockDetail(reference);
      if (!detail) {
        return new Observable((obs) => obs.error({ status: 404, message: 'Bien introuvable' }));
      }
      return of({ ...detail }).pipe(delay(300));
    }
    return this.http.get<PropertyDetailResponse>(`${API_BASE}/${reference}`, {
      headers: this.authHeaders,
    });
  }

  // ─── Mise à jour ─────────────────────────────────────────────────────────
  updateProperty(
    reference: string,
    body: PropertyUpdateRequest
  ): Observable<PropertyDetailResponse> {
    if (USE_MOCK) {
      const idx = MOCK_PROPERTY_DETAILS.findIndex((p) => p.reference === reference);
      if (idx === -1) {
        return new Observable((obs) => obs.error({ status: 404 }));
      }
      const updated: PropertyDetailResponse = {
        ...MOCK_PROPERTY_DETAILS[idx],
        ...body,
        surface: body.surface ?? null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        rooms: body.rooms ?? null,
        floors: body.floors ?? null,
        constructionYear: body.constructionYear ?? null,
        energyRating: body.energyRating ?? null,
        number: body.number ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        updatedAt: new Date().toISOString(),
      };
      // Mise à jour du mock en mémoire
      MOCK_PROPERTY_DETAILS[idx] = updated;
      // Sync du résumé
      const sumIdx = MOCK_PROPERTIES.findIndex((p) => p.reference === reference);
      if (sumIdx !== -1) {
        MOCK_PROPERTIES[sumIdx] = {
          ...MOCK_PROPERTIES[sumIdx],
          title: updated.title,
          propertyType: updated.propertyType,
          transactionType: updated.transactionType,
          price: updated.price,
          surface: updated.surface,
          bedrooms: updated.bedrooms,
          bathrooms: updated.bathrooms,
          city: updated.city,
          province: updated.province,
          energyRating: updated.energyRating,
        };
      }
      return of(updated).pipe(delay(500));
    }
    return this.http.put<PropertyDetailResponse>(`${API_BASE}/${reference}`, body, {
      headers: this.authHeaders,
    });
  }

  // ─── Changement de statut ─────────────────────────────────────────────────
  updateStatus(
    reference: string,
    status: string
  ): Observable<PropertyDetailResponse> {
    if (USE_MOCK) {
      const idx = MOCK_PROPERTY_DETAILS.findIndex((p) => p.reference === reference);
      if (idx === -1) {
        return new Observable((obs) => obs.error({ status: 404 }));
      }
      const updated = { ...MOCK_PROPERTY_DETAILS[idx], status, updatedAt: new Date().toISOString() };
      MOCK_PROPERTY_DETAILS[idx] = updated;
      const sumIdx = MOCK_PROPERTIES.findIndex((p) => p.reference === reference);
      if (sumIdx !== -1) {
        MOCK_PROPERTIES[sumIdx] = { ...MOCK_PROPERTIES[sumIdx], status };
      }
      return of(updated).pipe(delay(300));
    }
    const body: PropertyStatusUpdateRequest = { status };
    return this.http.patch<PropertyDetailResponse>(`${API_BASE}/${reference}/status`, body, {
      headers: this.authHeaders,
    });
  }

  // ─── Suppression (archive) ────────────────────────────────────────────────
  deleteProperty(reference: string): Observable<{ message: string }> {
    if (USE_MOCK) {
      return of({ message: `Le bien ${reference} a été archivé.` }).pipe(
        delay(400),
        tap(() => {
          const idx = MOCK_PROPERTY_DETAILS.findIndex((p) => p.reference === reference);
          if (idx !== -1) MOCK_PROPERTY_DETAILS[idx] = { ...MOCK_PROPERTY_DETAILS[idx], status: 'ARCHIVED' };
          const sumIdx = MOCK_PROPERTIES.findIndex((p) => p.reference === reference);
          if (sumIdx !== -1) MOCK_PROPERTIES[sumIdx] = { ...MOCK_PROPERTIES[sumIdx], status: 'ARCHIVED' };
        })
      );
    }
    return this.http.delete<{ message: string }>(`${API_BASE}/${reference}`, {
      headers: this.authHeaders,
    });
  }

  // ─── Énumérations ─────────────────────────────────────────────────────────
  getPropertyTypes(): Observable<EnumValueResponse[]> {
    if (USE_MOCK) return of(MOCK_PROPERTY_TYPES);
    return this.http.get<EnumValueResponse[]>(
      `${environment.apiBaseUrl}/api/v1/public/properties/types`
    );
  }

  getProvinces(): Observable<EnumValueResponse[]> {
    if (USE_MOCK) return of(MOCK_PROVINCES);
    return this.http.get<EnumValueResponse[]>(
      `${environment.apiBaseUrl}/api/v1/public/properties/provinces`
    );
  }
}
