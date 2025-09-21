import { db } from "../lib/db/drizzle";
import { users, teams, teamMembers } from "../lib/db/schema";

async function checkData() {
  try {
    console.log("=== Users ===");
    const userList = await db.select().from(users);
    console.log(JSON.stringify(userList, null, 2));

    console.log("\n=== Teams ===");
    const teamList = await db.select().from(teams);
    console.log(JSON.stringify(teamList, null, 2));

    console.log("\n=== Team Members ===");
    const memberList = await db.select().from(teamMembers);
    console.log(JSON.stringify(memberList, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkData();
