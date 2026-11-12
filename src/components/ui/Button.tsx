import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { isPlaceholder } from '../../content/site';

type Variant = 'primary' | 'outline' | 'link';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  /** external links get a diagonal arrow and open in a new tab */
  external?: boolean;
  arrow?: boolean;
  children: ReactNode;
};

export function ArrowSwap({ diag = false }: { diag?: boolean }) {
  const Icon = diag ? ArrowUpRight : ArrowRight;
  return (
    <span className={`arrow-swap${diag ? ' diag' : ''}`} aria-hidden="true">
      <Icon strokeWidth={2.25} />
      <Icon strokeWidth={2.25} />
    </span>
  );
}

/** Hand-drawn underline used by the link variant. */
export function Scrawl() {
  return (
    <svg className="scrawl" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M1 5.2C14 3.4 27 6.6 41 4.6S70 2.6 82 4.9 95 4.2 99 3.1"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Button({ href, variant = 'primary', external = false, arrow = true, children, className = '', ...rest }: Props) {
  const ext = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  const todo = import.meta.env.DEV && isPlaceholder(href);
  if (variant === 'link') {
    return (
      <a href={href} className={`group link-ink ${className}`} {...ext} {...rest}>
        <span>{children}</span>
        {arrow && <ArrowSwap diag={external} />}
        <Scrawl />
        {external && <span className="sr-only"> (opens in a new tab)</span>}
        {todo && <span className="todo-badge">TODO</span>}
      </a>
    );
  }
  return (
    <a href={href} className={`group btn btn-${variant} ${className}`} {...ext} {...rest}>
      <span>{children}</span>
      {arrow && <ArrowSwap diag={external} />}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
      {todo && <span className="todo-badge">TODO</span>}
    </a>
  );
}
