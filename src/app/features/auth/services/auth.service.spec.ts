import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login as admin and set user', () => {
      const user = service.login('admin');

      expect(user.role).toBe('admin');
      expect(user.displayName).toBe('System Admin');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.userRole()).toBe('admin');
    });

    it('should login as technician and set user', () => {
      const user = service.login('technician');

      expect(user.role).toBe('technician');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.userRole()).toBe('technician');
    });

    it('should login as viewer and set user', () => {
      const user = service.login('viewer');

      expect(user.role).toBe('viewer');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.userRole()).toBe('viewer');
    });

    it('should persist user to localStorage', () => {
      service.login('admin');

      const stored = localStorage.getItem('swc_auth_user');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.role).toBe('admin');
    });
  });

  describe('logout', () => {
    it('should clear user on logout', () => {
      service.login('admin');
      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.user()).toBeNull();
      expect(service.userRole()).toBeNull();
    });

    it('should remove user from localStorage', () => {
      service.login('admin');
      service.logout();

      const stored = localStorage.getItem('swc_auth_user');
      expect(stored).toBeNull();
    });
  });

  describe('permissions', () => {
    it('should return admin permissions', () => {
      service.login('admin');

      expect(service.permissions().canManageDevices).toBe(true);
      expect(service.permissions().canManageTickets).toBe(true);
      expect(service.permissions().canAssignTickets).toBe(true);
      expect(service.permissions().canViewOnly).toBe(false);
    });

    it('should return technician permissions', () => {
      service.login('technician');

      expect(service.permissions().canManageDevices).toBe(true);
      expect(service.permissions().canManageTickets).toBe(true);
      expect(service.permissions().canAssignTickets).toBe(false);
      expect(service.permissions().canViewOnly).toBe(false);
    });

    it('should return viewer permissions', () => {
      service.login('viewer');

      expect(service.permissions().canManageDevices).toBe(false);
      expect(service.permissions().canManageTickets).toBe(false);
      expect(service.permissions().canAssignTickets).toBe(false);
      expect(service.permissions().canViewOnly).toBe(true);
    });

    it('should return default permissions when not logged in', () => {
      expect(service.permissions().canManageDevices).toBe(false);
      expect(service.permissions().canViewOnly).toBe(true);
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin canManageDevices', () => {
      service.login('admin');
      expect(service.hasPermission('canManageDevices')).toBe(true);
    });

    it('should return false for viewer canManageDevices', () => {
      service.login('viewer');
      expect(service.hasPermission('canManageDevices')).toBe(false);
    });
  });

  describe('loadUserFromStorage', () => {
    it('should restore user from localStorage on init', () => {
      const mockUser = {
        id: 'user-1',
        username: 'admin',
        displayName: 'System Admin',
        role: 'admin'
      };
      localStorage.setItem('swc_auth_user', JSON.stringify(mockUser));

      // Force re-creation to test storage loading
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(AuthService);

      expect(freshService.isAuthenticated()).toBe(true);
      expect(freshService.userRole()).toBe('admin');
    });
  });
});
