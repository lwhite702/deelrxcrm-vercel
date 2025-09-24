import { NextResponse } from "next/server";
import { z } from "zod";

import { FEATURE_GATES } from "@/lib/feature-gates";
import { generateTrainingPlan } from "@/lib/ai/vercel";
import type { TrainingResponse } from "@/lib/ai/schemas";
import {
  parseBoundedJson,
  TeamIdSchema,
  resolveAiAuthorization,
  enforceAiGate,
  HttpError,
} from "../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Handles the POST request to generate a training plan.
 *
 * The function first parses the request body and validates the teamId using TeamIdSchema.
 * If validation fails, it returns a 400 error. It then resolves the authorization context
 * and enforces feature gates before generating the training plan. If any errors occur during
 * the process, appropriate error responses are returned based on the type of error encountered.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing either the generated training plan or an error message.
 * @throws HttpError If an HTTP error occurs during processing.
 */
export async function POST(request: Request) {
  try {
    const body = await parseBoundedJson(request);
    const teamParse = TeamIdSchema.safeParse(body);

    if (!teamParse.success) {
      return NextResponse.json(
        { error: "teamId is required and must be a positive integer" },
        { status: 400 }
      );
    }

    const { teamId } = teamParse.data;
    const { authContext, statsigUser } = await resolveAiAuthorization(teamId);
    await enforceAiGate(statsigUser, FEATURE_GATES.AI_TRAINING_ENABLED);

    const payload = {
      ...body,
      teamId,
      userId: authContext.user.id,
    };

    let response: TrainingResponse;
    try {
      response = await generateTrainingPlan(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 422 }
        );
      }

      const status = (error as any)?.statusCode || 500;
      const message =
        status === 403
          ? "AI training generation is disabled"
          : "Failed to generate training plan";
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const status = (error as any)?.statusCode || 500;
    const message =
      status === 413
        ? "Request payload exceeds limit"
        : status === 400
        ? "Malformed request"
        : "Unexpected server error";

    return NextResponse.json({ error: message }, { status });
  }
}
