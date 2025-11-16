'use client';

/**
 * 文档编辑器组件
 * 参考Google Docs、腾讯文档等业界最佳实践设计
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDocumentStore } from '@/stores/aiOfficeStore';
import { getTemplateById, PPTTemplate } from '@/lib/ppt-templates';
import {
  FileDown,
  FileText,
  Presentation,
  Download,
  Check,
  Cloud,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';

// 解析markdown为幻灯片
interface Slide {
  title: string;
  content: string[];
  images?: string[]; // 图片URL列表
  layout?: 'title' | 'content' | 'image-left' | 'image-right' | 'image-full'; // 布局类型
}

function parseMarkdownToSlides(markdown: string): Slide[] {
  const slides: Slide[] = [];
  const lines = markdown.split('\n');
  let currentSlide: Slide | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // 检测幻灯片标题（支持多种格式）
    // ### Slide 1, ## 第X页, #### 第X页, ### 封面, ## Slide X: 标题
    const slideHeaderMatch = trimmed.match(/^#{2,4}\s*(Slide\s*\d+|第\s*\d+\s*[页页]|封面|目录|.*页[:：])/i);

    if (slideHeaderMatch) {
      if (currentSlide) {
        // 在推送前确定最终布局
        finalizeSlideLayout(currentSlide);
        slides.push(currentSlide);
      }
      // 提取标题（冒号后的内容，或整个标题）
      const titleMatch = trimmed.match(/[:：]\s*(.+)/) || trimmed.match(/^#{2,4}\s*(.+)/);
      currentSlide = {
        title: titleMatch ? titleMatch[1].trim() : trimmed.replace(/^#{2,4}\s*/, ''),
        content: [],
        images: [],
        layout: 'content',
      };
    } else if (trimmed === '---') {
      // 分隔符，开始新幻灯片
      if (currentSlide) {
        finalizeSlideLayout(currentSlide);
        slides.push(currentSlide);
        currentSlide = null;
      }
    } else if (currentSlide && trimmed) {
      // 检测图片 ![alt](url)
      const imageMatch = trimmed.match(/!\[.*?\]\((.+?)\)/);
      if (imageMatch) {
        currentSlide.images = currentSlide.images || [];
        currentSlide.images.push(imageMatch[1]);
        // 暂不决定布局，等所有内容解析完再决定
      } else {
        // 添加内容行
        currentSlide.content.push(line);
      }
    } else if (!currentSlide && trimmed && !trimmed.startsWith('#')) {
      // 如果还没有幻灯片，创建第一张
      currentSlide = {
        title: 'Slide ' + (slides.length + 1),
        content: [line],
        images: [],
        layout: 'content',
      };
    }
  }

  if (currentSlide) {
    finalizeSlideLayout(currentSlide);
    slides.push(currentSlide);
  }

  return slides;
}

// 在幻灯片内容完全解析后，确定最佳布局
function finalizeSlideLayout(slide: Slide) {
  const hasImages = slide.images && slide.images.length > 0;
  const hasContent = slide.content.length > 0;

  if (!hasImages) {
    // 没有图片，纯文本布局
    slide.layout = 'content';
  } else if (!hasContent) {
    // 只有图片，没有文本
    slide.layout = 'image-full';
  } else {
    // 既有图片又有文本，使用图文混排布局
    // 根据图片索引决定左右位置
    slide.layout = (slide.images?.length || 0) % 2 === 1 ? 'image-left' : 'image-right';
  }
}

export default function DocumentEditor() {
  const currentDocumentId = useDocumentStore(
    (state) => state.currentDocumentId
  );
  const documents = useDocumentStore((state) => state.documents);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  const currentDocument = documents.find((d) => d._id === currentDocumentId);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [exportLoading, setExportLoading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [thumbnailsCollapsed, setThumbnailsCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // 获取当前文档的模板配置
  const template: PPTTemplate = currentDocument?.template?.id
    ? getTemplateById(currentDocument.template.id)
    : getTemplateById('corporate'); // 默认使用商务模板

  // 当文档切换时更新内容和标题
  useEffect(() => {
    if (currentDocument) {
      if (currentDocument.type === 'article') {
        setContent((currentDocument.content as any).markdown || '');
      } else if (currentDocument.type === 'ppt') {
        // PPT类型也使用markdown字段存储内容
        setContent((currentDocument.content as any).markdown || '');
      }
      setTitle(currentDocument.title || '未命名演示文稿');
    } else {
      setContent('');
      setTitle('');
    }
  }, [currentDocument]);

  // 自动保存（防抖） - 内容
  useEffect(() => {
    if (!currentDocumentId || !currentDocument) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      if (
        currentDocument.type === 'article' &&
        (content !== (currentDocument.content as any).markdown ||
          title !== currentDocument.title)
      ) {
        updateDocument(currentDocumentId, {
          title: title,
          content: {
            markdown: content,
          },
          metadata: {
            wordCount: content.length,
          },
          updatedAt: new Date(),
        } as any);
        setLastSaved(new Date());
      }
      setIsSaving(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
      setIsSaving(false);
    };
  }, [content, title, currentDocumentId, currentDocument, updateDocument]);

  // 点击外部关闭导出菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showExportMenu]);

  // 导出文档
  const handleExport = async (format: 'word' | 'pdf' | 'ppt' | 'markdown') => {
    if (!currentDocument) return;

    setShowExportMenu(false); // 关闭菜单
    setExportLoading(format);

    try {
      const response = await fetch('/api/ai-office/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: currentDocument._id,
          format,
          content: (currentDocument.content as any).markdown,
          title: currentDocument.title,
          templateId: currentDocument.template?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDocument.title}.${format === 'word' ? 'docx' : format === 'ppt' ? 'pptx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setExportLoading(null);
    }
  };

  // 创建新空白文档
  const handleCreateBlankDocument = () => {
    const newDocument: any = {
      _id: `doc_${Date.now()}`,
      userId: 'current_user', // TODO: 从认证系统获取
      type: 'article',
      title: '未命名文档',
      status: 'draft',
      resources: [],
      aiConfig: {
        model: 'gpt-4',
        language: 'zh-CN',
        detailLevel: 3,
        professionalLevel: 3,
      },
      generationHistory: [],
      metadata: {
        wordCount: 0,
      },
      content: {
        markdown: '',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 添加文档到store
    useDocumentStore.getState().addDocument(newDocument);
    // 设置为当前文档
    useDocumentStore.getState().setCurrentDocument(newDocument._id);
  };

  if (!currentDocument) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📄</div>
          <p className="mb-4 text-lg font-medium text-gray-700">准备开始创作</p>
          <p className="mb-6 text-sm text-gray-500">
            选择资源并与AI对话，使用 @ 提及开始创作
          </p>
          {/* 新建空白文档按钮 */}
          <button
            onClick={handleCreateBlankDocument}
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FileText className="h-4 w-4" />
            <span>新建空白文档</span>
          </button>
          <p className="mt-3 text-xs text-gray-400">
            或者与AI对话让AI帮你生成文档
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 顶部工具栏 - 简洁专业设计 */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 左侧：文档标题 */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={currentDocument.status === 'generating'}
              className="flex-1 text-base font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-2 py-1 rounded hover:bg-gray-50 focus:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              placeholder="未命名文档"
            />
          </div>

          {/* 右侧：操作区 */}
          <div className="flex items-center space-x-4">
            {/* 保存状态 */}
            <div className="flex items-center space-x-1.5 text-xs text-gray-500">
              {isSaving ? (
                <>
                  <Cloud className="h-3.5 w-3.5 animate-pulse" />
                  <span>保存中</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>已保存</span>
                </>
              ) : null}
            </div>

            {/* 字数统计 */}
            <div className="text-xs text-gray-400">
              {currentDocument.metadata?.wordCount || 0} 字
            </div>

            {/* 导出按钮（下拉菜单） */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportLoading !== null}
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{exportLoading ? '导出中...' : '导出'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* 下拉菜单 */}
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => handleExport('word')}
                      className="flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Word 文档</div>
                        <div className="text-xs text-gray-400">.docx</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('ppt')}
                      className="flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <Presentation className="h-4 w-4 text-orange-600" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">PowerPoint</div>
                        <div className="text-xs text-gray-400">.pptx</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <Download className="h-4 w-4 text-red-600" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">PDF 文档</div>
                        <div className="text-xs text-gray-400">.pdf</div>
                      </div>
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => handleExport('markdown')}
                      className="flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      role="menuitem"
                    >
                      <FileDown className="h-4 w-4 text-gray-600" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">Markdown</div>
                        <div className="text-xs text-gray-400">.md</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 文档编辑区域 */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {currentDocument?.type === 'ppt' ? (
          // PPT 幻灯片预览 - 左右布局
          (() => {
            const slides = parseMarkdownToSlides(content);
            if (slides.length === 0) {
              return (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Presentation className="h-16 w-16 mx-auto mb-4" />
                    <p>AI正在生成幻灯片内容...</p>
                  </div>
                </div>
              );
            }

            // 渲染单行内容（处理markdown格式）
            const renderLine = (line: string) => {
              // 移除markdown标记并渲染
              let processed = line
                .replace(/^\*\*(.+?)\*\*[:：]\s*\*\*/, '') // 移除 **标题**: **
                .replace(/^\*\*(.+?)\*\*[:：]?/, '<strong>$1</strong>') // **粗体**:
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **粗体**
                .replace(/^-\s+/, '• ') // 列表符号
                .replace(/^\d+\.\s+/, (match) => match); // 数字列表

              return processed;
            };

            const currentSlide = slides[currentSlideIndex] || slides[0];

            return (
              <div className="flex flex-col h-full">
                {/* 顶部缩略图区域 - 可折叠 */}
                <div
                  className={`border-b border-gray-200 bg-white transition-all duration-300 ${
                    thumbnailsCollapsed ? 'h-0 overflow-hidden' : 'h-auto'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase">
                        所有幻灯片 ({slides.length})
                      </div>
                      <button
                        onClick={() => setThumbnailsCollapsed(!thumbnailsCollapsed)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={thumbnailsCollapsed ? '展开缩略图' : '收起缩略图'}
                      >
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>

                    {/* 水平滚动缩略图 */}
                    <div className="relative">
                      <div className="overflow-x-auto flex space-x-2 pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {slides.map((slide, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlideIndex(idx)}
                            className={`flex-shrink-0 w-36 border-2 rounded-lg p-2 text-left transition-all hover:border-blue-500 ${
                              idx === currentSlideIndex
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              第 {idx + 1} 页
                            </div>
                            <div className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">
                              {slide.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 折叠状态下显示的展开按钮 */}
                {thumbnailsCollapsed && (
                  <div className="border-b border-gray-200 bg-white">
                    <button
                      onClick={() => setThumbnailsCollapsed(false)}
                      className="w-full py-1.5 flex items-center justify-center space-x-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <span>展开缩略图</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* 主幻灯片预览区域 */}
                <div className="flex-1 p-8 flex flex-col">
                  {/* 导航栏 */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-sm text-gray-500">
                      幻灯片 {currentSlideIndex + 1} / {slides.length}
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* 编辑/预览模式切换 */}
                      <button
                        onClick={() => {
                          if (isEditMode) {
                            // 保存编辑内容
                            if (editingContent !== content) {
                              setContent(editingContent);
                            }
                          } else {
                            setEditingContent(content);
                          }
                          setIsEditMode(!isEditMode);
                        }}
                        className={`flex items-center space-x-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                          isEditMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'border border-gray-300 hover:bg-white'
                        }`}
                      >
                        {isEditMode ? (
                          <>
                            <Eye className="h-4 w-4" />
                            <span>预览</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4" />
                            <span>编辑</span>
                          </>
                        )}
                      </button>

                      {/* 翻页按钮 */}
                      <button
                        onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                        disabled={currentSlideIndex === 0}
                        className="flex items-center space-x-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>上一页</span>
                      </button>
                      <button
                        onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
                        disabled={currentSlideIndex === slides.length - 1}
                        className="flex items-center space-x-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>下一页</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 幻灯片预览/编辑 */}
                  <div className="flex-1 flex items-center justify-center">
                    {isEditMode ? (
                      // 编辑模式 - 显示markdown编辑器
                      <div className="w-full max-w-5xl h-full flex flex-col">
                        <div className="flex-1 bg-white rounded-2xl shadow-2xl p-6">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full h-full resize-none border border-gray-200 rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="在此编辑幻灯片内容（Markdown格式）&#x0A;&#x0A;示例：&#x0A;### Slide 1: 标题&#x0A;- 要点1&#x0A;- 要点2&#x0A;![图片](https://example.com/image.jpg)&#x0A;&#x0A;---&#x0A;&#x0A;### Slide 2: 下一页标题&#x0A;..."
                          />
                        </div>
                      </div>
                    ) : (
                      // 预览模式 - 使用模板样式渲染
                      <div
                        className="rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden relative"
                        style={{
                          aspectRatio: '16/9',
                          backgroundColor: template.colors.background,
                          backgroundImage: template.colors.backgroundOverlay
                            ? template.colors.backgroundOverlay.startsWith('linear')
                              ? template.colors.backgroundOverlay
                              : `linear-gradient(135deg, ${template.colors.background}, ${template.colors.background})`
                            : undefined,
                        }}
                      >
                        {/* 顶部装饰条 */}
                        {template.decorations.showTopBar && (
                          <div
                            className="absolute top-0 left-0 right-0 h-2"
                            style={{ backgroundColor: template.colors.decorative }}
                          />
                        )}

                        {/* 半透明右侧覆盖层（Genspark风格） */}
                        {template.style.layoutStyle === 'dark' && template.colors.backgroundOverlay && !template.colors.backgroundOverlay.startsWith('linear') && (
                          <div
                            className="absolute top-0 right-0 bottom-0 w-2/3"
                            style={{
                              background: template.colors.backgroundOverlay,
                            }}
                          />
                        )}

                        {/* 底部装饰条 */}
                        {template.decorations.showBottomBar && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-1.5"
                            style={{ backgroundColor: template.colors.decorative }}
                          />
                        )}

                        {/* 主内容区 */}
                        <div className="relative z-10 p-12 h-full flex flex-col">
                          {/* 幻灯片标题 */}
                          <div className="mb-6">
                            <h1
                              className="font-bold mb-2"
                              style={{
                                fontSize: `${template.typography.title}px`,
                                color: template.style.layoutStyle === 'dark' ? template.colors.textLight : template.colors.primary,
                                fontFamily: template.fonts.heading,
                              }}
                            >
                              {currentSlide.title}
                            </h1>
                            {/* 标题下划线 */}
                            {template.decorations.showTitleUnderline && (
                              <div
                                className="h-1 rounded-full"
                                style={{
                                  width: '80px',
                                  backgroundColor: template.colors.decorative,
                                }}
                              />
                            )}
                          </div>

                        {/* 根据布局渲染内容 */}
                        {currentSlide.layout === 'image-full' && currentSlide.images && currentSlide.images.length > 0 ? (
                          // 全图布局
                          <div className="h-full flex items-center justify-center">
                            <img
                              src={currentSlide.images[0]}
                              alt="Slide visual"
                              className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                            />
                          </div>
                        ) : (currentSlide.layout === 'image-left' || currentSlide.layout === 'image-right') && currentSlide.images && currentSlide.images.length > 0 ? (
                          // 图文混排布局
                          <div className={`grid grid-cols-2 gap-8 h-full ${
                            currentSlide.layout === 'image-left' ? 'grid-flow-col-dense' : ''
                          }`}>
                            {currentSlide.layout === 'image-left' && (
                              <div className="flex items-center justify-center">
                                <img
                                  src={currentSlide.images[0]}
                                  alt="Slide visual"
                                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                                />
                              </div>
                            )}
                            <div className="space-y-3 overflow-y-auto">
                              {currentSlide.content.map((line, idx) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;

                                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                                  const text = trimmed.replace(/^[-•]\s*/, '');
                                  return (
                                    <div key={idx} className="flex items-start space-x-3">
                                      <span
                                        className="mt-1 font-bold"
                                        style={{
                                          color: template.colors.decorative,
                                          fontSize: `${template.typography.body + 2}px`,
                                        }}
                                      >
                                        •
                                      </span>
                                      <p
                                        className="leading-relaxed flex-1"
                                        style={{
                                          fontSize: `${template.typography.body - 1}px`,
                                          color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                          fontFamily: template.fonts.body,
                                        }}
                                        dangerouslySetInnerHTML={{ __html: renderLine(text) }}
                                      />
                                    </div>
                                  );
                                }

                                if (trimmed.match(/^\d+\./)) {
                                  return (
                                    <p
                                      key={idx}
                                      className="leading-relaxed pl-6"
                                      style={{
                                        fontSize: `${template.typography.body - 1}px`,
                                        color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                        fontFamily: template.fonts.body,
                                      }}
                                      dangerouslySetInnerHTML={{ __html: renderLine(trimmed) }}
                                    />
                                  );
                                }

                                return (
                                  <p
                                    key={idx}
                                    className="leading-relaxed"
                                    style={{
                                      fontSize: `${template.typography.body - 1}px`,
                                      color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                      fontFamily: template.fonts.body,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderLine(trimmed) }}
                                  />
                                );
                              })}
                            </div>
                            {currentSlide.layout === 'image-right' && (
                              <div className="flex items-center justify-center">
                                <img
                                  src={currentSlide.images[0]}
                                  alt="Slide visual"
                                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          // 纯文本布局 - 使用模板样式
                          <div className="flex-1 space-y-3 overflow-y-auto">
                            {currentSlide.content.map((line, idx) => {
                              const trimmed = line.trim();
                              if (!trimmed) return null;

                              // 列表项
                              if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                                const text = trimmed.replace(/^[-•]\s*/, '');
                                return (
                                  <div key={idx} className="flex items-start space-x-3">
                                    <span
                                      className="mt-1 font-bold"
                                      style={{
                                        color: template.colors.decorative,
                                        fontSize: `${template.typography.body + 4}px`,
                                      }}
                                    >
                                      •
                                    </span>
                                    <p
                                      className="leading-relaxed flex-1"
                                      style={{
                                        fontSize: `${template.typography.body}px`,
                                        color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                        fontFamily: template.fonts.body,
                                      }}
                                      dangerouslySetInnerHTML={{ __html: renderLine(text) }}
                                    />
                                  </div>
                                );
                              }

                              // 数字列表
                              if (trimmed.match(/^\d+\./)) {
                                return (
                                  <p
                                    key={idx}
                                    className="leading-relaxed pl-6"
                                    style={{
                                      fontSize: `${template.typography.body}px`,
                                      color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                      fontFamily: template.fonts.body,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderLine(trimmed) }}
                                  />
                                );
                              }

                              // 备注或说明
                              if (trimmed.includes('备注') || trimmed.includes('说明')) {
                                return (
                                  <p
                                    key={idx}
                                    className="italic mt-6 pt-6"
                                    style={{
                                      fontSize: `${template.typography.caption}px`,
                                      color: template.colors.textTertiary,
                                      borderTop: `1px solid ${template.colors.textTertiary}20`,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: renderLine(trimmed) }}
                                  />
                                );
                              }

                              // 普通段落
                              return (
                                <p
                                  key={idx}
                                  className="leading-relaxed"
                                  style={{
                                    fontSize: `${template.typography.body}px`,
                                    color: template.style.layoutStyle === 'dark' ? template.colors.text : template.colors.text,
                                    fontFamily: template.fonts.body,
                                  }}
                                  dangerouslySetInnerHTML={{ __html: renderLine(trimmed) }}
                                />
                              );
                            })}
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          // 普通文档编辑器
          <div className="mx-auto max-w-4xl bg-white shadow-sm rounded-lg">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={currentDocument?.status === 'generating'}
              className="w-full resize-none border-none p-12 text-base leading-relaxed text-gray-900 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="开始撰写您的文档..."
              style={{
                minHeight: '842px',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", "Microsoft YaHei", sans-serif',
                fontSize: '16px',
                lineHeight: '1.75',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
