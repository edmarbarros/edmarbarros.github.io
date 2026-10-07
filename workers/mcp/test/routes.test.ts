import { describe, expect, it } from 'vitest';
import wranglerToml from '../wrangler.toml?raw';

/**
 * Cloudflare matches a route pattern against the whole URL, query string included, and a pattern
 * cannot contain a query. Without a trailing wildcard, a URL such as /contact?draft=... never
 * reaches the worker: the request times out with a 522 at the zone's origin.
 * Unit tests call the worker directly, so only a check on the config can catch this.
 * See https://developers.cloudflare.com/workers/configuration/routing/routes/
 */
const patterns = [...wranglerToml.matchAll(/^\s*pattern\s*=\s*"([^"]+)"/gm)].map((m) => m[1]!);

describe('wrangler routes', () => {
  it('declares at least one route', () => {
    expect(patterns.length).toBeGreaterThan(0);
  });

  it.each(patterns)('%s ends with a wildcard so URLs with a query string reach the worker', (p) => {
    expect(p.endsWith('*')).toBe(true);
  });
});
