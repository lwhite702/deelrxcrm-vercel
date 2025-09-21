import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { kbUploads } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for file storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// File upload validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(
  request: NextRequest
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const teamId = formData.get('teamId') as string;
    const articleId = formData.get('articleId') as string | null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop();
    const filename = `${teamId}/${timestamp}-${randomString}.${extension}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kb-files')
      .upload(filename, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "File upload failed" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kb-files')
      .getPublicUrl(filename);

    // Save upload record to database
    const [newUpload] = await db
      .insert(kbUploads)
      .values({
        teamId,
        articleId: articleId || undefined,
        filename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageUrl: publicUrl,
        uploadedBy: user.id,
        isPublic,
      })
      .returning();

    return NextResponse.json({ 
      upload: newUpload,
      url: publicUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("KB upload POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest
) {
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
      conditions.push(eq(kbUploads.teamId, teamId));
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