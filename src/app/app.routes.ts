import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'properties',
    loadComponent: () =>
      import('./features/properties/properties.component').then((m) => m.PropertiesComponent),
  },
  {
    path: 'properties/:reference',
    loadComponent: () =>
      import('./features/property-detail/property-detail.component').then(
        (m) => m.PropertyDetailComponent
      ),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
