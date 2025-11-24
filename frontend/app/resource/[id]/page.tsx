'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { config } from '@/lib/config';
import NoteEditor from '@/components/features/NoteEditor';
import NotesList from '@/components/features/NotesList';
import CommentsList from '@/components/features/CommentsList';
import Sidebar from '@/components/layout/Sidebar';
import dynamic from 'next/dynamic';
import {
  StructuredAISummaryRouter,
  isStructuredAISummary,
  convertToStructuredSummary,
} from '@/components/features/StructuredAISummary';

// Dynamic import for PDF viewer (client-side only)
const PDFViewerClient = dynamic(
  () => import('@/components/ui/PDFViewerClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center rounded-lg bg-gray-100">
        Loading PDF viewer...
      </div>
    ),
  }
);

import type { ResourceAISummary } from '@/types/ai-office';

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
  aiSummary?: string | ResourceAISummary;
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
  const [activeTab, setActiveTab] = useState<
    'overview' | 'pdf' | 'notes' | 'comments'
  >('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    loadResource();
  }, [id]);

  const loadResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/resources/${id}`
      );
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Resource not found
          </h2>
          <p className="mb-4 text-gray-600">
            The resource you're looking for doesn't exist.
          </p>
          <Link href="/" className="text-red-600 hover:text-red-700">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar className="flex-shrink-0" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">
          {/* Back Button */}
          <Link
            href="/library"
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Library
          </Link>

          {/* Resource Header */}
          <div className="mb-6 rounded-lg bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium uppercase text-red-800">
                    {resource.type}
                  </span>
                  {resource.categories &&
                    resource.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {cat}
                      </span>
                    ))}
                </div>
                <h1 className="mb-3 text-3xl font-bold text-gray-900">
                  {resource.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {resource.authors && resource.authors.length > 0 && (
                    <div className="flex items-center gap-2">
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>
                        {resource.authors
                          .map((a) => a.name || a.username)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(resource.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={toggleBookmark}
                className={`rounded-lg p-3 transition-colors ${
                  isBookmarked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg
                  className="h-6 w-6"
                  fill={isBookmarked ? 'currentColor' : 'none'}
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
              </button>
            </div>

            {/* Paper-specific metadata */}
            {resource.type === 'PAPER' && (
              <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <h3 className="mb-3 font-semibold text-blue-900">
                  Paper Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {resource.authors && resource.authors.length > 0 && (
                    <div>
                      <span className="font-medium text-blue-700">
                        Authors:
                      </span>
                      <p className="mt-1 text-gray-700">
                        {resource.authors
                          .map((a) => a.name || a.username)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {resource.publishedAt && (
                    <div>
                      <span className="font-medium text-blue-700">
                        Published:
                      </span>
                      <p className="mt-1 text-gray-700">
                        {new Date(resource.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Abstract */}
            {resource.abstract && (
              <div className="mt-6 rounded-lg bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  Abstract
                </h3>
                <p className="leading-relaxed text-gray-700">
                  {resource.abstract}
                </p>
              </div>
            )}

            {/* Links */}
            <div className="mt-6 flex gap-3">
              <a
                href={resource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Source
              </a>
              {resource.pdfUrl && (
                <a
                  href={resource.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </a>
              )}
              {resource.codeUrl && (
                <a
                  href={resource.codeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-gray-800 px-4 py-2 text-white transition-colors hover:bg-gray-900"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  View Code
                </a>
              )}
            </div>
          </div>

          {/* AI Summary - Using Structured AI Summary Components */}
          {resource.aiSummary && (
            <div className="mb-6">
              {isStructuredAISummary(resource.aiSummary) ? (
                <StructuredAISummaryRouter
                  summary={resource.aiSummary}
                  compact={false}
                  expandable={true}
                />
              ) : typeof resource.aiSummary === 'string' ? (
                <StructuredAISummaryRouter
                  summary={convertToStructuredSummary(
                    resource.aiSummary,
                    resource.type,
                    'intermediate'
                  )}
                  compact={false}
                  expandable={true}
                />
              ) : null}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 rounded-lg bg-white shadow-sm">
            <div className="flex overflow-x-auto border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              {resource.type === 'PAPER' && resource.pdfUrl && (
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'pdf'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  PDF Viewer
                </button>
              )}
              <button
                onClick={() => setActiveTab('notes')}
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Notes
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'comments'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Comments ({resource.commentCount})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'pdf' && resource.pdfUrl && (
                <div className="space-y-4">
                  <PDFViewerClient url={resource.pdfUrl} />
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {resource.viewCount}
                      </div>
                      <div className="text-sm text-gray-600">Views</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {resource.saveCount}
                      </div>
                      <div className="text-sm text-gray-600">Saves</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {resource.upvoteCount}
                      </div>
                      <div className="text-sm text-gray-600">Upvotes</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {resource.commentCount}
                      </div>
                      <div className="text-sm text-gray-600">Comments</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {resource.tags && resource.tags.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {resource.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
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
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          我的笔记
                        </h3>
                        <button
                          onClick={() => {
                            setShowNoteEditor(true);
                            setEditingNoteId(undefined);
                          }}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
                    <div className="rounded-lg bg-gray-50 p-6">
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
