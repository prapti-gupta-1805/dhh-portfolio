/**
 * Geometry toolkit for the hand-coded red-ink illustrations.
 * Everything is deterministic (seeded) so the art is identical on every load
 * and can be rendered both in the browser and from Node for QA.
 */

export type Pt = { x: number; y: number };

/**
 * Drawing primitives, kept to a single ink colour on purpose:
 * - ink   → solid red fill
 * - paper → fill with the surface colour (used to occlude what's behind)
 * - line  → red stroke of width `w`
 * - cut   → surface-coloured stroke (negative "skin" lines through solid ink)
 */
export type Kind = 'ink' | 'paper' | 'line' | 'cut';
export type Item = { k: Kind; d: string; w?: number };
export type Group = { items: Item[]; transform?: string };

export const P = (x: number, y: number): Pt => ({ x, y });
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Pt, s: number): Pt => ({ x: a.x * s, y: a.y * s });
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const len = (a: Pt) => Math.hypot(a.x, a.y);
export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a: Pt): Pt => {
  const l = len(a) || 1;
  return { x: a.x / l, y: a.y / l };
};
export const perp = (a: Pt): Pt => ({ x: -a.y, y: a.x });
export const rot = (a: Pt, ang: number): Pt => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};

/** Number → compact string with one decimal (keeps path data small). */
export const fx = (n: number) => String(Math.round(n * 10) / 10);
export const pt = (p: Pt) => `${fx(p.x)} ${fx(p.y)}`;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** mulberry32 — tiny seeded PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth 1D noise in roughly [-1, 1] built from detuned sines — gives a "hand" wobble. */
export function noise1(r: () => number, octaves = 3) {
  const ps = Array.from({ length: octaves }, (_, i) => ({
    f: (i + 1) * (0.9 + r() * 1.3),
    p: r() * Math.PI * 2,
    a: 1 / (i + 1),
  }));
  const norm = ps.reduce((s, o) => s + o.a, 0);
  return (x: number) => ps.reduce((s, o) => s + Math.sin(x * o.f + o.p) * o.a, 0) / norm;
}

/** Centripetal-ish Catmull-Rom through points. */
export function catmull(points: Pt[], seg = 24): Pt[] {
  const out: Pt[] = [];
  const pts = [points[0], ...points, points[points.length - 1]];
  for (let i = 0; i < pts.length - 3; i++) {
    const [p0, p1, p2, p3] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
    for (let j = 0; j < seg; j++) {
      const t = j / seg;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, c2: number, d: number) =>
        0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
      out.push({ x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Resample a polyline to equal arc-length spacing. */
export function resample(poly: Pt[], step: number): Pt[] {
  const out: Pt[] = [poly[0]];
  let acc = 0;
  for (let i = 1; i < poly.length; i++) {
    let a = poly[i - 1];
    const b = poly[i];
    let seg = dist(a, b);
    while (acc + seg >= step) {
      const t = (step - acc) / seg;
      const p = lerp(a, b, t);
      out.push(p);
      a = p;
      seg = dist(a, b);
      acc = 0;
    }
    acc += seg;
  }
  return out;
}

export const poly = (ps: Pt[], close = true) => 'M' + ps.map(pt).join('L') + (close ? 'Z' : '');

/** Smooth open/closed path through points using midpoint quadratics. */
export function smooth(ps: Pt[], close = false): string {
  if (ps.length < 3) return poly(ps, close);
  let d = `M${pt(close ? lerp(ps[0], ps[1], 0.5) : ps[0])}`;
  const n = ps.length;
  const last = close ? n : n - 1;
  for (let i = 1; i < last; i++) {
    const m = lerp(ps[i], ps[(i + 1) % n], 0.5);
    d += `Q${pt(ps[i])} ${pt(m)}`;
  }
  if (close) d += `Q${pt(ps[0])} ${pt(lerp(ps[0], ps[1], 0.5))}Z`;
  else d += `L${pt(ps[n - 1])}`;
  return d;
}

export const circle = (c: Pt, r: number) =>
  `M${fx(c.x - r)} ${fx(c.y)}a${fx(r)} ${fx(r)} 0 1 0 ${fx(2 * r)} 0a${fx(r)} ${fx(r)} 0 1 0 ${fx(-2 * r)} 0Z`;

/** Flame / hair tongue: two base points sweeping to a curled tip. */
export function tongue(a: Pt, b: Pt, tip: Pt, bend = 0.3): string {
  const mid = lerp(a, b, 0.5);
  const L = dist(mid, tip);
  const pn = perp(norm(sub(tip, mid)));
  const c1 = add(lerp(a, tip, 0.55), mul(pn, bend * L));
  const c2 = add(lerp(b, tip, 0.6), mul(pn, bend * L * 0.45));
  return `M${pt(a)}Q${pt(c1)} ${pt(tip)}Q${pt(c2)} ${pt(b)}Z`;
}

/** Archimedean spiral from outer radius inward. */
export function spiral(c: Pt, r0: number, turns: number, start = 0, dir = 1, steps = 60): Pt[] {
  const out: Pt[] = [];
  const total = turns * Math.PI * 2;
  for (let i = 0; i <= steps * turns; i++) {
    const t = i / (steps * turns);
    const a = start + dir * t * total;
    const r = r0 * (1 - t * 0.92);
    out.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
  }
  return out;
}

/** Merge consecutive items of identical style into one path (fewer DOM nodes). */
export function pack(items: Item[]): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    const prev = out[out.length - 1];
    if (prev && prev.k === it.k && prev.w === it.w) prev.d += it.d;
    else out.push({ ...it });
  }
  return out;
}

/** Map local head-space points: apply a 2D affine (a b c d e f) like SVG matrix(). */
export const matrix = (a: number, b: number, c: number, d: number, e: number, f: number) =>
  `matrix(${[a, b, c, d, e, f].map((n) => Math.round(n * 1000) / 1000).join(' ')})`;
