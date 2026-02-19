import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    // Shell public : toutes les pages publiques partagent le footer vibe coding + lien admin
    path: '',
    loadComponent: () =>
      import('./features/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
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
        path: 'properties/:reference/visit',
        loadComponent: () =>
          import('./features/visit-request/visit-request.component').then(
            (m) => m.VisitRequestComponent
          ),
      },
    ],
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
