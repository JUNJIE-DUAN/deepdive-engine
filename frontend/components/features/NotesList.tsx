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
  onNoteClick?: (note: Note) => void;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
}

/**
 * 笔记列表组件
 *
 * 功能：
 * - 显示用户的所有笔记
 * - 或显示特定资源的笔记
 * - 支持编辑和删除
 * - 显示标签和元数据
 */
export default function NotesList({
  resourceId,
  onNoteClick,
  onEditNote,
  onDeleteNote,
}: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!confirm('确定要删除这条笔记吗？')) return;

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
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无笔记</h3>
        <p className="mt-1 text-sm text-gray-500">开始创建笔记来记录您的想法</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          onClick={() => onNoteClick?.(note)}
        >
          {/* Resource info */}
          {!resourceId && note.resource && (
            <div className="mb-2 flex items-center gap-2">
              {note.resource.thumbnailUrl && (
                <img
                  src={`${config.apiBaseUrl}${note.resource.thumbnailUrl}`}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              <span className="text-sm font-medium text-gray-700">
                {note.resource.title}
              </span>
              <span className="text-xs uppercase text-gray-500">
                {note.resource.type}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm mb-3 max-w-none">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span>
                创建于 {new Date(note.createdAt).toLocaleDateString()}
              </span>
              {note.updatedAt !== note.createdAt && (
                <span>
                  更新于 {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              )}
              {note.isPublic && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  公开
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {onEditNote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNote(note);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-800"
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
                  className="font-medium text-red-600 hover:text-red-800"
                >
                  删除
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
