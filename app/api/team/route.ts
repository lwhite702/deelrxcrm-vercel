import { getTeamForUser } from "@/lib/db/queries";

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
