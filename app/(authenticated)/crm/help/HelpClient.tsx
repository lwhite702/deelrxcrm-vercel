"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Edit, Trash2, Eye, Upload, Tag, Calendar, User, FileText, Image } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface KBArticle {
  id: string;
  teamId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  category?: string;
  tags: string[];
  authorId?: string;
  viewCount: number;
  isPublic: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface KBUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageUrl: string;
  isPublic: boolean;
  createdAt: string;
}

export default function HelpClient() {
  const router = useRouter();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [uploads, setUploads] = useState<KBUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'browse' | 'create' | 'uploads'>('browse');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);

  // TODO: Get teamId from auth context
  const teamId = "placeholder-team-id";

  // Form state for creating/editing articles
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    isPublic: false,
    status: 'draft' as const,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchArticles();
    fetchUploads();
  }, [searchTerm, selectedCategory]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams({
        teamId,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
      });
      
      const response = await fetch(`/api/help/articles?${params}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchUploads = async () => {
    try {
      const response = await fetch(`/api/help/uploads?teamId=${teamId}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch uploads');
      const data = await response.json();
      setUploads(data.uploads || []);
    } catch (err) {
      console.error('Failed to load uploads:', err);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/help/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleForm,
          teamId,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create article');
      
      setArticleForm({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: [],
        isPublic: false,
        status: 'draft',
      });
      setSelectedView('browse');
      await fetchArticles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create article');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('teamId', teamId);
    formData.append('isPublic', 'false');

    try {
      const response = await fetch('/api/help/uploads', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload file');
      
      await fetchUploads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const addTag = () => {
    if (tagInput && !articleForm.tags.includes(tagInput)) {
      setArticleForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400';
      case 'draft': return 'text-yellow-400';
      case 'archived': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  // Get unique categories for filtering
  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="urban-card animate-pulse">
        <div className="h-64 bg-gray-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { key: 'browse', label: 'Browse Articles', icon: FileText },
          { key: 'create', label: 'Create Article', icon: Plus },
          { key: 'uploads', label: 'File Uploads', icon: Upload },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedView(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              selectedView === key 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="urban-card bg-red-900 border-red-700">
          <div className="text-red-400">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-100 mt-2 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Browse Articles Tab */}
      {selectedView === 'browse' && (
        <>
          {/* Search and Filters */}
          <div className="urban-card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400"
                />
              </div>
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {articles.map((article) => (
              <div key={article.id} className="urban-card hover:border-purple-500 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-white hover:text-purple-400 cursor-pointer"
                      onClick={() => setSelectedArticle(article)}>
                    {article.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(article.status)}`}>
                    {article.status.toUpperCase()}
                  </span>
                </div>
                
                {article.excerpt && (
                  <p className="text-gray-300 text-sm mb-3">{article.excerpt}</p>
                )}
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {article.tags.map((tag) => (
                    <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.viewCount}
                    </span>
                    {article.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {article.category}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setSelectedArticle(article)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-md text-sm flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-md text-sm">
                    <Edit className="w-3 h-3" />
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {articles.length === 0 && (
            <div className="urban-card text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No articles found. Create your first article!</p>
              <button
                onClick={() => setSelectedView('create')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
              >
                Create Article
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Article Tab */}
      {selectedView === 'create' && (
        <div className="urban-card">
          <h3 className="text-lg font-semibold text-white mb-6">Create New Article</h3>
          
          <form onSubmit={handleCreateArticle} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={articleForm.title}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter article title"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={articleForm.category}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter category"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Excerpt</label>
              <textarea
                value={articleForm.excerpt}
                onChange={(e) => setArticleForm(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Brief description of the article"
                rows={2}
              />
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Enter tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {articleForm.tags.map((tag) => (
                  <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300">Content *</label>
                <button
                  type="button"
                  onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  {showMarkdownPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              
              {showMarkdownPreview ? (
                <div className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white min-h-[300px] prose prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {articleForm.content || 'Nothing to preview yet...'}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono"
                  placeholder="Write your article content in Markdown..."
                  rows={15}
                />
              )}
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={articleForm.isPublic}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded bg-gray-800 border-gray-600"
                />
                <label htmlFor="isPublic" className="text-gray-300">Make public</label>
              </div>
              
              <div>
                <label className="block text-gray-300 mb-2">Status</label>
                <select
                  value={articleForm.status}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
              >
                Create Article
              </button>
              <button
                type="button"
                onClick={() => setSelectedView('browse')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* File Uploads Tab */}
      {selectedView === 'uploads' && (
        <div className="urban-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">File Uploads</h3>
            <div>
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="fileUpload"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  {upload.mimeType.startsWith('image/') ? (
                    <Image className="w-5 h-5 text-green-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-400" />
                  )}
                  <span className="text-white font-medium truncate">{upload.originalName}</span>
                </div>
                
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Size: {formatFileSize(upload.fileSize)}</p>
                  <p>Type: {upload.mimeType}</p>
                  <p>Uploaded: {new Date(upload.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <a
                    href={upload.storageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded text-sm text-center"
                  >
                    View
                  </a>
                  <button className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {uploads.length === 0 && (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No files uploaded yet</p>
              <label
                htmlFor="fileUpload"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload First File
              </label>
            </div>
          )}
        </div>
      )}

      {/* Article Viewer Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">{selectedArticle.title}</h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedArticle.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}