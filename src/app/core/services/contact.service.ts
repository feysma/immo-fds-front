import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { ContactRequestResponse, VisitRequestDto } from '../models/property.model';
import { USE_MOCK } from '../mocks/app.mock';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/public/contacts`;

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  submitVisitRequest(dto: VisitRequestDto): Observable<ContactRequestResponse> {
    if (USE_MOCK) {
      const mock: ContactRequestResponse = {
        id: Math.floor(Math.random() * 10000),
        contactType: 'VISIT_REQUEST',
        status: 'NEW',
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone ?? null,
        message: dto.message ?? null,
        propertyReference: dto.propertyReference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return of(mock).pipe(delay(600));
    }
    return this.http.post<ContactRequestResponse>(`${API_BASE}/visit-request`, dto);
  }
}
