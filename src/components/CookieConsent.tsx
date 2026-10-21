import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { storageKeys } from "@/config/settings";

/**
 * Returns the user's cookie consent status.
 * Other components can import this to check before loading analytics/tracking.
 */
export function getCookieConsent(): 'accepted' | 'declined' | null {
  let value: string | null = null;
  try { value = typeof window === 'undefined' ? null : localStorage.getItem(storageKeys.cookieConsent); } catch { /* Storage can be disabled. */ }
  if (value === 'accepted' || value === 'declined') return value;
  return null;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => getCookieConsent() === null);

  const accept = () => {
    try { localStorage.setItem(storageKeys.cookieConsent, 'accepted'); } catch { /* Dismiss for this page only. */ }
    setVisible(false);
    // If analytics scripts need to load after consent, trigger them here:
    // window.dispatchEvent(new Event('cookie-consent-granted'));
  };

  const decline = () => {
    try { localStorage.setItem(storageKeys.cookieConsent, 'declined'); } catch { /* Dismiss for this page only. */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border p-4 shadow-lg"
    >
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          We use essential cookies for authentication and cart functionality.
          By clicking "Accept", you consent to our use of cookies.{' '}
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button variant="gold" size="sm" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
