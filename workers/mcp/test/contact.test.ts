import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server';
import type { Env } from '../src/types';
import { env } from './fixtures';

const TOKEN = 'abcdefghijklmnopqrstuv';

const draft = {
  name: 'Ana Recruiter',
  email: 'ana@example.com',
  message: 'Hi Edmar, I would like to talk about a staff backend role.',
};

const saved = async () =>
  new Response(JSON.stringify({ token: TOKEN, expires_in: 1800 }), { status: 200 });

/** A client wired to a server whose contact worker answers with `respond`. */
async function connect(respond: () => Promise<Response> = saved, withBinding = true) {
  const contactFetch = vi.fn(respond);
  const serverEnv: Env = withBinding
    ? { ...env, CONTACT: { fetch: contactFetch } as unknown as Fetcher }
    : env;
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(serverEnv).connect(b);
  const client = new Client({ name: 'test', version: '0' });
  await client.connect(a);
  const send = async (args: Record<string, unknown> = draft) => {
    const res = await client.callTool({ name: 'site_draft_message', arguments: args });
    return {
      text: (res.content as { text: string }[])[0]!.text,
      isError: res.isError === true,
      data: res.structuredContent as Record<string, any>,
    };
  };
  return { client, send, contactFetch };
}

const json = (body: unknown, status: number) => async () =>
  new Response(JSON.stringify(body), { status });

describe('site_draft_message', () => {
  it('says in its description that nothing is sent and the user sends it', async () => {
    const { client } = await connect();
    const tool = (await client.listTools()).tools.find((t) => t.name === 'site_draft_message')!;
    expect(tool.description).toContain('It sends nothing');
    expect(tool.description).toContain('press Send themselves');
    expect(tool.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
  });

  it('saves the draft and returns the link for the user to open', async () => {
    const { send, contactFetch } = await connect();
    const { text, isError, data } = await send();
    expect(isError).toBe(false);
    expect(text).toContain('Draft saved. Nothing has been sent.');
    expect(text).toContain(`https://site.test/contact?draft=${TOKEN}`);
    expect(text).toContain('works once and expires in 30 minutes');
    expect(data).toEqual({
      drafted: true,
      url: `https://site.test/contact?draft=${TOKEN}`,
      expires_in_minutes: 30,
    });

    const [url, init] = contactFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://agent.internal/draft');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(draft);
    expect((init.headers as Record<string, string>)['x-client-ip']).toBe('unknown');
  });

  it('links to the Portuguese contact page when asked in Portuguese', async () => {
    const { send } = await connect();
    const { data } = await send({ ...draft, lang: 'pt' });
    expect(data.url).toBe(`https://site.test/pt/contact?draft=${TOKEN}`);
  });

  it('rejects a bad email or a too-short message before saving anything', async () => {
    const { client, contactFetch } = await connect();
    for (const bad of [
      { ...draft, email: 'nope' },
      { ...draft, message: 'short' },
      { ...draft, name: '' },
    ]) {
      const res = await client
        .callTool({ name: 'site_draft_message', arguments: bad })
        .catch((e) => e);
      expect(res instanceof Error || (res as { isError?: boolean }).isError).toBe(true);
    }
    expect(contactFetch).not.toHaveBeenCalled();
  });

  it('points to the contact page when no contact worker is bound', async () => {
    const { send } = await connect(saved, false);
    const { text, isError } = await send();
    expect(isError).toBe(true);
    expect(text).toContain('https://site.test/contact');
  });

  it("shows the contact worker's validation error so it can be fixed", async () => {
    const { send } = await connect(json({ error: 'too many links (max 2)' }, 400));
    const { text, isError } = await send();
    expect(isError).toBe(true);
    expect(text).toContain('Draft not saved: too many links (max 2). Fix it and try again.');
  });

  it('says to try later when the limit is reached', async () => {
    const { send } = await connect(json({ error: 'rate limit exceeded' }, 429));
    const { text, isError } = await send();
    expect(isError).toBe(true);
    expect(text).toContain('try again later');
    expect(text).toContain('https://site.test/contact');
  });

  it.each([[500], [502], [404]])('treats status %i as unavailable', async (status) => {
    const { send } = await connect(json({ error: 'x' }, status));
    const { text, isError } = await send();
    expect(isError).toBe(true);
    expect(text).toContain("can't be saved right now");
  });

  it('treats a network failure as unavailable', async () => {
    const { send } = await connect(async () => {
      throw new Error('boom');
    });
    const { text, isError } = await send();
    expect(isError).toBe(true);
    expect(text).toContain("can't be saved right now");
  });
});
