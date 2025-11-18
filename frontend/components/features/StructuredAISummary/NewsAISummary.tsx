'use client';

import React from 'react';
import type { NewsAISummary } from '@/types/ai-office';

/**
 * 新闻文章专属结构化摘要组件
 * 针对新闻资源优化，突出核心事实、背景和影响
 */
interface NewsAISummaryProps {
  summary: NewsAISummary;
  compact?: boolean;
  expandable?: boolean;
}

const NewsFactorBadge: React.FC<{ newsFactor: string }> = ({ newsFactor }) => {
  const styles = {
    breaking: { bg: 'bg-red-50', text: 'text-red-700', emoji: '🔴', label: 'Breaking' },
    developing: { bg: 'bg-orange-50', text: 'text-orange-700', emoji: '🟠', label: 'Developing' },
    analysis: { bg: 'bg-blue-50', text: 'text-blue-700', emoji: '🔵', label: 'Analysis' },
    feature: { bg: 'bg-purple-50', text: 'text-purple-700', emoji: '🟣', label: 'Feature' },
  };

  const style = styles[newsFactor as keyof typeof styles] || styles.analysis;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      <span>{style.emoji}</span>
      {style.label}
    </span>
  );
};

const SentimentIndicator: React.FC<{ sentiment: string }> = ({ sentiment }) => {
  const sentiments = {
    positive: { emoji: '😊', color: 'text-green-600' },
    neutral: { emoji: '😐', color: 'text-gray-600' },
    negative: { emoji: '😟', color: 'text-red-600' },
  };

  const s = sentiments[sentiment as keyof typeof sentiments] || sentiments.neutral;
  return <span className={`text-lg ${s.color}`}>{s.emoji}</span>;
};

const UrgencyBadge: React.FC<{ urgency: string }> = ({ urgency }) => {
  const urgencies = {
    high: { bg: 'bg-red-100', text: 'text-red-700', icon: '⚡' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⏱️' },
    low: { bg: 'bg-gray-100', text: 'text-gray-700', icon: '📌' },
  };

  const u = urgencies[urgency as keyof typeof urgencies] || urgencies.medium;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${u.bg} ${u.text}`}>
      {u.icon}
      {urgency}
    </span>
  );
};

export const NewsAISummaryComponent: React.FC<NewsAISummaryProps> = ({
  summary,
  compact = false,
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!compact);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-orange-50">
        {/* 新闻类型和状态 */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2">
            <NewsFactorBadge newsFactor={summary.newsFactor} />
            <UrgencyBadge urgency={summary.urgency} />
          </div>
          <SentimentIndicator sentiment={summary.sentiment} />
        </div>

        {/* 标题 */}
        <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug">
          {summary.headline}
        </h3>

        {/* 核心新闻事实 */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {compact && !isExpanded ? (
            <>{summary.coreNews.substring(0, 150)}...</>
          ) : (
            summary.coreNews
          )}
        </p>

        {/* 元信息 */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span>📰 {summary.category}</span>
          <span>⏱️ {summary.readingTime} min read</span>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-yellow-500">⭐</span>
            <span>{(summary.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 背景信息 */}
          {summary.background && (
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📚 Background Context
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.background}
              </p>
            </div>
          )}

          {/* 影响分析 */}
          {summary.impact && (
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                🎯 Impact & Implications
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {summary.impact}
              </p>
            </div>
          )}

          {/* 直引 */}
          {summary.quotes && summary.quotes.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                💬 Key Quotes
              </h4>
              <div className="space-y-2">
                {summary.quotes.map((quote, idx) => (
                  <div key={idx} className="border-l-2 border-blue-400 pl-3">
                    <p className="text-sm text-gray-700 italic">
                      "{quote.text}"
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      — {quote.source}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 关键要点 */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                📌 Key Points
              </h4>
              <ul className="space-y-1.5">
                {summary.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-gray-700">
                    <span className="flex-shrink-0 text-red-500">▸</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 相关实体 */}
          {summary.relatedEntities && summary.relatedEntities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                👥 Related Entities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {summary.relatedEntities.map((entity, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-blue-50 border border-blue-200"
                  >
                    <p className="text-xs font-medium text-blue-900">
                      {entity.name}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {entity.type}
                      {entity.relevance && ` • ${(entity.relevance * 100).toFixed(0)}%`}
                    </p>
                  </div>
                ))}
              </div>
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
                    className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 元信息 */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              AI-analyzed on {summary.generatedAt.toLocaleDateString()} using {summary.model}
            </p>
          </div>
        </div>
      )}

      {/* 展开/收起按钮 */}
      {expandable && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full text-sm font-medium text-red-600 hover:text-red-700 py-1 transition-colors"
          >
            {isExpanded ? '▼ Collapse' : '▶ Read Full Analysis'}
          </button>
        </div>
      )}
    </div>
  );
};
