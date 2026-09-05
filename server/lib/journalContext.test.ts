import { describe, it, expect } from 'vitest';
import { formatJournalContext } from './journalContext';

describe('formatJournalContext', () => {
  it('returns a placeholder string when there are no entries', () => {
    expect(formatJournalContext([])).toBe('NO JOURNAL ENTRIES PROVIDED YET.');
    expect(formatJournalContext(null)).toBe('NO JOURNAL ENTRIES PROVIDED YET.');
    expect(formatJournalContext(undefined)).toBe('NO JOURNAL ENTRIES PROVIDED YET.');
  });

  it('includes id, title, date, mood, tags, and content for each entry', () => {
    const out = formatJournalContext([
      {
        id: 'e1',
        title: 'Morning Walk',
        content: 'Felt clear-headed.',
        mood: 'Peaceful',
        tags: ['exercise', 'calm'],
        createdAt: new Date('2026-08-24').getTime()
      }
    ]);
    expect(out).toContain('ID: e1');
    expect(out).toContain('Title: Morning Walk');
    expect(out).toContain('Mood: Peaceful');
    expect(out).toContain('Tags: exercise, calm');
    expect(out).toContain('Felt clear-headed.');
  });

  it('falls back to Untitled/Unknown Date for missing metadata', () => {
    const out = formatJournalContext([{ id: 'e2', content: 'No title given.' }]);
    expect(out).toContain('Title: Untitled');
    expect(out).toContain('Unknown Date');
  });

  it('bounds the number of entries included to the given limit', () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, title: `Entry ${i}`, content: 'x' }));
    const out = formatJournalContext(entries, 2);
    expect(out).toContain('Entry 0');
    expect(out).toContain('Entry 1');
    expect(out).not.toContain('Entry 2');
  });
});
