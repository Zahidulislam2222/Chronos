import { useSyncExternalStore } from "react";
// CSS media feature syntax is a fixed browser protocol, not product configuration.
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const snapshot = () => window.matchMedia(reducedMotionQuery).matches;
const serverSnapshot = () => true;
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
