"use client";

import { useSyncExternalStore } from "react";

// One shared timer for every countdown on the page.
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

/** When this module was loaded in the browser, used as "page load" for mock deadlines. */
export const clockStart = Date.now();

/**
 * Current time in ms, ticking every second. It is null on the server and during hydration, so
 * server and first client render match; components show a placeholder until the clock starts.
 */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}
