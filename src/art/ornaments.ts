/** Small tattoo-flash motifs: spiral clouds, sparks, eight-point stars. */
import { type Item, type Pt, P, add, circle, mul, pack, pt, rng, smooth, spiral } from './geometry';

/** Japanese-style cloud: spiral curls on a baseline with trailing wisps. */
export function cloud(c: Pt, size: number, seed = 1, flip = false): Item[] {
  const r = rng(seed);
  const s = flip ? -1 : 1;
  const it: Item[] = [];
  const curls = [
    { x: -1.15, y: 0.15, r: 0.55 },
    { x: 0, y: -0.1, r: 0.85 },
    { x: 1.05, y: 0.12, r: 0.6 },
  ];
  // paper backing so clouds can sit on top of hatching
  const back: Pt[] = [];
  for (let a = Math.PI; a <= Math.PI * 2.001; a += Math.PI / 10) {
    for (const k of curls) back.push(P(c.x + (k.x + Math.cos(a) * k.r) * size * s, c.y + (k.y + Math.sin(a) * k.r) * size));
  }
  back.sort((a, b) => (a.x - b.x) * s);
  for (const k of curls) {
    const kc = P(c.x + k.x * size * s, c.y + k.y * size);
    const rad = k.r * size;
    // outer bump
    const bump: Pt[] = [];
    for (let a = 0; a <= 1.001; a += 0.05) {
      const ang = Math.PI * (0.95 + a * 1.1);
      bump.push(P(kc.x + Math.cos(ang) * rad * s, kc.y + Math.sin(ang) * rad));
    }
    it.push({ k: 'paper', d: circle(kc, rad * 0.98) });
    it.push({ k: 'line', w: 1.6, d: smooth(bump) });
    it.push({ k: 'line', w: 1.1, d: smooth(spiral(kc, rad * 0.72, 1.6 + r() * 0.3, Math.PI * (s > 0 ? 1 : 0), s)) });
    // shading arc
    const sh: Pt[] = [];
    for (let a = 0; a <= 1.001; a += 0.1) {
      const ang = Math.PI * (1.15 + a * 0.6);
      sh.push(P(kc.x + Math.cos(ang) * rad * 0.86 * s, kc.y + Math.sin(ang) * rad * 0.86));
    }
    it.push({ k: 'line', w: 0.6, d: smooth(sh) });
  }
  // baseline + wisps
  const y0 = c.y + 0.55 * size;
  it.push({ k: 'line', w: 1.4, d: `M${pt(P(c.x - 1.9 * size * s, y0))}L${pt(P(c.x + 1.7 * size * s, y0))}` });
  for (let q = 0; q < 3; q++) {
    const y = y0 + (q + 1) * 0.16 * size;
    const x0 = c.x + (-2.6 + q * 0.5 + r() * 0.3) * size * s;
    const x1 = c.x + (0.6 + r() * 1.1) * size * s;
    it.push({ k: 'line', w: 1.0 - q * 0.2, d: `M${pt(P(x0, y))}L${pt(P(x1, y))}` });
  }
  return pack(it);
}

/** Eight-point tattoo star with half-shaded rays. */
export function star(c: Pt, R: number): Item[] {
  const it: Item[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const L = i % 2 ? R * 0.55 : R;
    const tip = add(c, P(Math.cos(a) * L, Math.sin(a) * L));
    const l = add(c, P(Math.cos(a - 0.3) * L * 0.22, Math.sin(a - 0.3) * L * 0.22));
    const rr = add(c, P(Math.cos(a + 0.3) * L * 0.22, Math.sin(a + 0.3) * L * 0.22));
    it.push({ k: 'ink', d: `M${pt(c)}L${pt(l)}L${pt(tip)}Z` });
    it.push({ k: 'line', w: 1, d: `M${pt(c)}L${pt(rr)}L${pt(tip)}Z` });
  }
  return pack(it);
}

/** Sparkle: four thin rays. */
export function spark(c: Pt, R: number): Item[] {
  const d = [0, 1, 2, 3]
    .map((i) => {
      const a = (i * Math.PI) / 2;
      const tip = add(c, mul(P(Math.cos(a), Math.sin(a)), R));
      const s1 = add(c, mul(P(Math.cos(a + 0.6), Math.sin(a + 0.6)), R * 0.14));
      const s2 = add(c, mul(P(Math.cos(a - 0.6), Math.sin(a - 0.6)), R * 0.14));
      return `M${pt(s1)}L${pt(tip)}L${pt(s2)}Z`;
    })
    .join('');
  return [{ k: 'ink', d }];
}
