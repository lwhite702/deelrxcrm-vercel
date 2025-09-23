import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { 
  users, 
  teams, 
  teamMembers, 
  inactivityPolicies, 
  inactivityTrackers,
  activityEvents,
  purgeOperations
} from "@/lib/db/schema";
import { eq, and, lt, sql, desc } from "drizzle-orm";

export const adminPurgeExecute = inngest.createFunction(
  { id: "admin-purge-execute" },
  { event: "admin.purge.execute" },
  async ({ event, step }) => {
    const { operationId } = event.data;

    // Get purge operation details
    const operation = await step.run("get-purge-operation", async () => {
      const [op] = await db
        .select()
        .from(purgeOperations)
        .where(eq(purgeOperations.id, operationId))
        .limit(1);
      return op;
    });

    if (!operation || operation.status !== "scheduled") {
      return { success: false, reason: "Operation not found or not scheduled" };
    }

    // Update status to executing
    await step.run("update-status-executing", async () => {
      await db
        .update(purgeOperations)
        .set({ 
          status: "executing",
          executedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(purgeOperations.id, operationId));
    });

    let recordsAffected = 0;

    try {
      // Execute purge based on scope
      if (operation.purgeScope && typeof operation.purgeScope === 'object') {
        const scope = operation.purgeScope as { entities: string[]; dateRange?: { from: string; to: string } };
        
        recordsAffected = await step.run("execute-purge-operations", async () => {
          let total = 0;
          
          for (const entity of scope.entities) {
            switch (entity) {
              case "customer_data":
                // This would purge customer records - implement carefully
                console.log("Would purge customer data");
                break;
              case "transaction_history":
                // This would purge old transactions - implement carefully
                console.log("Would purge transaction history");
                break;
              case "inactive_accounts":
                // This would purge inactive user accounts
                console.log("Would purge inactive accounts");
                break;
              default:
                console.log(`Unknown purge entity: ${entity}`);
            }
          }
          
          return total;
        });
      }

      // Update operation as completed
      await step.run("update-status-completed", async () => {
        await db
          .update(purgeOperations)
          .set({
            status: "completed",
            recordsAffected,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(purgeOperations.id, operationId));
      });

      return { success: true, recordsAffected };
    } catch (error) {
      // Update operation as failed
      await step.run("update-status-failed", async () => {
        await db
          .update(purgeOperations)
          .set({
            status: "cancelled",
            notes: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(purgeOperations.id, operationId));
      });

      throw error;
    }
  }
);

export const adminInactivityScan = inngest.createFunction(
  { id: "admin-inactivity-scan" },
  { cron: "0 1 * * *" }, // Daily at 1 AM
  async ({ event, step }) => {
    // Get all active inactivity policies
    const policies = await step.run("get-active-policies", async () => {
      return await db
        .select()
        .from(inactivityPolicies)
        .where(eq(inactivityPolicies.isActive, true));
    });

    let totalScanned = 0;
    let totalActioned = 0;

    for (const policy of policies) {
      const result = await step.run(`process-policy-${policy.id}`, async () => {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - policy.thresholdDays);

        // Find users in this team who haven't been active since threshold
        const inactiveUsers = await db
          .select({
            userId: users.id,
            email: users.email,
            name: users.name,
            lastActivity: sql<Date>`MAX(${activityEvents.createdAt})`.as('lastActivity'),
          })
          .from(users)
          .innerJoin(teamMembers, eq(teamMembers.userId, users.id))
          .leftJoin(activityEvents, eq(activityEvents.userId, users.id))
          .where(
            and(
              eq(teamMembers.teamId, policy.teamId),
              lt(sql`COALESCE(MAX(${activityEvents.createdAt}), ${users.createdAt})`, thresholdDate)
            )
          )
          .groupBy(users.id, users.email, users.name);

        let actioned = 0;

        for (const user of inactiveUsers) {
          // Check if we already have a tracker for this user/policy
          const [existingTracker] = await db
            .select()
            .from(inactivityTrackers)
            .where(
              and(
                eq(inactivityTrackers.userId, user.userId),
                eq(inactivityTrackers.policyId, policy.id)
              )
            )
            .limit(1);

          if (!existingTracker) {
            // Create new inactivity tracker
            await db.insert(inactivityTrackers).values({
              teamId: policy.teamId,
              userId: user.userId,
              policyId: policy.id,
              lastActivityAt: user.lastActivity || new Date(0),
              daysSinceActivity: Math.floor((Date.now() - (user.lastActivity?.getTime() || 0)) / (24 * 60 * 60 * 1000)),
              warningsSent: 0,
              isSuspended: false,
            });

            // Apply policy actions
            const actions = policy.actions as { warnings: number[]; suspend: boolean; purge: boolean; };
            
            if (actions.warnings?.length > 0) {
              console.log(`Would send warning to user ${user.userId} for policy ${policy.id}`);
            }
            
            if (actions.suspend) {
              console.log(`Would suspend user ${user.userId} for policy ${policy.id}`);
            }
            
            if (actions.purge) {
              console.log(`Would schedule purge for user ${user.userId} for policy ${policy.id}`);
            }

            actioned++;
          }
        }

        return { scanned: inactiveUsers.length, actioned };
      });

      totalScanned += result.scanned;
      totalActioned += result.actioned;
    }

    // Update policy last run times
    await step.run("update-policy-run-times", async () => {
      for (const policy of policies) {
        await db
          .update(inactivityPolicies)
          .set({ 
            lastRunAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(inactivityPolicies.id, policy.id));
      }
    });

    return {
      policiesProcessed: policies.length,
      totalScanned,
      totalActioned,
      timestamp: new Date().toISOString(),
    };
  }
);

export const adminRetentionEnforce = inngest.createFunction(
  { id: "admin-retention-enforce" },
  { cron: "0 3 * * 0" }, // Weekly on Sundays at 3 AM
  async ({ event, step }) => {
    // Get retention policies that need enforcement
    const retentionResults = await step.run("enforce-retention-policies", async () => {
      // This would implement data retention enforcement
      // For now, we'll just log what would be done
      console.log("Would enforce data retention policies");
      
      // Example: Delete old activity events (keep only last 90 days)
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - 90);
      
      // Count what would be deleted
      const oldEvents = await db
        .select({ count: sql<number>`count(*)` })
        .from(activityEvents)
        .where(lt(activityEvents.createdAt, retentionDate));
      
      return { oldEventsToDelete: oldEvents[0]?.count || 0 };
    });

    return {
      ...retentionResults,
      timestamp: new Date().toISOString(),
    };
  }
);