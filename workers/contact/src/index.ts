import type { Env } from './types';
import { validateContact } from './validate';
import { verifyTurnstile } from './turnstile';
import { checkRateLimit } from './rate-limit';
import { sendEmail } from './send';
import { corsHeaders, preflight, pickAllowedOrigin } from './cors';
import {
  deleteDraft,
  draftExists,
  handleCreateDraft,
  handleLookupDraft,
  isCreateDraftRequest,
  readDraftToken,
} from './draft';

function json(data: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx?: ExecutionContext): Promise<Response> {
    // Drafts from an assistant arrive through the service binding, never from a browser.
    if (isCreateDraftRequest(request)) return handleCreateDraft(request, env);

    const requestOrigin = request.headers.get('origin');
    const origin = pickAllowedOrigin(requestOrigin, env.ALLOWED_ORIGIN);
    if (!origin) {
      return new Response('Origin not allowed', { status: 403 });
    }

    if (request.method === 'OPTIONS') return preflight(origin);

    // The contact page loads an assistant's draft by token.
    if (request.method === 'GET') {
      const token = new URL(request.url).searchParams.get('draft');
      if (token) return handleLookupDraft(token, env, origin);
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST, OPTIONS', ...corsHeaders(origin) },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid json body' }, 400, origin);
    }

    const validation = validateContact(body, Date.now());
    if (!validation.ok) {
      return json({ error: validation.error }, 400, origin);
    }
    const payload = validation.value;

    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';

    const rl = await checkRateLimit(env.CONTACT_LIMITS, ip);
    if (!rl.allowed) {
      return json({ error: 'rate limit exceeded' }, 429, origin);
    }

    const turnstileOk = await verifyTurnstile({
      secret: env.TURNSTILE_SECRET,
      token: payload.turnstileToken,
      remoteIp: ip,
    });
    if (!turnstileOk) {
      return json({ error: 'turnstile verification failed' }, 403, origin);
    }

    // A draft only changes the label on the email. The fields come from the form, as always.
    const draftToken = readDraftToken(body);
    const drafted = draftToken ? await draftExists(env, draftToken) : false;

    const sent = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.FROM_EMAIL,
      to: env.TO_EMAIL,
      payload,
      ip,
      via: drafted ? 'assistant-draft' : 'form',
    });
    if (!sent) {
      return json({ error: 'mail delivery failed' }, 502, origin);
    }
    if (drafted && draftToken) await deleteDraft(env, draftToken);

    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};
