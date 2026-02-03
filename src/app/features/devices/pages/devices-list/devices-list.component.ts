import { Component, OnInit, inject, ViewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DevicesStore } from '../../store/devices.store';
import { AuthService } from '../../../auth/services/auth.service';
import { Device, DeviceStatus } from '../../../../models';
import {
  PageHeaderComponent,
  LoadingStateComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  StatusBadgeComponent
} from '../../../../shared/components';
import { DeviceEditDialogComponent } from '../../components/device-edit-dialog/device-edit-dialog.component';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatTooltipModule,
    DatePipe,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header
      title="Devices"
      subtitle="Manage connected devices and their status"
      icon="devices">
    </app-page-header>

    <mat-card class="filter-card">
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search devices</mat-label>
            <input matInput
                   [ngModel]="searchQuery"
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Search by name, serial number, location...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="status-field">
            <mat-label>Status</mat-label>
            <mat-select [ngModel]="statusFilter" (ngModelChange)="onStatusFilterChange($event)">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="online">Online</mat-option>
              <mat-option value="offline">Offline</mat-option>
              <mat-option value="maintenance">Maintenance</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ store.onlineDevicesCount() }}</span>
              <span class="stat-label">Online</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ store.offlineDevicesCount() }}</span>
              <span class="stat-label">Offline</span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    @if (store.loading()) {
      <app-loading-state message="Loading devices..."></app-loading-state>
    } @else if (store.hasError()) {
      <app-error-state
        [message]="store.error() ?? 'Unknown error'"
        (retry)="store.loadDevices()">
      </app-error-state>
    } @else if (store.isEmpty()) {
      <app-empty-state
        icon="devices_other"
        title="No devices found"
        message="No devices match your search criteria. Try adjusting your filters.">
      </app-empty-state>
    } @else {
      <mat-card>
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
            <td mat-cell *matCellDef="let device">
              <a [routerLink]="['/devices', device.id]" class="device-link">
                {{ device.name }}
              </a>
            </td>
          </ng-container>

          <ng-container matColumnDef="serialNumber">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Serial Number</th>
            <td mat-cell *matCellDef="let device">{{ device.serialNumber }}</td>
          </ng-container>

          <ng-container matColumnDef="model">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Model</th>
            <td mat-cell *matCellDef="let device">{{ device.model }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let device">
              <app-status-badge
                [label]="device.status"
                [type]="getStatusType(device.status)">
              </app-status-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Location</th>
            <td mat-cell *matCellDef="let device">{{ device.location }}</td>
          </ng-container>

          <ng-container matColumnDef="lastSeen">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Seen</th>
            <td mat-cell *matCellDef="let device">
              {{ device.lastSeen | date:'short' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let device">
              <button mat-icon-button
                      [routerLink]="['/devices', device.id]"
                      matTooltip="View details">
                <mat-icon>visibility</mat-icon>
              </button>
              @if (canEdit()) {
                <button mat-icon-button
                        matTooltip="Edit device"
                        (click)="openEditDialog(device, $event)">
                  <mat-icon>edit</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [length]="store.pagination().totalItems"
          [pageSize]="store.pagination().itemsPerPage"
          [pageIndex]="store.pagination().currentPage - 1"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    }
  `,
  styles: [`
    .filter-card {
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .status-field {
      width: 180px;
    }

    .stats {
      display: flex;
      gap: 24px;
      margin-left: auto;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 500;
      color: #3f51b5;
    }

    .stat-label {
      font-size: 12px;
      color: #757575;
    }

    table {
      width: 100%;
    }

    .device-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }

    .device-link:hover {
      text-decoration: underline;
    }

    .mat-mdc-row:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class DevicesListComponent implements OnInit {
  readonly store = inject(DevicesStore);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Device>();
  displayedColumns = ['name', 'serialNumber', 'model', 'status', 'location', 'lastSeen', 'actions'];

  searchQuery = '';
  statusFilter: DeviceStatus | null = null;

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(query => {
      this.store.setSearch(query);
      this.store.loadDevices();
    });

    // Reactive effect to update dataSource whenever store.devices() changes
    effect(() => {
      this.dataSource.data = this.store.devices();
    });
  }

  ngOnInit(): void {
    this.store.loadDevices();
  }

  canEdit(): boolean {
    return this.authService.hasPermission('canManageDevices');
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onStatusFilterChange(status: DeviceStatus | null): void {
    this.statusFilter = status;
    this.store.setStatusFilter(status);
    this.store.loadDevices();
  }

  onSortChange(sort: Sort): void {
    this.store.setSort(sort.active, sort.direction as 'asc' | 'desc' || 'asc');
    this.store.loadDevices();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPageSize(event.pageSize);
    this.store.setPage(event.pageIndex + 1);
    this.store.loadDevices();
  }

  getStatusType(status: DeviceStatus): 'success' | 'warning' | 'error' {
    const statusMap: Record<DeviceStatus, 'success' | 'warning' | 'error'> = {
      online: 'success',
      offline: 'error',
      maintenance: 'warning'
    };
    return statusMap[status];
  }

  openEditDialog(device: Device, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(DeviceEditDialogComponent, {
      width: '500px',
      data: { device }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.loadDevices();
      }
    });
  }
}
