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
    path: '**',
    redirectTo: '',
  },
];
