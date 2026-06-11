/** Detect errors that mean the backend or database is temporarily unavailable. */
export function isApiUnavailableError(error: unknown): boolean {
  if (!error) return true;

  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed');
  }

  if (typeof error === 'object') {
    const e = error as {
      statusCode?: number;
      status?: number;
      message?: string;
      cause?: { code?: string };
    };

    const status = e.statusCode ?? e.status;
    if (status === 0 || status === 408 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    if (status && status >= 500) return true;

    const msg = (e.message || '').toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('econnrefused') ||
      msg.includes('network') ||
      msg.includes('timeout')
    ) {
      return true;
    }

    const code = e.cause?.code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      return true;
    }
  }

  return false;
}
