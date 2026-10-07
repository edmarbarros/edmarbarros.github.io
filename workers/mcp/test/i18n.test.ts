import { describe, expect, it } from 'vitest';
import {
  SKILL_LABELS,
  formatCount,
  formatList,
  formatMonth,
  formatMonthRange,
  formatNumber,
  plural,
} from '../src/i18n';
import { DEFAULT_LANG, LANGUAGES, LANG_VALUES } from '../src/languages';

describe('languages', () => {
  it('lists exactly the supported codes, English first', () => {
    expect(LANG_VALUES).toEqual(['en', 'pt']);
    expect(DEFAULT_LANG).toBe(LANGUAGES.EN);
  });
  it('has a label table for every language', () => {
    for (const lang of LANG_VALUES)
      expect(Object.keys(SKILL_LABELS[lang]).sort()).toEqual(Object.keys(SKILL_LABELS.en).sort());
  });
});

describe('formatMonth', () => {
  it('uses the runtime month names for each language', () => {
    expect(formatMonth('2019-01', 'en')).toBe('January 2019');
    expect(formatMonth('2019-01', 'pt')).toBe('janeiro 2019');
    expect(formatMonth('2026-10', 'pt')).toBe('outubro 2026');
    expect(formatMonth('2021-09', 'pt')).toBe('setembro 2021');
  });
  it('is not affected by the machine time zone', () => {
    const original = process.env.TZ;
    try {
      for (const tz of ['Pacific/Auckland', 'America/Sao_Paulo', 'UTC']) {
        process.env.TZ = tz;
        expect(formatMonth('2019-01', 'en')).toBe('January 2019');
        expect(formatMonth('2019-12', 'en')).toBe('December 2019');
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
  it('handles present, empty and unexpected values', () => {
    expect(formatMonth('present', 'en')).toBe('present');
    expect(formatMonth('present', 'pt')).toBe('presente');
    expect(formatMonth(null, 'en')).toBe('');
    expect(formatMonth('soon', 'en')).toBe('soon');
  });
  it('formats a range with a dash', () => {
    expect(formatMonthRange('2019-01', 'present', 'pt')).toBe('janeiro 2019 - presente');
  });
});

describe('plural and number formatting', () => {
  const forms = { one: 'role', other: 'roles' };
  it("follows each language's own plural rules", () => {
    expect(plural('en', 1, forms)).toBe('role');
    expect(plural('en', 0, forms)).toBe('roles');
    // Portuguese treats zero as singular.
    expect(plural('pt', 0, { one: 'cargo', other: 'cargos' })).toBe('cargo');
    expect(plural('pt', 2, { one: 'cargo', other: 'cargos' })).toBe('cargos');
  });
  it('uses the decimal separator of the language', () => {
    expect(formatNumber('en', 7.7)).toBe('7.7');
    expect(formatNumber('pt', 7.7)).toBe('7,7');
    expect(formatNumber('en', 4)).toBe('4');
  });
  it('combines number and word', () => {
    expect(formatCount('en', 1, forms)).toBe('1 role');
    expect(formatCount('pt', 6, { one: 'cargo', other: 'cargos' })).toBe('6 cargos');
  });
});

describe('formatList', () => {
  it("joins with the language's own conjunction", () => {
    expect(formatList('pt', ['SQL', 'Kafka', 'Docker'])).toBe('SQL, Kafka e Docker');
    expect(formatList('en', ['MySQL'])).toBe('MySQL');
    expect(formatList('en', ['PostgreSQL', 'BigQuery'])).toBe('PostgreSQL and BigQuery');
  });
});
