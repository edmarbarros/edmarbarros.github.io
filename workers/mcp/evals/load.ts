import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSearchDocs } from '../src/search-docs';
import type { SearchDoc } from '../src/search';
import type { Lang } from '../src/languages';

/** The static export that `astro build` writes, which is what the live worker fetches. */
export const API_DIR = join(__dirname, '../../../dist/api');

const read = <T>(path: string): T => JSON.parse(readFileSync(join(API_DIR, path), 'utf8')) as T;

/** Build the search documents from the local build output, exactly as the worker does from the live site. */
export function loadLocalDocs(lang: Lang): SearchDoc[] {
  const posts = read<{ items: { slug: string }[] }>(`${lang}/posts.json`).items;
  const projects = read<{ items: { kind: string; slug: string }[] }>(`${lang}/projects.json`).items;
  return buildSearchDocs({
    lang,
    posts: posts.map((p) => read(`${lang}/posts/${p.slug}.json`)),
    projects: projects.map((p) => read(`${lang}/projects/${p.kind}/${p.slug}.json`)),
    cv: read(`${lang}/cv.json`),
    skills: read<{ items: never[] }>(`${lang}/skills.json`).items,
  });
}
