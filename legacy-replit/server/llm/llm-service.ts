import OpenAI from "openai";
import { db } from "../db";
import { llmProviders, llmRequests, llmStatusEnum } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

// LLM Provider Interface
export interface ILlmProvider {
  generateResponse(prompt: string, type: string, metadata?: any): Promise<LlmResponse>;
}

export interface LlmResponse {
  response: string;
  confidence: "low" | "medium" | "high";
  tokens?: number;
  cost?: number;
  processingTime: number;
  metadata?: any;
}

// OpenAI Provider Implementation
export class OpenAIProvider implements ILlmProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateResponse(prompt: string, type: string, metadata?: any): Promise<LlmResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.getSystemPrompt(type);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const processingTime = Date.now() - startTime;
      const content = response.choices[0].message.content;
      
      let parsed = {};
      try {
        parsed = JSON.parse(content || "{}");
      } catch (jsonError) {
        console.error("Failed to parse OpenAI response JSON:", content);
        parsed = { error: "Invalid JSON response", raw_content: content };
      }

      return {
        response: content || "",
        confidence: this.calculateConfidence(parsed, type),
        tokens: response.usage?.total_tokens,
        cost: this.calculateCost(response.usage?.total_tokens || 0),
        processingTime,
        metadata: parsed
      };
    } catch (error: any) {
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  private getSystemPrompt(type: string): string {
    switch (type) {
      case "pricing":
        return `You are a pharmaceutical pricing expert. Analyze pricing requests and provide optimized pricing suggestions with detailed justifications. 
        Respond in JSON format with: {
          "suggested_price": number,
          "justification": "detailed explanation",
          "confidence": "high|medium|low",
          "factors": {
            "market_analysis": "...",
            "competition": "...",
            "customer_history": "...",
            "profit_margin": "..."
          }
        }`;
      
      case "credit_analysis":
        return `You are a credit risk analyst for pharmaceutical businesses. Analyze customer payment patterns and credit worthiness.
        Respond in JSON format with: {
          "risk_score": number (0-100),
          "risk_level": "low|medium|high|critical",
          "confidence": "high|medium|low",
          "summary": "detailed analysis",
          "factors": ["factor1", "factor2"],
          "recommendations": {
            "credit_limit": number,
            "payment_terms": "...",
            "follow_up_actions": ["action1", "action2"]
          },
          "sentiment": "very_positive|positive|neutral|negative|very_negative"
        }`;
      
      case "data_entry":
        return `You are a data enrichment specialist for pharmaceutical CRM systems. Enhance and standardize data entries.
        Respond in JSON format with: {
          "enriched_data": {enhanced data object},
          "confidence": "high|medium|low",
          "changes": [{"field": "...", "old_value": "...", "new_value": "...", "reason": "..."}],
          "suggestions": ["suggestion1", "suggestion2"]
        }`;
      
      case "data_cleaning":
        return `You are a data quality expert specializing in pharmaceutical data compliance and normalization.
        Respond in JSON format with: {
          "summary": "analysis summary",
          "confidence": "high|medium|low",
          "duplicates_found": number,
          "compliance_issues": number,
          "actions": [{"type": "...", "description": "...", "affected_records": number}],
          "audit_log": [{"change": "...", "reason": "...", "compliance_note": "..."}]
        }`;
      
      case "training":
        return `You are an expert trainer for pharmaceutical CRM systems. Create engaging, interactive training content.
        Respond in JSON format with: {
          "content": "training content",
          "content_type": "walkthrough|simulation|qa|explanation",
          "confidence": "high|medium|low",
          "metadata": {
            "difficulty": "beginner|intermediate|advanced",
            "estimated_time": number,
            "interactive_elements": ["element1", "element2"],
            "learning_objectives": ["objective1", "objective2"]
          }
        }`;
      
      default:
        return "You are an AI assistant for a pharmaceutical CRM system. Respond in JSON format.";
    }
  }

  private calculateConfidence(parsed: any, type: string): "low" | "medium" | "high" {
    // Simple confidence calculation based on response completeness
    const confidence = parsed.confidence || "medium";
    return confidence as "low" | "medium" | "high";
  }

  private calculateCost(tokens: number): number {
    // GPT-4o-mini pricing
    const inputCostPer1K = 0.00015;
    const outputCostPer1K = 0.0006;
    return (tokens / 1000) * ((inputCostPer1K + outputCostPer1K) / 2);
  }
}

// Main LLM Service Class
export class LlmService {
  private providers: Map<string, ILlmProvider> = new Map();

  async initialize(tenantId: string) {
    // Load active providers for tenant
    const activeProviders = await db
      .select()
      .from(llmProviders)
      .where(and(
        eq(llmProviders.tenantId, tenantId),
        eq(llmProviders.isActive, true)
      ));

    for (const provider of activeProviders) {
      switch (provider.provider) {
        case "openai":
          this.providers.set(provider.id, new OpenAIProvider(provider.apiKey, provider.model));
          break;
        // Add other providers here
        case "anthropic":
        case "gemini":
        case "xai":
          console.warn(`Provider ${provider.provider} not yet implemented`);
          break;
      }
    }
  }

  async generateIntelligence(
    tenantId: string,
    userId: string | null,
    type: string,
    prompt: string,
    metadata?: any
  ): Promise<typeof llmRequests.$inferSelect> {
    // Get the first available provider (extend this for load balancing)
    const providerId = this.providers.keys().next().value;
    if (!providerId) {
      throw new Error("No active LLM providers configured");
    }

    const provider = this.providers.get(providerId)!;

    // Create request record
    const [request] = await db.insert(llmRequests).values({
      tenantId,
      userId,
      providerId,
      intelligenceType: type as any,
      status: "processing",
      prompt: this.encryptSensitiveData(prompt),
      metadata
    }).returning();

    try {
      // Generate response
      const result = await provider.generateResponse(prompt, type, metadata);

      // Update request with results
      const [updatedRequest] = await db
        .update(llmRequests)
        .set({
          status: "completed",
          response: this.encryptSensitiveData(result.response),
          confidence: result.confidence,
          tokens: result.tokens,
          cost: result.cost?.toString(),
          processingTime: result.processingTime
        })
        .where(eq(llmRequests.id, request.id))
        .returning();

      return updatedRequest;
    } catch (error: any) {
      // Update request with error
      await db
        .update(llmRequests)
        .set({
          status: "error",
          error: error.message
        })
        .where(eq(llmRequests.id, request.id));

      throw error;
    }
  }

  async getRequestHistory(tenantId: string, type?: string, limit: number = 50) {
    if (type) {
      return await db
        .select()
        .from(llmRequests)
        .where(and(
          eq(llmRequests.tenantId, tenantId),
          eq(llmRequests.intelligenceType, type as any)
        ))
        .orderBy(desc(llmRequests.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(llmRequests)
      .where(eq(llmRequests.tenantId, tenantId))
      .orderBy(desc(llmRequests.createdAt))
      .limit(limit);
  }

  async enableHumanOverride(requestId: string, reason?: string) {
    await db
      .update(llmRequests)
      .set({
        status: "human_override",
        humanOverride: true,
        metadata: { override_reason: reason }
      })
      .where(eq(llmRequests.id, requestId));
  }

  private encryptSensitiveData(data: string): string {
    // TODO: Implement proper encryption for sensitive data
    // For now, just return the data as-is
    // In production, use AES encryption with tenant-specific keys
    return data;
  }

  private decryptSensitiveData(encryptedData: string): string {
    // TODO: Implement proper decryption
    return encryptedData;
  }
}

// Singleton instance
export const llmService = new LlmService();