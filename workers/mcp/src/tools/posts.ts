import { z } from 'zod';
import { getPost, listPosts } from '../data';
import { SiteDataError } from '../site-client';
import type { PostSummary } from '../types';
import {
  READ_ONLY,
  fail,
  guard,
  langField,
  ok,
  page,
  pagingFields,
  slugField,
  type ToolDeps,
} from './shared';

// Input ---------------------------------------------------------------------

const listPostsInput = {
  lang: langField,
  tag: z.string().max(60).optional().describe('Only posts with this tag (case-insensitive).'),
  ...pagingFields,
};

const getPostInput = { slug: slugField, lang: langField };

// Formatting --------------------------------------------------------------------

const isoDate = (iso: string) => iso.slice(0, 10);

const postLine = (p: PostSummary) =>
  `- **${p.title}** (${isoDate(p.publishedAt)}) [${p.slug}]\n  ${p.summary}\n  ${p.url}`;

const hasTag = (post: PostSummary, tag: string) =>
  post.tags.some((t) => t.toLowerCase() === tag.toLowerCase());

// Tools -----------------------------------------------------------------------

export function registerPostTools({ server, env, ctx }: ToolDeps): void {
  server.registerTool(
    'site_list_posts',
    {
      title: 'List blog posts',
      description:
        'List blog posts, newest first, with title, summary, tags and URL. Use site_get_post to read one in full.',
      inputSchema: listPostsInput,
      annotations: READ_ONLY,
    },
    ({ lang, tag, limit, offset }) =>
      guard(async () => {
        const { items } = await listPosts(env, lang, ctx);
        const filtered = tag ? items.filter((p) => hasTag(p, tag)) : items;
        const { slice, meta } = page(filtered, limit, offset);
        if (slice.length === 0) {
          const tags = [...new Set(items.flatMap((p) => p.tags))].sort();
          return ok(
            tag
              ? `No posts tagged "${tag}". Available tags: ${tags.join(', ') || 'none'}.`
              : 'No posts published yet.',
            { ...meta, items: [] },
          );
        }
        return ok(
          `${meta.total} post(s), showing ${meta.count}.\n\n${slice.map(postLine).join('\n')}`,
          {
            ...meta,
            items: slice,
          },
        );
      }),
  );

  server.registerTool(
    'site_get_post',
    {
      title: 'Get blog post',
      description: 'Read one blog post in full as markdown. Get slugs from site_list_posts.',
      inputSchema: getPostInput,
      annotations: READ_ONLY,
    },
    ({ slug, lang }) =>
      guard(async () => {
        try {
          const post = await getPost(env, lang, slug, ctx);
          const header = `# ${post.title}\n${isoDate(post.publishedAt)} · ${post.tags.join(', ') || 'no tags'} · ${post.url}\n\n`;
          return ok(header + post.body, post);
        } catch (err) {
          if (err instanceof SiteDataError && err.status === 404) {
            const { items } = await listPosts(env, lang, ctx);
            return fail(
              `No ${lang} post with slug "${slug}". Available slugs: ${items.map((p) => p.slug).join(', ') || 'none'}.`,
            );
          }
          throw err;
        }
      }),
  );
}
