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
  items: CollectionItem[];
}

interface CollectionItem {
  id: string;
  collectionId: string;
  resourceId: string;
  note?: string;
  createdAt: string;
  resource: Resource;
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
  const [bookmarkItems, setBookmarkItems] = useState<CollectionItem[]>([]);
  const [currentCollectionId, setCurrentCollectionId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editNoteModalOpen, setEditNoteModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null);

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
          // 保存完整的 CollectionItem 数组，而不只是 Resource
          setBookmarkItems(defaultCollection.items);
          setCurrentCollectionId(defaultCollection.id);
        }
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  };

  // Handle view resource - 查看资源详情（只读）
  const handleView = (item: CollectionItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  // Handle edit note - 编辑个人笔记
  const handleEditNote = (item: CollectionItem) => {
    setSelectedItem(item);
    setEditNoteModalOpen(true);
  };

  // Handle remove from collection - 从收藏中移除
  const handleRemove = (item: CollectionItem) => {
    setSelectedItem(item);
    setRemoveDialogOpen(true);
  };

  // Confirm remove from collection - 确认从收藏移除（不删除资源本身）
  const confirmRemove = async () => {
    if (!selectedItem || !currentCollectionId) return;

    try {
      const authHeaders = getAuthHeader();
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/collections/${currentCollectionId}/items/${selectedItem.resourceId}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );

      if (response.ok) {
        // 从收藏列表中移除该项
        setBookmarkItems(
          bookmarkItems.filter((item) => item.id !== selectedItem.id)
        );
        setRemoveDialogOpen(false);
        setSelectedItem(null);
      } else {
        alert('Failed to remove from collection');
      }
    } catch (err) {
      console.error('Failed to remove:', err);
      alert('Failed to remove from collection');
    }
  };

  // Update note - 更新个人笔记
  const updateNote = async (newNote: string) => {
    if (!selectedItem || !currentCollectionId) return;

    try {
      const authHeaders = getAuthHeader();
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/collections/${currentCollectionId}/items/${selectedItem.resourceId}/note`,
        {
          method: 'PATCH',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note: newNote }),
        }
      );

      if (response.ok) {
        // 更新本地状态
        setBookmarkItems(
          bookmarkItems.map((item) =>
            item.id === selectedItem.id ? { ...item, note: newNote } : item
          )
        );
        setEditNoteModalOpen(false);
        setSelectedItem(null);
      } else {
        alert('Failed to update note');
      }
    } catch (err) {
      console.error('Failed to update note:', err);
      alert('Failed to update note');
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

  // Filter and sort functions - 基于 CollectionItem
  const filteredBookmarks = bookmarkItems
    .filter((item) =>
      item.resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.resource.title.localeCompare(b.resource.title);
        case 'type':
          return a.resource.type.localeCompare(b.resource.type);
        case 'date':
        default:
          return (
            new Date(b.resource.publishedAt).getTime() -
            new Date(a.resource.publishedAt).getTime()
          );
      }
    });

  // Filter videos by search query
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unique resource types for filtering
  const resourceTypes = Array.from(
    new Set(bookmarkItems.map((item) => item.resource.type))
  );

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
  const ResourceCard = ({ item }: { item: CollectionItem }) => {
    const { resource, note } = item;
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
              handleView(item);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-blue-50 hover:text-blue-600"
            title="查看详情"
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
              handleEditNote(item);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-amber-50 hover:text-amber-600"
            title="编辑笔记"
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
              handleRemove(item);
            }}
            className="rounded-lg bg-white p-2 shadow-md transition-all hover:bg-red-50 hover:text-red-600"
            title="从收藏移除"
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
                d="M20 12H4"
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

        {/* Personal Note Preview - 个人笔记预览 */}
        {note && (
          <div className="border-t border-gray-100 bg-amber-50/50 px-4 py-2">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600"
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
              <p className="line-clamp-2 text-xs italic text-amber-900">
                {note}
              </p>
            </div>
          </div>
        )}
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
                {bookmarkItems.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {bookmarkItems.length > 99 ? '99+' : bookmarkItems.length}
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
                    {filteredBookmarks.map((item) => (
                      <ResourceCard key={item.id} item={item} />
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
      {viewModalOpen && selectedItem && (
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
                  {selectedItem.resource.type.replace('_', ' ')}
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <p className="text-gray-900">{selectedItem.resource.title}</p>
              </div>

              {/* Abstract */}
              {selectedItem.resource.abstract && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Abstract
                  </label>
                  <p className="text-gray-700">
                    {selectedItem.resource.abstract}
                  </p>
                </div>
              )}

              {/* Published Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Published Date
                </label>
                <p className="text-gray-700">
                  {new Date(
                    selectedItem.resource.publishedAt
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Source URL */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Source URL
                </label>
                <a
                  href={selectedItem.resource.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedItem.resource.sourceUrl}
                </a>
              </div>

              {/* Upvote Count */}
              {selectedItem.resource.upvoteCount !== undefined &&
                selectedItem.resource.upvoteCount > 0 && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Upvotes
                    </label>
                    <p className="text-gray-700">
                      {selectedItem.resource.upvoteCount}
                    </p>
                  </div>
                )}

              {/* Thumbnail */}
              {selectedItem.resource.thumbnailUrl &&
                resolveThumbnailUrl(selectedItem.resource.thumbnailUrl) && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Thumbnail
                    </label>
                    <img
                      src={
                        resolveThumbnailUrl(selectedItem.resource.thumbnailUrl)!
                      }
                      alt={selectedItem.resource.title}
                      className="max-w-full rounded-lg"
                    />
                  </div>
                )}

              {/* Personal Note - 显示个人笔记 */}
              {selectedItem.note && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    My Note
                  </label>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                      {selectedItem.note}
                    </p>
                  </div>
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
                href={`/?id=${selectedItem.resource.id}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                View Full Details
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Edit Note Modal - 编辑个人笔记 */}
      {editNoteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Bookmark Note
              </h2>
              <button
                onClick={() => setEditNoteModalOpen(false)}
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

            {/* Resource Info - Read-only */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">
                {selectedItem.resource.title}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {selectedItem.resource.type.replace('_', ' ')} •{' '}
                {new Date(selectedItem.resource.publishedAt).toLocaleDateString(
                  'en-US'
                )}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newNote = formData.get('note') as string;
                void updateNote(newNote);
              }}
              className="space-y-4"
            >
              {/* Note Textarea */}
              <div>
                <label
                  htmlFor="note"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Your Personal Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={6}
                  defaultValue={selectedItem.note || ''}
                  placeholder="Add your thoughts, insights, or reminders about this resource..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This note is private and only visible to you.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditNoteModalOpen(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove from Collection Confirmation Dialog */}
      {removeDialogOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <svg
                  className="h-6 w-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-center text-lg font-semibold text-gray-900">
                Remove from Collection
              </h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                This will remove the bookmark from your collection. The resource
                itself will not be deleted and will remain available in the
                system.
              </p>
              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-center text-sm font-medium text-gray-900">
                "{selectedItem.resource.title}"
              </p>
              {selectedItem.note && (
                <div className="mt-2 rounded-lg bg-amber-50 p-2">
                  <p className="text-xs text-amber-900">
                    <span className="font-medium">Note:</span> Your personal
                    note will also be removed.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRemoveDialogOpen(false)}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
