import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireTenant } from "../middleware/auth";
import { pricingIntelligenceService } from "../llm/pricing-intelligence";
import { creditIntelligenceService } from "../llm/credit-intelligence";
import { dataIntelligenceService } from "../llm/data-intelligence";
import { trainingIntelligenceService } from "../llm/training-intelligence";
import { llmService } from "../llm/llm-service";

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);
router.use(requireTenant);

// ============================================================================
// PRICING INTELLIGENCE ROUTES
// ============================================================================

// Analyze pricing for a product/customer combination
router.post("/pricing/analyze", async (req, res) => {
  try {
    const schema = z.object({
      productId: z.string().optional(),
      customerId: z.string().optional(),
      currentPrice: z.number().optional(),
      quantity: z.number().optional(),
      marketData: z.any().optional()
    });

    const input = schema.parse(req.body);
    const result = await pricingIntelligenceService.analyzePricing(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get pricing suggestions
router.get("/pricing/suggestions", async (req, res) => {
  try {
    const productId = req.query.productId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const suggestions = await pricingIntelligenceService.getPricingSuggestions(
      req.tenant!.id,
      productId,
      limit
    );

    res.json(suggestions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Apply a pricing suggestion
router.post("/pricing/suggestions/:id/apply", async (req, res) => {
  try {
    const schema = z.object({
      feedback: z.string().optional()
    });

    const { feedback } = schema.parse(req.body);
    await pricingIntelligenceService.applyPricingSuggestion(
      req.params.id,
      req.user!.id,
      feedback
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate bulk pricing recommendations
router.post("/pricing/bulk-analyze", async (req, res) => {
  try {
    const recommendations = await pricingIntelligenceService.getBulkPricingRecommendations(
      req.tenant!.id,
      req.user!.id
    );

    res.json(recommendations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// CREDIT INTELLIGENCE ROUTES
// ============================================================================

// Analyze customer credit risk
router.post("/credit/analyze", async (req, res) => {
  try {
    const schema = z.object({
      customerId: z.string(),
      requestedAmount: z.number().optional(),
      includeRecommendations: z.boolean().optional()
    });

    const input = schema.parse(req.body);
    const result = await creditIntelligenceService.analyzeCustomerCredit(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get credit insights
router.get("/credit/insights", async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const insights = await creditIntelligenceService.getCreditInsights(
      req.tenant!.id,
      customerId,
      limit
    );

    res.json(insights);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate adaptive message
router.post("/credit/adaptive-message", async (req, res) => {
  try {
    const schema = z.object({
      customerId: z.string(),
      messageType: z.string(),
      creditInsightId: z.string().optional()
    });

    const { customerId, messageType, creditInsightId } = schema.parse(req.body);
    
    // Get credit insight if provided
    let creditInsight;
    if (creditInsightId) {
      const insights = await creditIntelligenceService.getCreditInsights(req.tenant!.id, customerId, 1);
      creditInsight = insights.find(i => i.id === creditInsightId);
    }

    const message = await creditIntelligenceService.generateAdaptiveMessage(
      req.tenant!.id,
      customerId,
      messageType,
      creditInsight as any
    );

    res.json({ message });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get adaptive messages
router.get("/credit/adaptive-messages", async (req, res) => {
  try {
    const customerId = req.query.customerId as string;
    const messageType = req.query.messageType as string;
    
    const messages = await creditIntelligenceService.getAdaptiveMessages(
      req.tenant!.id,
      customerId,
      messageType
    );

    res.json(messages);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update credit review
router.post("/credit/insights/:id/review", async (req, res) => {
  try {
    const schema = z.object({
      approved: z.boolean(),
      notes: z.string().optional()
    });

    const { approved, notes } = schema.parse(req.body);
    await creditIntelligenceService.updateCreditReview(
      req.params.id,
      req.user!.id,
      approved,
      notes
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate batch credit analyses
router.post("/credit/batch-analyze", async (req, res) => {
  try {
    const analyses = await creditIntelligenceService.generateBatchCreditAnalyses(
      req.tenant!.id,
      req.user!.id
    );

    res.json(analyses);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// DATA INTELLIGENCE ROUTES
// ============================================================================

// Enrich data
router.post("/data/enrich", async (req, res) => {
  try {
    const schema = z.object({
      entityType: z.string(),
      entityId: z.string().optional(),
      originalData: z.any(),
      enrichmentType: z.enum(["normalize", "complete", "validate", "enhance"]).optional()
    });

    const input = schema.parse(req.body);
    const result = await dataIntelligenceService.enrichData(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Apply enrichment
router.post("/data/enrichments/:id/apply", async (req, res) => {
  try {
    const schema = z.object({
      selective: z.array(z.string()).optional()
    });

    const { selective } = schema.parse(req.body);
    await dataIntelligenceService.applyEnrichment(
      req.params.id,
      req.user!.id,
      selective
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reject enrichment
router.post("/data/enrichments/:id/reject", async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string()
    });

    const { reason } = schema.parse(req.body);
    await dataIntelligenceService.rejectEnrichment(req.params.id, reason);

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Clean data
router.post("/data/clean", async (req, res) => {
  try {
    const schema = z.object({
      targetTable: z.string(),
      operationType: z.enum(["deduplication", "normalization", "compliance_check"]),
      scope: z.enum(["all", "recent", "sample"]).optional()
    });

    const input = schema.parse(req.body);
    const result = await dataIntelligenceService.cleanData(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Execute cleaning operation
router.post("/data/cleaning/:id/execute", async (req, res) => {
  try {
    await dataIntelligenceService.executeCleaningOperation(
      req.params.id,
      req.user!.id
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Map product nickname
router.post("/data/map-nickname", async (req, res) => {
  try {
    const schema = z.object({
      nickname: z.string(),
      context: z.string().optional()
    });

    const { nickname, context } = schema.parse(req.body);
    const productId = await dataIntelligenceService.mapProductNickname(
      req.tenant!.id,
      nickname,
      context
    );

    res.json({ productId });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Confirm product mapping
router.post("/data/mappings/:id/confirm", async (req, res) => {
  try {
    const schema = z.object({
      confirmed: z.boolean()
    });

    const { confirmed } = schema.parse(req.body);
    await dataIntelligenceService.confirmProductMapping(
      req.params.id,
      req.user!.id,
      confirmed
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get enrichment history
router.get("/data/enrichments", async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const applied = req.query.applied === "true" ? true : req.query.applied === "false" ? false : undefined;
    
    const history = await dataIntelligenceService.getEnrichmentHistory(
      req.tenant!.id,
      entityType,
      applied
    );

    res.json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get cleaning operations
router.get("/data/cleaning", async (req, res) => {
  try {
    const executed = req.query.executed === "true" ? true : req.query.executed === "false" ? false : undefined;
    
    const operations = await dataIntelligenceService.getCleaningOperations(
      req.tenant!.id,
      executed
    );

    res.json(operations);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get product mappings
router.get("/data/mappings", async (req, res) => {
  try {
    const confirmed = req.query.confirmed === "true" ? true : req.query.confirmed === "false" ? false : undefined;
    
    const mappings = await dataIntelligenceService.getProductMappings(
      req.tenant!.id,
      confirmed
    );

    res.json(mappings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// TRAINING INTELLIGENCE ROUTES
// ============================================================================

// Generate training content
router.post("/training/content/generate", async (req, res) => {
  try {
    const schema = z.object({
      title: z.string(),
      contentType: z.enum(["walkthrough", "simulation", "qa", "explanation"]),
      topic: z.string(),
      targetRole: z.enum(["super_admin", "owner", "manager", "staff"]).optional(),
      context: z.any().optional()
    });

    const input = schema.parse(req.body);
    const result = await trainingIntelligenceService.generateTrainingContent(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start training session
router.post("/training/sessions/start", async (req, res) => {
  try {
    const schema = z.object({
      contentId: z.string().optional(),
      sessionType: z.enum(["onboarding", "feature_training", "assessment"]),
      userQuestions: z.array(z.string()).optional(),
      userContext: z.any().optional()
    });

    const input = schema.parse(req.body);
    const result = await trainingIntelligenceService.startTrainingSession(
      req.tenant!.id,
      req.user!.id,
      input
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Continue training session
router.post("/training/sessions/:id/continue", async (req, res) => {
  try {
    const schema = z.object({
      userInput: z.string(),
      questionType: z.enum(["question", "feedback", "assessment"]).optional()
    });

    const { userInput, questionType } = schema.parse(req.body);
    const result = await trainingIntelligenceService.continueTrainingSession(
      req.params.id,
      userInput,
      questionType
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Complete training session
router.post("/training/sessions/:id/complete", async (req, res) => {
  try {
    const schema = z.object({
      score: z.number().optional(),
      feedback: z.string().optional()
    });

    const { score, feedback } = schema.parse(req.body);
    await trainingIntelligenceService.completeTrainingSession(
      req.params.id,
      score,
      feedback
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get user training history
router.get("/training/history", async (req, res) => {
  try {
    const history = await trainingIntelligenceService.getUserTrainingHistory(
      req.tenant!.id,
      req.user!.id
    );

    res.json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get training content
router.get("/training/content", async (req, res) => {
  try {
    const role = req.query.role as string;
    const contentType = req.query.contentType as string;
    
    const content = await trainingIntelligenceService.getTrainingContent(
      req.tenant!.id,
      role,
      contentType
    );

    res.json(content);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate onboarding plan
router.post("/training/onboarding-plan", async (req, res) => {
  try {
    const schema = z.object({
      userRole: z.string()
    });

    const { userRole } = schema.parse(req.body);
    const plan = await trainingIntelligenceService.generateOnboardingPlan(
      req.tenant!.id,
      req.user!.id,
      userRole
    );

    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate adaptive quiz
router.post("/training/quiz/generate", async (req, res) => {
  try {
    const schema = z.object({
      topic: z.string(),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional()
    });

    const { topic, difficulty } = schema.parse(req.body);
    const quiz = await trainingIntelligenceService.generateAdaptiveQuiz(
      req.tenant!.id,
      req.user!.id,
      topic,
      difficulty
    );

    res.json(quiz);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// GENERAL LLM ROUTES
// ============================================================================

// Get LLM request history
router.get("/requests", async (req, res) => {
  try {
    const type = req.query.type as string;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const history = await llmService.getRequestHistory(
      req.tenant!.id,
      type,
      limit
    );

    res.json(history);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Enable human override
router.post("/requests/:id/override", async (req, res) => {
  try {
    const schema = z.object({
      reason: z.string().optional()
    });

    const { reason } = schema.parse(req.body);
    await llmService.enableHumanOverride(req.params.id, reason);

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;