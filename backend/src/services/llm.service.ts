import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../lib/logger';

interface LLMProvider {
  name: string;
  priority: number;
  hasKey: () => boolean;
  call: (systemPrompt: string, userInput: string, modelName?: string) => Promise<LLMResponse>;
}

export interface LLMResponse {
  output: string;
  tokensUsed: number;
  provider: string;
  model: string;
  latencyMs: number;
}

interface ProviderHealth {
  name: string;
  failureCount: number;
  lastFailureAt: Date | null;
  isCircuitOpen: boolean;
  circuitOpenedAt: Date | null;
}

// Track provider health in memory
const providerHealth: Record<string, ProviderHealth> = {
  google: { name: 'google', failureCount: 0, lastFailureAt: null, isCircuitOpen: false, circuitOpenedAt: null },
  openai: { name: 'openai', failureCount: 0, lastFailureAt: null, isCircuitOpen: false, circuitOpenedAt: null },
  anthropic: { name: 'anthropic', failureCount: 0, lastFailureAt: null, isCircuitOpen: false, circuitOpenedAt: null },
};

const CIRCUIT_BREAK_THRESHOLD = 3; // failures before circuit opens
const CIRCUIT_RESET_MS = 5 * 60 * 1000; // 5 minutes before retry

function recordFailure(providerName: string): void {
  const health = providerHealth[providerName];
  if (!health) return;
  health.failureCount++;
  health.lastFailureAt = new Date();
  if (health.failureCount >= CIRCUIT_BREAK_THRESHOLD) {
    health.isCircuitOpen = true;
    health.circuitOpenedAt = new Date();
    logger.warn(`Circuit breaker OPEN for provider: ${providerName}`);
  }
}

function recordSuccess(providerName: string): void {
  const health = providerHealth[providerName];
  if (!health) return;
  health.failureCount = 0;
  health.isCircuitOpen = false;
  health.circuitOpenedAt = null;
}

function isProviderAvailable(providerName: string): boolean {
  const health = providerHealth[providerName];
  if (!health) return false;
  if (!health.isCircuitOpen) return true;
  // Auto-reset after CIRCUIT_RESET_MS
  if (health.circuitOpenedAt && Date.now() - health.circuitOpenedAt.getTime() > CIRCUIT_RESET_MS) {
    health.isCircuitOpen = false;
    health.failureCount = 0;
    logger.info(`Circuit breaker RESET for provider: ${providerName}`);
    return true;
  }
  return false;
}

// Support multiple Google API keys for rotation
function getGoogleApiKey(): string {
  const keys = [
    process.env.GOOGLE_AI_API_KEY,
    process.env.GOOGLE_AI_API_KEY_2,
    process.env.GOOGLE_AI_API_KEY_3,
  ].filter(Boolean) as string[];

  if (keys.length === 0) throw new Error('No Google AI API keys configured');

  // Round-robin rotation
  const index = Math.floor(Date.now() / 1000) % keys.length;
  return keys[index];
}

// Google Gemini provider
async function callGemini(systemPrompt: string, userInput: string, modelName = 'gemini-1.5-flash'): Promise<LLMResponse> {
  const apiKey = getGoogleApiKey();
  
  const start = Date.now();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(userInput);
  const text = result.response.text();
  const usage = result.response.usageMetadata;

  return {
    output: text,
    tokensUsed: (usage?.totalTokenCount) || 0,
    provider: 'google',
    model: modelName,
    latencyMs: Date.now() - start,
  };
}

// OpenAI provider
async function callOpenAI(systemPrompt: string, userInput: string, modelName = 'gpt-4o-mini'): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const start = Date.now();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      max_tokens: 2000,
    }),
  });

  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (response.status === 401) throw new Error('INVALID_API_KEY');
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);

  const data = await response.json() as any;
  return {
    output: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens,
    provider: 'openai',
    model: modelName,
    latencyMs: Date.now() - start,
  };
}

// Anthropic provider
async function callAnthropic(systemPrompt: string, userInput: string, modelName = 'claude-3-haiku-20240307'): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const start = Date.now();
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userInput }],
    }),
  });

  if (response.status === 429) throw new Error('RATE_LIMIT');
  if (response.status === 401) throw new Error('INVALID_API_KEY');
  if (!response.ok) throw new Error(`Anthropic error: ${response.status}`);

  const data = await response.json() as any;
  return {
    output: data.content[0].text,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    provider: 'anthropic',
    model: modelName,
    latencyMs: Date.now() - start,
  };
}

// Define provider chain in priority order
const PROVIDER_CHAIN = [
  {
    name: 'google',
    call: callGemini,
    hasKey: () => Boolean(process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY_2 || process.env.GOOGLE_AI_API_KEY_3),
  },
  {
    name: 'openai',
    call: callOpenAI,
    hasKey: () => Boolean(process.env.OPENAI_API_KEY),
  },
  {
    name: 'anthropic',
    call: callAnthropic,
    hasKey: () => Boolean(process.env.ANTHROPIC_API_KEY),
  },
];

// MAIN FUNCTION - tries providers in order with automatic failover
export async function callLLM(
  preferredProvider: string,
  systemPrompt: string,
  userInput: string,
  modelName?: string,
): Promise<LLMResponse> {
  // Build ordered list: preferred provider first then fallbacks
  const orderedProviders = [
    ...PROVIDER_CHAIN.filter(p => p.name === preferredProvider),
    ...PROVIDER_CHAIN.filter(p => p.name !== preferredProvider),
  ];

  const errors: string[] = [];

  for (const provider of orderedProviders) {
    // Skip if no API key configured
    if (!provider.hasKey()) {
      errors.push(`${provider.name}: no API key`);
      continue;
    }

    // Skip if circuit is open
    if (!isProviderAvailable(provider.name)) {
      errors.push(`${provider.name}: circuit breaker open`);
      continue;
    }

    try {
      logger.info(`Calling LLM provider: ${provider.name}`);
      const result = await provider.call(systemPrompt, userInput, modelName);
      recordSuccess(provider.name);

      // Log if we used a fallback
      if (provider.name !== (preferredProvider || 'google')) {
        logger.warn(`Used fallback provider ${provider.name} instead of ${preferredProvider}`);
      }

      return result;
    } catch (error: any) {
      const message = error.message || 'Unknown error';
      errors.push(`${provider.name}: ${message}`);
      recordFailure(provider.name);
      logger.error(`LLM provider ${provider.name} failed`, { error: message });

      // Continue to next provider
      continue;
    }
  }

  // All providers failed
  throw new Error(`All LLM providers failed. Errors: ${errors.join(', ')}`);
}

// Legacy export for compatibility if needed, or we can just update invocation service
export const LLMService = {
  call: async (params: { 
    provider: string, 
    systemPrompt: string, 
    userInput: string, 
    model?: string 
  }) => {
    return callLLM(params.provider, params.systemPrompt, params.userInput, params.model);
  }
};

// Get current provider health status
export function getProviderHealth() {
  return Object.entries(providerHealth).map(([name, health]) => ({
    name,
    available: isProviderAvailable(name),
    hasKey: PROVIDER_CHAIN.find(p => p.name === name)?.hasKey() || false,
    failureCount: health.failureCount,
    circuitOpen: health.isCircuitOpen,
  }));
}
