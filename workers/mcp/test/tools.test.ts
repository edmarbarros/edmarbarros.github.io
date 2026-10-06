import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/index';
import { env, routes, stubSite } from './fixtures';

let client: Client;

async function connect() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createServer(env).connect(b);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(a);
}

async function call(name: string, args: Record<string, unknown> = {}) {
  const res = await client.callTool({ name, arguments: args });
  const text = (res.content as { text: string }[])[0]?.text ?? '';
  return {
    text,
    isError: res.isError === true,
    data: res.structuredContent as Record<string, any>,
  };
}

beforeEach(async () => {
  stubSite();
  await connect();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tool catalogue', () => {
  it('exposes seven read-only tools with the site_ prefix', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      'site_get_cv',
      'site_get_post',
      'site_get_profile',
      'site_get_project',
      'site_list_posts',
      'site_list_projects',
      'site_search',
    ]);
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.description?.length).toBeGreaterThan(20);
    }
  });
});

describe('site_get_profile', () => {
  it('returns identity, links and a tool pointer', async () => {
    const { text, data } = await call('site_get_profile');
    expect(text).toContain('Edmar Barros');
    expect(data.links.website).toBe('https://site.test/');
    expect(data.latest_company).toBe('Quander');
  });
});

describe('site_get_cv', () => {
  it('returns everything by default', async () => {
    const { text } = await call('site_get_cv');
    expect(text).toContain('## Experience');
    expect(text).toContain('May 2026 – Oct 2026');
    expect(text).toContain('## Skills');
  });
  it('returns only requested sections', async () => {
    const { text } = await call('site_get_cv', { sections: ['skills'] });
    expect(text).toContain('PostgreSQL, Redis');
    expect(text).not.toContain('## Experience');
  });
});

describe('site_list_posts', () => {
  it('lists posts with paging metadata', async () => {
    const { text, data } = await call('site_list_posts', { limit: 1 });
    expect(text).toContain('Hello, world');
    expect(data).toMatchObject({ total: 2, count: 1, has_more: true, next_offset: 1 });
  });
  it('filters by tag case-insensitively', async () => {
    const { data } = await call('site_list_posts', { tag: 'KAFKA' });
    expect(data.items.map((p: any) => p.slug)).toEqual(['kafka-notes']);
  });
  it('explains an unknown tag with the available ones', async () => {
    const { text, isError } = await call('site_list_posts', { tag: 'nope' });
    expect(isError).toBe(false);
    expect(text).toContain('Available tags: infra, kafka, meta');
  });
  it('serves Portuguese', async () => {
    const { data } = await call('site_list_posts', { lang: 'pt' });
    expect(data.items[0].slug).toBe('ola-mundo');
  });
});

describe('site_get_post', () => {
  it('returns the markdown body', async () => {
    const { text } = await call('site_get_post', { slug: 'kafka-notes' });
    expect(text).toContain('# Kafka notes');
    expect(text).toContain('consumer groups');
  });
  it('lists valid slugs when the post does not exist', async () => {
    const { text, isError } = await call('site_get_post', { slug: 'missing' });
    expect(isError).toBe(true);
    expect(text).toContain('hello-world, kafka-notes');
  });
  it('rejects path-like slugs', async () => {
    const res = await client
      .callTool({ name: 'site_get_post', arguments: { slug: '../cv' } })
      .catch((e) => e);
    expect(res instanceof Error || (res as any).isError).toBe(true);
  });
});

describe('projects', () => {
  it('lists and filters by kind', async () => {
    const { data } = await call('site_list_projects', { kind: 'side' });
    expect(data.items.map((p: any) => p.slug)).toEqual(['brew-controller']);
  });
  it('gets one project by slug', async () => {
    const { text } = await call('site_get_project', { slug: 'vendoo-staff' });
    expect(text).toContain('Migrated a monolith');
  });
  it('lists valid projects on a miss', async () => {
    const { text, isError } = await call('site_get_project', { slug: 'x' });
    expect(isError).toBe(true);
    expect(text).toContain('work/vendoo-staff, side/brew-controller');
  });
  it('handles a locale with no projects', async () => {
    const { text } = await call('site_list_projects', { lang: 'pt' });
    expect(text).toBe('No projects found.');
  });
});

describe('site_search', () => {
  it('finds posts, projects and CV experience', async () => {
    const { data } = await call('site_search', { query: 'kafka' });
    const types = new Set(data.hits.map((h: any) => h.type));
    expect(types).toEqual(new Set(['post', 'project']));
    const cv = await call('site_search', { query: 'stripe subscription' });
    expect(cv.data.hits[0].type).toBe('experience');
  });
  it('reports no results helpfully', async () => {
    const { text, isError } = await call('site_search', { query: 'zzzzzz' });
    expect(isError).toBe(false);
    expect(text).toContain('No results');
  });
});

describe('upstream failure', () => {
  it('returns a tool error, not a protocol error', async () => {
    vi.stubGlobal('fetch', async () => new Response('down', { status: 503 }));
    const { text, isError } = await call('site_get_cv', { lang: 'pt' });
    expect(isError).toBe(true);
    expect(text).toContain('temporarily unavailable');
  });
  it('is not masked when routes are missing', async () => {
    const table = routes();
    delete table['/api/en/cv.json'];
    stubSite(table);
    const { isError } = await call('site_get_profile');
    expect(isError).toBe(true);
  });
});
