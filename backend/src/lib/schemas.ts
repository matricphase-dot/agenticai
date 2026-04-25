import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export const createAgentSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string(),
    modelProvider: z.string(),
    modelName: z.string(),
    systemPrompt: z.string(),
    category: z.string(),
    pricingModel: z.enum(["FREE", "PER_INVOCATION", "PER_TOKEN"]),
    pricePerCall: z.number().optional(),
    pricePerToken: z.number().optional(),
  }),
});

export const invokeSchema = z.object({
  params: z.object({
    agentId: z.string(),
  }),
  body: z.object({
    input: z.any(),
  }),
});

export const createProposalSchema = z.object({
  body: z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    type: z.enum(["FEE_CHANGE", "TREASURY", "FEATURE", "SLASH", "OTHER"]),
    executionData: z.any().optional(),
  }),
});

export const stakeSchema = z.object({
  body: z.object({
    agentId: z.string(),
    amount: z.number().positive(),
  }),
});
