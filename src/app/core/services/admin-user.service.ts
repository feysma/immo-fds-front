import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { UserResponse } from '../models/auth.model';
import { PageResponse } from '../models/property.model';
import { USE_MOCK } from '../mocks/app.mock';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const API_BASE = `${environment.apiBaseUrl}/api/v1/admin/users`;

export interface AdminUserSearchParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface UserCreateRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface UserUpdateRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  active: boolean;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USERS: UserResponse[] = [
  {
    id: 1,
    email: 'admin@immofds.be',
    firstName: 'Admin',
    lastName: 'ImmoFDS',
    role: 'SUPER_ADMIN',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    email: 'sophie.dupont@immofds.be',
    firstName: 'Sophie',
    lastName: 'Dupont',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 3,
    email: 'marc.leblanc@immofds.be',
    firstName: 'Marc',
    lastName: 'Leblanc',
    role: 'ADMIN',
    active: false,
    createdAt: '2026-01-20T14:00:00Z',
  },
];

let mockUsers = [...MOCK_USERS];
let nextMockId = 4;

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get authHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    return new HttpHeaders({ Authorization: `Bearer ${token ?? ''}` });
  }

  searchUsers(params: AdminUserSearchParams = {}): Observable<PageResponse<UserResponse>> {
    if (USE_MOCK) {
      const page    = params.page ?? 0;
      const size    = params.size ?? 20;
      const sortBy  = params.sortBy  ?? 'createdAt';
      const sortDir = params.sortDir ?? 'desc';

      const sorted = [...mockUsers].sort((a, b) => {
        const va = ((a as unknown) as Record<string, unknown>)[sortBy] as string ?? '';
        const vb = ((b as unknown) as Record<string, unknown>)[sortBy] as string ?? '';
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });

      const content = sorted.slice(page * size, page * size + size);
      return of({
        content,
        page,
        size,
        totalElements: sorted.length,
        totalPages: Math.ceil(sorted.length / size),
        last: (page + 1) * size >= sorted.length,
      }).pipe(delay(300));
    }

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    });
    return this.http.get<PageResponse<UserResponse>>(API_BASE, { params: httpParams, headers: this.authHeaders });
  }

  getUser(id: number): Observable<UserResponse> {
    if (USE_MOCK) {
      const user = mockUsers.find((u) => u.id === id);
      if (!user) return new Observable((obs) => obs.error({ status: 404 }));
      return of({ ...user }).pipe(delay(200));
    }
    return this.http.get<UserResponse>(`${API_BASE}/${id}`, { headers: this.authHeaders });
  }

  createUser(body: UserCreateRequest): Observable<UserResponse> {
    if (USE_MOCK) {
      const newUser: UserResponse = {
        id: nextMockId++,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        active: true,
        createdAt: new Date().toISOString(),
      };
      mockUsers = [...mockUsers, newUser];
      return of({ ...newUser }).pipe(delay(500));
    }
    return this.http.post<UserResponse>(API_BASE, body, { headers: this.authHeaders });
  }

  updateUser(id: number, body: UserUpdateRequest): Observable<UserResponse> {
    if (USE_MOCK) {
      const idx = mockUsers.findIndex((u) => u.id === id);
      if (idx === -1) return new Observable((obs) => obs.error({ status: 404 }));
      mockUsers[idx] = { ...mockUsers[idx], ...body };
      return of({ ...mockUsers[idx] }).pipe(delay(400));
    }
    return this.http.put<UserResponse>(`${API_BASE}/${id}`, body, { headers: this.authHeaders });
  }

  deleteUser(id: number): Observable<{ message: string }> {
    if (USE_MOCK) {
      mockUsers = mockUsers.filter((u) => u.id !== id);
      return of({ message: 'Utilisateur supprimé.' }).pipe(delay(400));
    }
    return this.http.delete<{ message: string }>(`${API_BASE}/${id}`, { headers: this.authHeaders });
  }
}
