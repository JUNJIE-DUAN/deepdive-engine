'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
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

      const response = await fetch(url);

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
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No notes yet</h3>
        <p className="mt-1 text-xs text-gray-600">Start creating notes to save your thoughts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tag filter chips - Only show in Notes tab */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-600 uppercase">Tags:</span>
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

      {/* Notes List */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
            onClick={() => onNoteClick?.(note)}
          >
            <div className="p-4">
              {/* Resource info header */}
              {!resourceId && note.resource && (
                <div className="mb-3 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    From: {note.resource.type}
                  </span>
                  <span className="truncate text-xs font-medium text-gray-700 hover:text-blue-600">
                    {note.resource.title}
                  </span>
                </div>
              )}

              {/* Content preview */}
              <div className="prose prose-sm mb-3 max-w-none text-sm leading-relaxed text-gray-700 line-clamp-3">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{note.tags.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Metadata footer */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span>{new Date(note.createdAt).toLocaleDateString('en-US')}</span>
                  {note.isPublic && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                      Public
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onEditNote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(note);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                  )}
                  {onDeleteNote && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
