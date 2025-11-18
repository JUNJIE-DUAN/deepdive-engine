'use client';

import React from 'react';
import type { PaperAISummary } from '@/types/ai-office';

/**
 * 学术论文专属结构化摘要组件
 * 针对论文资源优化，展示论文的核心贡献、方法和结果
 */
interface PaperAISummaryProps {
  summary: PaperAISummary;
  compact?: boolean;
  expandable?: boolean;
}

const DifficultyBadge: React.FC<{ difficulty: string }> = ({ difficulty }) => {
  const colors = {
    beginner: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', emoji: '🌱' },
    intermediate: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', emoji: '📚' },
    advanced: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', emoji: '🚀' },
    expert: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', emoji: '⚡' },
  };

  const style = colors[difficulty as keyof typeof colors] || colors.intermediate;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span>{style.emoji}</span>
      {difficulty}
    </span>
  );
};

export const PaperAISummaryComponent: React.FC<PaperAISummaryProps> = ({
  summary,
  compact = false,
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!compact);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* 分类和难度 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white text-blue-700 text-xs font-medium border border-blue-200">
              {summary.field}
            </span>
            {summary.subfield && (
              <span className="text-xs text-gray-600">{summary.subfield}</span>
            )}
          </div>
          <DifficultyBadge difficulty={summary.difficulty} />
        </div>

        {/* 核心概览 */}
        <p className="text-sm text-gray-700 leading-relaxed font-medium">
          {compact && !isExpanded ? (
            <>{summary.overview.substring(0, 150)}...</>
          ) : (
            summary.overview
          )}
        </p>

        {/* 论文指标 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span>📖 {summary.readingTime} min read</span>
          {summary.citationContext && (
            <>
              <span>📊 {summary.citationContext.citationCount} citations</span>
              {summary.citationContext.impactFactor && (
                <span>💫 IF: {summary.citationContext.impactFactor}</span>
              )}
            </>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-yellow-500">⭐</span>
            <span>{(summary.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 主要贡献 */}
          {summary.contributions.length > 0 && (
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                💡 Main Contributions
              </h4>
              <ul className="space-y-1.5">
                {summary.contributions.map((contrib, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 text-blue-500">✓</span>
                    <span>{contrib}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 研究方法 */}
          {summary.methodology && (
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                🔬 Methodology
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.methodology}
              </p>
            </div>
          )}

          {/* 主要结果 */}
          {summary.results && (
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📈 Results
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.results}
              </p>
            </div>
          )}

          {/* 关键要点 */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📌 Key Takeaways
              </h4>
              <ul className="space-y-1.5">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 text-green-500">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 局限性 */}
          {summary.limitations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                ⚠️ Limitations
              </h4>
              <ul className="space-y-1">
                {summary.limitations.map((limit, idx) => (
                  <li key={idx} className="text-sm text-yellow-800">
                    • {limit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 后续工作 */}
          {summary.futureWork.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                🚀 Future Work
              </h4>
              <ul className="space-y-1">
                {summary.futureWork.map((work, idx) => (
                  <li key={idx} className="text-sm text-blue-800">
                    • {work}
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

          {/* 相关主题 */}
          {summary.relatedTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                🔗 Related Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.relatedTopics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 可视化建议 */}
          {summary.visualizations && summary.visualizations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📊 Visualization Ideas
              </h4>
              <div className="space-y-2">
                {summary.visualizations.map((viz, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded bg-purple-50 border border-purple-200"
                  >
                    <span className="text-purple-600 font-bold">▪</span>
                    <div>
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
              AI-generated on {summary.generatedAt.toLocaleDateString()} using {summary.model}
            </p>
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      {expandable && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 py-1 transition-colors"
          >
            {isExpanded ? '▼ Collapse' : '▶ Expand Full Analysis'}
          </button>
        </div>
      )}
    </div>
  );
};
