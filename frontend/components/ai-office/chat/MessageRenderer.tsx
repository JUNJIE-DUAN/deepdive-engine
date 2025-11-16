'use client';

/**
 * Genspark风格的富文本消息渲染器
 * 提供优雅的Markdown渲染，超越Genspark的视觉体验
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

export default function MessageRenderer({
  content,
  role,
}: MessageRendererProps) {
  return (
    <div
      className={`message-renderer prose prose-slate max-w-none ${role === 'assistant' ? 'ai-message' : 'user-message'}`}
    >
      <ReactMarkdown
        components={{
          // 标题渲染 - Genspark风格
          h1: ({ node, ...props }) => (
            <h1
              className="mb-4 mt-6 border-b-2 border-blue-500 pb-2 text-2xl font-bold text-gray-900"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="mb-3 mt-5 flex items-center gap-2 text-xl font-bold text-gray-800 before:h-6 before:w-1 before:rounded-full before:bg-blue-500 before:content-['']"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="mb-2 mt-4 text-lg font-semibold text-gray-700"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="mb-2 mt-3 text-base font-semibold text-gray-700"
              {...props}
            />
          ),

          // 段落 - 增加行高和间距
          p: ({ node, ...props }) => (
            <p className="my-3 leading-relaxed text-gray-700" {...props} />
          ),

          // 列表 - Genspark风格的色块标记
          ul: ({ node, ...props }) => (
            <ul className="my-4 space-y-2 pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-4 list-decimal space-y-2 pl-6" {...props} />
          ),
          li: ({ node, ...props }: any) => {
            const isOrdered = node?.ordered || false;
            return (
              <li
                className={`
                  ${isOrdered ? 'list-decimal' : 'list-none'}
                  ${!isOrdered ? 'flex items-start gap-3 before:mt-2 before:h-2 before:w-2 before:flex-shrink-0 before:rounded-full before:bg-gradient-to-br before:from-blue-500 before:to-blue-600 before:content-[""]' : ''}
                  text-gray-700
                `}
                {...props}
              />
            );
          },

          // 引用块 - 带左侧色条
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-4 rounded-r border-l-4 border-blue-500 bg-blue-50 py-3 pl-4 pr-4 italic text-gray-700"
              {...props}
            />
          ),

          // 代码块 - 语法高亮
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline ? (
              <div className="my-4 overflow-hidden rounded-lg shadow-md">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2 font-mono text-xs text-gray-300">
                  <span>{language || 'code'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        String(children).replace(/\n$/, '')
                      );
                    }}
                    className="text-gray-400 transition-colors hover:text-white"
                  >
                    复制
                  </button>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language || 'text'}
                  PreTag="div"
                  className="!mb-0 !mt-0"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-red-600"
                {...props}
              >
                {children}
              </code>
            );
          },

          // 表格 - 优雅样式
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="min-w-full border-collapse overflow-hidden rounded-lg bg-white shadow-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              {...props}
            />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-3 text-left text-sm font-semibold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700"
              {...props}
            />
          ),
          tr: ({ node, ...props }) => (
            <tr className="transition-colors hover:bg-blue-50" {...props} />
          ),

          // 链接 - 带下划线和悬停效果
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 underline decoration-blue-300 transition-colors hover:text-blue-800 hover:decoration-blue-600"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // 强调文本
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-800" {...props} />
          ),

          // 分隔线
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t-2 border-gray-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .message-renderer.ai-message {
          @apply rounded-lg bg-gradient-to-br from-white to-blue-50/30 p-4 shadow-sm;
        }

        .message-renderer.user-message {
          @apply rounded-lg bg-white p-4;
        }

        /* 优化prose样式 */
        .prose {
          @apply text-base;
        }

        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          @apply font-sans;
        }

        /* 列表嵌套样式 */
        .prose ul ul,
        .prose ol ul,
        .prose ul ol,
        .prose ol ol {
          @apply my-2;
        }

        /* 代码块滚动条样式 */
        .prose pre::-webkit-scrollbar {
          height: 8px;
        }

        .prose pre::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }

        .prose pre::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .prose pre::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
