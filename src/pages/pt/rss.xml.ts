import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postSlug } from '../../content/helpers';

export async function GET(context: APIContext) {
  const posts = await getPosts('pt');
  return rss({
    title: 'Edmar Barros — Blog',
    description: 'Notas sobre sistemas distribuídos, infra e liderança técnica.',
    site: context.site ?? 'https://edmarbarros.com',
    items: posts.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.publishedAt,
      description: entry.data.summary,
      link: `/pt/blog/${postSlug(entry)}/`,
      categories: entry.data.tags,
    })),
    customData: `<language>pt-br</language>`,
  });
}
