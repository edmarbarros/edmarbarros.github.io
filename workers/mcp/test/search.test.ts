import { describe, expect, it } from 'vitest';
import { search, tokenize, type SearchDoc } from '../src/search';

const doc = (over: Partial<SearchDoc>): SearchDoc => ({
  type: 'post',
  title: 't',
  url: 'https://x/t',
  summary: 's',
  title_: 't',
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
    doc({ title: 'Body only', title_: 'Body only', text: 'we use kafka here' }),
    doc({ title: 'Title hit', title_: 'Kafka deep dive', text: 'nothing' }),
    doc({ title: 'Tag hit', title_: 'Other', tags: 'kafka', text: '' }),
    doc({ title: 'No match', title_: 'Other', text: 'redis' }),
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

  it('returns nothing for an empty query', () => {
    expect(search(docs, ' ! ', 10)).toEqual([]);
  });
});
