import type {
  ChatMessage,
  JournalEntry,
  LongitudinalInsight,
  SingleEntryAnalysis,
  SourceCitation
} from '../types';

export interface ChatResponse {
  text: string;
  sources: SourceCitation[];
}

/**
 * Multi-turn conversation with Gemini grounded in the user's private journal
 */
export async function chatWithGemini(params: {
  messages: { role: 'user' | 'model'; content: string }[];
  journalEntries: JournalEntry[];
  currentEntryContext?: { title: string; content: string };
}): Promise<ChatResponse> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Reflection AI server error (${response.status})`);
  }

  return response.json();
}

/**
 * Generates structured longitudinal reflection over a collection of entries
 */
export async function generateLongitudinalReflection(params: {
  entries: JournalEntry[];
  timeframe: string;
}): Promise<Omit<LongitudinalInsight, 'id' | 'ownerUid' | 'createdAt'>> {
  const response = await fetch('/api/ai/reflect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Synthesis failed (${response.status})`);
  }

  return response.json();
}

/**
 * Convenience wrapper returning a complete LongitudinalInsight with generated id and timestamp
 */
export async function generateLongitudinalInsight(
  entries: JournalEntry[],
  daysOrTimeframe: number | string
): Promise<LongitudinalInsight> {
  const timeframe = typeof daysOrTimeframe === 'number' ? `Past ${daysOrTimeframe} days` : daysOrTimeframe;
  const result = await generateLongitudinalReflection({ entries, timeframe });
  return {
    ...result,
    id: `insight_${Date.now()}`,
    ownerUid: '',
    createdAt: Date.now(),
  };
}

/**
 * Provides gentle reflection prompts and themes for a newly drafted entry
 */
export async function analyzeSingleEntry(params: {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
}): Promise<SingleEntryAnalysis> {
  const response = await fetch('/api/ai/analyze-entry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Entry analysis failed (${response.status})`);
  }

  return response.json();
}

export const sendChatMessage = chatWithGemini;
