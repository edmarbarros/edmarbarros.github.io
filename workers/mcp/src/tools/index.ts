import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Env } from '../types';
import { registerHelpTools } from './help';
import { registerPostTools } from './posts';
import { registerProfileTools } from './profile';
import { registerProjectTools } from './projects';
import { registerSearchTools } from './search';
import { registerSkillTools } from './skills';

export function registerTools(server: McpServer, env: Env, ctx?: ExecutionContext): void {
  const deps = { server, env, ctx };
  registerHelpTools(deps);
  registerProfileTools(deps);
  registerSkillTools(deps);
  registerPostTools(deps);
  registerProjectTools(deps);
  registerSearchTools(deps);
}
