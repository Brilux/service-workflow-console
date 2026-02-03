export type UserRole = 'admin' | 'technician' | 'viewer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageDevices: boolean;
  canManageTickets: boolean;
  canAssignTickets: boolean;
  canViewOnly: boolean;
}> = {
  admin: {
    canManageDevices: true,
    canManageTickets: true,
    canAssignTickets: true,
    canViewOnly: false
  },
  technician: {
    canManageDevices: true,
    canManageTickets: true,
    canAssignTickets: false,
    canViewOnly: false
  },
  viewer: {
    canManageDevices: false,
    canManageTickets: false,
    canAssignTickets: false,
    canViewOnly: true
  }
};
