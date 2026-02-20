import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, tap, catchError, throwError } from 'rxjs';
import { USE_MOCK } from '../mocks/app.mock';
import { MOCK_CREDENTIALS } from '../mocks/auth.mock';
import { AuthResponse, LoginRequest, UserResponse } from '../models/auth.model';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/auth`;
const STORAGE_KEY_ACCESS = 'immo_access_token';
const STORAGE_KEY_REFRESH = 'immo_refresh_token';
const STORAGE_KEY_USER = 'immo_user';

const MOCK_ADMIN_USER: UserResponse = {
  id: 1,
  email: MOCK_CREDENTIALS.email,
  firstName: 'Admin',
  lastName: 'ImmoFDS',
  role: 'SUPER_ADMIN',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
};

const MOCK_AUTH_RESPONSE: AuthResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  tokenType: 'Bearer',
  expiresIn: 900,
  user: MOCK_ADMIN_USER,
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly currentUser = signal<UserResponse | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const userJson = localStorage.getItem(STORAGE_KEY_USER);
      const accessToken = localStorage.getItem(STORAGE_KEY_ACCESS);
      if (userJson && accessToken) {
        this.currentUser.set(JSON.parse(userJson));
      }
    } catch {
      this.clearStorage();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    if (USE_MOCK) {
      if (email === MOCK_CREDENTIALS.email && password === MOCK_CREDENTIALS.password) {
        return of(MOCK_AUTH_RESPONSE).pipe(
          delay(600),
          tap((res) => this.handleAuthSuccess(res))
        );
      }
      return of(null).pipe(
        delay(600),
        // Simule une erreur 401
        tap(() => { throw Object.assign(new Error('Identifiants incorrects'), { status: 401 }); })
      ) as unknown as Observable<AuthResponse>;
    }

    const body: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${API_BASE}/login`, body).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem(STORAGE_KEY_REFRESH);
    if (refreshToken && !USE_MOCK) {
      // Best-effort : on ne bloque pas sur l'erreur
      this.http
        .post(`${API_BASE}/logout`, { refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clearStorage();
    this.currentUser.set(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_ACCESS);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_REFRESH);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http
      .post<AuthResponse>(`${API_BASE}/refresh`, { refreshToken })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY_ACCESS, res.accessToken);
    localStorage.setItem(STORAGE_KEY_REFRESH, res.refreshToken);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(res.user));
    this.currentUser.set(res.user);
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
    localStorage.removeItem(STORAGE_KEY_USER);
  }
}
