export interface JournalContextEntry {
  id?: string;
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  createdAt?: number;
}

/**
 * Formats a list of journal entries into the block of text embedded in the
 * Gemini system instruction as "the user's authorized journal archive".
 * Bounded to the most recent `limit` entries (default 30) to keep the
 * prompt a reasonable size — the same bound /api/ai/chat has always used.
 */
export function formatJournalContext(
  entries: JournalContextEntry[] | null | undefined,
  limit = 30
): string {
  if (!Array.isArray(entries) || entries.length === 0) {
    return 'NO JOURNAL ENTRIES PROVIDED YET.';
  }

  return entries
    .slice(0, limit)
    .map((e, index) => {
      const dateStr = e.createdAt
        ? new Date(e.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : 'Unknown Date';
      const moodStr = e.mood ? ` | Mood: ${e.mood}` : '';
      const tagsStr = e.tags && e.tags.length > 0 ? ` | Tags: ${e.tags.join(', ')}` : '';
      return `--- ENTRY #${index + 1} [ID: ${e.id}] ---
Title: ${e.title || 'Untitled'}
Date: ${dateStr}${moodStr}${tagsStr}
Content:
${e.content || ''}
`;
    })
    .join('\n\n');
}
