import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { apiInterceptor, errorInterceptor, retryInterceptor } from './core/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      // Order: api transforms URL, error handles failures, retry wraps errors to retry
      // On response path, interceptors run in reverse order: retry -> error -> api
      withInterceptors([apiInterceptor, errorInterceptor, retryInterceptor])
    ),
    provideAnimationsAsync()
  ]
};
