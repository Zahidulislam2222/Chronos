// Shared DOM protocol for the real application and its build-time browser.
export const renderStateAttribute = 'data-render-state';

export function renderReadiness(cache) {
  const active = cache.findAll({type: 'active'});
  // Wait for observers to mount; disabled account queries are not active.
  if (!active.length) return 'pending';
  if (active.some(query => query.state.status === 'error')) return 'error';
  if (active.some(query => query.state.status !== 'success' || query.state.fetchStatus !== 'idle')) return 'pending';
  return 'ready';
}
