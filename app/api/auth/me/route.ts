import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";

/**
 * Handles the GET request to retrieve the current user.
 *
 * This function attempts to fetch the current user using the getCurrentUser function.
 * If the user is not found, it responds with a 401 status and a null user.
 * In case of an error during the process, it logs the error and returns a 500 status with an error message.
 *
 * @param request - The NextRequest object representing the incoming request.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error getting current user:", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}