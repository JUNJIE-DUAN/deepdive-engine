'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAiGroupStore } from '@/stores/aiGroupStore';
import {
  Topic,
  TopicMessage,
  TopicMember,
  TopicAIMember,
  MessageContentType,
  MentionType,
  AI_MODELS,
  TopicRole,
} from '@/types/ai-group';
import Link from 'next/link';
import TopicSettingsDialog from '@/components/ai-group/TopicSettingsDialog';
import ResourcesPanel from '@/components/ai-group/ResourcesPanel';
import SummaryDialog from '@/components/ai-group/SummaryDialog';
import Sidebar from '@/components/layout/Sidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Member Panel
function MemberPanel({
  topic,
  onlineUsers,
  typingUsers,
  typingAIs,
  onMemberClick,
  onAIClick,
  onInviteMember,
  isOwnerOrAdmin,
}: {
  topic: Topic;
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  typingAIs: Set<string>;
  onMemberClick: (member: TopicMember) => void;
  onAIClick: (ai: TopicAIMember) => void;
  onInviteMember: () => void;
  isOwnerOrAdmin: boolean;
}) {
  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Topic Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-xl">
            {topic.avatar || '💬'}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="truncate font-semibold text-gray-900">
              {topic.name}
            </h2>
            <p className="truncate text-xs text-gray-500">
              {topic.memberCount + topic.aiMemberCount} members
            </p>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-auto p-3">
        {/* Human Members */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
              Members ({topic.memberCount})
            </h3>
            {isOwnerOrAdmin && (
              <button
                onClick={onInviteMember}
                className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="Invite member"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-1">
            {topic.members.map((member) => {
              const isOnline = onlineUsers.has(member.userId);
              const isTyping = typingUsers.has(member.userId);

              return (
                <button
                  key={member.id}
                  onClick={() => onMemberClick(member)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-100"
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {member.user.avatarUrl ? (
                        <img
                          src={member.user.avatarUrl}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (member.user.fullName ||
                          member.user.username ||
                          'U')[0].toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                        isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {member.nickname ||
                          member.user.fullName ||
                          member.user.username}
                      </span>
                      {member.role === TopicRole.OWNER && (
                        <span className="rounded bg-yellow-100 px-1 text-[10px] font-medium text-yellow-700">
                          Owner
                        </span>
                      )}
                      {member.role === TopicRole.ADMIN && (
                        <span className="rounded bg-blue-100 px-1 text-[10px] font-medium text-blue-700">
                          Admin
                        </span>
                      )}
                    </div>
                    {isTyping && (
                      <span className="text-xs italic text-gray-400">
                        typing...
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Members */}
        {topic.aiMembers && topic.aiMembers.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              AI Assistants ({topic.aiMemberCount})
            </h3>
            <div className="space-y-1">
              {topic.aiMembers.map((ai) => {
                const model = AI_MODELS.find((m) => m.id === ai.aiModel);
                const isTyping = typingAIs.has(ai.id);

                return (
                  <button
                    key={ai.id}
                    onClick={() => onAIClick(ai)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-gray-100"
                  >
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-100 to-blue-100">
                      {model?.iconUrl ? (
                        <img
                          src={model.iconUrl}
                          alt={model.name}
                          className="h-6 w-6"
                        />
                      ) : (
                        <span className="text-lg">
                          {(model as any)?.icon || '🤖'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="truncate text-sm font-medium text-gray-900">
                        {ai.displayName}
                      </span>
                      {ai.roleDescription && (
                        <p className="truncate text-xs text-gray-500">
                          {ai.roleDescription}
                        </p>
                      )}
                      {isTyping && (
                        <span className="text-xs italic text-green-500">
                          thinking...
                        </span>
                      )}
                    </div>
                    {ai.autoRespond && (
                      <span className="rounded bg-green-100 px-1 text-[10px] font-medium text-green-700">
                        Auto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Back to Topics Link */}
      <div className="border-t border-gray-200 p-3">
        <Link
          href="/ai-group"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Topics
        </Link>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwnMessage,
  onReply,
  onReact,
  currentUserId,
}: {
  message: TopicMessage;
  isOwnMessage: boolean;
  onReply: (message: TopicMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  currentUserId: string;
}) {
  const [showActions, setShowActions] = useState(false);
  const isAI = !!message.aiMemberId;
  const model = isAI
    ? AI_MODELS.find((m) => m.id === message.aiMember?.aiModel)
    : null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const senderName = isAI
    ? message.aiMember?.displayName || 'AI'
    : message.sender?.fullName || message.sender?.username || 'User';

  const senderAvatar = isAI ? (
    model?.iconUrl ? (
      <img src={model.iconUrl} alt={model.name} className="h-6 w-6" />
    ) : (
      <span className="text-lg">{(model as any)?.icon || '🤖'}</span>
    )
  ) : message.sender?.avatarUrl ? (
    <img
      src={message.sender.avatarUrl}
      alt=""
      className="h-full w-full rounded-full object-cover"
    />
  ) : (
    <span className="text-sm font-medium">{senderName[0].toUpperCase()}</span>
  );

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce(
    (acc, r) => {
      if (!acc[r.emoji]) {
        acc[r.emoji] = { emoji: r.emoji, count: 0, hasOwn: false };
      }
      acc[r.emoji].count++;
      if (r.userId === currentUserId) {
        acc[r.emoji].hasOwn = true;
      }
      return acc;
    },
    {} as Record<string, { emoji: string; count: number; hasOwn: boolean }>
  );

  return (
    <div
      className={`group flex gap-3 px-4 py-2 transition-colors hover:bg-gray-50 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isAI
            ? 'bg-gradient-to-br from-green-100 to-blue-100'
            : 'bg-gray-200 text-gray-600'
        }`}
      >
        {senderAvatar}
      </div>

      {/* Content */}
      <div
        className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        {/* Header */}
        <div
          className={`mb-1 flex items-center gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
        >
          <span
            className={`text-sm font-medium ${isAI ? 'text-green-700' : 'text-gray-900'}`}
          >
            {senderName}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {isAI && message.modelUsed && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
              {message.modelUsed}
            </span>
          )}
        </div>

        {/* Reply To */}
        {message.replyTo && (
          <div className="mb-1 rounded border-l-2 border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500">
            <span className="font-medium">
              {message.replyTo.sender?.fullName ||
                message.replyTo.aiMember?.displayName}
              :
            </span>{' '}
            <span className="line-clamp-1">{message.replyTo.content}</span>
          </div>
        )}

        {/* Message Content */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white'
              : isAI
                ? 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          {/* AI messages render as Markdown, others as plain text */}
          {isAI ? (
            <div className="prose prose-sm prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  img: ({ node, ...props }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img {...props} alt={props.alt || 'AI Generated Image'} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words text-sm">
              {highlightMentions(message.content, message.mentions)}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                    isOwnMessage
                      ? 'bg-blue-500 text-blue-100'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
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
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  {att.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.values(groupedReactions).map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(message.id, r.emoji)}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                  r.hasOwn
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div
            className={`mt-1 flex gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <button
              onClick={() => onReply(message)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
              title="Reply"
            >
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
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            {['👍', '❤️', '😄', '🎉'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200"
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to highlight mentions
function highlightMentions(
  content: string,
  mentions: TopicMessage['mentions']
): React.ReactNode {
  if (!mentions || mentions.length === 0) {
    return content;
  }

  // Mention pattern @name (supports hyphens and underscores like "AI-Grok")
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /@([\w-]+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="rounded bg-blue-100 px-1 font-medium text-blue-700"
      >
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

// Message Input Component
function MessageInput({
  topic,
  replyTo,
  onClearReply,
  onSend,
  onTyping,
}: {
  topic: Topic;
  replyTo: TopicMessage | null;
  onClearReply: () => void;
  onSend: (
    content: string,
    mentions: {
      userId?: string;
      aiMemberId?: string;
      mentionType: MentionType;
    }[]
  ) => void;
  onTyping: () => void;
}) {
  const [content, setContent] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // All mentionable entities
  const mentionableEntities = [
    { type: 'all', id: 'all', name: 'Everyone', icon: '👥' },
    { type: 'all_ai', id: 'all_ai', name: 'All AIs', icon: '🤖' },
    ...topic.members.map((m) => ({
      type: 'user',
      id: m.userId,
      name: m.nickname || m.user.fullName || m.user.username || 'User',
      icon: null,
      avatar: m.user.avatarUrl,
    })),
    ...topic.aiMembers.map((ai) => {
      const model = AI_MODELS.find((m) => m.id === ai.aiModel);
      return {
        type: 'ai',
        id: ai.id,
        name: ai.displayName,
        icon: model?.icon || '🤖',
        iconUrl: model?.iconUrl,
      };
    }),
  ];

  const filteredEntities = mentionableEntities.filter((e) =>
    e.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Check for @ mention trigger (support hyphens in names like "AI-Grok")
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([\w-]*)$/);

    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentionMenu(true);
      // Calculate position (simplified)
      const rect = e.target.getBoundingClientRect();
      setMentionPosition({ top: rect.top - 200, left: rect.left + 20 });
    } else {
      setShowMentionMenu(false);
    }

    // Typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping();
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  };

  const handleMentionSelect = (entity: (typeof mentionableEntities)[0]) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = content.slice(0, cursorPos);
    const textAfterCursor = content.slice(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    const mentionText = `@${entity.name} `;
    const newContent =
      textBeforeCursor.slice(0, atIndex) + mentionText + textAfterCursor;
    setContent(newContent);
    setShowMentionMenu(false);

    // Focus back to input and set cursor position after the mention
    const newCursorPos = atIndex + mentionText.length;
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSend = () => {
    if (!content.trim()) return;

    // Parse mentions from content
    // Support names with letters, numbers, hyphens, and underscores (e.g., "AI-Grok", "AI_Claude")
    const mentions: {
      userId?: string;
      aiMemberId?: string;
      mentionType: MentionType;
    }[] = [];
    const mentionRegex = /@([\w-]+)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      const name = match[1].toLowerCase();

      if (name === 'everyone') {
        mentions.push({ mentionType: MentionType.ALL });
      } else if (name === 'allais' || name === 'all_ai') {
        mentions.push({ mentionType: MentionType.ALL_AI });
      } else {
        // Find matching user or AI
        const user = topic.members.find(
          (m) =>
            (
              m.nickname ||
              m.user.fullName ||
              m.user.username ||
              ''
            ).toLowerCase() === name
        );
        const ai = topic.aiMembers.find(
          (a) => a.displayName.toLowerCase() === name
        );

        if (user) {
          mentions.push({ userId: user.userId, mentionType: MentionType.USER });
        } else if (ai) {
          mentions.push({ aiMemberId: ai.id, mentionType: MentionType.AI });
        }
      }
    }

    onSend(content.trim(), mentions);
    setContent('');
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span className="text-gray-500">Replying to</span>
            <span className="font-medium text-gray-700">
              {replyTo.sender?.fullName || replyTo.aiMember?.displayName}
            </span>
            <span className="line-clamp-1 text-gray-400">
              {replyTo.content}
            </span>
          </div>
          <button
            onClick={onClearReply}
            className="text-gray-400 hover:text-gray-600"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Mention Menu */}
      {showMentionMenu && filteredEntities.length > 0 && (
        <div className="mb-2 max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filteredEntities.map((entity) => (
            <button
              key={`${entity.type}-${entity.id}`}
              onClick={() => handleMentionSelect(entity)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50"
            >
              {(entity as any).iconUrl ? (
                <img
                  src={(entity as any).iconUrl}
                  alt={entity.name}
                  className="h-6 w-6"
                />
              ) : entity.icon ? (
                <span className="text-lg">{entity.icon}</span>
              ) : (entity as any).avatar ? (
                <img
                  src={(entity as any).avatar}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">
                  {entity.name[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium text-gray-900">{entity.name}</span>
              {entity.type === 'all' && (
                <span className="text-xs text-gray-500">
                  Notify all members
                </span>
              )}
              {entity.type === 'all_ai' && (
                <span className="text-xs text-gray-500">Ask all AIs</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ to mention"
            rows={1}
            className="max-h-32 min-h-[44px] w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
        </div>

        {/* Quick AI Mention Buttons */}
        <div className="flex gap-1">
          {topic.aiMembers.slice(0, 2).map((ai) => {
            const model = AI_MODELS.find((m) => m.id === ai.aiModel);
            return (
              <button
                key={ai.id}
                onClick={() =>
                  setContent((prev) => `${prev}@${ai.displayName} `)
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
                title={`Mention ${ai.displayName}`}
              >
                {model?.iconUrl ? (
                  <img
                    src={model.iconUrl}
                    alt={model.name}
                    className="h-6 w-6"
                  />
                ) : (
                  <span className="text-lg">
                    {(model as any)?.icon || '🤖'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Main Topic Page Component
export default function TopicPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const { user, accessToken, isLoading: authLoading } = useAuth();

  const isAuthenticated = !!accessToken;

  const {
    currentTopic,
    messages,
    isLoadingMessages,
    hasMoreMessages,
    onlineUsers,
    typingUsers,
    typingAIs,
    fetchTopic,
    fetchMessages,
    sendMessage,
    addReaction,
    removeReaction,
    connectSocket,
    disconnectSocket,
    joinTopicRoom,
    leaveTopicRoom,
    sendTyping,
    clearMessages,
    generateAIResponse,
  } = useAiGroupStore();

  const [replyTo, setReplyTo] = useState<TopicMessage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load topic and messages
  useEffect(() => {
    if (!authLoading && isAuthenticated && topicId) {
      fetchTopic(topicId);
      clearMessages();
      fetchMessages(topicId);
    }
  }, [
    authLoading,
    isAuthenticated,
    topicId,
    fetchTopic,
    fetchMessages,
    clearMessages,
  ]);

  // Connect to WebSocket
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connectSocket(user.id);
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user?.id, connectSocket, disconnectSocket]);

  // Join topic room
  useEffect(() => {
    if (topicId) {
      joinTopicRoom(topicId);

      return () => {
        leaveTopicRoom(topicId);
      };
    }
  }, [topicId, joinTopicRoom, leaveTopicRoom]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (
      content: string,
      mentions: {
        userId?: string;
        aiMemberId?: string;
        mentionType: MentionType;
      }[]
    ) => {
      if (!topicId || !currentTopic) return;

      await sendMessage(topicId, {
        content,
        contentType: MessageContentType.TEXT,
        replyToId: replyTo?.id,
        mentions,
      });

      setReplyTo(null);
      // AI responses are handled by the backend controller automatically
      // No need to trigger them here - that would cause duplicate responses
    },
    [topicId, currentTopic, sendMessage, replyTo]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!topicId || !user?.id) return;

      const message = messages.find((m) => m.id === messageId);
      const hasReaction = message?.reactions?.some(
        (r) => r.userId === user.id && r.emoji === emoji
      );

      if (hasReaction) {
        await removeReaction(topicId, messageId, emoji);
      } else {
        await addReaction(topicId, messageId, emoji);
      }
    },
    [topicId, user?.id, messages, addReaction, removeReaction]
  );

  const handleLoadMore = useCallback(() => {
    if (hasMoreMessages && !isLoadingMessages && topicId) {
      const oldestMessage = messages[0];
      if (oldestMessage) {
        fetchMessages(topicId, oldestMessage.id);
      }
    }
  }, [hasMoreMessages, isLoadingMessages, topicId, messages, fetchMessages]);

  // Handle invite member
  const handleInviteMember = useCallback(async () => {
    if (!inviteEmail.trim() || !topicId || !accessToken) return;

    setIsInviting(true);
    setInviteError('');

    try {
      // First, search for user by email
      const searchResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/users/search?email=${encodeURIComponent(inviteEmail.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error('User not found');
      }

      const userData = await searchResponse.json();
      if (!userData || !userData.id) {
        throw new Error('User not found with this email');
      }

      // Add member to topic
      const addResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/topics/${topicId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: userData.id,
            role: 'MEMBER',
          }),
        }
      );

      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.message || 'Failed to add member');
      }

      // Refresh topic data
      await fetchTopic(topicId);

      // Close dialog and reset
      setShowInviteDialog(false);
      setInviteEmail('');
    } catch (error: any) {
      setInviteError(error.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  }, [inviteEmail, topicId, accessToken, fetchTopic]);

  // Check if current user is owner or admin
  const currentUserMember = currentTopic?.members.find(
    (m) => m.userId === user?.id
  );
  const isOwnerOrAdmin =
    currentUserMember?.role === TopicRole.OWNER ||
    currentUserMember?.role === TopicRole.ADMIN;

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-8">
        <h2 className="text-xl font-semibold text-gray-700">
          Please sign in to access this topic
        </h2>
        <Link href="/ai-group" className="text-blue-600 hover:underline">
          Back to AI Group
        </Link>
      </div>
    );
  }

  if (!currentTopic) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Member Panel */}
      <MemberPanel
        topic={currentTopic}
        onlineUsers={onlineUsers}
        typingUsers={typingUsers}
        typingAIs={typingAIs}
        onMemberClick={(member) => {
          // Could show member profile or initiate DM
          console.log('Member clicked:', member);
        }}
        onAIClick={(ai) => {
          // Could show AI config or quick mention
          console.log('AI clicked:', ai);
        }}
        onInviteMember={() => setShowInviteDialog(true)}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />

      {/* Main Chat Area */}
      <main className="flex flex-1 flex-col">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-xl">
              {currentTopic.avatar || '💬'}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">
                {currentTopic.name}
              </h1>
              {currentTopic.description && (
                <p className="text-sm text-gray-500">
                  {currentTopic.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResources(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Resources"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowSummary(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Meeting Summaries"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Settings"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-auto">
          {/* Load More Button */}
          {hasMoreMessages && (
            <div className="py-4 text-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMessages}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoadingMessages ? 'Loading...' : 'Load older messages'}
              </button>
            </div>
          )}

          {/* Messages */}
          {messages.length === 0 && !isLoadingMessages ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <svg
                className="mb-4 h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="mt-1 text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="py-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === user?.id}
                  onReply={setReplyTo}
                  onReact={handleReaction}
                  currentUserId={user?.id || ''}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Typing Indicators */}
          {(typingUsers.size > 0 || typingAIs.size > 0) && (
            <div className="px-4 pb-2 text-sm italic text-gray-400">
              {Array.from(typingUsers)
                .map((userId) => {
                  const member = currentTopic.members.find(
                    (m) => m.userId === userId
                  );
                  return (
                    member?.user.fullName || member?.user.username || 'Someone'
                  );
                })
                .concat(
                  Array.from(typingAIs).map((aiId) => {
                    const ai = currentTopic.aiMembers.find(
                      (a) => a.id === aiId
                    );
                    return ai?.displayName || 'AI';
                  })
                )
                .join(', ')}{' '}
              {typingUsers.size + typingAIs.size > 1 ? 'are' : 'is'} typing...
            </div>
          )}
        </div>

        {/* Message Input */}
        <MessageInput
          topic={currentTopic}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          onSend={handleSendMessage}
          onTyping={() => sendTyping(topicId)}
        />
      </main>

      {/* Dialogs */}
      {showSettings && (
        <TopicSettingsDialog
          topic={currentTopic}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showResources && (
        <ResourcesPanel
          topic={currentTopic}
          onClose={() => setShowResources(false)}
        />
      )}
      {showSummary && (
        <SummaryDialog
          topic={currentTopic}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Invite Member Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Invite Member
              </h2>
              <button
                onClick={() => {
                  setShowInviteDialog(false);
                  setInviteEmail('');
                  setInviteError('');
                }}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Enter the email address of the user you want to invite to this
              group.
            </p>

            <div className="mb-4">
              <label
                htmlFor="invite-email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isInviting}
              />
              {inviteError && (
                <p className="mt-1 text-sm text-red-500">{inviteError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowInviteDialog(false);
                  setInviteEmail('');
                  setInviteError('');
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                disabled={isInviting}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteMember}
                disabled={!inviteEmail.trim() || isInviting}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInviting ? 'Inviting...' : 'Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
