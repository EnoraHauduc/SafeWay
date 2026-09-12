/**
 * Report runtime errors to the parent window when this app is embedded in an iframe (e.g. Bilt web preview).
 * Parent expects: postMessage({ type: 'error', message: string }, targetOrigin)
 */

const BROWSER_EXTENSION_URL = /(?:chrome|moz|safari-web)-extension:\/\//i;

function getTargetOrigin(): string {
  if (typeof document === 'undefined' || !document.referrer) return '*';
  try {
    return new URL(document.referrer).origin;
  } catch {
    return '*';
  }
}

/**
 * Send an error message to the parent window via postMessage.
 * No-op when not in an iframe or when window is unavailable (SSR).
 */
export function reportErrorToParent(message: string): void {
  if (
    typeof window === 'undefined' ||
    window === window.parent ||
    BROWSER_EXTENSION_URL.test(message)
  ) {
    return;
  }
  try {
    window.parent.postMessage({ type: 'error', message }, getTargetOrigin());
  } catch {
    // Ignore postMessage failures (e.g. parent may have navigated away)
  }
}
