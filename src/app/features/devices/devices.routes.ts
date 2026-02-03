import { Routes } from '@angular/router';

export const DEVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/devices-list/devices-list.component').then(
        m => m.DevicesListComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/device-detail/device-detail.component').then(
        m => m.DeviceDetailComponent
      )
  }
];
