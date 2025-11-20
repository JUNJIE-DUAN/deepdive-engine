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
      <div className="h-full flex-1 overflow-hidden flex flex-col">
        {/* 模式切换头部 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">AI Office</h1>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('quick')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'quick'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Quick Generate
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'advanced'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
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
              <div className="max-w-6xl mx-auto py-8">
                <QuickGenerateInput />

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setMode('advanced')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center space-x-2"
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
