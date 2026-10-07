import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
// The real contact worker, so a change to its host, path, payload or status codes breaks this test.
import contactWorker from '../../contact/src/index';
import { DRAFT_PATH, INTERNAL_HOST } from '../../contact/src/draft';
import type { Env as ContactEnv } from '../../contact/src/types';
import worker from '../src/index';
import { CONTACT_URL } from '../src/tools/contact';
import { env } from './fixtures';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND = 'https://api.resend.com/emails';

let contact: ContactEnv;
let mcpEnv: typeof env & { CONTACT: Fetcher };
let fetchMock: Mock;

beforeEach(() => {
  const store = new Map<string, string>();
  contact = {
    CONTACT_LIMITS: {
      get: async (k: string) => store.get(k) ?? null,
      put: async (k: string, v: string) => void store.set(k, v),
      delete: async (k: string) => void store.delete(k),
    } as unknown as KVNamespace,
    RESEND_API_KEY: 'resend-key',
    TURNSTILE_SECRET: 'turnstile-secret',
    ALLOWED_ORIGIN: 'https://edmarbarros.com',
    TO_EMAIL: 'owner@example.com',
    FROM_EMAIL: 'notifications@example.com',
  };
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === SITEVERIFY) return new Response('{"success":true}', { status: 200 });
    if (url === RESEND) return new Response('{}', { status: 200 });
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  mcpEnv = {
    ...env,
    // A service binding hands the request straight to the other worker.
    CONTACT: {
      fetch: (url: string, init?: RequestInit) =>
        contactWorker.fetch(new Request(url, init), contact),
    } as unknown as Fetcher,
  };
});
afterEach(() => {
  vi.unstubAllGlobals();
});

async function draftFrom(ip: string, over: Record<string, unknown> = {}) {
  const res = await worker.fetch(
    new Request('https://api.edmarbarros.com/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'cf-connecting-ip': ip,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'site_draft_message',
          arguments: {
            name: 'Ana Recruiter',
            email: 'ana@example.com',
            message: 'Hi Edmar, I would like to talk about a staff backend role.',
            ...over,
          },
        },
      }),
    }),
    mcpEnv,
  );
  const result = ((await res.json()) as any).result;
  return {
    text: result.content[0].text as string,
    isError: result.isError === true,
    url: result.structuredContent?.url as string | undefined,
  };
}

const asBrowser = (url: string, init: RequestInit = {}) =>
  contactWorker.fetch(
    new Request(url, {
      ...init,
      headers: { origin: 'https://edmarbarros.com', ...(init.headers ?? {}) },
    }),
    contact,
  );

const emails = () =>
  fetchMock.mock.calls
    .filter((c) => String(c[0]) === RESEND)
    .map((c) => JSON.parse((c[1] as RequestInit).body as string));

const formPost = (token: string, over: Record<string, unknown> = {}) =>
  asBrowser('https://api.edmarbarros.com/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '198.51.100.99' },
    body: JSON.stringify({
      name: 'Ana Recruiter',
      email: 'ana@example.com',
      message: 'I changed my mind about the wording of this message.',
      website: '',
      ts: Date.now() - 5000,
      turnstileToken: 'turnstile-token-from-the-widget',
      draft: token,
      ...over,
    }),
  });

describe('MCP worker and contact worker together', () => {
  it('agree on the host and path', () => {
    expect(CONTACT_URL).toBe(`https://${INTERNAL_HOST}${DRAFT_PATH}`);
  });

  it("goes from an assistant's draft to a delivered email only through the form", async () => {
    // 1. The assistant drafts. Nothing is emailed.
    const { url, isError } = await draftFrom('198.51.100.10');
    expect(isError).toBe(false);
    expect(emails()).toHaveLength(0);
    const token = new URL(url!).searchParams.get('draft')!;
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);

    // 2. The contact page loads the draft for the person to review.
    const loaded = await asBrowser(`https://api.edmarbarros.com/contact?draft=${token}`);
    expect(loaded.status).toBe(200);
    expect(await loaded.json()).toMatchObject({ name: 'Ana Recruiter', email: 'ana@example.com' });

    // 3. The person edits it, passes Turnstile and presses Send.
    expect((await formPost(token)).status).toBe(204);

    // Turnstile ran, and the email says how it was written.
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toContain(SITEVERIFY);
    const [email] = emails();
    expect(email.subject).toBe('Contact form (drafted with an AI assistant) — Ana Recruiter');
    expect(email.text).toContain('I changed my mind about the wording');

    // 4. The draft is used up.
    expect((await asBrowser(`https://api.edmarbarros.com/contact?draft=${token}`)).status).toBe(
      404,
    );
  });

  it('sends nothing for a draft token when Turnstile rejects the submission', async () => {
    const { url } = await draftFrom('198.51.100.11');
    const token = new URL(url!).searchParams.get('draft')!;
    fetchMock.mockImplementation(async (input: RequestInfo | URL) =>
      String(input) === SITEVERIFY
        ? new Response('{"success":false}', { status: 200 })
        : new Response('{}', { status: 200 }),
    );
    expect((await formPost(token, { name: 'Bot' })).status).toBe(403);
    expect(emails()).toHaveLength(0);
  });

  it('applies the draft limits per caller', async () => {
    for (let i = 0; i < 5; i++) expect((await draftFrom('198.51.100.20')).isError).toBe(false);
    const blocked = await draftFrom('198.51.100.20');
    expect(blocked.isError).toBe(true);
    expect(blocked.text).toContain('try again later');
    expect((await draftFrom('198.51.100.21')).isError).toBe(false);
  });

  it('relays a rejection from the contact worker', async () => {
    const { text, isError } = await draftFrom('198.51.100.30', {
      message: 'See http://a.example and https://b.example and www.c.example please',
    });
    expect(isError).toBe(true);
    expect(text).toContain('Draft not saved: too many links (max 2)');
  });
});
