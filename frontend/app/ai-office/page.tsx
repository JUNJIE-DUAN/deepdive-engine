'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import WorkspaceLayout from '@/components/ai-office/layout/WorkspaceLayout';
import QuickGenerateInput from '@/components/ai-office/QuickGenerateInput';
import { ArrowLeft, Sparkles, Settings } from 'lucide-react';

/**
 * AI Office 工作区页面
 * 整合资源管理、AI交互、文档生成的统一工作区
 * 支持生成 Word、Excel、PPT 等多种格式文档
 *
 * 新增: 快速生成模式 - 对标Genspark的自然语言输入体验
 */
export default function AIOfficePage() {
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* 模式切换头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">AI Office</h1>
            <div className="flex items-center space-x-2 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setMode('quick')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'quick'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="mr-2 inline h-4 w-4" />
                Quick Generate
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  mode === 'advanced'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="mr-2 inline h-4 w-4" />
                Advanced Mode
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {mode === 'quick' ? (
              <span>✨ Describe what you want, AI does the rest</span>
            ) : (
              <span>🔧 Select resources and customize generation</span>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {mode === 'quick' ? (
            // 快速生成模式
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-6xl py-8">
                <QuickGenerateInput />

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setMode('advanced')}
                    className="inline-flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Need more control? Try Advanced Mode</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // 高级模式 (原有功能)
            <WorkspaceLayout />
          )}
        </div>
      </div>
    </div>
  );
}
