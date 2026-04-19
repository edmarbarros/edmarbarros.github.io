import { describe, it, expect } from 'vitest';
import { validateContact } from '../src/validate';

const basePayload = () => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hi Edmar, I enjoyed your post on Kafka event boundaries.',
  website: '',
  ts: Date.now() - 5_000,
  turnstileToken: 'x'.repeat(20),
});

describe('validateContact', () => {
  it('accepts a well-formed payload', () => {
    const r = validateContact(basePayload(), Date.now());
    expect(r.ok).toBe(true);
  });

  it('rejects missing name', () => {
    const r = validateContact({ ...basePayload(), name: '' }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/name/i);
  });

  it('rejects invalid email', () => {
    const r = validateContact({ ...basePayload(), email: 'not-an-email' }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/email/i);
  });

  it('rejects too-short message', () => {
    const r = validateContact({ ...basePayload(), message: 'hi' }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/message/i);
  });

  it('rejects too-long message', () => {
    const r = validateContact({ ...basePayload(), message: 'x'.repeat(5001) }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/message/i);
  });

  it('rejects filled honeypot', () => {
    const r = validateContact({ ...basePayload(), website: 'https://spam.example' }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/honeypot|spam/i);
  });

  it('rejects ts younger than 2s', () => {
    const now = Date.now();
    const r = validateContact({ ...basePayload(), ts: now - 1_000 }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/too fast|timestamp/i);
  });

  it('rejects ts older than 30 minutes', () => {
    const now = Date.now();
    const r = validateContact({ ...basePayload(), ts: now - 31 * 60_000 }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/expired|timestamp/i);
  });

  it('rejects short turnstile token', () => {
    const r = validateContact({ ...basePayload(), turnstileToken: 'abc' }, Date.now());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/turnstile/i);
  });
});
