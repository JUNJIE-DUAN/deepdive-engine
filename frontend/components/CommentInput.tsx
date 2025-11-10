'use client';

import { useState } from 'react';
import { config } from '@/lib/config';

interface CommentInputProps {
  resourceId: string;
  parentId?: string;
  placeholder?: string;
  onCommentAdded?: (comment: any) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * 评论输入组件
 *
 * 功能：
 * - 创建新评论
 * - 回复评论
 * - 自动展开/收起
 */
export default function CommentInput({
  resourceId,
  parentId,
  placeholder = '写下你的评论...',
  onCommentAdded,
  onCancel,
  autoFocus = false,
}: CommentInputProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${config.apiBaseUrl}/api/v1/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId,
          content: content.trim(),
          parentId,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setContent('');
        onCommentAdded?.(comment);
      } else {
        setError('发送评论失败，请重试');
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />

      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded transition-colors"
        >
          {submitting ? '发送中...' : parentId ? '回复' : '评论'}
        </button>
      </div>
    </form>
  );
}
