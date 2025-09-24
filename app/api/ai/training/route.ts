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
