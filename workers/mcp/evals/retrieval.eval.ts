import { describe, expect, it } from 'vitest';
import { search } from '../src/search';
import { CASES, NEGATIVE_CASES, TOP_K } from './cases';
import { loadLocalDocs } from './load';

const docsFor = {
  en: loadLocalDocs('en'),
  pt: loadLocalDocs('pt'),
};

/** 1-based rank of the first hit whose title contains one of the expected strings, or 0. */
function firstRank(titles: string[], wanted: string[]): number {
  const i = titles.findIndex((t) => wanted.some((w) => t.toLowerCase().includes(w.toLowerCase())));
  return i === -1 ? 0 : i + 1;
}

describe('retrieval quality (no model involved)', () => {
  const rows = CASES.map((c) => {
    const titles = search(docsFor[c.lang], c.query, 10).map((h) => h.title);
    return { ...c, rank: firstRank(titles, c.expect), got: titles.slice(0, TOP_K) };
  });

  it('prints the report', () => {
    console.table(
      rows.map((r) => ({ lang: r.lang, query: r.query, rank: r.rank || 'miss', top: r.got[0] })),
    );
    const hits = rows.filter((r) => r.rank > 0 && r.rank <= TOP_K).length;
    for (const r of rows.filter((x) => x.known))
      console.log(`known gap: [${r.lang}] ${r.query} - ${r.known}`);
    const mrr = rows.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) / rows.length;
    console.log(
      `recall@${TOP_K}: ${hits}/${rows.length} (${((hits / rows.length) * 100).toFixed(0)}%), MRR: ${mrr.toFixed(2)}`,
    );
  });

  it.each(rows)('finds the answer in the top results: [$lang] $query', (r) => {
    const check = () => {
      expect(r.rank, `top hits were: ${r.got.join(' | ')}`).toBeGreaterThan(0);
      expect(r.rank).toBeLessThanOrEqual(TOP_K);
    };
    // A known gap must keep failing; when it stops, the eval says to remove the note.
    if (r.known) expect(check, `fixed? remove "known" from this case: ${r.known}`).toThrow();
    else check();
  });

  it.each(NEGATIVE_CASES)(
    'returns nothing for a technology the site does not claim: $query',
    (c) => {
      const check = () =>
        expect(search(docsFor[c.lang], c.query, 10).map((h) => h.title)).toEqual([]);
      if (c.known) expect(check, `fixed? remove "known" from this case: ${c.known}`).toThrow();
      else check();
    },
  );
});
