import { z } from 'zod';
import type { ContactPayload } from './types';

const MIN_TS_AGE_MS = 2_000;
const MAX_TS_AGE_MS = 30 * 60_000;

const schema = z.object({
  name: z.string().min(1, 'name is required').max(200, 'name too long'),
  email: z.string().email('invalid email').max(254, 'email too long'),
  message: z
    .string()
    .min(10, 'message must be at least 10 characters')
    .max(5000, 'message too long (max 5000)'),
  website: z.literal('', { errorMap: () => ({ message: 'honeypot triggered' }) }),
  ts: z.number().int().positive(),
  turnstileToken: z.string().min(10, 'turnstile token missing or invalid'),
});

export type ValidationResult =
  | { ok: true; value: ContactPayload }
  | { ok: false; error: string };

export function validateContact(raw: unknown, now: number): ValidationResult {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'invalid payload' };
  }
  const payload = parsed.data;
  const age = now - payload.ts;
  if (age < MIN_TS_AGE_MS) return { ok: false, error: 'submitted too fast (timestamp)' };
  if (age > MAX_TS_AGE_MS) return { ok: false, error: 'form expired (timestamp)' };
  return { ok: true, value: payload };
}
