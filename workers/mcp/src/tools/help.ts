import { buildHelp, helpData } from '../help';
import { READ_ONLY, langField, ok, type ToolDeps } from './shared';

export function registerHelpTools({ server }: ToolDeps): void {
  server.registerTool(
    'site_help',
    {
      title: 'What can I ask?',
      description:
        'A short guide to this server: example questions, the guided commands, and what can be looked up. Use it when the user asks what they can ask, what this server can do, or how to use it.',
      inputSchema: { lang: langField },
      annotations: READ_ONLY,
    },
    ({ lang }) => Promise.resolve(ok(buildHelp(lang), helpData(lang))),
  );
}
