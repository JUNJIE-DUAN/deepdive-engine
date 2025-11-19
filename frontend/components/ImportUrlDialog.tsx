'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

type ResourceType =
  | 'PAPER'
  | 'BLOG'
  | 'NEWS'
  | 'YOUTUBE_VIDEO'
  | 'REPORT'
  | 'EVENT'
  | 'RSS';

interface ImportUrlDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onImportSuccess: () => void;
  apiBaseUrl: string;
}

interface ParsedMetadata {
  url: string;
  domain: string;
  title: string;
  description?: string;
  imageUrl?: string;
  authors?: string[];
  publishedDate?: string;
  language: string;
  contentType: string;
  siteName?: string;
  canonicalUrl?: string;
  favicon?: string;
  wordCount?: number;
}

type DialogStep = 'input-url' | 'preview' | 'confirm';

const RESOURCE_TYPE_DISPLAY = {
  papers: { name: '学术论文', type: 'PAPER' as ResourceType },
  blogs: { name: '研究博客', type: 'BLOG' as ResourceType },
  reports: { name: '行业报告', type: 'REPORT' as ResourceType },
  youtube: { name: 'YouTube视频', type: 'YOUTUBE_VIDEO' as ResourceType },
  news: { name: '科技新闻', type: 'NEWS' as ResourceType },
};

export function ImportUrlDialog({
  isOpen,
  onClose,
  activeTab,
  onImportSuccess,
  apiBaseUrl,
}: ImportUrlDialogProps) {
  const [step, setStep] = useState<DialogStep>('input-url');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<ParsedMetadata | null>(null);
  const [editedTitle, setEditedTitle] = useState('');

  if (!isOpen) return null;

  const resourceTypeInfo = RESOURCE_TYPE_DISPLAY[
    activeTab as keyof typeof RESOURCE_TYPE_DISPLAY
  ] || {
    name: '资源',
    type: 'PAPER' as ResourceType,
  };

  const handleClose = () => {
    setStep('input-url');
    setUrl('');
    setError('');
    setMetadata(null);
    setEditedTitle('');
    onClose();
  };

  const handleValidateUrl = async () => {
    if (!url.trim()) {
      setError('请输入URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/data-management/parse-url-full`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            resourceType: resourceTypeInfo.type,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '无法解析URL');
      }

      if (!data.data || !data.data.metadata) {
        throw new Error('返回的数据格式错误');
      }

      setMetadata(data.data.metadata);
      setEditedTitle(data.data.metadata.title);
      setStep('preview');
    } catch (err) {
      const message = err instanceof Error ? err.message : '验证失败';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!metadata) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/v1/data-management/import-with-metadata`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            resourceType: resourceTypeInfo.type,
            metadata: {
              ...metadata,
              title: editedTitle || metadata.title,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '导入失败');
      }

      alert('导入成功！');
      handleClose();
      onImportSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : '导入失败';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            导入{resourceTypeInfo.name}
            {step === 'input-url' && ' - 输入URL'}
            {step === 'preview' && ' - 预览信息'}
            {step === 'confirm' && ' - 确认导入'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Step indicator */}
          <div className="mb-4 flex gap-2">
            <div
              className={`h-1 flex-1 rounded ${step === 'input-url' ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
            <div
              className={`h-1 flex-1 rounded ${step === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
            <div
              className={`h-1 flex-1 rounded ${step === 'confirm' ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
          </div>

          {/* Step 1: Input URL */}
          {step === 'input-url' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">
                  📋 输入说明
                </h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✓ 输入{resourceTypeInfo.name}的完整URL</li>
                  <li>✓ 系统会自动提取标题、描述等信息</li>
                  <li>✓ 你可以在下一步编辑这些信息</li>
                  <li>✓ 支持来自已列入白名单的网站</li>
                </ul>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  资源URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="例如：https://arxiv.org/abs/2024.xxxxx"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleValidateUrl()}
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500">
                  输入完整的URL链接，按Enter键或点击下方按钮验证
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-medium text-gray-700">
                  💡 URL示例：
                </p>
                <div className="space-y-2 text-xs text-gray-600">
                  {resourceTypeInfo.type === 'PAPER' && (
                    <>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://arxiv.org/abs/2024.xxxxx
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://openreview.net/forum?id=xxx
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://ieeexplore.ieee.org/document/xxx
                      </div>
                    </>
                  )}
                  {resourceTypeInfo.type === 'BLOG' && (
                    <>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://medium.com/@username/title-xxx
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://dev.to/username/article-title-xxx
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://hashnode.com/post/article-xxx
                      </div>
                    </>
                  )}
                  {resourceTypeInfo.type === 'NEWS' && (
                    <>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://techcrunch.com/xxx/article-title/
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://arstechnica.com/xxx/article-title/
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://theverge.com/xxx/article
                      </div>
                    </>
                  )}
                  {resourceTypeInfo.type === 'YOUTUBE_VIDEO' && (
                    <>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://youtube.com/watch?v=xxxxx
                      </div>
                      <div className="rounded border border-gray-300 bg-white p-2 font-mono text-xs">
                        https://youtu.be/xxxxx
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">验证失败</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && metadata && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                  <CheckCircle2 size={18} className="text-green-600" />
                  信息预览
                </h4>
                {metadata.imageUrl && (
                  <img
                    src={metadata.imageUrl}
                    alt={metadata.title}
                    className="mb-3 h-32 w-full rounded object-cover"
                  />
                )}
                <p className="mb-2 font-medium">{metadata.title}</p>
                {metadata.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-gray-600">
                    {metadata.description}
                  </p>
                )}
                {metadata.publishedDate && (
                  <p className="text-xs text-gray-500">
                    发布日期：{metadata.publishedDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium">
                  编辑标题（可选）
                </label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
                />
              </div>

              {error && (
                <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-red-700">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && metadata && (
            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <h4 className="font-semibold">导入信息摘要</h4>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-gray-500">资源类型</dt>
                  <dd className="font-medium">{resourceTypeInfo.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">域名</dt>
                  <dd className="font-medium">{metadata.domain}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">标题</dt>
                  <dd className="font-medium">
                    {editedTitle || metadata.title}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t px-6 py-4">
          {step !== 'input-url' && (
            <button
              onClick={() => {
                if (step === 'preview') setStep('input-url');
                else if (step === 'confirm') setStep('preview');
              }}
              disabled={isLoading}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              上一步
            </button>
          )}

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>

          {step === 'input-url' && (
            <button
              onClick={handleValidateUrl}
              disabled={!url || isLoading}
              className="ml-auto flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              验证 & 下一步
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={() => setStep('confirm')}
              disabled={!editedTitle}
              className="ml-auto rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              确认信息
            </button>
          )}

          {step === 'confirm' && (
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="ml-auto flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              确认导入
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
