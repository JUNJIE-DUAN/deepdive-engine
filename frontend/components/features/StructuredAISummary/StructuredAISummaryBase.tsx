'use client';

import React from 'react';
import type { StructuredAISummary } from '@/types/ai-office';

/**
 * 结构化AI摘要基础组件
 * 所有资源类型的结构化摘要都继承自此组件
 */
interface StructuredAISummaryBaseProps {
  summary: StructuredAISummary;
  compact?: boolean; // 紧凑模式（用于卡片）
  expandable?: boolean; // 可展开模式
}

export const StructuredAISummaryBase: React.FC<StructuredAISummaryBaseProps> = ({
  summary,
  compact = false,
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!compact);

  const difficultyColors = {
    beginner: 'bg-green-50 text-green-700 border-green-200',
    intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
    advanced: 'bg-orange-50 text-orange-700 border-orange-200',
    expert: 'bg-red-50 text-red-700 border-red-200',
  };

  const difficultyEmoji = {
    beginner: '🌱',
    intermediate: '📚',
    advanced: '🚀',
    expert: '⚡',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100">
        {/* 分类和难度 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              {summary.category}
            </span>
            {summary.subcategories.length > 0 && (
              <span className="text-xs text-gray-500">
                {summary.subcategories.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${
              difficultyColors[summary.difficulty]
            }`}
          >
            <span>{difficultyEmoji[summary.difficulty]}</span>
            <span>{summary.difficulty}</span>
          </div>
        </div>

        {/* 核心概览 */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {compact && !isExpanded ? (
            <>{summary.overview.substring(0, 150)}...</>
          ) : (
            summary.overview
          )}
        </p>

        {/* 阅读时间 */}
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>⏱️ {summary.readingTime} min read</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">⭐</span>
            <span>{(summary.confidence * 100).toFixed(0)}% confidence</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 关键要点 */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📌 Key Points
              </h4>
              <ul className="space-y-1.5">
                {summary.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2 text-sm text-gray-700"
                  >
                    <span className="flex-shrink-0 text-blue-500">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 关键词 */}
          {summary.keywords.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                🏷️ Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 可视化建议 */}
          {summary.visualizations && summary.visualizations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📊 Visualizations
              </h4>
              <div className="space-y-2">
                {summary.visualizations.map((viz, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded bg-purple-50 border border-purple-200"
                  >
                    <span className="text-purple-600">▪</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-purple-900">
                        {viz.type}
                      </p>
                      <p className="text-xs text-purple-700">{viz.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 元信息 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Generated on {summary.generatedAt.toLocaleDateString()} using {summary.model}
            </p>
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      {expandable && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 py-1"
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand'}
          </button>
        </div>
      )}
    </div>
  );
};
