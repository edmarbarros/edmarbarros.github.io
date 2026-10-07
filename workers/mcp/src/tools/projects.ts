import { z } from 'zod';
import { getProject, listProjects } from '../data';
import type { ProjectSummary } from '../types';
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

const PROJECT_KINDS = ['work', 'side'] as const;

const listProjectsInput = {
  lang: langField,
  kind: z.enum(PROJECT_KINDS).optional().describe("Filter by 'work' or 'side'."),
  ...pagingFields,
};

const getProjectInput = {
  slug: slugField,
  kind: z
    .enum(PROJECT_KINDS)
    .optional()
    .describe('Disambiguate when a slug exists in both kinds.'),
  lang: langField,
};

// Formatting --------------------------------------------------------------------

const projectLine = (p: ProjectSummary) =>
  `- **${p.title}** [${p.kind}/${p.slug}] ${p.period}\n  ${p.summary}\n  Stack: ${p.stack.join(', ')}\n  ${p.url}`;

const projectId = (p: ProjectSummary) => `${p.kind}/${p.slug}`;

// Tools -----------------------------------------------------------------------

export function registerProjectTools({ server, env, ctx }: ToolDeps): void {
  server.registerTool(
    'site_list_projects',
    {
      title: 'List projects',
      description:
        "List projects and roles from Edmar's portfolio. `kind` is 'work' for professional engagements or 'side' for side projects.",
      inputSchema: listProjectsInput,
      annotations: READ_ONLY,
    },
    ({ lang, kind, limit, offset }) =>
      guard(async () => {
        const { items } = await listProjects(env, lang, ctx);
        const filtered = kind ? items.filter((p) => p.kind === kind) : items;
        const { slice, meta } = page(filtered, limit, offset);
        if (slice.length === 0) return ok('No projects found.', { ...meta, items: [] });
        return ok(
          `${meta.total} project(s), showing ${meta.count}.\n\n${slice.map(projectLine).join('\n')}`,
          { ...meta, items: slice },
        );
      }),
  );

  server.registerTool(
    'site_get_project',
    {
      title: 'Get project',
      description:
        'Read one project write-up in full as markdown. Get slugs from site_list_projects.',
      inputSchema: getProjectInput,
      annotations: READ_ONLY,
    },
    ({ slug, kind, lang }) =>
      guard(async () => {
        const { items } = await listProjects(env, lang, ctx);
        const match = items.find((p) => p.slug === slug && (!kind || p.kind === kind));
        if (!match) {
          return fail(
            `No ${lang} project with slug "${slug}"${kind ? ` and kind "${kind}"` : ''}. Available: ${
              items.map(projectId).join(', ') || 'none'
            }.`,
          );
        }
        const project = await getProject(env, lang, match.kind, match.slug, ctx);
        const header = `# ${project.title}\n${project.period} · ${project.stack.join(', ')} · ${project.url}\n\n`;
        return ok(header + project.body, project);
      }),
  );
}
