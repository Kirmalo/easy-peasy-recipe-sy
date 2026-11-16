import { useCallback, useEffect, useState } from 'react';
import { parseRoute, pathFor, type Route, type HistoryState } from '../lib/router';
import type { ViewId } from '../types';

const current = (): Route => parseRoute(window.location.pathname, window.history.state);

/**
 * URL-backed navigation. Overlays (recipe detail, cooking mode) are history entries,
 * so the browser / Android Back button closes them instead of leaving the app.
 */
export function useRoute() {
  const [route, setRoute] = useState<Route>(current);

  useEffect(() => {
    // Record the tab for the landing entry so a deep link's Back/close knows where to go.
    const r = current();
    window.history.replaceState({ ...(window.history.state ?? {}), tab: r.view } satisfies HistoryState, '');
    const onPop = () => setRoute(current());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((next: Route, mode: 'push' | 'replace', pushedOverlay = false) => {
    const state: HistoryState = { tab: next.view, pushedOverlay };
    if (mode === 'push') window.history.pushState(state, '', pathFor(next));
    else window.history.replaceState(state, '', pathFor(next));
    setRoute(next);
  }, []);

  const setView = useCallback((view: ViewId) => {
    const r = current();
    if (r.view === view && r.detailId === null && r.cookId === null) return;
    go({ view, detailId: null, cookId: null }, 'push');
  }, [go]);

  const openDetail = useCallback((id: number) => {
    const r = current();
    go({ view: r.view, detailId: id, cookId: null }, 'push', true);
  }, [go]);

  const startCooking = useCallback((id: number) => {
    const r = current();
    const onOverlay = r.detailId !== null || r.cookId !== null;
    // Replace the detail overlay so Back from cooking returns to the tab, not the detail.
    const pushed = onOverlay ? Boolean((window.history.state as HistoryState | null)?.pushedOverlay) : true;
    go({ view: r.view, detailId: null, cookId: id }, onOverlay ? 'replace' : 'push', pushed);
  }, [go]);

  const closeOverlay = useCallback(() => {
    const r = current();
    if (r.detailId === null && r.cookId === null) return;
    if ((window.history.state as HistoryState | null)?.pushedOverlay) window.history.back();
    else go({ view: r.view, detailId: null, cookId: null }, 'replace'); // landed via deep link
  }, [go]);

  return { route, setView, openDetail, startCooking, closeOverlay };
}
