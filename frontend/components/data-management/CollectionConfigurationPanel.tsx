'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, X, Save, Edit2 } from 'lucide-react';

type ResourceType = 'PAPER' | 'BLOG' | 'REPORT' | 'YOUTUBE_VIDEO' | 'NEWS';

interface CollectionConfig {
  id?: string;
  resourceType: ResourceType;
  name: string;
  keywords: string[];
  excludeKeywords: string[];
  urlPatterns: string[];
  cronExpression: string;
  maxConcurrent: number;
  timeout: number;
  isActive: boolean;
  description?: string;
}

const RESOURCE_TYPES: Record<ResourceType, { name: string; icon: string }> = {
  PAPER: { name: '学术论文', icon: '📄' },
  BLOG: { name: '研究博客', icon: '📝' },
  REPORT: { name: '商业报告', icon: '📊' },
  YOUTUBE_VIDEO: { name: 'YouTube视频', icon: '🎬' },
  NEWS: { name: '科技新闻', icon: '📰' },
};

interface CollectionConfigurationPanelProps {
  resourceType: ResourceType;
}

export function CollectionConfigurationPanel({
  resourceType,
}: CollectionConfigurationPanelProps) {
  const [configs, setConfigs] = useState<CollectionConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<CollectionConfig | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CollectionConfig>({
    resourceType,
    name: '',
    keywords: [],
    excludeKeywords: [],
    urlPatterns: [],
    cronExpression: '0 */6 * * *',
    maxConcurrent: 3,
    timeout: 300,
    isActive: true,
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [excludeKeywordInput, setExcludeKeywordInput] = useState('');
  const [urlPatternInput, setUrlPatternInput] = useState('');

  useEffect(() => {
    loadConfigs();
  }, [resourceType]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      // const response = await fetch(
      //   `/api/v1/collection-configs?resourceType=${resourceType}`
      // );
      // const data = await response.json();
      // setConfigs(data);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput('');
    }
  };

  const handleAddExcludeKeyword = () => {
    if (excludeKeywordInput.trim()) {
      setFormData({
        ...formData,
        excludeKeywords: [
          ...formData.excludeKeywords,
          excludeKeywordInput.trim(),
        ],
      });
      setExcludeKeywordInput('');
    }
  };

  const handleAddUrlPattern = () => {
    if (urlPatternInput.trim()) {
      setFormData({
        ...formData,
        urlPatterns: [...formData.urlPatterns, urlPatternInput.trim()],
      });
      setUrlPatternInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index),
    });
  };

  const handleRemoveExcludeKeyword = (index: number) => {
    setFormData({
      ...formData,
      excludeKeywords: formData.excludeKeywords.filter((_, i) => i !== index),
    });
  };

  const handleRemoveUrlPattern = (index: number) => {
    setFormData({
      ...formData,
      urlPatterns: formData.urlPatterns.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: 实现API调用
      // if (isEditing) {
      //   await fetch(`/api/v1/collection-configs/${formData.id}`, {
      //     method: 'PUT',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // } else {
      //   await fetch('/api/v1/collection-configs', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // }
      setIsEditing(false);
      setIsCreating(false);
      loadConfigs();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: CollectionConfig) => {
    setFormData(config);
    setSelectedConfig(config);
    setIsEditing(true);
  };

  const handleNew = () => {
    setFormData({
      resourceType,
      name: '',
      keywords: [],
      excludeKeywords: [],
      urlPatterns: [],
      cronExpression: '0 */6 * * *',
      maxConcurrent: 3,
      timeout: 300,
      isActive: true,
    });
    setSelectedConfig(null);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* Configuration List or Form */}
      {!isEditing && !isCreating ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {RESOURCE_TYPES[resourceType].name} 采集配置
            </h3>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              新增配置
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
          ) : configs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
              <p className="text-gray-500">暂无采集配置</p>
            </div>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{config.name}</h4>
                    <p className="text-sm text-gray-600">
                      关键词: {config.keywords.join(', ')} | URL模式:{' '}
                      {config.urlPatterns.length}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(config)}
                    className="rounded p-2 hover:bg-gray-100"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Configuration Form
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isEditing ? '编辑' : '新增'}采集配置
            </h3>
            <button
              onClick={handleCancel}
              className="rounded p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 rounded-lg border border-gray-200 p-4">
            {/* Configuration Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                配置名称 <span className="text-xs text-gray-500">*必填</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                给此采集配置起个有意义的名字
              </p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="例如: AI技术论文采集"
              />
            </div>

            {/* Keywords Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                包含关键词 <span className="text-xs text-gray-500">(可选)</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                只采集包含这些关键词的内容
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="输入关键词后按Enter (如: 人工智能)"
                />
                <button
                  onClick={handleAddKeyword}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(idx)}
                      className="ml-1 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Exclude Keywords Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                排除关键词 <span className="text-xs text-gray-500">(可选)</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                排除包含这些关键词的内容，提高结果质量
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={excludeKeywordInput}
                  onChange={(e) => setExcludeKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddExcludeKeyword();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="输入排除关键词后按Enter (如: 广告)"
                />
                <button
                  onClick={handleAddExcludeKeyword}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.excludeKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveExcludeKeyword(idx)}
                      className="ml-1 hover:text-red-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* URL Patterns Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                数据源URL <span className="text-xs text-gray-500">(可选)</span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                只采集来自指定URL的内容，支持*通配符 (如: *.arxiv.org/*)
              </p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={urlPatternInput}
                  onChange={(e) => setUrlPatternInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUrlPattern();
                    }
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="输入URL模式后按Enter (如: *.arxiv.org/abs/*)"
                />
                <button
                  onClick={handleAddUrlPattern}
                  className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                >
                  添加
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {formData.urlPatterns.map((pattern, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <code className="text-gray-700">{pattern}</code>
                    <button
                      onClick={() => handleRemoveUrlPattern(idx)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cron表达式
                </label>
                <input
                  type="text"
                  value={formData.cronExpression}
                  onChange={(e) =>
                    setFormData({ ...formData, cronExpression: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="0 */6 * * *"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  最大并发数
                </label>
                <input
                  type="number"
                  value={formData.maxConcurrent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxConcurrent: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  min="1"
                />
              </div>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                超时时间 (秒)
              </label>
              <input
                type="number"
                value={formData.timeout}
                onChange={(e) =>
                  setFormData({ ...formData, timeout: parseInt(e.target.value) })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                min="10"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                启用此配置
              </label>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                描述 (可选)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="添加描述以便后续识别"
              />
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              保存配置
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
