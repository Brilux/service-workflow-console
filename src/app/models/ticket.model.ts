export type TicketStatus = 'new' | 'in_progress' | 'waiting_parts' | 'done';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketType = 'maintenance' | 'rma' | 'inspection' | 'repair';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  deviceId: string;
  deviceName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketDto {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  deviceId: string;
  deviceName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  priority: TicketPriority;
  type: TicketType;
  deviceId: string;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  new: ['in_progress'],
  in_progress: ['waiting_parts', 'done'],
  waiting_parts: ['in_progress', 'done'],
  done: []
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  new: 'New',
  in_progress: 'In Progress',
  waiting_parts: 'Waiting Parts',
  done: 'Done'
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  maintenance: 'Maintenance',
  rma: 'RMA',
  inspection: 'Inspection',
  repair: 'Repair'
};
