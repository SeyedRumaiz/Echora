import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app';

// These tests only exercise request validation and the health endpoint —
// none of them reach getGeminiClient(), so they run without a real
// GEMINI_API_KEY and never make a network call.

describe('GET /api/health', () => {
  it('reports healthy status with the expected shape', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('EchoraOS-Engine');
    expect(typeof res.body.hasGeminiKey).toBe('boolean');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('POST /api/ai/chat validation', () => {
  it('rejects a request with no messages field', async () => {
    const res = await request(app).post('/api/ai/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Messages array/);
  });

  it('rejects an empty messages array', async () => {
    const res = await request(app).post('/api/ai/chat').send({ messages: [] });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/reflect validation', () => {
  it('rejects a request with no entries', async () => {
    const res = await request(app).post('/api/ai/reflect').send({ entries: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/journal entry/);
  });
});

describe('POST /api/ai/analyze-entry validation', () => {
  it('rejects content shorter than 10 characters', async () => {
    const res = await request(app).post('/api/ai/analyze-entry').send({ content: 'short' });
    expect(res.status).toBe(400);
  });

  it('rejects a request with no content at all', async () => {
    const res = await request(app).post('/api/ai/analyze-entry').send({});
    expect(res.status).toBe(400);
  });
});
