export interface SearchDoc {
  type: 'post' | 'project' | 'experience';
  title: string;
  url: string;
  /** Short description shown with the hit. */
  summary: string;
  /** Fields searched, in descending weight. */
  title_: string;
  tags: string;
  text: string;
}

export interface SearchHit {
  type: SearchDoc['type'];
  title: string;
  url: string;
  summary: string;
  score: number;
  snippet: string;
}

const WEIGHTS = { title_: 8, tags: 5, text: 1 } as const;

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

function snippetAround(text: string, term: string, radius = 80): string {
  const i = text.toLowerCase().indexOf(term);
  if (i === -1) return '';
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + term.length + radius);
  const body = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '…' : ''}${body}${end < text.length ? '…' : ''}`;
}

/** When a hit matched only in the tags or tech stack, show that instead of a generic summary. */
function tagSnippet(tags: string, terms: string[]): string {
  const lower = tags.toLowerCase();
  return terms.some((t) => lower.includes(t)) ? `Tech: ${tags.split(' ').join(', ')}` : '';
}

/** Plain term-frequency search. The corpus is tiny, so no index is needed. */
export function search(docs: SearchDoc[], query: string, limit: number): SearchHit[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const doc of docs) {
    const fields = {
      title_: doc.title_.toLowerCase(),
      tags: doc.tags.toLowerCase(),
      text: doc.text.toLowerCase(),
    };
    let score = 0;
    let matchedTerms = 0;
    for (const term of terms) {
      let termScore = 0;
      for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
        termScore += countOccurrences(fields[key], term) * WEIGHTS[key];
      }
      if (termScore > 0) matchedTerms++;
      score += termScore;
    }
    // Every term must appear somewhere, so multi-word queries stay precise.
    if (matchedTerms < terms.length) continue;

    const firstTerm = terms[0] as string;
    hits.push({
      type: doc.type,
      title: doc.title,
      url: doc.url,
      summary: doc.summary,
      score,
      snippet: snippetAround(doc.text, firstTerm) || tagSnippet(doc.tags, terms) || doc.summary,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
