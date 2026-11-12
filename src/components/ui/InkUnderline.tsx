import { motion } from 'framer-motion';
import { EASE_INK } from '../motion';

/** A hand-drawn red marker stroke that draws itself in. */
export function InkUnderline({ delay = 0, className = '' }: { delay?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true" fill="none">
      <motion.path
        d="M4 22C62 12 128 9 196 12C250 14 300 19 396 9"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.75, delay, ease: EASE_INK }}
      />
      <motion.path
        d="M30 29C110 21 210 19 330 22"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, delay: delay + 0.35, ease: EASE_INK }}
      />
    </svg>
  );
}
