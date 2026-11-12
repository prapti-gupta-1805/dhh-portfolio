import type { Item } from './geometry';

/** Serialise items to SVG markup (used by the QA render script and for static exports). */
export function itemsToSvg(items: Item[], ink = '#C51F32', ground = '#F1E9DC'): string {
  return items
    .map((it) => {
      if (it.k === 'ink') return `<path d="${it.d}" fill="${ink}"/>`;
      if (it.k === 'paper') return `<path d="${it.d}" fill="${ground}"/>`;
      const c = it.k === 'line' ? ink : ground;
      return `<path d="${it.d}" fill="none" stroke="${c}" stroke-width="${it.w ?? 1}" stroke-linecap="round" stroke-linejoin="round"/>`;
    })
    .join('');
}
