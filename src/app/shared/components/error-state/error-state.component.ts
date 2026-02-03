import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="error-state">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <h3 class="error-title">{{ title }}</h3>
      <p class="error-message">{{ message }}</p>
      @if (showRetry) {
        <button mat-stroked-button color="warn" (click)="retry.emit()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .error-title {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 500;
      color: #424242;
    }

    .error-message {
      margin: 0 0 24px;
      color: #757575;
      max-width: 400px;
    }

    button mat-icon {
      margin-right: 8px;
    }
  `]
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'An error occurred while loading the data.';
  @Input() showRetry = true;
  @Output() retry = new EventEmitter<void>();
}
