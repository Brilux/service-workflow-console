import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DevicesStore } from '../../store/devices.store';
import { AuthService } from '../../../auth/services/auth.service';
import {
  PageHeaderComponent,
  LoadingStateComponent,
  ErrorStateComponent,
  StatusBadgeComponent
} from '../../../../shared/components';
import { DeviceEditDialogComponent } from '../../components/device-edit-dialog/device-edit-dialog.component';
import { DeviceStatus } from '../../../../models';

@Component({
  selector: 'app-device-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent
  ],
  template: `
    @if (store.detailLoading()) {
      <app-loading-state message="Loading device details..."></app-loading-state>
    } @else if (store.hasError()) {
      <app-error-state
        [message]="store.error() ?? 'Unknown error'"
        (retry)="loadDevice()">
      </app-error-state>
    } @else if (store.selectedDevice()) {
      <div class="detail-header">
        <button mat-icon-button routerLink="/devices" matTooltip="Back to devices">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="title-row">
            <h1>{{ store.selectedDevice()!.name }}</h1>
            <app-status-badge
              [label]="store.selectedDevice()!.status"
              [type]="getStatusType(store.selectedDevice()!.status)">
            </app-status-badge>
          </div>
          <p class="subtitle">{{ store.selectedDevice()!.model }} • {{ store.selectedDevice()!.serialNumber }}</p>
        </div>
        @if (canEdit()) {
          <button mat-flat-button color="primary" (click)="openEditDialog()">
            <mat-icon>edit</mat-icon>
            Edit Device
          </button>
        }
      </div>

      <mat-tab-group>
        <mat-tab label="Overview">
          <div class="tab-content">
            <div class="info-grid">
              <mat-card class="info-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>info</mat-icon>
                  <mat-card-title>Device Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Serial Number</span>
                      <span matListItemLine>{{ store.selectedDevice()!.serialNumber }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Model</span>
                      <span matListItemLine>{{ store.selectedDevice()!.model }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Firmware Version</span>
                      <span matListItemLine>{{ store.selectedDevice()!.firmwareVersion }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>IP Address</span>
                      <span matListItemLine>{{ store.selectedDevice()!.ipAddress }}</span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>location_on</mat-icon>
                  <mat-card-title>Location & Status</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Location</span>
                      <span matListItemLine>{{ store.selectedDevice()!.location }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Status</span>
                      <span matListItemLine class="capitalize">{{ store.selectedDevice()!.status }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Last Seen</span>
                      <span matListItemLine>{{ store.selectedDevice()!.lastSeen | date:'medium' }}</span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>schedule</mat-icon>
                  <mat-card-title>Timestamps</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Created</span>
                      <span matListItemLine>{{ store.selectedDevice()!.createdAt | date:'medium' }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Last Updated</span>
                      <span matListItemLine>{{ store.selectedDevice()!.updatedAt | date:'medium' }}</span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Audit Log">
          <div class="tab-content">
            @if (store.auditLogsLoading()) {
              <app-loading-state message="Loading audit logs..."></app-loading-state>
            } @else if (store.auditLogs().length === 0) {
              <div class="empty-logs">
                <mat-icon>history</mat-icon>
                <p>No audit logs available for this device.</p>
              </div>
            } @else {
              <mat-card>
                <mat-list>
                  @for (log of store.auditLogs(); track log.id; let last = $last) {
                    <mat-list-item class="audit-item">
                      <mat-icon matListItemIcon [class]="getLogIconClass(log.action)">
                        {{ getLogIcon(log.action) }}
                      </mat-icon>
                      <span matListItemTitle>{{ log.description }}</span>
                      <span matListItemLine>
                        {{ log.performedBy }} • {{ log.performedAt | date:'medium' }}
                      </span>
                    </mat-list-item>
                    @if (!last) {
                      <mat-divider></mat-divider>
                    }
                  }
                </mat-list>
              </mat-card>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [`
    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header-content {
      flex: 1;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .title-row h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .subtitle {
      margin: 4px 0 0;
      color: #757575;
    }

    .tab-content {
      padding: 24px 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
    }

    .info-card mat-icon[mat-card-avatar] {
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 50%;
      padding: 8px;
    }

    .capitalize {
      text-transform: capitalize;
    }

    .empty-logs {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #757575;
    }

    .empty-logs mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .audit-item {
      min-height: 72px;
    }

    .log-icon-create {
      color: #4caf50;
    }

    .log-icon-update {
      color: #2196f3;
    }

    .log-icon-status {
      color: #ff9800;
    }
  `]
})
export class DeviceDetailComponent implements OnInit, OnDestroy {
  readonly store = inject(DevicesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private deviceId = '';

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDevice();
  }

  ngOnDestroy(): void {
    this.store.clearSelectedDevice();
  }

  loadDevice(): void {
    if (this.deviceId) {
      this.store.loadDevice(this.deviceId);
      this.store.loadAuditLogs(this.deviceId);
    }
  }

  canEdit(): boolean {
    return this.authService.hasPermission('canManageDevices');
  }

  getStatusType(status: DeviceStatus): 'success' | 'warning' | 'error' {
    const statusMap: Record<DeviceStatus, 'success' | 'warning' | 'error'> = {
      online: 'success',
      offline: 'error',
      maintenance: 'warning'
    };
    return statusMap[status];
  }

  getLogIcon(action: string): string {
    const iconMap: Record<string, string> = {
      device_created: 'add_circle',
      device_updated: 'edit',
      device_status_changed: 'swap_horiz'
    };
    return iconMap[action] || 'info';
  }

  getLogIconClass(action: string): string {
    const classMap: Record<string, string> = {
      device_created: 'log-icon-create',
      device_updated: 'log-icon-update',
      device_status_changed: 'log-icon-status'
    };
    return classMap[action] || '';
  }

  openEditDialog(): void {
    const device = this.store.selectedDevice();
    if (!device) return;

    const dialogRef = this.dialog.open(DeviceEditDialogComponent, {
      width: '500px',
      data: { device }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDevice();
      }
    });
  }
}
