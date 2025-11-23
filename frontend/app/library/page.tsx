'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import NotesList from '@/components/features/NotesList';
import Sidebar from '@/components/layout/Sidebar';
import { getAuthHeader } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  items: any[];
}

interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  url: string;
  transcript: any;
  translatedText?: string;
  aiReport?: any;
  createdAt: string;
}

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  publishedAt: string;
  sourceUrl: string;
  thumbnailUrl?: string;
  upvoteCount?: number;
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<
    'all' | 'bookmarks' | 'notes' | 'videos'
  >('all');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [bookmarks, setBookmarks] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'all' || activeTab === 'bookmarks') {
          await loadBookmarks();
        }
        if (activeTab === 'all') {
          await loadVideos();
        } else if (activeTab === 'videos') {
          await loadVideos();
        }
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, [activeTab]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const authHeaders = getAuthHeader();
      const response = await fetch(`${config.apiBaseUrl}/api/v1/collections`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/youtube-videos`
      );
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookmarks = async () => {
    try {
      const authHeaders = getAuthHeader();
      const response = await fetch(`${config.apiBaseUrl}/api/v1/collections`, {
        headers: authHeaders,
      });
      if (response.ok) {
        const collections = await response.json();
        // Find default collection (bookmarks)
        const defaultCollection = collections.find(
          (c: Collection) => c.name === '我的收藏'
        );
        if (defaultCollection && defaultCollection.items) {
          // Extract resources from collection items
          const resources = defaultCollection.items.map(
            (item: any) => item.resource
          );
          setBookmarks(resources);
        }
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  // Handle view resource
  const handleView = (resource: Resource) => {
    setSelectedResource(resource);
    setViewModalOpen(true);
  };

  // Handle edit resource
  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setEditModalOpen(true);
  };

  // Handle delete resource
  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!selectedResource) return;

    try {
      const authHeaders = getAuthHeader();
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/resources/${selectedResource.id}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );

      if (response.ok) {
        // Remove from bookmarks
        setBookmarks(bookmarks.filter((b) => b.id !== selectedResource.id));
        setDeleteDialogOpen(false);
        setSelectedResource(null);
      } else {
        alert('Failed to delete resource');
      }
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete resource');
    }
  };

  const resolveThumbnailUrl = (thumbnailUrl?: string | null) => {
    if (!thumbnailUrl) {
      return null;
    }

    if (thumbnailUrl.startsWith('http')) {
      return thumbnailUrl;
    }

    return `${config.apiBaseUrl}${thumbnailUrl}`;
  };

  // Filter and sort functions
  const filteredBookmarks = bookmarks
    .filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'date':
        default:
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
      }
    });

  // Filter videos by search query
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique resource types for filtering
  const resourceTypes = Array.from(new Set(bookmarks.map((item) => item.type)));

  // Type badge config - 与 Explore 页面一致的设计系统，使用全局SVG图标
  const typeConfig: Record<
    string,
    {
      bg: string;
      text: string;
      borderColor: string;
      icon: (className: string) => React.ReactNode;
    }
  > = {
    PAPER: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    BLOG: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    NEWS: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v4m2-4a2 2 0 012 2v10a2 2 0 01-2 2"
          />
        </svg>
      ),
    },
    YOUTUBE: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    YOUTUBE_VIDEO: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    REPORT: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    PROJECT: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: (className) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      ),
    },
  };

  // Resource Card Component - Business style, clean white card
  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const config = typeConfig[resource.type] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      borderColor: 'border-gray-200',
      icon: (className: string) => (
        <svg
          className={className}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    };

    return (
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
        {/* Action buttons - appear on hover */}
        <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              handleView(resource);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-blue-50 hover:text-blue-600"
            title="View details"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleEdit(resource);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-green-50 hover:text-green-600"
            title="Edit"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDelete(resource);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-red-50 hover:text-red-600"
            title="Delete"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        {/* Main card content - clickable link */}
        <Link href={`/?id=${resource.id}`} className="block">
          <div className="p-4">
            {/* Type badge */}
            <div className="mb-3 flex items-center gap-2">
              <div className="flex-shrink-0">
                {config.icon('w-4 h-4 text-gray-600')}
              </div>
              <span
                className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${config.text} bg-gray-50`}
              >
                {resource.type.replace('_', ' ')}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                {new Date(resource.publishedAt).toLocaleDateString('en-US')}
              </span>
            </div>

            {/* Title */}
            <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600">
              {resource.title}
            </h3>

            {/* Abstract - single line */}
            {resource.abstract && (
              <p className="mb-3 line-clamp-1 text-xs text-gray-600">
                {resource.abstract}
              </p>
            )}

            {/* Footer: Upvotes */}
            {resource.upvoteCount !== undefined && resource.upvoteCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <svg
                  className="h-3.5 w-3.5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 10.5a1.5 1.5 0 113 0v-7a1.5 1.5 0 01-3 0v7zM14 4a1 1 0 011 1v12a1 1 0 11-2 0V5a1 1 0 011-1zm3 1a1 1 0 010 2H9a3 3 0 00-3 3v6a3 3 0 003 3h8a1 1 0 110-2H9a1 1 0 01-1-1v-6a1 1 0 011-1h8z" />
                </svg>
                <span>{resource.upvoteCount}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Sticky Search Bar Container - Similar to Explore */}
        <div className="sticky top-0 z-10 bg-gray-50 pb-4 pt-6">
          <div className="mx-auto max-w-7xl px-8">
            {/* Large Search Bar - Unified for all tabs */}
            <div className="mb-6">
              <div className="relative rounded-lg border border-gray-300 bg-white shadow-sm">
                <div className="flex items-center">
                  {/* Search Icon */}
                  <div className="flex items-center px-4 py-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={
                      activeTab === 'notes'
                        ? 'Search notes...'
                        : 'Search all resources...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-none px-4 py-3 text-sm focus:outline-none focus:ring-0"
                  />
                  {/* Clear and Sort controls */}
                  <div className="flex items-center gap-2 px-4">
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="rounded p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                        title="Clear search"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                    {/* Sort dropdown - Only for Bookmarks/All tabs */}
                    {(activeTab === 'all' || activeTab === 'bookmarks') && (
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-2 text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="date">Latest First</option>
                        <option value="title">By Title</option>
                        <option value="type">By Type</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`border-b-2 px-0 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All Content
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`relative border-b-2 px-0 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'bookmarks'
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Bookmarks
                {bookmarks.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {bookmarks.length > 99 ? '99+' : bookmarks.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`border-b-2 px-0 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'notes'
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`border-b-2 px-0 py-3 text-sm font-semibold transition-all ${
                  activeTab === 'videos'
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Videos
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="px-8 py-6">
          <div className="mx-auto max-w-7xl">
            {/* Bookmarks and All Content View */}
            {(activeTab === 'all' || activeTab === 'bookmarks') &&
              (loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No bookmarks yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Browse resources and click the bookmark button to save your
                    favorites
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span>Browse Resources</span>
                  </Link>
                </div>
              ) : (
                <div>
                  {/* Resource grid - multi-column layout */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredBookmarks.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              ))}

            {/* Notes Tab */}
            {activeTab === 'notes' && <NotesList searchQuery={searchQuery} />}

            {/* Videos Tab */}
            {activeTab === 'videos' &&
              (loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No saved videos
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Save videos from the YouTube page after parsing
                  </p>
                </div>
              ) : filteredVideos.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No videos match your search
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredVideos.map((video) => (
                      <Link
                        key={video.id}
                        href={`/youtube?saved=${video.id}`}
                        className="block overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
                      >
                        <div className="relative aspect-video bg-gray-900">
                          <img
                            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                            alt={video.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-80 px-2 py-1 text-xs text-white">
                            YouTube
                          </div>
                        </div>
                        <div className="p-4">
                          <h4 className="mb-2 line-clamp-2 font-medium text-gray-900">
                            {video.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              {new Date(video.createdAt).toLocaleDateString(
                                'en-US'
                              )}
                            </span>
                            {video.aiReport && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                Report Generated
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>

      {/* View Details Modal */}
      {viewModalOpen && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Resource Details
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Badge */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type
                </label>
                <span className="inline-block rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  {selectedResource.type.replace('_', ' ')}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <p className="text-gray-900">{selectedResource.title}</p>
              </div>

              {/* Abstract */}
              {selectedResource.abstract && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Abstract
                  </label>
                  <p className="text-gray-700">{selectedResource.abstract}</p>
                </div>
              )}

              {/* Published Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Published Date
                </label>
                <p className="text-gray-700">
                  {new Date(selectedResource.publishedAt).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>

              {/* Source URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Source URL
                </label>
                <a
                  href={selectedResource.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedResource.sourceUrl}
                </a>
              </div>

              {/* Upvote Count */}
              {selectedResource.upvoteCount !== undefined &&
                selectedResource.upvoteCount > 0 && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Upvotes
                    </label>
                    <p className="text-gray-700">
                      {selectedResource.upvoteCount}
                    </p>
                  </div>
                )}

              {/* Thumbnail */}
              {selectedResource.thumbnailUrl &&
                resolveThumbnailUrl(selectedResource.thumbnailUrl) && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Thumbnail
                    </label>
                    <img
                      src={resolveThumbnailUrl(selectedResource.thumbnailUrl)!}
                      alt={selectedResource.title}
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Close
              </button>
              <a
                href={`/?id=${selectedResource.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                View Full Details
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Resource</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                try {
                  const authHeaders = getAuthHeader();
                  const response = await fetch(
                    `${config.apiBaseUrl}/api/v1/resources/${selectedResource.id}`,
                    {
                      method: 'PATCH',
                      headers: {
                        ...authHeaders,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        title: formData.get('title'),
                        abstract: formData.get('abstract'),
                      }),
                    }
                  );

                  if (response.ok) {
                    const updatedResource = await response.json();
                    setBookmarks(
                      bookmarks.map((b) =>
                        b.id === updatedResource.id ? updatedResource : b
                      )
                    );
                    setEditModalOpen(false);
                    setSelectedResource(null);
                  } else {
                    alert('Failed to update resource');
                  }
                } catch (err) {
                  console.error('Failed to update:', err);
                  alert('Failed to update resource');
                }
              }}
              className="space-y-4"
            >
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  defaultValue={selectedResource.title}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Abstract */}
              <div>
                <label
                  htmlFor="abstract"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Abstract
                </label>
                <textarea
                  id="abstract"
                  name="abstract"
                  rows={4}
                  defaultValue={selectedResource.abstract || ''}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Read-only fields */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type (Read-only)
                </label>
                <input
                  type="text"
                  value={selectedResource.type.replace('_', ' ')}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
                  disabled
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Published Date (Read-only)
                </label>
                <input
                  type="text"
                  value={new Date(
                    selectedResource.publishedAt
                  ).toLocaleDateString('en-US')}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
                  disabled
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                Delete Resource
              </h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                Are you sure you want to delete this resource? This action
                cannot be undone.
              </p>
              <p className="mt-3 text-center text-sm font-medium text-gray-900">
                "{selectedResource.title}"
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
