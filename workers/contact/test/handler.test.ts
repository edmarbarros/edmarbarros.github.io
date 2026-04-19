import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../src/index';
import type { Env } from '../src/types';

function makeEnv(kvOverride?: Partial<KVNamespace>): Env {
  const store = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kv: any = {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v);
    },
    ...(kvOverride as object),
  };
  return {
    CONTACT_LIMITS: kv as KVNamespace,
    RESEND_API_KEY: 'test-resend-key',
    TURNSTILE_SECRET: 'test-turnstile-secret',
    ALLOWED_ORIGIN: 'https://edmarbarros.com',
    TO_EMAIL: 'hello@edmarbarros.com',
    FROM_EMAIL: 'hello@edmarbarros.com',
  };
}

function makeRequest(
  body: unknown,
  { method = 'POST', ip = '10.0.0.1' }: { method?: string; ip?: string } = {},
): Request {
  return new Request('https://api.edmarbarros.com/contact', {
    method,
    headers: {
      'content-type': 'application/json',
      'cf-connecting-ip': ip,
      origin: 'https://edmarbarros.com',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function basePayload() {
  return {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello, this is a long enough message to pass the minimum length.',
    website: '',
    ts: Date.now() - 10_000,
    turnstileToken: 'x'.repeat(20),
  };
}

describe('contact handler', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
    // Default: Turnstile OK, Resend OK
    fetchSpy.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('turnstile')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      if (url.includes('resend.com')) {
        return new Response(JSON.stringify({ id: 'e1' }), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
  });

  afterEach(() => fetchSpy.mockRestore());

  it('returns 204 on a happy-path POST', async () => {
    const res = await worker.fetch(makeRequest(basePayload()), makeEnv(), {} as ExecutionContext);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://edmarbarros.com');
  });

  it('returns 204 on OPTIONS preflight', async () => {
    const res = await worker.fetch(
      makeRequest(null, { method: 'OPTIONS' }),
      makeEnv(),
      {} as ExecutionContext,
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('returns 405 on GET', async () => {
    const res = await worker.fetch(
      makeRequest(null, { method: 'GET' }),
      makeEnv(),
      {} as ExecutionContext,
    );
    expect(res.status).toBe(405);
  });

  it('returns 400 on invalid JSON', async () => {
    const req = new Request('https://api.edmarbarros.com/contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cf-connecting-ip': '1.2.3.4',
        origin: 'https://edmarbarros.com',
      },
      body: '{ not json',
    });
    const res = await worker.fetch(req, makeEnv(), {} as ExecutionContext);
    expect(res.status).toBe(400);
  });

  it('returns 400 on validation failure', async () => {
    const res = await worker.fetch(
      makeRequest({ ...basePayload(), email: 'nope' }),
      makeEnv(),
      {} as ExecutionContext,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toMatch(/email/i);
  });

  it('returns 403 when Turnstile fails', async () => {
    fetchSpy.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('turnstile')) {
        return new Response(JSON.stringify({ success: false }), { status: 200 });
      }
      return new Response('', { status: 404 });
    });
    const res = await worker.fetch(makeRequest(basePayload()), makeEnv(), {} as ExecutionContext);
    expect(res.status).toBe(403);
  });

  it('returns 429 after 5 submissions from the same IP', async () => {
    const env = makeEnv();
    for (let i = 0; i < 5; i++) {
      const r = await worker.fetch(makeRequest(basePayload()), env, {} as ExecutionContext);
      expect(r.status).toBe(204);
    }
    const r = await worker.fetch(makeRequest(basePayload()), env, {} as ExecutionContext);
    expect(r.status).toBe(429);
  });

  it('returns 502 when Resend fails', async () => {
    fetchSpy.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.includes('turnstile')) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      return new Response('err', { status: 500 });
    });
    const res = await worker.fetch(makeRequest(basePayload()), makeEnv(), {} as ExecutionContext);
    expect(res.status).toBe(502);
  });
});
