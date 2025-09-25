import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { performance } from "node:perf_hooks";
import crypto from "node:crypto";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db/drizzle";
import { aiRequests, aiProviders } from "@/lib/db/schema";
import { initializeStatsig, FEATURE_GATES } from "@/lib/feature-gates";
import Statsig from "statsig-node";

// AI Email Models Configuration
const EMAIL_AI_MODEL = process.env.VERCEL_AI_EMAIL_MODEL || "gpt-4o-mini";
const EMAIL_SUBJECT_MODEL = process.env.VERCEL_AI_EMAIL_SUBJECT_MODEL || "gpt-4o-mini";
const EMAIL_BODY_MODEL = process.env.VERCEL_AI_EMAIL_BODY_MODEL || "gpt-4o";
const EMAIL_TEMPLATE_MODEL = process.env.VERCEL_AI_EMAIL_TEMPLATE_MODEL || "gpt-4o-mini";

// Rate limiting and safety constants
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Prohibited content patterns for safety
const PROHIBITED_PATTERNS = [
  /\b(spam|scam|fraud|malware|virus|phishing)\b/i,
  /\b(buy now|act fast|limited time|urgent|immediate action required)\b/i,
  /\b(click here|download now|verify account|confirm identity)\b/i,
  /\b(congratulations|you've won|free money|inheritance|lottery)\b/i,
  /\b(nigerian prince|advance fee|wire transfer|bitcoin|cryptocurrency)\b/i,
];

// Content safety scoring
const SAFETY_THRESHOLD = 0.8;

// Schemas for structured AI responses
const EmailSubjectSchema = z.object({
  subject: z.string().max(MAX_SUBJECT_LENGTH),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  alternatives: z.array(z.string()).max(3),
});

const EmailBodySchema = z.object({
  body: z.string().max(MAX_BODY_LENGTH),
  tone: z.enum(["professional", "friendly", "formal", "casual", "urgent"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  safetyScore: z.number().min(0).max(1),
});

const EmailTemplateSchema = z.object({
  template: z.string(),
  variables: z.array(z.string()),
  structure: z.object({
    header: z.string(),
    body: z.string(),
    footer: z.string(),
    cta: z.string().optional(),
  }),
  confidence: z.number().min(0).max(1),
  recommendations: z.array(z.string()),
});

// Types
export type EmailSubjectGeneration = z.infer<typeof EmailSubjectSchema>;
export type EmailBodyGeneration = z.infer<typeof EmailBodySchema>;
export type EmailTemplateOptimization = z.infer<typeof EmailTemplateSchema>;

interface EmailAiOptions {
  teamId: number;
  userId: number;
  maxTokens?: number;
  temperature?: number;
  retries?: number;
}

interface StatsigUser {
  userID: string;
  email?: string;
  country?: string;
  custom?: Record<string, any>;
}

// Content safety checker
function checkContentSafety(content: string): { safe: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let riskScore = 0;

  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        issues.push(`Prohibited pattern detected: "${match[0]}"`);
        riskScore += 0.3;
      }
    }
  }

  // Check for excessive capitalization (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5) {
    issues.push("Excessive capitalization detected");
    riskScore += 0.2;
  }

  // Check for excessive punctuation
  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    issues.push("Excessive exclamation marks");
    riskScore += 0.1;
  }

  const safetyScore = Math.max(0, 1 - riskScore);
  return {
    safe: safetyScore >= SAFETY_THRESHOLD,
    score: safetyScore,
    issues,
  };
}

// Feature gate enforcement
async function enforceEmailAiGate(
  statsigUser: StatsigUser,
  specificGate: string
): Promise<void> {
  await initializeStatsig();

  // Check kill switch first
  const killSwitch = await Statsig.checkGate(statsigUser, FEATURE_GATES.KILL_AI_EMAIL_SYSTEM);
  if (killSwitch) {
    throw new Error("AI email system is temporarily disabled");
  }

  // Check general AI email gate
  const aiEmailEnabled = await Statsig.checkGate(statsigUser, FEATURE_GATES.AI_EMAIL_ENABLED);
  if (!aiEmailEnabled) {
    throw new Error("AI email functionality is not enabled for this user");
  }

  // Check specific feature gate
  const specificEnabled = await Statsig.checkGate(statsigUser, specificGate);
  if (!specificEnabled) {
    throw new Error(`Specific AI email feature '${specificGate}' is not enabled`);
  }
}

// Request logging
async function logEmailAiRequest(
  teamId: number,
  userId: number,
  feature: string,
  model: string,
  prompt: string,
  response: any,
  success: boolean,
  duration: number,
  error?: string
): Promise<void> {
  try {
    const requestId = crypto.randomUUID();
    
    await db.insert(aiRequests).values({
      id: requestId,
      teamId,
      userId,
      providerId: "vercel-openai-email",
      model,
      prompt: prompt.substring(0, 1000), // Truncate for storage
      response: JSON.stringify(response).substring(0, 2000),
      success,
      duration,
      error: error?.substring(0, 500),
      feature,
    });
  } catch (logError) {
    console.error("Failed to log AI email request:", logError);
  }
}

// Retry mechanism with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Generate email subject lines using AI with safety controls
 */
export async function generateEmailSubject(
  context: {
    purpose: string;
    audience: string;
    tone?: "professional" | "friendly" | "urgent" | "formal";
    keywords?: string[];
    existingContent?: string;
  },
  options: EmailAiOptions
): Promise<EmailSubjectGeneration> {
  const startTime = performance.now();
  const { teamId, userId, temperature = 0.3, maxTokens = 100 } = options;

  const statsigUser: StatsigUser = {
    userID: userId.toString(),
    custom: { teamId, feature: "email_subject_generation" },
  };

  try {
    // Enforce feature gates
    await enforceEmailAiGate(statsigUser, FEATURE_GATES.AI_EMAIL_SUBJECT_GENERATION);

    const prompt = `Generate an effective email subject line for the following context:

Purpose: ${context.purpose}
Audience: ${context.audience}
Tone: ${context.tone || "professional"}
Keywords: ${context.keywords?.join(", ") || "N/A"}
${context.existingContent ? `Existing Content Preview: ${context.existingContent.substring(0, 200)}...` : ""}

Requirements:
- Maximum ${MAX_SUBJECT_LENGTH} characters
- Clear and compelling
- Avoid spam trigger words
- Professional and trustworthy
- Action-oriented when appropriate

Provide the main subject line plus 2-3 alternatives for A/B testing.`;

    const result = await withRetry(async () => {
      return await generateObject({
        model: openai(EMAIL_SUBJECT_MODEL),
        schema: EmailSubjectSchema,
        prompt,
        temperature,
      });
    });

    const generation = result.object;

    // Safety check
    const safetyCheck = checkContentSafety(generation.subject);
    if (!safetyCheck.safe) {
      throw new Error(`Generated subject failed safety check: ${safetyCheck.issues.join(", ")}`);
    }

    // Validate alternatives
    for (const alt of generation.alternatives) {
      const altSafety = checkContentSafety(alt);
      if (!altSafety.safe) {
        console.warn(`Alternative subject failed safety check, removing: ${alt}`);
        generation.alternatives = generation.alternatives.filter(a => a !== alt);
      }
    }

    const duration = performance.now() - startTime;
    await logEmailAiRequest(
      teamId,
      userId,
      "email_subject_generation",
      EMAIL_SUBJECT_MODEL,
      prompt,
      generation,
      true,
      duration
    );

    return generation;

  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logEmailAiRequest(
      teamId,
      userId,
      "email_subject_generation",
      EMAIL_SUBJECT_MODEL,
      context.purpose,
      null,
      false,
      duration,
      errorMessage
    );

    throw new Error(`Email subject generation failed: ${errorMessage}`);
  }
}

/**
 * Generate email body content using AI with comprehensive safety controls
 */
export async function generateEmailBody(
  context: {
    subject: string;
    purpose: string;
    audience: string;
    tone: "professional" | "friendly" | "formal" | "casual" | "urgent";
    keyPoints: string[];
    callToAction?: string;
    constraints?: {
      maxLength?: number;
      includeDisclaimer?: boolean;
      mustInclude?: string[];
      mustAvoid?: string[];
    };
  },
  options: EmailAiOptions
): Promise<EmailBodyGeneration> {
  const startTime = performance.now();
  const { teamId, userId, temperature = 0.4, maxTokens = 2000 } = options;

  const statsigUser: StatsigUser = {
    userID: userId.toString(),
    custom: { teamId, feature: "email_body_generation" },
  };

  try {
    // Enforce feature gates
    await enforceEmailAiGate(statsigUser, FEATURE_GATES.AI_EMAIL_BODY_COMPOSITION);

    const maxLength = context.constraints?.maxLength || MAX_BODY_LENGTH;
    const mustInclude = context.constraints?.mustInclude || [];
    const mustAvoid = context.constraints?.mustAvoid || [];

    const prompt = `Generate a professional email body with the following specifications:

Subject: ${context.subject}
Purpose: ${context.purpose}
Audience: ${context.audience}
Tone: ${context.tone}
Key Points: ${context.keyPoints.join(", ")}
${context.callToAction ? `Call to Action: ${context.callToAction}` : ""}

Constraints:
- Maximum ${maxLength} characters
- Must include: ${mustInclude.join(", ") || "N/A"}
- Must avoid: ${mustAvoid.join(", ") || "N/A"}
${context.constraints?.includeDisclaimer ? "- Include appropriate disclaimer" : ""}

Requirements:
- Clear, scannable structure
- Professional formatting
- Appropriate greeting and closing
- No spam trigger words
- Trustworthy and authentic tone
- Mobile-friendly formatting

The email should be well-structured with proper paragraphs and spacing.`;

    const result = await withRetry(async () => {
      return await generateObject({
        model: openai(EMAIL_BODY_MODEL),
        schema: EmailBodySchema,
        prompt,
        temperature,
      });
    });

    const generation = result.object;

    // Comprehensive safety check
    const safetyCheck = checkContentSafety(generation.body);
    if (!safetyCheck.safe) {
      throw new Error(`Generated email body failed safety check: ${safetyCheck.issues.join(", ")}`);
    }

    // Update safety score in response
    generation.safetyScore = safetyCheck.score;

    // Validate must-include requirements
    for (const required of mustInclude) {
      if (!generation.body.toLowerCase().includes(required.toLowerCase())) {
        throw new Error(`Generated email body missing required content: "${required}"`);
      }
    }

    // Validate must-avoid requirements
    for (const avoided of mustAvoid) {
      if (generation.body.toLowerCase().includes(avoided.toLowerCase())) {
        throw new Error(`Generated email body contains prohibited content: "${avoided}"`);
      }
    }

    const duration = performance.now() - startTime;
    await logEmailAiRequest(
      teamId,
      userId,
      "email_body_generation",
      EMAIL_BODY_MODEL,
      prompt,
      generation,
      true,
      duration
    );

    return generation;

  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logEmailAiRequest(
      teamId,
      userId,
      "email_body_generation",
      EMAIL_BODY_MODEL,
      context.purpose,
      null,
      false,
      duration,
      errorMessage
    );

    throw new Error(`Email body generation failed: ${errorMessage}`);
  }
}

/**
 * Optimize email templates using AI for better performance
 */
export async function optimizeEmailTemplate(
  template: {
    html: string;
    text?: string;
    purpose: string;
    targetMetrics: {
      openRate?: number;
      clickRate?: number;
      conversionRate?: number;
    };
  },
  options: EmailAiOptions
): Promise<EmailTemplateOptimization> {
  const startTime = performance.now();
  const { teamId, userId, temperature = 0.2, maxTokens = 1500 } = options;

  const statsigUser: StatsigUser = {
    userID: userId.toString(),
    custom: { teamId, feature: "email_template_optimization" },
  };

  try {
    // Enforce feature gates
    await enforceEmailAiGate(statsigUser, FEATURE_GATES.AI_EMAIL_TEMPLATE_OPTIMIZATION);

    const prompt = `Analyze and optimize this email template for better performance:

Template HTML: ${template.html.substring(0, 2000)}...
${template.text ? `Template Text: ${template.text.substring(0, 500)}...` : ""}
Purpose: ${template.purpose}
Target Open Rate: ${template.targetMetrics.openRate || "N/A"}%
Target Click Rate: ${template.targetMetrics.clickRate || "N/A"}%
Target Conversion Rate: ${template.targetMetrics.conversionRate || "N/A"}%

Please provide:
1. Optimized template structure
2. Key variables for personalization
3. Specific recommendations for improvement
4. Header, body, footer, and CTA optimizations

Focus on:
- Mobile responsiveness
- Deliverability best practices
- Engagement optimization
- Accessibility compliance
- Performance metrics improvement`;

    const result = await withRetry(async () => {
      return await generateObject({
        model: openai(EMAIL_TEMPLATE_MODEL),
        schema: EmailTemplateSchema,
        prompt,
        temperature,
      });
    });

    const optimization = result.object;

    // Safety check for template content
    const safetyCheck = checkContentSafety(optimization.template);
    if (!safetyCheck.safe) {
      throw new Error(`Optimized template failed safety check: ${safetyCheck.issues.join(", ")}`);
    }

    const duration = performance.now() - startTime;
    await logEmailAiRequest(
      teamId,
      userId,
      "email_template_optimization",
      EMAIL_TEMPLATE_MODEL,
      prompt,
      optimization,
      true,
      duration
    );

    return optimization;

  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logEmailAiRequest(
      teamId,
      userId,
      "email_template_optimization",
      EMAIL_TEMPLATE_MODEL,
      template.purpose,
      null,
      false,
      duration,
      errorMessage
    );

    throw new Error(`Email template optimization failed: ${errorMessage}`);
  }
}

/**
 * Generate personalized email content based on recipient data
 */
export async function generatePersonalizedEmail(
  recipient: {
    name?: string;
    email: string;
    company?: string;
    industry?: string;
    interests?: string[];
    previousInteractions?: string[];
  },
  template: {
    subject: string;
    bodyTemplate: string;
    purpose: string;
  },
  options: EmailAiOptions
): Promise<{ subject: string; body: string; personalizationScore: number }> {
  const startTime = performance.now();
  const { teamId, userId, temperature = 0.3 } = options;

  const statsigUser: StatsigUser = {
    userID: userId.toString(),
    custom: { teamId, feature: "email_personalization" },
  };

  try {
    // Enforce feature gates
    await enforceEmailAiGate(statsigUser, FEATURE_GATES.AI_EMAIL_ENABLED);

    const personalizationData = {
      name: recipient.name || "there",
      company: recipient.company || "your organization",
      industry: recipient.industry || "your industry",
      interests: recipient.interests?.join(", ") || "your interests",
      interactions: recipient.previousInteractions?.join(", ") || "your previous engagement",
    };

    const prompt = `Personalize this email template using the recipient data:

Recipient:
- Name: ${personalizationData.name}
- Email: ${recipient.email}
- Company: ${personalizationData.company}
- Industry: ${personalizationData.industry}
- Interests: ${personalizationData.interests}
- Previous Interactions: ${personalizationData.interactions}

Template:
Subject: ${template.subject}
Body: ${template.bodyTemplate}
Purpose: ${template.purpose}

Personalize the content while maintaining professionalism and authenticity. Make it relevant to their industry and interests without being overly familiar.`;

    const result = await generateText({
      model: openai(EMAIL_AI_MODEL),
      prompt,
      temperature,
    });

    // Parse the generated content
    const lines = result.text.split('\n');
    const subjectLine = lines.find(line => line.startsWith('Subject:'))?.replace('Subject:', '').trim() || template.subject;
    const bodyContent = lines.slice(1).join('\n').trim();

    // Calculate personalization score based on usage of recipient data
    let personalizationScore = 0;
    if (bodyContent.includes(recipient.name || '')) personalizationScore += 0.3;
    if (bodyContent.includes(recipient.company || '')) personalizationScore += 0.25;
    if (bodyContent.includes(recipient.industry || '')) personalizationScore += 0.2;
    if (recipient.interests?.some(interest => bodyContent.includes(interest))) personalizationScore += 0.25;

    // Safety checks
    const subjectSafety = checkContentSafety(subjectLine);
    const bodySafety = checkContentSafety(bodyContent);

    if (!subjectSafety.safe || !bodySafety.safe) {
      throw new Error("Personalized email failed safety checks");
    }

    const duration = performance.now() - startTime;
    await logEmailAiRequest(
      teamId,
      userId,
      "email_personalization",
      EMAIL_AI_MODEL,
      prompt,
      { subject: subjectLine, body: bodyContent, score: personalizationScore },
      true,
      duration
    );

    return {
      subject: subjectLine,
      body: bodyContent,
      personalizationScore: Math.min(1, personalizationScore),
    };

  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    await logEmailAiRequest(
      teamId,
      userId,
      "email_personalization",
      EMAIL_AI_MODEL,
      template.purpose,
      null,
      false,
      duration,
      errorMessage
    );

    throw new Error(`Email personalization failed: ${errorMessage}`);
  }
}

// Export safety utilities for testing
export const emailAiUtils = {
  checkContentSafety,
  PROHIBITED_PATTERNS,
  SAFETY_THRESHOLD,
  MAX_SUBJECT_LENGTH,
  MAX_BODY_LENGTH,
};