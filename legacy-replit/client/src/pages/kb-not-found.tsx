/**
 * Knowledge Base 404 Error Page with Search and Related Articles
 * Phase 5 implementation for DeelRxCRM KB system
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "@/lib/router";
import { getContent } from "@/lib/content";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, 
  Search, 
  BookOpen, 
  ArrowLeft, 
  ExternalLink,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import type { KbArticle } from "@shared/schema";

interface KBNotFoundProps {
  brokenSlug?: string;
  referrer?: string;
}

export default function KBNotFound({ brokenSlug, referrer }: KBNotFoundProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Log the broken link access for telemetry
  useEffect(() => {
    if (brokenSlug) {
      // Log broken link access
      apiRequest('/api/kb/health/log-broken-link', {
        method: 'POST',
        body: JSON.stringify({
          slug: brokenSlug,
          referrer: referrer || window.location.href
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.warn('Failed to log broken KB link:', error);
      });
    }
  }, [brokenSlug, referrer]);

  // Search for related articles
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<KbArticle[]>({
    queryKey: ["/api/help/articles", { search: searchTerm || undefined }],
    enabled: searchTerm.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get popular/featured articles as fallback
  const { data: featuredArticles = [] } = useQuery<KbArticle[]>({
    queryKey: ["/api/help/articles", { category: 'getting_started' }],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleSearch = () => {
    if (searchTerm.length > 2) {
      setLocation(`/help?tab=search&q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleArticleClick = (article: KbArticle) => {
    setLocation(`/help?tab=browse&article=${article.slug}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-16 h-16 text-orange-500 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {getContent('errors.kb_not_found')}
                </h1>
                {brokenSlug && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Article slug: <code className="bg-muted px-2 py-1 rounded">{brokenSlug}</code>
                  </p>
                )}
              </div>
            </div>
            <p className="text-lg text-muted-foreground">
              The knowledge base article you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setLocation('/help')}
            data-testid="button-back-to-help"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getContent('kb.back_to_help')}
          </Button>
        </div>

        {/* Search Box */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder={getContent('kb.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                data-testid="input-search-kb"
              />
              <Button 
                onClick={handleSearch} 
                disabled={searchTerm.length < 3}
                data-testid="button-search-kb"
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Try searching with different keywords or browse our popular articles below.
            </p>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchTerm.length > 2 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((article) => (
                    <div
                      key={article.id}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleArticleClick(article)}
                      data-testid={`article-result-${article.slug}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {article.contentMd.split('\n').find(line => line.trim() && !line.startsWith('#'))?.substring(0, 120)}...
                          </p>
                          {article.category && (
                            <Badge variant="outline" className="mt-2">
                              {article.category.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No articles found matching "{searchTerm}". Try different keywords or browse the popular articles below.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Popular Articles */}
        {featuredArticles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Popular Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredArticles.slice(0, 6).map((article) => (
                  <div
                    key={article.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors group"
                    onClick={() => handleArticleClick(article)}
                    data-testid={`popular-article-${article.slug}`}
                  >
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-2">
                      {article.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.contentMd.split('\n').find(line => line.trim() && !line.startsWith('#'))?.substring(0, 100)}...
                    </p>
                    {article.category && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {article.category.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-foreground mb-2">Browse All Articles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Explore our complete knowledge base organized by category.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation('/help?tab=browse')}
                data-testid="button-browse-articles"
              >
                Browse Articles
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-foreground mb-2">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  // This could open a support form, chat, or external link
                  window.open('mailto:support@dealrxcrm.com?subject=Knowledge Base Help Request', '_blank');
                }}
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details (for debugging) */}
        {brokenSlug && process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="space-y-1">
                <div><strong>Broken Slug:</strong> {brokenSlug}</div>
                <div><strong>Referrer:</strong> {referrer || 'Unknown'}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}