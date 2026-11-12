/** Placeholder for sections arriving in later phases — keeps nav anchors + active indicator honest. */
export function StubSection({ id, n, label, hi, tone }: { id: string; n: number; label: string; hi: string; tone: 'paper' | 'aged' | 'dark' | 'red' }) {
  const cls =
    tone === 'dark' ? 'surface-dark' : tone === 'red' ? 'bg-blood text-ivory' : tone === 'aged' ? 'paper-aged' : 'paper';
  return (
    <section id={id} aria-labelledby={`${id}-h`} data-surface={tone === 'dark' ? 'dark' : tone === 'red' ? 'red' : undefined} className={`${cls} relative min-h-[70svh] border-t-[1.5px] border-char px-[var(--gutter)] py-24`}>
      <p className="label-mono mb-4 opacity-80">
        {String(n).padStart(2, '0')} / <span lang="hi" className="font-deva normal-case tracking-normal">{hi}</span>
      </p>
      <h2 id={`${id}-h`} className="display text-[clamp(4rem,14vw,13rem)]">
        {label}
      </h2>
      <p className="marker mt-6 opacity-90" style={{ color: 'inherit' }}>
        — coming in the next phase
      </p>
    </section>
  );
}
