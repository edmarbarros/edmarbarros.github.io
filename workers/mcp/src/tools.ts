import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SiteDataError, getCv, getPost, getProject, listPosts, listProjects } from './data';
import { search, type SearchDoc } from './search';
import type { Cv, Env, Lang } from './types';

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const lang = z
  .enum(['en', 'pt'])
  .default('en')
  .describe("Content language: 'en' (English, default) or 'pt' (Brazilian Portuguese).");

const slugField = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Slug may only contain letters, digits, - and _')
  .describe("Slug as returned by the list tool, e.g. 'hello-world'.");

const paging = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum items to return (1-50, default 10).'),
  offset: z.number().int().min(0).default(0).describe('Number of items to skip, for paging.'),
};

type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

const ok = (text: string, structured?: Record<string, unknown>): ToolResult => ({
  content: [{ type: 'text', text }],
  ...(structured ? { structuredContent: structured } : {}),
});

const fail = (message: string): ToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

/** Turn thrown errors into actionable tool errors instead of protocol errors. */
async function guard(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof SiteDataError) {
      return fail(
        `The site data is temporarily unavailable (${err.message}). Try again in a minute.`,
      );
    }
    throw err;
  }
}

function page<T>(items: T[], limit: number, offset: number) {
  const slice = items.slice(offset, offset + limit);
  const next = offset + slice.length;
  return {
    slice,
    meta: {
      total: items.length,
      count: slice.length,
      offset,
      has_more: next < items.length,
      next_offset: next < items.length ? next : null,
    },
  };
}

const date = (iso: string) => iso.slice(0, 10);

function cvMarkdown(cv: Cv, sections: Set<string>): string {
  const all = sections.has('all');
  const out: string[] = [`# ${cv.identity.name} — ${cv.identity.title}`, `${cv.identity.location}`];
  if (all || sections.has('summary')) out.push('', '## Summary', cv.summary);
  if (all || sections.has('experience')) {
    out.push('', '## Experience');
    for (const c of cv.experience) {
      out.push('', `### ${c.company}${c.url ? ` (${c.url})` : ''}`, c.blurb);
      for (const r of c.roles) {
        out.push('', `**${r.role}**, ${r.period}`);
        for (const b of r.bullets) out.push(`- ${b}`);
        if (r.stack.length) out.push(`Stack: ${r.stack.join(', ')}`);
      }
    }
  }
  if (all || sections.has('education')) {
    out.push('', '## Education');
    for (const e of cv.education) {
      out.push(
        `- ${e.degree}, ${e.institution}, ${e.location} (${e.period})${e.note ? `, ${e.note}` : ''}`,
      );
    }
  }
  if (all || sections.has('skills')) {
    out.push('', '## Skills');
    for (const s of cv.skills) out.push(`- **${s.label}:** ${s.items.join(', ')}`);
  }
  if (all || sections.has('languages')) {
    out.push('', '## Languages');
    for (const l of cv.languages) out.push(`- ${l.language}: ${l.level}`);
    out.push('', `Interests: ${cv.interests}`);
  }
  return out.join('\n');
}

export function registerTools(server: McpServer, env: Env, ctx?: ExecutionContext): void {
  server.registerTool(
    'site_get_profile',
    {
      title: 'Get profile',
      description:
        "Short overview of Edmar Barros: who he is, where to find him, and what this server can tell you. Start here when you don't know what to ask.",
      inputSchema: { lang },
      annotations: READ_ONLY,
    },
    ({ lang }) =>
      guard(async () => {
        const cv = await getCv(env, lang as Lang, ctx);
        const profile = {
          name: cv.identity.name,
          title: cv.identity.title,
          location: cv.identity.location,
          summary: cv.summary,
          links: {
            website: new URL('/', env.SITE_URL).href,
            cv_page: cv.url,
            cv_pdf: cv.pdf,
            linkedin: cv.identity.linkedin,
            github: cv.identity.github,
            twitter: cv.identity.twitter,
            email: cv.identity.email,
            rss: new URL('/rss.xml', env.SITE_URL).href,
          },
          languages: ['en', 'pt'],
          current_or_latest_company: cv.experience[0]?.company ?? null,
        };
        const text = [
          `${profile.name}, ${profile.title}`,
          profile.location,
          '',
          profile.summary,
          '',
          `Website: ${profile.links.website}`,
          `CV (PDF): ${profile.links.cv_pdf}`,
          `LinkedIn: ${profile.links.linkedin}`,
          `GitHub: ${profile.links.github}`,
          `Email: ${profile.links.email}`,
          '',
          'Tools: site_get_cv, site_list_posts, site_get_post, site_list_projects, site_get_project, site_search.',
        ].join('\n');
        return ok(text, profile);
      }),
  );

  server.registerTool(
    'site_get_cv',
    {
      title: 'Get CV',
      description:
        "Edmar's CV: summary, work experience with achievements and tech stack, education, skills and languages. Use `sections` to fetch only part of it.",
      inputSchema: {
        lang,
        sections: z
          .array(z.enum(['all', 'summary', 'experience', 'education', 'skills', 'languages']))
          .default(['all'])
          .describe("Which parts to return. Default ['all']."),
      },
      annotations: READ_ONLY,
    },
    ({ lang, sections }) =>
      guard(async () => {
        const cv = await getCv(env, lang as Lang, ctx);
        return ok(cvMarkdown(cv, new Set(sections)), cv as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    'site_list_posts',
    {
      title: 'List blog posts',
      description:
        'List blog posts, newest first, with title, summary, tags and URL. Use site_get_post to read one in full.',
      inputSchema: {
        lang,
        tag: z.string().max(60).optional().describe('Only posts with this tag (case-insensitive).'),
        ...paging,
      },
      annotations: READ_ONLY,
    },
    ({ lang, tag, limit, offset }) =>
      guard(async () => {
        const { items } = await listPosts(env, lang as Lang, ctx);
        const filtered = tag
          ? items.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
          : items;
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
        const text = slice
          .map(
            (p) =>
              `- **${p.title}** (${date(p.publishedAt)}) [${p.slug}]\n  ${p.summary}\n  ${p.url}`,
          )
          .join('\n');
        return ok(`${meta.total} post(s), showing ${meta.count}.\n\n${text}`, {
          ...meta,
          items: slice,
        });
      }),
  );

  server.registerTool(
    'site_get_post',
    {
      title: 'Get blog post',
      description: 'Read one blog post in full as markdown. Get slugs from site_list_posts.',
      inputSchema: { slug: slugField, lang },
      annotations: READ_ONLY,
    },
    ({ slug, lang }) =>
      guard(async () => {
        try {
          const post = await getPost(env, lang as Lang, slug, ctx);
          const header = `# ${post.title}\n${date(post.publishedAt)} · ${post.tags.join(', ') || 'no tags'} · ${post.url}\n\n`;
          return ok(header + post.body, post as unknown as Record<string, unknown>);
        } catch (err) {
          if (err instanceof SiteDataError && err.status === 404) {
            const { items } = await listPosts(env, lang as Lang, ctx);
            return fail(
              `No ${lang} post with slug "${slug}". Available slugs: ${items.map((p) => p.slug).join(', ') || 'none'}.`,
            );
          }
          throw err;
        }
      }),
  );

  server.registerTool(
    'site_list_projects',
    {
      title: 'List projects',
      description:
        "List projects and roles from Edmar's portfolio. `kind` is 'work' for professional engagements or 'side' for side projects.",
      inputSchema: {
        lang,
        kind: z.enum(['work', 'side']).optional().describe("Filter by 'work' or 'side'."),
        ...paging,
      },
      annotations: READ_ONLY,
    },
    ({ lang, kind, limit, offset }) =>
      guard(async () => {
        const { items } = await listProjects(env, lang as Lang, ctx);
        const filtered = kind ? items.filter((p) => p.kind === kind) : items;
        const { slice, meta } = page(filtered, limit, offset);
        if (slice.length === 0) return ok('No projects found.', { ...meta, items: [] });
        const text = slice
          .map(
            (p) =>
              `- **${p.title}** [${p.kind}/${p.slug}] ${p.period}\n  ${p.summary}\n  Stack: ${p.stack.join(', ')}\n  ${p.url}`,
          )
          .join('\n');
        return ok(`${meta.total} project(s), showing ${meta.count}.\n\n${text}`, {
          ...meta,
          items: slice,
        });
      }),
  );

  server.registerTool(
    'site_get_project',
    {
      title: 'Get project',
      description:
        'Read one project write-up in full as markdown. Get slugs from site_list_projects.',
      inputSchema: {
        slug: slugField,
        kind: z
          .enum(['work', 'side'])
          .optional()
          .describe('Disambiguates when a slug exists in both kinds.'),
        lang,
      },
      annotations: READ_ONLY,
    },
    ({ slug, kind, lang }) =>
      guard(async () => {
        const { items } = await listProjects(env, lang as Lang, ctx);
        const match = items.find((p) => p.slug === slug && (!kind || p.kind === kind));
        if (!match) {
          return fail(
            `No ${lang} project with slug "${slug}"${kind ? ` and kind "${kind}"` : ''}. Available: ${
              items.map((p) => `${p.kind}/${p.slug}`).join(', ') || 'none'
            }.`,
          );
        }
        const project = await getProject(env, lang as Lang, match.kind, match.slug, ctx);
        const header = `# ${project.title}\n${project.period} · ${project.stack.join(', ')} · ${project.url}\n\n`;
        return ok(header + project.body, project as unknown as Record<string, unknown>);
      }),
  );

  server.registerTool(
    'site_search',
    {
      title: 'Search the site',
      description:
        'Full-text search across blog posts, project write-ups and CV experience. All words must match. Returns ranked hits with a snippet and URL.',
      inputSchema: {
        query: z
          .string()
          .min(2)
          .max(200)
          .describe("Search words, e.g. 'kafka migration' or 'terraform'."),
        lang,
        limit: z
          .number()
          .int()
          .min(1)
          .max(25)
          .default(8)
          .describe('Maximum hits (1-25, default 8).'),
      },
      annotations: READ_ONLY,
    },
    ({ query, lang, limit }) =>
      guard(async () => {
        const l = lang as Lang;
        const [posts, projects, cv] = await Promise.all([
          listPosts(env, l, ctx),
          listProjects(env, l, ctx),
          getCv(env, l, ctx),
        ]);
        const [fullPosts, fullProjects] = await Promise.all([
          Promise.all(posts.items.map((p) => getPost(env, l, p.slug, ctx))),
          Promise.all(projects.items.map((p) => getProject(env, l, p.kind, p.slug, ctx))),
        ]);

        const docs: SearchDoc[] = [
          ...fullPosts.map((p) => ({
            type: 'post' as const,
            title: p.title,
            url: p.url,
            summary: p.summary,
            title_: p.title,
            tags: p.tags.join(' '),
            text: `${p.summary}\n${p.body}`,
          })),
          ...fullProjects.map((p) => ({
            type: 'project' as const,
            title: p.title,
            url: p.url,
            summary: p.summary,
            title_: `${p.title} ${p.company ?? ''}`,
            tags: p.stack.join(' '),
            text: `${p.summary}\n${p.body}`,
          })),
          ...cv.experience.flatMap((c) =>
            c.roles.map((r) => ({
              type: 'experience' as const,
              title: `${r.role} at ${c.company}`,
              url: cv.url,
              summary: `${r.period}. ${c.blurb}`,
              title_: `${r.role} ${c.company}`,
              tags: r.stack.join(' '),
              text: `${c.blurb}\n${r.bullets.join('\n')}`,
            })),
          ),
        ];

        const hits = search(docs, query, limit);
        if (hits.length === 0) {
          return ok(`No results for "${query}". Try fewer or broader words.`, {
            query,
            count: 0,
            hits: [],
          });
        }
        const text = hits
          .map((h) => `- [${h.type}] **${h.title}**\n  ${h.snippet}\n  ${h.url}`)
          .join('\n');
        return ok(`${hits.length} result(s) for "${query}".\n\n${text}`, {
          query,
          count: hits.length,
          hits,
        });
      }),
  );
}
