import { MotionConfig } from 'framer-motion';
import { sections } from './content/site';
import { Nav } from './components/Nav';
import { Hero } from './components/hero/Hero';
import { InkFilters } from './components/hero/Stamp';
import { Cursor } from './components/ui/Cursor';
import { StubSection } from './components/StubSection';

const tones = ['aged', 'dark', 'paper', 'red', 'dark'] as const;

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <InkFilters />
      <Nav />
      <main id="main">
        <Hero />
        {sections.map((s, i) => (
          <StubSection key={s.id} id={s.id} n={i + 1} label={s.label} hi={s.hi} tone={tones[i]} />
        ))}
      </main>
      <Cursor />
    </MotionConfig>
  );
}
