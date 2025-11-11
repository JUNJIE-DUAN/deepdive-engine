'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import NotesList from '@/components/NotesList';
import Sidebar from '@/components/Sidebar';

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

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<
    'notes' | 'collections' | 'videos'
  >('notes');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'collections') {
      void loadCollections();
    } else if (activeTab === 'videos') {
      void loadVideos();
    }
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              我的图书馆
            </h1>
            <p className="text-gray-600">管理您的笔记和收藏</p>
          </div>

          <div className="mb-6 rounded-lg bg-white shadow-sm">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的笔记
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'collections' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的收藏
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'videos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的视频
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            {activeTab === 'notes' && <NotesList />}
            {activeTab === 'collections' &&
              (loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
              ) : collections.length === 0 ||
                !collections.some((c) => c.items && c.items.length > 0) ? (
                <div className="py-12 text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    暂无收藏内容
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    浏览内容并点击收藏按钮来保存您感兴趣的资源
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {collections.map(
                    (collection) =>
                      collection.items &&
                      collection.items.length > 0 && (
                        <div key={collection.id}>
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {collection.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {collection.items.length} 个资源
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {collection.items.map((item: any) => (
                              <a
                                key={item.id}
                                href={`/resource/${item.resource.id}`}
                                className="block rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md"
                              >
                                {item.resource.thumbnailUrl && (
                                  <img
                                    src={`${config.apiBaseUrl}${item.resource.thumbnailUrl}`}
                                    alt={item.resource.title}
                                    className="mb-3 h-40 w-full rounded-md object-cover"
                                  />
                                )}
                                <h4 className="mb-2 line-clamp-2 font-medium text-gray-900">
                                  {item.resource.title}
                                </h4>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span className="uppercase">
                                    {item.resource.type}
                                  </span>
                                  {item.resource.publishedAt && (
                                    <span>
                                      {new Date(
                                        item.resource.publishedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )
                  )}
                </div>
              ))}
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
                      <a
                        key={video.id}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
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
                      </a>
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
