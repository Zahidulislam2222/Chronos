import { fetchCurrentUser } from "@/utils/api";
import { storedAuthToken, isAuthTokenExpired, rejectAuthToken } from "@/utils/authToken";

export interface RestoredUser { id: string; name: string; email: string; avatar?: string }

/**
 * Work out who is signed in when the page loads. `current` is false when the visitor
 * signed in again while this check was running; the caller must then ignore the result.
 * An expired token is removed without asking the server; a network failure keeps it.
 */
export async function restoreSession(): Promise<{ user: RestoredUser | null; current: boolean }> {
  const token = storedAuthToken();
  if (!token) return { user: null, current: true };
  if (isAuthTokenExpired(token)) {
    rejectAuthToken(token); // quiet: the app only clears the session, no prompt
    return { user: null, current: true };
  }
  const stillCurrent = () => { const now = storedAuthToken(); return now === token || now === null; };
  try {
    const user = await fetchCurrentUser();
    return { user, current: storedAuthToken() === token };
  } catch {
    return { user: null, current: stillCurrent() };
  }
}
