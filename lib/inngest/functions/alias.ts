import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { aliases, users } from "@/lib/db/schema";
import { eq, and, lt, or, isNull, gt } from "drizzle-orm";
import { validateForwarding } from "@/lib/alias/simplelogin";

/**
 * Background job to monitor alias health and delivery status
 * Runs periodically to check for problematic aliases and notify users
 */
export const aliasHealthCheck = inngest.createFunction(
  {
    id: 'alias-health-check',
    name: 'Alias Health Check',
  },
  {
    cron: '0 8 * * *', // Run daily at 8 AM UTC
  },
  async ({ step }) => {
    const results = {
      checked: 0,
      warnings: 0,
      errors: 0,
      deactivated: 0,
      notifications: 0,
    };

    // Step 1: Get all active aliases that haven't been checked recently
    const staleAliases = await step.run('fetch-stale-aliases', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      return await db
        .select({
          id: aliases.id,
          userId: aliases.userId,
          alias: aliases.alias,
          aliasId: aliases.aliasId,
          deliveryStatus: aliases.deliveryStatus,
          bounceCount: aliases.bounceCount,
          lastDeliveryTest: aliases.lastDeliveryTest,
          userEmail: users.email,
        })
        .from(aliases)
        .leftJoin(users, eq(aliases.userId, users.id))
        .where(
          and(
            eq(aliases.active, true),
            // Only check aliases that haven't been tested recently or have unknown/warning status
            or(
              isNull(aliases.lastDeliveryTest),
              lt(aliases.lastDeliveryTest, threeDaysAgo),
              eq(aliases.deliveryStatus, 'unknown'),
              eq(aliases.deliveryStatus, 'warning')
            )
          )
        )
        .limit(100); // Process in batches to avoid overwhelming the system
    });

    // Step 2: Check each alias health
    for (const alias of staleAliases) {
      await step.run(`check-alias-${alias.id}`, async () => {
        results.checked++;

        try {
          const validationResult = await validateForwarding(alias.alias);
          
          // Update the delivery status and test timestamp
          const updateData: any = {
            lastDeliveryTest: new Date(),
            updatedAt: new Date(),
          };

          if (validationResult !== alias.deliveryStatus) {
            updateData.deliveryStatus = validationResult;
          }

          await db
            .update(aliases)
            .set(updateData)
            .where(eq(aliases.id, alias.id));

          // Track results
          if (validationResult === 'warning') {
            results.warnings++;
          } else if (validationResult === 'error') {
            results.errors++;
          }

          // Deactivate aliases with repeated failures
          if (validationResult === 'error' && alias.bounceCount >= 2) {
            await db
              .update(aliases)
              .set({
                active: false,
                deactivatedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(aliases.id, alias.id));
            
            results.deactivated++;

            // Queue notification to user about deactivated alias
            await step.sendEvent('notify-alias-deactivated', {
              name: 'alias/deactivated',
              data: {
                userId: alias.userId,
                userEmail: alias.userEmail,
                alias: alias.alias,
                reason: 'repeated_failures',
                bounceCount: alias.bounceCount,
              },
            });

            results.notifications++;
          }
        } catch (error) {
          console.error(`Failed to check alias ${alias.id}:`, error);
          
          // Mark as error status if validation completely fails
          await db
            .update(aliases)
            .set({
              deliveryStatus: 'error',
              lastDeliveryTest: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(aliases.id, alias.id));
        }
      });
    }

    // Step 3: Check for aliases with high bounce counts that need attention
    await step.run('check-high-bounce-aliases', async () => {
      const highBounceAliases = await db
        .select({
          id: aliases.id,
          userId: aliases.userId,
          alias: aliases.alias,
          bounceCount: aliases.bounceCount,
          userEmail: users.email,
        })
        .from(aliases)
        .leftJoin(users, eq(aliases.userId, users.id))
        .where(
          and(
            eq(aliases.active, true),
            // Aliases with 1 bounce (warning threshold)
            eq(aliases.bounceCount, 1),
            // That bounced recently (last 24 hours)
            gt(aliases.lastBounceAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
        );

      for (const alias of highBounceAliases) {
        // Send warning notification to user
        await step.sendEvent('notify-alias-warning', {
          name: 'alias/warning',
          data: {
            userId: alias.userId,
            userEmail: alias.userEmail,
            alias: alias.alias,
            bounceCount: alias.bounceCount,
            reason: 'delivery_issues',
          },
        });

        results.notifications++;
      }
    });

    return {
      success: true,
      message: `Alias health check completed. Checked: ${results.checked}, Warnings: ${results.warnings}, Errors: ${results.errors}, Deactivated: ${results.deactivated}, Notifications: ${results.notifications}`,
      results,
    };
  }
);

/**
 * Handle alias deactivation notifications
 * Creates in-app notifications for users when their aliases are deactivated
 */
export const notifyAliasDeactivated = inngest.createFunction(
  {
    id: 'notify-alias-deactivated',
    name: 'Notify Alias Deactivated',
  },
  {
    event: 'alias/deactivated',
  },
  async ({ event, step }) => {
    const { userId, userEmail, alias, reason, bounceCount } = event.data;

    // Create in-app notification (assuming you have a notifications system)
    await step.run('create-notification', async () => {
      // This would integrate with your existing notification system
      // For now, we'll just log it and potentially send an email
      
      console.log(`Alias deactivated for user ${userId}: ${alias} (${reason}, ${bounceCount} bounces)`);
      
      // You could integrate with your notification system here:
      // await createNotification({
      //   userId,
      //   type: 'alias_deactivated',
      //   title: 'Privacy Alias Deactivated',
      //   message: `Your privacy alias ${alias} has been deactivated due to delivery issues. Please update your email preferences.`,
      //   data: { alias, reason, bounceCount },
      // });
    });

    return {
      success: true,
      message: `Notification sent for deactivated alias: ${alias}`,
    };
  }
);

/**
 * Handle alias warning notifications
 * Creates in-app notifications for users when their aliases have delivery issues
 */
export const notifyAliasWarning = inngest.createFunction(
  {
    id: 'notify-alias-warning',
    name: 'Notify Alias Warning',
  },
  {
    event: 'alias/warning',
  },
  async ({ event, step }) => {
    const { userId, userEmail, alias, bounceCount, reason } = event.data;

    // Create in-app notification for delivery warning
    await step.run('create-warning-notification', async () => {
      console.log(`Alias warning for user ${userId}: ${alias} (${reason}, ${bounceCount} bounces)`);
      
      // You could integrate with your notification system here:
      // await createNotification({
      //   userId,
      //   type: 'alias_warning',
      //   title: 'Privacy Alias Delivery Warning',
      //   message: `Your privacy alias ${alias} is experiencing delivery issues. Consider updating your email preferences if this continues.`,
      //   data: { alias, reason, bounceCount },
      // });
    });

    return {
      success: true,
      message: `Warning notification sent for alias: ${alias}`,
    };
  }
);