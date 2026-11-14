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

/** Fine-precision formatting for head-local units (the head is scaled ~70×, so 0.1 rounding = 7px jaggies). */
const f3 = (n: number) => String(Math.round(n * 1000) / 1000);
const hp = (p: Pt) => `${f3(p.x)} ${f3(p.y)}`;
const hsmooth = (ps: Pt[]) => {
  let d = `M${hp(ps[0])}`;
  for (let i = 1; i < ps.length - 1; i++) d += `Q${hp(ps[i])} ${hp(lerp(ps[i], ps[i + 1], 0.5))}`;
  return d + `L${hp(ps[ps.length - 1])}`;
};

/** A tapered, S-bent flame lock from a base centre to a tip. */
function flame(base: Pt, tip: Pt, wid: number, bend: number): string {
  const d = sub(tip, base);
  const L = Math.hypot(d.x, d.y);
  const pn = perp(norm(d));
  const b1 = add(base, mul(pn, wid));
  const b2 = add(base, mul(pn, -wid));
  const k1 = add(lerp(base, tip, 0.35), mul(pn, bend * L + wid * 0.6));
  const k2 = add(lerp(base, tip, 0.7), mul(pn, -bend * L * 0.55));
  const k3 = add(lerp(base, tip, 0.72), mul(pn, -bend * L * 0.55 - wid * 0.35));
  const k4 = add(lerp(base, tip, 0.38), mul(pn, bend * L - wid * 0.6));
  return `M${hp(b1)}C${hp(k1)} ${hp(k2)} ${hp(tip)}C${hp(k3)} ${hp(k4)} ${hp(b2)}Z`;
}
/** The centre vein of a flame lock (a paper "cut" that gives the tattoo its carved look). */
function vein(base: Pt, tip: Pt, bend: number): string {
  const d = sub(tip, base);
  const L = Math.hypot(d.x, d.y);
  const pn = perp(norm(d));
  const a = lerp(base, tip, 0.12);
  const b = lerp(base, tip, 0.72);
  return `M${hp(a)}C${hp(add(lerp(base, tip, 0.35), mul(pn, bend * L * 0.9)))} ${hp(add(lerp(base, tip, 0.6), mul(pn, -bend * L * 0.3)))} ${hp(b)}`;
}

function dragonHead(r: () => number): Item[] {
  const it: Item[] = [];
  const ink = (d: string) => it.push({ k: 'ink', d });
  const paper = (d: string) => it.push({ k: 'paper', d });
  const line = (d: string, w = 0.04) => it.push({ k: 'line', d, w });
  const cut = (d: string, w = 0.03) => it.push({ k: 'cut', d, w });
  const lock = (base: Pt, tip: Pt, wid: number, bend: number) => {
    ink(flame(base, tip, wid, bend));
    cut(vein(base, tip, bend), 0.028);
  };

  // ── mane: flowing locks swept back off the skull (drawn first, sits behind) ──
  const mane: [number, number, number, number, number, number][] = [
    // baseX, baseY, tipX, tipY, width, bend
    [0.7, -0.75, -1.9, -2.05, 0.22, 0.22],
    [0.45, -0.55, -2.45, -1.25, 0.24, -0.18],
    [0.25, -0.25, -2.6, -0.35, 0.24, 0.2],
    [0.2, 0.1, -2.4, 0.6, 0.22, -0.2],
    [0.3, 0.4, -1.95, 1.35, 0.2, 0.2],
    [0.6, 0.6, -1.1, 1.95, 0.18, -0.2],
    [0.95, -0.9, -1.0, -2.5, 0.16, -0.2],
  ];
  for (const [bx, by, tx, ty, wd, bd] of mane) lock(Q(bx, by), Q(tx, ty), wd, bd);

  // cheek frills (behind the skull so their bases tuck under the jowl)
  lock(Q(1.0, 0.5), Q(-0.9, 1.45), 0.18, 0.18);
  lock(Q(0.9, 0.15), Q(-1.25, 0.66), 0.19, -0.18);
  lock(Q(0.9, -0.25), Q(-1.2, -0.1), 0.18, 0.18);

  // ── horns: two antlers sweeping back, far one first ──
  const horn = (o: Pt, k: number) => {
    const p = (x: number, y: number) => hp(add(o, Q(x * k, y * k)));
    const beam = `M${p(0.12, 0.05)}C${p(-0.5, -0.35)} ${p(-1.3, -0.55)} ${p(-1.95, -1.15)}C${p(-2.2, -1.38)} ${p(-2.3, -1.65)} ${p(-2.2, -1.9)}C${p(-2.05, -1.55)} ${p(-1.82, -1.32)} ${p(-1.5, -1.0)}C${p(-0.95, -0.5)} ${p(-0.3, -0.2)} ${p(0.38, -0.08)}Z`;
    const prong = `M${p(-0.95, -0.55)}C${p(-1.05, -0.85)} ${p(-1.0, -1.15)} ${p(-0.78, -1.4)}C${p(-0.82, -1.1)} ${p(-0.72, -0.85)} ${p(-0.62, -0.62)}Z`;
    paper(prong);
    line(prong, 0.035);
    paper(beam);
    line(beam, 0.04);
    for (let q = 1; q < 7; q++) {
      const t = q / 7;
      const c = add(o, Q((-1.95 * t + 0.1) * k, (-1.1 * t * t - 0.05 * t) * k));
      line(`M${hp(add(c, Q(-0.05 * k, -0.1 * k)))}L${hp(add(c, Q(0.05 * k, 0.06 * k)))}`, 0.02);
    }
  };
  horn(Q(1.6, -1.0), 1.1);
  horn(Q(1.2, -0.92), 1.28);

  // ── mouth interior, tongue, lower jaw ──
  ink('M1.2 0.06C2.3 -0.04 3.2 -0.15 3.86 -0.24C3.8 0.25 3.6 0.65 3.35 0.98C2.7 0.76 1.9 0.52 1.22 0.36Z');
  const tongueD = 'M1.6 0.22C2.6 0.2 3.5 0.25 4.0 0.4C4.3 0.5 4.42 0.75 4.34 0.98L4.24 0.82L4.1 0.99C4.18 0.76 4.1 0.6 3.9 0.52C3.4 0.37 2.5 0.34 1.6 0.33Z';
  paper(tongueD);
  line(tongueD, 0.03);
  const jaw = 'M1.22 0.32C1.9 0.48 2.6 0.72 3.32 0.96C3.5 1.02 3.6 1.14 3.52 1.26C3.38 1.4 3.06 1.38 2.78 1.3C2.2 1.2 1.5 1.12 0.95 0.95C0.6 0.84 0.3 0.72 0.1 0.66Z';
  paper(jaw);
  for (let q = 0; q < 7; q++) {
    const x = 1.7 + q * 0.25;
    const y = 0.33 + (x - 1.25) * 0.304;
    const L = q === 6 ? 0.34 : 0.1 + (q % 2) * 0.04;
    paper(`M${f3(x - 0.06)} ${f3(y + 0.02)}L${f3(x + 0.06)} ${f3(y + 0.035)}L${f3(x + 0.02)} ${f3(y - L)}Z`);
  }
  // chin beard
  lock(Q(3.15, 1.3), Q(2.6, 2.2), 0.13, 0.16);
  lock(Q(2.55, 1.18), Q(1.75, 1.95), 0.13, -0.16);
  lock(Q(1.95, 1.0), Q(1.0, 1.6), 0.12, 0.16);
  line(jaw, 0.045);
  for (let q = 0; q < 7; q++) {
    const t = 0.1 + q * 0.13;
    const a = lerp(Q(1.2, 1.02), Q(2.9, 1.3), t);
    line(`M${hp(a)}L${hp(add(a, Q(0.06, -0.13)))}`, 0.016);
  }

  // ── skull + upper jaw ──
  const skull =
    'M0.1 -0.68C0.6 -0.95 1.2 -1.12 1.75 -1.12C2.05 -1.12 2.3 -1.02 2.55 -0.92' +
    'C2.9 -0.8 3.25 -0.84 3.55 -0.95C3.85 -1.05 4.15 -0.9 4.12 -0.62C4.1 -0.4 3.98 -0.3 3.85 -0.26' +
    'C3.4 -0.18 2.6 -0.08 1.7 0.02C1.45 0.05 1.3 0.18 1.25 0.32C1.0 0.5 0.5 0.6 0.1 0.66';
  paper(skull + 'C-0.3 0.4 -0.3 -0.4 0.1 -0.68Z');
  for (let q = 0; q < 8; q++) {
    const x = 1.85 + q * 0.24;
    const y = -0.26 + (3.85 - x) * 0.13 - 0.01;
    const big = q === 7;
    const L = big ? 0.4 : 0.11 + (q % 2) * 0.05;
    if (big) paper(`M${f3(x - 0.08)} ${f3(y)}L${f3(x + 0.08)} ${f3(y - 0.01)}Q${f3(x + 0.06)} ${f3(y + L * 0.6)} ${f3(x - 0.03)} ${f3(y + L)}Z`);
    else paper(`M${f3(x - 0.06)} ${f3(y)}L${f3(x + 0.06)} ${f3(y - 0.005)}L${f3(x + 0.005)} ${f3(y + L)}Z`);
  }
  line(skull, 0.05);


  // cheek scales
  for (let q = 0; q < 6; q++) {
    const c = Q(1.5 + (q % 3) * 0.26 + (q > 2 ? 0.13 : 0), -0.42 + (q > 2 ? 0.2 : 0));
    line(`M${hp(add(c, Q(0, -0.1)))}Q${hp(add(c, Q(-0.16, 0)))} ${hp(add(c, Q(0, 0.1)))}`, 0.02);
  }

  // ── eye with a heavy flame brow ──
  const eye = 'M2.05 -0.72Q2.4 -0.95 2.8 -0.78Q2.45 -0.6 2.05 -0.72Z';
  paper(eye);
  line(eye, 0.035);
  ink(circle(Q(2.47, -0.77), 0.085));
  cut('M2.43 -0.81L2.45 -0.8', 0.03);
  ink('M1.8 -0.82C2.15 -1.07 2.7 -1.08 3.02 -0.93C2.62 -0.97 2.22 -0.9 1.95 -0.72Z');
  lock(Q(2.0, -0.95), Q(0.95, -1.5), 0.08, 0.12);
  // under-eye + snout ridges
  line('M2.1 -0.6Q2.45 -0.5 2.85 -0.62', 0.02);
  line('M2.85 -0.82C3.1 -0.76 3.3 -0.78 3.5 -0.86', 0.022);
  line('M2.95 -0.68C3.2 -0.62 3.42 -0.66 3.62 -0.74', 0.02);
  // nostril
  line('M3.98 -0.58C3.99 -0.72 3.82 -0.76 3.76 -0.65C3.72 -0.56 3.82 -0.5 3.89 -0.57', 0.035);
  // lip line + hatching
  line('M3.75 -0.32C3.2 -0.25 2.5 -0.15 1.85 -0.08', 0.02);
  for (let q = 0; q < 6; q++) {
    const x = 0.55 + q * 0.13 + r() * 0.03;
    line(`M${f3(x)} -0.22L${f3(x - 0.08)} 0.08`, 0.016);
  }

  // ── whiskers ──
  line(hsmooth([Q(4.0, -0.42), Q(4.75, -0.2), Q(4.8, 0.6), Q(4.1, 1.2), Q(3.6, 1.9), Q(4.0, 2.6), Q(4.5, 2.7)]), 0.05);
  line(hsmooth([Q(3.6, -0.92), Q(3.95, -1.6), Q(3.4, -2.2), Q(2.6, -2.25), Q(2.3, -2.7), Q(2.6, -3.1)]), 0.045);
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
