import { AnimatePresence, motion } from 'framer-motion';
import { EASE_INK } from '../motion';

type Props = {
  show: boolean;
  text: string;
  /** which way the hand-drawn arrow points */
  arrow?: 'left' | 'down-left' | 'up' | 'none';
  className?: string;
  rotate?: number;
};

const ARROWS = {
  left: { vb: '0 0 70 40', d: 'M66 26C50 30 30 30 10 18', head: 'M18 10L8 18L20 24' },
  'down-left': { vb: '0 0 60 60', d: 'M52 6C50 26 38 42 12 50', head: 'M14 38L10 51L24 54' },
  up: { vb: '0 0 40 60', d: 'M22 56C14 40 14 22 20 6', head: 'M10 14L20 5L28 15' },
} as const;

/** Marker-pen margin note that writes itself in. */
export function Annotation({ show, text, arrow = 'left', className = '', rotate = -4 }: Props) {
  const a = arrow === 'none' ? null : ARROWS[arrow];
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className={`marker pointer-events-none flex items-center gap-1 whitespace-nowrap normal-case tracking-normal ${className}`}
          style={{ rotate }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4, transition: { duration: 0.18 } }}
          transition={{ duration: 0.35, ease: EASE_INK }}
          aria-hidden="true"
        >
          {a && (
            <svg viewBox={a.vb} className="h-[1.9em] w-auto shrink-0 overflow-visible" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d={a.d} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_INK }} />
              <motion.path d={a.head} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2, delay: 0.38 }} />
            </svg>
          )}
          <motion.span
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.5, delay: a ? 0.25 : 0, ease: 'linear' }}
          >
            {text}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
