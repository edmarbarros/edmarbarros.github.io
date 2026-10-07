import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server';
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
  it('exposes eleven tools with the site_ prefix, ten of them read-only', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        'site_get_cv',
        'site_help',
        'site_get_post',
        'site_get_profile',
        'site_get_project',
        'site_list_posts',
        'site_list_projects',
        'site_list_skills',
        'site_get_skill',
        'site_search',
        'site_draft_message',
      ].sort(),
    );
    for (const t of tools.filter((t) => t.name !== 'site_draft_message')) {
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
    expect(text).toContain('May 2026 - Oct 2026');
    expect(text).toContain('## Skills');
  });
  it('says who backed each company', async () => {
    const { text } = await call('site_get_cv', { sections: ['experience'] });
    expect(text).toContain('Backed by Accel, Y Combinator (YC W22).');
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
  it('finds posts, projects, skills and CV experience', async () => {
    const { data } = await call('site_search', { query: 'kafka' });
    const types = new Set(data.hits.map((h: any) => h.type));
    expect(types).toEqual(new Set(['post', 'project', 'skill']));
    const cv = await call('site_search', { query: 'stripe subscription' });
    expect(cv.data.hits[0].type).toBe('experience');
  });
  it('finds skills by alias and by proof text', async () => {
    const byAlias = await call('site_search', { query: 'relational databases' });
    expect(byAlias.data.hits[0].type).toBe('skill');
    expect(byAlias.data.hits[0].title).toBe('SQL');
    const byProof = await call('site_search', { query: 'onboarding 2 weeks' });
    expect(byProof.data.hits.some((h: any) => h.type === 'skill')).toBe(true);
  });
  it('finds the companies a backer supported, by short label or full name', async () => {
    for (const query of ['yc', 'combinator', 'accel']) {
      const { data } = await call('site_search', { query });
      const hit = data.hits.find((h: any) => h.type === 'experience');
      expect(hit, query).toBeDefined();
      expect(hit.snippet, query).toContain('Backed by Accel, Y Combinator (YC W22).');
    }
  });
  it('reports no results helpfully', async () => {
    const { text, isError } = await call('site_search', { query: 'zzzzzz' });
    expect(isError).toBe(false);
    expect(text).toContain('No results');
  });
});

describe('site_list_skills', () => {
  it('groups skills and shows experience and proof counts', async () => {
    const { text, data } = await call('site_list_skills');
    expect(text).toContain('## Data & databases');
    expect(text).toContain(
      '**SQL** [sql]: Extensive evidence; about 7.7 years across 6 roles, January 2019 - October 2026; 2 achievements',
    );
    expect(text).toContain('level: Strong');
    expect(text).toContain('listed on the CV, no role or achievement attached yet');
    expect(data.count).toBe(6);
  });
  it('filters by group', async () => {
    const { text } = await call('site_list_skills', { group: 'cloud' });
    expect(text).toContain('Kubernetes');
    expect(text).not.toContain('SQL');
  });
  it('serves Portuguese', async () => {
    const { text } = await call('site_list_skills', { lang: 'pt' });
    expect(text).toContain('## Dados & bancos de dados');
    expect(text).toContain('cerca de 7,7 anos em 6 cargos');
    expect(text).toContain('1 conquista');
  });
});

describe('site_get_skill', () => {
  it('returns the evidence for SQL without inventing a level', async () => {
    const { text } = await call('site_get_skill', { name: 'SQL' });
    expect(text).toContain('# SQL');
    expect(text).toContain('Level: not stated');
    expect(text).toContain(
      'Experience: about 7.7 years across 6 roles, January 2019 - October 2026.',
    );
    expect(text).toContain('- Citruslabs, Senior Software Engineer, Jan 2019 - Sep 2021 (MySQL)');
    expect(text).toContain('- Redesigned the MySQL data model');
    expect(text).toContain('A lower bound.');
  });
  it('shows the evidence label, and no role context when there is proof', async () => {
    const { text } = await call('site_get_skill', { name: 'SQL' });
    expect(text).toContain('Evidence: Extensive evidence.');
    expect(text).not.toContain('same roles');
  });
  it('shows labelled role achievements when no achievement is tied to the skill', async () => {
    const { text } = await call('site_get_skill', { name: 'postgres' });
    expect(text).toContain('Evidence: Extensive evidence.');
    expect(text).toContain(
      'Headline achievements from the same roles. They are not specific to this skill.',
    );
    expect(text).toContain('- Quander: Opened self-serve revenue; Launched a new ad channel');
    expect(text).not.toContain('Proof:');
  });
  it('resolves aliases and shows a stated level', async () => {
    expect((await call('site_get_skill', { name: 'Postgres' })).text).toContain('# PostgreSQL');
    const k8s = await call('site_get_skill', { name: 'k8s' });
    expect(k8s.text).toContain('# Kubernetes');
    expect(k8s.text).toContain('Level: Strong');
  });
  it('says so when a skill has no evidence attached', async () => {
    const { text, isError } = await call('site_get_skill', { name: 'java' });
    expect(isError).toBe(false);
    expect(text).toContain('Experience: none attached yet');
    expect(text).toContain('Evidence: No evidence attached yet.');
  });
  it('explains skills proven by achievements rather than a tech list', async () => {
    const { text } = await call('site_get_skill', { name: 'system design' });
    expect(text).toContain('# Backend architecture');
    expect(text).toContain('shown through the achievements below');
  });
  it('asks to be more specific when a word matches several skills', async () => {
    const { text, isError } = await call('site_get_skill', { name: 'containers' });
    expect(isError).toBe(true);
    expect(text).toContain('Docker [docker]');
    expect(text).toContain('Kubernetes [kubernetes]');
  });
  it('lists the available skills on a miss', async () => {
    const { text, isError } = await call('site_get_skill', { name: 'cobol' });
    expect(isError).toBe(true);
    expect(text).toContain('Available skills: SQL, PostgreSQL');
  });
  it('serves Portuguese', async () => {
    const { text } = await call('site_get_skill', { name: 'sql', lang: 'pt' });
    expect(text).toContain(
      'Experiência: cerca de 7,7 anos em 6 cargos, janeiro 2019 - outubro 2026.',
    );
    expect(text).toContain('Usado em:');
    expect(text).toContain('Evidências:');
    expect(text).toContain('Nível: não informado');
    expect(text).toContain('Evidência: Evidência extensa.');
  });
});

describe('language validation', () => {
  it.each(['en-EN', 'pt-BR', 'fr', ''])('rejects the unsupported language %j', async (bad) => {
    const res = await client
      .callTool({ name: 'site_list_posts', arguments: { lang: bad } })
      .catch((e) => e);
    expect(res instanceof Error || (res as { isError?: boolean }).isError).toBe(true);
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
