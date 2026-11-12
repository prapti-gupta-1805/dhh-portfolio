import { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { useFinePointer } from '../../hooks/useMediaQuery';

type Mode = 'idle' | 'link' | 'press' | 'dragon' | 'text';

/**
 * Red-ink cursor (desktop + fine pointer only, off under reduced motion):
 * a solid ink dot that tracks exactly, and a lagging ring that swells over interactive things.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 420, damping: 34, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 420, damping: 34, mass: 0.6 });
  const [mode, setMode] = useState<Mode>('idle');
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-ink-cursor');
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const t = e.target as Element | null;
      const el = t?.closest?.('[data-cursor], a, button, [role="button"]');
      const tag = el?.getAttribute('data-cursor');
      if (tag === 'dragon') setMode('dragon');
      else if (tag === 'text') setMode('text');
      else if (el?.matches('.btn, button')) setMode('press');
      else if (el) setMode('link');
      else setMode('idle');
    };
    const leave = () => setVisible(false);
    const pd = () => setDown(true);
    const pu = () => setDown(false);
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('pointerdown', pd);
    window.addEventListener('pointerup', pu);
    return () => {
      document.documentElement.classList.remove('has-ink-cursor');
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointerup', pu);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ring =
    mode === 'press' ? 74 : mode === 'link' ? 54 : mode === 'dragon' ? 64 : mode === 'text' ? 46 : 30;
  const label = mode === 'press' ? 'PRESS' : mode === 'link' ? 'OPEN' : mode === 'dragon' ? '' : '';

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90]" style={{ opacity: visible ? 1 : 0 }}>
      <motion.div className="absolute left-0 top-0" style={{ x: rx, y: ry }}>
        <motion.div
          className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-blood text-blood"
          animate={{
            width: ring,
            height: ring,
            scale: down ? 0.82 : 1,
            backgroundColor: mode === 'press' ? 'rgba(197,31,50,0.12)' : 'rgba(197,31,50,0)',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          {label && <span className="font-mono text-[9px] font-semibold tracking-[0.18em]">{label}</span>}
          {mode === 'dragon' && (
            <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 2v12M20 26v12M2 20h12M26 20h12" />
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </svg>
          )}
        </motion.div>
      </motion.div>
      <motion.div className="absolute left-0 top-0" style={{ x, y }}>
        <div
          className="h-[7px] w-[7px] rounded-full bg-blood transition-transform duration-200"
          style={{ transform: `translate(-50%,-50%) scale(${mode === 'idle' ? 1 : 0.6})` }}
        />
      </motion.div>
    </div>
  );
}
