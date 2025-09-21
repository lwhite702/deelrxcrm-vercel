import { db } from "@/lib/db/drizzle";
import { users, teams, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Handles the GET request to perform database operations and return user and team information.
 *
 * This function tests the database connection, retrieves users, teams, and team members, and checks for the existence of a super admin.
 * If the super admin does not exist, it returns a 404 error. It also creates a default team if none exists and assigns the super admin as a member if needed.
 * Finally, it returns a JSON response containing user, team, membership, and statistics about users, teams, and members.
 *
 * @returns A JSON response containing success status and relevant data.
 * @throws Error If a database error occurs during the operations.
 */
export async function GET() {
  try {
    console.log("=== Database Debug Info ===");
    console.log(
      "DATABASE_URL:",
      process.env.DATABASE_URL?.substring(0, 50) + "..."
    );

    // Test basic connection
    console.log("Testing database connection...");

    // Check users
    const userList = await db.select().from(users);
    console.log("Users found:", userList.length);

    // Find super admin
    const superAdmin = userList.find((u) => u.email === "lee@wrelik.com");
    console.log("Super admin found:", !!superAdmin);

    if (!superAdmin) {
      return NextResponse.json(
        { error: "Super admin not found" },
        { status: 404 }
      );
    }

    // Check teams
    const teamList = await db.select().from(teams);
    console.log("Teams found:", teamList.length);

    // Check team members
    const memberList = await db.select().from(teamMembers);
    console.log("Team members found:", memberList.length);

    // Find if super admin has team membership
    const membership = memberList.find((m) => m.userId === superAdmin.id);
    console.log("Super admin has team membership:", !!membership);

    let team = teamList[0];

    // Create team if needed
    if (teamList.length === 0) {
      console.log("Creating default team...");
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: "DeelRx CRM",
          planName: "premium",
          subscriptionStatus: "active",
        })
        .returning();

      team = newTeam;
      console.log("Created team:", team.id);
    }

    // Create team membership if needed
    if (!membership && team) {
      console.log("Creating team membership...");
      const [newMembership] = await db
        .insert(teamMembers)
        .values({
          userId: superAdmin.id,
          teamId: team.id,
          role: "owner",
        })
        .returning();

      console.log("Created membership:", newMembership.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
        },
        team: team
          ? {
              id: team.id,
              name: team.name,
              planName: team.planName,
            }
          : null,
        membership: membership || "created",
        stats: {
          totalUsers: userList.length,
          totalTeams: teamList.length,
          totalMembers: memberList.length,
        },
      },
    });
  } catch (error) {
    console.error("Database debug error:", error);
    return NextResponse.json(
      {
        error: "Database error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
