'use client';

/**
 * 文档编辑器组件
 * 显示和编辑AI生成的文档
 */

import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '@/stores/aiOfficeStore';

export default function DocumentEditor() {
  const currentDocumentId = useDocumentStore(
    (state) => state.currentDocumentId
  );
  const documents = useDocumentStore((state) => state.documents);
  const updateDocument = useDocumentStore((state) => state.updateDocument);

  const currentDocument = documents.find((d) => d._id === currentDocumentId);
  const [content, setContent] = useState('');

  // 当文档切换时更新内容
  useEffect(() => {
    if (currentDocument) {
      // 根据文档类型获取内容
      if (currentDocument.type === 'article') {
        setContent(currentDocument.content.markdown || '');
      }
    }
  }, [currentDocument]);

  // 自动保存（防抖）
  useEffect(() => {
    if (!currentDocumentId || !currentDocument) return;

    const timer = setTimeout(() => {
      if (
        currentDocument.type === 'article' &&
        content !== currentDocument.content.markdown
      ) {
        updateDocument(currentDocumentId, {
          content: {
            markdown: content,
          },
          metadata: {
            wordCount: content.length,
          },
          updatedAt: new Date(),
        } as any);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, currentDocumentId, currentDocument, updateDocument]);

  if (!currentDocument) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📄</div>
          <p className="mb-2 text-lg font-medium text-gray-700">准备开始创作</p>
          <p className="text-sm text-gray-500">
            选择资源并与AI对话，点击"生成文档"开始创作
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-full w-full resize-none border-none p-0 font-sans text-base leading-relaxed focus:outline-none focus:ring-0"
        placeholder="开始编辑文档..."
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      />
    </div>
  );
}
