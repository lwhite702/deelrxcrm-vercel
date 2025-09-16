import { Readable } from 'node:stream';

import { del, list, put } from '@vercel/blob';

const DEFAULT_PREFIX = 'uploads';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').replace(/\.\.+\/|\/\.\.+|[.]{2,}/g, '_');
}

function buildPathname(filename: string, prefix = DEFAULT_PREFIX): string {
  const safeName = sanitizeFilename(filename);
  const trimmedPrefix = prefix.replace(/^\/+|\/+$|\s+/g, '');
  const finalPrefix = trimmedPrefix.length > 0 ? `${trimmedPrefix}/` : '';
  return `${finalPrefix}${Date.now()}-${safeName}`;
}

type UploadParams = {
  filename: string;
  buffer: Buffer;
  contentType?: string;
  prefix?: string;
};

export async function uploadBufferToBlob({ filename, buffer, contentType, prefix }: UploadParams): Promise<{
  url: string;
  pathname: string;
}> {
  const pathname = buildPathname(filename, prefix);
  const body = Readable.from(buffer);
  const { url, pathname: storedPathname } = await put(pathname, body, {
    access: 'public',
    contentType,
    addRandomSuffix: true
  });

  return { url, pathname: storedPathname };
}

export async function deleteBlobByUrl(url: string): Promise<void> {
  if (!url) {
    return;
  }

  await del(url);
}

export async function listBlobs(prefix?: string) {
  const result = await list(prefix ? { prefix } : undefined);
  return result.blobs;
}
