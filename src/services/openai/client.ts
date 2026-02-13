import { ChatMessage } from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-5-mini';

export type OpenAIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gpt-5-mini' | 'gpt-5-nano' | 'gpt-5';

export interface OpenAIRequestOptions {
  apiKey: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: OpenAIModel;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// GPT-5 family and o-series are reasoning models
const isReasoningModel = (model: string): boolean =>
  model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');

export const callOpenAI = async (options: OpenAIRequestOptions): Promise<string> => {
  const { apiKey, messages, maxTokens = 1000, temperature = 0.3, model = DEFAULT_MODEL } = options;

  // Reasoning models use hidden thinking tokens within max_completion_tokens,
  // so we need a larger budget (roughly 10x) to leave room for actual output.
  const isReasoning = isReasoningModel(model);
  const tokenBudget = isReasoning ? Math.max(maxTokens * 10, 4000) : maxTokens;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_completion_tokens: tokenBudget,
  };

  // Reasoning models don't support custom temperature
  if (!isReasoning) {
    body.temperature = temperature;
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
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

export interface ExecuteLLMOptions<T> extends OpenAIRequestOptions {
  validate: (response: T) => boolean;
  fallback: T;
  maxRetries?: number;
}

export const executeLLMWithRetries = async <T>(
  options: ExecuteLLMOptions<T>
): Promise<T> => {
  const { validate, fallback, maxRetries = 3, ...openAIOptions } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const content = await callOpenAI(openAIOptions);
      const parsed = parseJSONResponse<T>(content, fallback);

      if (validate(parsed)) {
        return parsed;
      }

      console.warn(`[LLM] Attempt ${attempt}/${maxRetries}: Response failed validation`);
    } catch (error) {
      console.warn(`[LLM] Attempt ${attempt}/${maxRetries}: Error - ${error}`);
    }
  }

  console.error(`[LLM] All ${maxRetries} attempts failed, returning fallback`);
  return fallback;
};
