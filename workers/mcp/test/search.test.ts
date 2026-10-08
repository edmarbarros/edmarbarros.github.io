import { describe, expect, it } from 'vitest';
import { search, tokenize, type SearchDoc } from '../src/search';

const doc = (over: Partial<SearchDoc>): SearchDoc => ({
  type: 'post',
  title: 't',
  url: 'https://x/t',
  summary: 's',
  searchTitle: 't',
  tags: '',
  text: '',
  ...over,
});

describe('tokenize', () => {
  it('lowercases, splits on punctuation and drops one-letter tokens', () => {
    expect(tokenize('Kafka, a Migration!')).toEqual(['kafka', 'migration']);
  });
  it('keeps tech punctuation like node.js and c#', () => {
    expect(tokenize('node.js c#')).toEqual(['node.js', 'c#']);
  });
});

describe('search', () => {
  const docs = [
    doc({ title: 'Body only', searchTitle: 'Body only', text: 'we use kafka here' }),
    doc({ title: 'Title hit', searchTitle: 'Kafka deep dive', text: 'nothing' }),
    doc({ title: 'Tag hit', searchTitle: 'Other', tags: 'kafka', text: '' }),
    doc({ title: 'No match', searchTitle: 'Other', text: 'redis' }),
  ];

  it('ranks title above tag above body', () => {
    expect(search(docs, 'kafka', 10).map((h) => h.title)).toEqual([
      'Title hit',
      'Tag hit',
      'Body only',
    ]);
  });

  it('requires every term to match', () => {
    expect(search(docs, 'kafka redis', 10)).toEqual([]);
  });

  it('respects the limit and returns a snippet around the match', () => {
    const hits = search(docs, 'kafka', 1);
    expect(hits).toHaveLength(1);
    const body = search(docs, 'kafka', 10).find((h) => h.title === 'Body only');
    expect(body?.snippet).toContain('kafka');
  });

  it('shows the tags when a hit matched only there', () => {
    const hit = search(docs, 'kafka', 10).find((h) => h.title === 'Tag hit');
    expect(hit?.snippet).toBe('Tech: kafka');
  });

  describe('very short terms', () => {
    const shortDocs = [
      doc({
        title: 'Backer',
        searchTitle: 'Vendoo YC W22',
        text: 'Backed by Y Combinator (YC W22).',
      }),
      doc({
        title: 'Cycles',
        searchTitle: 'Other',
        text: 'Shorter delivery cycles and async work.',
      }),
      doc({ title: 'Email', searchTitle: 'Other', text: 'Sends email to maintain contact.' }),
      doc({ title: 'Agents', searchTitle: 'LLM and AI agents', text: 'Built AI tools.' }),
    ];
    it('match whole words only, so yc does not find cycles', () => {
      expect(search(shortDocs, 'yc', 10).map((h) => h.title)).toEqual(['Backer']);
    });
    it('match whole words only, so ai does not find email or maintain', () => {
      expect(search(shortDocs, 'ai', 10).map((h) => h.title)).toEqual(['Agents']);
    });
    it('longer terms match from the start of a word, so migrat finds migration', () => {
      const docs = [doc({ title: 'M', searchTitle: 'Other', text: 'Led the migration to Kafka.' })];
      expect(search(docs, 'migrat', 10)).toHaveLength(1);
    });
    it('longer terms do not match inside a word, so rust does not find trust', () => {
      const docs = [doc({ title: 'T', searchTitle: 'Other', text: 'Ad data they can trust.' })];
      expect(search(docs, 'rust', 10)).toEqual([]);
    });
    it('cut the snippet at the whole word', () => {
      const [hit] = search(shortDocs, 'yc', 1);
      expect(hit!.snippet).toBe('Backed by Y Combinator (YC W22).');
    });
  });

  it('returns nothing for an empty query', () => {
    expect(search(docs, ' ! ', 10)).toEqual([]);
  });
});
