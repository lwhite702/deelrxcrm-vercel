// Vercel Blob utilities for dual storage (Private and Public)
import { put, del, list } from "@vercel/blob";

export type BlobStoreType = "private" | "public";

export interface BlobUploadOptions {
  teamId: string;
  filename: string;
  contentType: string;
  storeType: BlobStoreType;
  isPublic?: boolean; // Legacy support, will be overridden by storeType
}

// Configuration for different blob store types
/**
 * Retrieve the configuration for a specified blob store type.
 *
 * The function checks the provided storeType and returns an object containing the appropriate token and prefix based on whether the store type is "private" or "public". If an invalid store type is provided, it throws an error.
 *
 * @param storeType - The type of blob store, which can be either "private" or "public".
 * @returns An object containing the token and prefix for the specified blob store type.
 * @throws Error If the provided store type is invalid.
 */
const getBlobConfig = (storeType: BlobStoreType) => {
  switch (storeType) {
    case "private":
      return {
        token: process.env.BLOB_READ_WRITE_TOKEN_PRIVATE || process.env.BLOB_READ_WRITE_TOKEN,
        prefix: "private",
      };
    case "public":
      return {
        token: process.env.BLOB_READ_WRITE_TOKEN_PUBLIC || process.env.BLOB_READ_WRITE_TOKEN,
        prefix: "public",
      };
    default:
      throw new Error(`Invalid store type: ${storeType}`);
  }
};

/**
 * Uploads a file to a specified blob storage.
 *
 * This function constructs a blob path using the provided teamId and filename,
 * then attempts to upload the file to the blob storage using the put function.
 * It handles errors by logging them and throwing a new error if the upload fails.
 * The upload options include content type and store type, which are used to configure the upload.
 *
 * @param {File} file - The file to be uploaded.
 * @param {BlobUploadOptions} options - Options for the blob upload, including teamId, filename, contentType, and storeType.
 */
export async function uploadFileToBlob(
  file: File,
  options: BlobUploadOptions
): Promise<{ url: string; filename: string; storeType: BlobStoreType }> {
  const { teamId, filename, contentType, storeType } = options;
  const config = getBlobConfig(storeType);
  
  // Generate the blob path with store type prefix
  const blobPath = `${config.prefix}/kb-files/${teamId}/${filename}`;
  
  try {
    const blob = await put(blobPath, file, {
      access: "public", // Note: Vercel Blob only supports public access, privacy controlled via store separation
      contentType,
      token: config.token,
    });

    return {
      url: blob.url,
      filename: blobPath,
      storeType,
    };
  } catch (error) {
    console.error(`Failed to upload file to ${storeType} Vercel Blob:`, error);
    throw new Error(`File upload to ${storeType} store failed`);
  }
}

export async function deleteFileFromBlob(
  url: string, 
  storeType?: BlobStoreType
): Promise<void> {
  try {
    const token = storeType ? getBlobConfig(storeType).token : undefined;
    await del(url, { token });
  } catch (error) {
    console.error(`Failed to delete file from ${storeType || "default"} Vercel Blob:`, error);
    throw new Error("File deletion failed");
  }
}

export async function listBlobFiles(
  prefix?: string, 
  storeType: BlobStoreType = "public"
) {
  try {
    const config = getBlobConfig(storeType);
    const fullPrefix = prefix ? `${config.prefix}/${prefix}` : `${config.prefix}/kb-files/`;
    
    const { blobs } = await list({
      prefix: fullPrefix,
      token: config.token,
    });
    return blobs;
  } catch (error) {
    console.error(`Failed to list ${storeType} blob files:`, error);
    throw new Error("File listing failed");
  }
}

// Helper function to generate unique filename
export function generateUniqueFilename(originalName: string, teamId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

// Helper function to validate file type and size
export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not allowed",
    };
  }

  return { valid: true };
}

// Helper function to determine appropriate store type based on file type and context
export function determineStoreType(
  fileType: string,
  context: "kb-article" | "user-upload" | "invoice" | "receipt" | "legal-doc" | "public-asset"
): BlobStoreType {
  // Sensitive document types that should always be private
  const sensitiveContexts = ["invoice", "receipt", "legal-doc"];
  if (sensitiveContexts.includes(context)) {
    return "private";
  }

  // Public assets and general KB files can be public
  if (context === "public-asset" || context === "kb-article") {
    return "public";
  }

  // User uploads default to private for security
  return "private";
}

// Helper function to get secure access URL for private files
export async function getSecureFileUrl(
  blobUrl: string,
  storeType: BlobStoreType,
  expirationMinutes: number = 60
): Promise<string> {
  if (storeType === "public") {
    return blobUrl; // Public files are directly accessible
  }

  // For private files, return the URL with token (in real implementation, 
  // you might want to generate temporary signed URLs)
  // Note: This is a simplified approach - in production you might want
  // to implement proper signed URL generation
  return blobUrl;
}

// Helper function to migrate files between stores
export async function migrateFileBetweenStores(
  sourceUrl: string,
  sourceStoreType: BlobStoreType,
  targetStoreType: BlobStoreType,
  newPath: string
): Promise<{ url: string; filename: string }> {
  if (sourceStoreType === targetStoreType) {
    throw new Error("Source and target store types are the same");
  }

  try {
    // Download file from source
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const fileBlob = await response.blob();
    const file = new File([fileBlob], newPath.split('/').pop() || 'file', {
      type: fileBlob.type
    });

    // Upload to target store
    const result = await uploadFileToBlob(file, {
      teamId: newPath.split('/')[2] || 'unknown', // Extract teamId from path
      filename: newPath.split('/').pop() || 'file',
      contentType: fileBlob.type,
      storeType: targetStoreType,
    });

    // Delete from source store
    await deleteFileFromBlob(sourceUrl, sourceStoreType);

    return result;
  } catch (error) {
    console.error("File migration failed:", error);
    throw new Error("Failed to migrate file between stores");
  }
}