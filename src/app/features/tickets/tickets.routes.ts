import { Routes } from '@angular/router';

export const TICKETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/tickets-list/tickets-list.component').then(
        m => m.TicketsListComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/ticket-detail/ticket-detail.component').then(
        m => m.TicketDetailComponent
      )
  }
];
