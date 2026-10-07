import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { EXAMPLE_GROUPS, HELP_TEXT, PROMPT_HELP, TOOL_HELP } from '../src/help/content';
import { buildHelp, helpData } from '../src/help';
import { LANG_VALUES } from '../src/languages';
import { createServer } from '../src/server';
import { env, stubSite } from './fixtures';

let client: Client;

beforeEach(async () => {
  stubSite();
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(env).connect(b);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(a);
});

describe('help content', () => {
  it('is complete in every language', () => {
    for (const lang of LANG_VALUES) {
      expect(HELP_TEXT[lang].tips.length).toBe(HELP_TEXT.en.tips.length);
      for (const g of EXAMPLE_GROUPS) {
        expect(g.title[lang].length).toBeGreaterThan(0);
        expect(g.questions[lang].length).toBe(g.questions.en.length);
      }
      for (const entry of [...PROMPT_HELP, ...TOOL_HELP]) {
        expect(entry.summary[lang].length).toBeGreaterThan(0);
      }
    }
  });
});

describe('buildHelp', () => {
  it('lists example questions, the guided commands and every tool', () => {
    const text = buildHelp('en');
    expect(text).toContain('# What you can ask about Edmar Barros');
    expect(text).toContain('- How much SQL experience does he have, and what proves it?');
    expect(text).toContain('`/edmarbarros:skills-check <skill>`');
    expect(text).toContain('`/edmarbarros:role-fit <job description>`');
    expect(text).toContain('`/edmarbarros:overview`');
    for (const tool of TOOL_HELP) expect(text).toContain(`\`${tool.name}\``);
  });
  it('speaks Portuguese when asked', () => {
    const text = buildHelp('pt');
    expect(text).toContain('# O que você pode perguntar sobre Edmar Barros');
    expect(text).toContain('Comandos guiados');
    expect(text).toContain('- Quanta experiência ele tem com SQL e o que comprova isso?');
  });
  it('returns the same guide as structured data', () => {
    const data = helpData('en');
    expect(data.commands.map((c) => c.command)).toContain('/edmarbarros:help');
    expect(data.tools.map((t) => t.tool)).toContain('site_help');
    expect(data.examples).toHaveLength(EXAMPLE_GROUPS.length);
  });
});

describe('the help matches what is registered', () => {
  it('documents every registered tool and nothing else', async () => {
    const { tools } = await client.listTools();
    expect(TOOL_HELP.map((t) => t.name).sort()).toEqual(tools.map((t) => t.name).sort());
  });
  it('documents every registered prompt and nothing else', async () => {
    const { prompts } = await client.listPrompts();
    expect(PROMPT_HELP.map((p) => p.name).sort()).toEqual(prompts.map((p) => p.name).sort());
  });
  it('shows each prompt that takes a required argument with it', async () => {
    const { prompts } = await client.listPrompts();
    for (const prompt of prompts) {
      const required = (prompt.arguments ?? []).filter((a) => a.required).length;
      const documented = PROMPT_HELP.find((p) => p.name === prompt.name)!;
      expect(documented.usage !== '').toBe(required > 0);
    }
  });
});

describe('site_help tool', () => {
  it('returns the guide as text and structured content', async () => {
    const res = await client.callTool({ name: 'site_help', arguments: {} });
    const text = (res.content as { text: string }[])[0]!.text;
    expect(text).toContain('Example questions');
    expect((res.structuredContent as { tools: unknown[] }).tools.length).toBe(TOOL_HELP.length);
  });
  it('serves Portuguese', async () => {
    const res = await client.callTool({ name: 'site_help', arguments: { lang: 'pt' } });
    expect((res.content as { text: string }[])[0]!.text).toContain('Exemplos de perguntas');
  });
  it('is pointed to by the profile', async () => {
    const res = await client.callTool({ name: 'site_get_profile', arguments: {} });
    expect((res.content as { text: string }[])[0]!.text).toContain('Call site_help');
  });
});

describe('help prompt', () => {
  it('carries the guide so no tool call is needed', async () => {
    const res = await client.getPrompt({ name: 'help', arguments: {} });
    const msg = res.messages[0]!.content;
    const text = msg.type === 'text' ? msg.text : '';
    expect(text).toContain('No tool calls are needed.');
    expect(text).toContain('--- GUIDE ---');
    expect(text).toContain('/edmarbarros:role-fit');
    expect(text).toContain('in English');
  });
  it('switches language', async () => {
    const res = await client.getPrompt({ name: 'help', arguments: { lang: 'pt' } });
    const msg = res.messages[0]!.content;
    expect(msg.type === 'text' ? msg.text : '').toContain('Brazilian Portuguese');
  });
});
