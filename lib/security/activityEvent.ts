import { getDb } from '../db';
import { activityEvents } from '../db/schema';

interface ActivityEventData {
  userId: number;
  teamId: number;
  eventType: string;
  eventData: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeActivityEvent(data: ActivityEventData) {
  try {
    const db = getDb();
    await db.insert(activityEvents).values({
      userId: data.userId,
      teamId: data.teamId,
      eventType: data.eventType,
      eventData: data.eventData,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    console.error('Failed to write activity event:', error);
    // Don't throw - activity logging should not break the main flow
  }
}

export function trackActivity(eventType: string) {
  return (req: any, res: any, next: any) => {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user?.id && req.user?.teamId) {
        writeActivityEvent({
          userId: parseInt(req.user.id),
          teamId: parseInt(req.user.teamId),
          eventType,
          eventData: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
    });
    next();
  };
}