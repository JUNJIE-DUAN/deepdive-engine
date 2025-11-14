'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';
import { useMultiSelect } from '@/lib/use-multi-select';
import ReportTemplateDialog from '@/components/features/ReportTemplateDialog';

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  authors?: any;
  tags?: any;
}

export default function ReportsTestPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    selectedIds,
    selectedCount,
    toggleSelect,
    clearAll,
    isSelected,
    canSelectMore,
    maxItems,
  } = useMultiSelect(10);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/resources?take=20`
      );
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
      setError('加载资源失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      setGenerating(true);
      setError(null);
      setShowTemplateDialog(false);

      // 调用后端生成报告
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/reports/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resourceIds: selectedIds,
            template: templateId,
            userId: '557be1bd-62cb-4125-a028-5ba740b66aca', // TODO: 从实际用户获取
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '生成报告失败');
      }

      const report = await response.json();

      // 跳转到报告页面
      router.push(`/report/${report.id}`);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err instanceof Error ? err.message : '生成报告失败');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-600">加载资源中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            多素材AI报告生成 - 测试页面
          </h1>
          <p className="text-gray-600">
            选择2-10个资源，然后点击"生成报告"按钮
          </p>
        </div>

        {/* Selection Toolbar */}
        {selectedCount > 0 && (
          <div className="mb-6 flex items-center justify-between rounded-lg bg-red-600 p-4 text-white">
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                已选择 {selectedCount} / {maxItems} 项
              </span>
              {!canSelectMore && (
                <span className="text-sm text-red-200">已达到最大选择数量</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="rounded-lg bg-white bg-opacity-20 px-4 py-2 text-sm font-medium transition-colors hover:bg-opacity-30"
              >
                取消选择
              </button>
              <button
                onClick={() => setShowTemplateDialog(true)}
                disabled={selectedCount < 2}
                className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                  selectedCount >= 2
                    ? 'bg-white text-red-600 hover:bg-gray-100'
                    : 'cursor-not-allowed bg-gray-400 text-gray-200'
                }`}
              >
                生成报告 →
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Generating Overlay */}
        {generating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-w-md rounded-lg bg-white p-8 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-4 border-red-600"></div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                AI正在生成报告...
              </h3>
              <p className="text-sm text-gray-600">
                这可能需要30-90秒，请耐心等待
              </p>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const selected = isSelected(resource.id);

            return (
              <div
                key={resource.id}
                className={`cursor-pointer rounded-lg border-2 bg-white transition-all ${
                  selected
                    ? 'border-red-600 shadow-lg'
                    : 'border-gray-200 hover:border-red-300'
                }`}
                onClick={() => toggleSelect(resource.id)}
              >
                {/* Selection Indicator */}
                <div className="flex items-start gap-3 p-4">
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                        selected
                          ? 'border-red-600 bg-red-600'
                          : 'border-gray-300 hover:border-red-400'
                      }`}
                    >
                      {selected && (
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Type Badge */}
                    <div className="mb-2">
                      <span className="inline-block rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        {resource.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900">
                      {resource.title}
                    </h3>

                    {/* Abstract */}
                    {resource.abstract && (
                      <p className="mb-3 line-clamp-3 text-xs text-gray-600">
                        {resource.abstract}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {resource.publishedAt && (
                        <span>
                          {new Date(resource.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Thumbnail */}
                {resource.thumbnailUrl && (
                  <div className="px-4 pb-4">
                    <img
                      src={`${config.apiBaseUrl}${resource.thumbnailUrl}`}
                      alt=""
                      className="h-32 w-full rounded object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Template Dialog */}
        <ReportTemplateDialog
          isOpen={showTemplateDialog}
          onClose={() => setShowTemplateDialog(false)}
          onGenerate={handleGenerateReport}
          selectedCount={selectedCount}
        />
      </div>
    </div>
  );
}
