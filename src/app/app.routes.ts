import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/pages/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'devices',
        pathMatch: 'full'
      },
      {
        path: 'devices',
        loadChildren: () =>
          import('./features/devices/devices.routes').then(m => m.DEVICES_ROUTES)
      },
      {
        path: 'tickets',
        loadChildren: () =>
          import('./features/tickets/tickets.routes').then(m => m.TICKETS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
