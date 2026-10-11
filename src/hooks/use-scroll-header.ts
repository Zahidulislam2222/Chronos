import { useEffect, useRef, useState } from "react";
import { navigationSettings } from "@/config/navigation";

export function useScrollHeader(pathname: string, pinned: boolean) {
  const headerRef = useRef<HTMLElement>(null);
  const [state, setState] = useState({ hidden: false, scrolled: false });

  useEffect(() => {
    let previousY = window.scrollY;
    let distance = 0;
    let direction = 0;
    const update = (hidden: boolean, scrolled: boolean) => {
      setState(current => current.hidden === hidden && current.scrolled === scrolled
        ? current : { hidden, scrolled });
    };
    const onScroll = () => {
      // Clamp elastic overscroll so reaching either page edge cannot reverse direction.
      const limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(window.scrollY, limit));
      const delta = y - previousY;
      const nextDirection = Math.sign(delta);
      previousY = y;
      const scrolled = y > navigationSettings.header.topThresholdPx;
      const focused = Boolean(headerRef.current?.querySelector(":focus-visible"));
      if (pinned || focused || y <= (headerRef.current?.offsetHeight ?? 0)) {
        distance = 0;
        direction = 0;
        update(false, scrolled);
        return;
      }
      if (nextDirection === 0) return;
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      if (distance >= navigationSettings.header.directionThresholdPx) {
        update(direction > 0, scrolled);
        distance = 0;
      } else {
        setState(current => current.scrolled === scrolled ? current : { ...current, scrolled });
      }
    };
    const onFocus = () => {
      distance = 0;
      update(false, window.scrollY > navigationSettings.header.topThresholdPx);
    };
    const header = headerRef.current;
    update(false, window.scrollY > navigationSettings.header.topThresholdPx);
    window.addEventListener("scroll", onScroll, { passive: true });
    header?.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("scroll", onScroll);
      header?.removeEventListener("focusin", onFocus);
    };
  }, [pathname, pinned]);

  return { headerRef, ...state };
}
