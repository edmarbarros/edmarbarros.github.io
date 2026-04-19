import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstile } from '../src/turnstile';

describe('verifyTurnstile', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fetchSpy: ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('returns true on Cloudflare success', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const ok = await verifyTurnstile({ secret: 's', token: 't', remoteIp: '1.1.1.1' });
    expect(ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns false on Cloudflare failure', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, 'error-codes': ['bad'] }), { status: 200 }),
    );
    const ok = await verifyTurnstile({ secret: 's', token: 't', remoteIp: '1.1.1.1' });
    expect(ok).toBe(false);
  });

  it('returns false on non-200 response', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('err', { status: 500 }));
    const ok = await verifyTurnstile({ secret: 's', token: 't', remoteIp: '1.1.1.1' });
    expect(ok).toBe(false);
  });

  it('returns false on thrown fetch error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network'));
    const ok = await verifyTurnstile({ secret: 's', token: 't', remoteIp: '1.1.1.1' });
    expect(ok).toBe(false);
  });
});
