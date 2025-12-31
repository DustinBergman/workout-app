import { WorkoutSession } from '../../types';
import { ChatMessage } from './types';
import { callOpenAI } from './client';
import { createHistoryContext } from './history';

export const sendChatMessage = async (
  apiKey: string,
  messages: ChatMessage[],
  workoutHistory: WorkoutSession[]
): Promise<string> => {
  // Create a summary of workout history for context
  const historyContext = createHistoryContext(workoutHistory);

  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are a knowledgeable fitness coach and workout assistant. You help users optimize their training with progressive overload principles.

You have access to the user's workout history:
${historyContext}

Your guidelines:
- Analyze workout patterns to suggest weight/rep adjustments
- Recommend progressive overload when the user consistently hits their targets
- Suggest deloads when performance drops or plateaus occur
- Provide form tips and exercise alternatives when asked
- Keep responses concise and actionable
- Use the user's weight unit preference in recommendations
- Be encouraging but realistic`,
  };

  return callOpenAI({
    apiKey,
    messages: [systemMessage, ...messages],
    maxTokens: 1000,
    temperature: 0.7,
  });
};
