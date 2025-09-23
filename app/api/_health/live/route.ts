import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Simple liveness check - just return OK if the process is running
  return NextResponse.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
  });
}