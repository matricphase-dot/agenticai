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

    try {
      switch (request.provider.toLowerCase()) {
        case 'openai':
          return await LLMService.callOpenAI(request, start);
        case 'anthropic':
          return await LLMService.callAnthropic(request, start);
        case 'google':
          return await LLMService.callGoogle(request, start);
        case 'custom':
          return await LLMService.callCustom(request, start);
        default:
          // Default to OpenAI for unknown providers
          return await LLMService.callOpenAI(request, start);
      }
    } catch (error) {
      logger.error('LLM call failed', {
        provider: request.provider,
        model: request.model,
        error,
      });
      throw error;
    }
  },

  callOpenAI: async (
    req: LLMRequest, 
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const client = new OpenAI({ apiKey });
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
  },

  callAnthropic: async (
    req: LLMRequest,
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const client = new Anthropic({ apiKey });
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
  },

  callGoogle: async (
    req: LLMRequest,
    start: number
  ): Promise<LLMResponse> => {
    const apiKey = req.apiKey || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('Google AI API key not configured');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: req.model || 'gemini-pro',
      systemInstruction: req.systemPrompt,
    });

    const result = await model.generateContent(req.userInput);
    const response = result.response;
    const output = response.text();

    // Google doesn't always return token counts on all plans
    const usage = response.usageMetadata;
    return {
      output,
      promptTokens: usage?.promptTokenCount || 0,
      completionTokens: usage?.candidatesTokenCount || 0,
      totalTokens: usage?.totalTokenCount || 0,
      latencyMs: Date.now() - start,
    };
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
