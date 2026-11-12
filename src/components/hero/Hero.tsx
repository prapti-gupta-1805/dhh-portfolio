import { useRef, useState, type PointerEvent } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { site } from '../../content/site';
import { useFinePointer, useIsDesktop } from '../../hooks/useMediaQuery';
import { Dragon } from '../art/Dragon';
import { Button } from '../ui/Button';
import { InkUnderline } from '../ui/InkUnderline';
import { EASE_INK } from '../motion';
import { Annotation } from './Annotation';
import { HeroTitle } from './HeroTitle';
import { ScrollCue } from './ScrollCue';
import { Stamp } from './Stamp';
import { Star } from '../Nav';

/** Body ranges (0 = head, 1 = tail) that pass IN FRONT of the name. */
const OVER: readonly (readonly [number, number])[] = [
  [0.385, 0.47],
  [0.0, 0.035],
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const desktop = useIsDesktop();
  const fine = useFinePointer();
  const [headHover, setHeadHover] = useState(false);
  const [schoolHover, setSchoolHover] = useState(false);

  // Parallax: the beast drifts slower than the page as the hero scrolls away.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const py = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '16%']);
  const pr = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -2.5]);

  // Pointer drift: a few pixels, like the page breathing under your hand.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const onMove = (e: PointerEvent) => {
    if (reduced || !fine) return;
    mx.set((e.clientX / window.innerWidth - 0.5) * -16);
    my.set((e.clientY / window.innerHeight - 0.5) * -10);
  };


  const artFrame = desktop ? 'absolute inset-0' : 'absolute inset-x-0 top-[25svh] h-[62svh]';
  const aspect = desktop ? 'xMinYMid slice' : 'xMaxYMin slice';

  const fadeUp = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 18 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.8, ease: EASE_INK },
  });

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      className="hero paper relative isolate flex min-h-[100svh] flex-col overflow-hidden lg:min-h-[max(100svh,720px)]"
      onPointerMove={onMove}
    >
      {/* ── Layer 0: dragon (under the type) ─────────────────────────── */}
      <motion.div className={`${artFrame} z-0 text-blood`} style={{ y: py, rotate: pr }} aria-hidden="true">
        <motion.div className="h-full w-full" style={{ x: sx, y: sy }}>
          <div className="ink-bloom h-full w-full">
            <Dragon
              layer={desktop ? 'under' : 'all'}
              overRanges={OVER}
              withHead={!desktop}
              preserveAspectRatio={aspect}
              className={`h-full w-full `}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Left rail: Devanagari name + volume ───────────────────────── */}
      <div
        className="pointer-events-none absolute bottom-10 left-[var(--gutter)] top-[calc(var(--nav-h)+2rem)] z-30 hidden flex-col items-center justify-between lg:flex"
        aria-hidden="true"
      >
        <motion.span
          lang="hi"
          className="font-deva text-[1.65rem] leading-none text-crimson [writing-mode:vertical-rl]"
          {...fadeUp(1.1)}
        >
          {site.name.devanagari}
        </motion.span>
        <span className="label-mono rotate-180 text-ash-ink [writing-mode:vertical-rl]">{site.volume}</span>
      </div>

      {/* ── Layer 1: poster header + name ─────────────────────────────── */}
      <div className="relative z-10 px-[var(--gutter)] pt-[calc(var(--nav-h)+1.25rem)] lg:pl-[calc(var(--gutter)+3.4rem)] lg:pt-[calc(var(--nav-h)+2.2vh)]">
        <motion.div className="relative z-30 mb-3 flex items-center gap-3 lg:mb-[1.5vh]" {...fadeUp(0.05)}>
          <span className="label-mono whitespace-nowrap">{site.location.label}</span>
          <span className="rule-perf h-[1.5px] flex-1 text-char/60" aria-hidden="true" />
          <span className="label-mono hidden whitespace-nowrap text-ash-ink sm:inline">{site.location.coords}</span>
          <span className="font-deva whitespace-nowrap text-sm leading-none text-crimson lg:hidden" lang="hi">
            {site.name.devanagari}
          </span>
        </motion.div>
        <HeroTitle />
      </div>

      {/* ── Layer 2: dragon coils that pass IN FRONT of the name ──────── */}
      {desktop && (
        <motion.div className={`${artFrame} pointer-events-none z-20 text-blood`} style={{ y: py, rotate: pr }} aria-hidden="true">
          <motion.div className="h-full w-full" style={{ x: sx, y: sy }}>
            <div className="ink-bloom h-full w-full">
              <Dragon
                layer="over"
                overRanges={OVER}
                withHead
                preserveAspectRatio={aspect}
                className="h-full w-full"
                onHeadEnter={() => setHeadHover(true)}
                onHeadLeave={() => setHeadHover(false)}
              >
                <AnimatePresence>
                  {headHover && (
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-blood"
                    >
                      <motion.path
                        d="M780 150C815 132 852 150 880 196M866 172L882 199L897 176"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, ease: EASE_INK }}
                      />
                      <text x="560" y="150" fill="currentColor" fontFamily="Permanent Marker, cursive" fontSize="27" transform="rotate(-5 660 140)">
                        hand-coded. no AI art.
                      </text>
                    </motion.g>
                  )}
                </AnimatePresence>
              </Dragon>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Layer 3: copy, actions, headline ──────────────────────────── */}
      <div className="relative z-30 mt-auto grid grid-cols-1 gap-x-8 gap-y-10 px-[var(--gutter)] pb-8 pt-[44svh] lg:grid-cols-12 lg:items-end lg:pb-[3.5vh] lg:pl-[calc(var(--gutter)+3.4rem)] lg:pt-4">
        {/* headline (first in DOM on mobile so it reads after the name) */}
        <div className="relative lg:order-3 lg:col-span-5 lg:text-right">
          <motion.p
            className="marker absolute -top-9 left-1 lg:-top-10 lg:left-auto lg:right-[52%]"
            style={{ rotate: -7 }}
            {...fadeUp(1.7)}
          >
            {site.headlineNote}
          </motion.p>
          <h2 className="display text-[clamp(3.6rem,17vw,5.5rem)] text-char lg:text-[length:min(7.4vw,13.5svh)]">
            {site.headline.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.04em]">
                <motion.span
                  className="relative inline-block"
                  initial={reduced ? false : { y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ delay: 0.95 + i * 0.1, duration: 0.85, ease: EASE_INK }}
                >
                  {line}
                  {i === site.headline.length - 1 && (
                    <InkUnderline delay={reduced ? 0 : 1.55} className="absolute -bottom-[0.06em] left-[-2%] h-[0.2em] w-[104%] text-blood" />
                  )}
                </motion.span>
              </span>
            ))}
          </h2>
        </div>

        {/* scroll cue */}
        <motion.div className="hidden self-end lg:order-2 lg:col-span-2 lg:flex lg:justify-center" {...fadeUp(1.6)}>
          <ScrollCue />
        </motion.div>

        {/* sticker panel: metadata, intro, actions */}
        <motion.div
          className="relative border-[1.5px] border-char bg-ivory p-5 shadow-[6px_6px_0_var(--color-char)] sm:p-7 lg:order-1 lg:col-span-5 lg:max-w-[34rem] lg:-rotate-[0.6deg]"
          {...fadeUp(1.15)}
        >
          <Stamp
            text={`${site.education.school} · ${site.education.degree} · DELHI · `}
            className="absolute -right-5 -top-16 h-24 w-24 sm:-right-10 sm:-top-20 sm:h-32 sm:w-32 lg:-right-16 lg:top-[42%] lg:h-28 lg:w-28"
          />
          <ul className="label-mono mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 pr-16 sm:pr-20" aria-label="At a glance">
            <li>{site.location.label}</li>
            <li aria-hidden="true" className="text-blood">
              /
            </li>
            <li className="whitespace-nowrap">
              {site.disciplines.map((d, i) => (
                <span key={d}>
                  {i > 0 && <span className="text-blood"> · </span>}
                  {d}
                </span>
              ))}
            </li>
            <li aria-hidden="true" className="text-blood">
              /
            </li>
            <li className="relative">
              <span
                tabIndex={0}
                className="cursor-help underline decoration-blood decoration-dotted underline-offset-4 outline-none focus-visible:outline-2 focus-visible:outline-blood"
                aria-describedby="school-note"
                onPointerEnter={() => setSchoolHover(true)}
                onPointerLeave={() => setSchoolHover(false)}
                onFocus={() => setSchoolHover(true)}
                onBlur={() => setSchoolHover(false)}
              >
                {site.education.school}
              </span>
              <span id="school-note" className="sr-only">
                {site.education.year}, {site.education.degree}
              </span>
              <span className="absolute bottom-[calc(100%+0.35rem)] left-0">
                <Annotation show={schoolHover} text={`${site.education.year}, ${site.education.degree}`} arrow="none" rotate={-3} />
              </span>
            </li>
          </ul>

          <p className="mb-7 max-w-[30rem] text-[length:var(--fs-lead)] leading-[1.55] text-char">{site.intro}</p>

          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
            <Button href="#work" variant="primary">
              Explore my work
            </Button>
            <Button href="#contact" variant="outline" arrow={false}>
              Get in touch
            </Button>
            <Button href={site.links.github} variant="link" external className="sm:ml-1">
              View GitHub
            </Button>
          </div>

          <Star className="absolute -bottom-3 left-6 h-6 w-6 text-blood" />
        </motion.div>
      </div>
    </section>
  );
}
