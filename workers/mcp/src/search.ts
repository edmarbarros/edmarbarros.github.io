// Types ---------------------------------------------------------------------

export const SEARCH_DOC_TYPES = ['post', 'project', 'experience', 'skill'] as const;
export type SearchDocType = (typeof SEARCH_DOC_TYPES)[number];

/** One thing that can be found: what to match on, and what to show when it is. */
export interface SearchDoc {
  type: SearchDocType;
  /** Shown to the reader. */
  title: string;
  url: string;
  /** Shown when there is no better snippet. */
  summary: string;
  /** Matched with the highest weight: the title, plus any aliases. */
  searchTitle: string;
  /** Matched with medium weight, space separated: tags or tech stack. */
  tags: string;
  /** Matched with the lowest weight, and the source of snippets. */
  text: string;
}

export interface SearchHit {
  type: SearchDocType;
  title: string;
  url: string;
  summary: string;
  score: number;
  snippet: string;
}

// Constants -----------------------------------------------------------------

/** How much one occurrence counts in each searchable field. */
const WEIGHTS = { searchTitle: 8, tags: 5, text: 1 } as const;
type SearchField = keyof typeof WEIGHTS;
const SEARCH_FIELDS = Object.keys(WEIGHTS) as SearchField[];

/** Characters kept on each side of a match when cutting a snippet. */
const SNIPPET_RADIUS = 80;

// Helpers -------------------------------------------------------------------

/** Lowercase words, keeping tech punctuation such as node.js and c#. */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}.+#]+/u)
    .filter((t) => t.length > 1);
}

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) return count;
    count++;
    from = i + needle.length;
  }
}

function snippetAround(text: string, term: string): string {
  const i = text.toLowerCase().indexOf(term);
  if (i === -1) return '';
  const start = Math.max(0, i - SNIPPET_RADIUS);
  const end = Math.min(text.length, i + term.length + SNIPPET_RADIUS);
  const body = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '…' : ''}${body}${end < text.length ? '…' : ''}`;
}

/** When a hit matched only in the tags or tech stack, show that instead of a generic summary. */
function tagSnippet(tags: string, terms: string[]): string {
  const lower = tags.toLowerCase();
  return terms.some((t) => lower.includes(t)) ? `Tech: ${tags.split(' ').join(', ')}` : '';
}

/** The weighted score for a document, or null when any search word is missing. */
function scoreDoc(doc: SearchDoc, terms: string[]): number | null {
  const fields: Record<SearchField, string> = {
    searchTitle: doc.searchTitle.toLowerCase(),
    tags: doc.tags.toLowerCase(),
    text: doc.text.toLowerCase(),
  };
  let score = 0;
  for (const term of terms) {
    let termScore = 0;
    for (const field of SEARCH_FIELDS) {
      termScore += countOccurrences(fields[field], term) * WEIGHTS[field];
    }
    // Every term must appear somewhere, so multi-word queries stay precise.
    if (termScore === 0) return null;
    score += termScore;
  }
  return score;
}

function toHit(doc: SearchDoc, terms: string[], score: number): SearchHit {
  return {
    type: doc.type,
    title: doc.title,
    url: doc.url,
    summary: doc.summary,
    score,
    snippet: snippetAround(doc.text, terms[0]!) || tagSnippet(doc.tags, terms) || doc.summary,
  };
}

// Search --------------------------------------------------------------------

/** Plain term-frequency search. The corpus is tiny, so no index is needed. */
export function search(docs: SearchDoc[], query: string, limit: number): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const score = scoreDoc(doc, terms);
    if (score !== null) hits.push(toHit(doc, terms, score));
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
