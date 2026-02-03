import { Injectable, signal, computed } from '@angular/core';
import { User, UserRole, ROLE_PERMISSIONS } from '../../../models';

const AUTH_STORAGE_KEY = 'swc_auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userSignal = signal<User | null>(this.loadUserFromStorage());

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly userRole = computed(() => this.userSignal()?.role ?? null);

  readonly permissions = computed(() => {
    const role = this.userRole();
    if (!role) {
      return {
        canManageDevices: false,
        canManageTickets: false,
        canAssignTickets: false,
        canViewOnly: true
      };
    }
    return ROLE_PERMISSIONS[role];
  });

  private loadUserFromStorage(): User | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  login(role: UserRole): User {
    const user = this.createMockUser(role);
    this.userSignal.set(user);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  logout(): void {
    this.userSignal.set(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  private createMockUser(role: UserRole): User {
    const roleUserMap: Record<UserRole, User> = {
      admin: {
        id: 'user-1',
        username: 'admin',
        displayName: 'System Admin',
        role: 'admin'
      },
      technician: {
        id: 'user-2',
        username: 'jsmith',
        displayName: 'John Smith',
        role: 'technician'
      },
      viewer: {
        id: 'user-4',
        username: 'viewer1',
        displayName: 'Operations Viewer',
        role: 'viewer'
      }
    };
    return roleUserMap[role];
  }

  hasPermission(permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean {
    return this.permissions()[permission];
  }
}
