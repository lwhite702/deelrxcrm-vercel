import { Router } from 'express';
import multer from 'multer';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { deleteBlobByUrl, uploadBufferToBlob } from '../blob';
import { getDb } from '../db';
import { attachments } from '../db/schema';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

export const uploadsRouter = Router();

uploadsRouter.get('/', async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(attachments)
      .where(isNull(attachments.deletedAt))
      .orderBy(desc(attachments.createdAt))
      .limit(25);

    res.json({ attachments: rows });
  } catch (error) {
    next(error);
  }
});

uploadsRouter.post('/', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    res.status(400).json({ error: 'File is required' });
    return;
  }

  try {
    const db = getDb();
    const { originalname, buffer, mimetype, size } = req.file;
    const { url, pathname } = await uploadBufferToBlob({
      buffer,
      contentType: mimetype,
      filename: originalname,
      prefix: 'uploads'
    });

    const [record] = await db
      .insert(attachments)
      .values({
        filename: originalname,
        mimeType: mimetype,
        size,
        storageKey: pathname,
        url
      })
      .returning();

    res.status(201).json({ attachment: record });
  } catch (error) {
    next(error);
  }
});

uploadsRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const db = getDb();
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)))
      .limit(1);

    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    await deleteBlobByUrl(attachment.url);

    await db
      .update(attachments)
      .set({ deletedAt: new Date() })
      .where(eq(attachments.id, id));

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
