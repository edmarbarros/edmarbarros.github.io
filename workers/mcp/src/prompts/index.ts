import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { helpPrompt, overviewPrompt, roleFitPrompt, skillsCheckPrompt } from './templates';

/** A prompt result is a single user message that tells the assistant what to do. */
const userMessage = (description: string, text: string) => ({
  description,
  messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }],
});

/**
 * Ready-made starting points. Clients that support MCP prompts, such as Claude Code,
 * list them as commands. Plain questions work just as well.
 */
export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'help',
    {
      title: 'What can I ask?',
      description:
        'Shows a short guide: example questions, the guided commands and what is available.',
      argsSchema: {},
    },
    () => userMessage('What can I ask?', helpPrompt()),
  );

  server.registerPrompt(
    'overview',
    {
      title: 'Overview of Edmar',
      description:
        "A recruiter's first screen: who he is, his strongest skills with evidence, and his recent work.",
      argsSchema: {},
    },
    () => userMessage('Overview of Edmar', overviewPrompt()),
  );

  server.registerPrompt(
    'skills-check',
    {
      title: 'Check a skill',
      description:
        'How much experience Edmar has with one skill or technology, with the proof behind it.',
      argsSchema: {
        skill: z.string().min(1).max(60).describe("Skill or technology, e.g. 'SQL' or 'Kafka'."),
      },
    },
    ({ skill }) => userMessage(`Skill check: ${skill}`, skillsCheckPrompt(skill)),
  );

  server.registerPrompt(
    'role-fit',
    {
      title: 'Fit for a role',
      description:
        'Free text: the role title and/or job description. Each requirement is matched to evidence on this site, with gaps stated plainly. Answers in the language of the text.',
      argsSchema: {
        role: z
          .string()
          .min(1)
          .max(8000)
          .describe('The role title and/or job description to assess against.'),
      },
    },
    ({ role }) => userMessage('Fit for a role', roleFitPrompt(role)),
  );
}
