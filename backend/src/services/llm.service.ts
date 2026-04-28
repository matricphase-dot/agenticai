import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';

export interface LLMRequest {
  provider: string;       // 'openai' | 'anthropic' | 'google' | 'custom'
  model: string;          // e.g. 'gpt-4o', 'claude-3-opus'
  systemPrompt: string;
  userInput: string;
  apiKey?: string;        // If agent has their own key via secrets
  customEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  output: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export const LLMService = {

  call: async (request: LLMRequest): Promise<LLMResponse> => {
    const start = Date.now();
    const provider = (request.provider || 'google').toLowerCase();

    try {
      switch (provider) {
        case 'openai':
          return await LLMService.callOpenAI(request, start);
        case 'anthropic':
          return await LLMService.callAnthropic(request, start);
        case 'google':
          return await LLMService.callGoogle(request, start);
        case 'custom':
          return await LLMService.callCustom(request, start);
        default:
          return await LLMService.callGoogle(request, start);
      }
    } catch (error: any) {
      // Pass through specific error messages
      throw error;
    }
  },

  callOpenAI: async (
    req: LLMRequest, 
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured. Add OPENAI_API_KEY in Render environment variables.');

    const client = new OpenAI({ apiKey });
    try {
      const response = await client.chat.completions.create({
        model: req.model || 'gpt-4o-mini',
        max_tokens: req.maxTokens || 2048,
        temperature: req.temperature ?? 0.7,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userInput },
        ],
      });

      const choice = response.choices[0];
      return {
        output: choice.message.content || '',
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      throw new Error(`OpenAI error: ${error.message}`);
    }
  },

  callAnthropic: async (
    req: LLMRequest,
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured.');

    const client = new Anthropic({ apiKey });
    try {
      const response = await client.messages.create({
        model: req.model || 'claude-3-haiku-20240307',
        max_tokens: req.maxTokens || 2048,
        system: req.systemPrompt,
        messages: [{ role: 'user', content: req.userInput }],
      });

      const outputBlock = response.content[0];
      const output = outputBlock.type === 'text' ? outputBlock.text : '';

      return {
        output,
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + 
                     response.usage.output_tokens,
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      throw new Error(`Anthropic error: ${error.message}`);
    }
  },

  callGoogle: async (
    req: LLMRequest,
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return {
        output: "This is a mock AI response since the GOOGLE_AI_API_KEY is not configured on the live server.",
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        latencyMs: Date.now() - start,
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: req.model || 'gemini-1.5-flash',
        systemInstruction: req.systemPrompt,
      });

      const result = await model.generateContent(req.userInput);
      const response = result.response;
      const output = response.text();

      const usage = response.usageMetadata;
      return {
        output,
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      if (error.message?.includes('quota') || error.status === 429) {
        throw new Error('Google AI free quota exceeded. Try again in a minute.');
      }
      if (error.message?.includes('not found') || error.status === 404) {
        throw new Error('Gemini model not available.');
      }
      throw new Error(error.message || 'Google AI call failed');
    }
  },

  callCustom: async (
    req: LLMRequest,
    start: number
  ): Promise<LLMResponse> => {
    if (!req.customEndpoint) {
      throw new Error('Custom endpoint URL required');
    }

    // OpenAI-compatible custom endpoint
    const response = await fetch(req.customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.apiKey && { Authorization: `Bearer ${req.apiKey}` }),
      },
      body: JSON.stringify({
        model: req.model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userInput },
        ],
        max_tokens: req.maxTokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Custom endpoint error: ${response.status}`);
    }

    const data = await response.json() as any;
    return {
      output: data.choices?.[0]?.message?.content || 
              data.output || 
              JSON.stringify(data),
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      latencyMs: Date.now() - start,
    };
  },
};
