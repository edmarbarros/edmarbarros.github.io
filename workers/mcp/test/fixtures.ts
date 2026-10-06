import { vi } from 'vitest';
import type { Env } from '../src/types';

export const env: Env = { SITE_URL: 'https://site.test', CACHE_TTL: '60' };

const post = (lang: 'en' | 'pt', slug: string, title: string, tags: string[], body: string) => ({
  slug,
  lang,
  title,
  summary: `Summary of ${title}`,
  tags,
  publishedAt: '2026-04-17T00:00:00.000Z',
  updatedAt: null,
  translationKey: slug,
  url: `https://site.test/${lang === 'en' ? '' : 'pt/'}blog/${slug}`,
  api: `https://site.test/api/${lang}/posts/${slug}.json`,
  format: 'markdown' as const,
  body,
});

const project = (
  lang: 'en' | 'pt',
  kind: 'work' | 'side',
  slug: string,
  title: string,
  body: string,
) => ({
  slug,
  lang,
  kind,
  title,
  company: 'Acme',
  role: 'Engineer',
  period: 'Jun 2023 – Apr 2024',
  location: 'Remote',
  summary: `Summary of ${title}`,
  stack: ['Node.js', 'Kafka'],
  link: null,
  repo: null,
  featured: false,
  url: `https://site.test/projects/${kind}/${slug}`,
  api: `https://site.test/api/${lang}/projects/${kind}/${slug}.json`,
  format: 'markdown' as const,
  body,
});

const cv = (lang: 'en' | 'pt') => ({
  lang,
  identity: {
    name: 'Edmar Barros',
    title: 'Staff Engineer',
    location: 'Brazil · Remote',
    email: 'hello[at]example[.]com',
    linkedin: 'https://linkedin.com/in/x',
    github: 'https://github.com/x',
    twitter: '@x',
    photo: 'https://site.test/images/x.jpg',
  },
  summary: 'Engineer with a decade of distributed systems experience.',
  experience: [
    {
      company: 'Quander',
      location: 'Remote',
      url: null,
      blurb: 'Maker of an AI growth platform.',
      roles: [
        {
          role: 'Senior Software Engineer',
          startMonth: '2026-05',
          endMonth: '2026-10',
          period: 'May 2026 – Oct 2026',
          bullets: ['Built the Stripe subscription flow.', 'Launched TikTok Ads integration.'],
          stack: ['PostgreSQL', 'Stripe'],
        },
      ],
    },
  ],
  education: [
    {
      institution: 'University',
      degree: 'BSc',
      period: '2009 – 2014',
      location: 'Coimbra',
      note: null,
    },
  ],
  skills: [{ label: 'Databases', items: ['PostgreSQL', 'Redis'] }],
  socialSkills: [],
  languages: [{ language: 'Portuguese', level: 'Native', note: null }],
  interests: 'Arduino',
  pdf: 'https://site.test/cv/cv.pdf',
  url: `https://site.test/${lang === 'en' ? '' : 'pt/'}cv`,
});

const strip = <T extends { format: string; body: string }>({ format: _f, body: _b, ...rest }: T) =>
  rest;

export const posts = {
  en: [
    post(
      'en',
      'hello-world',
      'Hello, world',
      ['meta'],
      'Intro text about distributed systems and Kafka.',
    ),
    post(
      'en',
      'kafka-notes',
      'Kafka notes',
      ['kafka', 'infra'],
      'Partitions, consumer groups and rebalancing.',
    ),
  ],
  pt: [post('pt', 'ola-mundo', 'Olá, mundo', ['meta'], 'Texto introdutório.')],
};
export const projects = {
  en: [
    project(
      'en',
      'work',
      'vendoo-staff',
      'Vendoo Staff',
      'Migrated a monolith to Kafka microservices.',
    ),
    project('en', 'side', 'brew-controller', 'Brew Controller', 'Arduino fermentation controller.'),
  ],
  pt: [] as ReturnType<typeof project>[],
};

/** Route table for the stubbed fetch, mirroring the static /api export. */
export function routes(): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const lang of ['en', 'pt'] as const) {
    r[`/api/${lang}/posts.json`] = {
      lang,
      count: posts[lang].length,
      items: posts[lang].map(strip),
    };
    for (const p of posts[lang]) r[`/api/${lang}/posts/${p.slug}.json`] = p;
    r[`/api/${lang}/projects.json`] = {
      lang,
      count: projects[lang].length,
      items: projects[lang].map(strip),
    };
    for (const p of projects[lang]) r[`/api/${lang}/projects/${p.kind}/${p.slug}.json`] = p;
    r[`/api/${lang}/cv.json`] = cv(lang);
  }
  return r;
}

export function stubSite(table: Record<string, unknown> = routes()) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
    ).pathname;
    if (path in table) return new Response(JSON.stringify(table[path]), { status: 200 });
    return new Response('Not found', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
