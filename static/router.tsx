import React, {createContext, useContext, useSyncExternalStore, useMemo} from 'react';
import {byId} from './data';
import {detailHash, parseRoute, normalizeId} from './model.mjs';

const events = new Map<string, Set<(...args: string[]) => void>>();
const emitter = {
  on(event: string, listener: (...args: string[]) => void) {
    if (!events.has(event)) events.set(event, new Set());
    events.get(event)!.add(listener);
  },
  off(event: string, listener: (...args: string[]) => void) {
    events.get(event)?.delete(listener);
  },
  emit(event: string, ...args: string[]) {
    events.get(event)?.forEach((listener) => listener(...args));
  },
};
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
let previousHash = location.hash;
let departing = false;
let restoring = false;
const positions = new Map<string, number>();

function recordDeparture(nextHash = location.hash) {
  positions.set(previousHash, window.scrollY);
  emitter.emit('routeChangeStart', makeRouter(nextHash).asPath);
  departing = true;
}
function changed() {
  if (!departing) recordDeparture();
  const hash = location.hash;
  const position = positions.get(hash) || 0;
  previousHash = hash;
  departing = false;
  restoring = true;
  for (const listener of listeners) listener();
  requestAnimationFrame(() => {
    if (location.hash !== hash) return;
    window.scrollTo(0, position);
    restoring = false;
  });
}
window.addEventListener('hashchange', changed);
window.addEventListener(
  'scroll',
  () => {
    if (!departing && !restoring) positions.set(previousHash, window.scrollY);
  },
  {passive: true},
);
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

export function toHash(href: string) {
  if (href.startsWith('#') || !href.startsWith('/')) return href;
  if (href.startsWith('/details/')) {
    const [id, query] = href.slice('/details/'.length).split('?');
    const normalized = normalizeId(id);
    if (!normalized) return '#invalid';
    const pixelcon = byId.get(normalized);
    const defaultHash = detailHash(
      normalized,
      pixelcon?.name || '',
      pixelcon?.index,
      pixelcon ? Math.floor(pixelcon.date / 1000) : undefined,
    );
    const params = new URLSearchParams(defaultHash.split('?')[1]);
    for (const [key, value] of new URLSearchParams(query)) params.set(key, value);
    return `#${normalized}${params.size ? `?${params}` : ''}`;
  }
  return `#${href.slice(1)}`;
}
function navigate(href: string, replace = false) {
  const hash = toHash(href);
  if (hash === (location.hash || '#')) return Promise.resolve(true);
  recordDeparture(hash);
  if (replace) {
    history.replaceState(null, '', hash);
    changed();
  } else location.hash = hash;
  return Promise.resolve(true);
}
const RouterContext = createContext<ReturnType<typeof makeRouter> | null>(null);
function makeRouter(hash: string) {
  const route = parseRoute(hash);
  let pathname = '/';
  let asPath = '/';
  let query: Record<string, string> = {};
  if (route.page === 'browse') {
    query = Object.fromEntries(route.params);
    asPath = '/' + (route.params.size ? '?' + route.params.toString() : '');
  } else if (route.page === 'details') {
    pathname = '/details/[id]';
    query = Object.fromEntries(new URLSearchParams(hash.split('?')[1]));
    query.id = route.id;
    asPath = '/details/' + route.id + (hash.includes('?') ? '?' + hash.split('?')[1] : '');
  } else pathname = asPath = '/' + route.page;
  return {
    pathname,
    asPath,
    query,
    route,
    events: emitter,
    push: (url: string) => navigate(url),
    replace: (url: string) => navigate(url, true),
    back: () => {
      recordDeparture();
      history.back();
    },
    isReady: true,
  };
}
export function RouterProvider({children}: {children: React.ReactNode}) {
  const hash = useSyncExternalStore(subscribe, () => location.hash);
  const router = useMemo(() => makeRouter(hash), [hash]);
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
}
export function useRouter() {
  const router = useContext(RouterContext);
  if (!router) throw new Error('RouterProvider is missing');
  return router;
}
