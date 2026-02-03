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
import { Device, PaginationMeta, DeviceStatus, UpdateDeviceDto, AuditLog, PaginatedResponse } from '../../../models';
import { DevicesService } from '../data-access/devices.service';

interface OperationResult {
  status: 'idle' | 'success' | 'error';
  operationId: string | null;
}

interface DevicesState {
  devices: Device[];
  selectedDevice: Device | null;
  auditLogs: AuditLog[];
  pagination: PaginationMeta;
  loading: boolean;
  detailLoading: boolean;
  auditLogsLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: DeviceStatus | null;
  sortField: string;
  sortOrder: 'asc' | 'desc';
  updateResult: OperationResult;
}

const initialState: DevicesState = {
  devices: [],
  selectedDevice: null,
  auditLogs: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  loading: false,
  detailLoading: false,
  auditLogsLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: null,
  sortField: 'name',
  sortOrder: 'asc',
  updateResult: { status: 'idle', operationId: null }
};

export const DevicesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasDevices: computed(() => store.devices().length > 0),
    isEmpty: computed(() => !store.loading() && store.devices().length === 0),
    hasError: computed(() => store.error() !== null),
    isFirstPage: computed(() => store.pagination().currentPage === 1),
    isLastPage: computed(() =>
      store.pagination().currentPage >= store.pagination().totalPages
    ),
    onlineDevicesCount: computed(() =>
      store.devices().filter(d => d.status === 'online').length
    ),
    offlineDevicesCount: computed(() =>
      store.devices().filter(d => d.status === 'offline').length
    )
  })),
  withMethods((store, devicesService = inject(DevicesService)) => ({
    loadDevices: rxMethod<void>(
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
          const filters = store.statusFilter()
            ? { status: store.statusFilter()! }
            : undefined;

          return devicesService.getDevices(pagination, filters).pipe(
            tapResponse({
              next: (response: PaginatedResponse<Device>) => {
                patchState(store, {
                  devices: response.data,
                  pagination: response.meta,
                  loading: false
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load devices',
                  loading: false
                });
              }
            })
          );
        })
      )
    ),

    loadDevice: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { detailLoading: true, error: null })),
        switchMap((id) =>
          devicesService.getDevice(id).pipe(
            tapResponse({
              next: (device: Device) => {
                patchState(store, {
                  selectedDevice: device,
                  detailLoading: false
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to load device',
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
        switchMap((deviceId) =>
          devicesService.getDeviceAuditLogs(deviceId).pipe(
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

    updateDevice: rxMethod<{ id: string; data: UpdateDeviceDto; operationId: string }>(
      pipe(
        tap(({ operationId }) => patchState(store, {
          loading: true,
          updateResult: { status: 'idle', operationId },
          error: null
        })),
        switchMap(({ id, data, operationId }) =>
          devicesService.updateDevice(id, data).pipe(
            tapResponse({
              next: (updatedDevice: Device) => {
                const devices = store.devices().map(d =>
                  d.id === id ? updatedDevice : d
                );
                patchState(store, {
                  devices,
                  selectedDevice: store.selectedDevice()?.id === id
                    ? updatedDevice
                    : store.selectedDevice(),
                  loading: false,
                  updateResult: { status: 'success', operationId },
                  error: null
                });
              },
              error: (error: Error) => {
                patchState(store, {
                  error: error.message || 'Failed to update device',
                  loading: false,
                  updateResult: { status: 'error', operationId }
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

    setStatusFilter(status: DeviceStatus | null): void {
      patchState(store, {
        statusFilter: status,
        pagination: { ...store.pagination(), currentPage: 1 }
      });
    },

    setSort(field: string, order: 'asc' | 'desc'): void {
      patchState(store, { sortField: field, sortOrder: order });
    },

    clearSelectedDevice(): void {
      patchState(store, { selectedDevice: null, auditLogs: [] });
    },

    clearError(): void {
      patchState(store, { error: null });
    },

    resetUpdateResult(): void {
      patchState(store, { updateResult: { status: 'idle', operationId: null } });
    }
  }))
);
