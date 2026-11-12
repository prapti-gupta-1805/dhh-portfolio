/** Dev-only QA: writes the hero dragon to an SVG file for inspection. Usage: tsx scripts/render-art.ts <outDir> */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { heroDragon, heroFlash, HERO_VIEWBOX } from '../src/art/heroDragon';
import { itemsToSvg } from '../src/art/toSvg';

const out = process.argv[2] ?? 'art-out';
mkdirSync(out, { recursive: true });
const body =
  itemsToSvg(heroFlash) +
  heroDragon.chunks.map((c) => itemsToSvg(c.items)).join('') +
  `<g transform="${heroDragon.head.transform}">${itemsToSvg(heroDragon.head.items)}</g>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HERO_VIEWBOX.w} ${HERO_VIEWBOX.h}" width="${HERO_VIEWBOX.w}" height="${HERO_VIEWBOX.h}"><rect width="100%" height="100%" fill="#F1E9DC"/>${body}</svg>`;
writeFileSync(join(out, 'dragon.svg'), svg);
const paths = (svg.match(/<path/g) ?? []).length;
console.log(`dragon.svg written: ${(svg.length / 1024).toFixed(0)} KB, ${paths} paths`);
