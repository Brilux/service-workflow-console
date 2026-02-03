import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClientService } from '../../../data-access';
import {
  Ticket,
  TicketDto,
  CreateTicketDto,
  UpdateTicketDto,
  PaginationParams,
  PaginatedResponse,
  AuditLog,
  AuditLogDto,
  Device
} from '../../../models';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {
  private readonly api = inject(ApiClientService);

  getTickets(
    pagination: PaginationParams,
    filters?: { status?: string; priority?: string }
  ): Observable<PaginatedResponse<Ticket>> {
    return this.api.getPaginated<TicketDto>(
      '/tickets',
      pagination,
      filters as Record<string, string>
    ).pipe(
      map(response => ({
        ...response,
        data: response.data.map(dto => this.mapDtoToTicket(dto))
      }))
    );
  }

  getTicket(id: string): Observable<Ticket> {
    return this.api.get<TicketDto>(`/tickets/${id}`).pipe(
      map(dto => this.mapDtoToTicket(dto))
    );
  }

  createTicket(data: CreateTicketDto, createdBy: string): Observable<Ticket> {
    const now = new Date().toISOString();
    const payload: Partial<TicketDto> = {
      ...data,
      id: `ticket-${Date.now()}`,
      status: 'new',
      assigneeId: null,
      assigneeName: null,
      deviceName: '',
      createdBy,
      createdAt: now,
      updatedAt: now
    };
    return this.api.post<TicketDto>('/tickets', payload).pipe(
      map(dto => this.mapDtoToTicket(dto))
    );
  }

  updateTicket(id: string, data: UpdateTicketDto): Observable<Ticket> {
    const payload = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return this.api.patch<TicketDto>(`/tickets/${id}`, payload).pipe(
      map(dto => this.mapDtoToTicket(dto))
    );
  }

  deleteTicket(id: string): Observable<void> {
    return this.api.delete<void>(`/tickets/${id}`);
  }

  getTicketAuditLogs(ticketId: string): Observable<AuditLog[]> {
    return this.api.get<AuditLogDto[]>('/auditLogs', {
      entityType: 'ticket',
      entityId: ticketId,
      _sort: 'performedAt',
      _order: 'desc'
    }).pipe(
      map(logs => logs.map(log => this.mapDtoToAuditLog(log)))
    );
  }

  getDevices(): Observable<Device[]> {
    return this.api.get<Device[]>('/devices');
  }

  private mapDtoToTicket(dto: TicketDto): Ticket {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      type: dto.type,
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      assigneeId: dto.assigneeId,
      assigneeName: dto.assigneeName,
      createdBy: dto.createdBy,
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
