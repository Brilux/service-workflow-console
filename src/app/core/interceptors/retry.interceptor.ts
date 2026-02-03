import { HttpInterceptorFn } from '@angular/common/http';
import { retry, timer } from 'rxjs';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error, retryCount) => {
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        const delayMs = INITIAL_DELAY * Math.pow(2, retryCount - 1);
        console.log(`Retrying request (attempt ${retryCount}/${MAX_RETRIES}) in ${delayMs}ms`);
        return timer(delayMs);
      }
    })
  );
};
