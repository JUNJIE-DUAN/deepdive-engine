'use client';

import { useState } from 'react';
import { config } from '@/lib/config';
import CommentInput from './CommentInput';

interface User {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  content: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
  upvoteCount: number;
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  resourceId: string;
  level?: number;
  onCommentAdded?: (comment: any) => void;
  onCommentUpdated?: (commentId: string, content: string) => void;
  onCommentDeleted?: (commentId: string) => void;
}

/**
 * 评论项组件
 *
 * 功能：
 * - 显示评论内容
 * - 显示用户信息
 * - 显示时间和编辑状态
 * - 点赞功能
 * - 回复功能
 * - 编辑/删除（所有者）
 * - 嵌套显示子回复
 */
export default function CommentItem({
  comment,
  resourceId,
  level = 0,
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [upvotes, setUpvotes] = useState(comment.upvoteCount);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const maxNestingLevel = 3; // 最大嵌套层级

  const handleUpvote = async () => {
    if (hasUpvoted) return;

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/comments/${comment.id}/upvote`,
        { method: 'POST' }
      );

      if (response.ok) {
        setUpvotes(upvotes + 1);
        setHasUpvoted(true);
      }
    } catch (err) {
      console.error('Failed to upvote:', err);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/comments/${comment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (response.ok) {
        setIsEditing(false);
        onCommentUpdated?.(comment.id, editContent);
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/comments/${comment.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        onCommentDeleted?.(comment.id);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  if (comment.isDeleted) {
    return (
      <div
        className={`${level > 0 ? 'ml-12' : ''} py-3 text-sm text-gray-400 italic`}
      >
        [此评论已被删除]
      </div>
    );
  }

  return (
    <div className={`${level > 0 ? 'ml-12' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
              {comment.user.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* User info */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {comment.user.fullName || comment.user.username}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(comment.createdAt)}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(已编辑)</span>
            )}
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  保存
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleUpvote}
                disabled={hasUpvoted}
                className={`flex items-center gap-1 text-xs ${
                  hasUpvoted ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                } transition-colors`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>{upvotes}</span>
              </button>

              {level < maxNestingLevel && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  回复
                </button>
              )}

              {/* TODO: Check if current user owns this comment */}
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                编辑
              </button>

              <button
                onClick={handleDelete}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          )}

          {/* Reply input */}
          {showReplyInput && (
            <div className="mt-3">
              <CommentInput
                resourceId={resourceId}
                parentId={comment.id}
                placeholder={`回复 @${comment.user.username}...`}
                onCommentAdded={(newComment) => {
                  setShowReplyInput(false);
                  onCommentAdded?.(newComment);
                }}
                onCancel={() => setShowReplyInput(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-gray-200">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              resourceId={resourceId}
              level={level + 1}
              onCommentAdded={onCommentAdded}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
