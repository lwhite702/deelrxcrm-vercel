import { getDb } from '../db';
import { activityLogs } from '../db/schema';

interface AuditLogData {
  userId?: number;
  teamId: number;
  action: string;
  ipAddress?: string;
}

export async function writeAuditLog(data: AuditLogData) {
  try {
    const db = getDb();
    await db.insert(activityLogs).values({
      userId: data.userId,
      teamId: data.teamId,
      action: data.action,
      ipAddress: data.ipAddress,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw - audit logging should not break the main flow
  }
}

export function auditMiddleware(action: string) {
  return (req: any, res: any, next: any) => {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user?.teamId) {
        writeAuditLog({
          userId: req.user?.id ? parseInt(req.user.id) : undefined,
          teamId: parseInt(req.user.teamId),
          action: `${action} ${req.method} ${req.path}`,
          ipAddress: req.ip,
        });
      }
    });
    next();
  };
}