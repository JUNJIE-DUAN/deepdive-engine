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

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'notes' | 'collections'>('notes');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
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
