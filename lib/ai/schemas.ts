import { z } from "zod";

const PositiveInt = z.number().int().positive();
const NonNegativeInt = z.number().int().nonnegative();

export const PricingProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currentPriceCents: NonNegativeInt,
  costBasisCents: NonNegativeInt.optional(),
  category: z.string().min(1).optional(),
  demandSignal: z.enum(["high", "medium", "low"]).optional(),
  inventoryOnHand: NonNegativeInt.optional(),
});

export const PricingRequestSchema = z.object({
  teamId: PositiveInt,
  userId: PositiveInt,
  products: z.array(PricingProductSchema).min(1).max(10),
  marketContext: z
    .object({
      notes: z.string().max(2000).optional(),
      region: z.string().max(120).optional(),
      competitorPrices: z
        .array(
          z.object({
            competitor: z.string().min(1),
            priceCents: NonNegativeInt,
          })
        )
        .max(10)
        .optional(),
      season: z.string().max(50).optional(),
    })
    .optional(),
});

export const PricingSuggestionSchema = z.object({
  productId: z.string().min(1),
  suggestedPriceCents: NonNegativeInt,
  percentChange: z.number().min(-100).max(500),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1).max(2000),
  guardrails: z.array(z.string().min(1)).max(10).optional().default([]),
});

export const PricingResponseSchema = z.object({
  suggestions: z.array(PricingSuggestionSchema).min(1),
  summary: z.string().min(1).max(2000),
});

export const DataEntitySchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(["customer", "lead", "product", "supplier", "staff", "other"]).default("other"),
  currentData: z.record(z.string(), z.any()).refine(
    (data) => JSON.stringify(data).length <= 4000,
    "currentData must be under 4KB"
  ),
  enrichmentGoals: z.array(z.string().min(1)).max(10).optional(),
});

export const DataEnrichmentRequestSchema = z.object({
  teamId: PositiveInt,
  userId: PositiveInt,
  entities: z.array(DataEntitySchema).min(1).max(5),
  includeSources: z.boolean().default(true),
});

export const DataEnrichmentSchema = z.object({
  entityId: z.string().min(1),
  enrichedFields: z.record(z.string(), z.any()),
  confidence: z.number().min(0).max(1),
  sources: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().url().optional(),
        confidence: z.number().min(0).max(1),
      })
    )
    .max(10)
    .optional(),
  notes: z.string().max(2000).optional(),
});

export const DataEnrichmentResponseSchema = z.object({
  enrichments: z.array(DataEnrichmentSchema),
  summary: z.string().min(1).max(2000),
});

export const TrainingRequestSchema = z.object({
  teamId: PositiveInt,
  userId: PositiveInt,
  topic: z.string().min(1).max(120),
  audience: z.enum(["new-hire", "sales", "operations", "compliance", "custom"]).default("custom"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  durationHours: z.number().min(0.5).max(100).optional(),
  objectives: z.array(z.string().min(1)).min(1).max(10),
  format: z.enum(["document", "syllabus", "presentation", "workshop"]).default("document"),
});

export const TrainingModuleSchema = z.object({
  title: z.string().min(1),
  objectives: z.array(z.string().min(1)).max(10),
  durationMinutes: z.number().min(5).max(600),
  activities: z.array(z.string().min(1)).max(10),
});

export const TrainingResponseSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(2000),
  audience: z.string().min(1),
  difficulty: z.string().min(1),
  estimatedDurationMinutes: z.number().min(5).max(10_000),
  modules: z.array(TrainingModuleSchema).min(1).max(20),
  resources: z.array(z.string().min(1)).max(10).optional().default([]),
});

export const CreditRequestSchema = z.object({
  teamId: PositiveInt,
  userId: PositiveInt,
  customerId: z.string().min(1),
  financials: z.object({
    averageOrderValueCents: NonNegativeInt,
    paymentTermsDays: z.number().int().min(7).max(120),
    repaymentHistory: z.array(z.enum(["on-time", "late", "default"])).min(1).max(12),
    outstandingBalanceCents: NonNegativeInt,
    requestedCreditLineCents: NonNegativeInt,
  }),
  qualitativeNotes: z.string().max(2000).optional(),
});

export const CreditResponseSchema = z.object({
  riskScore: z.number().min(1).max(100),
  riskBand: z.enum(["low", "medium", "high", "critical"]),
  recommendedCreditLineCents: NonNegativeInt,
  recommendedTermsDays: z.number().int().min(7).max(120),
  watchpoints: z.array(z.string().min(1)).max(10),
  rationale: z.string().min(1).max(2000),
  confidence: z.number().min(0).max(1),
});

export type PricingRequest = z.infer<typeof PricingRequestSchema>;
export type PricingResponse = z.infer<typeof PricingResponseSchema>;
export type DataEnrichmentRequest = z.infer<typeof DataEnrichmentRequestSchema>;
export type DataEnrichmentResponse = z.infer<typeof DataEnrichmentResponseSchema>;
export type TrainingRequest = z.infer<typeof TrainingRequestSchema>;
export type TrainingResponse = z.infer<typeof TrainingResponseSchema>;
export type CreditRequest = z.infer<typeof CreditRequestSchema>;
export type CreditResponse = z.infer<typeof CreditResponseSchema>;
