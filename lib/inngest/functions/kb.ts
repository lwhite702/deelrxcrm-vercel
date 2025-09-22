import { inngest } from "../client";
import { db } from "@/lib/db/drizzle";
import { kbArticles, kbUploads } from "@/lib/db/schema";
import { eq, and, isNotNull, isNull } from "drizzle-orm";
import { deleteFileFromBlob, type BlobStoreType } from "@/lib/blob-utils";

export const kbLinksVerify = inngest.createFunction(
  { id: "kb-links-verify" },
  { cron: "0 2 * * 0" }, // Weekly on Sundays at 2 AM
  async ({ event, step }) => {
    // Get all published articles
    const articles = await step.run("fetch-published-articles", async () => {
      return await db
        .select({
          id: kbArticles.id,
          teamId: kbArticles.teamId,
          title: kbArticles.title,
          content: kbArticles.content,
        })
        .from(kbArticles)
        .where(eq(kbArticles.status, "published"));
    });

    const results = [];

    // Check links in each article
    for (const article of articles) {
      const articleResult = await step.run(
        `verify-links-${article.id}`,
        async () => {
          // Extract URLs from markdown content
          const urlRegex =
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
          const urls = article.content.match(urlRegex) || [];

          const brokenLinks = [];
          const workingLinks = [];

          for (const url of urls) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              
              const response = await fetch(url, {
                method: "HEAD",
                signal: controller.signal,
              });
              
              clearTimeout(timeoutId);

              if (response.ok) {
                workingLinks.push(url);
              } else {
                brokenLinks.push({ url, status: response.status });
              }
            } catch (error) {
              brokenLinks.push({
                url,
                error: error instanceof Error ? error.message : "Unknown error",
              });
            }
          }

          return {
            articleId: article.id,
            articleTitle: article.title,
            totalLinks: urls.length,
            workingLinks: workingLinks.length,
            brokenLinks: brokenLinks.length,
            brokenLinkDetails: brokenLinks,
          };
        }
      );

      results.push(articleResult);

      // If there are broken links, create a notification
      if (articleResult.brokenLinks > 0) {
        await step.run(`notify-broken-links-${article.id}`, async () => {
          // TODO: Send notification to article author or team admins
          console.log(
            `Broken links found in article "${article.title}":`,
            articleResult.brokenLinkDetails
          );
        });
      }
    }

    return {
      totalArticles: articles.length,
      articlesWithBrokenLinks: results.filter((r) => r.brokenLinks > 0).length,
      results,
    };
  }
);

export const kbArticlePublished = inngest.createFunction(
  { id: "kb-article-published" },
  { event: "kb/article.published" },
  async ({ event, step }) => {
    const { teamId, articleId, title, authorId } = event.data;

    // Send notification to team members
    await step.run("notify-team-members", async () => {
      // TODO: Implement team notification system
      console.log(
        `New knowledge base article published: "${title}" by ${authorId}`
      );
    });

    // Index article for search (if using search service)
    await step.run("index-article-for-search", async () => {
      // TODO: Implement search indexing
      console.log(`Indexing article ${articleId} for search`);
    });

    // Update article statistics
    await step.run("update-article-stats", async () => {
      // This could track publishing metrics, etc.
      console.log(`Updated statistics for article ${articleId}`);
    });

    return { success: true };
  }
);

export const kbCleanupUnusedUploads = inngest.createFunction(
  { id: "kb-cleanup-unused-uploads" },
  { cron: "0 3 * * 1" }, // Weekly on Mondays at 3 AM
  async ({ event, step }) => {
    // Find uploads that are not referenced in any articles
    const unusedUploads = await step.run("find-unused-uploads", async () => {
      // Get all uploads that don't have an articleId or are not referenced in article content
      return await db
        .select()
        .from(kbUploads)
        .where(isNull(kbUploads.articleId));
    });

    const cleanupResults: Array<{
      uploadId: string;
      filename: string;
      status: string;
    }> = [];

    // Clean up old unused uploads (older than 30 days)
    for (const upload of unusedUploads) {
      const uploadAge = Date.now() - new Date(upload.createdAt).getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

      if (uploadAge > thirtyDaysInMs) {
        await step.run(`cleanup-upload-${upload.id}`, async () => {
          try {
            // Determine store type from file path
            const storeType: BlobStoreType = upload.filename?.startsWith('private/') ? 'private' : 'public';
            // Delete from Vercel Blob using the utility function
            await deleteFileFromBlob(upload.storageUrl, storeType);
            
            // Delete from database
            await db.delete(kbUploads).where(eq(kbUploads.id, upload.id));

            cleanupResults.push({
              uploadId: upload.id,
              filename: upload.filename,
              status: "cleaned",
            });

            console.log(`Cleaned up unused upload: ${upload.filename}`);
          } catch (error) {
            console.error(`Failed to cleanup upload ${upload.filename}:`, error);
            cleanupResults.push({
              uploadId: upload.id,
              filename: upload.filename,
              status: "failed",
            });
          }
        });
      }
    }

    return {
      totalUnusedUploads: unusedUploads.length,
      cleanedUploads: cleanupResults.length,
      results: cleanupResults,
    };
  }
);
