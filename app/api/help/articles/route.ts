import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { kbArticles } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

const updateArticleSchema = createArticleSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const isPublic = url.searchParams.get("public");
    const limit = Math.min(
      parseInt(url.searchParams.get("limit") || "50"),
      100
    );
    const offset = Math.max(parseInt(url.searchParams.get("offset") || "0"), 0);

    // Build query conditions
    const conditions = [];

    if (teamId) {
      conditions.push(eq(kbArticles.teamId, parseInt(teamId)));
    }

    if (status) {
      conditions.push(eq(kbArticles.status, status as any));
    }

    if (category) {
      conditions.push(eq(kbArticles.category, category));
    }

    if (isPublic !== null) {
      conditions.push(eq(kbArticles.isPublic, isPublic === "true"));
    }

    if (search) {
      conditions.push(
        or(
          ilike(kbArticles.title, `%${search}%`),
          ilike(kbArticles.content, `%${search}%`),
          ilike(kbArticles.category, `%${search}%`)
        )
      );
    }

    const articles = await db
      .select({
        id: kbArticles.id,
        teamId: kbArticles.teamId,
        title: kbArticles.title,
        slug: kbArticles.slug,
        excerpt: kbArticles.excerpt,
        status: kbArticles.status,
        category: kbArticles.category,
        tags: kbArticles.tags,
        authorId: kbArticles.authorId,
        viewCount: kbArticles.viewCount,
        isPublic: kbArticles.isPublic,
        publishedAt: kbArticles.publishedAt,
        createdAt: kbArticles.createdAt,
        updatedAt: kbArticles.updatedAt,
      })
      .from(kbArticles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kbArticles.updatedAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ articles });
  } catch (error) {
    console.error("KB articles GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);

    // Generate slug from title
    const slug = validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // TODO: Get teamId from user context or request
    const teamId = body.teamId; // This should come from auth context

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const [newArticle] = await db
      .insert(kbArticles)
      .values({
        title: validatedData.title,
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        category: validatedData.category,
        tags: validatedData.tags,
        isPublic: validatedData.isPublic,
        status: validatedData.status,
        teamId: parseInt(teamId),
        slug: `${slug}-${Date.now()}`, // Ensure uniqueness
        authorId: user.id,
        publishedAt:
          validatedData.status === "published" ? new Date() : undefined,
      })
      .returning();

    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("KB articles POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
