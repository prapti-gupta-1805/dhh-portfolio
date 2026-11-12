import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { sections, site } from '../content/site';
import { useActiveSection } from '../hooks/useActiveSection';
import { useDelhiClock } from '../hooks/useDelhiClock';
import { ArrowSwap } from './ui/Button';
import { MobileMenu } from './MobileMenu';
import { EASE_INK } from './motion';

const ids = sections.map((s) => s.id);

/** Letters that roll up into a red duplicate on hover. */
function Roll({ text }: { text: string }) {
  return (
    <span className="roll" aria-hidden="true">
      {[...text].map((ch, i) => (
        <span key={i} style={{ ['--i' as string]: i }}>
          <span>{ch}</span>
          <span>{ch}</span>
        </span>
      ))}
    </span>
  );
}

/** Hand-drawn ink scribble that slides to the active link. */
function ActiveInk() {
  return (
    <motion.svg
      layoutId="nav-ink"
      className="pointer-events-none absolute -bottom-[7px] left-[-6%] h-[9px] w-[112%] text-blood"
      viewBox="0 0 100 9"
      preserveAspectRatio="none"
      aria-hidden="true"
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <path
        d="M2 6.2C20 3 38 7.5 55 4.6S86 3 98 5.2M8 7.8C30 6 60 7.2 90 6.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}

export function Star({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0l2.1 8.2L21 3l-5.2 6.9L24 12l-8.2 2.1L21 21l-6.9-5.2L12 24l-2.1-8.2L3 21l5.2-6.9L0 12l8.2-2.1L3 3l6.9 5.2z"
      />
    </svg>
  );
}

export function Nav() {
  const active = useActiveSection(ids);
  const clock = useDelhiClock();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);

  // Sticky behaviour: tuck away while reading downward, return on any upward scroll.
  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    if (open) return;
    if (y > window.innerHeight * 0.6 && y - prev > 4) setHidden(true);
    else if (prev - y > 4 || y < 80) setHidden(false);
  });

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        initial={{ y: '-100%' }}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.5, ease: EASE_INK }}
        data-surface={open ? 'red' : undefined}
      >
        <nav
          aria-label="Primary"
          className={`flex h-[var(--nav-h)] items-center justify-between gap-6 px-[var(--gutter)] transition-[background-color,box-shadow,color] duration-300 ${
            open
              ? 'bg-transparent text-ivory'
              : `paper text-char ${scrolled ? 'shadow-[0_1.5px_0_var(--color-char),0_10px_30px_-18px_rgb(23_22_21/0.45)]' : 'shadow-[0_1.5px_0_var(--color-char)]'}`
          }`}
        >
          {/* Wordmark */}
          <a href="#top" className="group flex items-center gap-2" aria-label={`${site.name.full} — back to top`} onClick={() => setOpen(false)}>
            <Star className={`h-4 w-4 transition-transform duration-700 ease-[var(--ease-ink)] group-hover:rotate-[135deg] ${open ? 'text-ivory' : 'text-blood'}`} />
            <span className="display whitespace-nowrap text-[1.45rem] leading-none tracking-[0.01em]">
              {site.name.first} <span className={open ? '' : 'text-blood'}>{site.name.last}</span>
            </span>
          </a>

          {/* Section links */}
          <ul className="hidden items-center gap-5 lg:flex xl:gap-9">
            {sections.map((s, i) => (
              <li key={s.id} className="relative">
                <a
                  href={`#${s.id}`}
                  className="group label-mono flex items-baseline gap-1.5 py-2"
                  aria-current={active === s.id ? 'true' : undefined}
                >
                  <span className="text-[0.62rem] text-blood">{String(i + 1).padStart(2, '0')}</span>
                  <Roll text={s.label} />
                  <span className="sr-only">{s.label}</span>
                  {active === s.id && <ActiveInk />}
                </a>
              </li>
            ))}
          </ul>

          {/* Right cluster */}
          <div className="hidden items-center gap-6 lg:flex">
            <span className="label-mono hidden whitespace-nowrap text-ash-ink tabular-nums xl:inline" title="Local time in Delhi">
              {site.location.short} <span className="text-blood">●</span> {clock} IST
            </span>
            <span className="hidden h-5 w-px bg-char/40 xl:block" aria-hidden="true" />
            {(
              [
                ['GitHub', site.links.github],
                ['LinkedIn', site.links.linkedin],
              ] as const
            ).map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group label-mono flex items-center gap-1.5 py-2">
                <Roll text={label} />
                <span className="sr-only">{label} (opens in a new tab)</span>
                <span className="text-blood">
                  <ArrowSwap diag />
                </span>
              </a>
            ))}
          </div>

          {/* Mobile trigger */}
          <button
            ref={menuBtn}
            type="button"
            className="label-mono relative z-10 flex items-center gap-3 py-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'close' : 'menu'}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {open ? 'Close' : 'Menu'}
              </motion.span>
            </AnimatePresence>
            <span className="relative block h-3 w-7" aria-hidden="true">
              <span
                className={`absolute left-0 top-0 h-[2px] w-full bg-current transition-transform duration-500 ease-[var(--ease-ink)] ${open ? 'translate-y-[5px] rotate-[24deg]' : ''}`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[2px] bg-current transition-all duration-500 ease-[var(--ease-ink)] ${open ? 'w-full -translate-y-[5px] -rotate-[24deg]' : 'w-[65%]'}`}
              />
            </span>
          </button>
        </nav>
      </motion.header>

      <MobileMenu open={open} onClose={() => setOpen(false)} returnFocus={menuBtn} active={active} />
    </>
  );
}
