'use client';

import Sidebar from '@/components/layout/Sidebar';
import WorkspaceLayout from '@/components/ai-office/layout/WorkspaceLayout';

/**
 * AI Office 工作区页面
 * 整合资源管理、AI交互、文档生成的统一工作区
 * 支持生成 Word、Excel、PPT 等多种格式文档
 */
export default function AIOfficePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <h1 className="text-xl font-bold text-gray-900">AI Office</h1>
          <div className="text-sm text-gray-500">
            <span>Select resources and customize generation</span>
          </div>
        </div>

        {/* 内容区域 - 直接显示 WorkspaceLayout */}
        <div className="flex-1 overflow-hidden">
          <WorkspaceLayout />
        </div>
      </div>
    </div>
  );
}
