import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ContactRequestResponse, PageResponse } from '../models/property.model';
import { USE_MOCK } from '../mocks/app.mock';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/admin/contacts`;

export interface AdminContactSearchParams {
  status?: string;
  type?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface ContactStatusUpdateRequest {
  status: string;
}

export interface ContactNotesUpdateRequest {
  adminNotes?: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CONTACTS: ContactRequestResponse[] = [
  {
    id: 1,
    contactType: 'VISIT_REQUEST',
    status: 'NEW',
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@exemple.be',
    phone: '+32 470 12 34 56',
    message: 'Je souhaite visiter ce bien le week-end si possible.',
    propertyReference: 'IMM-001',
    adminNotes: null,
    createdAt: '2025-02-10T09:15:00Z',
    updatedAt: '2025-02-10T09:15:00Z',
  },
  {
    id: 2,
    contactType: 'GENERAL_CONTACT',
    status: 'IN_PROGRESS',
    firstName: 'Thomas',
    lastName: 'Dubois',
    email: 'thomas.dubois@exemple.be',
    phone: null,
    message: 'Bonjour, est-ce que vous avez des biens disponibles à Liège dans un budget de 250 000 € ?',
    propertyReference: null,
    adminNotes: 'Rappel planifié pour le 15/02.',
    createdAt: '2025-02-08T14:30:00Z',
    updatedAt: '2025-02-09T10:00:00Z',
  },
  {
    id: 3,
    contactType: 'VISIT_REQUEST',
    status: 'CLOSED',
    firstName: 'Isabelle',
    lastName: 'Lecomte',
    email: 'isabelle.lecomte@exemple.be',
    phone: '+32 495 98 76 54',
    message: null,
    propertyReference: 'IMM-004',
    adminNotes: 'Visite effectuée le 05/02. Client intéressé, offre à venir.',
    createdAt: '2025-02-01T11:00:00Z',
    updatedAt: '2025-02-05T16:00:00Z',
  },
  {
    id: 4,
    contactType: 'GENERAL_CONTACT',
    status: 'NEW',
    firstName: 'Marc',
    lastName: 'Renard',
    email: 'marc.renard@exemple.be',
    phone: '+32 471 55 44 33',
    message: 'Je cherche à vendre ma maison à Waterloo. Pouvez-vous m\'estimer le bien ?',
    propertyReference: null,
    adminNotes: null,
    createdAt: '2025-02-12T16:45:00Z',
    updatedAt: '2025-02-12T16:45:00Z',
  },
  {
    id: 5,
    contactType: 'VISIT_REQUEST',
    status: 'IN_PROGRESS',
    firstName: 'Amélie',
    lastName: 'Fontaine',
    email: 'amelie.fontaine@exemple.be',
    phone: null,
    message: 'Disponible en semaine à partir de 17h ou le samedi matin.',
    propertyReference: 'IMM-002',
    adminNotes: 'Visite prévue le 18/02 à 17h30.',
    createdAt: '2025-02-11T10:20:00Z',
    updatedAt: '2025-02-11T15:00:00Z',
  },
];

let mockContacts = [...MOCK_CONTACTS];

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminContactService {
  private readonly http = inject(HttpClient);

  searchContacts(params: AdminContactSearchParams = {}): Observable<PageResponse<ContactRequestResponse>> {
    if (USE_MOCK) {
      const page = params.page ?? 0;
      const size = params.size ?? 20;

      let filtered = [...mockContacts];
      if (params.status) filtered = filtered.filter((c) => c.status === params.status);
      if (params.type)   filtered = filtered.filter((c) => c.contactType === params.type);

      const sortBy  = params.sortBy  ?? 'createdAt';
      const sortDir = params.sortDir ?? 'desc';
      filtered.sort((a, b) => {
        const va = ((a as unknown) as Record<string, unknown>)[sortBy] as string ?? '';
        const vb = ((b as unknown) as Record<string, unknown>)[sortBy] as string ?? '';
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });

      const content = filtered.slice(page * size, page * size + size);
      return of({
        content,
        page,
        size,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        last: (page + 1) * size >= filtered.length,
      }).pipe(delay(300));
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<PageResponse<ContactRequestResponse>>(API_BASE, { params: httpParams });
  }

  getContact(id: number): Observable<ContactRequestResponse> {
    if (USE_MOCK) {
      const contact = mockContacts.find((c) => c.id === id);
      if (!contact) return new Observable((obs) => obs.error({ status: 404 }));
      return of({ ...contact }).pipe(delay(200));
    }
    return this.http.get<ContactRequestResponse>(`${API_BASE}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<ContactRequestResponse> {
    if (USE_MOCK) {
      const idx = mockContacts.findIndex((c) => c.id === id);
      if (idx === -1) return new Observable((obs) => obs.error({ status: 404 }));
      mockContacts[idx] = { ...mockContacts[idx], status, updatedAt: new Date().toISOString() };
      return of({ ...mockContacts[idx] }).pipe(delay(300));
    }
    return this.http.patch<ContactRequestResponse>(`${API_BASE}/${id}/status`, { status });
  }

  updateNotes(id: number, adminNotes: string): Observable<ContactRequestResponse> {
    if (USE_MOCK) {
      const idx = mockContacts.findIndex((c) => c.id === id);
      if (idx === -1) return new Observable((obs) => obs.error({ status: 404 }));
      mockContacts[idx] = { ...mockContacts[idx], adminNotes, updatedAt: new Date().toISOString() };
      return of({ ...mockContacts[idx] }).pipe(delay(300));
    }
    return this.http.patch<ContactRequestResponse>(`${API_BASE}/${id}/notes`, { adminNotes });
  }
}
