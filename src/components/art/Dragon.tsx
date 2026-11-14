import { memo, useMemo, type ReactNode } from 'react';
import { heroDragon, heroFlash, HERO_VIEWBOX } from '../../art/heroDragon';
import { Ink } from './Ink';

type Range = readonly [number, number];
const inRanges = (s: number, rs: readonly Range[]) => rs.some(([a, b]) => s >= a && s < b);

type Props = {
  /** "under" draws everything except the over-ranges (plus the flash), "over" draws only the over-ranges */
  layer: 'under' | 'over' | 'all';
  overRanges?: readonly Range[];
  /** whether the head belongs to this layer */
  withHead?: boolean;
  /** draw the head invisibly: a hover target only (the visible head lives in another layer) */
  headHitOnly?: boolean;
  preserveAspectRatio?: string;
  className?: string;
  children?: ReactNode;
  onHeadEnter?: () => void;
  onHeadLeave?: () => void;
};

/**
 * The hero dragon. Two instances with identical framing (under + over) let the body weave
 * through the typography: over-chunks paint their paper body on top of the letters.
 */
export const Dragon = memo(function Dragon({
  layer,
  overRanges = [],
  withHead = layer !== 'under',
  headHitOnly = false,
  preserveAspectRatio = 'xMidYMid slice',
  className,
  children,
  onHeadEnter,
  onHeadLeave,
}: Props) {
  const chunks = useMemo(
    () =>
      heroDragon.chunks.filter((c) =>
        layer === 'all' ? true : layer === 'over' ? inRanges(c.s, overRanges) : !inRanges(c.s, overRanges),
      ),
    [layer, overRanges],
  );
  return (
    <svg
      viewBox={`0 0 ${HERO_VIEWBOX.w} ${HERO_VIEWBOX.h}`}
      preserveAspectRatio={preserveAspectRatio}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {layer !== 'over' && <Ink items={heroFlash} />}
      {chunks.map((c) => (
        <g key={c.s}>
          <Ink items={c.items} />
        </g>
      ))}
      {withHead && (
        <g
          transform={heroDragon.head.transform}
          style={{ ...(onHeadEnter ? { pointerEvents: 'visiblePainted' as const } : {}), ...(headHitOnly ? { opacity: 0 } : {}) }}
          data-cursor="dragon"
          onPointerEnter={onHeadEnter}
          onPointerLeave={onHeadLeave}
        >
          <Ink items={heroDragon.head.items} />
        </g>
      )}
      {children}
    </svg>
  );
});
