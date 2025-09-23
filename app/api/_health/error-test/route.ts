import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 }
    );
  }

  try {
    // Capture a test exception
    throw new Error("Test error for Sentry verification");
  } catch (error) {
    // Capture the error with Sentry
    Sentry.captureException(error, {
      tags: {
        component: "health-check",
        test: true,
      },
      extra: {
        endpoint: "/api/_health/error-test",
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json({
      message: "Test error captured by Sentry",
      timestamp: new Date().toISOString(),
      sentryConfigured: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
}