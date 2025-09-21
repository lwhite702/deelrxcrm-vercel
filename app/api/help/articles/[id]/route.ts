import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { kbArticles } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries";

// Validation schemas
const updateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [article] = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, id))
      .limit(1);

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await db
      .update(kbArticles)
      .set({ 
        viewCount: (article.viewCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(kbArticles.id, id));

    return NextResponse.json({ 
      article: {
        ...article,
        viewCount: (article.viewCount || 0) + 1,
      } 
    });
  } catch (error) {
    console.error("KB article GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);

    // Check if article exists and user has permission
    const [existingArticle] = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, id))
      .limit(1);

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // TODO: Add proper permission check (author or admin)

    // Update slug if title changed
    let updatedSlug = existingArticle.slug;
    if (validatedData.title && validatedData.title !== existingArticle.title) {
      updatedSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const updateData: any = {
      ...validatedData,
      slug: updatedSlug,
      updatedAt: new Date(),
    };

    // Set publishedAt if status changes to published
    if (validatedData.status === 'published' && existingArticle.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const [updatedArticle] = await db
      .update(kbArticles)
      .set(updateData)
      .where(eq(kbArticles.id, id))
      .returning();

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("KB article PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if article exists
    const [existingArticle] = await db
      .select()
      .from(kbArticles)
      .where(eq(kbArticles.id, id))
      .limit(1);

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    // TODO: Add proper permission check (author or admin)

    await db
      .delete(kbArticles)
      .where(eq(kbArticles.id, id));

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("KB article DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}