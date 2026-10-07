import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { registerTools } from './tools';
import type { Env } from './types';

const MAX_BODY_BYTES = 64 * 1024;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, DELETE, OPTIONS',
  'access-control-allow-headers':
    'content-type, accept, authorization, mcp-session-id, mcp-protocol-version, last-event-id',
  'access-control-expose-headers': 'mcp-session-id',
  'access-control-max-age': '86400',
} as const;

function withCors(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
  headers: HeadersInit = {},
): Response {
  return withCors(
    new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    }),
  );
}

/** Read a request body, giving up (null) as soon as it exceeds `max` bytes. */
async function readLimited(request: Request, max: number): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export function createServer(env: Env, ctx?: ExecutionContext): McpServer {
  const server = new McpServer(
    { name: 'edmarbarros-site', version: '0.1.0' },
    {
      instructions:
        "Read-only access to Edmar Barros's personal site: CV, blog posts and project write-ups, in English and Brazilian Portuguese. Call site_get_profile first for an overview, site_get_skill to check the evidence behind a specific technology or skill, or site_search to find something specific.",
    },
  );
  registerTools(server, env, ctx);
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== '/mcp' && pathname !== '/mcp/') {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));

    // Stateless JSON mode: no SSE stream (GET) and no sessions to terminate (DELETE).
    if (request.method !== 'POST') {
      return jsonRpcError(
        405,
        -32000,
        'Method not allowed. POST JSON-RPC requests to this endpoint.',
        {
          allow: 'POST, OPTIONS',
        },
      );
    }

    // Cheap early exit when the client declares an oversized body...
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > MAX_BODY_BYTES) {
      return jsonRpcError(413, -32000, `Request body too large (max ${MAX_BODY_BYTES} bytes).`);
    }
    // ...but the header can be absent (chunked) or wrong, so enforce the cap while reading.
    const body = await readLimited(request, MAX_BODY_BYTES);
    if (body === null) {
      return jsonRpcError(413, -32000, `Request body too large (max ${MAX_BODY_BYTES} bytes).`);
    }
    request = new Request(request.url, { method: 'POST', headers: request.headers, body });

    // A fresh server and transport per request keeps the worker stateless.
    const server = createServer(env, ctx);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return withCors(await transport.handleRequest(request));
  },
};
