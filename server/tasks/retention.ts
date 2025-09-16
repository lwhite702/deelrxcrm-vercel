import { and, inArray, isNotNull, isNull, lt } from 'drizzle-orm';

import { deleteBlobByUrl } from '../blob';
import { getDb } from '../db';
import { attachments } from '../db/schema';

type AttachmentRow = {
  id: string;
  url: string;
};

/**
 * Deletes blobs associated with the provided attachment rows.
 *
 * This function takes an array of AttachmentRow objects and attempts to delete the blobs by their URLs.
 * It uses Promise.all to handle multiple asynchronous delete operations concurrently.
 * If an error occurs during the deletion of a blob, it logs the error along with the corresponding URL.
 *
 * @param {AttachmentRow[]} rows - An array of AttachmentRow objects containing the URLs of the blobs to be deleted.
 */
async function purgeBlobs(rows: AttachmentRow[]): Promise<void> {
  await Promise.all(
    rows.map(async ({ url }) => {
      try {
        await deleteBlobByUrl(url);
      } catch (error) {
        console.error('Failed to delete blob', { url, error });
      }
    })
  );
}

export async function enforceRetention(retentionDays = 30): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ id: attachments.id, url: attachments.url })
    .from(attachments)
    .where(and(isNull(attachments.deletedAt), lt(attachments.createdAt, cutoff)));

  if (rows.length === 0) {
    return 0;
  }

  await purgeBlobs(rows);

  const now = new Date();
  await db
    .update(attachments)
    .set({ deletedAt: now })
    .where(inArray(attachments.id, rows.map(({ id }) => id)));

  return rows.length;
}

export async function sweepSelfDestructingAttachments(): Promise<number> {
  const db = getDb();
  const now = new Date();

  const rows = await db
    .select({ id: attachments.id, url: attachments.url })
    .from(attachments)
    .where(
      and(
        isNull(attachments.deletedAt),
        isNotNull(attachments.expiresAt),
        lt(attachments.expiresAt, now)
      )
    );

  if (rows.length === 0) {
    return 0;
  }

  await purgeBlobs(rows);

  await db
    .update(attachments)
    .set({ deletedAt: now })
    .where(inArray(attachments.id, rows.map(({ id }) => id)));

  return rows.length;
}
