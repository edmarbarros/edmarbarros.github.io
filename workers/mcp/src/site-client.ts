import type { Env } from './types';

export class SiteDataError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'SiteDataError';
  }
}

/** The Workers edge cache, when present (absent in plain Node tests). */
function edgeCache(): Cache | undefined {
  return (globalThis as { caches?: { default?: Cache } }).caches?.default;
}

/**
 * Fetch a JSON file from the static site export, through the edge cache.
 * A site deploy is picked up within CACHE_TTL seconds, without redeploying the worker.
 */
export async function fetchSiteJson<T>(env: Env, path: string, ctx?: ExecutionContext): Promise<T> {
  const url = new URL(path, env.SITE_URL).href;
  const cache = edgeCache();
  const cacheKey = new Request(url);

  const hit = await cache?.match(cacheKey);
  if (hit) return (await hit.json()) as T;

  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (err) {
    throw new SiteDataError(`Could not reach ${url}: ${(err as Error).message}`);
  }
  if (!res.ok) throw new SiteDataError(`${url} returned HTTP ${res.status}`, res.status);

  const text = await res.text();
  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new SiteDataError(`${url} did not return valid JSON`);
  }

  if (cache) {
    const ttl = Number(env.CACHE_TTL ?? '300');
    const put = cache.put(
      cacheKey,
      new Response(text, {
        headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${ttl}` },
      }),
    );
    if (ctx) ctx.waitUntil(put);
    else await put;
  }
  return data;
}
