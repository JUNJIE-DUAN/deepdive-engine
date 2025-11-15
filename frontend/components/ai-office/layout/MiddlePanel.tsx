'use client';

/**
 * 中间栏组件
 * 上半部：资源列表（可折叠）
 * 下半部：AI交互面板（固定）
 */

import React from 'react';
import { useUIStore, useResourceStore } from '@/stores/aiOfficeStore';
import { ChevronUp, ChevronDown } from 'lucide-react';
import ResourceList from '../resources/ResourceList';
import ChatPanel from '../chat/ChatPanel';

export default function MiddlePanel() {
  const { resourceListCollapsed, toggleResourceList } = useUIStore();
  const resources = useResourceStore((state) => state.resources);

  return (
    <div className="flex h-full flex-col">
      {/* 资源列表区域 - 可折叠 */}
      <div
        className={`transition-all duration-300 ${
          resourceListCollapsed ? 'h-12' : 'h-2/5'
        } overflow-hidden border-b border-gray-200`}
      >
        {/* 资源列表标题栏 */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-gray-700">已选资源</h3>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-500">
              {resources.length}
            </span>
          </div>
          <button
            onClick={toggleResourceList}
            className="rounded p-1 transition-colors hover:bg-gray-200"
            title={resourceListCollapsed ? '展开' : '折叠'}
          >
            {resourceListCollapsed ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* 资源列表内容 */}
        {!resourceListCollapsed && (
          <div className="h-full overflow-y-auto">
            <ResourceList />
          </div>
        )}
      </div>

      {/* AI交互面板 - 固定显示 */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
