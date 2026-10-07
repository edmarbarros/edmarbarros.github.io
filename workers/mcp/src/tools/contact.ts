import { z } from 'zod';
import { LANGUAGES } from '../languages';
import type { Env } from '../types';
import { fail, ok, type ToolDeps, type ToolResult, langField } from './shared';

/** The contact worker answers this host only when called through the service binding. */
export const CONTACT_URL = 'https://agent.internal/draft';

// Input ---------------------------------------------------------------------

const draftMessageInput = {
  name: z
    .string()
    .min(1)
    .max(200)
    .describe("The sender's real name, as the user gave it. Never invent one."),
  email: z
    .string()
    .email()
    .max(254)
    .describe("The sender's email address, as the user gave it. Edmar replies here."),
  message: z
    .string()
    .min(10)
    .max(2000)
    .describe("The message, in the user's own words. At most 2 links."),
  lang: langField,
};

// Results -------------------------------------------------------------------------

const contactPage = (env: Env, lang: string) =>
  new URL(lang === LANGUAGES.PT ? '/pt/contact' : '/contact', env.SITE_URL);

const unavailable = (env: Env, lang: string): ToolResult =>
  fail(
    `A draft can't be saved right now. Ask the user to write on the contact page instead: ${contactPage(env, lang).href}`,
  );

/** The caller's address, for the contact worker's rate limits. */
function clientIp(headers: Record<string, string | string[] | undefined> | undefined): string {
  const value = headers?.['cf-connecting-ip'];
  return (Array.isArray(value) ? value[0] : value) ?? 'unknown';
}

// Tools -----------------------------------------------------------------------

export function registerContactTools({ server, env }: ToolDeps): void {
  server.registerTool(
    'site_draft_message',
    {
      title: 'Draft a message to Edmar',
      description:
        "Drafts a message to Edmar for the person you are talking to. It sends nothing. It returns a link: show the user the message and the link, and tell them to open it, review the message, complete the check and press Send themselves. Ask for their name and email if you don't have them, use their own words, and never invent a name or email. A draft works once and expires in 30 minutes.",
      inputSchema: draftMessageInput,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ name, email, message, lang }, extra) => {
      if (!env.CONTACT) return unavailable(env, lang);

      let res: Response;
      try {
        res = await env.CONTACT.fetch(CONTACT_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-client-ip': clientIp(extra.requestInfo?.headers),
          },
          body: JSON.stringify({ name, email, message }),
        });
      } catch {
        return unavailable(env, lang);
      }

      if (res.ok) {
        const { token, expires_in } = (await res.json()) as { token: string; expires_in: number };
        const link = contactPage(env, lang);
        link.searchParams.set('draft', token);
        const minutes = Math.round(expires_in / 60);
        return ok(
          `Draft saved. Nothing has been sent. Ask the user to open ${link.href}, review the message, complete the check and press Send. The link works once and expires in ${minutes} minutes.`,
          { drafted: true, url: link.href, expires_in_minutes: minutes },
        );
      }
      if (res.status === 400) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        return fail(
          `Draft not saved: ${error ?? 'the message was not accepted'}. Fix it and try again.`,
        );
      }
      if (res.status === 429) {
        return fail(
          `Too many drafts right now. Ask the user to try again later, or to write on the contact page: ${contactPage(env, lang).href}`,
        );
      }
      return unavailable(env, lang);
    },
  );
}
