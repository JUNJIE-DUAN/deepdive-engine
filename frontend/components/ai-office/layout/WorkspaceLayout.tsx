'use client';

/**
 * AI Office 工作区布局组件
 * 中栏：资源+AI交互 (350-450px可调节)
 * 右栏：文档编辑器 (自适应)
 * 右侧浮动：任务列表 (Genspark风格)
 * 注意：左侧菜单使用系统全局Sidebar
 */

import React, { useState, useRef, useEffect } from 'react';
import { useUIStore, useTaskStore } from '@/stores/aiOfficeStore';
import { ListTodo } from 'lucide-react';
import MiddlePanel from './MiddlePanel';
import RightPanel from './RightPanel';
import TaskList from '../task/TaskList';

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

  const tasks = useTaskStore((state) => state.tasks);
  const isTaskListOpen = useTaskStore((state) => state.isTaskListOpen);
  const toggleTaskList = useTaskStore((state) => state.toggleTaskList);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full overflow-hidden bg-gray-50"
    >
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

      {/* 浮动任务列表按钮 (Genspark风格) */}
      {!isTaskListOpen && (
        <button
          onClick={toggleTaskList}
          className="fixed bottom-6 right-6 z-30 flex items-center space-x-2 rounded-full bg-blue-600 px-5 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-700 hover:shadow-xl active:scale-95"
          title="打开任务列表"
        >
          <ListTodo className="h-5 w-5" />
          <span className="font-medium">任务</span>
          {tasks.length > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
              {tasks.length}
            </span>
          )}
        </button>
      )}

      {/* 任务列表侧边栏 */}
      <TaskList />
    </div>
  );
}
