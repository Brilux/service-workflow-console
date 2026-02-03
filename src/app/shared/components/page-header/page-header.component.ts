import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        @if (icon) {
          <mat-icon class="header-icon">{{ icon }}</mat-icon>
        }
        <div class="header-text">
          <h1 class="page-title">{{ title }}</h1>
          @if (subtitle) {
            <p class="page-subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      <div class="header-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .header-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: #3f51b5;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
      color: #212121;
    }

    .page-subtitle {
      margin: 0;
      color: #757575;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
}
