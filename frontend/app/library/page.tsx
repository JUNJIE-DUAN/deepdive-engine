'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { config } from '@/lib/config';
import NotesList from '@/components/NotesList';

export const dynamic = 'force-dynamic';

interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  items: any[];
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'notes' | 'collections'>('notes');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (activeTab === 'collections') {
      void loadCollections();
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        <div className={`p-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            {!isSidebarCollapsed && (
              <Link href="/" className="text-lg font-bold text-gray-900">
                DeepDive
              </Link>
            )}
          </div>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isSidebarCollapsed ? "Expand" : "Collapse"}
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-1">
            <Link
              href="/"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg`}
              title="Explore"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {!isSidebarCollapsed && <span>Explore</span>}
            </Link>
            <Link
              href="/library"
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium text-gray-900 bg-pink-50 rounded-lg`}
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
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的图书馆</h1>
            <p className="text-gray-600">管理您的笔记和收藏</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的笔记
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'collections' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我的收藏
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {activeTab === 'notes' && <NotesList />}
            {activeTab === 'collections' && (
              loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : collections.length === 0 || !collections.some(c => c.items && c.items.length > 0) ? (
                <div className="text-center py-12">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无收藏内容</h3>
                  <p className="mt-1 text-sm text-gray-500">浏览内容并点击收藏按钮来保存您感兴趣的资源</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {collections.map((collection) => (
                    collection.items && collection.items.length > 0 && (
                      <div key={collection.id}>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                          <span className="text-sm text-gray-500">{collection.items.length} 个资源</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {collection.items.map((item: any) => (
                            <a
                              key={item.id}
                              href={`/resource/${item.resource.id}`}
                              className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              {item.resource.thumbnailUrl && (
                                <img
                                  src={`${config.apiBaseUrl}${item.resource.thumbnailUrl}`}
                                  alt={item.resource.title}
                                  className="w-full h-40 object-cover rounded-md mb-3"
                                />
                              )}
                              <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">
                                {item.resource.title}
                              </h4>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="uppercase">{item.resource.type}</span>
                                {item.resource.publishedAt && (
                                  <span>{new Date(item.resource.publishedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
