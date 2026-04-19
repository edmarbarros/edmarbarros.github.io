import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postSlug } from '../content/helpers';

export async function GET(context: APIContext) {
  const posts = await getPosts('en');
  return rss({
    title: 'Edmar Barros — Blog',
    description: 'Notes on distributed systems, infra, and engineering leadership.',
    site: context.site ?? 'https://edmarbarros.com',
    items: posts.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.publishedAt,
      description: entry.data.summary,
      link: `/blog/${postSlug(entry)}/`,
      categories: entry.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
