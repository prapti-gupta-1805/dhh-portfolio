import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useId } from 'react';

/** Circular rubber stamp, slightly uneven ink, turns a little as you scroll. */
export function Stamp({ text, className = '', delay = 1.3 }: { text: string; className?: string; delay?: number }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const spin = useTransform(scrollY, [0, 900], [-14, 40]);
  return (
    <motion.div
      className={`text-blood ${className}`}
      initial={{ opacity: 0, scale: 1.35, rotate: -40 }}
      animate={{ opacity: 0.92, scale: 1, rotate: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.5, 0, 0.2, 1] }}
      aria-hidden="true"
    >
      <motion.svg viewBox="0 0 200 200" className="ink-rough h-full w-full" style={{ rotate: reduced ? -14 : spin }}>
        <defs>
          <path id={`c-${id}`} d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0" />
        </defs>
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="5" />
        <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="52" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
        <text fill="currentColor" fontFamily="IBM Plex Mono, monospace" fontWeight="600" fontSize="14.2" letterSpacing="3.1">
          <textPath href={`#c-${id}`}>{text}</textPath>
        </text>
        <path
          fill="currentColor"
          transform="translate(78 78) scale(1.85)"
          d="M12 0l2.1 8.2L21 3l-5.2 6.9L24 12l-8.2 2.1L21 21l-6.9-5.2L12 24l-2.1-8.2L3 21l5.2-6.9L0 12l8.2-2.1L3 3l6.9 5.2z"
        />
      </motion.svg>
    </motion.div>
  );
}

/** The SVG filter that roughens stamp ink — mounted once at the app root. */
export function InkFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d" />
        <feComponentTransfer in="n" result="speck">
          <feFuncA type="discrete" tableValues="1 1 1 1 1 1 1 0.15" />
        </feComponentTransfer>
        <feComposite in="d" in2="speck" operator="in" />
      </filter>
    </svg>
  );
}
