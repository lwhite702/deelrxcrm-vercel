import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/db/queries";
import { 
  listBlobFiles, 
  migrateFileBetweenStores, 
  deleteFileFromBlob,
  type BlobStoreType 
} from "@/lib/blob-utils";

// Request schemas
const listFilesSchema = z.object({
  storeType: z.enum(["private", "public"]),
  prefix: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

const migrateFileSchema = z.object({
  sourceUrl: z.string().url(),
  sourceStoreType: z.enum(["private", "public"]),
  targetStoreType: z.enum(["private", "public"]),
  newPath: z.string(),
});

const deleteFileSchema = z.object({
  url: z.string().url(),
  storeType: z.enum(["private", "public"]),
});

// GET /api/admin/blob-management - List files in blob stores
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    const url = new URL(request.url);
    const queryParams = {
      storeType: url.searchParams.get("storeType") || "public",
      prefix: url.searchParams.get("prefix") || undefined,
      limit: parseInt(url.searchParams.get("limit") || "50"),
    };

    const validatedParams = listFilesSchema.parse(queryParams);

    const files = await listBlobFiles(
      validatedParams.prefix,
      validatedParams.storeType
    );

    return NextResponse.json({
      storeType: validatedParams.storeType,
      files: files.slice(0, validatedParams.limit),
      count: files.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Blob management GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/blob-management - Migrate files between stores
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    const body = await request.json();
    const validatedData = migrateFileSchema.parse(body);

    const result = await migrateFileBetweenStores(
      validatedData.sourceUrl,
      validatedData.sourceStoreType,
      validatedData.targetStoreType,
      validatedData.newPath
    );

    return NextResponse.json({
      message: "File migrated successfully",
      result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Blob migration error:", error);
    return NextResponse.json(
      { error: "File migration failed" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blob-management - Delete files from blob stores
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add admin role validation

    const url = new URL(request.url);
    const queryParams = {
      url: url.searchParams.get("url"),
      storeType: url.searchParams.get("storeType"),
    };

    if (!queryParams.url || !queryParams.storeType) {
      return NextResponse.json(
        { error: "Missing required parameters: url and storeType" },
        { status: 400 }
      );
    }

    const validatedData = deleteFileSchema.parse(queryParams);

    await deleteFileFromBlob(validatedData.url, validatedData.storeType);

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid parameters", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Blob deletion error:", error);
    return NextResponse.json(
      { error: "File deletion failed" },
      { status: 500 }
    );
  }
}