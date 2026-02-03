import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { TicketsStore } from '../../store/tickets.store';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../../core/services';
import {
  CreateTicketDto,
  TicketPriority,
  TicketType,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS
} from '../../../../models';
import { generateOperationId, handleOperationResult } from '../../../../core/utils';

@Component({
  selector: 'app-create-ticket-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatStepperModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Create Service Ticket</h2>
    <mat-dialog-content>
      <mat-stepper linear #stepper>
        <mat-step [stepControl]="deviceForm" label="Select Device">
          <form [formGroup]="deviceForm" class="step-form">
            <p class="step-description">Select the device this ticket is for:</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Device</mat-label>
              <mat-select formControlName="deviceId">
                @for (device of store.devices(); track device.id) {
                  <mat-option [value]="device.id">
                    {{ device.name }} ({{ device.serialNumber }})
                  </mat-option>
                }
              </mat-select>
              @if (deviceForm.get('deviceId')?.hasError('required')) {
                <mat-error>Please select a device</mat-error>
              }
            </mat-form-field>
            <div class="step-actions">
              <button mat-button matStepperNext [disabled]="deviceForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="typeForm" label="Ticket Type">
          <form [formGroup]="typeForm" class="step-form">
            <p class="step-description">Select the type of service required:</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Ticket Type</mat-label>
              <mat-select formControlName="type">
                @for (type of ticketTypes; track type.value) {
                  <mat-option [value]="type.value">
                    {{ type.label }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Priority</mat-label>
              <mat-select formControlName="priority">
                @for (priority of priorities; track priority.value) {
                  <mat-option [value]="priority.value">
                    {{ priority.label }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button matStepperNext [disabled]="typeForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="detailsForm" label="Details">
          <form [formGroup]="detailsForm" class="step-form">
            <p class="step-description">Provide details about the issue:</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Brief summary of the issue">
              @if (detailsForm.get('title')?.hasError('required')) {
                <mat-error>Title is required</mat-error>
              }
              @if (detailsForm.get('title')?.hasError('minlength')) {
                <mat-error>Title must be at least 5 characters</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput
                        formControlName="description"
                        rows="4"
                        placeholder="Detailed description of the issue...">
              </textarea>
              @if (detailsForm.get('description')?.hasError('required')) {
                <mat-error>Description is required</mat-error>
              }
              @if (detailsForm.get('description')?.hasError('minlength')) {
                <mat-error>Description must be at least 10 characters</mat-error>
              }
            </mat-form-field>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button matStepperNext [disabled]="detailsForm.invalid">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step label="Review">
          <div class="step-form">
            <p class="step-description">Review your ticket before submitting:</p>
            <div class="review-section">
              <div class="review-item">
                <span class="review-label">Device:</span>
                <span class="review-value">{{ getSelectedDeviceName() }}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Type:</span>
                <span class="review-value">{{ getTypeLabel(typeForm.value.type) }}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Priority:</span>
                <span class="review-value">{{ getPriorityLabel(typeForm.value.priority) }}</span>
              </div>
              <div class="review-item">
                <span class="review-label">Title:</span>
                <span class="review-value">{{ detailsForm.value.title }}</span>
              </div>
              <div class="review-item full-width">
                <span class="review-label">Description:</span>
                <span class="review-value">{{ detailsForm.value.description }}</span>
              </div>
            </div>
            <div class="step-actions">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-flat-button
                      color="primary"
                      [disabled]="creating"
                      (click)="onSubmit()">
                {{ creating ? 'Creating...' : 'Create Ticket' }}
              </button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="creating">Cancel</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-height: 70vh;
    }

    .step-form {
      padding: 16px 0;
    }

    .step-description {
      color: #666;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .step-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    .review-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .review-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .review-item.full-width {
      grid-column: span 2;
    }

    .review-label {
      font-size: 12px;
      color: #757575;
      font-weight: 500;
    }

    .review-value {
      color: #212121;
    }
  `]
})
export class CreateTicketDialogComponent implements OnInit, OnDestroy {
  readonly store = inject(TicketsStore);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CreateTicketDialogComponent>);

  deviceForm!: FormGroup;
  typeForm!: FormGroup;
  detailsForm!: FormGroup;
  creating = false;
  private currentOperationId: string | null = null;

  readonly ticketTypes: { value: TicketType; label: string }[] = [
    { value: 'maintenance', label: TICKET_TYPE_LABELS.maintenance },
    { value: 'rma', label: TICKET_TYPE_LABELS.rma },
    { value: 'inspection', label: TICKET_TYPE_LABELS.inspection },
    { value: 'repair', label: TICKET_TYPE_LABELS.repair }
  ];

  readonly priorities: { value: TicketPriority; label: string }[] = [
    { value: 'low', label: TICKET_PRIORITY_LABELS.low },
    { value: 'medium', label: TICKET_PRIORITY_LABELS.medium },
    { value: 'high', label: TICKET_PRIORITY_LABELS.high },
    { value: 'critical', label: TICKET_PRIORITY_LABELS.critical }
  ];

  constructor() {
    // React to operation result changes - only if this dialog initiated the operation
    effect(() => {
      handleOperationResult(
        this.store.createResult(),
        this.currentOperationId,
        {
          onSuccess: () => {
            this.creating = false;
            this.currentOperationId = null;
            this.dialogRef.disableClose = false;
            this.notificationService.showSuccess('Ticket created successfully');
            this.dialogRef.close(true);
          },
          onError: () => {
            this.creating = false;
            this.currentOperationId = null;
            this.dialogRef.disableClose = false;
          }
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.store.resetCreateResult();
  }

  ngOnInit(): void {
    this.store.loadDevices();

    this.deviceForm = this.fb.group({
      deviceId: ['', Validators.required]
    });

    this.typeForm = this.fb.group({
      type: ['maintenance', Validators.required],
      priority: ['medium', Validators.required]
    });

    this.detailsForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  getSelectedDeviceName(): string {
    const deviceId = this.deviceForm.value.deviceId;
    const device = this.store.devices().find(d => d.id === deviceId);
    return device ? `${device.name} (${device.serialNumber})` : '';
  }

  getTypeLabel(type: TicketType): string {
    return TICKET_TYPE_LABELS[type];
  }

  getPriorityLabel(priority: TicketPriority): string {
    return TICKET_PRIORITY_LABELS[priority];
  }

  onSubmit(): void {
    if (this.deviceForm.invalid || this.typeForm.invalid || this.detailsForm.invalid) {
      return;
    }

    const ticketData: CreateTicketDto = {
      deviceId: this.deviceForm.value.deviceId,
      type: this.typeForm.value.type,
      priority: this.typeForm.value.priority,
      title: this.detailsForm.value.title,
      description: this.detailsForm.value.description
    };

    const createdBy = this.authService.user()?.displayName || 'Unknown';
    this.creating = true;
    this.currentOperationId = generateOperationId();
    this.dialogRef.disableClose = true;
    this.store.createTicket({ data: ticketData, createdBy, operationId: this.currentOperationId });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
