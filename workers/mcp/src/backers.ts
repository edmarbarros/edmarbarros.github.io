import type { Cv } from './types';

type Backers = Cv['experience'][number]['backers'];

/** 'Y Combinator (YC W22)' or 'Accel': the name, plus the usual label when it adds something. */
function describe(backer: Backers[number]): string {
  return backer.label === backer.name ? backer.name : `${backer.name} (${backer.label})`;
}

/** 'Backed by Y Combinator (YC W22).' Empty when the company has no known backer. */
export function backedBy(backers: Backers): string {
  return backers.length > 0 ? `Backed by ${backers.map(describe).join(', ')}.` : '';
}

/** Names and labels as search words, so 'yc', 'y combinator' and 'accel' all find the company. */
export function backerWords(backers: Backers): string {
  return backers.flatMap((b) => [b.name, b.label]).join(' ');
}
