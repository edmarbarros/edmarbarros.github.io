import type { Locale } from '../i18n';
import { cv, type Bilingual } from '../data/cv';
import { formatPeriod } from '../data/duration';
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
