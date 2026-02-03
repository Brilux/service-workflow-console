export type AuditAction =
  | 'device_created'
  | 'device_updated'
  | 'device_status_changed'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_status_changed'
  | 'ticket_assigned';

export interface AuditLog {
  id: string;
  entityType: 'device' | 'ticket';
  entityId: string;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }>;
  performedBy: string;
  performedAt: string;
  description: string;
}

export interface AuditLogDto {
  id: string;
  entityType: 'device' | 'ticket';
  entityId: string;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }>;
  performedBy: string;
  performedAt: string;
  description: string;
}
