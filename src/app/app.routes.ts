import { Routes } from '@angular/router';
import { ApiInfoComponent } from './pages/api-info/api-info.component';
import { ServerComponent } from './pages/server/server.component';
import { TagsComponent } from './pages/tags/tags.component';
import { SecurityComponent } from './pages/security/security.component';
import { SchemasComponent } from './pages/schemas/schemas.component';
import { PathsComponent } from './pages/paths/paths.component';

export const routes: Routes = [
  {
    path: 'api-info',
    component: ApiInfoComponent,
  },
  {
    path: 'server',
    component: ServerComponent,
  },
  {
    path: 'tags',
    component: TagsComponent,
  },
  {
    path: 'security',
    component: SecurityComponent,
  },
  {
    path: 'schemas',
    component: SchemasComponent,
  },
  {
    path: 'paths',
    component: PathsComponent,
  },
];
