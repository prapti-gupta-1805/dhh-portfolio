import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string, serverFallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

export const useIsDesktop = () => useMediaQuery('(min-width: 64rem)');
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');
