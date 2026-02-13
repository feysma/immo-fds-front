import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
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
