import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { JSON_RPC_SERVER_ERROR, MAX_BODY_BYTES, jsonRpcError, readLimited, withCors } from './http';
import { createServer } from './server';
import type { Env } from './types';

const MCP_PATH = '/mcp';

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname !== MCP_PATH && pathname !== `${MCP_PATH}/`) {
      return new Response('Not Found', { status: 404 });
    }

    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));

    // Stateless JSON mode: no SSE stream (GET) and no sessions to terminate (DELETE).
    if (request.method !== 'POST') {
      return jsonRpcError(
        405,
        JSON_RPC_SERVER_ERROR,
        'Method not allowed. POST JSON-RPC requests to this endpoint.',
        {
          allow: 'POST, OPTIONS',
        },
      );
    }

    // Cheap early exit when the client declares an oversized body...
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > MAX_BODY_BYTES) {
      return jsonRpcError(
        413,
        JSON_RPC_SERVER_ERROR,
        `Request body too large (max ${MAX_BODY_BYTES} bytes).`,
      );
    }
    // ...but the header can be absent (chunked) or wrong, so enforce the cap while reading.
    const body = await readLimited(request, MAX_BODY_BYTES);
    if (body === null) {
      return jsonRpcError(
        413,
        JSON_RPC_SERVER_ERROR,
        `Request body too large (max ${MAX_BODY_BYTES} bytes).`,
      );
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
