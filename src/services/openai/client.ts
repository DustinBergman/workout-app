import { ChatMessage } from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';

export interface OpenAIRequestOptions {
  apiKey: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const callOpenAI = async (options: OpenAIRequestOptions): Promise<string> => {
  const { apiKey, messages, maxTokens = 1000, temperature = 0.3 } = options;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0]?.message?.content || '';
};

export const parseJSONResponse = <T>(content: string, fallback: T): T => {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
  }
  return fallback;
};
