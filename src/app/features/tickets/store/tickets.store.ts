import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  patchState
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import {
  Ticket,
  PaginationMeta,
  PaginatedResponse,
  TicketStatus,
  TicketPriority,
  UpdateTicketDto,
  CreateTicketDto,
  AuditLog,
  Device
} from '../../../models';
import { TicketsService } from '../data-access/tickets.service';

interface OperationResult {
  status: 'idle' | 'success' | 'error';
  operationId: string | null;
}

interface TicketsState {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  auditLogs: AuditLog[];
  devices: Device[];
  pagination: PaginationMeta;
  loading: boolean;
  detailLoading: boolean;
  auditLogsLoading: boolean;
  creating: boolean;
  transitioning: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: TicketStatus | null;
  priorityFilter: TicketPriority | null;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  createResult: OperationResult;
  transitionResult: OperationResult;
}

const initialState: TicketsState = {
  tickets: [],
  selectedTicket: null,
  auditLogs: [],
  devices: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  loading: false,
  detailLoading: false,
  auditLogsLoading: false,
  creating: false,
  transitioning: false,
  error: null,
  searchQuery: '',
  statusFilter: null,
  priorityFilter: null,
  sortField: 'createdAt',
  sortOrder: 'desc',
  createResult: { status: 'idle', operationId: null },
  transitionResult: { status: 'idle', operationId: null }
};

export const TicketsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasTickets: computed(() => store.tickets().length > 0),
    isEmpty: computed(() => !store.loading() && store.tickets().length === 0),
    hasError: computed(() => store.error() !== null),
    isFirstPage: computed(() => store.pagination().currentPage === 1),
    isLastPage: computed(() =>
      store.pagination().currentPage >= store.pagination().totalPages
    ),
    ticketsByStatus: computed(() => {
      const tickets = store.tickets();
      return {
        new: tickets.filter(t => t.status === 'new').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        waiting_parts: tickets.filter(t => t.status === 'waiting_parts').length,
        done: tickets.filter(t => t.status === 'done').length
      };
    }),
    canTransitionTo: computed(() => {
      const ticket = store.selectedTicket();
      if (!ticket) return [];

      const transitions: Record<TicketStatus, TicketStatus[]> = {
        new: ['in_progress'],
        in_progress: ['waiting_parts', 'done'],
        waiting_parts: ['in_progress', 'done'],
        done: []
      };
      return transitions[ticket.status];
    })
  })),
  withMethods((store, ticketsService = inject(TicketsService)) => ({
    loadTickets: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => {
          const pagination = {
            page: store.pagination().currentPage,
            limit: store.pagination().itemsPerPage,
            sort: store.sortField(),
            order: store.sortOrder(),
            search: store.searchQuery() || undefined
          };
          const filters: { status?: string; priority?: string } = {};
          if (store.statusFilter()) filters.status = store.statusFilter()!;
          if (store.priorityFilter()) filters.priority = store.priorityFilter()!;

          return ticketsService.getTickets(pagination, filters).pipe(
            tapResponse({
              next: (response: PaginatedResponse<Ticket>) => {
                patchState(store, {
                  tickets: response.data,
                  pagination: response.meta,
                  loading: false
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load tickets',
                  loading: false
                });
              }
            })
          );
        })
      )
    ),

    loadTicket: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { detailLoading: true, error: null })),
        switchMap((id) =>
          ticketsService.getTicket(id).pipe(
            tapResponse({
              next: (ticket: Ticket) => {
                patchState(store, {
                  selectedTicket: ticket,
                  detailLoading: false
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load ticket',
                  detailLoading: false
                });
              }
            })
          )
        )
      )
    ),

    loadAuditLogs: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { auditLogsLoading: true })),
        switchMap((ticketId) =>
          ticketsService.getTicketAuditLogs(ticketId).pipe(
            tapResponse({
              next: (logs: AuditLog[]) => {
                patchState(store, {
                  auditLogs: logs,
                  auditLogsLoading: false
                });
              },
              error: () => {
                patchState(store, { auditLogsLoading: false });
              }
            })
          )
        )
      )
    ),

    loadDevices: rxMethod<void>(
      pipe(
        switchMap(() =>
          ticketsService.getDevices().pipe(
            tapResponse({
              next: (devices: Device[]) => {
                patchState(store, { devices });
              },
              error: () => {
                // Silently handle error - devices are optional
              }
            })
          )
        )
      )
    ),

    createTicket: rxMethod<{ data: CreateTicketDto; createdBy: string; operationId: string }>(
      pipe(
        tap(({ operationId }) => patchState(store, {
          creating: true,
          error: null,
          createResult: { status: 'idle', operationId }
        })),
        switchMap(({ data, createdBy, operationId }) =>
          ticketsService.createTicket(data, createdBy).pipe(
            tapResponse({
              next: () => {
                patchState(store, {
                  creating: false,
                  createResult: { status: 'success', operationId }
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to create ticket',
                  creating: false,
                  createResult: { status: 'error', operationId }
                });
              }
            })
          )
        )
      )
    ),

    updateTicket: rxMethod<{ id: string; data: UpdateTicketDto }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ id, data }) =>
          ticketsService.updateTicket(id, data).pipe(
            tapResponse({
              next: (updatedTicket: Ticket) => {
                const tickets = store.tickets().map(t =>
                  t.id === id ? updatedTicket : t
                );
                patchState(store, {
                  tickets,
                  selectedTicket: store.selectedTicket()?.id === id
                    ? updatedTicket
                    : store.selectedTicket(),
                  loading: false
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to update ticket',
                  loading: false
                });
              }
            })
          )
        )
      )
    ),

    transitionStatus: rxMethod<{ id: string; newStatus: TicketStatus; operationId: string }>(
      pipe(
        tap(({ operationId }) => patchState(store, {
          transitioning: true,
          transitionResult: { status: 'idle', operationId },
          error: null
        })),
        switchMap(({ id, newStatus, operationId }) =>
          ticketsService.updateTicket(id, { status: newStatus }).pipe(
            tapResponse({
              next: (updatedTicket: Ticket) => {
                const tickets = store.tickets().map(t =>
                  t.id === id ? updatedTicket : t
                );
                patchState(store, {
                  tickets,
                  selectedTicket: store.selectedTicket()?.id === id
                    ? updatedTicket
                    : store.selectedTicket(),
                  transitioning: false,
                  transitionResult: { status: 'success', operationId },
                  error: null
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to update ticket status',
                  transitioning: false,
                  transitionResult: { status: 'error', operationId }
                });
              }
            })
          )
        )
      )
    ),

    setPage(page: number): void {
      patchState(store, {
        pagination: { ...store.pagination(), currentPage: page }
      });
    },

    setPageSize(size: number): void {
      patchState(store, {
        pagination: { ...store.pagination(), itemsPerPage: size, currentPage: 1 }
      });
    },

    setSearch(query: string): void {
      patchState(store, {
        searchQuery: query,
        pagination: { ...store.pagination(), currentPage: 1 }
      });
    },

    setStatusFilter(status: TicketStatus | null): void {
      patchState(store, {
        statusFilter: status,
        pagination: { ...store.pagination(), currentPage: 1 }
      });
    },

    setPriorityFilter(priority: TicketPriority | null): void {
      patchState(store, {
        priorityFilter: priority,
        pagination: { ...store.pagination(), currentPage: 1 }
      });
    },

    setSort(field: string, order: 'asc' | 'desc'): void {
      patchState(store, { sortField: field, sortOrder: order });
    },

    clearSelectedTicket(): void {
      patchState(store, { selectedTicket: null, auditLogs: [] });
    },

    clearError(): void {
      patchState(store, { error: null });
    },

    resetCreateResult(): void {
      patchState(store, { createResult: { status: 'idle', operationId: null } });
    },

    resetTransitionResult(): void {
      patchState(store, { transitionResult: { status: 'idle', operationId: null } });
    }
  }))
);
