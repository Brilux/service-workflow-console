import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../../models';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="header-icon">hub</mat-icon>
          <mat-card-title>Service Workflow Console</mat-card-title>
          <mat-card-subtitle>Select your role to continue</mat-card-subtitle>
        </mat-card-header>
        <mat-divider></mat-divider>
        <mat-card-content>
          <p class="info-text">
            This is a demo application. Select a role below to explore the system
            with different permission levels.
          </p>
          <div class="role-options">
            @for (option of roleOptions; track option.role) {
              <button
                mat-stroked-button
                class="role-button"
                (click)="selectRole(option.role)">
                <mat-icon>{{ option.icon }}</mat-icon>
                <div class="role-info">
                  <span class="role-label">{{ option.label }}</span>
                  <span class="role-description">{{ option.description }}</span>
                </div>
              </button>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 24px;
    }

    .login-card {
      max-width: 480px;
      width: 100%;
    }

    .header-icon {
      background: #3f51b5;
      color: white;
      border-radius: 50%;
      padding: 8px;
      width: 48px !important;
      height: 48px !important;
      font-size: 32px !important;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    mat-card-header {
      padding: 24px 24px 16px;
    }

    mat-card-content {
      padding: 24px;
    }

    .info-text {
      color: #666;
      margin-bottom: 24px;
      line-height: 1.5;
    }

    .role-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .role-button {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 16px 24px;
      height: auto;
      text-align: left;
      gap: 16px;
    }

    .role-button mat-icon {
      color: #3f51b5;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .role-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-label {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }

    .role-description {
      font-size: 13px;
      color: #666;
      font-weight: normal;
    }

    .role-button:hover {
      background: rgba(63, 81, 181, 0.08);
    }
  `]
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly roleOptions: RoleOption[] = [
    {
      role: 'admin',
      label: 'Administrator',
      description: 'Full access to manage devices, tickets, and assignments',
      icon: 'admin_panel_settings'
    },
    {
      role: 'technician',
      label: 'Technician',
      description: 'Can manage devices and update tickets',
      icon: 'engineering'
    },
    {
      role: 'viewer',
      label: 'Viewer',
      description: 'Read-only access to view devices and tickets',
      icon: 'visibility'
    }
  ];

  selectRole(role: UserRole): void {
    this.authService.login(role);
    this.router.navigate(['/devices']);
  }
}
