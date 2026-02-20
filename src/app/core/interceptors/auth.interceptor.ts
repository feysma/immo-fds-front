import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError, BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { USE_MOCK } from '../mocks/app.mock';

// Requêtes admin uniquement
const ADMIN_PATH = '/api/v1/admin/';

// ── State de refresh partagé (évite les appels refresh en rafale) ─────────────
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<any> => {
  // En mode mock ou si la requête ne cible pas l'API admin, on passe directement
  if (USE_MOCK || !req.url.includes(ADMIN_PATH)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getAccessToken();
  const authReq = token ? addAuthHeader(req, token) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // On ne tente le refresh que sur 401 (token expiré)
      // Le backend peut renvoyer 401 ou 403 selon la config Spring Security
      if (err.status !== 401 && err.status !== 403) {
        return throwError(() => err);
      }

      // Si on est déjà en train de rafraîchir, on attend le résultat
      if (isRefreshing) {
        return refreshDone$.pipe(
          filter((t): t is string => t !== null),
          take(1),
          switchMap((newToken) => next(addAuthHeader(req, newToken))),
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return authService.refreshToken().pipe(
        switchMap((authResponse) => {
          isRefreshing = false;
          refreshDone$.next(authResponse.accessToken);
          return next(addAuthHeader(req, authResponse.accessToken));
        }),
        catchError((refreshErr) => {
          // Refresh échoué → déconnexion et redirection vers login
          isRefreshing = false;
          authService.logout();
          router.navigate(['/admin/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
