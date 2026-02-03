import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '../../../data-access';
import {
  Device,
  DeviceDto,
  CreateDeviceDto,
  UpdateDeviceDto,
  PaginationParams,
  PaginatedResponse,
  AuditLog,
  AuditLogDto
} from '../../../models';

@Injectable({
  providedIn: 'root'
})
export class DevicesService {
  private readonly api = inject(ApiClientService);

  getDevices(
    pagination: PaginationParams,
    filters?: { status?: string }
  ): Observable<PaginatedResponse<Device>> {
    return this.api.getPaginated<DeviceDto>(
      '/devices',
      pagination,
      filters as Record<string, string>
    ).pipe(
      map(response => ({
        ...response,
        data: response.data.map(dto => this.mapDtoToDevice(dto))
      }))
    );
  }

  getDevice(id: string): Observable<Device> {
    return this.api.get<DeviceDto>(`/devices/${id}`).pipe(
      map(dto => this.mapDtoToDevice(dto))
    );
  }

  createDevice(data: CreateDeviceDto): Observable<Device> {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      id: `device-${Date.now()}`,
      status: 'offline',
      firmwareVersion: '1.0.0',
      lastSeen: now,
      createdAt: now,
      updatedAt: now
    };
    return this.api.post<DeviceDto>('/devices', payload).pipe(
      map(dto => this.mapDtoToDevice(dto))
    );
  }

  updateDevice(id: string, data: UpdateDeviceDto): Observable<Device> {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.api.patch<DeviceDto>(`/devices/${id}`, payload).pipe(
      map(dto => this.mapDtoToDevice(dto))
    );
  }

  deleteDevice(id: string): Observable<void> {
    return this.api.delete<void>(`/devices/${id}`);
  }

  getDeviceAuditLogs(deviceId: string): Observable<AuditLog[]> {
    return this.api.get<AuditLogDto[]>('/auditLogs', {
      entityType: 'device',
      entityId: deviceId,
      _sort: 'performedAt',
      _order: 'desc'
    }).pipe(
      map(logs => logs.map(log => this.mapDtoToAuditLog(log)))
    );
  }

  private mapDtoToDevice(dto: DeviceDto): Device {
    return {
      id: dto.id,
      name: dto.name,
      serialNumber: dto.serialNumber,
      model: dto.model,
      status: dto.status,
      firmwareVersion: dto.firmwareVersion,
      lastSeen: dto.lastSeen,
      location: dto.location,
      ipAddress: dto.ipAddress,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  private mapDtoToAuditLog(dto: AuditLogDto): AuditLog {
    return {
      id: dto.id,
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      changes: dto.changes,
      performedBy: dto.performedBy,
      performedAt: dto.performedAt,
      description: dto.description
    };
  }
}
