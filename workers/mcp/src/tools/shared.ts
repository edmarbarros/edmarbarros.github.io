import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SiteDataError } from '../site-client';
import { DEFAULT_LANG, LANGUAGES, LANG_VALUES } from '../languages';
import type { Env } from '../types';

/** What every tool group needs to register itself. */
export interface ToolDeps {
  server: McpServer;
  env: Env;
  ctx?: ExecutionContext;
}

// Annotations -------------------------------------------------------------

export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// Input fields shared by several tools ---------------------------------------

export const langField = z
  .enum(LANG_VALUES)
  .default(DEFAULT_LANG)
  .describe(
    `Content language: '${LANGUAGES.EN}' (English, default) or '${LANGUAGES.PT}' (Brazilian Portuguese).`,
  );

export const slugField = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Slug may only contain letters, digits, - and _')
  .describe("Slug as returned by the list tool, e.g. 'hello-world'.");

export const pagingFields = {
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum items to return (1-50, default 10).'),
  offset: z.number().int().min(0).default(0).describe('Number of items to skip, for paging.'),
};

// Results ---------------------------------------------------------------------

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

/** A successful result: readable text, plus the same data as structured content. */
export const ok = (text: string, structured?: object): ToolResult => ({
  content: [{ type: 'text', text }],
  ...(structured ? { structuredContent: structured as Record<string, unknown> } : {}),
});

/** A tool error written for the model that reads it, with a next step where possible. */
export const fail = (message: string): ToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

/** Turn thrown site-data errors into actionable tool errors instead of protocol errors. */
export async function guard(fn: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof SiteDataError) {
      return fail(
        `The site data is temporarily unavailable (${err.message}). Try again in a minute.`,
      );
    }
    throw err;
  }
}

/** Slice a list and describe where the slice sits, so the caller can ask for the next page. */
export function page<T>(items: T[], limit: number, offset: number) {
  const slice = items.slice(offset, offset + limit);
  const next = offset + slice.length;
  return {
    slice,
    meta: {
      total: items.length,
      count: slice.length,
      offset,
      has_more: next < items.length,
      next_offset: next < items.length ? next : null,
    },
  };
}
