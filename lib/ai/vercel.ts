"use server";

import { openai } from "@ai-sdk/openai";
import { generateObject, type GenerateObjectResult } from "ai";
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { aiProviders, aiRequests } from "@/lib/db/schema";
import type { AiProvider } from "@/lib/db/schema";
import {
  PricingRequestSchema,
  PricingResponseSchema,
  DataEnrichmentRequestSchema,
  DataEnrichmentResponseSchema,
  TrainingRequestSchema,
  TrainingResponseSchema,
  CreditRequestSchema,
  CreditResponseSchema,
  type PricingRequest,
  type PricingResponse,
  type DataEnrichmentRequest,
  type DataEnrichmentResponse,
  type TrainingRequest,
  type TrainingResponse,
  type CreditRequest,
  type CreditResponse,
} from "./schemas";

const DEFAULT_MODEL = process.env.VERCEL_AI_MODEL || "gpt-4o-mini";
const PROVIDER_NAME = "vercel-openai";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

interface LogRequestArgs {
  teamId: number;
  userId: number;
  providerId: string;
  model: string;
  prompt: string;
  latencyMs: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
  success: boolean;
  errorMessage?: string;
}

async function ensureAiProvider(model: string): Promise<AiProvider> {
  const existing = await db
    .select()
    .from(aiProviders)
    .where(and(eq(aiProviders.name, PROVIDER_NAME), eq(aiProviders.model, model)))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const [created] = await db
    .insert(aiProviders)
    .values({
      name: PROVIDER_NAME,
      model,
      enabled: true,
      config: {
        temperature: 0.3,
        maxTokens: 900,
      },
    })
    .returning();

  return created;
}

async function logAiRequest(args: LogRequestArgs) {
  const promptHash = crypto
    .createHash("sha256")
    .update(args.prompt)
    .digest("hex");

  await db.insert(aiRequests).values({
    teamId: args.teamId,
    userId: args.userId,
    providerId: args.providerId,
    model: args.model,
    promptHash,
    latencyMs: args.latencyMs,
    inputTokens: args.usage?.inputTokens ?? null,
    outputTokens: args.usage?.outputTokens ?? null,
    success: args.success,
    errorMessage: args.errorMessage,
  });
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof (error as any).status === "number") {
    return (error as any).status;
  }
  if ("cause" in error && error.cause && typeof (error.cause as any).status === "number") {
    return (error.cause as any).status;
  }
  return undefined;
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      const shouldRetry = status ? RETRYABLE_STATUS.has(status) : false;

      if (!shouldRetry || attempt === maxAttempts) {
        throw error;
      }

      const backoffMs = Math.min(2000, 250 * Math.pow(2, attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError as Error;
}

function buildPricingPrompt(request: PricingRequest): string {
  return [
    "You are an analyst for a street retail operation. Provide clear pricing suggestions in USD.",
    "Follow pricing guardrails: no changes greater than 35% unless inventory is critical.",
    "Consider demand signals, competitor pricing, and margins.",
    "Return well structured JSON matching the provided schema.",
    `Products: ${JSON.stringify(request.products, null, 2)}`,
    request.marketContext ? `Context: ${JSON.stringify(request.marketContext, null, 2)}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildDataPrompt(request: DataEnrichmentRequest): string {
  return [
    "You enrich CRM entities responsibly using only inferred, non-sensitive details.",
    "Respect lawful use. Never fabricate regulated data or personal identifiers.",
    `Entities: ${JSON.stringify(request.entities, null, 2)}`,
    `Include sources: ${request.includeSources}`,
  ].join("\n\n");
}

function buildTrainingPrompt(request: TrainingRequest): string {
  return [
    "You design concise training plans for street operations teams.",
    "Reflect the requested difficulty and audience.",
    "Keep the plan grounded in compliance and safe operations.",
    `Topic: ${request.topic}`,
    `Audience: ${request.audience}`,
    `Objectives: ${JSON.stringify(request.objectives)}`,
    request.durationHours ? `Duration target (hours): ${request.durationHours}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildCreditPrompt(request: CreditRequest): string {
  return [
    "You are a cautious credit analyst evaluating risk for manual payments.",
    "Use a conservative approach; flag high risk scenarios.",
    `Customer ID: ${request.customerId}`,
    `Financials: ${JSON.stringify(request.financials, null, 2)}`,
    request.qualitativeNotes ? `Notes: ${request.qualitativeNotes}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function runStructuredCall<TSchema extends { parse: (value: unknown) => any }>(
  args: {
    request: PricingRequest | DataEnrichmentRequest | TrainingRequest | CreditRequest;
    schema: TSchema;
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<{ object: any; usage?: GenerateObjectResult["usage"]; latencyMs: number; model: string }>
async function runStructuredCall(args: {
  request: PricingRequest | DataEnrichmentRequest | TrainingRequest | CreditRequest;
  schema: { parse: (value: unknown) => any };
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const model = args.model || DEFAULT_MODEL;
  const provider = await ensureAiProvider(model);
  const started = performance.now();

  try {
    const result = await withRetry(() =>
      generateObject({
        model: openai(model),
        system: "Respond strictly in JSON complying with the provided schema.",
        prompt: args.prompt,
        schema: args.schema,
        maxTokens: args.maxTokens ?? 900,
        temperature: args.temperature ?? 0.3,
      })
    );

    const latencyMs = Math.round(performance.now() - started);
    await logAiRequest({
      teamId: (args.request as any).teamId,
      userId: (args.request as any).userId,
      providerId: provider.id,
      model,
      prompt: args.prompt,
      latencyMs,
      usage: result.usage,
      success: true,
    });

    return {
      object: result.object,
      usage: result.usage,
      latencyMs,
      model,
    };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - started);
    await logAiRequest({
      teamId: (args.request as any).teamId,
      userId: (args.request as any).userId,
      providerId: provider.id,
      model,
      prompt: args.prompt,
      latencyMs,
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

export async function generatePricingSuggestions(
  payload: PricingRequest
): Promise<PricingResponse> {
  const request = PricingRequestSchema.parse(payload);
  const prompt = buildPricingPrompt(request);
  const { object } = await runStructuredCall({
    request,
    prompt,
    schema: PricingResponseSchema,
    temperature: 0.2,
    maxTokens: 700,
  });

  return PricingResponseSchema.parse(object);
}

export async function generateDataEnrichments(
  payload: DataEnrichmentRequest
): Promise<DataEnrichmentResponse> {
  const request = DataEnrichmentRequestSchema.parse(payload);
  const prompt = buildDataPrompt(request);
  const { object } = await runStructuredCall({
    request,
    prompt,
    schema: DataEnrichmentResponseSchema,
    temperature: 0.15,
    maxTokens: 800,
  });

  return DataEnrichmentResponseSchema.parse(object);
}

export async function generateTrainingPlan(
  payload: TrainingRequest
): Promise<TrainingResponse> {
  const request = TrainingRequestSchema.parse(payload);
  const prompt = buildTrainingPrompt(request);
  const { object } = await runStructuredCall({
    request,
    prompt,
    schema: TrainingResponseSchema,
    temperature: 0.25,
    maxTokens: 850,
  });

  return TrainingResponseSchema.parse(object);
}

export async function generateCreditAssessment(
  payload: CreditRequest
): Promise<CreditResponse> {
  const request = CreditRequestSchema.parse(payload);
  const prompt = buildCreditPrompt(request);
  const { object } = await runStructuredCall({
    request,
    prompt,
    schema: CreditResponseSchema,
    temperature: 0.1,
    maxTokens: 600,
  });

  return CreditResponseSchema.parse(object);
}
