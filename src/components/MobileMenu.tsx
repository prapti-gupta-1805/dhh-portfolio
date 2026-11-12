import { useEffect, useRef, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sections, site } from '../content/site';
import { ArrowSwap } from './ui/Button';
import { EASE_INK } from './motion';

type Props = { open: boolean; onClose: () => void; returnFocus: RefObject<HTMLButtonElement | null>; active: string | null };

/**
 * Full-screen red poster menu. Opens as an ink bloom from the menu button,
 * closes by soaking back into it. Focus is trapped while open; Esc closes.
 */
export function MobileMenu({ open, onClose, returnFocus, active }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = panel.current?.querySelector<HTMLElement>('a');
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      // trap focus between the menu button and the panel's links
      const btn = returnFocus.current;
      const focusables = [btn, ...panel.current.querySelectorAll<HTMLElement>('a')].filter(Boolean) as HTMLElement[];
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1) : i === focusables.length - 1 ? 0 : i + 1;
      e.preventDefault();
      focusables[next]?.focus();
    };
    document.addEventListener('keydown', onKey);
    const btn = returnFocus.current;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      btn?.focus({ preventScroll: true });
    };
  }, [open, onClose, returnFocus]);

  // close if the viewport grows into desktop layout
  useEffect(() => {
    if (!open) return;
    const m = window.matchMedia('(min-width: 64rem)');
    const fn = () => m.matches && onClose();
    m.addEventListener('change', fn);
    return () => m.removeEventListener('change', fn);
  }, [open, onClose]);

  const origin = 'calc(100% - 44px) 30px';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          data-surface="red"
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-blood px-[var(--gutter)] pb-8 pt-[calc(var(--nav-h)+2rem)] text-ivory lg:hidden"
          style={{ ['--ink-ground' as string]: 'var(--color-blood)' }}
          initial={{ clipPath: `circle(0% at ${origin})` }}
          animate={{ clipPath: `circle(150% at ${origin})` }}
          exit={{ clipPath: `circle(0% at ${origin})`, transition: { duration: 0.5, ease: [0.64, 0, 0.78, 0] } }}
          transition={{ duration: 0.75, ease: EASE_INK }}
        >
          {/* grain + halftone so the panel feels printed, not flat */}
          <div className="halftone pointer-events-none absolute right-0 top-0 h-2/3 w-2/3 rotate-180 text-crimson opacity-60" aria-hidden="true" />

          <p className="label-mono relative mb-6 text-ivory/80">Index — {site.volume}</p>
          <ul className="relative flex flex-col">
            {sections.map((s, i) => (
              <motion.li
                key={s.id}
                className="overflow-hidden border-t-[1.5px] border-ivory/35 last:border-b-[1.5px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <motion.a
                  href={`#${s.id}`}
                  onClick={onClose}
                  aria-current={active === s.id ? 'true' : undefined}
                  className="group flex items-baseline justify-between gap-4 py-2"
                  initial={{ y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 0.18 + i * 0.06, duration: 0.7, ease: EASE_INK }}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="label-mono text-ivory/75">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display text-[clamp(3rem,15vw,6.5rem)] leading-[0.95] transition-transform duration-500 ease-[var(--ease-ink)] group-hover:translate-x-2 group-aria-[current=true]:text-char">
                      {s.label}
                    </span>
                  </span>
                  <span lang="hi" className="font-deva text-xl text-ivory/80">
                    {s.hi}
                  </span>
                </motion.a>
              </motion.li>
            ))}
          </ul>

          <motion.div
            className="relative mt-auto flex flex-wrap items-end justify-between gap-6 pt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease: EASE_INK }}
          >
            <div className="flex flex-col gap-1">
              {(
                [
                  ['GitHub', site.links.github],
                  ['LinkedIn', site.links.linkedin],
                ] as const
              ).map(([label, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group label-mono flex items-center gap-2 py-2 text-[0.8rem]">
                  {label} <ArrowSwap diag />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
            </div>
            <p className="label-mono text-right text-ivory/80">
              {site.location.label}
              <br />
              {site.location.coords}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
