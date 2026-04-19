import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../src/rate-limit';

function fakeKV(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    store,
  };
}

describe('checkRateLimit', () => {
  it('allows first 5 submissions per IP', async () => {
    const kv = fakeKV();
    for (let i = 0; i < 5; i++) {
      const res = await checkRateLimit(kv as any, '1.2.3.4');
      expect(res.allowed).toBe(true);
    }
  });

  it('blocks the 6th submission per IP', async () => {
    const kv = fakeKV();
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(kv as any, '1.2.3.4');
    }
    const blocked = await checkRateLimit(kv as any, '1.2.3.4');
    expect(blocked.allowed).toBe(false);
  });

  it('isolates counters per IP', async () => {
    const kv = fakeKV();
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(kv as any, '1.2.3.4');
    }
    const other = await checkRateLimit(kv as any, '5.6.7.8');
    expect(other.allowed).toBe(true);
  });

  it('stores the counter under a namespaced key', async () => {
    const kv = fakeKV();
    await checkRateLimit(kv as any, '1.2.3.4');
    const keys = [...kv.store.keys()];
    expect(keys).toContainEqual(expect.stringMatching(/^contact:1\.2\.3\.4$/));
  });
});
