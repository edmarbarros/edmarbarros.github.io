import type { ContactPayload } from './types';

export interface SendParams {
  apiKey: string;
  from: string;
  to: string;
  payload: ContactPayload;
  ip?: string;
  /** How it was written. A draft written by an assistant is labelled, but a person sent it. */
  via?: 'form' | 'assistant-draft';
}

export async function sendEmail({
  apiKey,
  from,
  to,
  payload,
  ip,
  via = 'form',
}: SendParams): Promise<boolean> {
  const drafted = via === 'assistant-draft';
  const subject = drafted
    ? `Contact form (drafted with an AI assistant) — ${payload.name}`
    : `Contact form — ${payload.name}`;
  const body =
    `New message from ${payload.name} <${payload.email}>\n\n` +
    `${payload.message}\n\n` +
    `---\n` +
    (drafted
      ? `Drafted with an AI assistant, then reviewed and sent by the person after passing the Turnstile check.\n`
      : '') +
    `IP: ${ip ?? 'n/a'}\n` +
    `Client timestamp: ${new Date(payload.ts).toISOString()}\n`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: body,
      reply_to: payload.email,
    }),
  });
  return res.ok;
}
