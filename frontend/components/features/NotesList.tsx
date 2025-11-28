'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { getAuthHeader } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';

interface Note {
  id: string;
  resourceId: string;
  content: string;
  highlights: any[];
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  resource: {
    id: string;
    type: string;
    title: string;
    thumbnailUrl?: string;
  };
}

interface NotesListProps {
  resourceId?: string;
  searchQuery?: string;
  onNoteClick?: (note: Note) => void;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
}

export default function NotesList({
  resourceId,
  searchQuery = '',
  onNoteClick,
  onEditNote,
  onDeleteNote,
}: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [resourceId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = resourceId
        ? `${config.apiBaseUrl}/api/v1/notes/resource/${resourceId}`
        : `${config.apiBaseUrl}/api/v1/notes`;

      const response = await fetch(url, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(resourceId ? data : data.notes);
      } else {
        setError('Failed to load notes');
      }
    } catch (err) {
      setError('Error loading notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/notes/${noteId}`,
        {
          method: 'DELETE',
          headers: getAuthHeader(),
        }
      );

      if (response.ok) {
        setNotes(notes.filter((n) => n.id !== noteId));
        onDeleteNote?.(noteId);
      } else {
        alert('Failed to delete note');
      }
    } catch (err) {
      alert('Error deleting note');
      console.error(err);
    }
  };

  // Get all unique tags
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort();

  // Filter and search notes
  const filteredNotes = notes.filter((note) => {
    const matchesTag = !selectedTag || note.tags.includes(selectedTag);
    const matchesSearch =
      !searchQuery ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.resource?.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
        {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No notes yet
        </h3>
        <p className="mt-1 text-xs text-gray-600">
          Start creating notes to save your thoughts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag filter chips - Only show in Notes tab */}
      {allTags.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase text-gray-600">
            Tags:
          </span>
          <button
            onClick={() => setSelectedTag(null)}
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
              selectedTag === null
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-300'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes List - Single column for sidebar */}
      <div className="space-y-3">
        {filteredNotes.map((note) => {
          const isExpanded = expandedNoteId === note.id;
          return (
            <div
              key={note.id}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md"
              onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
            >
              {/* Resource info header */}
              {!resourceId && note.resource && (
                <div className="mb-2 truncate text-xs text-gray-500">
                  <span className="font-medium">{note.resource.type}:</span>{' '}
                  {note.resource.title}
                </div>
              )}

              {/* Content preview - Markdown rendered */}
              <div
                className={`prose prose-sm mb-2 max-w-none text-sm leading-relaxed text-gray-700 ${isExpanded ? '' : 'line-clamp-4'}`}
              >
                <ReactMarkdown
                  components={{
                    // 简化标题显示
                    h1: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h2: ({ children }) => (
                      <span className="font-bold">{children}</span>
                    ),
                    h3: ({ children }) => (
                      <span className="font-semibold">{children}</span>
                    ),
                    h4: ({ children }) => (
                      <span className="font-semibold">{children}</span>
                    ),
                    // 列表项紧凑显示
                    ul: ({ children }) => (
                      <ul className="my-1 list-disc pl-4">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-1 list-decimal pl-4">{children}</ol>
                    ),
                    li: ({ children }) => <li className="my-0">{children}</li>,
                    // 段落紧凑
                    p: ({ children }) => <p className="my-1">{children}</p>,
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              </div>

              {/* Footer: Tags + Date + Actions + Expand indicator */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                      {note.tags[0]}
                      {note.tags.length > 1 && ` +${note.tags.length - 1}`}
                    </span>
                  )}
                  {/* Date */}
                  <span className="text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Actions + Expand indicator */}
                <div className="flex items-center gap-2">
                  {onEditNote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(note);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      编辑
                    </button>
                  )}
                  {onDeleteNote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  )}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
