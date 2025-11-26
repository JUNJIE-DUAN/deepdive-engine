'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

export interface AIModel {
  id: string; // 模型名称（如 grok, claude, gemini）
  dbId: string; // 数据库 ID
  name: string; // 显示名称
  provider: string; // 提供商
  modelId: string; // 实际模型 ID
  icon: string; // emoji 或图标路径
  iconUrl: string; // 图标 URL
  color: string; // Tailwind 颜色类
  description: string; // 描述
  isDefault: boolean; // 是否默认
}

// 缓存模型列表（避免重复请求）
let cachedModels: AIModel[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取已启用的 AI 模型列表 Hook
 */
export function useAIModels() {
  const [models, setModels] = useState<AIModel[]>(cachedModels || []);
  const [loading, setLoading] = useState(!cachedModels);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      // 检查缓存是否有效
      const now = Date.now();
      if (cachedModels && now - cacheTimestamp < CACHE_DURATION) {
        setModels(cachedModels);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${config.apiUrl}/ai/models`);
        if (response.ok) {
          const data = await response.json();
          cachedModels = data;
          cacheTimestamp = now;
          setModels(data);
          setError(null);
        } else {
          throw new Error('Failed to fetch AI models');
        }
      } catch (err) {
        console.error('Failed to fetch AI models:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // 如果获取失败，使用默认的硬编码列表作为后备
        setModels(getDefaultModels());
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { models, loading, error };
}

/**
 * 清除模型缓存（当管理员修改模型配置后调用）
 */
export function clearAIModelsCache() {
  cachedModels = null;
  cacheTimestamp = 0;
}

/**
 * 默认模型列表（后备方案）
 */
function getDefaultModels(): AIModel[] {
  return [
    {
      id: 'grok',
      dbId: '',
      name: 'Grok (xAI)',
      provider: 'xAI',
      modelId: 'grok-3-latest',
      icon: '🤖',
      iconUrl: '/icons/ai/grok.svg',
      color: 'from-blue-500 to-blue-600',
      description: 'xAI Grok - 快速智能',
      isDefault: true,
    },
    {
      id: 'gpt-4',
      dbId: '',
      name: 'ChatGPT (OpenAI)',
      provider: 'OpenAI',
      modelId: 'gpt-4-turbo',
      icon: '🧠',
      iconUrl: '/icons/ai/openai.svg',
      color: 'from-green-500 to-green-600',
      description: 'OpenAI ChatGPT - 深度思考',
      isDefault: false,
    },
    {
      id: 'claude',
      dbId: '',
      name: 'Claude (Anthropic)',
      provider: 'Anthropic',
      modelId: 'claude-sonnet-4-20250514',
      icon: '🎭',
      iconUrl: '/icons/ai/claude.svg',
      color: 'from-orange-500 to-orange-600',
      description: 'Anthropic Claude - 对话专家',
      isDefault: false,
    },
    {
      id: 'gemini',
      dbId: '',
      name: 'Gemini (Google)',
      provider: 'Google',
      modelId: 'gemini-2.0-flash',
      icon: '💎',
      iconUrl: '/icons/ai/gemini.svg',
      color: 'from-purple-500 to-purple-600',
      description: 'Google Gemini - 多模态',
      isDefault: false,
    },
  ];
}
