import {
  GoogleGenerativeAI,
  Content,
  Part,
  SchemaType,
  Tool as GeminiTool,
  FunctionDeclaration,
} from '@google/generative-ai';
import { aiConfig } from '../../config/ai.config';
import {
  AIProviderAdapter,
  AIResponse,
  ChatMessage,
  ToolCall,
  ToolDefinition,
  ToolParameter,
} from './ai-provider.adapter';

// Map our simple types to Gemini schema types
const TYPE_MAP: Record<string, SchemaType> = {
  string: SchemaType.STRING,
  number: SchemaType.NUMBER,
  boolean: SchemaType.BOOLEAN,
  object: SchemaType.OBJECT,
  array: SchemaType.ARRAY,
};

function convertParam(param: ToolParameter): any {
  const result: any = {
    type: TYPE_MAP[param.type] || SchemaType.STRING,
    description: param.description,
  };
  if (param.enum) result.enum = param.enum;
  if (param.items) result.items = { type: TYPE_MAP[param.items.type] || SchemaType.STRING };
  if (param.properties) {
    result.properties = {};
    for (const [key, val] of Object.entries(param.properties)) {
      result.properties[key] = convertParam(val);
    }
  }
  if (param.required) result.required = param.required;
  return result;
}

function toGeminiTools(tools: ToolDefinition[]): GeminiTool[] {
  const declarations: FunctionDeclaration[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries(t.parameters.properties).map(([k, v]) => [k, convertParam(v)]),
      ),
      required: t.parameters.required || [],
    },
  }));
  return [{ functionDeclarations: declarations }];
}

function toGeminiHistory(messages: ChatMessage[]): Content[] {
  const history: Content[] = [];

  for (const msg of messages) {
    if (msg.role === 'user') {
      history.push({ role: 'user', parts: [{ text: msg.content }] });
    } else if (msg.role === 'assistant') {
      history.push({ role: 'model', parts: [{ text: msg.content }] });
    }
    // tool_result messages are handled in the chat loop, not in history
  }

  return history;
}

/**
 * Error raised when every model in the primary+fallback chain has exhausted
 * its retries. Signals to the caller that this is a capacity problem, not
 * a bug — they can show a "service busy" message with confidence.
 */
export class GeminiAllModelsExhaustedError extends Error {
  constructor(public readonly lastCause: unknown) {
    super('All Gemini models exhausted (primary + fallbacks all overloaded/rate-limited)');
    this.name = 'GeminiAllModelsExhaustedError';
  }
}

function classifyError(err: any): { retryable: boolean; reason: string } {
  const status = err?.status;
  const msg: string = err?.message || '';
  const is429 = status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
  const is503 = status === 503 || msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('overloaded') || msg.includes('UNAVAILABLE');
  if (is429) return { retryable: true, reason: '429 rate-limited' };
  if (is503) return { retryable: true, reason: '503 overloaded' };
  return { retryable: false, reason: msg.slice(0, 120) };
}

async function withRetry<T>(fn: () => Promise<T>, modelLabel: string): Promise<T> {
  const delays = aiConfig.gemini.retryDelaysMs;
  const maxAttempts = delays.length;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const { retryable, reason } = classifyError(err);
      if (!retryable || attempt >= maxAttempts) throw err;
      console.warn(`[Gemini:${modelLabel}] ${reason}, retrying in ${delays[attempt] / 1000}s (${attempt + 1}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
  }
}

/**
 * Try the primary model, then each fallback in order. Each model gets a full
 * retry budget. Non-retryable errors (bad input, auth, 404) throw immediately
 * without switching models — switching wouldn't help.
 */
async function tryModelChain<T>(
  attempt: (modelName: string) => Promise<T>,
): Promise<T> {
  const chain = [aiConfig.gemini.model, ...aiConfig.gemini.fallbackModels];
  let lastErr: unknown;
  for (const modelName of chain) {
    try {
      return await withRetry(() => attempt(modelName), modelName);
    } catch (err: any) {
      lastErr = err;
      const { retryable } = classifyError(err);
      if (!retryable) throw err; // bug / misconfig / bad request — don't waste the chain
      console.warn(`[Gemini] ${modelName} exhausted retries, falling back to next model`);
    }
  }
  throw new GeminiAllModelsExhaustedError(lastErr);
}

export class GeminiAdapter implements AIProviderAdapter {
  private genAI: GoogleGenerativeAI;

  constructor() {
    if (!aiConfig.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is required. Get one free at https://ai.google.dev');
    }
    this.genAI = new GoogleGenerativeAI(aiConfig.gemini.apiKey);
  }

  async chat(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
  }): Promise<AIResponse> {
    // Separate the last user message from history
    const allMessages = [...params.messages];
    const lastMessage = allMessages.pop();
    if (!lastMessage || lastMessage.role !== 'user') {
      return { text: 'Xin lỗi, tôi không hiểu yêu cầu của bạn.', toolCalls: [] };
    }
    const history = toGeminiHistory(allMessages);

    const result = await tryModelChain(async (modelName) => {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: params.systemPrompt,
        tools: toGeminiTools(params.tools),
      });
      const chat = model.startChat({ history });
      return chat.sendMessage(lastMessage.content);
    });
    return this.parseResponse(result.response);
  }

  /**
   * Continue chat after tool execution — send tool results back to Gemini.
   */
  async continueWithToolResults(params: {
    systemPrompt: string;
    messages: ChatMessage[];
    tools: ToolDefinition[];
    toolCalls: ToolCall[];
    toolResults: Record<string, unknown>[];
  }): Promise<AIResponse> {
    // Build history including user message + model's function call response
    const allMessages = [...params.messages];
    const lastUserMsg = allMessages.pop();
    const history = toGeminiHistory(allMessages);

    if (lastUserMsg) {
      history.push({ role: 'user', parts: [{ text: lastUserMsg.content }] });
    }
    history.push({
      role: 'model',
      parts: params.toolCalls.map((tc) => ({
        functionCall: { name: tc.name, args: tc.args },
      })) as Part[],
    });

    const functionResponseParts: Part[] = params.toolCalls.map((tc, i) => ({
      functionResponse: {
        name: tc.name,
        response: params.toolResults[i] as any,
      },
    }));

    const result = await tryModelChain(async (modelName) => {
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: params.systemPrompt,
        tools: toGeminiTools(params.tools),
      });
      const chat = model.startChat({ history });
      return chat.sendMessage(functionResponseParts);
    });
    return this.parseResponse(result.response);
  }

  private parseResponse(response: any): AIResponse {
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      return {
        text: null,
        toolCalls: functionCalls.map((fc: any, i: number) => ({
          id: `call_${Date.now()}_${i}`,
          name: fc.name,
          args: (fc.args as Record<string, unknown>) || {},
        })),
      };
    }
    return { text: response.text() || '', toolCalls: [] };
  }
}
