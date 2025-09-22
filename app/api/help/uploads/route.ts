import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { kbUploads } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";
import { 
  uploadFileToBlob, 
  validateFile, 
  generateUniqueFilename, 
  determineStoreType,
  type BlobStoreType 
} from "@/lib/blob-utils";

// File upload validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const teamId = formData.get("teamId") as string;
    const articleId = formData.get("articleId") as string | null;
    const isPublic = formData.get("isPublic") === "true";
    const context = formData.get("context") as string || "kb-article";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Validate file using utility function
    const validation = validateFile(file, MAX_FILE_SIZE, ALLOWED_MIME_TYPES);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Determine appropriate storage type
    const storeType: BlobStoreType = isPublic ? "public" : determineStoreType(file.type, context as any);
    
    // Generate unique filename
    const filename = generateUniqueFilename(file.name, teamId);

    // Upload to appropriate Vercel Blob store
    try {
      const uploadResult = await uploadFileToBlob(file, {
        teamId,
        filename,
        contentType: file.type,
        storeType,
      });

      const publicUrl = uploadResult.url;

      // Save upload record to database
      const [newUpload] = await db
        .insert(kbUploads)
        .values({
          teamId: parseInt(teamId), // Convert string to integer
          articleId: articleId || undefined,
          filename: uploadResult.filename,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          storageUrl: publicUrl,
          uploadedBy: user.id,
          isPublic: storeType === "public",
        })
        .returning();

      return NextResponse.json(
        {
          upload: newUpload,
          url: publicUrl,
        },
        { status: 201 }
      );
    } catch (uploadError) {
      console.error("Vercel Blob upload error:", uploadError);
      return NextResponse.json(
        { error: "File upload failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("KB upload POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    const articleId = url.searchParams.get("articleId");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [];

    if (teamId) {
      conditions.push(eq(kbUploads.teamId, parseInt(teamId)));
    }

    if (articleId) {
      conditions.push(eq(kbUploads.articleId, articleId));
    }

    const uploads = await db
      .select()
      .from(kbUploads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("KB uploads GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
