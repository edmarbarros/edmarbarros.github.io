export interface Env {
  /** Origin that serves the static JSON export, e.g. https://edmarbarros.com */
  SITE_URL: string;
  /** Seconds to keep fetched JSON in the Cloudflare cache. */
  CACHE_TTL?: string;
}

export type Lang = 'en' | 'pt';

export interface PostSummary {
  slug: string;
  lang: Lang;
  title: string;
  summary: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string | null;
  translationKey: string | null;
  url: string;
  api: string;
}

export interface PostFull extends PostSummary {
  format: 'markdown';
  body: string;
}

export interface ProjectSummary {
  slug: string;
  lang: Lang;
  kind: 'work' | 'side';
  title: string;
  company: string | null;
  role: string | null;
  period: string;
  location: string | null;
  summary: string;
  stack: string[];
  link: string | null;
  repo: string | null;
  featured: boolean;
  url: string;
  api: string;
}

export interface ProjectFull extends ProjectSummary {
  format: 'markdown';
  body: string;
}

export interface CvRole {
  role: string;
  startMonth: string;
  endMonth: string;
  period: string;
  bullets: string[];
  stack: string[];
}

export interface Cv {
  lang: Lang;
  identity: {
    name: string;
    title: string;
    location: string;
    email: string;
    linkedin: string;
    github: string;
    twitter: string | null;
    photo: string;
  };
  summary: string;
  experience: {
    company: string;
    location: string;
    url: string | null;
    blurb: string;
    roles: CvRole[];
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
    location: string;
    note: string | null;
  }[];
  skills: { label: string; items: string[] }[];
  socialSkills: { label: string; description: string }[];
  languages: { language: string; level: string; note: string | null }[];
  interests: string;
  pdf: string;
  url: string;
}

export interface ListResponse<T> {
  lang: Lang;
  count: number;
  items: T[];
}
