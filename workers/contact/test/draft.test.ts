import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import worker from '../src/index';
import { DRAFT_PATH, DRAFT_TTL_SECONDS, INTERNAL_HOST } from '../src/draft';
import type { Env } from '../src/types';

const SITE = 'https://edmarbarros.com';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND = 'https://api.resend.com/emails';

function makeEnv() {
  const store = new Map<string, string>();
  const ttls = new Map<string, number>();
  const kv = {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string, opts?: { expirationTtl?: number }) => {
      store.set(k, v);
      if (opts?.expirationTtl) ttls.set(k, opts.expirationTtl);
    },
    delete: async (k: string) => void store.delete(k),
  };
  const env: Env = {
    CONTACT_LIMITS: kv as unknown as KVNamespace,
    RESEND_API_KEY: 'resend-key',
    TURNSTILE_SECRET: 'turnstile-secret',
    ALLOWED_ORIGIN: SITE,
    TO_EMAIL: 'owner@example.com',
    FROM_EMAIL: 'notifications@example.com',
  };
  return { env, store, ttls };
}

const draftBody = {
  name: 'Ana Recruiter',
  email: 'ana@example.com',
  message: 'Hi Edmar, I would like to talk about a staff backend role.',
};

function createDraft(body: unknown, { ip = '203.0.113.7', method = 'POST' } = {}) {
  return new Request(`https://${INTERNAL_HOST}${DRAFT_PATH}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-client-ip': ip },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

function lookup(token: string, { origin = SITE as string | null } = {}) {
  return new Request(`https://api.edmarbarros.com/contact?draft=${token}`, {
    method: 'GET',
    headers: origin ? { origin } : {},
  });
}

function submit(body: Record<string, unknown>, ip = '198.51.100.4') {
  return new Request('https://api.edmarbarros.com/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: SITE, 'cf-connecting-ip': ip },
    body: JSON.stringify({
      name: 'Ana Recruiter',
      email: 'ana@example.com',
      message: 'I edited this message myself before sending it.',
      website: '',
      ts: Date.now() - 5_000,
      turnstileToken: 'turnstile-token-from-the-widget',
      ...body,
    }),
  });
}

let fetchMock: Mock;
let turnstileOk = true;
let resendOk = true;

beforeEach(() => {
  turnstileOk = true;
  resendOk = true;
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === SITEVERIFY)
      return new Response(JSON.stringify({ success: turnstileOk }), { status: 200 });
    if (url === RESEND) return new Response('{}', { status: resendOk ? 200 : 500 });
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const emails = () =>
  fetchMock.mock.calls
    .filter((c) => String(c[0]) === RESEND)
    .map((c) => JSON.parse((c[1] as RequestInit).body as string));

async function newDraft(env: Env, body = draftBody, ip?: string) {
  const res = await worker.fetch(createDraft(body, { ip }), env);
  expect(res.status).toBe(200);
  return ((await res.json()) as { token: string }).token;
}

describe('creating a draft through the service binding', () => {
  it('saves it for 30 minutes and sends nothing', async () => {
    const { env, store, ttls } = makeEnv();
    const res = await worker.fetch(createDraft(draftBody), env);
    expect(res.status).toBe(200);
    const { token, expires_in } = (await res.json()) as { token: string; expires_in: number };
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(expires_in).toBe(DRAFT_TTL_SECONDS);
    expect(JSON.parse(store.get(`draft:${token}`)!)).toEqual(draftBody);
    expect(ttls.get(`draft:${token}`)).toBe(1800);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gives each draft its own unguessable token', async () => {
    const { env } = makeEnv();
    const tokens = new Set([
      await newDraft(env, draftBody, '10.0.0.1'),
      await newDraft(env, draftBody, '10.0.0.2'),
    ]);
    expect(tokens.size).toBe(2);
  });

  it.each([
    ['invalid email', { ...draftBody, email: 'nope' }, 'invalid email'],
    [
      'short message',
      { ...draftBody, message: 'too short' },
      'message must be at least 10 characters',
    ],
    ['long message', { ...draftBody, message: 'x'.repeat(2001) }, 'message too long (max 2000)'],
    ['missing name', { ...draftBody, name: '' }, 'name is required'],
    [
      'too many links',
      { ...draftBody, message: 'See http://a.example and https://b.example and www.c.example now' },
      'too many links (max 2)',
    ],
  ])('rejects %s', async (_label, body, error) => {
    const { env, store } = makeEnv();
    const res = await worker.fetch(createDraft(body), env);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(
      [...store.keys()].some(
        (k) => k.startsWith('draft:') && !k.startsWith('draft:ip:') && !k.startsWith('draft:day:'),
      ),
    ).toBe(false);
  });

  it('rejects malformed JSON', async () => {
    const { env } = makeEnv();
    expect((await worker.fetch(createDraft('{not json'), env)).status).toBe(400);
  });

  it('allows 5 drafts per hour per IP, then blocks that IP only', async () => {
    const { env } = makeEnv();
    for (let i = 0; i < 5; i++)
      expect((await worker.fetch(createDraft(draftBody, { ip: '192.0.2.1' }), env)).status).toBe(
        200,
      );
    const blocked = await worker.fetch(createDraft(draftBody, { ip: '192.0.2.1' }), env);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'rate limit exceeded' });
    expect((await worker.fetch(createDraft(draftBody, { ip: '192.0.2.2' }), env)).status).toBe(200);
  });

  it('stops at 50 drafts a day overall, so the form keeps its storage', async () => {
    const { env } = makeEnv();
    for (let i = 1; i <= 50; i++) {
      expect(
        (
          await worker.fetch(
            createDraft(draftBody, { ip: `10.1.${Math.floor(i / 200)}.${i % 200}` }),
            env,
          )
        ).status,
      ).toBe(200);
    }
    const blocked = await worker.fetch(createDraft(draftBody, { ip: '10.9.9.9' }), env);
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ error: 'daily limit reached' });
  });

  it('keeps its counters apart from the form counters', async () => {
    const { env, store } = makeEnv();
    await newDraft(env);
    expect([...store.keys()].some((k) => k.startsWith('contact:'))).toBe(false);
  });
});

describe('who can reach the draft endpoint', () => {
  it('ignores the same path on the public host and still demands an allowed origin', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(
      new Request(`https://api.edmarbarros.com${DRAFT_PATH}`, {
        method: 'POST',
        body: JSON.stringify(draftBody),
      }),
      env,
    );
    expect(res.status).toBe(403);
  });

  it('does not treat other paths on the internal host as drafts', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(
      new Request(`https://${INTERNAL_HOST}/other`, {
        method: 'POST',
        body: JSON.stringify(draftBody),
      }),
      env,
    );
    expect(res.status).toBe(403);
  });

  it('only accepts POST', async () => {
    const { env } = makeEnv();
    expect((await worker.fetch(createDraft(null, { method: 'GET' }), env)).status).toBe(405);
  });
});

describe('loading a draft on the contact page', () => {
  it('returns the fields to the site origin, and does not use the draft up', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    for (let i = 0; i < 2; i++) {
      const res = await worker.fetch(lookup(token), env);
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBe(SITE);
      expect(await res.json()).toEqual(draftBody);
    }
  });

  it('says not found for unknown, expired and malformed tokens', async () => {
    const { env } = makeEnv();
    for (const token of ['A'.repeat(22), 'short', 'x'.repeat(40), '../etc']) {
      const res = await worker.fetch(lookup(token), env);
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'draft not found or expired' });
    }
  });

  it('refuses an origin that is not the site', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    expect(
      (await worker.fetch(lookup(token, { origin: 'https://evil.example' }), env)).status,
    ).toBe(403);
    expect((await worker.fetch(lookup(token, { origin: null }), env)).status).toBe(403);
  });

  it('still answers 405 for a GET without a draft', async () => {
    const { env } = makeEnv();
    const res = await worker.fetch(
      new Request('https://api.edmarbarros.com/contact', { headers: { origin: SITE } }),
      env,
    );
    expect(res.status).toBe(405);
  });
});

describe('sending from the form with a draft', () => {
  it('requires Turnstile exactly as before', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    turnstileOk = false;
    const res = await worker.fetch(submit({ draft: token }), env);
    expect(res.status).toBe(403);
    expect(emails()).toHaveLength(0);
    // The draft survives, so the person can try again.
    expect((await worker.fetch(lookup(token), env)).status).toBe(200);
  });

  it('labels the email, uses the form fields, and uses the draft up', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    const res = await worker.fetch(submit({ draft: token }), env);
    expect(res.status).toBe(204);

    const [email] = emails();
    expect(email.subject).toBe('Contact form (drafted with an AI assistant) — Ana Recruiter');
    expect(email.text).toContain('I edited this message myself before sending it.');
    expect(email.text).not.toContain('staff backend role');
    expect(email.text).toContain('Drafted with an AI assistant');
    expect(email.reply_to).toBe('ana@example.com');

    expect((await worker.fetch(lookup(token), env)).status).toBe(404);
  });

  it('works once per draft: a second send is a plain form message', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    await worker.fetch(submit({ draft: token }), env);
    await worker.fetch(submit({ draft: token }, '198.51.100.5'), env);
    expect(emails().map((e) => e.subject)).toEqual([
      'Contact form (drafted with an AI assistant) — Ana Recruiter',
      'Contact form — Ana Recruiter',
    ]);
  });

  it('keeps the draft when the email fails to send', async () => {
    const { env } = makeEnv();
    const token = await newDraft(env);
    resendOk = false;
    expect((await worker.fetch(submit({ draft: token }), env)).status).toBe(502);
    expect((await worker.fetch(lookup(token), env)).status).toBe(200);
  });

  it('treats an unknown or malformed token as a normal form message', async () => {
    const { env } = makeEnv();
    for (const draft of ['A'.repeat(22), 'bad', 12345, null]) {
      expect(
        (
          await worker.fetch(
            submit({ draft }, `198.51.100.${Math.floor(Math.random() * 200)}`),
            env,
          )
        ).status,
      ).toBe(204);
    }
    expect(emails().every((e) => e.subject === 'Contact form — Ana Recruiter')).toBe(true);
  });

  it('is unchanged for a normal form message', async () => {
    const { env } = makeEnv();
    expect((await worker.fetch(submit({}), env)).status).toBe(204);
    expect(emails()[0].subject).toBe('Contact form — Ana Recruiter');
    expect(emails()[0].text).not.toContain('Drafted with an AI assistant');
  });
});
