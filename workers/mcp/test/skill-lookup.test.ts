import { describe, expect, it } from 'vitest';
import { lookupSkill, normalize } from '../src/skill-lookup';
import { skillsEn } from './fixtures';
import type { SkillSummary } from '../src/types';

const skills = skillsEn as unknown as SkillSummary[];
const id = (q: string) => {
  const r = lookupSkill(skills, q);
  return r.kind === 'found' ? r.skill.id : r.kind;
};

describe('normalize', () => {
  it('lowercases and strips accents and punctuation', () => {
    expect(normalize('  Programação / CI-CD ')).toBe('programacao ci cd');
  });
  it('keeps tech punctuation', () => {
    expect(normalize('Node.js C#')).toBe('node.js c#');
  });
});

describe('lookupSkill', () => {
  it('matches id, name and alias', () => {
    expect(id('sql')).toBe('sql');
    expect(id('PostgreSQL')).toBe('postgresql');
    expect(id('postgres')).toBe('postgresql');
    expect(id('K8S')).toBe('kubernetes');
  });
  it('prefers a name over a shared alias', () => {
    expect(id('docker')).toBe('docker');
  });
  it('reports an alias shared by several skills as ambiguous', () => {
    expect(id('containers')).toBe('ambiguous');
  });
  it('accepts a single partial match', () => {
    expect(id('architect')).toBe('architecture');
  });
  it('finds a skill named inside a longer question', () => {
    expect(id('experience with kubernetes')).toBe('kubernetes');
  });
  it('reports unknown and empty input as missing', () => {
    expect(id('cobol')).toBe('missing');
    expect(id('  ')).toBe('missing');
  });
});
