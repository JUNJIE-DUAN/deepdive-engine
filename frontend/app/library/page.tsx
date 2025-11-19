'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import NotesList from '@/components/features/NotesList';
import Sidebar from '@/components/layout/Sidebar';

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
      const response = await fetch(`${config.apiBaseUrl}/api/v1/collections`);
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
      const response = await fetch(`${config.apiBaseUrl}/api/v1/collections`);
      if (response.ok) {
        const collections = await response.json();
        // Find default collection (bookmarks)
        const defaultCollection = collections.find(
          (c: Collection) => c.name === '我的收藏'
        );
        if (defaultCollection && defaultCollection.items) {
          // Extract resources from collection items
          const resources = defaultCollection.items.map((item: any) => item.resource);
          setBookmarks(resources);
        }
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
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

  // Get unique resource types for filtering
  const resourceTypes = Array.from(new Set(bookmarks.map((item) => item.type)));

  // Type badge config - 与 Explore 页面一致的设计系统，使用全局SVG图标
  const typeConfig: Record<string, {
    bg: string;
    text: string;
    borderColor: string;
    icon: (className: string) => React.ReactNode;
  }> = {
    PAPER: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      borderColor: 'border-blue-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    BLOG: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      borderColor: 'border-purple-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    NEWS: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      borderColor: 'border-orange-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v4m2-4a2 2 0 012 2v10a2 2 0 01-2 2" />
        </svg>
      )
    },
    YOUTUBE: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    YOUTUBE_VIDEO: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      borderColor: 'border-red-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    REPORT: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      borderColor: 'border-green-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    PROJECT: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      borderColor: 'border-indigo-200',
      icon: (className) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    },
  };

  // Resource Card Component - 卡片式设计
  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const config = typeConfig[resource.type] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      borderColor: 'border-gray-200',
      icon: (className: string) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    };

    return (
      <Link
        href={`/?id=${resource.id}`}
        className={`group block rounded-lg border-2 ${config.borderColor} ${config.bg} p-4 transition-all duration-200 hover:shadow-md hover:border-blue-400`}
      >
        <div className="flex items-start gap-3">
          {/* Left: Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${config.bg} border ${config.borderColor}`}>
              {config.icon('w-5 h-5 text-gray-700')}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm leading-snug">
              {resource.title}
            </h3>

            {/* Type badge + Date in one line */}
            <div className="flex items-center justify-between gap-2 mt-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${config.text} ${config.bg} border ${config.borderColor}`}>
                {resource.type.replace('_', ' ')}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {new Date(resource.publishedAt).toLocaleDateString('zh-CN')}
              </span>
            </div>

            {/* Abstract - single line */}
            {resource.abstract && (
              <p className="text-xs text-gray-600 line-clamp-1 mt-1.5">
                {resource.abstract}
              </p>
            )}

            {/* Footer: Upvotes and interaction indicator */}
            {resource.upvoteCount !== undefined && resource.upvoteCount > 0 && (
              <div className="mt-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v-7a1.5 1.5 0 01-3 0v7zM14 4a1 1 0 011 1v12a1 1 0 11-2 0V5a1 1 0 011-1zm3 1a1 1 0 010 2H9a3 3 0 00-3 3v6a3 3 0 003 3h8a1 1 0 110-2H9a1 1 0 01-1-1v-6a1 1 0 011-1h8z" />
                </svg>
                <span className="text-xs font-bold text-blue-600">{resource.upvoteCount} 人点赞</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              我的图书馆
            </h1>
            <p className="text-gray-600">
              集中管理您的笔记、书签和视频资源
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8 rounded-lg bg-white shadow-sm">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  全部内容
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'bookmarks'
                    ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  我的书签 <span className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{bookmarks.length}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  我的笔记
                </div>
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                  activeTab === 'videos'
                    ? 'border-b-2 border-blue-600 bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  我的视频
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filter Controls (for Bookmarks tab) */}
          {(activeTab === 'all' || activeTab === 'bookmarks') && (
            <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-sm border border-blue-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-semibold text-gray-600 uppercase">搜索</label>
                  <input
                    type="text"
                    placeholder="搜索标题或内容..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-600 uppercase">排序方式</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="date">最新优先</option>
                    <option value="title">按标题</option>
                    <option value="type">按类型</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow-sm">
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
                    暂无书签
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    浏览内容并点击书签按钮来保存您感兴趣的资源
                  </p>
                  <Link
                    href="/"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span>浏览内容</span>
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeTab === 'all' ? '全部内容' : '我的书签'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        共 {filteredBookmarks.length} 个资源
                      </p>
                    </div>
                  </div>

                  {/* Resource Type Groups - Always group by type for better UX */}
                  <div className="space-y-6">
                    {resourceTypes.map((type) => {
                      const typeBookmarks = filteredBookmarks.filter(
                        (item) => item.type === type
                      );
                      const typeConfigItem = typeConfig[type];
                      return (
                        typeBookmarks.length > 0 && (
                          <div key={type}>
                            {/* Section Header */}
                            <div className="mb-3 flex items-center gap-3 pb-2 border-b-2 border-gray-200">
                              <div className="flex-shrink-0">
                                {typeConfigItem?.icon('w-6 h-6 text-gray-700') || (
                                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                  </svg>
                                )}
                              </div>
                              <h4 className="text-lg font-bold text-gray-900 flex-1">
                                {type.replace('_', ' ')}
                              </h4>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${typeConfigItem?.bg || 'bg-gray-100'} ${typeConfigItem?.text || 'text-gray-700'}`}>
                                {typeBookmarks.length} 个
                              </span>
                            </div>
                            {/* List of resources */}
                            <div className="space-y-1.5">
                              {typeBookmarks.map((resource) => (
                                <ResourceCard
                                  key={resource.id}
                                  resource={resource}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Notes Tab */}
            {activeTab === 'notes' && <NotesList />}

            {/* Videos Tab */}
            {activeTab === 'videos' &&
              (loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
              ) : videos.length === 0 ? (
                <div className="py-12 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    暂无保存的视频
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    在YouTube页面解析视频后点击保存按钮来保存视频
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => (
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
                                'zh-CN'
                              )}
                            </span>
                            {video.aiReport && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                已生成报告
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
    </div>
  );
}
