'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { config } from '@/lib/config';
import NoteEditor from '@/components/NoteEditor';
import NotesList from '@/components/NotesList';
import CommentsList from '@/components/CommentsList';

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  content?: string;
  sourceUrl: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
  codeUrl?: string;
  authors?: Array<{ name?: string; username?: string; platform?: string }>;
  publishedAt: string;
  aiSummary?: string;
  keyInsights?: Array<{
    title: string;
    importance: string;
    description: string;
  }>;
  categories?: string[];
  tags?: string[];
  qualityScore?: string;
  viewCount: number;
  saveCount: number;
  upvoteCount: number;
  commentCount: number;
}

export default function ResourcePage() {
  const params = useParams();
  const id = params.id as string;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'comments'>('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/api/v1/resources/${id}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      }
    } catch (err) {
      console.error('Failed to load resource:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    // TODO: Implement bookmark toggle
    setIsBookmarked(!isBookmarked);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resource not found</h2>
          <p className="text-gray-600 mb-4">The resource you're looking for doesn't exist.</p>
          <Link href="/" className="text-red-600 hover:text-red-700">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-16 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2">
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              title="Explore"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            <Link
              href="/library"
              className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              title="My Library"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Explore
          </Link>

          {/* Resource Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full uppercase">
                    {resource.type}
                  </span>
                  {resource.categories && resource.categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{resource.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {resource.authors && resource.authors.length > 0 && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>{resource.authors.map(a => a.name || a.username).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(resource.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleBookmark}
                className={`p-3 rounded-lg transition-colors ${
                  isBookmarked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-6 h-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>

            {/* Abstract */}
            {resource.abstract && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Abstract</h3>
                <p className="text-gray-700 leading-relaxed">{resource.abstract}</p>
              </div>
            )}

            {/* Links */}
            <div className="mt-6 flex gap-3">
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Source
              </a>
              {resource.pdfUrl && (
                <a
                  href={resource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
              )}
              {resource.codeUrl && (
                <a
                  href={resource.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  View Code
                </a>
              )}
            </div>
          </div>

          {/* AI Summary & Insights */}
          {(resource.aiSummary || (resource.keyInsights && resource.keyInsights.length > 0)) && (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">AI Analysis</h2>

              {resource.aiSummary && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {resource.aiSummary}
                  </div>
                </div>
              )}

              {resource.keyInsights && resource.keyInsights.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Insights</h3>
                  <div className="space-y-3">
                    {resource.keyInsights.map((insight, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          insight.importance === 'high'
                            ? 'bg-red-50 border-red-500'
                            : insight.importance === 'medium'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            insight.importance === 'high'
                              ? 'bg-red-100 text-red-700'
                              : insight.importance === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {insight.importance}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Notes
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Comments ({resource.commentCount})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{resource.viewCount}</div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{resource.saveCount}</div>
                      <div className="text-sm text-gray-600">Saves</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{resource.upvoteCount}</div>
                      <div className="text-sm text-gray-600">Upvotes</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{resource.commentCount}</div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {resource.tags && resource.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {resource.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {!showNoteEditor ? (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">我的笔记</h3>
                        <button
                          onClick={() => {
                            setShowNoteEditor(true);
                            setEditingNoteId(undefined);
                          }}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                          创建新笔记
                        </button>
                      </div>
                      <NotesList
                        resourceId={resource.id}
                        onEditNote={(note) => {
                          setEditingNoteId(note.id);
                          setShowNoteEditor(true);
                        }}
                        onDeleteNote={() => {
                          // Refresh notes list handled by NotesList component
                        }}
                      />
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <NoteEditor
                        resourceId={resource.id}
                        noteId={editingNoteId}
                        onSave={(note) => {
                          console.log('Note saved:', note);
                          setShowNoteEditor(false);
                          setEditingNoteId(undefined);
                        }}
                        onCancel={() => {
                          setShowNoteEditor(false);
                          setEditingNoteId(undefined);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <CommentsList resourceId={resource.id} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
