import { NextResponse } from "next/server";
import { z } from "zod";

import { FEATURE_GATES } from "@/lib/feature-gates";
import { generateCreditAssessment } from "@/lib/ai/vercel";
import type { CreditResponse } from "@/lib/ai/schemas";
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
 * Handles the POST request for generating a credit assessment.
 *
 * The function first parses the request body and validates the teamId using TeamIdSchema. If validation fails, it returns a 400 error.
 * It then resolves the AI authorization and enforces the AI gate for the user. After preparing the payload, it attempts to generate a credit assessment.
 * If any errors occur during this process, appropriate error responses are returned based on the type of error encountered.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing either the credit assessment or an error message.
 * @throws HttpError If there is an issue with the HTTP request.
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
    await enforceAiGate(statsigUser, FEATURE_GATES.AI_CREDIT_ENABLED);

    const payload = {
      ...body,
      teamId,
      userId: authContext.user.id,
    };

    let response: CreditResponse;
    try {
      response = await generateCreditAssessment(payload);
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
          ? "AI credit analysis is disabled"
          : "Failed to generate credit assessment";
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
