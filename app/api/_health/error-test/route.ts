import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Handles the GET request for health check.
 *
 * This function checks if the application is running in production mode. If it is, a 404 response is returned indicating that the endpoint is not available. In development mode, it simulates an error to test Sentry's error capturing functionality. The error is captured with relevant tags and extra information, and a JSON response is returned indicating that the error was captured along with the current timestamp and Sentry configuration status.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
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