import { Component, inject, effect, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Device, DeviceStatus, UpdateDeviceDto } from '../../../../models';
import { DevicesStore } from '../../store/devices.store';
import { NotificationService } from '../../../../core/services';
import { generateOperationId } from '../../../../core/utils';

export interface DeviceEditDialogData {
  device: Device;
}

@Component({
  selector: 'app-device-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Device</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="edit-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Device Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter device name">
          @if (form.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="online">Online</mat-option>
            <mat-option value="offline">Offline</mat-option>
            <mat-option value="maintenance">Maintenance</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Firmware Version</mat-label>
          <input matInput formControlName="firmwareVersion" placeholder="e.g., 2.1.0">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location</mat-label>
          <input matInput formControlName="location" placeholder="Enter location">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>IP Address</mat-label>
          <input matInput formControlName="ipAddress" placeholder="e.g., 192.168.1.100">
          @if (form.get('ipAddress')?.hasError('pattern')) {
            <mat-error>Invalid IP address format</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="saving">Cancel</button>
      <button mat-flat-button
              color="primary"
              [disabled]="form.invalid || saving"
              (click)="onSave()">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 400px;
      padding-top: 8px;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class DeviceEditDialogComponent implements OnDestroy {
  readonly store = inject(DevicesStore);
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  readonly dialogRef = inject(MatDialogRef<DeviceEditDialogComponent>);
  readonly data: DeviceEditDialogData = inject(MAT_DIALOG_DATA);

  form: FormGroup;
  saving = false;
  private currentOperationId: string | null = null;

  constructor() {
    const device = this.data.device;
    this.form = this.fb.group({
      name: [device.name, Validators.required],
      status: [device.status],
      firmwareVersion: [device.firmwareVersion],
      location: [device.location],
      ipAddress: [device.ipAddress, Validators.pattern(/^(\d{1,3}\.){3}\d{1,3}$/)]
    });

    // React to operation result changes - only if this dialog initiated the operation
    effect(() => {
      const result = this.store.updateResult();
      if (result.operationId === this.currentOperationId && this.currentOperationId !== null) {
        if (result.status === 'success') {
          this.saving = false;
          this.currentOperationId = null;
          this.dialogRef.disableClose = false;
          this.notificationService.showSuccess('Device updated successfully');
          this.dialogRef.close(true);
        } else if (result.status === 'error') {
          this.saving = false;
          this.currentOperationId = null;
          this.dialogRef.disableClose = false;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.store.resetUpdateResult();
  }

  onSave(): void {
    if (this.form.invalid) return;

    const updateData: UpdateDeviceDto = {};
    const formValue = this.form.value;
    const device = this.data.device;

    if (formValue.name !== device.name) updateData.name = formValue.name;
    if (formValue.status !== device.status) updateData.status = formValue.status as DeviceStatus;
    if (formValue.firmwareVersion !== device.firmwareVersion) updateData.firmwareVersion = formValue.firmwareVersion;
    if (formValue.location !== device.location) updateData.location = formValue.location;
    if (formValue.ipAddress !== device.ipAddress) updateData.ipAddress = formValue.ipAddress;

    if (Object.keys(updateData).length === 0) {
      this.dialogRef.close(false);
      return;
    }

    this.saving = true;
    this.currentOperationId = generateOperationId();
    this.dialogRef.disableClose = true;
    this.store.updateDevice({ id: device.id, data: updateData, operationId: this.currentOperationId });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
