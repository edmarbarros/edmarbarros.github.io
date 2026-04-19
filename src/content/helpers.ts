import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n';

export type ProjectEntry = CollectionEntry<'projects'>;
export type PostEntry = CollectionEntry<'posts'>;

function localePrefix(lang: Locale): string {
  return `${lang}/`;
}

export async function getProjects(lang: Locale, kind?: 'work' | 'side'): Promise<ProjectEntry[]> {
  const entries = await getCollection('projects', (e: ProjectEntry) => e.id.startsWith(localePrefix(lang)));
  const filtered = kind ? entries.filter((e: ProjectEntry) => e.data.kind === kind) : entries;
  return filtered.sort((a: ProjectEntry, b: ProjectEntry) => b.data.order - a.data.order);
}

export async function getPosts(lang: Locale, { includeDrafts = false } = {}): Promise<PostEntry[]> {
  const entries = await getCollection('posts', (e: PostEntry) => e.id.startsWith(localePrefix(lang)));
  const filtered = includeDrafts ? entries : entries.filter((e: PostEntry) => !e.data.draft);
  return filtered.sort(
    (a: PostEntry, b: PostEntry) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

// Strip leading "<lang>/<work|side>/" from the id to get the routing slug.
export function projectSlug(entry: ProjectEntry): string {
  const parts = entry.id.replace(/\.mdx?$/, '').split('/');
  return parts.slice(2).join('/');
}

// Strip leading "<lang>/" from post id.
export function postSlug(entry: PostEntry): string {
  const parts = entry.id.replace(/\.mdx?$/, '').split('/');
  return parts.slice(1).join('/');
}
