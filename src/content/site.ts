/**
 * Single source of truth for copy and links.
 * Anything containing "TODO" is a placeholder: in dev it renders with a dashed TODO badge.
 * Do not invent facts here — only supplied information.
 */

export const site = {
  name: { first: 'PRAPTI', last: 'GUPTA', full: 'Prapti Gupta', devanagari: 'प्राप्ति गुप्ता' },
  /** hero headline — swap freely, each entry is one line */
  headline: ['BUILT', 'DIFFERENT.'],
  headlineNote: '(and tested.)',
  disciplines: ['Software Engineering', 'AI', 'ML'],
  intro:
    'Third-year B.Tech Computer Science student specialising in AI, building software products and experimenting with intelligent systems.',
  location: { label: 'Delhi, India', short: 'DEL', coords: '28.61°N 77.21°E', tz: 'Asia/Kolkata' },
  education: { school: 'USICT, GGSIPU', degree: 'B.Tech CSE (AI)', year: '3rd year' },
  links: {
    github: 'https://github.com/TODO',
    linkedin: 'https://www.linkedin.com/in/TODO',
    email: 'TODO@example.com',
    resume: '/resume.pdf', // TODO: drop the PDF into /public
  },
  volume: 'VOL. 01 — PORTFOLIO — 2026',
} as const;

export const sections = [
  { id: 'about', label: 'About', hi: 'परिचय' },
  { id: 'work', label: 'Work', hi: 'काम' },
  { id: 'experience', label: 'Experience', hi: 'अनुभव' },
  { id: 'stack', label: 'Stack', hi: 'औज़ार' },
  { id: 'contact', label: 'Contact', hi: 'संपर्क' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const isPlaceholder = (v: string) => v.includes('TODO');
