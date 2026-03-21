import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'api-info',
    pathMatch: 'full',
  },
  {
    path: 'api-info',
    loadComponent: () => import('./pages/api-info/api-info.component').then(m => m.ApiInfoComponent),
  },
  {
    path: 'server',
    loadComponent: () => import('./pages/server/server.component').then(m => m.ServerComponent),
  },
  {
    path: 'tags',
    loadComponent: () => import('./pages/tags/tags.component').then(m => m.TagsComponent),
  },
  {
    path: 'security',
    loadComponent: () => import('./pages/security/security.component').then(m => m.SecurityComponent),
  },
  {
    path: 'schemas',
    loadComponent: () => import('./pages/schemas/schemas.component').then(m => m.SchemasComponent),
  },
  {
    path: 'paths',
    loadComponent: () => import('./pages/paths/paths.component').then(m => m.PathsComponent),
  },
  {
    path: '**',
    redirectTo: 'api-info',
  },
];
