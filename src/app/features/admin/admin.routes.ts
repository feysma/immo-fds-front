import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '../../core/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    // Racine /admin : redirige vers dashboard (authGuard renverra vers login si non connecté)
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    // Page de login : accessible uniquement si NON connecté
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./properties/admin-properties.component').then((m) => m.AdminPropertiesComponent),
      },
      {
        path: 'properties/:reference',
        loadComponent: () =>
          import('./property-edit/admin-property-edit.component').then((m) => m.AdminPropertyEditComponent),
      },
    ],
  },
];
