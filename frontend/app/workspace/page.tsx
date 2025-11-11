'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportWorkspace } from '@/lib/use-report-workspace';
import { config } from '@/lib/config';

export default function WorkspacePage() {
  const router = useRouter();
  const { resources, removeResource, clearAll } = useReportWorkspace();
  const [messages, setMessages] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedResourceIds, setSelectedResourceIds] = useState<Set<string>>(
    new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 如果没有资源，返回主页
  useEffect(() => {
    if (resources.length === 0) {
      router.push('/');
    }
  }, [resources.length, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedResourceIds.size === resources.length) {
      setSelectedResourceIds(new Set());
    } else {
      setSelectedResourceIds(new Set(resources.map((r) => r.id)));
    }
  };

  const getActiveResources = () => {
    // If no resources are selected, use all resources
    if (selectedResourceIds.size === 0) {
      return resources;
    }
    // Otherwise, use only selected resources
    return resources.filter((r) => selectedResourceIds.has(r.id));
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [
      ...messages,
      { role: 'user' as const, content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    const activeResources = getActiveResources();

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/reports/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resources: activeResources.map((r) => ({
            id: r.id,
            title: r.title,
            abstract: r.abstract,
            type: r.type,
          })),
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          model: 'grok',
        }),
      });

      if (!response.ok) {
        throw new Error('AI响应失败');
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: data.message || '收到回复但内容为空',
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant' as const,
          content: '抱歉，发送消息失败。请重试。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `生成报告：${templateId}`,
      },
    ]);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/reports/generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resourceIds: resources.map((r) => r.id),
            template: templateId,
            userId: '557be1bd-62cb-4125-a028-5ba740b66aca',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('生成报告失败');
      }

      const report = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: report.content || '报告生成成功',
        },
      ]);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，生成报告失败。请重试。',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Sources */}
      <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Sources</h2>
            <button
              onClick={() => router.push('/')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="返回主页"
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
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              {resources.length} {resources.length === 1 ? 'source' : 'sources'}
              {selectedResourceIds.size > 0 && (
                <span className="ml-2 font-medium text-blue-600">
                  ({selectedResourceIds.size} selected)
                </span>
              )}
            </div>
            <button
              onClick={toggleSelectAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {selectedResourceIds.size === resources.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
        </div>

        {/* Sources List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className={`group relative cursor-pointer rounded-lg border bg-white p-3 transition-all hover:border-gray-300 hover:shadow-sm ${
                selectedResourceIds.has(resource.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
              onClick={() => toggleResourceSelection(resource.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeResource(resource.id);
                }}
                className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 opacity-0 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
              >
                <svg
                  className="h-3.5 w-3.5"
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

              <div className="flex items-start gap-3 pr-6">
                <input
                  type="checkbox"
                  checked={selectedResourceIds.has(resource.id)}
                  onChange={() => toggleResourceSelection(resource.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                    {resource.type}
                  </div>
                  <div className="line-clamp-2 text-sm leading-snug text-gray-900">
                    {resource.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-100 p-4">
          <button
            onClick={() => clearAll()}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            清空所有资源
          </button>
        </div>
      </div>

      {/* Main Panel - Chat */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 bg-white px-8 py-5">
          <h1 className="text-lg font-semibold text-gray-900">工作区</h1>
          <p className="mt-1 text-sm text-gray-500">
            询问AI关于这些资源的问题，或生成综合报告
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <h3 className="mb-3 text-2xl font-semibold text-gray-900">
                与你的资源对话
              </h3>
              <p className="mb-8 max-w-lg text-base text-gray-500">
                询问关于这些资源的问题，我会基于内容为你提供答案
              </p>

              {/* Quick Actions Grid */}
              <div className="mb-6 grid w-full max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  onClick={() => handleGenerateReport('comparison')}
                  disabled={loading || resources.length < 2}
                  className="group rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-red-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:shadow-none"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 transition-colors group-hover:bg-red-100">
                      <svg
                        className="h-5 w-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">
                        生成对比分析
                      </h4>
                      <p className="text-sm text-gray-500">
                        对比多个资源的异同点和关键洞察
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleGenerateReport('summary')}
                  disabled={loading}
                  className="group rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-red-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                      <svg
                        className="h-5 w-5 text-blue-600"
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
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">
                        生成综合摘要
                      </h4>
                      <p className="text-sm text-gray-500">
                        汇总所有资源的核心内容和要点
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInput('这些资源的主要观点是什么？')}
                  disabled={loading}
                  className="group rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-red-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 transition-colors group-hover:bg-purple-100">
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">
                        提取关键观点
                      </h4>
                      <p className="text-sm text-gray-500">
                        识别和总结核心思想
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInput('能否找出这些资源之间的联系和差异？')}
                  disabled={loading}
                  className="group rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-red-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 transition-colors group-hover:bg-green-100">
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold text-gray-900">
                        发现联系差异
                      </h4>
                      <p className="text-sm text-gray-500">
                        分析资源间的关联和不同
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-xl px-5 py-3.5 ${
                      message.role === 'user'
                        ? 'bg-red-500 text-white'
                        : message.content.includes('抱歉') ||
                            message.content.includes('失败')
                          ? 'border-2 border-red-200 bg-red-50 text-red-800'
                          : 'border border-gray-200 bg-white text-gray-900'
                    }`}
                  >
                    {message.content.includes('抱歉') ||
                    message.content.includes('失败') ? (
                      <div className="flex items-start gap-3">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div>
                          <div className="mb-1 font-medium">生成失败</div>
                          <div className="text-sm text-red-700">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white p-6">
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && !e.shiftKey && handleSendMessage()
                }
                placeholder="询问关于这些资源的问题..."
                disabled={loading}
                className="w-full rounded-xl border-2 border-gray-200 py-3.5 pl-4 pr-12 text-sm transition-colors focus:border-red-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-500"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
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
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Source count indicator */}
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              AI将基于 {resources.length} 个资源回答问题
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
