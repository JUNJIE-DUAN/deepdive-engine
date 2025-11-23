'use client';

/**
 * 文档版本历史组件
 * 提供版本查看、对比、回退功能
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { DocumentVersion } from '@/types/ai-office';
import { useDocumentStore } from '@/stores/aiOfficeStore';
import VersionDiffViewer from './VersionDiffViewer';

interface VersionHistoryProps {
  documentId: string;
  onClose: () => void;
}

export default function VersionHistory({
  documentId,
  onClose,
}: VersionHistoryProps) {
  const { restoreVersion, deleteVersion } = useDocumentStore();
  // 直接从store中读取document和versions，确保响应式更新
  const currentDocument = useDocumentStore((state: any) =>
    state.documents.find((d: any) => d._id === documentId)
  );
  const versions = currentDocument?.versions || [];

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    currentDocument?.currentVersionId || null
  );
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );

  const handleRestore = (versionId: string) => {
    if (confirm('确定要恢复到此版本吗？当前内容将被覆盖。')) {
      restoreVersion(documentId, versionId);
      setSelectedVersionId(versionId);
    }
  };

  const handleDelete = (versionId: string) => {
    deleteVersion(documentId, versionId);
    setShowConfirmDelete(null);
    if (selectedVersionId === versionId) {
      setSelectedVersionId(null);
    }
  };

  const getVersionIcon = (trigger: DocumentVersion['trigger']) => {
    switch (trigger) {
      case 'ai_generation':
        return '🤖';
      case 'user_edit':
        return '✏️';
      case 'manual_save':
        return '💾';
      default:
        return '📄';
    }
  };

  const getVersionLabel = (trigger: DocumentVersion['trigger']) => {
    switch (trigger) {
      case 'ai_generation':
        return 'AI生成';
      case 'user_edit':
        return '用户编辑';
      case 'manual_save':
        return '手动保存';
      default:
        return '未知';
    }
  };

  // 按时间倒序排列
  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex h-[80vh] w-[90%] max-w-5xl flex-col rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">版本历史</h2>
            <p className="mt-1 text-sm text-gray-500">
              共 {versions.length} 个版本
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
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

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline Sidebar */}
          <div className="w-80 overflow-y-auto border-r border-gray-200">
            <div className="space-y-2 p-4">
              {sortedVersions.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 text-gray-300"
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
                  <p className="text-sm">暂无版本历史</p>
                </div>
              ) : (
                sortedVersions.map((version, index) => {
                  const isSelected = selectedVersionId === version.id;
                  const isCurrent =
                    currentDocument?.currentVersionId === version.id;
                  const isComparing = compareVersionId === version.id;

                  return (
                    <div
                      key={version.id}
                      className={`
                        relative cursor-pointer rounded-lg p-3 transition-all
                        ${
                          isSelected
                            ? 'border-2 border-blue-500 bg-blue-50'
                            : 'border-2 border-transparent bg-gray-50 hover:border-gray-300'
                        }
                        ${isComparing ? 'ring-2 ring-purple-500' : ''}
                      `}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      {/* Current badge */}
                      {isCurrent && (
                        <div className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                          当前
                        </div>
                      )}

                      {/* Version info */}
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getVersionIcon(version.trigger)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">
                              {getVersionLabel(version.trigger)}
                            </span>
                            {version.type === 'manual' && (
                              <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">
                                手动
                              </span>
                            )}
                          </div>
                          <p className="mt-1 truncate text-sm font-medium text-gray-900">
                            {version.metadata.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {format(
                              new Date(version.timestamp),
                              'yyyy-MM-dd HH:mm:ss',
                              { locale: zhCN }
                            )}
                          </p>
                          {version.metadata.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                              {version.metadata.description}
                            </p>
                          )}
                          {version.metadata.slideCount && (
                            <p className="mt-1 text-xs text-gray-500">
                              {version.metadata.slideCount} 页幻灯片
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {isSelected && (
                        <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3">
                          {!isCurrent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(version.id);
                              }}
                              className="flex-1 rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
                            >
                              恢复此版本
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompareVersionId(
                                isComparing ? null : version.id
                              );
                            }}
                            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                              isComparing
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isComparing ? '取消对比' : '对比'}
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowConfirmDelete(version.id);
                              }}
                              className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-200"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {/* 版本对比模式 */}
            {compareVersionId && selectedVersionId ? (
              (() => {
                const oldVersion = versions.find(
                  (v: any) => v.id === compareVersionId
                );
                const newVersion = versions.find(
                  (v: any) => v.id === selectedVersionId
                );

                if (!oldVersion || !newVersion) {
                  return (
                    <div className="rounded-lg bg-white p-6 shadow-sm">
                      <p className="text-gray-500">无法加载版本对比数据</p>
                    </div>
                  );
                }

                // 确定文档类型
                const documentType =
                  newVersion.metadata.slideCount ||
                  oldVersion.metadata.slideCount
                    ? 'ppt'
                    : 'doc';

                return (
                  <VersionDiffViewer
                    oldVersion={oldVersion}
                    newVersion={newVersion}
                    documentType={documentType as 'ppt' | 'doc'}
                    onClose={() => setCompareVersionId(null)}
                  />
                );
              })()
            ) : selectedVersionId ? (
              /* 单版本预览模式 */
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="prose prose-slate max-w-none">
                  <h3 className="mb-4 text-lg font-bold text-gray-900">
                    版本预览
                  </h3>
                  {(() => {
                    const version = versions.find(
                      (v: any) => v.id === selectedVersionId
                    );
                    if (!version) return <p>版本不存在</p>;

                    // 检查是否是 markdown 内容（PPT 或 Article）
                    if (version.content.markdown) {
                      const markdown = version.content.markdown;

                      // 如果版本元数据中有 slideCount，说明是 PPT
                      if (version.metadata.slideCount) {
                        // 简单渲染 PPT 预览：按 --- 分割
                        const slides = markdown
                          .split(/^---$/m)
                          .filter((s: string) => s.trim());

                        return (
                          <div className="space-y-6">
                            {slides.map(
                              (slideContent: string, index: number) => {
                                // 提取标题
                                const titleMatch =
                                  slideContent.match(/^#{2,4}\s*(.+)$/m);
                                const title = titleMatch
                                  ? titleMatch[1]
                                  : `幻灯片 ${index + 1}`;

                                return (
                                  <div
                                    key={index}
                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                  >
                                    <div className="mb-2 text-sm font-medium text-gray-500">
                                      幻灯片 {index + 1}
                                    </div>
                                    <div className="min-h-[200px] rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                                      <h3 className="mb-3 text-lg font-bold text-gray-900">
                                        {title}
                                      </h3>
                                      <div className="whitespace-pre-wrap text-sm text-gray-700">
                                        {slideContent
                                          .replace(/^#{2,4}\s*.+$/m, '') // 移除标题行
                                          .trim()
                                          .substring(0, 300)}
                                        {slideContent.length > 300 ? '...' : ''}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        );
                      }

                      // 普通文章内容
                      return (
                        <div className="prose prose-slate max-w-none">
                          <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                            {markdown.substring(0, 1000)}
                            {markdown.length > 1000
                              ? '\n\n... (内容已截断)'
                              : ''}
                          </pre>
                        </div>
                      );
                    }

                    // 旧格式兼容：渲染PPT slides格式
                    if (version.content.slides) {
                      return (
                        <div className="space-y-6">
                          {version.content.slides.map(
                            (slide: any, index: number) => (
                              <div
                                key={slide.id || index}
                                className="rounded-lg border border-gray-200 p-4"
                              >
                                <div className="mb-2 text-sm font-medium text-gray-500">
                                  幻灯片 {index + 1}
                                </div>
                                <div
                                  className="flex min-h-[200px] flex-col justify-center rounded bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white"
                                  dangerouslySetInnerHTML={{
                                    __html: slide.elements
                                      .map((el: any) => el.content)
                                      .join('<br>'),
                                  }}
                                />
                              </div>
                            )
                          )}
                        </div>
                      );
                    }

                    // 其他未知类型
                    return (
                      <div className="text-gray-600">
                        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm">
                          {JSON.stringify(version.content, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-3 h-16 w-16"
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
                  <p>选择一个版本查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-3 text-lg font-bold text-gray-900">
                确认删除版本
              </h3>
              <p className="mb-6 text-gray-600">
                删除后将无法恢复此版本，确定要继续吗？
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="rounded bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(showConfirmDelete)}
                  className="rounded bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
