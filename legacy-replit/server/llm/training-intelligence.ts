import { llmService } from "./llm-service";
import { db } from "../db";
import { trainingContent, trainingSessions, users } from "../../shared/schema";
import { eq, and, desc, count } from "drizzle-orm";

export interface TrainingContentInput {
  title: string;
  contentType: "walkthrough" | "simulation" | "qa" | "explanation";
  topic: string;
  targetRole?: "super_admin" | "owner" | "manager" | "staff";
  context?: any;
}

export interface TrainingSessionInput {
  contentId?: string;
  sessionType: "onboarding" | "feature_training" | "assessment";
  userQuestions?: string[];
  userContext?: any;
}

export interface TrainingContentResult {
  id: string;
  title: string;
  contentType: string;
  content: string;
  confidence: "low" | "medium" | "high";
  metadata: {
    difficulty: "beginner" | "intermediate" | "advanced";
    estimatedTime: number;
    interactiveElements: string[];
    learningObjectives: string[];
  };
}

export interface TrainingSessionResult {
  id: string;
  sessionType: string;
  content?: TrainingContentResult;
  interactions: any[];
  recommendations: string[];
  nextSteps: string[];
}

export class TrainingIntelligenceService {
  
  async generateTrainingContent(
    tenantId: string,
    userId: string,
    input: TrainingContentInput
  ): Promise<TrainingContentResult> {
    // Build training content generation prompt
    const prompt = this.buildContentPrompt(input);
    
    // Get LLM to generate training content
    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "training",
      prompt,
      { 
        contentType: input.contentType,
        topic: input.topic,
        targetRole: input.targetRole 
      }
    );

    // Parse LLM response
    let llmResponse;
    try {
      llmResponse = JSON.parse(llmRequest.response || "{}");
    } catch (error) {
      throw new Error("Failed to parse LLM response: Invalid JSON");
    }
    
    const [content] = await db.insert(trainingContent).values({
      tenantId,
      title: input.title,
      contentType: input.contentType,
      role: input.targetRole,
      content: llmResponse.content,
      confidence: llmResponse.confidence,
      metadata: llmResponse.metadata || {},
      generatedBy: llmRequest.id
    }).returning();

    return {
      id: content.id,
      title: content.title,
      contentType: content.contentType,
      content: content.content,
      confidence: content.confidence,
      metadata: content.metadata as any
    };
  }

  async startTrainingSession(
    tenantId: string,
    userId: string,
    input: TrainingSessionInput
  ): Promise<TrainingSessionResult> {
    let contentResult: TrainingContentResult | undefined;
    
    // Get or generate content
    if (input.contentId) {
      const content = await db
        .select()
        .from(trainingContent)
        .where(and(
          eq(trainingContent.id, input.contentId),
          eq(trainingContent.tenantId, tenantId)
        ))
        .limit(1);
        
      if (content.length) {
        contentResult = {
          id: content[0].id,
          title: content[0].title,
          contentType: content[0].contentType,
          content: content[0].content,
          confidence: content[0].confidence,
          metadata: content[0].metadata as any
        };
      }
    } else {
      // Generate dynamic content based on session type
      contentResult = await this.generateSessionContent(tenantId, userId, input);
    }

    // Create session record
    const [session] = await db.insert(trainingSessions).values({
      tenantId,
      userId,
      contentId: contentResult?.id,
      sessionType: input.sessionType,
      interactions: input.userQuestions || []
    }).returning();

    // Generate personalized recommendations
    const recommendations = await this.generateSessionRecommendations(
      tenantId, 
      userId, 
      input, 
      contentResult
    );

    return {
      id: session.id,
      sessionType: session.sessionType,
      content: contentResult,
      interactions: session.interactions as any,
      recommendations,
      nextSteps: this.generateNextSteps(input.sessionType, recommendations)
    };
  }

  async continueTrainingSession(
    sessionId: string,
    userInput: string,
    questionType?: "question" | "feedback" | "assessment"
  ): Promise<{
    response: string;
    suggestions: string[];
    completed: boolean;
  }> {
    const session = await db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, sessionId))
      .limit(1);

    if (!session.length) {
      throw new Error("Training session not found");
    }

    const [sessionData] = session;
    
    // Build context-aware response prompt
    const prompt = this.buildInteractionPrompt(sessionData, userInput, questionType);
    
    // Get LLM response
    await llmService.initialize(sessionData.tenantId);
    const llmRequest = await llmService.generateIntelligence(
      sessionData.tenantId,
      sessionData.userId,
      "training",
      prompt,
      { 
        sessionId,
        userInput,
        questionType 
      }
    );

    const llmResponse = JSON.parse(llmRequest.response || "{}");
    
    // Update session with new interaction
    const currentInteractions = sessionData.interactions as any[] || [];
    const newInteractions = [...currentInteractions, {
      timestamp: new Date().toISOString(),
      userInput,
      aiResponse: llmResponse.content,
      type: questionType || "question"
    }];

    await db
      .update(trainingSessions)
      .set({
        interactions: newInteractions,
        timeSpent: (sessionData.timeSpent || 0) + 1 // Simplified time tracking
      })
      .where(eq(trainingSessions.id, sessionId));

    return {
      response: llmResponse.content || "I can help you with that.",
      suggestions: llmResponse.suggestions || [],
      completed: llmResponse.session_completed || false
    };
  }

  async completeTrainingSession(
    sessionId: string,
    score?: number,
    feedback?: string
  ): Promise<void> {
    await db
      .update(trainingSessions)
      .set({
        completed: true,
        completedAt: new Date(),
        score,
        feedback
      })
      .where(eq(trainingSessions.id, sessionId));
  }

  async getUserTrainingHistory(tenantId: string, userId: string) {
    return await db
      .select()
      .from(trainingSessions)
      .where(and(
        eq(trainingSessions.tenantId, tenantId),
        eq(trainingSessions.userId, userId)
      ))
      .orderBy(desc(trainingSessions.startedAt));
  }

  async getTrainingContent(tenantId: string, role?: string, contentType?: string) {
    let query = db
      .select()
      .from(trainingContent)
      .where(and(
        eq(trainingContent.tenantId, tenantId),
        eq(trainingContent.isActive, true)
      ))
      .orderBy(desc(trainingContent.createdAt));

    if (role) {
      query = query.where(and(
        eq(trainingContent.tenantId, tenantId),
        eq(trainingContent.role, role as any)
      ));
    }

    if (contentType) {
      query = query.where(and(
        eq(trainingContent.tenantId, tenantId),
        eq(trainingContent.contentType, contentType)
      ));
    }

    return await query;
  }

  async generateOnboardingPlan(
    tenantId: string,
    userId: string,
    userRole: string
  ): Promise<TrainingContentResult[]> {
    // Get user context
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new Error("User not found");
    }

    // Define onboarding topics based on role
    const topics = this.getOnboardingTopics(userRole);
    const plan = [];

    for (const topic of topics) {
      const content = await this.generateTrainingContent(tenantId, userId, {
        title: `${topic.title} - ${userRole} Guide`,
        contentType: topic.type,
        topic: topic.topic,
        targetRole: userRole as any,
        context: { isOnboarding: true, userRole }
      });
      
      plan.push(content);
    }

    return plan;
  }

  async generateAdaptiveQuiz(
    tenantId: string,
    userId: string,
    topic: string,
    difficulty: "beginner" | "intermediate" | "advanced" = "intermediate"
  ): Promise<{
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
    }>;
    metadata: any;
  }> {
    const prompt = `Generate an adaptive quiz for the topic "${topic}" at ${difficulty} level for a pharmaceutical CRM system.\n\n` +
      `Create 5-7 multiple choice questions that test practical knowledge and understanding.\n` +
      `Include clear explanations for correct answers.\n` +
      `Focus on real-world scenarios and best practices.\n\n` +
      `Format as JSON with questions array containing: question, options (array), correctAnswer, explanation.`;

    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "training",
      prompt,
      { topic, difficulty, contentType: "assessment" }
    );

    const llmResponse = JSON.parse(llmRequest.response || "{}");
    
    return {
      questions: llmResponse.questions || [],
      metadata: {
        topic,
        difficulty,
        estimatedTime: (llmResponse.questions?.length || 5) * 2, // 2 minutes per question
        generatedAt: new Date().toISOString()
      }
    };
  }

  private async generateSessionContent(
    tenantId: string,
    userId: string,
    input: TrainingSessionInput
  ): Promise<TrainingContentResult> {
    let title = "";
    let topic = "";

    switch (input.sessionType) {
      case "onboarding":
        title = "System Onboarding Guide";
        topic = "Getting started with the CRM system, basic navigation, and key features";
        break;
      case "feature_training":
        title = "Feature Deep Dive";
        topic = input.userContext?.feature || "Advanced system features and capabilities";
        break;
      case "assessment":
        title = "Knowledge Assessment";
        topic = "Testing understanding of system concepts and best practices";
        break;
    }

    return await this.generateTrainingContent(tenantId, userId, {
      title,
      contentType: input.sessionType === "assessment" ? "qa" : "walkthrough",
      topic,
      context: input.userContext
    });
  }

  private async generateSessionRecommendations(
    tenantId: string,
    userId: string,
    input: TrainingSessionInput,
    content?: TrainingContentResult
  ): Promise<string[]> {
    // Get user's training history for personalization
    const history = await this.getUserTrainingHistory(tenantId, userId);
    
    const prompt = `Based on this user's training session and history, provide personalized learning recommendations:\n\n` +
      `SESSION TYPE: ${input.sessionType}\n` +
      `CONTENT: ${content?.title || 'Dynamic content'}\n` +
      `USER HISTORY: ${history.length} previous sessions\n` +
      `QUESTIONS: ${input.userQuestions?.join(', ') || 'None'}\n\n` +
      `Provide 3-5 specific, actionable recommendations for continued learning.`;

    await llmService.initialize(tenantId);
    const llmRequest = await llmService.generateIntelligence(
      tenantId,
      userId,
      "training",
      prompt,
      { sessionType: input.sessionType, hasHistory: history.length > 0 }
    );

    const llmResponse = JSON.parse(llmRequest.response || "{}");
    return llmResponse.recommendations || [
      "Review system documentation",
      "Practice with sample data",
      "Take additional assessments"
    ];
  }

  private buildContentPrompt(input: TrainingContentInput): string {
    let prompt = `Create comprehensive training content for a pharmaceutical CRM system:\n\n`;
    
    prompt += `TITLE: ${input.title}\n`;
    prompt += `CONTENT TYPE: ${input.contentType}\n`;
    prompt += `TOPIC: ${input.topic}\n`;
    prompt += `TARGET ROLE: ${input.targetRole || 'All users'}\n\n`;

    switch (input.contentType) {
      case "walkthrough":
        prompt += `Create a step-by-step walkthrough that:\n`;
        prompt += `- Guides users through the process clearly\n`;
        prompt += `- Includes practical examples and screenshots descriptions\n`;
        prompt += `- Anticipates common questions and challenges\n`;
        prompt += `- Provides tips and best practices\n`;
        break;

      case "simulation":
        prompt += `Create an interactive simulation that:\n`;
        prompt += `- Presents realistic scenarios\n`;
        prompt += `- Allows users to make decisions\n`;
        prompt += `- Provides feedback on choices\n`;
        prompt += `- Teaches through hands-on experience\n`;
        break;

      case "qa":
        prompt += `Create a comprehensive Q&A that:\n`;
        prompt += `- Addresses common questions\n`;
        prompt += `- Provides clear, detailed answers\n`;
        prompt += `- Includes troubleshooting guidance\n`;
        prompt += `- Covers edge cases and exceptions\n`;
        break;

      case "explanation":
        prompt += `Create a detailed explanation that:\n`;
        prompt += `- Explains concepts thoroughly\n`;
        prompt += `- Uses clear, non-technical language\n`;
        prompt += `- Includes relevant examples\n`;
        prompt += `- Builds understanding progressively\n`;
        break;
    }

    prompt += `\nThe content should be engaging, practical, and appropriate for the pharmaceutical industry context.\n`;
    
    return prompt;
  }

  private buildInteractionPrompt(
    session: any,
    userInput: string,
    questionType?: string
  ): string {
    let prompt = `You are an AI training assistant for a pharmaceutical CRM system. `;
    prompt += `Continue this training session by responding to the user's input:\n\n`;
    
    prompt += `SESSION TYPE: ${session.sessionType}\n`;
    prompt += `PREVIOUS INTERACTIONS: ${(session.interactions as any[])?.length || 0}\n`;
    prompt += `USER INPUT: "${userInput}"\n`;
    prompt += `INPUT TYPE: ${questionType || 'general'}\n\n`;

    prompt += `Provide a helpful, educational response that:\n`;
    prompt += `- Directly addresses the user's input\n`;
    prompt += `- Provides practical, actionable guidance\n`;
    prompt += `- Maintains an encouraging, supportive tone\n`;
    prompt += `- Suggests next steps or related topics\n`;
    
    if (questionType === "assessment") {
      prompt += `- Evaluates understanding and provides feedback\n`;
    }

    prompt += `\nKeep responses conversational but informative.\n`;
    
    return prompt;
  }

  private getOnboardingTopics(role: string) {
    const baseTopics = [
      { title: "System Overview", type: "explanation" as const, topic: "Introduction to the CRM system and its key capabilities" },
      { title: "Navigation Guide", type: "walkthrough" as const, topic: "How to navigate the interface and find key features" },
      { title: "Basic Operations", type: "simulation" as const, topic: "Performing common tasks and operations" }
    ];

    const roleSpecificTopics: Record<string, any[]> = {
      staff: [
        { title: "Customer Management", type: "walkthrough" as const, topic: "Managing customer information and interactions" },
        { title: "Order Processing", type: "simulation" as const, topic: "Processing orders and handling transactions" }
      ],
      manager: [
        ...baseTopics,
        { title: "Reporting and Analytics", type: "explanation" as const, topic: "Understanding reports and key metrics" },
        { title: "Team Management", type: "walkthrough" as const, topic: "Managing staff and permissions" }
      ],
      owner: [
        ...baseTopics,
        { title: "Business Intelligence", type: "explanation" as const, topic: "Advanced analytics and business insights" },
        { title: "System Configuration", type: "walkthrough" as const, topic: "Configuring system settings and preferences" }
      ],
      super_admin: [
        ...baseTopics,
        { title: "Multi-tenant Management", type: "explanation" as const, topic: "Managing multiple pharmacies and tenants" },
        { title: "Advanced Administration", type: "walkthrough" as const, topic: "System administration and maintenance" }
      ]
    };

    return roleSpecificTopics[role] || baseTopics;
  }

  private generateNextSteps(sessionType: string, recommendations: string[]): string[] {
    const baseSteps = ["Continue practicing", "Review related documentation"];
    
    switch (sessionType) {
      case "onboarding":
        return [
          "Complete remaining onboarding modules",
          "Try hands-on exercises",
          "Connect with your mentor or supervisor"
        ];
      case "feature_training":
        return [
          "Practice using the new feature",
          "Explore advanced options",
          "Share knowledge with teammates"
        ];
      case "assessment":
        return [
          "Review any incorrect answers",
          "Take additional practice quizzes",
          "Schedule follow-up training if needed"
        ];
      default:
        return baseSteps;
    }
  }
}

export const trainingIntelligenceService = new TrainingIntelligenceService();