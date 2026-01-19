import { describe, it, expect, beforeEach, vi } from 'vitest';
import { callOpenAI, parseJSONResponse, executeLLMWithRetries } from './client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('OpenAI Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('callOpenAI', () => {
    it('should return content on successful response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Hello, world!' } }],
          }),
      });

      const result = await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result).toBe('Hello, world!');
    });

    it('should call fetch with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        })
      );
    });

    it('should use default maxTokens and temperature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Test' }],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.max_tokens).toBe(1000);
      expect(callBody.temperature).toBe(0.3);
    });

    it('should use custom maxTokens and temperature', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Response' } }],
          }),
      });

      await callOpenAI({
        apiKey: 'test-api-key',
        messages: [{ role: 'user', content: 'Test' }],
        maxTokens: 500,
        temperature: 0.7,
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.max_tokens).toBe(500);
      expect(callBody.temperature).toBe(0.7);
    });

    it('should throw error on API failure with error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () =>
          Promise.resolve({
            error: { message: 'Invalid API key' },
          }),
      });

      await expect(
        callOpenAI({
          apiKey: 'invalid-key',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Invalid API key');
    });

    it('should throw generic error when no error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Parse error')),
      });

      await expect(
        callOpenAI({
          apiKey: 'test-key',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('API error: 500');
    });

    it('should return empty string when no content in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: null } }],
          }),
      });

      const result = await callOpenAI({
        apiKey: 'test-key',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(result).toBe('');
    });
  });

  describe('parseJSONResponse', () => {
    it('should parse valid JSON from content', () => {
      const content = '{"name": "John", "age": 30}';
      const result = parseJSONResponse<{ name: string; age: number }>(content, {
        name: '',
        age: 0,
      });

      expect(result.name).toBe('John');
      expect(result.age).toBe(30);
    });

    it('should extract JSON from markdown code blocks', () => {
      const content = '```json\n{"suggestions": [1, 2, 3]}\n```';
      const result = parseJSONResponse<{ suggestions: number[] }>(content, {
        suggestions: [],
      });

      expect(result.suggestions).toEqual([1, 2, 3]);
    });

    it('should extract JSON embedded in text', () => {
      const content = 'Here is your response: {"value": 42} Hope this helps!';
      const result = parseJSONResponse<{ value: number }>(content, { value: 0 });

      expect(result.value).toBe(42);
    });

    it('should return fallback for invalid JSON', () => {
      const content = 'This is not JSON at all';
      const fallback = { default: 'value' };
      const result = parseJSONResponse<{ default: string }>(content, fallback);

      expect(result).toEqual(fallback);
    });

    it('should return fallback for malformed JSON', () => {
      const content = '{"name": "John", age: 30}'; // Missing quotes around age
      const fallback = { name: '', age: 0 };
      const result = parseJSONResponse(content, fallback);

      expect(result).toEqual(fallback);
    });

    it('should handle empty content', () => {
      const fallback = { data: [] };
      const result = parseJSONResponse('', fallback);

      expect(result).toEqual(fallback);
    });
  });

  describe('executeLLMWithRetries', () => {
    const baseOptions = {
      apiKey: 'test-api-key',
      messages: [{ role: 'user' as const, content: 'Test' }],
    };

    it('should return valid response on first try', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 42}' } }],
        }),
      });

      const result = await executeLLMWithRetries({
        ...baseOptions,
        validate: (r: { value: number }) => r.value > 0,
        fallback: { value: 0 },
      });

      expect(result).toEqual({ value: 42 });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on validation failure and succeed', async () => {
      // First call returns invalid response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 0}' } }],
        }),
      });
      // Second call returns valid response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 42}' } }],
        }),
      });

      const result = await executeLLMWithRetries({
        ...baseOptions,
        validate: (r: { value: number }) => r.value > 0,
        fallback: { value: 0 },
      });

      expect(result).toEqual({ value: 42 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on API error and succeed', async () => {
      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });
      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 42}' } }],
        }),
      });

      const result = await executeLLMWithRetries({
        ...baseOptions,
        validate: (r: { value: number }) => r.value > 0,
        fallback: { value: 0 },
      });

      expect(result).toEqual({ value: 42 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return fallback after all retries fail validation', async () => {
      // All calls return invalid response
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 0}' } }],
        }),
      });

      const result = await executeLLMWithRetries({
        ...baseOptions,
        validate: (r: { value: number }) => r.value > 0,
        fallback: { value: -1 },
        maxRetries: 3,
      });

      expect(result).toEqual({ value: -1 });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should return fallback after all retries fail with errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const result = await executeLLMWithRetries({
        ...baseOptions,
        validate: () => true,
        fallback: { value: -1 },
        maxRetries: 2,
      });

      expect(result).toEqual({ value: -1 });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use custom maxRetries', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '{"value": 0}' } }],
        }),
      });

      await executeLLMWithRetries({
        ...baseOptions,
        validate: (r: { value: number }) => r.value > 0,
        fallback: { value: -1 },
        maxRetries: 5,
      });

      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });
});
