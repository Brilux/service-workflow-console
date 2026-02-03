import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [MatChipsModule],
  template: `
    <span class="status-badge" [class]="'status-' + type">
      {{ label }}
    </span>
  `,
  styles: [`
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-success {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-warning {
      background: #fff3e0;
      color: #e65100;
    }

    .status-error {
      background: #ffebee;
      color: #c62828;
    }

    .status-info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status-default {
      background: #f5f5f5;
      color: #616161;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() type: StatusType = 'default';
}
