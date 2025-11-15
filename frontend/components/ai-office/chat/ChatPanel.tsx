'use client';

/**
 * AI交互面板组件
 * 包含对话历史、输入框、快捷操作
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  useChatStore,
  useDocumentStore,
  useResourceStore,
} from '@/stores/aiOfficeStore';
import { Send, Paperclip, Sparkles, FileText, StopCircle } from 'lucide-react';
import DocumentGenerationWizard, {
  type GenerationConfig,
} from '../document/DocumentGenerationWizard';
import GenerationProgress from '../document/GenerationProgress';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  const {
    isStreaming,
    setStreaming,
    addMessage,
    stopGeneration,
    shouldStopGeneration,
  } = useChatStore();
  const currentDocumentId =
    useDocumentStore((state) => state.currentDocumentId) || 'default';
  const messages = useChatStore(
    (state) => state.sessions[currentDocumentId] || []
  );
  const {
    addDocument,
    setCurrentDocument,
    setGenerating,
    isGenerating,
    generationSteps,
    currentStep,
    resourcesFound,
    estimatedTime,
    setGenerationSteps,
    updateGenerationStep,
    setCurrentStep,
    setResourcesFound,
  } = useDocumentStore();
  const selectedResourceIds = useResourceStore(
    (state) => state.selectedResourceIds
  );
  const resources = useResourceStore((state) => state.resources);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // 检测 @ 提及
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInput(value);
    setCursorPosition(cursorPos);

    // 查找当前光标位置的 @ 符号
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // 如果 @ 后面没有空格，显示提及菜单
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentionMenu(true);
        setSelectedMentionIndex(0); // 重置选中索引

        // 计算菜单位置（简化版，实际需要更精确的计算）
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setMentionPosition({
            top: rect.top - 200,
            left: rect.left + 20,
          });
        }
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  };

  // 过滤资源列表
  const filteredResources = resources.filter((r) => {
    const title = r.metadata?.title || '无标题';
    return title.toLowerCase().includes(mentionSearch);
  });

  // 选择提及项
  const selectMention = (resourceId: string | 'all') => {
    const textBeforeCursor = input.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const mention =
        resourceId === 'all'
          ? '@all '
          : `@${resources.find((r) => r._id === resourceId)?.metadata?.title || resourceId} `;

      const newInput =
        input.slice(0, lastAtIndex) + mention + input.slice(cursorPosition);

      setInput(newInput);
      setShowMentionMenu(false);

      // 聚焦回输入框
      setTimeout(() => {
        inputRef.current?.focus();
        const newCursorPos = lastAtIndex + mention.length;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
  };

  // 解析输入中的 @ 提及，返回被提及的资源ID列表
  const parseMentions = (text: string): string[] => {
    const mentionRegex = /@(all|[^\s@]+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionText = match[1];
      if (mentionText === 'all') {
        return resources.map((r) => r._id); // @all 返回所有资源
      } else {
        // 查找匹配的资源
        const resource = resources.find(
          (r) => r.metadata?.title === mentionText || r._id === mentionText
        );
        if (resource) {
          mentions.push(resource._id);
        }
      }
    }

    return mentions;
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = {
      id: Date.now().toString(),
      documentId: currentDocumentId,
      role: 'user' as const,
      content: input,
      timestamp: new Date(),
    };

    // 添加用户消息
    addMessage(currentDocumentId, userMessage);
    const userInput = input;
    setInput('');

    // 设置为正在生成状态
    setStreaming(true);

    try {
      // 解析 @ 提及，获取资源列表
      const mentionedResourceIds = parseMentions(userInput);

      // 如果有 @ 提及，使用提及的资源；否则使用选中的资源
      const resourceIdsToUse =
        mentionedResourceIds.length > 0
          ? mentionedResourceIds
          : useResourceStore.getState().selectedResourceIds;

      const selectedResources = useResourceStore
        .getState()
        .resources.filter((r) => resourceIdsToUse.includes(r._id));

      // 调用AI Office API
      const response = await fetch('/api/ai-office/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          resources: selectedResources,
          documentId: currentDocumentId,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service request failed');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';

      // 创建AI消息
      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage = {
        id: aiMessageId,
        documentId: currentDocumentId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date(),
      };
      addMessage(currentDocumentId, aiMessage);

      if (reader) {
        while (true) {
          // 检查是否需要停止
          if (useChatStore.getState().shouldStopGeneration) {
            reader.cancel();
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  aiContent += parsed.content;
                  // 更新消息内容
                  useChatStore
                    .getState()
                    .updateMessage(currentDocumentId, aiMessageId, {
                      content: aiContent,
                    });
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      setStreaming(false);
    } catch (error) {
      console.error('AI chat error:', error);
      // 添加错误消息
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        documentId: currentDocumentId,
        role: 'assistant' as const,
        content: '抱歉，AI服务暂时不可用，请稍后再试。',
        timestamp: new Date(),
      };
      addMessage(currentDocumentId, errorMessage);
      setStreaming(false);
    }
  };

  // 生成文档
  const handleGenerateDocument = async (config: GenerationConfig) => {
    if (isStreaming || selectedResourceIds.length === 0) return;

    setGenerating(true);
    setStreaming(true);

    // 初始化生成步骤
    const steps = [
      {
        id: 'prepare',
        name: '准备资源',
        status: 'processing' as const,
        message: '正在分析选中的资源...',
      },
      {
        id: 'expand',
        name: '智能扩展',
        status: 'pending' as const,
        message: '搜索相关图片、数据和文献',
      },
      {
        id: 'outline',
        name: '生成大纲',
        status: 'pending' as const,
        message: '根据模板和资源生成文档结构',
      },
      {
        id: 'content',
        name: '生成内容',
        status: 'pending' as const,
        message: 'AI正在编写文档内容',
      },
      {
        id: 'finalize',
        name: '完成',
        status: 'pending' as const,
        message: '整理和格式化文档',
      },
    ];
    setGenerationSteps(steps);
    setCurrentStep('prepare');

    try {
      // 获取选中的资源
      const selectedResources = useResourceStore
        .getState()
        .resources.filter((r) => selectedResourceIds.includes(r._id));

      // 步骤1: 准备资源 - 完成
      setTimeout(() => {
        updateGenerationStep('prepare', {
          status: 'completed',
          message: `已加载 ${selectedResources.length} 个资源`,
        });
        setCurrentStep('expand');
        updateGenerationStep('expand', {
          status: 'processing',
          message: '正在搜索扩展资源...',
        });
      }, 1000);

      // 步骤2: 智能扩展 (模拟)
      setTimeout(() => {
        setResourcesFound(12); // 模拟找到12个扩展资源
        updateGenerationStep('expand', {
          status: 'completed',
          message: '找到 12 个相关资源',
        });
        setCurrentStep('outline');
        updateGenerationStep('outline', {
          status: 'processing',
          message: '正在生成文档大纲...',
        });
      }, 3000);

      // 构建生成文档的提示
      const templateInfo = `文档类型：${config.template.name}\n详细程度：${config.options.detailLevel}/3\n语言风格：${config.options.tone}`;
      const sectionsInfo = config.template.sections
        .map((s) => `- ${s.title}: ${s.aiPrompt}`)
        .join('\n');

      const prompt =
        messages.length > 0
          ? `基于我们的对话和选中的资源，按照以下要求生成文档：\n\n${templateInfo}\n\n章节要求：\n${sectionsInfo}`
          : `请基于以下资源生成文档：\n${selectedResources.map((r, i) => `${i + 1}. ${r.metadata?.title || '无标题'}`).join('\n')}\n\n${templateInfo}\n\n章节要求：\n${sectionsInfo}`;

      // 调用AI Office API生成文档
      const response = await fetch('/api/ai-office/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          resources: selectedResources,
          generateDocument: true,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Document generation failed');
      }

      // 创建新文档
      const newDocumentId = `doc-${Date.now()}`;
      const newDocument = {
        _id: newDocumentId,
        userId: 'current-user',
        type: 'article' as const,
        title: `${config.template.name} - ${new Date().toLocaleDateString('zh-CN')}`,
        status: 'generating' as const,
        resources: selectedResources.map((r) => ({
          resourceRef: {
            type: r.resourceType,
            collection: `resource-${r.resourceType}`,
            id: r._id,
          },
        })),
        aiConfig: {
          model: 'grok',
          language: 'zh-CN',
          detailLevel: 3,
          professionalLevel: 3,
        },
        generationHistory: [
          {
            timestamp: new Date(),
            action: 'create' as const,
            aiModel: 'grok',
          },
        ],
        metadata: {
          wordCount: 0,
        },
        content: {
          markdown: '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addDocument(newDocument);
      setCurrentDocument(newDocumentId);

      // 步骤3: 生成大纲完成，开始生成内容
      setTimeout(() => {
        updateGenerationStep('outline', {
          status: 'completed',
          message: '文档大纲已生成',
        });
        setCurrentStep('content');
        updateGenerationStep('content', {
          status: 'processing',
          message: 'AI正在编写文档内容...',
        });
      }, 5000);

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let documentContent = '';

      if (reader) {
        while (true) {
          // 检查是否需要停止
          if (useChatStore.getState().shouldStopGeneration) {
            reader.cancel();
            // 标记文档状态为草稿
            useDocumentStore.getState().updateDocument(newDocumentId, {
              status: 'draft' as const,
            } as any);
            break;
          }

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  documentContent += parsed.content;
                  // 更新文档内容
                  useDocumentStore.getState().updateDocument(newDocumentId, {
                    content: {
                      markdown: documentContent,
                    },
                    metadata: {
                      wordCount: documentContent.length,
                    },
                  } as any);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }

      // 步骤4: 内容生成完成，开始最后整理
      updateGenerationStep('content', {
        status: 'completed',
        message: '文档内容已生成',
      });
      setCurrentStep('finalize');
      updateGenerationStep('finalize', {
        status: 'processing',
        message: '正在整理和格式化...',
      });

      // 短暂延迟后完成
      setTimeout(() => {
        updateGenerationStep('finalize', {
          status: 'completed',
          message: '文档生成完成！',
        });
      }, 500);

      // 添加成功消息到聊天
      const successMessage = {
        id: Date.now().toString(),
        documentId: currentDocumentId,
        role: 'assistant' as const,
        content: '✅ 文档已生成完成！您可以在右侧面板查看和编辑。',
        timestamp: new Date(),
      };
      addMessage(currentDocumentId, successMessage);

      setStreaming(false);
      setTimeout(() => setGenerating(false), 1500); // 延迟关闭进度显示，让用户看到完成状态
    } catch (error) {
      console.error('Document generation error:', error);
      const errorMessage = {
        id: Date.now().toString(),
        documentId: currentDocumentId,
        role: 'assistant' as const,
        content: '抱歉，文档生成失败，请稍后再试。',
        timestamp: new Date(),
      };
      addMessage(currentDocumentId, errorMessage);
      setStreaming(false);
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 标题栏 - 固定 */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-700">AI 智能助手</h3>
        </div>
        <div className="text-xs text-gray-500">
          {isStreaming ? (
            <span className="flex items-center space-x-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>生成中...</span>
            </span>
          ) : (
            <span>就绪</span>
          )}
        </div>
      </div>

      {/* 对话历史 */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
              <Sparkles className="mx-auto mb-3 h-12 w-12" />
              <p className="text-sm">开始与AI对话</p>
              <p className="mt-1 text-xs">选择资源后，询问AI帮你生成文档</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div
                    className={`mt-1 text-xs ${
                      message.role === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-gray-100 px-4 py-2 text-gray-900">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-100" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 delay-200" />
                    </div>
                    <span className="text-sm">AI正在思考...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 输入框 - 固定 */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        {/* @ 提及菜单 */}
        {showMentionMenu && (
          <div
            className="fixed z-50 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
            style={{
              top: `${mentionPosition.top}px`,
              left: `${mentionPosition.left}px`,
              minWidth: '250px',
            }}
          >
            {/* @all 选项 */}
            <div
              onClick={() => selectMention('all')}
              className={`flex cursor-pointer items-center space-x-2 border-b border-gray-100 px-4 py-2 hover:bg-blue-50 ${
                selectedMentionIndex === 0 ? 'bg-blue-100' : ''
              }`}
            >
              <span className="font-semibold text-blue-600">@all</span>
              <span className="text-xs text-gray-500">
                ({resources.length} 个资源)
              </span>
            </div>

            {/* 资源列表 */}
            {filteredResources.length > 0 ? (
              filteredResources.map((resource, index) => (
                <div
                  key={resource._id}
                  onClick={() => selectMention(resource._id)}
                  className={`cursor-pointer px-4 py-2 hover:bg-blue-50 ${
                    selectedMentionIndex === index + 1 ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {resource.metadata?.title || '无标题'}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {resource.resourceType}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-sm text-gray-500">
                未找到匹配的资源
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (showMentionMenu) {
                const mentionOptions = [
                  'all',
                  ...filteredResources.map((r) => r._id),
                ];

                // 上箭头 - 向上选择
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedMentionIndex((prev) =>
                    prev > 0 ? prev - 1 : mentionOptions.length - 1
                  );
                }
                // 下箭头 - 向下选择
                else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedMentionIndex((prev) =>
                    prev < mentionOptions.length - 1 ? prev + 1 : 0
                  );
                }
                // Enter - 选择当前项
                else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  selectMention(mentionOptions[selectedMentionIndex]);
                }
                // ESC - 关闭菜单
                else if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowMentionMenu(false);
                }
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入 @ 引用资源 (@all 选择全部)，或直接输入消息... (Enter 发送, Shift+Enter 换行)"
            className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 pb-12 pr-28 transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-0"
            rows={3}
            disabled={isStreaming}
          />
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            <button
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              title="附加资源"
              disabled={isStreaming}
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </button>
            {isStreaming ? (
              <button
                onClick={stopGeneration}
                className="flex items-center space-x-1.5 rounded-lg bg-red-600 px-4 py-2 text-white shadow-sm transition-all hover:bg-red-700"
              >
                <StopCircle className="h-4 w-4" />
                <span className="font-medium">停止</span>
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
              >
                <Send className="h-4 w-4" />
                <span className="font-medium">发送</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 文档生成向导 */}
      <DocumentGenerationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onGenerate={handleGenerateDocument}
        selectedResourceCount={selectedResourceIds.length}
      />

      {/* 生成进度组件 */}
      <GenerationProgress
        isVisible={isGenerating}
        currentStep={currentStep}
        steps={generationSteps}
        resourcesFound={resourcesFound}
        estimatedTime={estimatedTime || undefined}
        onCancel={() => {
          stopGeneration();
          setGenerating(false);
        }}
      />
    </div>
  );
}
