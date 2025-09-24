import { NextResponse } from "next/server";
import { z } from "zod";

import { FEATURE_GATES } from "@/lib/feature-gates";
import { generateDataEnrichments } from "@/lib/ai/vercel";
import type { DataEnrichmentResponse } from "@/lib/ai/schemas";
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
 * Handles the POST request for data enrichment.
 *
 * This function parses the incoming request body, validates the team ID, and resolves authorization context.
 * It then generates data enrichments based on the provided payload. If any validation or processing errors occur,
 * appropriate error responses are returned with relevant status codes.
 *
 * @param request - The incoming HTTP request object.
 * @returns A JSON response containing either the generated data enrichment or an error message.
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
    await enforceAiGate(statsigUser, FEATURE_GATES.AI_DATA_ENABLED);

    const payload = {
      ...body,
      teamId,
      userId: authContext.user.id,
    };

    let response: DataEnrichmentResponse;
    try {
      response = await generateDataEnrichments(payload);
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
          ? "AI data enrichment is disabled"
          : "Failed to generate data enrichment";
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
