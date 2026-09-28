import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once the component has hydrated on the client. Implemented with
 * `useSyncExternalStore` (server snapshot always `false`, client snapshot
 * always `true`) rather than the common `useState(false)` +
 * `useEffect(() => setMounted(true), [])` pattern - the latter trips the
 * `react-hooks/set-state-in-effect` lint rule (synchronous setState as the
 * first thing an effect does), and this achieves the exact same "flip once
 * after hydration" behavior without an effect at all. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
