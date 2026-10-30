import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: unknown; title?: unknown };
    if (typeof body?.message === 'string') {
      return body.message;
    }
    if (typeof body?.title === 'string') {
      return body.title;
    }
    if (error.status === 0) {
      return 'Cannot reach the API. Check that the backend is running.';
    }
    return `The API request failed (${error.status}).`;
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Cannot reach the API. Check that the backend is running.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
