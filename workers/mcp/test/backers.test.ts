import { describe, expect, it } from 'vitest';
import { backedBy, backerWords } from '../src/backers';

const yc = { name: 'Y Combinator', label: 'YC W22' };
const accel = { name: 'Accel', label: 'Accel' };

describe('backedBy', () => {
  it('writes the name, and the usual label when it adds something', () => {
    expect(backedBy([yc])).toBe('Backed by Y Combinator (YC W22).');
    expect(backedBy([accel])).toBe('Backed by Accel.');
  });
  it('lists several backers', () => {
    expect(backedBy([accel, yc])).toBe('Backed by Accel, Y Combinator (YC W22).');
  });
  it('is empty when nobody is known', () => {
    expect(backedBy([])).toBe('');
  });
});

describe('backerWords', () => {
  it('gives both the full name and the short label as search words', () => {
    expect(backerWords([yc])).toBe('Y Combinator YC W22');
    expect(backerWords([])).toBe('');
  });
});
