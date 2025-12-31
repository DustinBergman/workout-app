import { useState, useRef, useEffect, FC } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card, Button, Input } from '../components/ui';
import { sendChatMessage, getProgressiveOverloadRecommendations } from '../services/openai';
import { AssistantMessage, WorkoutRecommendation } from '../types';
import { Link } from 'react-router-dom';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const Assistant: FC = () => {
  const preferences = useAppStore((state) => state.preferences);
  const sessions = useAppStore((state) => state.sessions);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey = !!preferences.openaiApiKey;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load recommendations on mount if API key exists
  useEffect(() => {
    if (hasApiKey && sessions.length >= 2) {
      loadRecommendations();
    }
  }, [hasApiKey, sessions.length]);

  const loadRecommendations = async () => {
    if (!preferences.openaiApiKey) return;

    setLoadingRecommendations(true);
    try {
      const recs = await getProgressiveOverloadRecommendations(
        preferences.openaiApiKey,
        sessions,
        preferences.weightUnit
      );
      setRecommendations(recs);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !preferences.openaiApiKey) return;

    const userMessage: AssistantMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const chatMessages = [...messages, userMessage].map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const response = await sendChatMessage(
        preferences.openaiApiKey,
        chatMessages,
        sessions
      );

      const assistantMessage: AssistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    'How should I progress on bench press?',
    'Am I overtraining?',
    'Suggest exercises for weak shoulders',
    'Review my recent workout performance',
  ];

  if (!hasApiKey) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          AI Assistant
        </h1>

        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            API Key Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add your OpenAI API key in Settings to use the AI assistant for progressive overload recommendations.
          </p>
          <Link to="/settings">
            <Button>Go to Settings</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] pb-16">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          AI Assistant
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Get personalized workout recommendations
        </p>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Progressive Overload Recommendations
          </h2>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {rec.exerciseName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {rec.reason}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    rec.type === 'increase'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : rec.type === 'decrease'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {rec.type === 'increase' && '+'}
                  {rec.recommendedWeight} {preferences.weightUnit}
                </span>
              </div>
            ))}
          </div>
          {loadingRecommendations && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Loading...</p>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Ask me anything about your workouts!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your workout..."
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
