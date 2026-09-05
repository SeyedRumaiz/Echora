/**
 * Single source of truth for EchoraOS's inline citation format.
 *
 * The Gemini system prompt (see server/lib/gemini.ts's BASE_AI_INSTRUCTIONS)
 * instructs the model to cite journal entries it draws on using:
 *   [[REF:entryId|title|date]]
 *
 * Both the server (to build the `sources` array on /api/ai/chat responses)
 * and the client (to render inline, clickable citations in AIReflectionView)
 * need to recognize this exact format. Previously the same regex was
 * duplicated three times across server.ts and AIReflectionView.tsx; this
 * module is the one place that format is defined, imported by both sides
 * of the stack so a future change to it can't drift out of sync.
 */

export interface ParsedCitation {
  id: string;
  title: string;
  date: string;
}

/** Matches [[REF:entryId|title|date]]. Always construct a fresh RegExp from
 * this source rather than sharing one instance — RegExp objects with the
 * global flag carry mutable lastIndex state across exec() calls, and a
 * shared instance re-imported into two different call sites easily causes
 * subtle "skipped every other match" bugs. */
export const CITATION_PATTERN = '\\[\\[REF:([^|\\]]+)\\|([^|\\]]+)\\|([^\\]]+)\\]\\]';

function citationRegex(): RegExp {
  return new RegExp(CITATION_PATTERN, 'g');
}

/**
 * Extracts every citation from a block of text, de-duplicated by entry id
 * (first occurrence wins), in the order they first appear.
 */
export function parseCitations(text: string | null | undefined): ParsedCitation[] {
  if (!text) return [];
  const regex = citationRegex();
  const seen = new Set<string>();
  const citations: ParsedCitation[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const [, id, title, date] = match;
    if (!seen.has(id)) {
      seen.add(id);
      citations.push({ id, title, date });
    }
  }
  return citations;
}

/**
 * Splits text around citation tokens for rendering, returning an ordered
 * list of plain-string segments and parsed citation segments. The caller
 * decides how to render each kind (e.g. plain text vs. a clickable badge).
 */
export type CitationSegment =
  | { type: 'text'; value: string }
  | { type: 'citation'; value: ParsedCitation; raw: string };

export function splitOnCitations(text: string | null | undefined): CitationSegment[] {
  if (!text) return [];
  const regex = citationRegex();
  const segments: CitationSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const [raw, id, title, date] = match;
    segments.push({ type: 'citation', value: { id, title, date }, raw });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
}
