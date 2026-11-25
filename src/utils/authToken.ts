import { settings, storageKeys } from "@/config/settings";
import { connectedContent } from "@/content";

// One owner for the stored sign-in token. WordPress issues short-lived JWTs and hides
// the reason when it rejects one ("Internal server error"), so the storefront checks
// the token's own expiry before sending it instead of guessing from error messages.
export const AUTH_EXPIRED_EVENT = "chronos-auth-expired";
export const SIGN_IN_AGAIN = connectedContent.auth.signInAgain;

function expiryMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    return typeof claims?.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function storedAuthToken(): string | null {
  try { return localStorage.getItem(storageKeys.authToken); } catch { return null; }
}

export function storeAuthToken(token: string): void {
  localStorage.setItem(storageKeys.authToken, token);
}

/**
 * Remove the stored token. With `expected`, only that exact token is removed, so a slow
 * answer about an old token cannot sign out someone who has just signed in again.
 */
export function clearAuthToken(expected?: string): boolean {
  try {
    const current = localStorage.getItem(storageKeys.authToken);
    if (current === null || (expected !== undefined && current !== expected)) return false;
    localStorage.removeItem(storageKeys.authToken);
    return true;
  } catch {
    return false;
  }
}

/** True only when the token states an expiry that has passed (or is within the margin). */
export function isAuthTokenExpired(token: string, now = Date.now()): boolean {
  const expiry = expiryMs(token);
  return expiry !== null && expiry - settings.authExpiryMarginMs <= now;
}

/** Remove a token that no longer works and tell the app the visitor is signed out. */
export function rejectAuthToken(token: string): void {
  if (clearAuthToken(token)) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

/** The stored token if it can still be used; an expired token is rejected and null returned. */
export function usableAuthToken(): string | null {
  const token = storedAuthToken();
  if (token && isAuthTokenExpired(token)) {
    rejectAuthToken(token);
    return null;
  }
  return token;
}
