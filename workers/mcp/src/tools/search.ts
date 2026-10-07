import { z } from 'zod';
import { search } from '../search';
import { loadSearchDocs } from '../search-docs';
import type { SearchHit } from '../search';
import { READ_ONLY, guard, langField, ok, type ToolDeps } from './shared';

// Input ---------------------------------------------------------------------

const searchInput = {
  query: z
    .string()
    .min(2)
    .max(200)
    .describe("Search words, e.g. 'kafka migration' or 'terraform'."),
  lang: langField,
  limit: z.number().int().min(1).max(25).default(8).describe('Maximum hits (1-25, default 8).'),
};

// Formatting --------------------------------------------------------------------

const hitLine = (h: SearchHit) => `- [${h.type}] **${h.title}**\n  ${h.snippet}\n  ${h.url}`;

// Tools -----------------------------------------------------------------------

export function registerSearchTools({ server, env, ctx }: ToolDeps): void {
  server.registerTool(
    'site_search',
    {
      title: 'Search the site',
      description:
        'Full-text search across blog posts, project write-ups, CV experience and skills. All words must match. Returns ranked hits with a snippet and URL.',
      inputSchema: searchInput,
      annotations: READ_ONLY,
    },
    ({ query, lang, limit }) =>
      guard(async () => {
        const hits = search(await loadSearchDocs(env, lang, ctx), query, limit);
        if (hits.length === 0) {
          return ok(`No results for "${query}". Try fewer or broader words.`, {
            query,
            count: 0,
            hits: [],
          });
        }
        return ok(`${hits.length} result(s) for "${query}".\n\n${hits.map(hitLine).join('\n')}`, {
          query,
          count: hits.length,
          hits,
        });
      }),
  );
}
