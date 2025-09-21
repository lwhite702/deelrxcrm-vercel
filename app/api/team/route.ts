import { getTeamForUser } from "@/lib/db/queries";

/**
 * Handles the GET request to retrieve the team for the authenticated user.
 *
 * This function attempts to fetch the team associated with the user by calling
 * the getTeamForUser function. If no team is found, it returns a 404 response
 * indicating that no team exists for the user. In case of an error during the
 * process, it logs the error and returns a 500 response indicating an internal
 * server error.
 */
export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) {
      return Response.json(
        { error: "No team found for user" },
        { status: 404 }
      );
    }
    return Response.json({ team });
  } catch (error) {
    console.error("Team API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
