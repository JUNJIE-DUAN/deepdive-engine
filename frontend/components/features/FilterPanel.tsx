'use client';

import { useState } from 'react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'papers' | 'blogs' | 'reports' | 'youtube' | 'news';
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  dateRange: 'all' | '24h' | '7d' | '30d' | '90d';
  setDateRange: (range: 'all' | '24h' | '7d' | '30d' | '90d') => void;
  minQualityScore: number;
  setMinQualityScore: (score: number) => void;
  onApply: () => void;
  onReset: () => void;
}

// 每个Tab的筛选配置
const FILTER_CONFIGS: Record<
  'papers' | 'blogs' | 'reports' | 'youtube' | 'news',
  { categories: string[] }
> = {
  papers: {
    categories: [
      'AI',
      'Machine Learning',
      'Computer Vision',
      'NLP',
      'Robotics',
      'Theory',
    ],
  },
  blogs: {
    categories: [
      'AI Research',
      'Machine Learning',
      'Engineering',
      'Best Practices',
      'Case Study',
      'Tutorial',
    ],
  },
  news: {
    categories: [
      'Tech News',
      'AI',
      'Startups',
      'Security',
      'Open Source',
      'Research',
    ],
  },
  youtube: {
    categories: [
      'Tutorial',
      'Conference',
      'Interview',
      'Demo',
      'Review',
      'Lecture',
    ],
  },
  reports: {
    categories: [
      'AI',
      'Security',
      'Semiconductors',
      'Cloud',
      'Software',
      'Enterprise',
    ],
  },
};

export default function FilterPanel({
  isOpen,
  onClose,
  activeTab,
  selectedCategories,
  setSelectedCategories,
  dateRange,
  setDateRange,
  minQualityScore,
  setMinQualityScore,
  onApply,
  onReset,
}: FilterPanelProps) {
  if (!isOpen) return null;

  const config = FILTER_CONFIGS[activeTab];

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setDateRange('all');
    setMinQualityScore(0);
    onReset();
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-96 overflow-y-auto bg-white shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">筛选条件</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg
                className="h-5 w-5"
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

          {/* Categories */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">分类</h3>
            <div className="flex flex-wrap gap-2">
              {config.categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">时间范围</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: '全部时间' },
                { value: '24h', label: '过去24小时' },
                { value: '7d', label: '过去7天' },
                { value: '30d', label: '过去30天' },
                { value: '90d', label: '过去90天' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="dateRange"
                    value={option.value}
                    checked={dateRange === option.value}
                    onChange={(e) =>
                      setDateRange(
                        e.target.value as 'all' | '24h' | '7d' | '30d' | '90d'
                      )
                    }
                    className="h-4 w-4 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality Score */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              最低质量分数: {minQualityScore}
            </h3>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={minQualityScore}
              onChange={(e) => setMinQualityScore(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${minQualityScore}%, #e5e7eb ${minQualityScore}%, #e5e7eb 100%)`,
              }}
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              重置
            </button>
            <button
              onClick={handleApply}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              应用筛选
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
