'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import TextHighlighter from './TextHighlighter';
import NoteEditor from './NoteEditor';

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  content?: string;
  pdfUrl?: string;
}

interface Note {
  id: string;
  resourceId: string;
  content: string;
  highlights: any[];
  tags: string[];
  isPublic: boolean;
}

interface ResourceReaderProps {
  resourceId: string;
  onClose?: () => void;
}

/**
 * 资源阅读器组件
 *
 * 功能：
 * - 左侧：资源内容展示 + 文本高亮
 * - 右侧：笔记编辑器
 * - 集成高亮和笔记功能
 */
export default function ResourceReader({
  resourceId,
  onClose,
}: ResourceReaderProps) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);

  useEffect(() => {
    loadResource();
    loadOrCreateNote();
  }, [resourceId]);

  const loadResource = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/resources/${resourceId}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      }
    } catch (err) {
      console.error('Failed to load resource:', err);
    }
  };

  const loadOrCreateNote = async () => {
    try {
      setLoading(true);

      // Try to load existing note
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/notes/resource/${resourceId}`
      );

      if (response.ok) {
        const notes = await response.json();
        if (notes.length > 0) {
          const userNote = notes[0]; // Get first note (user's own note)
          setNote(userNote);
          setHighlights(userNote.highlights || []);
        } else {
          // Create a new note if none exists
          await createNewNote();
        }
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          content: '',
          highlights: [],
          tags: [],
          isPublic: false,
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNote(newNote);
        setHighlights([]);
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleHighlightAdded = (highlight: any) => {
    setHighlights([...highlights, highlight]);
  };

  const handleHighlightRemoved = (highlightId: string) => {
    setHighlights(highlights.filter(h => h.id !== highlightId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!resource || !note) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">资源未找到</h2>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {resource.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="uppercase font-medium">{resource.type}</span>
              {resource.pdfUrl && (
                <a
                  href={`${config.apiBaseUrl}${resource.pdfUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  打开PDF
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNoteEditor(!showNoteEditor)}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                showNoteEditor
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {showNoteEditor ? '隐藏笔记' : '显示笔记'}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Resource Content with Highlighting */}
        <div className={`${showNoteEditor ? 'w-1/2' : 'w-full'} overflow-auto bg-white border-r border-gray-200`}>
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Abstract */}
            {resource.abstract && (
              <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  摘要
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {resource.abstract}
                </p>
              </div>
            )}

            {/* Content with Highlighting */}
            {resource.content && (
              <div className="prose prose-lg max-w-none">
                <TextHighlighter
                  noteId={note.id}
                  content={resource.content}
                  highlights={highlights}
                  onHighlightAdded={handleHighlightAdded}
                  onHighlightRemoved={handleHighlightRemoved}
                  className="text-gray-800 leading-relaxed"
                />
              </div>
            )}

            {!resource.content && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  内容不可用。请查看PDF文件。
                </p>
                {resource.pdfUrl && (
                  <a
                    href={`${config.apiBaseUrl}${resource.pdfUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    打开PDF
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Note Editor */}
        {showNoteEditor && (
          <div className="w-1/2 overflow-auto bg-gray-50">
            <NoteEditor
              resourceId={resourceId}
              noteId={note.id}
              onSave={(savedNote) => {
                setNote(savedNote);
              }}
            />
          </div>
        )}
      </div>

      {/* Highlights Summary */}
      {highlights.length > 0 && !showNoteEditor && (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            高亮总结 ({highlights.length})
          </h3>
          <div className="space-y-2 max-h-48 overflow-auto">
            {highlights.slice(0, 5).map((highlight: any) => (
              <div
                key={highlight.id}
                className="p-2 rounded text-xs"
                style={{ backgroundColor: highlight.color + '30' }}
              >
                <p className="text-gray-900 line-clamp-2">{highlight.text}</p>
                {highlight.note && (
                  <p className="text-gray-600 mt-1 italic">{highlight.note}</p>
                )}
              </div>
            ))}
          </div>
          {highlights.length > 5 && (
            <button
              onClick={() => setShowNoteEditor(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              查看全部 {highlights.length} 个高亮
            </button>
          )}
        </div>
      )}
    </div>
  );
}
