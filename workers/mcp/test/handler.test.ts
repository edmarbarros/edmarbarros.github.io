import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';
import { env, stubSite } from './fixtures';

const rpc = (body: unknown, init: RequestInit = {}) =>
  new Request('https://api.test/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
    ...init,
  });

beforeEach(() => {
  stubSite();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('/mcp endpoint', () => {
  it('answers initialize with server info and capabilities', async () => {
    const res = await worker.fetch(
      rpc({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 't', version: '0' },
        },
      }),
      env,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    const body = (await res.json()) as any;
    expect(body.result.serverInfo.name).toBe('edmarbarros-site');
    expect(body.result.capabilities.tools).toBeDefined();
    expect(body.result.capabilities.prompts).toBeDefined();
    expect(res.headers.get('mcp-session-id')).toBeNull();
  });

  it('lists tools over plain JSON without a session', async () => {
    const res = await worker.fetch(rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }), env);
    const body = (await res.json()) as any;
    expect(body.result.tools).toHaveLength(10);
  });

  it('lists the prompts over plain JSON', async () => {
    const res = await worker.fetch(rpc({ jsonrpc: '2.0', id: 5, method: 'prompts/list' }), env);
    const body = (await res.json()) as any;
    expect(body.result.prompts.map((p: any) => p.name).sort()).toEqual([
      'help',
      'overview',
      'role-fit',
      'skills-check',
    ]);
  });

  it('calls a tool end to end', async () => {
    const res = await worker.fetch(
      rpc({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'site_list_posts', arguments: {} },
      }),
      env,
    );
    const body = (await res.json()) as any;
    expect(body.result.content[0].text).toContain('Hello, world');
  });

  it('sends CORS headers, including on preflight', async () => {
    const pre = await worker.fetch(new Request('https://api.test/mcp', { method: 'OPTIONS' }), env);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-origin')).toBe('*');
    const res = await worker.fetch(rpc({ jsonrpc: '2.0', id: 4, method: 'ping' }), env);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('rejects GET with 405 and an Allow header', async () => {
    const res = await worker.fetch(new Request('https://api.test/mcp'), env);
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST, OPTIONS');
  });

  it('404s other paths', async () => {
    expect(
      (await worker.fetch(new Request('https://api.test/contact', { method: 'POST' }), env)).status,
    ).toBe(404);
  });

  it('rejects oversized bodies', async () => {
    const res = await worker.fetch(
      rpc({}, { headers: { 'content-type': 'application/json', 'content-length': '999999' } }),
      env,
    );
    expect(res.status).toBe(413);
  });

  it('enforces the cap on chunked bodies that declare no length', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(16 * 1024));
    let sent = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent++ < 8) controller.enqueue(chunk);
        else controller.close();
      },
    });
    const req = new Request('https://api.test/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(req.headers.get('content-length')).toBeNull();
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(413);
  });

  it('still accepts a normal streamed body under the cap', async () => {
    const payload = new TextEncoder().encode(
      JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'ping' }),
    );
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(payload);
        controller.close();
      },
    });
    const req = new Request('https://api.test/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect((await worker.fetch(req, env)).status).toBe(200);
  });

  it('returns a JSON-RPC parse error for malformed JSON', async () => {
    const req = new Request('https://api.test/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: '{not json',
    });
    const res = await worker.fetch(req, env);
    expect(res.status).toBe(400);
  });
});
