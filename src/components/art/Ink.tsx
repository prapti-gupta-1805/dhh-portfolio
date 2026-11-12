import { memo } from 'react';
import type { Item } from '../../art/geometry';

/** Renders generated ink items. Colours come from CSS: currentColor = ink, --ink-ground = paper/skin. */
export const Ink = memo(function Ink({ items }: { items: Item[] }) {
  return (
    <>
      {items.map((it, i) => {
        switch (it.k) {
          case 'ink':
            return <path key={i} d={it.d} fill="currentColor" />;
          case 'paper':
            return <path key={i} d={it.d} fill="var(--ink-ground)" />;
          default:
            return (
              <path
                key={i}
                d={it.d}
                fill="none"
                stroke={it.k === 'line' ? 'currentColor' : 'var(--ink-ground)'}
                strokeWidth={it.w ?? 1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
        }
      })}
    </>
  );
});
