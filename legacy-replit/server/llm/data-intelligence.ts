import { llmService } from "./llm-service";
import { db } from "../db";
import { dataEnrichments, dataCleaningOperations, productMappings, products, customers } from "../../shared/schema";
import { eq, and, desc, like, ilike, count } from "drizzle-orm";

export interface DataEnrichmentInput {
  entityType: string;
  entityId?: string;
  originalData: any;
  enrichmentType?: "normalize" | "complete" | "validate" | "enhance";
}

export interface DataCleaningInput {
  targetTable: string;
  operationType: "deduplication" | "normalization" | "compliance_check";
  scope?: "all" | "recent" | "sample";
}

export interface EnrichmentResult {
  id: string;
  originalData: any;
  enrichedData: any;
  confidence: "low" | "medium" | "high";
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }>;
  suggestions: string[];
}

export interface CleaningResult {
  id: string;
  summary: string;
  recordsAnalyzed: number;
  recordsAffected: number;
  duplicatesFound?: number;
  complianceIssues?: number;
  actions: Array<{
    type: string;
    description: string;
    affectedRecords: number;
  }>;
}

export class DataIntelligenceService {
  
  async enrichData(
    tenantId: string,
    userId: string,
    input: DataEnrichmentInput
  ): Promise<EnrichmentResult> {
    // Build enrichment prompt based on entity type and data
    const prompt = this.buildEnrichmentPrompt(input);
    
    // Get LLM analysis
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "data_entry",
      prompt,
      { 
        entityType: input.entityType, 
        entityId: input.entityId,
        enrichmentType: input.enrichmentType 
      }
    );

    // Parse LLM response
    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse LLM response: Invalid JSON");
    }
    
    const [enrichment] = await db.insert(dataEnrichments).values({
      tenantId,
      userId,
      requestId: llmRequest.id,
      entityType: input.entityType,
      entityId: input.entityId,
      originalData: input.originalData,
      enrichedData: llmResponse.enriched_data,
      confidence: llmResponse.confidence,
      changes: llmResponse.changes || []
    }).returning();

    return {
      id: enrichment.id,
      originalData: enrichment.originalData,
      enrichedData: enrichment.enrichedData,
      confidence: enrichment.confidence,
      changes: enrichment.changes as any,
      suggestions: llmResponse.suggestions || []
    };
  }

  async applyEnrichment(
    tenantId: string,
    enrichmentId: string,
    userId: string,
    selective?: string[]
  ): Promise<void> {
    const enrichment = await db
      .select()
      .from(dataEnrichments)
      .where(and(
        eq(dataEnrichments.id, enrichmentId),
        eq(dataEnrichments.tenantId, tenantId)
      ))
      .limit(1);

    if (!enrichment.length) {
      throw new Error("Enrichment not found");
    }

    const [data] = enrichment;
    
    // Apply enrichment to actual entity
    if (data.entityType === "customer" && data.entityId) {
      const updatedData = selective 
        ? this.selectiveUpdate(data.originalData, data.enrichedData, selective)
        : data.enrichedData;
        
      await db
        .update(customers)
        .set(updatedData)
        .where(and(
          eq(customers.id, data.entityId),
          eq(customers.tenantId, data.tenantId)
        ));
    } else if (data.entityType === "product" && data.entityId) {
      const updatedData = selective 
        ? this.selectiveUpdate(data.originalData, data.enrichedData, selective)
        : data.enrichedData;
        
      await db
        .update(products)
        .set(updatedData)
        .where(and(
          eq(products.id, data.entityId),
          eq(products.tenantId, data.tenantId)
        ));
    }

    // Mark as applied
    await db
      .update(dataEnrichments)
      .set({
        applied: true,
        appliedAt: new Date(),
        appliedBy: userId
      })
      .where(eq(dataEnrichments.id, enrichmentId));
  }

  async rejectEnrichment(
    tenantId: string,
    enrichmentId: string,
    reason: string
  ): Promise<void> {
    await db
      .update(dataEnrichments)
      .set({
        rejected: true,
        rejectedReason: reason
      })
      .where(and(
        eq(dataEnrichments.id, enrichmentId),
        eq(dataEnrichments.tenantId, tenantId)
      ));
  }

  async cleanData(
    tenantId: string,
    userId: string,
    input: DataCleaningInput
  ): Promise<CleaningResult> {
    // Analyze data quality and build cleaning strategy
    const analysisData = await this.analyzeDataQuality(tenantId, input);
    
    // Build cleaning prompt
    const prompt = this.buildCleaningPrompt(input, analysisData);
    
    // Get LLM analysis
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "data_cleaning",
      prompt,
      { 
        targetTable: input.targetTable,
        operationType: input.operationType,
        scope: input.scope 
      }
    );

    // Parse LLM response
    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse LLM response: Invalid JSON");
    }
    
    const [operation] = await db.insert(dataCleaningOperations).values({
      tenantId,
      requestId: llmRequest.id,
      operationType: input.operationType,
      targetTable: input.targetTable,
      recordsAnalyzed: analysisData.recordCount,
      recordsAffected: llmResponse.records_affected || 0,
      duplicatesFound: llmResponse.duplicates_found,
      complianceIssues: llmResponse.compliance_issues,
      confidence: llmResponse.confidence,
      summary: llmResponse.summary,
      actions: llmResponse.actions || [],
      auditLog: llmResponse.audit_log || []
    }).returning();

    return {
      id: operation.id,
      summary: operation.summary,
      recordsAnalyzed: operation.recordsAnalyzed,
      recordsAffected: operation.recordsAffected,
      duplicatesFound: operation.duplicatesFound || undefined,
      complianceIssues: operation.complianceIssues || undefined,
      actions: operation.actions as any
    };
  }

  async executeCleaningOperation(
    operationId: string,
    userId: string
  ): Promise<void> {
    const operation = await db
      .select()
      .from(dataCleaningOperations)
      .where(eq(dataCleaningOperations.id, operationId))
      .limit(1);

    if (!operation.length) {
      throw new Error("Cleaning operation not found");
    }

    const [cleaningOp] = operation;
    
    // Execute the cleaning actions
    // Note: In a real implementation, you'd apply the specific cleaning logic
    // For now, we'll just mark as executed
    
    await db
      .update(dataCleaningOperations)
      .set({
        executed: true,
        executedAt: new Date(),
        executedBy: userId
      })
      .where(eq(dataCleaningOperations.id, operationId));
  }

  async mapProductNickname(
    tenantId: string,
    nickname: string,
    context?: string
  ): Promise<string | null> {
    // First check existing mappings
    const existingMapping = await db
      .select()
      .from(productMappings)
      .where(and(
        eq(productMappings.tenantId, tenantId),
        eq(productMappings.nickname, nickname),
        eq(productMappings.confirmed, true)
      ))
      .limit(1);

    if (existingMapping.length) {
      return existingMapping[0].productId;
    }

    // Use LLM to find potential matches
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.tenantId, tenantId));

    const prompt = `Find the best matching product for the nickname "${nickname}" from this product catalog:\n\n` +
      allProducts.map((p: any) => `${p.id}: ${p.name} - ${p.description || ''}`).join('\n') +
      `\n\nContext: ${context || 'No additional context'}` +
      `\n\nReturn the product ID that best matches the nickname, or "none" if no good match exists.`;

    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      null,
      "data_entry",
      prompt,
      { nickname, context }
    );

    let llmResponse: any;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      console.error("Failed to parse LLM response for product mapping:", error);
      return null;
    }
    
    const suggestedProductId = llmResponse.product_id;

    if (suggestedProductId && suggestedProductId !== "none") {
      // Create unconfirmed mapping
      await db.insert(productMappings).values({
        tenantId,
        productId: suggestedProductId,
        nickname,
        confidence: llmResponse.confidence || "medium",
        context: context || `Auto-detected from: ${nickname}`,
        requestId: llmRequest.id
      });

      return suggestedProductId;
    }

    return null;
  }

  async confirmProductMapping(
    mappingId: string,
    userId: string,
    confirmed: boolean
  ): Promise<void> {
    await db
      .update(productMappings)
      .set({
        confirmed,
        confirmedBy: userId
      })
      .where(eq(productMappings.id, mappingId));
  }

  async getProductMappings(tenantId: string, confirmed?: boolean) {
    const whereConditions = [eq(productMappings.tenantId, tenantId)];
    
    if (confirmed !== undefined) {
      whereConditions.push(eq(productMappings.confirmed, confirmed));
    }

    return await db
      .select()
      .from(productMappings)
      .where(and(...whereConditions))
      .orderBy(desc(productMappings.createdAt));
  }

  async getEnrichmentHistory(tenantId: string, entityType?: string, applied?: boolean) {
    const whereConditions = [eq(dataEnrichments.tenantId, tenantId)];
    
    if (entityType) {
      whereConditions.push(eq(dataEnrichments.entityType, entityType));
    }
    
    if (applied !== undefined) {
      whereConditions.push(eq(dataEnrichments.applied, applied));
    }

    return await db
      .select()
      .from(dataEnrichments)
      .where(and(...whereConditions))
      .orderBy(desc(dataEnrichments.createdAt))
      .limit(50);
  }

  async getCleaningOperations(tenantId: string, executed?: boolean) {
    const whereConditions = [eq(dataCleaningOperations.tenantId, tenantId)];
    
    if (executed !== undefined) {
      whereConditions.push(eq(dataCleaningOperations.executed, executed));
    }

    return await db
      .select()
      .from(dataCleaningOperations)
      .where(and(...whereConditions))
      .orderBy(desc(dataCleaningOperations.createdAt));
  }

  private buildEnrichmentPrompt(input: DataEnrichmentInput): string {
    let prompt = `Analyze and enrich the following ${input.entityType} data:\n\n`;
    
    prompt += `ORIGINAL DATA:\n${JSON.stringify(input.originalData, null, 2)}\n\n`;
    
    prompt += `ENRICHMENT TYPE: ${input.enrichmentType || 'general'}\n\n`;
    
    switch (input.entityType) {
      case "customer":
        prompt += `For customer data, please:\n`;
        prompt += `- Standardize name formatting and address information\n`;
        prompt += `- Validate and format contact information\n`;
        prompt += `- Infer customer type and categorization\n`;
        prompt += `- Fill in missing standard fields\n`;
        prompt += `- Suggest data quality improvements\n`;
        break;
        
      case "product":
        prompt += `For product data, please:\n`;
        prompt += `- Standardize product naming and descriptions\n`;
        prompt += `- Categorize products appropriately\n`;
        prompt += `- Validate pricing and unit information\n`;
        prompt += `- Enhance product descriptions\n`;
        prompt += `- Suggest missing product attributes\n`;
        break;
        
      default:
        prompt += `Please analyze and enhance the data quality by:\n`;
        prompt += `- Standardizing formats and naming conventions\n`;
        prompt += `- Filling in missing information where appropriate\n`;
        prompt += `- Validating existing data for errors\n`;
        prompt += `- Suggesting improvements and corrections\n`;
    }
    
    prompt += `\nProvide detailed change tracking and justification for all modifications.\n`;
    
    return prompt;
  }

  private buildCleaningPrompt(input: DataCleaningInput, analysisData: any): string {
    let prompt = `Analyze data quality issues and provide cleaning recommendations for ${input.targetTable}:\n\n`;
    
    prompt += `OPERATION TYPE: ${input.operationType}\n`;
    prompt += `RECORDS ANALYZED: ${analysisData.recordCount}\n`;
    prompt += `SCOPE: ${input.scope || 'all'}\n\n`;
    
    if (analysisData.sampleData) {
      prompt += `SAMPLE DATA:\n${JSON.stringify(analysisData.sampleData, null, 2)}\n\n`;
    }
    
    switch (input.operationType) {
      case "deduplication":
        prompt += `Identify potential duplicate records based on:\n`;
        prompt += `- Similar names and contact information\n`;
        prompt += `- Matching key identifiers\n`;
        prompt += `- Proximity in creation dates\n`;
        prompt += `- Data pattern similarities\n`;
        break;
        
      case "normalization":
        prompt += `Normalize data by:\n`;
        prompt += `- Standardizing formats and naming conventions\n`;
        prompt += `- Fixing common data entry errors\n`;
        prompt += `- Applying consistent categorization\n`;
        prompt += `- Validating data integrity\n`;
        break;
        
      case "compliance_check":
        prompt += `Check compliance for:\n`;
        prompt += `- Data privacy and protection requirements\n`;
        prompt += `- Industry-specific regulations\n`;
        prompt += `- Internal data quality standards\n`;
        prompt += `- Required field completeness\n`;
        break;
    }
    
    prompt += `\nProvide specific actionable recommendations with confidence scores.\n`;
    
    return prompt;
  }

  private async analyzeDataQuality(tenantId: string, input: DataCleaningInput) {
    // Get sample data for analysis
    let sampleData: any[] = [];
    let recordCount = 0;

    switch (input.targetTable) {
      case "customers":
        const customerList = await db
          .select()
          .from(customers)
          .where(eq(customers.tenantId, tenantId))
          .limit(10);
        sampleData = customerList;
        
        const customerCount = await db
          .select({ count: count() })
          .from(customers)
          .where(eq(customers.tenantId, tenantId));
        recordCount = customerCount[0]?.count || 0;
        break;
        
      case "products":
        const productList = await db
          .select()
          .from(products)
          .where(eq(products.tenantId, tenantId))
          .limit(10);
        sampleData = productList;
        
        const productCount = await db
          .select({ count: count() })
          .from(products)
          .where(eq(products.tenantId, tenantId));
        recordCount = productCount[0]?.count || 0;
        break;
    }

    return {
      sampleData,
      recordCount
    };
  }

  private selectiveUpdate(original: any, enriched: any, fields: string[]): any {
    const result = { ...original };
    for (const field of fields) {
      if (enriched.hasOwnProperty(field)) {
        result[field] = enriched[field];
      }
    }
    return result;
  }
}

export const dataIntelligenceService = new DataIntelligenceService();