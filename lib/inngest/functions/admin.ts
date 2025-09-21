import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { 
  purgeOperations, 
  inactivityPolicies, 
  inactivityTrackers, 
  activityEvents, 
  teams, 
  users 
} from "@/lib/db/schema";
import { eq, and, lt, gte, isNull } from "drizzle-orm";

export const adminPurgeScheduled = inngest.createFunction(
  { id: "admin-purge-scheduled" },
  { event: "admin/purge.scheduled" },
  async ({ event, step }) => {
    const { operationId } = event.data;

    // Get the purge operation details
    const operation = await step.run("fetch-purge-operation", async () => {
      const result = await db
        .select()
        .from(purgeOperations)
        .where(eq(purgeOperations.id, operationId))
        .limit(1);
      
      return result[0];
    });

    if (!operation) {
      throw new Error(`Purge operation ${operationId} not found`);
    }

    // Update status to processing
    await step.run("update-status-processing", async () => {
      await db
        .update(purgeOperations)
        .set({ 
          status: "processing",
          startedAt: new Date(),
        })
        .where(eq(purgeOperations.id, operationId));
    });

    try {
      let purgedCount = 0;
      
      // Execute the purge based on criteria
      if (operation.criteria.type === "inactive-teams") {
        purgedCount = await step.run("purge-inactive-teams", async () => {
          const daysInactive = operation.criteria.daysInactive;
          const cutoffDate = new Date(Date.now() - (daysInactive * 24 * 60 * 60 * 1000));

          // Find teams with no recent activity
          const inactiveTeams = await db
            .select({ id: teams.id })
            .from(teams)
            .leftJoin(activityEvents, eq(activityEvents.teamId, teams.id))
            .where(
              and(
                lt(teams.lastActivityAt, cutoffDate),
                isNull(activityEvents.id) // No recent activity events
              )
            );

          // TODO: Implement actual team deletion logic
          // This should cascade delete related data
          console.log(`Would purge ${inactiveTeams.length} inactive teams`);
          
          return inactiveTeams.length;
        });
      } else if (operation.criteria.type === "old-activity-logs") {
        purgedCount = await step.run("purge-old-activity-logs", async () => {
          const daysToKeep = operation.criteria.daysToKeep;
          const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));

          const result = await db
            .delete(activityEvents)
            .where(lt(activityEvents.timestamp, cutoffDate));

          console.log(`Purged activity logs older than ${daysToKeep} days`);
          return result.rowCount || 0;
        });
      }

      // Update operation as completed
      await step.run("update-status-completed", async () => {
        await db
          .update(purgeOperations)
          .set({
            status: "completed",
            completedAt: new Date(),
            recordsPurged: purgedCount,
          })
          .where(eq(purgeOperations.id, operationId));
      });

      // Send completion notification
      await step.run("send-completion-notification", async () => {
        // TODO: Send notification to requester
        console.log(`Purge operation ${operationId} completed. ${purgedCount} records purged.`);
      });

      return { success: true, recordsPurged: purgedCount };

    } catch (error) {
      // Update operation as failed
      await step.run("update-status-failed", async () => {
        await db
          .update(purgeOperations)
          .set({
            status: "failed",
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(purgeOperations.id, operationId));
      });

      throw error;
    }
  }
);

export const adminInactivityScan = inngest.createFunction(
  { id: "admin-inactivity-scan" },
  { cron: "0 4 * * *" }, // Daily at 4 AM
  async ({ event, step }) => {
    // Get all active inactivity policies
    const policies = await step.run("fetch-inactivity-policies", async () => {
      return await db
        .select()
        .from(inactivityPolicies)
        .where(eq(inactivityPolicies.isActive, true));
    });

    const scanResults = [];

    for (const policy of policies) {
      const policyResult = await step.run(`scan-policy-${policy.id}`, async () => {
        const cutoffDate = new Date(Date.now() - (policy.inactiveDays * 24 * 60 * 60 * 1000));

        // Find teams/users that match this policy's inactivity criteria
        const inactiveEntities = await db
          .select({
            teamId: teams.id,
            teamName: teams.name,
            lastActivity: teams.lastActivityAt,
          })
          .from(teams)
          .where(
            and(
              lt(teams.lastActivityAt, cutoffDate),
              eq(teams.isActive, true) // Only check active teams
            )
          );

        // Create or update inactivity trackers
        for (const entity of inactiveEntities) {
          // Check if we already have a tracker for this entity
          const existingTracker = await db
            .select()
            .from(inactivityTrackers)
            .where(
              and(
                eq(inactivityTrackers.teamId, entity.teamId),
                eq(inactivityTrackers.policyId, policy.id)
              )
            )
            .limit(1);

          if (existingTracker.length === 0) {
            // Create new tracker
            await db
              .insert(inactivityTrackers)
              .values({
                teamId: entity.teamId,
                policyId: policy.id,
                detectedAt: new Date(),
                notificationsSent: 0,
                actionTaken: false,
              });

            // Send initial notification
            console.log(`New inactivity detected for team ${entity.teamName} under policy ${policy.name}`);
          } else {
            // Check if we need to take action based on policy
            const tracker = existingTracker[0];
            const daysSinceDetection = Math.floor(
              (Date.now() - tracker.detectedAt.getTime()) / (24 * 60 * 60 * 1000)
            );

            if (!tracker.actionTaken && daysSinceDetection >= policy.gracePeriodDays) {
              // Take action based on policy
              if (policy.actionType === "suspend") {
                await db
                  .update(teams)
                  .set({ isActive: false })
                  .where(eq(teams.id, entity.teamId));
                
                console.log(`Suspended team ${entity.teamName} due to inactivity`);
              } else if (policy.actionType === "delete") {
                // TODO: Implement team deletion
                console.log(`Would delete team ${entity.teamName} due to inactivity`);
              }

              // Update tracker
              await db
                .update(inactivityTrackers)
                .set({ 
                  actionTaken: true,
                  actionTakenAt: new Date(),
                })
                .where(eq(inactivityTrackers.id, tracker.id));
            }
          }
        }

        return {
          policyId: policy.id,
          policyName: policy.name,
          inactiveCount: inactiveEntities.length,
        };
      });

      scanResults.push(policyResult);
    }

    return {
      totalPolicies: policies.length,
      totalInactiveEntities: scanResults.reduce((sum, result) => sum + result.inactiveCount, 0),
      results: scanResults,
    };
  }
);

export const adminSystemHealthCheck = inngest.createFunction(
  { id: "admin-system-health-check" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ event, step }) => {
    const healthChecks = [];

    // Check database connectivity
    const dbHealth = await step.run("check-database-health", async () => {
      try {
        const result = await db.select().from(teams).limit(1);
        return { status: "healthy", message: "Database connection successful" };
      } catch (error) {
        return { 
          status: "unhealthy", 
          message: error instanceof Error ? error.message : "Database connection failed" 
        };
      }
    });
    healthChecks.push({ component: "database", ...dbHealth });

    // Check high activity events (potential issues)
    const activityHealth = await step.run("check-activity-levels", async () => {
      const recentActivity = await db
        .select({ count: "count(*)" })
        .from(activityEvents)
        .where(gte(activityEvents.timestamp, new Date(Date.now() - 60 * 60 * 1000))); // Last hour

      const count = parseInt(recentActivity[0]?.count as string || "0");
      
      if (count > 10000) { // Threshold for high activity
        return { 
          status: "warning", 
          message: `High activity detected: ${count} events in the last hour` 
        };
      } else {
        return { 
          status: "healthy", 
          message: `Normal activity levels: ${count} events in the last hour` 
        };
      }
    });
    healthChecks.push({ component: "activity-levels", ...activityHealth });

    // Check for failed operations
    const operationsHealth = await step.run("check-failed-operations", async () => {
      const failedOps = await db
        .select({ count: "count(*)" })
        .from(purgeOperations)
        .where(
          and(
            eq(purgeOperations.status, "failed"),
            gte(purgeOperations.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
          )
        );

      const count = parseInt(failedOps[0]?.count as string || "0");
      
      if (count > 0) {
        return { 
          status: "warning", 
          message: `${count} failed operations in the last 24 hours` 
        };
      } else {
        return { 
          status: "healthy", 
          message: "No failed operations in the last 24 hours" 
        };
      }
    });
    healthChecks.push({ component: "operations", ...operationsHealth });

    // Send alerts if any components are unhealthy
    const unhealthyComponents = healthChecks.filter(check => check.status === "unhealthy");
    const warningComponents = healthChecks.filter(check => check.status === "warning");

    if (unhealthyComponents.length > 0 || warningComponents.length > 0) {
      await step.run("send-health-alert", async () => {
        // TODO: Send notification to system administrators
        console.log("System health alert:", { unhealthyComponents, warningComponents });
      });
    }

    return {
      timestamp: new Date(),
      overallStatus: unhealthyComponents.length > 0 ? "unhealthy" : 
                    warningComponents.length > 0 ? "warning" : "healthy",
      checks: healthChecks,
    };
  }
);