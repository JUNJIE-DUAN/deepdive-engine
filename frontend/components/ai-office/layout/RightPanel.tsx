'use client';

/**
 * 右侧文档编辑器面板
 */

import React, { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image,
  Link,
  Table,
  Eye,
  Download,
  MoreVertical,
  FileDown,
} from 'lucide-react';
import { useDocumentStore } from '@/stores/aiOfficeStore';
import DocumentEditor from '../document/DocumentEditor';

interface RightPanelProps {
  children?: React.ReactNode;
}

export default function RightPanel({ children }: RightPanelProps) {
  const currentDocumentId = useDocumentStore(
    (state) => state.currentDocumentId
  );
  const documents = useDocumentStore((state) => state.documents);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  const currentDocument = documents.find((d) => d._id === currentDocumentId);

  const [documentTitle, setDocumentTitle] = useState('新建文档');

  // 同步文档标题
  useEffect(() => {
    if (currentDocument) {
      setDocumentTitle(currentDocument.title);
    }
  }, [currentDocument]);

  // 更新文档标题
  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    if (currentDocumentId) {
      updateDocument(currentDocumentId, { title: newTitle });
    }
  };

  // 导出文档为Markdown
  const handleExportMarkdown = () => {
    if (!currentDocument || currentDocument.type !== 'article') return;

    const markdown = `# ${currentDocument.title}\n\n${currentDocument.content.markdown}`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.title}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* 顶部标题栏 - 固定 */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-3">
        <div className="flex flex-1 items-center space-x-4">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="border-none bg-transparent px-0 text-lg font-semibold text-gray-800 focus:outline-none focus:ring-0"
            placeholder="文档标题"
            disabled={!currentDocument}
          />
          {currentDocument && (
            <span className="flex items-center space-x-1 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>已保存</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportMarkdown}
            disabled={!currentDocument}
            className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <FileDown className="h-4 w-4" />
            <span>导出Markdown</span>
          </button>
          <button className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 工具栏 - 固定 */}
      <div className="flex flex-shrink-0 items-center overflow-x-auto border-b border-gray-200 bg-gray-50 px-6 py-2">
        <div className="flex items-center space-x-1">
          {/* 标题 */}
          <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>正文</option>
            <option>标题 1</option>
            <option>标题 2</option>
            <option>标题 3</option>
          </select>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          {/* 字体大小 */}
          <select className="rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>14</option>
            <option>16</option>
            <option>18</option>
            <option>24</option>
            <option>28</option>
            <option>32</option>
          </select>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          {/* 文本格式 */}
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="粗体"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="斜体"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="下划线"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="删除线"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          {/* 对齐方式 */}
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="左对齐"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="居中"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="右对齐"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="两端对齐"
          >
            <AlignJustify className="h-4 w-4" />
          </button>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          {/* 列表 */}
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="无序列表"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="有序列表"
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <div className="mx-2 h-6 w-px bg-gray-300" />

          {/* 插入 */}
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="引用"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="分隔线"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="插入图片"
          >
            <Image className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="插入链接"
          >
            <Link className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 transition-colors hover:bg-gray-200"
            title="插入表格"
          >
            <Table className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 文档编辑区域 */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div className="mx-auto min-h-[calc(100vh-250px)] max-w-4xl rounded-lg bg-white p-12 shadow-lg">
          <DocumentEditor />
        </div>
      </div>
    </div>
  );
}
