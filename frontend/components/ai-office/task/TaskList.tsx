'use client';

/**
 * 任务列表组件 - Genspark风格
 * 显示所有AI Office任务，支持点击恢复上下文
 */

import React, { useState } from 'react';
import { useTaskStore, Task } from '@/stores/aiOfficeStore';
import {
  ListTodo,
  FileText,
  Presentation,
  FileSearch,
  BarChart,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  X,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 任务类型图标映射
const TASK_TYPE_ICONS: Record<Task['type'], React.ElementType> = {
  article: FileText,
  ppt: Presentation,
  summary: FileSearch,
  analysis: BarChart,
};

// 任务类型中文名称
const TASK_TYPE_NAMES: Record<Task['type'], string> = {
  article: '文章',
  ppt: '演示文稿',
  summary: '摘要',
  analysis: '分析报告',
};

// 状态颜色
const STATUS_COLORS: Record<Task['status'], string> = {
  in_progress: 'text-blue-600 bg-blue-50',
  completed: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50',
};

// 状态图标
const STATUS_ICONS: Record<Task['status'], React.ElementType> = {
  in_progress: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

// 状态中文名称
const STATUS_NAMES: Record<Task['status'], string> = {
  in_progress: '进行中',
  completed: '已完成',
  failed: '失败',
};

export default function TaskList() {
  const tasks = useTaskStore((state) => state.tasks);
  const currentTaskId = useTaskStore((state) => state.currentTaskId);
  const isTaskListOpen = useTaskStore((state) => state.isTaskListOpen);
  const toggleTaskList = useTaskStore((state) => state.toggleTaskList);
  const restoreTaskContext = useTaskStore((state) => state.restoreTaskContext);
  const deleteTask = useTaskStore((state) => state.deleteTask);

  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  if (!isTaskListOpen) {
    return null;
  }

  const handleTaskClick = (task: Task) => {
    restoreTaskContext(task._id);
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation(); // 阻止触发任务点击
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(taskId);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 z-40 w-96 bg-white border-l border-gray-200 shadow-2xl flex flex-col">
      {/* 头部 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600">
              <ListTodo className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">任务列表</h2>
              <p className="text-xs text-gray-500">共 {tasks.length} 个任务</p>
            </div>
          </div>
          <button
            onClick={toggleTaskList}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ListTodo className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              还没有任务
            </p>
            <p className="text-xs text-gray-500">
              开始创建文档或PPT，任务会自动保存在这里
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {tasks.map((task) => {
              const TypeIcon = TASK_TYPE_ICONS[task.type];
              const StatusIcon = STATUS_ICONS[task.status];
              const isHovered = hoveredTaskId === task._id;
              const isCurrent = currentTaskId === task._id;

              return (
                <div
                  key={task._id}
                  onClick={() => handleTaskClick(task)}
                  onMouseEnter={() => setHoveredTaskId(task._id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className={`
                    group relative rounded-xl p-4 cursor-pointer transition-all duration-200
                    ${
                      isCurrent
                        ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                        : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }
                  `}
                >
                  {/* 左侧装饰条 */}
                  {isCurrent && (
                    <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full" />
                  )}

                  <div className="flex items-start space-x-3">
                    {/* 图标 */}
                    <div
                      className={`
                      flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                      ${isCurrent ? 'bg-blue-600' : 'bg-gray-100 group-hover:bg-blue-100'}
                    `}
                    >
                      <TypeIcon
                        className={`h-5 w-5 ${
                          isCurrent
                            ? 'text-white'
                            : 'text-gray-600 group-hover:text-blue-600'
                        }`}
                      />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3
                        className={`
                        text-sm font-semibold mb-1 truncate
                        ${isCurrent ? 'text-blue-900' : 'text-gray-900'}
                      `}
                      >
                        {task.title}
                      </h3>

                      {/* 类型和状态 */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {TASK_TYPE_NAMES[task.type]}
                        </span>
                        <div
                          className={`
                          flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium
                          ${STATUS_COLORS[task.status]}
                        `}
                        >
                          <StatusIcon
                            className={`h-3 w-3 ${
                              task.status === 'in_progress' ? 'animate-spin' : ''
                            }`}
                          />
                          <span>{STATUS_NAMES[task.status]}</span>
                        </div>
                      </div>

                      {/* 元数据 */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(task.createdAt), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </span>
                        </div>

                        {task.metadata.wordCount && (
                          <span>{task.metadata.wordCount} 字</span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    {isHovered && !isCurrent && (
                      <button
                        onClick={(e) => handleDeleteTask(e, task._id)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}

                    {/* 当前任务指示器 */}
                    {isCurrent && (
                      <div className="flex-shrink-0">
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* 进度条（仅进行中的任务） */}
                  {task.status === 'in_progress' &&
                    task.metadata.progress !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>生成进度</span>
                          <span>{Math.round(task.metadata.progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                            style={{ width: `${task.metadata.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                  {/* 错误信息 */}
                  {task.status === 'failed' && task.metadata.error && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-600 line-clamp-2">
                        {task.metadata.error}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
