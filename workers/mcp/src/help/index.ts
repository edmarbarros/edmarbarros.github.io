import type { Lang } from '../languages';
import { COMMAND_PREFIX, EXAMPLE_GROUPS, HELP_TEXT, PROMPT_HELP, TOOL_HELP } from './content';

/** The same guide as plain data, for clients that read structured content. */
export function helpData(lang: Lang) {
  return {
    lang,
    examples: EXAMPLE_GROUPS.map((g) => ({ group: g.title[lang], questions: g.questions[lang] })),
    commands: PROMPT_HELP.map((p) => ({
      command: commandLine(p.name, p.usage),
      summary: p.summary[lang],
    })),
    tools: TOOL_HELP.map((t) => ({ tool: t.name, summary: t.summary[lang] })),
  };
}

function commandLine(name: string, usage: string): string {
  return `/${COMMAND_PREFIX}:${name}${usage ? ` ${usage}` : ''}`;
}

/** The guide as markdown: what to ask, the guided commands, and what the server can look up. */
export function buildHelp(lang: Lang): string {
  const t = HELP_TEXT[lang];
  const data = helpData(lang);
  const lines = [`# ${t.title}`, '', t.intro, '', `## ${t.examples}`];
  for (const group of data.examples) {
    lines.push('', `**${group.group}**`, ...group.questions.map((q) => `- ${q}`));
  }
  lines.push('', `## ${t.commands}`, '', t.commandsNote, '');
  lines.push(...data.commands.map((c) => `- \`${c.command}\`: ${c.summary}`));
  lines.push('', `## ${t.tools}`, '');
  lines.push(...data.tools.map((x) => `- \`${x.tool}\`: ${x.summary}`));
  lines.push('', `## ${t.goodToKnow}`, '', ...t.tips.map((tip) => `- ${tip}`));
  return lines.join('\n');
}
