'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '@/lib/config';
import { useMultiSelect } from '@/lib/use-multi-select';
import ReportTemplateDialog from '@/components/ReportTemplateDialog';

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
      const response = await fetch(`${config.apiBaseUrl}/api/v1/resources?take=20`);
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
      const response = await fetch(`${config.apiBaseUrl}/api/v1/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceIds: selectedIds,
          template: templateId,
          userId: '557be1bd-62cb-4125-a028-5ba740b66aca', // TODO: 从实际用户获取
        }),
      });

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载资源中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            多素材AI报告生成 - 测试页面
          </h1>
          <p className="text-gray-600">
            选择2-10个资源，然后点击"生成报告"按钮
          </p>
        </div>

        {/* Selection Toolbar */}
        {selectedCount > 0 && (
          <div className="bg-red-600 text-white rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-semibold">
                已选择 {selectedCount} / {maxItems} 项
              </span>
              {!canSelectMore && (
                <span className="text-sm text-red-200">
                  已达到最大选择数量
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm font-medium bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                取消选择
              </button>
              <button
                onClick={() => setShowTemplateDialog(true)}
                disabled={selectedCount < 2}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedCount >= 2
                    ? 'bg-white text-red-600 hover:bg-gray-100'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                生成报告 →
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Generating Overlay */}
        {generating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-8 max-w-md text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI正在生成报告...
              </h3>
              <p className="text-gray-600 text-sm">
                这可能需要30-90秒，请耐心等待
              </p>
            </div>
          </div>
        )}

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => {
            const selected = isSelected(resource.id);

            return (
              <div
                key={resource.id}
                className={`bg-white rounded-lg border-2 transition-all cursor-pointer ${
                  selected
                    ? 'border-red-600 shadow-lg'
                    : 'border-gray-200 hover:border-red-300'
                }`}
                onClick={() => toggleSelect(resource.id)}
              >
                {/* Selection Indicator */}
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selected
                          ? 'bg-red-600 border-red-600'
                          : 'border-gray-300 hover:border-red-400'
                      }`}
                    >
                      {selected && (
                        <svg
                          className="w-4 h-4 text-white"
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
                  <div className="flex-1 min-w-0">
                    {/* Type Badge */}
                    <div className="mb-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded">
                        {resource.type}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {resource.title}
                    </h3>

                    {/* Abstract */}
                    {resource.abstract && (
                      <p className="text-xs text-gray-600 line-clamp-3 mb-3">
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
                      className="w-full h-32 object-cover rounded"
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
