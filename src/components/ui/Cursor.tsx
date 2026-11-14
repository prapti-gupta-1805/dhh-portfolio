import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useFinePointer } from '../../hooks/useMediaQuery';

type Mode = 'idle' | 'link' | 'press' | 'dragon' | 'text';

const RING: Record<Mode, number> = { idle: 30, link: 54, press: 74, dragon: 64, text: 46 };
const LABEL: Partial<Record<Mode, string>> = { press: 'PRESS', link: 'OPEN' };

/**
 * Red-ink cursor (desktop + fine pointer only, off under reduced motion):
 * the native cursor becomes a red ink dot (OS-drawn, zero lag; see base.css), plus a lightly trailing ring that swells over interactive things.
 *
 * Position is written straight to the DOM on each animation frame (no React renders, no springs),
 * so the ring stays close to the hardware pointer. React only re-renders when the hover mode changes.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-ink-cursor');

    let tx = -100, ty = -100; // target (pointer)
    let rx = -100, ry = -100; // ring (eased)
    let raf = 0;
    let lastMode: Mode = 'idle';
    let lastTarget: EventTarget | null = null;

    const tick = () => {
      rx += (tx - rx) * 0.5;
      ry += (ty - ry) * 0.5;
      if (Math.abs(tx - rx) < 0.1 && Math.abs(ty - ry) < 0.1) {
        rx = tx;
        ry = ty;
      }
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = rx === tx && ry === ty ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX;
      ty = e.clientY;
      if (rootRef.current) rootRef.current.style.opacity = '1';
      kick();

      // Only re-resolve hover mode when the element under the pointer changes.
      if (e.target === lastTarget) return;
      lastTarget = e.target;
      const t = e.target as Element | null;
      const el = t?.closest?.('[data-cursor], a, button, [role="button"]');
      const tag = el?.getAttribute('data-cursor');
      const next: Mode =
        tag === 'dragon' ? 'dragon'
        : tag === 'text' ? 'text'
        : el?.matches('.btn, button') ? 'press'
        : el ? 'link'
        : 'idle';
      if (next !== lastMode) {
        lastMode = next;
        document.documentElement.classList.toggle('cursor-active', next !== 'idle');
        setMode(next);
      }
    };
    const leave = () => {
      if (rootRef.current) rootRef.current.style.opacity = '0';
    };
    const pd = () => setDown(true);
    const pu = () => setDown(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', pd);
    window.addEventListener('pointerup', pu);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-ink-cursor', 'cursor-active');
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointerup', pu);
    };
  }, [enabled]);

  if (!enabled) return null;

  // Ring is drawn at max size and scaled down — scaling is compositor-only, width/height would re-layout.
  const scale = (RING[mode] / RING.press) * (down ? 0.82 : 1);
  const label = LABEL[mode];

  return (
    <div ref={rootRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]" style={{ opacity: 0 }}>
      <div ref={ringRef} className="absolute left-0 top-0 will-change-transform">
        <div
          className="flex items-center justify-center rounded-full border-blood text-blood"
          style={{
            width: RING.press,
            height: RING.press,
            borderWidth: 1.5 / scale,
            transform: `translate(-50%,-50%) scale(${scale})`,
            backgroundColor: mode === 'press' ? 'rgba(197,31,50,0.12)' : 'rgba(197,31,50,0)',
            transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), background-color 220ms, border-width 220ms',
          }}
        >
          {label && (
            <span className="font-mono text-[9px] font-semibold tracking-[0.18em]" style={{ transform: `scale(${1 / scale})` }}>
              {label}
            </span>
          )}
          {mode === 'dragon' && (
            <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transform: `scale(${1 / scale})` }}>
              <path d="M20 2v12M20 26v12M2 20h12M26 20h12" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
