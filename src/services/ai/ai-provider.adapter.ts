/**
 * Abstract interface for AI providers (Gemini, Claude, etc.)
 * Allows swapping providers via env variable AI_PROVIDER.
 */

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  items?: { type: string; properties?: Record<string, ToolParameter>; required?: string[] };
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  /** For tool_result messages */
  toolName?: string;
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface AIResponse {
  /** Final text response (null if only tool calls) */
  text: string | null;
  /** Tool calls requested by the model */
  toolCalls: ToolCall[];
}

export interface AIProviderAdapter {
  chat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): Promise<AIResponse>;

  continueWithToolResults(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
    toolCalls: ToolCall[];
    toolResults: Record<string, unknown>[];
  }): Promise<AIResponse>;
}

// Note: To add a new AI provider in the future, create a new adapter implementing
// AIProviderAdapter (see gemini.adapter.ts as reference) and update ai-chatbot.service.ts.
