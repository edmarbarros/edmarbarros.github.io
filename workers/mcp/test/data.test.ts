import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteDataError, fetchSiteJson } from '../src/data';
import { env } from './fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchSiteJson', () => {
  it('builds the URL from SITE_URL and parses JSON', async () => {
    const f = vi.fn(async (_url: string) => new Response('{"a":1}'));
    vi.stubGlobal('fetch', f);
    await expect(fetchSiteJson(env, '/api/en/cv.json')).resolves.toEqual({ a: 1 });
    expect(f.mock.calls[0]?.[0]).toBe('https://site.test/api/en/cv.json');
  });

  it('throws SiteDataError with the status on HTTP errors', async () => {
    vi.stubGlobal('fetch', async () => new Response('nope', { status: 404 }));
    await expect(fetchSiteJson(env, '/x.json')).rejects.toMatchObject({
      name: 'SiteDataError',
      status: 404,
    });
  });

  it('throws SiteDataError on invalid JSON and network failure', async () => {
    vi.stubGlobal('fetch', async () => new Response('<html>'));
    await expect(fetchSiteJson(env, '/x.json')).rejects.toBeInstanceOf(SiteDataError);
    vi.stubGlobal('fetch', async () => {
      throw new Error('boom');
    });
    await expect(fetchSiteJson(env, '/x.json')).rejects.toThrow(/boom/);
  });

  it('serves repeat reads from the edge cache and stores with the TTL', async () => {
    const store = new Map<string, Response>();
    const cache = {
      match: async (req: Request) => store.get(req.url)?.clone(),
      put: async (req: Request, res: Response) => void store.set(req.url, res),
    };
    vi.stubGlobal('caches', { default: cache });
    const f = vi.fn(async () => new Response('{"n":1}'));
    vi.stubGlobal('fetch', f);

    await fetchSiteJson(env, '/api/en/posts.json');
    await expect(fetchSiteJson(env, '/api/en/posts.json')).resolves.toEqual({ n: 1 });
    expect(f).toHaveBeenCalledTimes(1);
    expect(store.get('https://site.test/api/en/posts.json')?.headers.get('cache-control')).toBe(
      'public, max-age=60',
    );
  });
});
