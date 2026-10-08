import type { Lang } from '../src/languages';

/** A question a visitor or an assistant might ask, and what a good answer must surface. */
export interface RetrievalCase {
  lang: Lang;
  query: string;
  /** Substrings of a hit title; at least one hit in the top K must contain one of them. */
  expect: string[];
  /** Why this fails today. The eval then expects the failure, and flags it once it is fixed. */
  known?: string;
}

/** Queries that must return nothing: technologies the site makes no claim about. */
export interface NegativeCase {
  lang: Lang;
  query: string;
  known?: string;
}

export const TOP_K = 3;

export const CASES: RetrievalCase[] = [
  { lang: 'en', query: 'kafka', expect: ['Kafka'] },
  { lang: 'en', query: 'terraform', expect: ['Terraform'] },
  { lang: 'en', query: 'kubernetes', expect: ['Kubernetes'] },
  { lang: 'en', query: 'mysql', expect: ['MySQL'] },
  { lang: 'en', query: 'typescript', expect: ['TypeScript'] },
  { lang: 'en', query: 'langgraph', expect: ['LLM and AI agents', 'Quander'] },
  { lang: 'en', query: 'agent tracing', expect: ['Quander', 'LLM and AI agents'] },
  { lang: 'en', query: 'billing', expect: ['Payments and billing'] },
  { lang: 'en', query: 'mcp', expect: ['MCP'] },
  { lang: 'en', query: 'staff engineer', expect: ['Vendoo'] },
  { lang: 'en', query: 'cloud.iq', expect: ['cloud.IQ'] },
  { lang: 'en', query: 'paerpay', expect: ['Paerpay'] },
  { lang: 'pt', query: 'kafka', expect: ['Kafka'] },
  { lang: 'pt', query: 'agentes', expect: ['LLM', 'Quander'] },
  { lang: 'pt', query: 'tech lead', expect: ['Tech Lead'] },
  {
    lang: 'pt',
    query: 'liderança técnica',
    expect: ['Technical leadership'],
  },
  { lang: 'pt', query: 'pagamentos', expect: ['Payments and billing'] },
  { lang: 'pt', query: 'monitoramento', expect: ['Observability'] },
  { lang: 'pt', query: 'microsserviços', expect: ['Backend architecture', 'Vendoo'] },
  { lang: 'pt', query: 'infraestrutura como código', expect: ['Terraform'] },
];

export const NEGATIVE_CASES: NegativeCase[] = [
  { lang: 'en', query: 'rust' },
  { lang: 'en', query: 'golang' },
  { lang: 'en', query: 'swift' },
  { lang: 'en', query: 'salesforce' },
];
