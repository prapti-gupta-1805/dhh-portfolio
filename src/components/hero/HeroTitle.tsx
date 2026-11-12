import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { site } from '../../content/site';
import { useFinePointer } from '../../hooks/useMediaQuery';
import { EASE_INK } from '../motion';
import { Annotation } from './Annotation';

function Letters({ word, delay }: { word: string; delay: number }) {
  const reduced = useReducedMotion();
  return (
    <span className="ink-erode misregister inline-flex overflow-hidden pb-[0.02em] pt-[0.06em]" aria-hidden="true">
      {[...word].map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={reduced ? false : { y: '108%', rotate: 4 }}
          animate={{ y: '0%', rotate: 0 }}
          transition={{ delay: delay + i * 0.05, duration: 0.9, ease: EASE_INK }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

/** PRAPTI / GUPTA — oversized, offset, eroded like a photocopied gig poster. */
export function HeroTitle() {
  const fine = useFinePointer();
  const [hover, setHover] = useState(false);
  return (
    <h1
      className="display relative select-none text-blood"
      style={{ fontSize: 'var(--fs-name-hero)' }}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      data-cursor="text"
    >
      <span className="sr-only">{site.name.full}</span>
      <span className="block leading-[0.8]">
        <Letters word={site.name.first} delay={0.15} />
      </span>
      <span className="relative ml-[13vw] inline-block leading-[0.8] lg:ml-[19vw]">
        <Letters word={site.name.last} delay={0.35} />
        <span className="absolute left-[calc(100%+0.6rem)] top-[38%] hidden sm:block">
          <Annotation show={hover || !fine} text="that's me. hi." arrow="left" rotate={-6} />
        </span>
      </span>
    </h1>
  );
}
