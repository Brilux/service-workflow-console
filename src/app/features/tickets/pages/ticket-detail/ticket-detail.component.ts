import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketsStore } from '../../store/tickets.store';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../core/services';
import {
  PageHeaderComponent,
  LoadingStateComponent,
  ErrorStateComponent,
  StatusBadgeComponent
} from '../../../../shared/components';
import {
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS
} from '../../../../models';
import { generateOperationId, handleOperationResult } from '../../../../core/utils';

@Component({
  selector: 'app-ticket-detail',
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
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    StatusBadgeComponent
  ],
  template: `
    @if (store.detailLoading()) {
      <app-loading-state message="Loading ticket details..."></app-loading-state>
    } @else if (store.hasError()) {
      <app-error-state
        [message]="store.error() ?? 'Unknown error'"
        (retry)="loadTicket()">
      </app-error-state>
    } @else if (store.selectedTicket()) {
      <div class="detail-header">
        <button mat-icon-button routerLink="/tickets" matTooltip="Back to tickets">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-content">
          <div class="title-row">
            <h1>{{ store.selectedTicket()!.title }}</h1>
            <app-status-badge
              [label]="getStatusLabel(store.selectedTicket()!.status)"
              [type]="getStatusType(store.selectedTicket()!.status)">
            </app-status-badge>
            <app-status-badge
              [label]="getPriorityLabel(store.selectedTicket()!.priority)"
              [type]="getPriorityType(store.selectedTicket()!.priority)">
            </app-status-badge>
          </div>
          <p class="subtitle">{{ store.selectedTicket()!.id }} • {{ getTypeLabel(store.selectedTicket()!.type) }}</p>
        </div>
        @if (canEdit() && store.canTransitionTo().length > 0) {
          <button mat-flat-button color="primary" [matMenuTriggerFor]="statusMenu">
            <mat-icon>swap_horiz</mat-icon>
            Change Status
          </button>
          <mat-menu #statusMenu="matMenu">
            @for (status of store.canTransitionTo(); track status) {
              <button mat-menu-item (click)="transitionStatus(status)">
                {{ getStatusLabel(status) }}
              </button>
            }
          </mat-menu>
        }
      </div>

      <mat-tab-group>
        <mat-tab label="Details">
          <div class="tab-content">
            <div class="info-grid">
              <mat-card class="info-card description-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>description</mat-icon>
                  <mat-card-title>Description</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <p class="description-text">{{ store.selectedTicket()!.description }}</p>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>devices</mat-icon>
                  <mat-card-title>Device Information</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Device</span>
                      <span matListItemLine>
                        <a [routerLink]="['/devices', store.selectedTicket()!.deviceId]" class="device-link">
                          {{ store.selectedTicket()!.deviceName || store.selectedTicket()!.deviceId }}
                        </a>
                      </span>
                    </mat-list-item>
                  </mat-list>
                </mat-card-content>
              </mat-card>

              <mat-card class="info-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>person</mat-icon>
                  <mat-card-title>Assignment</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-list>
                    <mat-list-item>
                      <span matListItemTitle>Assignee</span>
                      <span matListItemLine>
                        {{ store.selectedTicket()!.assigneeName || 'Unassigned' }}
                      </span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Created By</span>
                      <span matListItemLine>{{ store.selectedTicket()!.createdBy }}</span>
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
                      <span matListItemLine>{{ store.selectedTicket()!.createdAt | date:'medium' }}</span>
                    </mat-list-item>
                    <mat-divider></mat-divider>
                    <mat-list-item>
                      <span matListItemTitle>Last Updated</span>
                      <span matListItemLine>{{ store.selectedTicket()!.updatedAt | date:'medium' }}</span>
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
                <p>No audit logs available for this ticket.</p>
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
      gap: 12px;
      flex-wrap: wrap;
    }

    .title-row h1 {
      margin: 0;
      font-size: 24px;
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

    .description-card {
      grid-column: span 2;
    }

    @media (max-width: 768px) {
      .description-card {
        grid-column: span 1;
      }
    }

    .info-card mat-icon[mat-card-avatar] {
      background: #e3f2fd;
      color: #1976d2;
      border-radius: 50%;
      padding: 8px;
    }

    .description-text {
      line-height: 1.6;
      color: #424242;
      white-space: pre-wrap;
    }

    .device-link {
      color: #3f51b5;
      text-decoration: none;
    }

    .device-link:hover {
      text-decoration: underline;
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

    .log-icon-assign {
      color: #9c27b0;
    }
  `]
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  readonly store = inject(TicketsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  private ticketId = '';
  private pendingStatus: TicketStatus | null = null;
  private currentOperationId: string | null = null;

  constructor() {
    // React to transition result changes
    effect(() => {
      handleOperationResult(
        this.store.transitionResult(),
        this.currentOperationId,
        {
          onSuccess: () => {
            if (this.pendingStatus) {
              this.notificationService.showSuccess(`Ticket status changed to ${this.getStatusLabel(this.pendingStatus)}`);
            }
            this.pendingStatus = null;
            this.currentOperationId = null;
          },
          onError: () => {
            this.pendingStatus = null;
            this.currentOperationId = null;
          }
        }
      );
    });
  }

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadTicket();
  }

  ngOnDestroy(): void {
    this.store.clearSelectedTicket();
    this.store.resetTransitionResult();
  }

  loadTicket(): void {
    if (this.ticketId) {
      this.store.loadTicket(this.ticketId);
      this.store.loadAuditLogs(this.ticketId);
    }
  }

  canEdit(): boolean {
    return this.authService.hasPermission('canManageTickets');
  }

  getStatusLabel(status: TicketStatus): string {
    return TICKET_STATUS_LABELS[status];
  }

  getStatusType(status: TicketStatus): 'success' | 'warning' | 'info' | 'default' {
    const statusMap: Record<TicketStatus, 'success' | 'warning' | 'info' | 'default'> = {
      new: 'info',
      in_progress: 'warning',
      waiting_parts: 'default',
      done: 'success'
    };
    return statusMap[status];
  }

  getPriorityLabel(priority: TicketPriority): string {
    return TICKET_PRIORITY_LABELS[priority];
  }

  getPriorityType(priority: TicketPriority): 'success' | 'warning' | 'error' | 'info' | 'default' {
    const priorityMap: Record<TicketPriority, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      critical: 'error'
    };
    return priorityMap[priority];
  }

  getTypeLabel(type: string): string {
    return TICKET_TYPE_LABELS[type as keyof typeof TICKET_TYPE_LABELS] || type;
  }

  transitionStatus(newStatus: TicketStatus): void {
    this.pendingStatus = newStatus;
    this.currentOperationId = generateOperationId();
    this.store.transitionStatus({ id: this.ticketId, newStatus, operationId: this.currentOperationId });
  }

  getLogIcon(action: string): string {
    const iconMap: Record<string, string> = {
      ticket_created: 'add_circle',
      ticket_updated: 'edit',
      ticket_status_changed: 'swap_horiz',
      ticket_assigned: 'person_add'
    };
    return iconMap[action] || 'info';
  }

  getLogIconClass(action: string): string {
    const classMap: Record<string, string> = {
      ticket_created: 'log-icon-create',
      ticket_updated: 'log-icon-update',
      ticket_status_changed: 'log-icon-status',
      ticket_assigned: 'log-icon-assign'
    };
    return classMap[action] || '';
  }
}
