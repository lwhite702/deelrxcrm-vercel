import { NextRequest, NextResponse } from "next/server";

/**
 * Handles the GET request for a health check endpoint.
 *
 * This function checks the database connectivity by executing a simple query and verifies the presence of required environment variables.
 * If any environment variables are missing, it returns a 503 response with details. If all checks pass, it returns a healthy status along with the current timestamp, version, and environment.
 *
 * @param request - The incoming NextRequest object.
 * @returns A JSON response indicating the health status of the application.
 * @throws Error If there is an issue with database connectivity or other unexpected errors occur.
 */
export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const { db } = await import("@/lib/db/drizzle");
    await db.execute("SELECT 1");

    // Check environment variables
    const requiredEnvVars = [
      "DATABASE_URL",
      "RESEND_API_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: "Missing environment variables",
          missing: missingEnvVars,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}