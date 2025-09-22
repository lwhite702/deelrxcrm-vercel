import { inngest } from "../client";

// TODO: Fix schema mismatches - all admin functions temporarily disabled
// The admin functions were written for a different schema version and need to be updated
// to match the current database schema.

export const adminPurgeExecute = inngest.createFunction(
  { id: "admin-purge-execute" },
  { event: "admin.purge.execute" },
  async ({ event, step }) => {
    // Temporarily disabled due to schema mismatches
    return { message: "Admin purge function temporarily disabled - needs schema updates" };
  }
);

export const adminInactivityCheck = inngest.createFunction(
  { id: "admin-inactivity-check" },
  { cron: "0 1 * * *" }, // Daily at 1 AM
  async ({ event, step }) => {
    // Temporarily disabled due to schema mismatches
    return { message: "Admin inactivity check function temporarily disabled - needs schema updates" };
  }
);

export const adminRetentionEnforce = inngest.createFunction(
  { id: "admin-retention-enforce" },
  { cron: "0 3 * * 0" }, // Weekly on Sundays at 3 AM
  async ({ event, step }) => {
    // Temporarily disabled due to schema mismatches
    return { message: "Admin retention enforce function temporarily disabled - needs schema updates" };
  }
);