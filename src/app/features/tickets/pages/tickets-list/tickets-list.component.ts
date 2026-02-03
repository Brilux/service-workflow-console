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
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TicketsStore } from '../../store/tickets.store';
import { AuthService } from '../../../auth/services/auth.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS
} from '../../../../models';
import {
  PageHeaderComponent,
  LoadingStateComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  StatusBadgeComponent
} from '../../../../shared/components';
import { CreateTicketDialogComponent } from '../../components/create-ticket-dialog/create-ticket-dialog.component';

@Component({
  selector: 'app-tickets-list',
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
    MatChipsModule,
    DatePipe,
    PageHeaderComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-page-header
      title="Service Tickets"
      subtitle="Manage maintenance and RMA workflows"
      icon="assignment">
      @if (canCreate()) {
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Create Ticket
        </button>
      }
    </app-page-header>

    <mat-card class="filter-card">
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search tickets</mat-label>
            <input matInput
                   [ngModel]="searchQuery"
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="Search by title, description...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [ngModel]="statusFilter" (ngModelChange)="onStatusFilterChange($event)">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="new">New</mat-option>
              <mat-option value="in_progress">In Progress</mat-option>
              <mat-option value="waiting_parts">Waiting Parts</mat-option>
              <mat-option value="done">Done</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Priority</mat-label>
            <mat-select [ngModel]="priorityFilter" (ngModelChange)="onPriorityFilterChange($event)">
              <mat-option [value]="null">All Priorities</mat-option>
              <mat-option value="low">Low</mat-option>
              <mat-option value="medium">Medium</mat-option>
              <mat-option value="high">High</mat-option>
              <mat-option value="critical">Critical</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="status-chips">
          <mat-chip-set>
            <mat-chip (click)="onStatusFilterChange(null)" [highlighted]="!statusFilter">
              All ({{ store.pagination().totalItems }})
            </mat-chip>
            <mat-chip (click)="onStatusFilterChange('new')" [highlighted]="statusFilter === 'new'">
              New ({{ store.ticketsByStatus().new }})
            </mat-chip>
            <mat-chip (click)="onStatusFilterChange('in_progress')" [highlighted]="statusFilter === 'in_progress'">
              In Progress ({{ store.ticketsByStatus().in_progress }})
            </mat-chip>
            <mat-chip (click)="onStatusFilterChange('waiting_parts')" [highlighted]="statusFilter === 'waiting_parts'">
              Waiting Parts ({{ store.ticketsByStatus().waiting_parts }})
            </mat-chip>
            <mat-chip (click)="onStatusFilterChange('done')" [highlighted]="statusFilter === 'done'">
              Done ({{ store.ticketsByStatus().done }})
            </mat-chip>
          </mat-chip-set>
        </div>
      </mat-card-content>
    </mat-card>

    @if (store.loading()) {
      <app-loading-state message="Loading tickets..."></app-loading-state>
    } @else if (store.hasError()) {
      <app-error-state
        [message]="store.error() ?? 'Unknown error'"
        (retry)="store.loadTickets()">
      </app-error-state>
    } @else if (store.isEmpty()) {
      <app-empty-state
        icon="assignment"
        title="No tickets found"
        message="No tickets match your search criteria. Try adjusting your filters or create a new ticket."
        [actionLabel]="canCreate() ? 'Create Ticket' : undefined"
        [actionFn]="canCreate() ? createTicketFn : undefined">
      </app-empty-state>
    } @else {
      <mat-card>
        <table mat-table [dataSource]="dataSource" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
            <td mat-cell *matCellDef="let ticket">
              <a [routerLink]="['/tickets', ticket.id]" class="ticket-link">
                {{ ticket.title }}
              </a>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let ticket">
              <app-status-badge
                [label]="getStatusLabel(ticket.status)"
                [type]="getStatusType(ticket.status)">
              </app-status-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
            <td mat-cell *matCellDef="let ticket">
              <app-status-badge
                [label]="getPriorityLabel(ticket.priority)"
                [type]="getPriorityType(ticket.priority)">
              </app-status-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
            <td mat-cell *matCellDef="let ticket" class="capitalize">
              {{ ticket.type }}
            </td>
          </ng-container>

          <ng-container matColumnDef="deviceName">
            <th mat-header-cell *matHeaderCellDef>Device</th>
            <td mat-cell *matCellDef="let ticket">
              <a [routerLink]="['/devices', ticket.deviceId]" class="device-link">
                {{ ticket.deviceName || ticket.deviceId }}
              </a>
            </td>
          </ng-container>

          <ng-container matColumnDef="assigneeName">
            <th mat-header-cell *matHeaderCellDef>Assignee</th>
            <td mat-cell *matCellDef="let ticket">
              {{ ticket.assigneeName || 'Unassigned' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
            <td mat-cell *matCellDef="let ticket">
              {{ ticket.createdAt | date:'short' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let ticket">
              <button mat-icon-button
                      [routerLink]="['/tickets', ticket.id]"
                      matTooltip="View details">
                <mat-icon>visibility</mat-icon>
              </button>
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
      margin-bottom: 16px;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    .filter-field {
      width: 180px;
    }

    .status-chips {
      margin-top: 8px;
    }

    mat-chip {
      cursor: pointer;
    }

    table {
      width: 100%;
    }

    .ticket-link, .device-link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
    }

    .ticket-link:hover, .device-link:hover {
      text-decoration: underline;
    }

    .capitalize {
      text-transform: capitalize;
    }

    .mat-mdc-row:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class TicketsListComponent implements OnInit {
  readonly store = inject(TicketsStore);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Ticket>();
  displayedColumns = ['title', 'status', 'priority', 'type', 'deviceName', 'assigneeName', 'createdAt', 'actions'];

  searchQuery = '';
  statusFilter: TicketStatus | null = null;
  priorityFilter: TicketPriority | null = null;

  readonly statusLabels = TICKET_STATUS_LABELS;
  readonly priorityLabels = TICKET_PRIORITY_LABELS;

  private readonly searchSubject = new Subject<string>();

  createTicketFn = () => this.openCreateDialog();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(query => {
      this.store.setSearch(query);
      this.store.loadTickets();
    });

    // Reactive effect to update dataSource whenever store.tickets() changes
    effect(() => {
      this.dataSource.data = this.store.tickets();
    });
  }

  ngOnInit(): void {
    this.store.loadTickets();
  }

  canCreate(): boolean {
    return this.authService.hasPermission('canManageTickets');
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onStatusFilterChange(status: TicketStatus | null): void {
    this.statusFilter = status;
    this.store.setStatusFilter(status);
    this.store.loadTickets();
  }

  onPriorityFilterChange(priority: TicketPriority | null): void {
    this.priorityFilter = priority;
    this.store.setPriorityFilter(priority);
    this.store.loadTickets();
  }

  onSortChange(sort: Sort): void {
    this.store.setSort(sort.active, sort.direction as 'asc' | 'desc' || 'asc');
    this.store.loadTickets();
  }

  onPageChange(event: PageEvent): void {
    this.store.setPageSize(event.pageSize);
    this.store.setPage(event.pageIndex + 1);
    this.store.loadTickets();
  }

  getStatusLabel(status: TicketStatus): string {
    return this.statusLabels[status];
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
    return this.priorityLabels[priority];
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

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '600px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.loadTickets();
      }
    });
  }
}
