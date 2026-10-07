import type { APIContext } from 'astro';
import { absoluteUrl, json } from '../../content/api';

/** Discovery document: lists every JSON endpoint the site exports. */
export function GET({ site }: APIContext) {
  const u = (p: string) => absoluteUrl(p, site);
  // Templates are plain strings so the {placeholders} are not percent-encoded.
  const t = (p: string) => u('/') + p;
  return json({
    name: 'Edmar Barros — site API',
    description:
      'Static, read-only JSON export of the site content (blog posts, projects, CV, skills with evidence). Regenerated on every deploy.',
    locales: ['en', 'pt'],
    endpoints: {
      posts: { en: u('/api/en/posts.json'), pt: u('/api/pt/posts.json') },
      post: t('api/{lang}/posts/{slug}.json'),
      projects: { en: u('/api/en/projects.json'), pt: u('/api/pt/projects.json') },
      project: t('api/{lang}/projects/{kind}/{slug}.json'),
      cv: { en: u('/api/en/cv.json'), pt: u('/api/pt/cv.json') },
      skills: { en: u('/api/en/skills.json'), pt: u('/api/pt/skills.json') },
      skill: t('api/{lang}/skills/{id}.json'),
      rss: { en: u('/rss.xml'), pt: u('/pt/rss.xml') },
      sitemap: u('/sitemap-index.xml'),
    },
  });
}
