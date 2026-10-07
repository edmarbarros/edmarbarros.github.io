import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DEFAULT_LANG, LANG_VALUES } from '../languages';
import { overviewPrompt, roleFitPrompt, skillsCheckPrompt } from './templates';

/** A prompt result is a single user message that tells the assistant what to do. */
const userMessage = (description: string, text: string) => ({
  description,
  messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }],
});

const langArg = z
  .enum(LANG_VALUES)
  .optional()
  .describe(`Language of the answer. Default: ${DEFAULT_LANG}.`);

/**
 * Ready-made starting points. Clients that support MCP prompts, such as Claude Code,
 * list them as commands. Plain questions work just as well.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'overview',
    {
      title: 'Overview of Edmar',
      description:
        "A recruiter's first screen: who he is, his strongest skills with evidence, and his recent work.",
      argsSchema: { lang: langArg },
    },
    ({ lang }) => userMessage('Overview of Edmar', overviewPrompt(lang ?? DEFAULT_LANG)),
  );

  server.registerPrompt(
    'skills-check',
    {
      title: 'Check a skill',
      description:
        'How much experience Edmar has with one skill or technology, with the proof behind it.',
      argsSchema: {
        skill: z.string().min(1).max(60).describe("Skill or technology, e.g. 'SQL' or 'Kafka'."),
        lang: langArg,
      },
    },
    ({ skill, lang }) =>
      userMessage(`Skill check: ${skill}`, skillsCheckPrompt(skill, lang ?? DEFAULT_LANG)),
  );

  server.registerPrompt(
    'role-fit',
    {
      title: 'Fit for a role',
      description:
        'Paste a job description. Each requirement is matched to evidence on this site, with gaps stated plainly.',
      argsSchema: {
        job_description: z
          .string()
          .min(20)
          .max(8000)
          .describe('The job description text to assess against.'),
        lang: langArg,
      },
    },
    ({ job_description, lang }) =>
      userMessage('Fit for a role', roleFitPrompt(job_description, lang ?? DEFAULT_LANG)),
  );
}
