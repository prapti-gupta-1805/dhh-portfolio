/** "SCROLL — NEECHE CHALO" with an ink drop falling down a hairline. */
export function ScrollCue({ className = '' }: { className?: string }) {
  return (
    <a href="#about" className={`group flex items-center gap-3 ${className}`} aria-label="Scroll to the about section">
      <span className="relative block h-12 w-[1.5px] overflow-hidden bg-char/25" aria-hidden="true">
        <span className="drip absolute left-0 top-0 block h-1/3 w-full bg-blood" />
      </span>
      <span className="label-mono leading-tight">
        Scroll
        <span className="block text-blood transition-transform duration-500 ease-[var(--ease-ink)] group-hover:translate-x-1">
          neeche chalo ↓
        </span>
      </span>
    </a>
  );
}
