import type { Locale } from '../i18n';
import { backerLabel, cv, type Bilingual } from '../data/cv';
import { formatPeriod, monthIndex } from '../data/duration';
import {
  evidenceLabels,
  evidenceRuleText,
  evidenceTier,
  skillGroupLabels,
  skillLevelLabels,
  skills,
  type Skill,
} from '../data/skills';
import { postSlug, postUrl, projectSlug, type PostEntry, type ProjectEntry } from './helpers';

/** Build a JSON response for a static endpoint. */
export function json(data: unknown): Response {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Both locales, for getStaticPaths on [lang] routes. */
export const localePaths = () => (['en', 'pt'] as const).map((lang) => ({ params: { lang } }));

export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(path, site ?? 'https://edmarbarros.com').href;
}

export function postSummaryJson(entry: PostEntry, lang: Locale, site: URL | undefined) {
  return {
    slug: postSlug(entry),
    lang,
    title: entry.data.title,
    summary: entry.data.summary,
    tags: entry.data.tags,
    publishedAt: entry.data.publishedAt.toISOString(),
    updatedAt: entry.data.updatedAt?.toISOString() ?? null,
    translationKey: entry.data.translationKey ?? null,
    url: absoluteUrl(postUrl(entry, lang), site),
    api: absoluteUrl(`/api/${lang}/posts/${postSlug(entry)}.json`, site),
  };
}

export function postFullJson(entry: PostEntry, lang: Locale, site: URL | undefined) {
  return {
    ...postSummaryJson(entry, lang, site),
    format: 'markdown' as const,
    body: entry.body ?? '',
  };
}

export function projectUrl(entry: ProjectEntry, lang: Locale): string {
  const path = `/projects/${entry.data.kind}/${projectSlug(entry)}`;
  return lang === 'en' ? path : `/pt${path}`;
}

export function projectSummaryJson(entry: ProjectEntry, lang: Locale, site: URL | undefined) {
  const slug = projectSlug(entry);
  return {
    slug,
    lang,
    kind: entry.data.kind,
    title: entry.data.title,
    company: entry.data.company ?? null,
    role: entry.data.role ?? null,
    period: entry.data.period,
    location: entry.data.location ?? null,
    summary: entry.data.summary,
    stack: entry.data.stack,
    link: entry.data.link ?? null,
    repo: entry.data.repo ?? null,
    featured: entry.data.featured,
    url: absoluteUrl(projectUrl(entry, lang), site),
    api: absoluteUrl(`/api/${lang}/projects/${entry.data.kind}/${slug}.json`, site),
  };
}

export function projectFullJson(entry: ProjectEntry, lang: Locale, site: URL | undefined) {
  return {
    ...projectSummaryJson(entry, lang, site),
    format: 'markdown' as const,
    body: entry.body ?? '',
  };
}

const pick = (b: Bilingual | undefined, lang: Locale) => (b ? b[lang] : null);

/** CV with every bilingual field resolved to a single locale. */
export function cvJson(lang: Locale, site: URL | undefined) {
  const { identity } = cv;
  return {
    lang,
    identity: {
      name: identity.name,
      title: identity.title[lang],
      location: identity.location[lang],
      email: identity.email,
      linkedin: identity.linkedin,
      github: identity.github,
      twitter: identity.twitter ?? null,
      photo: absoluteUrl(identity.photo, site),
    },
    summary: cv.summary[lang],
    experience: cv.experience.map((c) => ({
      company: c.company,
      location: c.location,
      url: c.url ?? null,
      backers: (c.backers ?? []).map((b) => ({ name: b.name, label: backerLabel(b) })),
      blurb: c.blurb[lang],
      roles: c.roles.map((r) => ({
        role: r.role[lang],
        startMonth: r.startMonth,
        endMonth: r.endMonth,
        period: formatPeriod(r.startMonth, r.endMonth, lang),
        bullets: r.bullets[lang],
        stack: r.stack,
      })),
    })),
    education: cv.education.map((e) => ({
      institution: e.institution,
      degree: e.degree[lang],
      period: e.period,
      location: e.location,
      note: pick(e.note, lang),
    })),
    skills: cv.skills.map((s) => ({ label: s.label[lang], items: s.items })),
    socialSkills: cv.socialSkills.map((s) => ({
      label: s.label[lang],
      description: s.description[lang],
    })),
    languages: cv.languages.map((l) => ({
      language: l.language[lang],
      level: l.level[lang],
      note: pick(l.note, lang),
    })),
    interests: cv.interests[lang],
    pdf: absoluteUrl(cv.pdf[lang], site),
    url: absoluteUrl(lang === 'en' ? '/cv' : '/pt/cv', site),
  };
}

/** How many of a role's achievements to show as context for a skill. */
const MAX_HIGHLIGHTS = 3;

/** CV bullets read 'Headline: detail'. The headline is the outcome. */
const headline = (bullet: string) => {
  const cut = bullet.indexOf(': ');
  return cut > 0 && cut < 100 ? bullet.slice(0, cut) : bullet;
};

/** Roles whose tech list names this skill, with the union of months across them. */
function skillEvidence(skill: Skill, lang: Locale) {
  if (skill.matches.length === 0) return null;
  const wanted = new Set(skill.matches.map((m) => m.toLowerCase()));
  const roles = cv.experience.flatMap((c) =>
    c.roles.flatMap((r) => {
      const used = r.stack.filter((t) => wanted.has(t.toLowerCase()));
      if (used.length === 0) return [];
      return [
        {
          company: c.company,
          role: r.role[lang],
          period: formatPeriod(r.startMonth, r.endMonth, lang),
          startMonth: r.startMonth,
          endMonth: r.endMonth,
          used,
          highlights: r.bullets[lang].slice(0, MAX_HIGHLIGHTS).map(headline),
        },
      ];
    }),
  );
  if (roles.length === 0) return null;

  const months = new Set<number>();
  for (const r of roles) {
    for (let i = monthIndex(r.startMonth); i <= monthIndex(r.endMonth); i++) months.add(i);
  }
  const byStart = [...roles].sort((a, b) => monthIndex(a.startMonth) - monthIndex(b.startMonth));
  const byEnd = [...roles].sort((a, b) => monthIndex(b.endMonth) - monthIndex(a.endMonth));
  return {
    roles,
    roles_count: roles.length,
    first_used: byStart[0]!.startMonth,
    last_used: byEnd[0]!.endMonth,
    months: months.size,
    years: Math.round((months.size / 12) * 10) / 10,
    basis:
      lang === 'en'
        ? 'Months across roles whose tech list names it, with overlaps counted once. A lower bound, since tech lists are not exhaustive.'
        : 'Meses nos cargos cuja lista de tecnologias a cita, sem contar sobreposições duas vezes. É um mínimo, pois as listas de tecnologias não são exaustivas.',
  };
}

export function skillSummaryJson(skill: Skill, lang: Locale, site: URL | undefined) {
  const evidence = skillEvidence(skill, lang);
  const tier = evidenceTier({
    years: evidence?.years ?? null,
    roles: evidence?.roles_count ?? 0,
    proofCount: skill.proof.length,
  });
  return {
    id: skill.id,
    name: skill.name,
    group: skill.group,
    group_label: skillGroupLabels[skill.group][lang],
    aliases: skill.aliases,
    level: skill.level ?? null,
    level_label: skill.level ? skillLevelLabels[skill.level][lang] : null,
    years: evidence?.years ?? null,
    months: evidence?.months ?? null,
    first_used: evidence?.first_used ?? null,
    last_used: evidence?.last_used ?? null,
    roles_count: evidence?.roles_count ?? 0,
    proof_count: skill.proof.length,
    proof: skill.proof.map((p) => p[lang]),
    // Listed on the CV but with no role or achievement attached to it yet.
    listed_only: !evidence && skill.proof.length === 0,
    evidence: {
      tier,
      label: evidenceLabels[tier][lang],
    },
    api: absoluteUrl(`/api/${lang}/skills/${skill.id}.json`, site),
  };
}

export function skillFullJson(skill: Skill, lang: Locale, site: URL | undefined) {
  const evidence = skillEvidence(skill, lang);
  return {
    ...skillSummaryJson(skill, lang, site),
    roles: evidence?.roles ?? [],
    highlights_note:
      lang === 'en'
        ? 'Headline achievements from the same roles. They are not specific to this skill.'
        : 'Principais conquistas dos mesmos cargos. Não são específicas desta habilidade.',
    basis: evidence?.basis ?? null,
  };
}

export function skillsListJson(lang: Locale, site: URL | undefined) {
  const items = skills.map((s) => skillSummaryJson(s, lang, site));
  return {
    lang,
    count: items.length,
    note: `${
      lang === 'en'
        ? 'Years and roles are computed from the CV. A level appears only once it has been stated, so a missing level means not stated, not low.'
        : 'Anos e cargos são calculados a partir do CV. O nível só aparece depois de informado, então nível ausente significa não informado, não baixo.'
    } ${evidenceRuleText[lang]}`,
    items,
  };
}
