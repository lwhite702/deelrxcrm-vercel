import { llmService } from "./llm-service";
import { db } from "../db";
import { pricingSuggestions, products, customers, orders, orderItems } from "../../shared/schema";
import { eq, and, desc, avg, count } from "drizzle-orm";

export interface PricingAnalysisInput {
  productId?: string;
  customerId?: string;
  currentPrice?: number;
  quantity?: number;
  marketData?: any;
}

export interface PricingRecommendation {
  id: string;
  suggestedPrice: number;
  currentPrice?: number;
  confidence: "low" | "medium" | "high";
  justification: string;
  factors: {
    marketAnalysis: string;
    competition: string;
    customerHistory: string;
    profitMargin: string;
    seasonality?: string;
  };
  impact: {
    estimatedRevenue: number;
    marginImprovement: number;
    customerRetention: number;
  };
}

export class PricingIntelligenceService {
  
  async analyzePricing(
    tenantId: string,
    userId: string,
    input: PricingAnalysisInput
  ): Promise<PricingRecommendation> {
    // Gather context data
    const context = await this.gatherPricingContext(tenantId, input);
    
    // Build comprehensive prompt
    const prompt = this.buildPricingPrompt(input, context);
    
    // Get LLM analysis
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "pricing",
      prompt,
      { productId: input.productId, customerId: input.customerId }
    );

    // Parse LLM response and create pricing suggestion
    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse LLM response: Invalid JSON");
    }
    
    const [suggestion] = await db.insert(pricingSuggestions).values({
      tenantId,
      productId: input.productId,
      customerId: input.customerId,
      requestId: llmRequest.id,
      currentPrice: input.currentPrice?.toString(),
      suggestedPrice: llmResponse.suggested_price?.toString(),
      confidence: llmResponse.confidence,
      justification: llmResponse.justification,
      factors: llmResponse.factors
    }).returning();

    return {
      id: suggestion.id,
      suggestedPrice: parseFloat(suggestion.suggestedPrice),
      currentPrice: input.currentPrice,
      confidence: suggestion.confidence,
      justification: suggestion.justification,
      factors: suggestion.factors as any,
      impact: this.calculateImpact(llmResponse, context)
    };
  }

  async getPricingSuggestions(tenantId: string, productId?: string, limit: number = 10) {
    if (productId) {
      return await db
        .select()
        .from(pricingSuggestions)
        .where(and(
          eq(pricingSuggestions.tenantId, tenantId),
          eq(pricingSuggestions.productId, productId)
        ))
        .orderBy(desc(pricingSuggestions.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(pricingSuggestions)
      .where(eq(pricingSuggestions.tenantId, tenantId))
      .orderBy(desc(pricingSuggestions.createdAt))
      .limit(limit);
  }

  async applyPricingSuggestion(
    tenantId: string,
    suggestionId: string,
    userId: string,
    feedback?: string
  ): Promise<void> {
    const suggestion = await db
      .select()
      .from(pricingSuggestions)
      .where(and(
        eq(pricingSuggestions.id, suggestionId),
        eq(pricingSuggestions.tenantId, tenantId)
      ))
      .limit(1);

    if (!suggestion.length) {
      throw new Error("Pricing suggestion not found");
    }

    const [pricingSuggestion] = suggestion;

    // Note: Products don't have a price column in the schema
    // Pricing is managed through order items with unitPrice
    // This suggestion will be stored for future use when creating orders

    // Mark suggestion as applied
    await db
      .update(pricingSuggestions)
      .set({
        applied: true,
        appliedAt: new Date(),
        appliedBy: userId,
        feedback
      })
      .where(eq(pricingSuggestions.id, suggestionId));
  }

  private async gatherPricingContext(tenantId: string, input: PricingAnalysisInput) {
    const context: any = {};

    // Product information
    if (input.productId) {
      const product = await db
        .select()
        .from(products)
        .where(and(
          eq(products.id, input.productId),
          eq(products.tenantId, tenantId)
        ))
        .limit(1);

      if (product.length) {
        context.product = product[0];
      }
    }

    // Customer history
    if (input.customerId) {
      const customer = await db
        .select()
        .from(customers)
        .where(and(
          eq(customers.id, input.customerId),
          eq(customers.tenantId, tenantId)
        ))
        .limit(1);

      if (customer.length) {
        context.customer = customer[0];

        // Customer purchase history
        const purchaseHistory = await db
          .select({
            orderId: orders.id,
            orderDate: orders.createdAt,
            total: orders.total,
            productId: orderItems.productId,
            qty: orderItems.qty,
            unitPrice: orderItems.unitPrice
          })
          .from(orders)
          .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
          .where(and(
            eq(orders.tenantId, tenantId),
            eq(orders.customerId, input.customerId!)
          ))
          .orderBy(desc(orders.createdAt))
          .limit(20);

        context.customerHistory = purchaseHistory;
      }
    }

    // Market analysis for the product
    if (input.productId) {
      const marketData = await db
        .select({
          avgPrice: avg(orderItems.unitPrice),
          totalOrders: count(orderItems.id)
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
          eq(orders.tenantId, tenantId),
          eq(orderItems.productId, input.productId)
        ));

      context.marketData = marketData[0];
    }

    return context;
  }

  private buildPricingPrompt(input: PricingAnalysisInput, context: any): string {
    let prompt = `Analyze the following pricing scenario for a pharmaceutical product and provide an optimized pricing recommendation:\n\n`;

    // Product details
    if (context.product) {
      prompt += `PRODUCT INFORMATION:\n`;
      prompt += `- Name: ${context.product.name}\n`;
      prompt += `- Current Price: $${input.currentPrice || context.marketData?.avgPrice || 'N/A'}\n`;
      prompt += `- Category: ${context.product.category || 'General'}\n`;
      prompt += `- Description: ${context.product.description || 'N/A'}\n\n`;
    }

    // Customer context
    if (context.customer) {
      prompt += `CUSTOMER PROFILE:\n`;
      prompt += `- Name: ${context.customer.name}\n`;
      prompt += `- Type: ${context.customer.type || 'Individual'}\n`;
      prompt += `- Purchase History: ${context.customerHistory?.length || 0} orders\n`;
      if (context.customerHistory?.length > 0) {
        const avgOrder = context.customerHistory.reduce((sum: number, order: any) => sum + parseFloat(order.unitPrice || 0) * (order.qty || 1), 0) / context.customerHistory.length;
        prompt += `- Average Order Value: $${avgOrder.toFixed(2)}\n`;
      }
      prompt += `\n`;
    }

    // Market data
    if (context.marketData) {
      prompt += `MARKET ANALYSIS:\n`;
      prompt += `- Average Market Price: $${context.marketData.avgPrice || 'N/A'}\n`;
      prompt += `- Total Market Orders: ${context.marketData.totalOrders || 0}\n\n`;
    }

    // Request parameters
    if (input.quantity) {
      prompt += `ORDER DETAILS:\n`;
      prompt += `- Requested Quantity: ${input.quantity}\n\n`;
    }

    prompt += `INSTRUCTIONS:\n`;
    prompt += `Please analyze this pricing scenario considering:\n`;
    prompt += `1. Market competitiveness and positioning\n`;
    prompt += `2. Customer relationship and purchase history\n`;
    prompt += `3. Product value proposition and margins\n`;
    prompt += `4. Volume discounts and quantity breaks\n`;
    prompt += `5. Regulatory compliance and industry standards\n\n`;
    
    prompt += `Provide a comprehensive pricing recommendation with clear justification.\n`;

    return prompt;
  }

  private calculateImpact(llmResponse: any, context: any) {
    // Simple impact calculation - can be enhanced with more sophisticated modeling
    const currentPrice = context.marketData?.avgPrice || 0;
    const suggestedPrice = llmResponse.suggested_price || currentPrice;
    const priceChange = suggestedPrice - currentPrice;
    
    // Prevent divide by zero error
    const marginImprovement = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;
    
    return {
      estimatedRevenue: priceChange * (context.marketData?.totalOrders || 1),
      marginImprovement,
      customerRetention: priceChange > 0 ? 95 : 105 // Simple heuristic
    };
  }

  async getBulkPricingRecommendations(tenantId: string, userId: string) {
    // Get all products and generate batch pricing recommendations
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.tenantId, tenantId))
      .limit(50);

    const recommendations = [];

    for (const product of allProducts) {
      try {
        const recommendation = await this.analyzePricing(tenantId, userId, {
          productId: product.id,
          currentPrice: 0 // Products don't have price column, will use market data
        });
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Failed to analyze pricing for product ${product.id}:`, error);
      }
    }

    return recommendations;
  }
}

export const pricingIntelligenceService = new PricingIntelligenceService();