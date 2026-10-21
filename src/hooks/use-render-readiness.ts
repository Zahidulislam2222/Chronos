import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { renderReadiness } from '@/lib/render-readiness.mjs';

export function useRenderReadiness() {
  const cache = useQueryClient().getQueryCache();
  const subscribe = useCallback((notify: () => void) => cache.subscribe(notify), [cache]);
  const snapshot = useCallback(() => renderReadiness(cache), [cache]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
