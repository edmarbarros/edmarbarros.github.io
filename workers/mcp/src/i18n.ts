import { LANGUAGES, type Lang } from './languages';
import type { SkillSummary } from './types';

/**
 * Formatting that the JavaScript runtime already knows how to translate.
 * Only words with no built-in equivalent live in the label tables below.
 */

const PRESENT: Record<Lang, string> = {
  [LANGUAGES.EN]: 'present',
  [LANGUAGES.PT]: 'presente',
};

const monthNames = new Map<Lang, Intl.DateTimeFormat>();
const pluralRules = new Map<Lang, Intl.PluralRules>();
const numberFormats = new Map<Lang, Intl.NumberFormat>();
const listFormats = new Map<Lang, Intl.ListFormat>();

function cached<T>(cache: Map<Lang, T>, lang: Lang, create: () => T): T {
  let value = cache.get(lang);
  if (!value) {
    value = create();
    cache.set(lang, value);
  }
  return value;
}

/** '2019-01' becomes 'January 2019' or 'janeiro 2019'. 'present' and null are handled too. */
export function formatMonth(value: string | null, lang: Lang): string {
  if (!value) return '';
  if (value === 'present') return PRESENT[lang];
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month] = match;
  // UTC on both sides, so the month never shifts with the machine's time zone.
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
  const name = cached(
    monthNames,
    lang,
    () => new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' }),
  ).format(date);
  return `${name} ${year}`;
}

/** 'January 2019 - October 2026'. The dash needs no translation. */
export function formatMonthRange(from: string | null, to: string | null, lang: Lang): string {
  return `${formatMonth(from, lang)} - ${formatMonth(to, lang)}`;
}

export type PluralForms = { one: string; other: string };

/** Picks the right word form using the language's own plural rules. */
export function plural(lang: Lang, count: number, forms: PluralForms): string {
  const rule = cached(pluralRules, lang, () => new Intl.PluralRules(lang)).select(count);
  return rule === 'one' ? forms.one : forms.other;
}

export function formatNumber(lang: Lang, value: number): string {
  return cached(
    numberFormats,
    lang,
    () => new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }),
  ).format(value);
}

/** '7,7 anos' or '1 role'. */
export function formatCount(lang: Lang, value: number, forms: PluralForms): string {
  return `${formatNumber(lang, value)} ${plural(lang, value, forms)}`;
}

/** 'SQL, Kafka and Docker' or 'SQL, Kafka e Docker'. */
export function formatList(lang: Lang, items: string[]): string {
  return cached(listFormats, lang, () => new Intl.ListFormat(lang)).format(items);
}

interface SkillLabels {
  level: string;
  evidence: string;
  levelNotStated: string;
  experience: string;
  viaAchievements: string;
  noEvidence: string;
  usedIn: string;
  proof: string;
  listLevel: string;
  listOnly: string;
  achievements: PluralForms;
  years: PluralForms;
  roles: PluralForms;
  /** Joins already-formatted counts, such as '7.7 years' and '6 roles'. */
  about: (years: string, roles: string) => string;
}

/** Labels the skill tools print, in the language that was asked for. */
export const SKILL_LABELS: Record<Lang, SkillLabels> = {
  [LANGUAGES.EN]: {
    level: 'Level',
    evidence: 'Evidence',
    levelNotStated:
      'not stated. A missing level means it has not been self-assessed, not that it is low.',
    experience: 'Experience',
    viaAchievements: 'shown through the achievements below rather than a tech list.',
    noEvidence:
      'none attached yet. It is listed on the CV, but no role or achievement is linked to it.',
    usedIn: 'Used in',
    proof: 'Proof',
    listLevel: 'level',
    listOnly: 'listed on the CV, no role or achievement attached yet',
    achievements: { one: 'achievement', other: 'achievements' },
    years: { one: 'year', other: 'years' },
    roles: { one: 'role', other: 'roles' },
    about: (years, roles) => `about ${years} across ${roles}`,
  },
  [LANGUAGES.PT]: {
    level: 'Nível',
    evidence: 'Evidência',
    levelNotStated:
      'não informado. Nível ausente significa que ainda não foi autoavaliado, não que seja baixo.',
    experience: 'Experiência',
    viaAchievements: 'demonstrada pelas conquistas abaixo, e não por uma lista de tecnologias.',
    noEvidence:
      'nada associado ainda. Consta no CV, mas nenhum cargo ou conquista está ligado a ela.',
    usedIn: 'Usado em',
    proof: 'Evidências',
    listLevel: 'nível',
    listOnly: 'consta no CV, ainda sem cargo ou conquista associado',
    achievements: { one: 'conquista', other: 'conquistas' },
    years: { one: 'ano', other: 'anos' },
    roles: { one: 'cargo', other: 'cargos' },
    about: (years, roles) => `cerca de ${years} em ${roles}`,
  },
};

/** 'about 7.7 years across 6 roles, January 2019 - October 2026', or '' when there is no tech-list evidence. */
export function formatSkillExperience(
  skill: Pick<SkillSummary, 'years' | 'roles_count' | 'first_used' | 'last_used'>,
  lang: Lang,
): string {
  if (skill.years === null) return '';
  const t = SKILL_LABELS[lang];
  const about = t.about(
    formatCount(lang, skill.years, t.years),
    formatCount(lang, skill.roles_count, t.roles),
  );
  return `${about}, ${formatMonthRange(skill.first_used, skill.last_used, lang)}`;
}
