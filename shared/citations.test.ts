import { describe, it, expect } from 'vitest';
import { parseCitations, splitOnCitations } from './citations';

describe('parseCitations', () => {
  it('returns an empty array for text with no citations', () => {
    expect(parseCitations('just plain text')).toEqual([]);
    expect(parseCitations(null)).toEqual([]);
    expect(parseCitations(undefined)).toEqual([]);
  });

  it('extracts a single citation', () => {
    const text = 'As you noted [[REF:abc123|Morning Walk|Aug 24, 2026]], it helped.';
    expect(parseCitations(text)).toEqual([{ id: 'abc123', title: 'Morning Walk', date: 'Aug 24, 2026' }]);
  });

  it('extracts multiple distinct citations in order', () => {
    const text = '[[REF:a|A|Jan 1]] then [[REF:b|B|Jan 2]]';
    expect(parseCitations(text)).toEqual([
      { id: 'a', title: 'A', date: 'Jan 1' },
      { id: 'b', title: 'B', date: 'Jan 2' }
    ]);
  });

  it('de-duplicates repeated citations of the same entry id, keeping the first', () => {
    const text = '[[REF:a|First Title|Jan 1]] ... later [[REF:a|Different Title|Jan 1]]';
    expect(parseCitations(text)).toEqual([{ id: 'a', title: 'First Title', date: 'Jan 1' }]);
  });
});

describe('splitOnCitations', () => {
  it('returns a single text segment when there are no citations', () => {
    expect(splitOnCitations('hello world')).toEqual([{ type: 'text', value: 'hello world' }]);
  });

  it('splits text and citation segments in order', () => {
    const text = 'Before [[REF:a|A|Jan 1]] after';
    expect(splitOnCitations(text)).toEqual([
      { type: 'text', value: 'Before ' },
      { type: 'citation', value: { id: 'a', title: 'A', date: 'Jan 1' }, raw: '[[REF:a|A|Jan 1]]' },
      { type: 'text', value: ' after' }
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(splitOnCitations('')).toEqual([]);
    expect(splitOnCitations(null)).toEqual([]);
  });
});
