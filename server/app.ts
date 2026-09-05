import express, { Request, Response } from 'express';
import { Type } from '@google/genai';
import { getGeminiClient, hasConfiguredGeminiKey, BASE_AI_INSTRUCTIONS } from './lib/gemini';
import { formatJournalContext } from './lib/journalContext';
import { parseCitations } from '../shared/citations';

/**
 * The Express app itself, with every EchoraOS API route — separated from
 * server.ts (which additionally wires up Vite middleware in dev / static
 * file serving in production, and calls app.listen). Keeping this module
 * free of those side effects is what makes it importable from tests
 * (supertest can exercise these routes directly) without starting a real
 * HTTP listener or spinning up Vite.
 */
export const app = express();

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for Cloud Run
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EchoraOS-Engine',
    hasGeminiKey: hasConfiguredGeminiKey()
  });
});

// API: Multi-turn Chat with Journal Context
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { messages, journalEntries = [], currentEntryContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const ai = getGeminiClient();

    const formattedJournalContext = formatJournalContext(journalEntries);

    let activeEditorContext = '';
    if (currentEntryContext && currentEntryContext.content) {
      activeEditorContext = `\nCURRENT ENTRY CURRENTLY BEING WRITTEN IN EDITOR:\nTitle: ${currentEntryContext.title || 'Draft'}\nContent:\n${currentEntryContext.content}\n`;
    }

    const systemInstruction = `${BASE_AI_INSTRUCTIONS}

USER'S AUTHORIZED JOURNAL ARCHIVE:
========================================
${formattedJournalContext}
========================================
${activeEditorContext}

Remember: When referring to specific journal entries, include citations using:
[[REF:entryId|title|date]]
Example: "As you noted [[REF:abc123|Morning Walk|Aug 24, 2026]], taking time to walk cleared your head."
`;

    // Map conversation turns into format expected by Gemini contents
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.95
      }
    });

    const rawReply = response.text || '';

    // Parse citation tokens using the same format both server and client
    // agree on — see shared/citations.ts.
    res.json({
      text: rawReply,
      sources: parseCitations(rawReply)
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reflection response with Gemini.'
    });
  }
});

// API: Longitudinal Reflection & Structured Insights
app.post('/api/ai/reflect', async (req: Request, res: Response) => {
  try {
    const { entries = [], timeframe = 'Recent period' } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        error: 'At least one journal entry is required to generate a longitudinal reflection.'
      });
    }

    const ai = getGeminiClient();

    const formattedEntries = entries
      .slice(0, 40)
      .map((e: any, index: number) => {
        const dateStr = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Unknown Date';
        return `[Entry ${index + 1} | ID: ${e.id} | Date: ${dateStr} | Mood: ${e.mood || 'Unspecified'} | Tags: ${(e.tags || []).join(', ')}]
Title: ${e.title || 'Untitled'}
Content: ${e.content || ''}`;
      })
      .join('\n\n');

    const prompt = `Analyze the following private journal entries from the user for the timeframe: "${timeframe}".

JOURNAL ENTRIES:
${formattedEntries}

Provide a thoughtful, grounded reflection structured according to the requested JSON schema.
IMPORTANT RULES:
- Do not invent events, people, or milestones not mentioned in the text.
- Use tentative, respectful wording ("Your writings suggest...", "A recurring thread seems to be...").
- Keep items concise, insightful, and actionable.
- Formulate 3-4 powerful reflection questions to help the user grow.
- Identify 2-4 goals or intentions mentioned by the user.
- If entries are sparse or brief, acknowledge that gently without inventing details.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: BASE_AI_INSTRUCTIONS,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeframe: { type: Type.STRING },
            summary: { type: Type.STRING, description: '2-3 sentence grounded synthesis of user experiences' },
            themes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-6 core recurring themes or topics'
            },
            meaningfulMoments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  entryId: { type: Type.STRING }
                },
                required: ['title', 'description']
              }
            },
            goalsAndIntentions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Explicit or implicit goals the user noted'
            },
            challenges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key friction points, stresses, or obstacles discussed'
            },
            reflectionQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3-4 deep, thoughtful questions for continued self-reflection'
            },
            suggestedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-3 gentle, practical suggestions aligned with user priorities'
            },
            moodTrendObservation: {
              type: Type.STRING,
              description: 'A gentle observation about emotional shifts or tone across the entries'
            }
          },
          required: [
            'timeframe',
            'summary',
            'themes',
            'meaningfulMoments',
            'goalsAndIntentions',
            'challenges',
            'reflectionQuestions',
            'suggestedNextSteps',
            'moodTrendObservation'
          ]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json(parsedJson);
  } catch (error: any) {
    console.error('Gemini Reflection Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to synthesize journal reflection.'
    });
  }
});

// API: Single Entry Quick-Reflection Prompts
app.post('/api/ai/analyze-entry', async (req: Request, res: Response) => {
  try {
    const { title, content, mood, tags } = req.body;
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide at least a few sentences of content.' });
    }

    const ai = getGeminiClient();
    const prompt = `Review this single journal entry draft:
Title: ${title || 'Untitled'}
Mood: ${mood || 'Not specified'}
Tags: ${(tags || []).join(', ')}
Content:
${content}

Provide:
1. 2-3 deep reflection prompts directly related to what was written.
2. 2-4 detected theme keywords.
3. A warm 1-sentence thought or takeaway to encourage self-awareness.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: BASE_AI_INSTRUCTIONS,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            takeaway: { type: Type.STRING },
            reflectionQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            themes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['takeaway', 'reflectionQuestions', 'themes', 'suggestedTags']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Analyze Entry Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze entry.' });
  }
});
