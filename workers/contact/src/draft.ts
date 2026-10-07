import { z } from 'zod';
import { corsHeaders } from './cors';
import { checkLimit } from './rate-limit';
import type { Env } from './types';

/**
 * Drafts written by an AI assistant, to be reviewed and sent by a person.
 *
 * Nothing here sends email. The assistant saves a draft and gets a token. The person opens
 * the contact page with that token, edits the fields, passes Turnstile and submits the normal
 * form. A bot can create drafts, but only a human who passes Turnstile can turn one into email.
 *
 * Creating a draft is reachable only through a Cloudflare service binding: no public route maps
 * to it, and the host name below exists only inside that binding.
 */
export const INTERNAL_HOST = 'agent.internal';
export const DRAFT_PATH = '/draft';

export const DRAFT_TTL_SECONDS = 30 * 60;
const MAX_PER_HOUR_PER_IP = 5;
const MAX_PER_DAY_TOTAL = 50;
const HOUR = 60 * 60;
const DAY = 24 * HOUR;
const MAX_LINKS = 2;

/** 16 random bytes as base64url: 22 characters. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

const draftSchema = z.object({
  name: z.string().min(1, 'name is required').max(200, 'name too long'),
  email: z.string().email('invalid email').max(254, 'email too long'),
  message: z
    .string()
    .min(10, 'message must be at least 10 characters')
    .max(2000, 'message too long (max 2000)'),
});

export type Draft = z.infer<typeof draftSchema>;

const json = (data: unknown, status: number, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const storageKey = (token: string) => `draft:${token}`;

export const isDraftToken = (value: unknown): value is string =>
  typeof value === 'string' && TOKEN_PATTERN.test(value);

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const countLinks = (text: string) => (text.match(/https?:\/\/|www\./gi) ?? []).length;

/** True only for requests that came through the service binding. */
export function isCreateDraftRequest(request: Request): boolean {
  const url = new URL(request.url);
  return url.hostname === INTERNAL_HOST && url.pathname === DRAFT_PATH;
}

/** Save a draft and return its token. Called by the MCP worker. */
export async function handleCreateDraft(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }

  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: parsed.error.issues[0]?.message ?? 'invalid payload' }, 400);
  }
  if (countLinks(parsed.data.message) > MAX_LINKS) {
    return json({ error: `too many links (max ${MAX_LINKS})` }, 400);
  }

  // The MCP worker passes the caller's address along, since the binding hides it.
  const ip = request.headers.get('x-client-ip') ?? 'unknown';
  const perIp = await checkLimit(env.CONTACT_LIMITS, `draft:ip:${ip}`, MAX_PER_HOUR_PER_IP, HOUR);
  if (!perIp.allowed) return json({ error: 'rate limit exceeded' }, 429);

  // A global cap keeps drafts from using up the key-value store the form also relies on.
  const today = new Date().toISOString().slice(0, 10);
  const total = await checkLimit(env.CONTACT_LIMITS, `draft:day:${today}`, MAX_PER_DAY_TOTAL, DAY);
  if (!total.allowed) return json({ error: 'daily limit reached' }, 429);

  const token = newToken();
  await env.CONTACT_LIMITS.put(storageKey(token), JSON.stringify(parsed.data), {
    expirationTtl: DRAFT_TTL_SECONDS,
  });
  return json({ token, expires_in: DRAFT_TTL_SECONDS }, 200);
}

async function readDraft(env: Env, token: string): Promise<Draft | null> {
  const raw = await env.CONTACT_LIMITS.get(storageKey(token));
  if (!raw) return null;
  const parsed = draftSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

/** The contact page loads a draft by token. Reading it does not use it up. */
export async function handleLookupDraft(
  token: string,
  env: Env,
  origin: string,
): Promise<Response> {
  const draft = isDraftToken(token) ? await readDraft(env, token) : null;
  return draft
    ? json(draft, 200, corsHeaders(origin))
    : json({ error: 'draft not found or expired' }, 404, corsHeaders(origin));
}

/** True when the token names a live draft, so the email can say it was drafted by an assistant. */
export async function draftExists(env: Env, token: string): Promise<boolean> {
  return (await readDraft(env, token)) !== null;
}

/** A draft works once. Called after the email is sent. */
export async function deleteDraft(env: Env, token: string): Promise<void> {
  await env.CONTACT_LIMITS.delete(storageKey(token));
}

/** The draft token a submission carries, if it is well formed. */
export function readDraftToken(body: unknown): string | undefined {
  const value = (body as { draft?: unknown } | null)?.draft;
  return isDraftToken(value) ? value : undefined;
}
