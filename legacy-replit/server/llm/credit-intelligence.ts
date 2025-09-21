import { llmService } from "./llm-service";
import { db } from "../db";
import { creditAnalyses, customers, credits, creditTransactions, orders, adaptiveMessages } from "../../shared/schema";
import { eq, and, desc, sum, avg, count, gte, lte } from "drizzle-orm";

export interface CreditAnalysisInput {
  customerId: string;
  requestedAmount?: number;
  includeRecommendations?: boolean;
}

export interface CreditInsight {
  id: string;
  customerId: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  summary: string;
  factors: {
    paymentHistory: string;
    frequency: string;
    amounts: string;
    reliability: string;
  };
  recommendations: {
    creditLimit: number;
    paymentTerms: string;
    followUpActions: string[];
  };
  sentiment: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  metrics: {
    lastPaymentDays: number;
    avgPaymentDelay: number;
    totalOutstanding: number;
    paymentConsistency: number;
  };
}

export class CreditIntelligenceService {
  
  async analyzeCustomerCredit(
    tenantId: string,
    userId: string,
    input: CreditAnalysisInput
  ): Promise<CreditInsight> {
    // Gather customer credit history and behavior
    const context = await this.gatherCreditContext(tenantId, input.customerId);
    
    // Build comprehensive credit analysis prompt
    const prompt = this.buildCreditAnalysisPrompt(input, context);
    
    // Get LLM analysis
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "credit_analysis",
      prompt,
      { customerId: input.customerId, requestedAmount: input.requestedAmount }
    );

    // Parse LLM response and create credit analysis
    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse LLM response: Invalid JSON");
    }
    
    const [analysis] = await db.insert(creditAnalyses).values({
      tenantId,
      customerId: input.customerId,
      requestId: llmRequest.id,
      riskScore: llmResponse.risk_score,
      riskLevel: llmResponse.risk_level,
      confidence: llmResponse.confidence,
      summary: llmResponse.summary,
      factors: llmResponse.factors,
      recommendations: llmResponse.recommendations,
      sentiment: llmResponse.sentiment,
      lastPaymentDays: context.metrics.lastPaymentDays,
      avgPaymentDelay: context.metrics.avgPaymentDelay,
      totalOutstanding: context.metrics.totalOutstanding.toString()
    }).returning();

    return {
      id: analysis.id,
      customerId: analysis.customerId,
      riskScore: analysis.riskScore,
      riskLevel: analysis.riskLevel,
      confidence: analysis.confidence,
      summary: analysis.summary,
      factors: analysis.factors as any,
      recommendations: analysis.recommendations as any,
      sentiment: analysis.sentiment!,
      metrics: context.metrics
    };
  }

  async getCreditInsights(tenantId: string, customerId?: string, limit: number = 20) {
    if (customerId) {
      return await db
        .select()
        .from(creditAnalyses)
        .where(and(
          eq(creditAnalyses.tenantId, tenantId),
          eq(creditAnalyses.customerId, customerId)
        ))
        .orderBy(desc(creditAnalyses.createdAt))
        .limit(limit);
    }

    return await db
      .select()
      .from(creditAnalyses)
      .where(eq(creditAnalyses.tenantId, tenantId))
      .orderBy(desc(creditAnalyses.createdAt))
      .limit(limit);
  }

  async generateAdaptiveMessage(
    tenantId: string,
    customerId: string,
    messageType: string,
    creditInsight?: CreditInsight
  ): Promise<string> {
    // Get customer context
    const customer = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, customerId),
        eq(customers.tenantId, tenantId)
      ))
      .limit(1);

    if (!customer.length) {
      throw new Error("Customer not found");
    }

    // Use credit insight or generate one
    let insight = creditInsight;
    if (!insight) {
      insight = await this.analyzeCustomerCredit(tenantId, "system", { customerId });
    }

    // Build personalized message prompt
    const prompt = this.buildMessagePrompt(customer[0], insight, messageType);
    
    // Get LLM to generate personalized message
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      null,
      "training", // Use training type for message generation
      prompt,
      { customerId, messageType, riskLevel: insight.riskLevel }
    );

    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse message generation response: Invalid JSON");
    }
    const messageTemplate = llmResponse.content || "Standard message template";

    // Store adaptive message template
    await db.insert(adaptiveMessages).values({
      tenantId,
      customerId,
      messageType,
      tone: insight.sentiment,
      template: messageTemplate,
      personalization: {
        riskLevel: insight.riskLevel,
        sentiment: insight.sentiment,
        lastPaymentDays: insight.metrics.lastPaymentDays
      },
      confidence: llmResponse.confidence || "medium",
      generatedBy: llmRequest.id
    });

    return messageTemplate;
  }

  async getAdaptiveMessages(tenantId: string, customerId?: string, messageType?: string) {
    let query = db
      .select()
      .from(adaptiveMessages)
      .where(eq(adaptiveMessages.tenantId, tenantId))
      .orderBy(desc(adaptiveMessages.createdAt));

    if (customerId) {
      query = query.where(and(
        eq(adaptiveMessages.tenantId, tenantId),
        eq(adaptiveMessages.customerId, customerId)
      ));
    }

    if (messageType) {
      query = query.where(and(
        eq(adaptiveMessages.tenantId, tenantId),
        eq(adaptiveMessages.messageType, messageType)
      ));
    }

    return await query;
  }

  async updateCreditReview(
    analysisId: string,
    userId: string,
    approved: boolean,
    notes?: string
  ): Promise<void> {
    await db
      .update(creditAnalyses)
      .set({
        humanReviewed: true,
        reviewedAt: new Date(),
        reviewedBy: userId,
        // Store review decision in factors
        factors: { review_approved: approved, review_notes: notes }
      })
      .where(eq(creditAnalyses.id, analysisId));
  }

  private async gatherCreditContext(tenantId: string, customerId: string) {
    const context: any = {};

    // Customer basic info
    const customer = await db
      .select()
      .from(customers)
      .where(and(
        eq(customers.id, customerId),
        eq(customers.tenantId, tenantId)
      ))
      .limit(1);

    if (customer.length) {
      context.customer = customer[0];
    }

    // Credit account info
    const creditAccount = await db
      .select()
      .from(credits)
      .where(and(
        eq(credits.customerId, customerId),
        eq(credits.tenantId, tenantId)
      ))
      .limit(1);

    if (creditAccount.length) {
      context.creditAccount = creditAccount[0];
    }

    // Payment history (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paymentHistory = await db
      .select()
      .from(creditTransactions)
      .where(and(
        eq(creditTransactions.customerId, customerId),
        eq(creditTransactions.tenantId, tenantId),
        gte(creditTransactions.createdAt, sixMonthsAgo)
      ))
      .orderBy(desc(creditTransactions.createdAt));

    context.paymentHistory = paymentHistory;

    // Order history
    const orderHistory = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.customerId, customerId),
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, sixMonthsAgo)
      ))
      .orderBy(desc(orders.createdAt));

    context.orderHistory = orderHistory;

    // Calculate metrics
    context.metrics = this.calculateCreditMetrics(context);

    return context;
  }

  private calculateCreditMetrics(context: any) {
    const metrics = {
      lastPaymentDays: 0,
      avgPaymentDelay: 0,
      totalOutstanding: 0,
      paymentConsistency: 0
    };

    // Last payment calculation
    if (context.paymentHistory && context.paymentHistory.length > 0) {
      const lastPayment = context.paymentHistory[0];
      const daysSinceLastPayment = Math.floor(
        (Date.now() - new Date(lastPayment.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      metrics.lastPaymentDays = daysSinceLastPayment;
    }

    // Outstanding balance
    if (context.creditAccount) {
      metrics.totalOutstanding = parseFloat(context.creditAccount.outstandingBalance || "0");
    }

    // Payment consistency and average delay
    if (context.paymentHistory && context.paymentHistory.length > 1) {
      const paidTransactions = context.paymentHistory.filter((t: any) => t.status === "paid");
      if (paidTransactions.length > 0) {
        metrics.paymentConsistency = (paidTransactions.length / context.paymentHistory.length) * 100;
        
        // Calculate average payment delay (simplified)
        const delays = paidTransactions.map((t: any) => {
          const createdDate = new Date(t.createdAt);
          const paidDate = new Date(t.updatedAt || t.createdAt);
          return Math.floor((paidDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        });
        
        metrics.avgPaymentDelay = delays.reduce((sum, delay) => sum + delay, 0) / delays.length;
      }
    }

    return metrics;
  }

  private buildCreditAnalysisPrompt(input: CreditAnalysisInput, context: any): string {
    let prompt = `Analyze the credit worthiness of this pharmaceutical customer and provide a comprehensive risk assessment:\n\n`;

    // Customer information
    if (context.customer) {
      prompt += `CUSTOMER PROFILE:\n`;
      prompt += `- Name: ${context.customer.name}\n`;
      prompt += `- Type: ${context.customer.type || 'Individual'}\n`;
      prompt += `- Contact: ${context.customer.email || 'N/A'}\n`;
      prompt += `- Member Since: ${new Date(context.customer.createdAt).toLocaleDateString()}\n\n`;
    }

    // Credit account details
    if (context.creditAccount) {
      prompt += `CREDIT ACCOUNT:\n`;
      prompt += `- Current Limit: $${context.creditAccount.creditLimit}\n`;
      prompt += `- Outstanding Balance: $${context.creditAccount.outstandingBalance}\n`;
      prompt += `- Available Credit: $${parseFloat(context.creditAccount.creditLimit) - parseFloat(context.creditAccount.outstandingBalance)}\n`;
      prompt += `- Last Updated: ${new Date(context.creditAccount.updatedAt).toLocaleDateString()}\n\n`;
    }

    // Payment history
    if (context.paymentHistory && context.paymentHistory.length > 0) {
      prompt += `PAYMENT HISTORY (Last 6 months):\n`;
      prompt += `- Total Transactions: ${context.paymentHistory.length}\n`;
      
      const paidCount = context.paymentHistory.filter((t: any) => t.status === "paid").length;
      const overdueCount = context.paymentHistory.filter((t: any) => t.status === "overdue").length;
      
      prompt += `- Paid on Time: ${paidCount}\n`;
      prompt += `- Overdue Payments: ${overdueCount}\n`;
      prompt += `- Payment Consistency: ${((paidCount / context.paymentHistory.length) * 100).toFixed(1)}%\n`;
      prompt += `- Days Since Last Payment: ${context.metrics.lastPaymentDays}\n`;
      prompt += `- Average Payment Delay: ${context.metrics.avgPaymentDelay.toFixed(1)} days\n\n`;
    }

    // Order history
    if (context.orderHistory && context.orderHistory.length > 0) {
      prompt += `ORDER ACTIVITY:\n`;
      prompt += `- Orders (6 months): ${context.orderHistory.length}\n`;
      const totalValue = context.orderHistory.reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount), 0);
      const avgOrderValue = totalValue / context.orderHistory.length;
      prompt += `- Total Order Value: $${totalValue.toFixed(2)}\n`;
      prompt += `- Average Order Value: $${avgOrderValue.toFixed(2)}\n\n`;
    }

    // Request context
    if (input.requestedAmount) {
      prompt += `CREDIT REQUEST:\n`;
      prompt += `- Requested Amount: $${input.requestedAmount}\n\n`;
    }

    prompt += `ANALYSIS REQUIREMENTS:\n`;
    prompt += `Please provide a comprehensive credit risk assessment considering:\n`;
    prompt += `1. Payment history and reliability patterns\n`;
    prompt += `2. Current financial capacity and outstanding obligations\n`;
    prompt += `3. Order frequency and business relationship strength\n`;
    prompt += `4. Risk factors and warning signs\n`;
    prompt += `5. Personalized recommendations for credit terms\n\n`;
    
    prompt += `Include specific recommendations for credit limits, payment terms, and any follow-up actions needed.\n`;

    return prompt;
  }

  private buildMessagePrompt(customer: any, insight: CreditInsight, messageType: string): string {
    let prompt = `Generate a personalized ${messageType} message for this pharmaceutical customer:\n\n`;
    
    prompt += `CUSTOMER: ${customer.name}\n`;
    prompt += `RELATIONSHIP: ${customer.type || 'Standard'} customer\n`;
    prompt += `CREDIT RISK: ${insight.riskLevel} (${insight.riskScore}/100)\n`;
    prompt += `SENTIMENT: ${insight.sentiment}\n`;
    prompt += `LAST PAYMENT: ${insight.metrics.lastPaymentDays} days ago\n`;
    prompt += `OUTSTANDING: $${insight.metrics.totalOutstanding}\n\n`;

    switch (messageType) {
      case "payment_reminder":
        prompt += `Create a professional payment reminder that:\n`;
        prompt += `- Maintains positive customer relationship\n`;
        prompt += `- Adjusts tone based on risk level and payment history\n`;
        prompt += `- Offers support options if appropriate\n`;
        break;
      
      case "credit_follow_up":
        prompt += `Create a credit follow-up message that:\n`;
        prompt += `- Addresses their credit status professionally\n`;
        prompt += `- Provides clear next steps\n`;
        prompt += `- Maintains business relationship\n`;
        break;
      
      case "welcome":
        prompt += `Create a welcome message that:\n`;
        prompt += `- Introduces credit services\n`;
        prompt += `- Sets appropriate expectations\n`;
        prompt += `- Builds confidence in the relationship\n`;
        break;
    }

    prompt += `\nThe message should be professional, empathetic, and appropriate for a pharmaceutical business context.\n`;
    
    return prompt;
  }

  async generateBatchCreditAnalyses(tenantId: string, userId: string) {
    // Get customers with recent activity or outstanding balances
    const activeCustomers = await db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, tenantId))
      .limit(25);

    const analyses = [];

    for (const customer of activeCustomers) {
      try {
        const analysis = await this.analyzeCustomerCredit(tenantId, userId, {
          customerId: customer.id
        });
        analyses.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze credit for customer ${customer.id}:`, error);
      }
    }

    return analyses;
  }
}

export const creditIntelligenceService = new CreditIntelligenceService();