'use client';

/**
 * AI Office 工作区布局组件
 * 中栏：资源+AI交互 (350-450px可调节)
 * 右栏：文档编辑器 (自适应)
 * 注意：左侧菜单使用系统全局Sidebar
 */

import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/aiOfficeStore';
import MiddlePanel from './MiddlePanel';
import RightPanel from './RightPanel';

interface WorkspaceLayoutProps {
  children?: React.ReactNode;
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { middlePanelWidth, setMiddlePanelWidth } = useUIStore();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理拖拽调整中间栏宽度
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // 限制最小和最大宽度
      const constrainedWidth = Math.max(400, Math.min(700, newWidth));
      setMiddlePanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setMiddlePanelWidth]);

  return (
    <div ref={containerRef} className="flex h-full overflow-hidden bg-gray-50">
      {/* 中间栏 (资源 + AI交互) */}
      <div
        className="relative flex-shrink-0 border-r border-gray-200 bg-white"
        style={{ width: `${middlePanelWidth}px` }}
      >
        <MiddlePanel />

        {/* 拖拽调节手柄 */}
        <div
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-blue-500 ${
            isDragging ? 'bg-blue-500' : ''
          }`}
          onMouseDown={handleMouseDown}
          title="拖拽调节宽度"
        />
      </div>

      {/* 右侧文档编辑器 */}
      <div className="min-w-0 flex-1 overflow-hidden bg-white">
        <RightPanel>{children}</RightPanel>
      </div>
    </div>
  );
}
