import * as React from "react";

import { interfaceSettings } from "@/config/interface";
const mobileQuery = `(max-width: ${interfaceSettings.mobileBreakpoint - 1}px)`;
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const snapshot = () => window.matchMedia(mobileQuery).matches;
const serverSnapshot = () => false;
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
