/** The hero dragon: spine authored in a 1600×1000 frame, head upper-right roaring at the name. */
import { P, type Item } from './geometry';
import { serpent } from './serpent';
import { cloud, spark, star } from './ornaments';

export const HERO_VIEWBOX = { w: 1600, h: 1000 };

export const heroDragon = serpent({
  seed: 7,
  kind: 'dragon',
  width: 46,
  dorsal: -1,
  step: 5,
  legs: [0.1, 0.62],
  spine: [
    P(1130, 300), P(1265, 250), P(1385, 168), P(1505, 150), P(1575, 262),
    P(1510, 405), P(1330, 462), P(1050, 480), P(760, 505), P(480, 530),
    P(250, 625), P(168, 765), P(330, 868), P(650, 845), P(955, 800),
    P(1205, 850), P(1420, 960), P(1660, 1060),
  ],
});

/** Background flash: clouds and stars that sit behind the beast. */
export const heroFlash: Item[] = [
  ...cloud(P(1420, 650), 46, 3),
  ...cloud(P(560, 220), 34, 5, true),
  ...cloud(P(1000, 960), 40, 9),
  ...star(P(1530, 560), 22),
  ...spark(P(905, 330), 16),
  ...spark(P(1585, 470), 10),
  ...spark(P(270, 470), 12),
];
