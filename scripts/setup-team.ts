import { db } from "../lib/db/drizzle";
import { users, teams, teamMembers } from "../lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Set up the team for the super admin user.
 *
 * This function retrieves the super admin user by their email, checks for existing teams, and either creates a new team or uses an existing one. It then verifies if the super admin is already a member of the team and adds them if not. The process is logged at each step, and any errors encountered will terminate the process.
 *
 * @returns {Promise<void>} A promise that resolves when the team setup is complete.
 * @throws Error If the super admin user is not found or if an error occurs during the setup process.
 */
async function setupTeamForSuperAdmin() {
  try {
    // Find the super admin user
    const superAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "lee@wrelik.com"))
      .limit(1);

    if (superAdmin.length === 0) {
      console.error("Super admin user not found");
      process.exit(1);
    }

    console.log("Found super admin:", superAdmin[0]);

    // Check if there are any teams
    const existingTeams = await db.select().from(teams);
    console.log("Existing teams:", existingTeams);

    let team;
    if (existingTeams.length === 0) {
      // Create a default team
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: "DeelRx CRM",
          planName: "premium",
          subscriptionStatus: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log("Created new team:", newTeam);
      team = newTeam;
    } else {
      team = existingTeams[0];
      console.log("Using existing team:", team);
    }

    // Check if user is already a team member
    const existingMembership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, superAdmin[0].id))
      .limit(1);

    if (existingMembership.length === 0) {
      // Add super admin to the team
      const [membership] = await db
        .insert(teamMembers)
        .values({
          userId: superAdmin[0].id,
          teamId: team.id,
          role: "owner",
          joinedAt: new Date(),
        })
        .returning();

      console.log("Created team membership:", membership);
    } else {
      console.log("User already has team membership:", existingMembership[0]);
    }

    console.log("✅ Team setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up team:", error);
    process.exit(1);
  }
}

setupTeamForSuperAdmin();
