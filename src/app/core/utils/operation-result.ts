/**
 * Represents the result of an async operation tracked by operation ID.
 */
export interface OperationResult {
  status: 'idle' | 'success' | 'error';
  operationId: string | null;
}

/**
 * Callback handlers for operation result processing.
 */
export interface OperationResultHandlers {
  onSuccess: () => void;
  onError?: () => void;
}

/**
 * Handles operation result with guard clause pattern.
 * Returns true if the operation was handled (matched and not idle), false otherwise.
 *
 * @example
 * effect(() => {
 *   handleOperationResult(
 *     this.store.updateResult(),
 *     this.currentOperationId,
 *     {
 *       onSuccess: () => {
 *         this.saving = false;
 *         this.dialogRef.close(true);
 *       },
 *       onError: () => {
 *         this.saving = false;
 *       }
 *     }
 *   );
 * });
 */
export function handleOperationResult(
  result: OperationResult,
  expectedOperationId: string | null,
  handlers: OperationResultHandlers
): boolean {
  // Guard: operation ID must match and be non-null
  if (expectedOperationId === null || result.operationId !== expectedOperationId) {
    return false;
  }

  switch (result.status) {
    case 'success':
      handlers.onSuccess();
      return true;
    case 'error':
      handlers.onError?.();
      return true;
    case 'idle':
    default:
      return false;
  }
}
