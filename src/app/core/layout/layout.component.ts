import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../features/auth/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav mode="side" opened class="app-sidenav">
        <div class="sidenav-header">
          <mat-icon class="logo-icon">hub</mat-icon>
          <span class="app-title">Service Console</span>
        </div>
        <mat-divider></mat-divider>
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active-link">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-spacer"></span>
          <div class="user-section">
            <mat-chip-set>
              <mat-chip [highlighted]="true">
                {{ roleLabel() }}
              </mat-chip>
            </mat-chip-set>
            <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
              <mat-icon>account_circle</mat-icon>
              <span>{{ user()?.displayName }}</span>
              <mat-icon>arrow_drop_down</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item disabled>
                <mat-icon>person</mat-icon>
                <span>{{ user()?.username }}</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="onLogout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </div>
        </mat-toolbar>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }

    .app-sidenav {
      width: 240px;
      background: #fafafa;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 12px;
    }

    .logo-icon {
      color: #3f51b5;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .app-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
      background: #f5f5f5;
    }

    .active-link {
      background: rgba(63, 81, 181, 0.1);
      border-right: 3px solid #3f51b5;
    }

    mat-nav-list a {
      margin: 4px 8px;
      border-radius: 8px;
    }
  `]
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly roleLabel = computed(() => {
    const role = this.authService.userRole();
    const labels: Record<string, string> = {
      admin: 'Admin',
      technician: 'Technician',
      viewer: 'Viewer'
    };
    return role ? labels[role] : '';
  });

  readonly navItems: NavItem[] = [
    { label: 'Devices', route: '/devices', icon: 'devices' },
    { label: 'Service Tickets', route: '/tickets', icon: 'assignment' }
  ];

  onLogout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }
}
