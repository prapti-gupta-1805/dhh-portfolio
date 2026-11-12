/**
 * Procedural tattoo serpent (dragon / snake), drawn in a single red ink.
 * The body is built from chunks drawn tail → head so nearer coils overlap.
 * Each chunk carries its body position `s` (0 = head, 1 = tail) so a renderer can split
 * the beast into "under" and "over" layers and weave it through typography.
 */
import {
  type Group,
  type Item,
  type Pt,
  P,
  add,
  catmull,
  circle,
  lerp,
  matrix,
  mul,
  noise1,
  norm,
  pack,
  perp,
  poly,
  pt,
  resample,
  rng,
  rot,
  smooth,
  smoothstep,
  sub,
  tongue,
} from './geometry';

export type SerpentSpec = {
  seed: number;
  spine: Pt[];
  width: number;
  kind: 'dragon' | 'snake';
  step?: number;
  /** which normal side is the back (fins). Flip to mirror the anatomy. */
  dorsal?: 1 | -1;
  /** body positions (0..1) where legs attach (dragon only) */
  legs?: number[];
};

export type Chunk = { s: number; items: Item[] };
export type SerpentArt = { chunks: Chunk[]; head: Group };

const CHUNK = 10;

export function serpent(spec: SerpentSpec): SerpentArt {
  const r = rng(spec.seed);
  const step = spec.step ?? 5;
  const W = spec.width;
  const D = spec.dorsal ?? 1;
  const dragon = spec.kind === 'dragon';

  const ps = resample(catmull(spec.spine, 28), step);
  const N = ps.length;
  const T = ps.map((_, i) => norm(sub(ps[Math.min(N - 1, i + 1)], ps[Math.max(0, i - 1)])));
  const Nn = T.map((t) => mul(perp(t), D));
  const S = ps.map((_, i) => i / (N - 1));
  const wobA = noise1(r, 3);
  const wobB = noise1(r, 3);

  const w = S.map((s) => {
    const neck = dragon ? 0.6 + 0.4 * smoothstep(0, 0.09, s) : 0.78 + 0.22 * smoothstep(0, 0.05, s);
    const swell = dragon ? 1 + 0.08 * Math.sin(s * Math.PI * 1.3) : 1;
    const taper = Math.pow(1 - s, dragon ? 0.78 : 0.9);
    return Math.max(1.4, W * neck * swell * taper);
  });

  const off = (i: number, o: number) => add(ps[i], mul(Nn[i], o));
  const back = ps.map((_, i) => off(i, w[i] * (1 + 0.045 * wobA(i * 0.06))));
  const belly = ps.map((_, i) => off(i, -w[i] * (1 + 0.045 * wobB(i * 0.06))));
  const thBack = (i: number) => 0.9 + 0.025 * w[i];
  const thBelly = (i: number) => 1.3 + 0.06 * w[i];
  const backOut = ps.map((_, i) => add(back[i], mul(Nn[i], thBack(i))));
  const bellyOut = ps.map((_, i) => add(belly[i], mul(Nn[i], -thBelly(i))));

  const BL = -0.3; // belly line offset (fraction of w)

  // ---------- feature placement (global walks, then bucketed per chunk) ----------
  type Feat = { i: number; items: Item[]; pre?: boolean };
  const feats: Feat[] = [];

  // scales: shingled arcs in rows, alternating half offsets
  const ROWS = dragon ? 4 : 3;
  for (let row = 0; row < ROWS; row++) {
    let acc = row % 2 ? 6 : 0;
    for (let i = 2; i < N - 2; i++) {
      acc += step;
      const band = ((0.95 - BL) * w[i]) / ROWS;
      const h = 0.56 * band;
      if (h < 1.2) continue;
      if (acc < Math.max(3, 1.5 * h)) continue;
      acc = 0;
      const o = BL * w[i] + (row + 0.5) * band;
      const c = off(i, o);
      const A = add(c, mul(Nn[i], h));
      const B = add(c, mul(Nn[i], -h));
      const Q = add(c, mul(T[i], 1.75 * h));
      const items: Item[] = [{ k: 'line', w: 0.9, d: `M${pt(A)}Q${pt(Q)} ${pt(B)}` }];
      if (row === ROWS - 1 || row === 0 || r() < 0.25) {
        const c2 = add(c, mul(T[i], 0.35 * h));
        const h2 = h * 0.5;
        items.push({
          k: 'line',
          w: 0.6,
          d: `M${pt(add(c2, mul(Nn[i], h2)))}Q${pt(add(c2, mul(T[i], 1.5 * h2)))} ${pt(add(c2, mul(Nn[i], -h2)))}`,
        });
      }
      feats.push({ i, items });
    }
  }

  // belly plates (double line) + dense belly-edge hatching + stipple
  {
    let acc = 0;
    for (let i = 1; i < N - 1; i++) {
      acc += step;
      const items: Item[] = [];
      // hatching on the belly edge: the "shadow" of the tattoo
      if (i % (dragon ? 1 : 2) === 0) {
        const len = 0.14 + 0.16 * r();
        items.push({ k: 'line', w: 0.55, d: `M${pt(off(i, -0.97 * w[i]))}L${pt(off(i, -(0.97 - len) * w[i]))}` });
      }
      // lighter hatching on the back edge
      if (i % 3 === 0) {
        items.push({ k: 'line', w: 0.45, d: `M${pt(off(i, 0.96 * w[i]))}L${pt(off(i, (0.86 - 0.06 * r()) * w[i]))}` });
      }
      // stipple dots near the belly line
      if (r() < 0.45 && w[i] > 6) {
        items.push({ k: 'ink', d: circle(off(i, (BL + 0.04 + r() * 0.2) * w[i]), 0.45 + r() * 0.35) });
      }
      if (acc >= Math.max(4, 0.42 * w[i])) {
        acc = 0;
        const a = off(i, BL * w[i]);
        const b = off(i, -0.96 * w[i]);
        const c = add(off(i, (BL - 0.36) * w[i]), mul(T[i], 0.28 * w[i]));
        items.push({ k: 'line', w: 1.05, d: `M${pt(a)}Q${pt(c)} ${pt(b)}` });
        if (dragon) {
          const sh = mul(T[i], Math.min(2.6, 0.06 * w[i]));
          items.push({ k: 'line', w: 0.5, d: `M${pt(add(a, sh))}Q${pt(add(c, sh))} ${pt(add(b, sh))}` });
        }
      }
      feats.push({ i, items });
    }
  }

  // dorsal flame fins (dragon)
  if (dragon) {
    let acc = 0;
    for (let i = 4; i < N - 8; i++) {
      acc += step;
      const spacing = 0.95 * w[i] + 5;
      if (acc < spacing) continue;
      acc = 0;
      const span = Math.max(2, Math.round((spacing * 1.05) / step));
      const j = Math.min(N - 1, i + span);
      const m = Math.round((i + j) / 2);
      const h = w[m] * (0.7 + 0.5 * r()) * (S[m] < 0.15 ? 1.25 : 1);
      const a = off(i, 0.8 * w[i]);
      const b = off(j, 0.8 * w[j]);
      const tip = add(off(m, w[m]), add(mul(Nn[m], h), mul(T[m], 0.95 * h)));
      const c1 = add(a, mul(Nn[i], h * 0.95));
      const c2 = add(lerp(b, tip, 0.45), mul(Nn[m], -0.12 * h));
      const baseMid = off(m, 0.95 * w[m]);
      feats.push({
        i,
        pre: true,
        items: [
          { k: 'ink', d: `M${pt(a)}Q${pt(c1)} ${pt(tip)}Q${pt(c2)} ${pt(b)}Z` },
          { k: 'cut', w: 0.8, d: `M${pt(baseMid)}Q${pt(add(lerp(baseMid, tip, 0.4), mul(Nn[m], 0.05 * h)))} ${pt(lerp(baseMid, tip, 0.7))}` },
        ],
      });
    }
  }

  // legs with talons (dragon)
  if (dragon && spec.legs) {
    for (const ls of spec.legs) {
      const i = Math.round(ls * (N - 1));
      const L = Math.max(w[i], 0.8 * W) * 1.15;
      const t = T[i];
      const n = Nn[i];
      const sh = off(i, -0.45 * L);
      const K = add(off(i, -1.75 * L), mul(t, 0.55 * L));
      const A = add(K, add(mul(n, -0.75 * L), mul(t, -0.75 * L)));
      const items: Item[] = [];
      // elbow tufts trailing toward the tail
      for (let q = 0; q < 3; q++) {
        const dir = norm(add(mul(t, 1), mul(n, -0.25 + q * 0.32)));
        const tip = add(K, mul(dir, L * (1.0 + 0.25 * q)));
        const pn = perp(dir);
        items.push({ k: 'ink', d: tongue(add(K, mul(pn, 0.18 * L)), add(K, mul(pn, -0.18 * L)), tip, q % 2 ? -0.25 : 0.25) });
      }
      items.push({ k: 'line', w: 0.62 * L, d: smooth([sh, K, A]) });
      items.push({ k: 'cut', w: 0.07 * L, d: smooth([add(sh, mul(t, -0.12 * L)), add(K, mul(t, -0.14 * L)), add(A, mul(t, 0.08 * L))]) });
      // talons
      const base = norm(add(mul(n, -1), mul(t, -0.7)));
      for (let q = 0; q < 4; q++) {
        const dir = rot(base, -0.8 + q * 0.5);
        const pn = perp(dir);
        const Lt = 0.55 * L * (q === 0 ? 0.75 : 1);
        const tip = add(A, add(mul(dir, Lt), mul(pn, Lt * 0.32)));
        const o1 = add(add(A, mul(dir, Lt * 0.6)), mul(pn, Lt * 0.42));
        const o2 = add(add(A, mul(dir, Lt * 0.45)), mul(pn, Lt * 0.1));
        const b1 = add(A, mul(pn, 0.1 * Lt));
        const b2 = add(A, mul(pn, -0.12 * Lt));
        items.push({ k: 'ink', d: `M${pt(b1)}Q${pt(o1)} ${pt(tip)}Q${pt(o2)} ${pt(b2)}Z` });
      }
      feats.push({ i, pre: true, items });
    }
  }

  // tail: fan of flame tongues
  {
    const i = N - 1;
    const te = T[i];
    const base = ps[N - 7] ?? ps[i];
    const items: Item[] = [];
    for (let q = 0; q < 6; q++) {
      const ang = (q - 2.5) * 0.36;
      const dir = rot(te, ang);
      const L = W * (1.5 + 0.7 * r()) * (1 - Math.abs(q - 2.5) * 0.13);
      const pn = perp(dir);
      const tip = add(add(ps[i], mul(dir, L)), mul(pn, L * 0.18 * (q < 3 ? -1 : 1)));
      const a = add(base, mul(pn, W * 0.1));
      const b = add(base, mul(pn, -W * 0.1));
      items.push({ k: 'ink', d: tongue(a, b, tip, q < 3 ? 0.22 : -0.22) });
      const m = lerp(base, tip, 0.15);
      items.push({ k: 'cut', w: 0.9, d: `M${pt(m)}Q${pt(add(lerp(m, tip, 0.5), mul(pn, L * 0.06)))} ${pt(lerp(m, tip, 0.75))}` });
    }
    feats.push({ i: N - 2, pre: true, items });
  }

  // ---------- assemble chunks (tail first so head-side coils draw on top) ----------
  const nChunks = Math.ceil((N - 1) / CHUNK);
  const pre: Item[][] = Array.from({ length: nChunks }, () => []);
  const post: Item[][] = Array.from({ length: nChunks }, () => []);
  for (const f of feats) {
    const c = Math.min(nChunks - 1, Math.floor(f.i / CHUNK));
    (f.pre ? pre : post)[c].push(...f.items);
  }

  const chunks: Chunk[] = [];
  for (let c = nChunks - 1; c >= 0; c--) {
    const i0 = c * CHUNK;
    const i1 = Math.min(N - 1, i0 + CHUNK + 1);
    const idx = Array.from({ length: i1 - i0 + 1 }, (_, k) => i0 + k);
    const rev = [...idx].reverse();
    // group same-style details so pack() can merge them into a handful of paths per chunk
    const byStyle = (xs: Item[]) => {
      const order = (it: Item) => (it.k === 'ink' ? 0 : it.k === 'cut' ? 2 : 1);
      return [...xs].sort((a, b) => order(a) - order(b) || (b.w ?? 0) - (a.w ?? 0));
    };
    const items: Item[] = [...byStyle(pre[c])];
    items.push({ k: 'paper', d: poly([...idx.map((i) => backOut[i]), ...rev.map((i) => bellyOut[i])]) });
    items.push(...byStyle(post[c]).sort((a, b) => (a.k === 'ink' ? 1 : 0) - (b.k === 'ink' ? 1 : 0)));
    items.push({ k: 'line', w: 1.1, d: smooth(idx.map((i) => off(i, BL * w[i]))) });
    items.push({ k: 'ink', d: poly([...idx.map((i) => back[i]), ...rev.map((i) => backOut[i])]) });
    items.push({ k: 'ink', d: poly([...idx.map((i) => belly[i]), ...rev.map((i) => bellyOut[i])]) });
    chunks.push({ s: S[i0], items: pack(items) });
  }

  // ---------- head ----------
  const f = mul(T[0], -1);
  const ny = mul(Nn[0], -1); // local +y → belly side
  const scale = dragon ? W * 1.55 : W * 1.3;
  const origin = add(ps[0], mul(T[0], 0.35 * W));
  const transform = matrix(f.x * scale, f.y * scale, ny.x * scale, ny.y * scale, origin.x, origin.y);
  const head: Group = { transform, items: pack(dragon ? dragonHead(r) : snakeHead()) };

  return { chunks, head };
}

/* ------------------------------------------------------------------------ */
/* Head drawings in local units: x forward, y toward belly, neck half-width ≈ 0.6 */

const Q = (x: number, y: number) => P(x, y);

function dragonHead(r: () => number): Item[] {
  const it: Item[] = [];
  const ink = (d: string) => it.push({ k: 'ink', d });
  const paper = (d: string) => it.push({ k: 'paper', d });
  const line = (d: string, w = 0.04) => it.push({ k: 'line', d, w });
  const cut = (d: string, w = 0.03) => it.push({ k: 'cut', d, w });

  // flame mane (behind skull)
  const mane: [number, number, number, number, number, number, number][] = [
    [0.9, -0.95, 1.5, -1.05, -0.9, -2.1, 0.25],
    [0.4, -0.75, 1.0, -0.95, -1.5, -1.5, 0.2],
    [0.05, -0.45, 0.5, -0.7, -1.9, -0.75, -0.15],
    [-0.1, 0.0, 0.3, -0.3, -1.7, 0.15, 0.18],
    [0.1, 0.45, 0.6, 0.6, -1.3, 1.25, -0.22],
    [1.5, 1.15, 2.2, 1.35, 0.7, 2.5, 0.25],
    [2.2, 1.35, 2.85, 1.45, 2.1, 2.85, -0.22],
    [0.9, 0.85, 1.6, 1.05, -0.2, 2.0, 0.2],
  ];
  for (const [ax, ay, bx, by, tx, ty, bend] of mane) {
    const a = Q(ax, ay);
    const b = Q(bx, by);
    const tip = Q(tx, ty);
    ink(tongue(a, b, tip, bend));
    const m = lerp(a, b, 0.5);
    cut(`M${pt(lerp(m, tip, 0.12))}Q${pt(add(lerp(m, tip, 0.45), mul(perp(norm(sub(tip, m))), bend * 0.4)))} ${pt(lerp(m, tip, 0.78))}`, 0.03);
  }

  // horns (two, far one first)
  const horn = (o: Pt, k: number) => {
    const p = (x: number, y: number) => `${pt(add(o, Q(x * k, y * k)))}`;
    ink(`M${p(0.0, 0.1)}C${p(-0.6, -0.5)} ${p(-1.4, -0.7)} ${p(-2.5, -1.55)}C${p(-1.6, -1.05)} ${p(-0.8, -0.65)} ${p(0.45, -0.12)}Z`);
    for (let q = 1; q < 7; q++) {
      const t = q / 7;
      const c = add(o, Q((-2.4 * t + 0.2) * k, (-1.4 * t * t - 0.05) * k));
      cut(`M${pt(add(c, Q(-0.06 * k, -0.12 * k)))}L${pt(add(c, Q(0.06 * k, 0.1 * k)))}`, 0.022);
    }
  };
  horn(Q(1.25, -1.0), 0.9);
  horn(Q(0.85, -0.85), 1.05);

  // skull + upper jaw
  const skull = 'M0 -0.62C0.5 -1 1.2 -1.15 1.7 -1C2 -1.28 2.35 -1.22 2.55 -0.95C2.95 -0.86 3.35 -0.86 3.65 -0.7C4 -0.6 4.12 -0.35 3.98 -0.12C3.9 0.04 3.72 0.1 3.5 0.06L1.35 0.16C1 0.3 0.6 0.5 0 0.62Z';
  paper(skull);
  // mouth interior
  ink('M1.3 0.12L3.52 0.04C3.42 0.52 3.22 0.9 3.02 1.16L1.3 0.32Z');
  // upper fangs
  for (let q = 0; q < 7; q++) {
    const x = 1.75 + q * 0.26;
    const L = q === 6 ? 0.36 : 0.13 + (q % 2) * 0.05;
    const y = 0.135 - (x - 1.35) * 0.042;
    paper(`M${x - 0.07} ${y}L${x + 0.07} ${y - 0.005}L${x + 0.01} ${y + L}Z`);
  }
  // lower jaw
  paper('M1.25 0.3L3.02 1.16C3.18 1.26 3.14 1.46 2.94 1.48C2.2 1.34 1.4 1.06 0.5 0.62Z');
  for (let q = 0; q < 5; q++) {
    const t = 0.25 + q * 0.16;
    const b = lerp(Q(1.3, 0.32), Q(3.0, 1.15), t);
    const L = q === 4 ? 0.3 : 0.12;
    paper(`M${pt(add(b, Q(-0.06, 0.03)))}L${pt(add(b, Q(0.07, 0.03)))}L${pt(add(b, Q(0.06, -L)))}Z`);
  }
  // tongue curling out
  cut('M1.5 0.3C2.2 0.42 2.7 0.5 3.1 0.6', 0.09);
  line('M3.08 0.58C3.45 0.65 3.7 0.55 3.9 0.75', 0.06);
  line('M3.9 0.75L4.15 0.62M3.9 0.75L4.1 0.95', 0.04);
  // outlines on top
  line(skull, 0.05);
  line('M1.25 0.3L3.02 1.16C3.18 1.26 3.14 1.46 2.94 1.48C2.2 1.34 1.4 1.06 0.5 0.62', 0.05);
  // jaw hatching
  for (let q = 0; q < 9; q++) {
    const t = 0.1 + q * 0.09;
    const a = lerp(Q(0.7, 0.68), Q(2.9, 1.42), t);
    line(`M${pt(a)}L${pt(add(a, Q(0.08, -0.18)))}`, 0.018);
  }
  // eye
  const eye = 'M2.02 -0.72Q2.36 -0.98 2.7 -0.72Q2.36 -0.53 2.02 -0.72Z';
  paper(eye);
  line(eye, 0.035);
  ink(circle(Q(2.4, -0.735), 0.085));
  cut(`M2.38 -0.78L2.41 -0.77`, 0.025);
  ink('M1.85 -0.9Q2.3 -1.32 3.05 -1.08Q2.45 -1.06 1.92 -0.8Z');
  // brow wrinkles + snout ridge
  line('M2.72 -0.86Q3.2 -0.8 3.62 -0.6', 0.025);
  line('M2.85 -0.72Q3.25 -0.64 3.55 -0.48', 0.02);
  line('M1.75 -0.6Q2.1 -0.45 2.6 -0.52', 0.02);
  // nostril curl
  line(smooth(Array.from({ length: 18 }, (_, i) => {
    const a = (i / 17) * Math.PI * 2.2 + 1;
    const rr = 0.13 * (1 - i / 22);
    return Q(3.72 + Math.cos(a) * rr, -0.38 + Math.sin(a) * rr);
  })), 0.03);
  // cheek scales + hatching
  for (let q = 0; q < 5; q++) {
    const c = Q(0.55 + q * 0.22, -0.25 + (q % 2) * 0.22);
    line(`M${pt(add(c, Q(0, -0.13)))}Q${pt(add(c, Q(-0.2, 0)))} ${pt(add(c, Q(0, 0.13)))}`, 0.022);
  }
  for (let q = 0; q < 7; q++) {
    const x = 1.05 + q * 0.12 + r() * 0.03;
    line(`M${x} -0.25L${x - 0.1} 0.05`, 0.016);
  }
  // whiskers
  line('M3.75 -0.05C4.7 0.25 4.75 1.45 3.75 1.95C2.9 2.35 2.7 3.0 3.35 3.45C3.7 3.7 3.6 4.05 3.3 4.1', 0.06);
  line('M3.3 -0.72C3.95 -1.6 3.1 -2.45 2.25 -2.35C1.5 -2.25 1.25 -2.85 1.7 -3.25', 0.05);
  return it;
}

function snakeHead(): Item[] {
  const it: Item[] = [];
  const skull = 'M0 -0.62C0.6 -0.95 1.55 -0.92 2.1 -0.55C2.5 -0.28 2.5 0.22 2.12 0.45C1.6 0.75 0.6 0.82 0 0.62Z';
  it.push({ k: 'line', w: 0.05, d: 'M2.42 0.08L3.05 0.12L3.3 -0.08M3.05 0.12L3.3 0.32' });
  it.push({ k: 'paper', d: skull });
  // head plates
  it.push({ k: 'line', w: 0.025, d: 'M0.7 -0.78Q0.9 -0.3 0.7 0.1M1.25 -0.82Q1.35 -0.45 1.15 -0.15M1.75 -0.68Q1.75 -0.4 1.6 -0.25M0.25 -0.6Q0.4 -0.2 0.25 0.3' });
  it.push({ k: 'line', w: 0.035, d: 'M2.3 0.12Q1.6 0.3 0.95 0.18' });
  for (let q = 0; q < 6; q++) {
    const x = 0.35 + q * 0.28;
    it.push({ k: 'line', w: 0.018, d: `M${x} 0.36L${x - 0.06} 0.62` });
  }
  const eye = 'M1.32 -0.38Q1.55 -0.56 1.8 -0.38Q1.55 -0.24 1.32 -0.38Z';
  it.push({ k: 'paper', d: eye });
  it.push({ k: 'line', w: 0.03, d: eye });
  it.push({ k: 'ink', d: 'M1.52 -0.48L1.58 -0.48L1.58 -0.28L1.52 -0.28Z' });
  it.push({ k: 'ink', d: 'M1.2 -0.5Q1.6 -0.75 2.05 -0.52Q1.6 -0.6 1.25 -0.42Z' });
  it.push({ k: 'ink', d: circle(Q(2.22, -0.18), 0.04) });
  it.push({ k: 'line', w: 0.05, d: skull });
  return it;
}
