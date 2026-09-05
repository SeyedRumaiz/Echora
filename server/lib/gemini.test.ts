import { describe, it, expect, afterEach } from 'vitest';
import { getGeminiClient, hasConfiguredGeminiKey } from './gemini';

const ORIGINAL_KEY = process.env.GEMINI_API_KEY;

describe('getGeminiClient / hasConfiguredGeminiKey', () => {
  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = ORIGINAL_KEY;
  });

  it('reports no key configured when the env var is unset', () => {
    delete process.env.GEMINI_API_KEY;
    expect(hasConfiguredGeminiKey()).toBe(false);
  });

  it('reports no key configured for the placeholder value', () => {
    process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
    expect(hasConfiguredGeminiKey()).toBe(false);
  });

  it('reports a key configured for a real-looking value', () => {
    process.env.GEMINI_API_KEY = 'a-real-looking-key';
    expect(hasConfiguredGeminiKey()).toBe(true);
  });

  it('throws a clear error when constructing a client with no key set', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getGeminiClient()).toThrow(/GEMINI_API_KEY/);
  });

  it('throws a clear error when the key is still the placeholder', () => {
    process.env.GEMINI_API_KEY = 'MY_GEMINI_API_KEY';
    expect(() => getGeminiClient()).toThrow(/GEMINI_API_KEY/);
  });

  it('constructs a client successfully with a real-looking key', () => {
    process.env.GEMINI_API_KEY = 'a-real-looking-key';
    expect(() => getGeminiClient()).not.toThrow();
  });
});
