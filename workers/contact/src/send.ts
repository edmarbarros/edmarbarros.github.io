import type { ContactPayload } from './types';

export interface SendParams {
  apiKey: string;
  from: string;
  to: string;
  payload: ContactPayload;
  ip?: string;
}

export async function sendEmail({ apiKey, from, to, payload, ip }: SendParams): Promise<boolean> {
  const subject = `Contact form — ${payload.name}`;
  const body =
    `New message from ${payload.name} <${payload.email}>\n\n` +
    `${payload.message}\n\n` +
    `---\n` +
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
