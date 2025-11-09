'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  aiSummary?: string;
  publishedAt: string;
  sourceUrl: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  authors?: Array<{ username: string; platform: string }>;
  categories?: string[];
  qualityScore?: string;
  upvoteCount?: number;
  viewCount?: number;
  commentCount?: number;
}

export default function Library() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'papers' | 'projects' | 'news'>('all');
  const [sortBy, setSortBy] = useState<'publishedAt' | 'title'>('publishedAt');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('deepdive-bookmarks');
    if (saved) {
      try {
        setBookmarks(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load bookmarks:', e);
      }
    }
  }, []);

  // Fetch bookmarked resources
  useEffect(() => {
    const fetchBookmarkedResources = async () => {
      if (bookmarks.size === 0) {
        setResources([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const bookmarkIds = Array.from(bookmarks);

        // Fetch resources by IDs
        const promises = bookmarkIds.map(id =>
          fetch(`http://localhost:4000/api/v1/resources/${id}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );

        const results = await Promise.all(promises);
        const validResources = results.filter(r => r !== null);

        // Apply filters
        let filtered = validResources;
        if (filterType !== 'all') {
          filtered = filtered.filter(r => r.type === filterType);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          if (sortBy === 'publishedAt') {
            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
          } else {
            return a.title.localeCompare(b.title);
          }
        });

        setResources(filtered);
      } catch (error) {
        console.error('Failed to fetch bookmarked resources:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedResources();
  }, [bookmarks, filterType, sortBy]);

  const removeBookmark = (resourceId: string) => {
    const newBookmarks = new Set(bookmarks);
    newBookmarks.delete(resourceId);
    setBookmarks(newBookmarks);
    localStorage.setItem('deepdive-bookmarks', JSON.stringify(Array.from(newBookmarks)));
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'papers':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'projects':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'news':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200">
          {!isSidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DD</span>
              </div>
              <span className="font-bold text-lg">DeepDive</span>
            </Link>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <svg className={`w-5 h-5 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Explore"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Explore</span>}
            </Link>
            <Link
              href="/library"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium bg-red-50 text-red-600 rounded-lg`}
              title="My Library"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {!isSidebarCollapsed && <span>My Library</span>}
            </Link>
            <Link
              href="/notifications"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Notifications"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {!isSidebarCollapsed && <span>Notifications</span>}
            </Link>
            <Link
              href="/profile"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Profile"
            >
              <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                P
              </div>
              {!isSidebarCollapsed && <span>Profile</span>}
            </Link>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <Link
            href="/labs"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg`}
            title="Labs"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            {!isSidebarCollapsed && <span>Labs</span>}
          </Link>
          <Link
            href="/feedback"
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg`}
            title="Feedback"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!isSidebarCollapsed && <span>Feedback</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
            <p className="text-sm text-gray-600">{bookmarks.size} bookmarked items</p>
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All</option>
                <option value="papers">Papers</option>
                <option value="projects">Projects</option>
                <option value="news">News</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="publishedAt">Date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : bookmarks.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No bookmarks yet</h2>
              <p className="text-gray-500 mb-4">Start bookmarking resources to build your library</p>
              <Link
                href="/"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Explore Resources
              </Link>
            </div>
          ) : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-gray-500">No resources match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Thumbnail */}
                  {resource.thumbnailUrl ? (
                    <div className="h-48 bg-gray-100">
                      <img
                        src={`http://localhost:4000${resource.thumbnailUrl}`}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      {getResourceIcon(resource.type)}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Type Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        resource.type === 'papers' ? 'bg-blue-100 text-blue-700' :
                        resource.type === 'projects' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {resource.type}
                      </span>
                      {resource.categories && resource.categories.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {resource.categories[0]}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h3>

                    {/* Abstract */}
                    {resource.abstract && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {resource.abstract}
                      </p>
                    )}

                    {/* Authors */}
                    {resource.authors && resource.authors.length > 0 && (
                      <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">
                          {resource.authors.map(a => a.username).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {resource.upvoteCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            {resource.upvoteCount}
                          </span>
                        )}
                        {resource.viewCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {resource.viewCount}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <a
                          href={resource.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="Open source"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        <button
                          onClick={() => removeBookmark(resource.id)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Remove bookmark"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
