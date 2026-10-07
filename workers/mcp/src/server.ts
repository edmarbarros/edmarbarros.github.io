import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPrompts } from './prompts';
import { registerTools } from './tools';
import type { Env } from './types';

export function createServer(env: Env, ctx?: ExecutionContext): McpServer {
  const server = new McpServer(
    { name: 'edmarbarros-site', version: '0.1.0' },
    {
      instructions:
        "Read-only access to Edmar Barros's personal site: CV, blog posts and project write-ups, in English and Brazilian Portuguese. Call site_get_profile first for an overview, site_get_skill to check the evidence behind a specific technology or skill, or site_search to find something specific. The prompts overview, skill_check and fit are guided starting points.",
    },
  );
  registerTools(server, env, ctx);
  registerPrompts(server);
  return server;
}
