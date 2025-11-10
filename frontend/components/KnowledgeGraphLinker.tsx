'use client';

import { useState, useEffect, useCallback } from 'react';
import { config } from '@/lib/config';

interface GraphNode {
  id: string;
  type: string;
  linkedAt: string;
}

interface KnowledgeGraphLinkerProps {
  noteId: string;
  resourceId: string;
  linkedNodes: GraphNode[];
  onNodeLinked?: (node: GraphNode) => void;
  onNodeUnlinked?: (nodeId: string) => void;
}

/**
 * 知识图谱关联组件
 *
 * 功能：
 * - 展示资源相关的知识图谱节点
 * - 链接节点到笔记
 * - 显示已链接的节点
 * - 移除节点链接
 */
export default function KnowledgeGraphLinker({
  noteId,
  resourceId,
  linkedNodes,
  onNodeLinked,
  onNodeUnlinked,
}: KnowledgeGraphLinkerProps) {
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);

  useEffect(() => {
    loadGraph();
  }, [resourceId]);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/knowledge-graph/resource/${resourceId}?depth=2`
      );

      if (response.ok) {
        const data = await response.json();
        setGraphData(data);
      }
    } catch (err) {
      console.error('Failed to load knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  };

  const linkNode = useCallback(async (nodeId: string, nodeType: string) => {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/notes/${noteId}/graph-nodes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId, nodeType }),
        }
      );

      if (response.ok) {
        const newNode = {
          id: nodeId,
          type: nodeType,
          linkedAt: new Date().toISOString(),
        };
        onNodeLinked?.(newNode);
        setShowNodeSelector(false);
      }
    } catch (err) {
      console.error('Failed to link node:', err);
    }
  }, [noteId, onNodeLinked]);

  const unlinkNode = useCallback(async (nodeId: string) => {
    if (!confirm('确定要移除此节点关联吗？')) return;

    // TODO: Implement unlink API endpoint
    onNodeUnlinked?.(nodeId);
  }, [onNodeUnlinked]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const availableNodes = graphData?.nodes || [];
  const topics = availableNodes.filter((n: any) => n.labels?.includes('Topic'));
  const authors = availableNodes.filter((n: any) => n.labels?.includes('Author'));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              知识图谱关联
            </h3>
          </div>

          <button
            onClick={() => setShowNodeSelector(!showNodeSelector)}
            className="text-xs text-green-600 hover:text-green-800 font-medium"
          >
            {showNodeSelector ? '隐藏' : '添加节点'}
          </button>
        </div>
      </div>

      {/* Linked Nodes */}
      {linkedNodes.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            已关联节点 ({linkedNodes.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {linkedNodes.map(node => (
              <div
                key={node.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
              >
                <span className="capitalize mr-2">{node.type}</span>
                <span>{node.id}</span>
                <button
                  onClick={() => unlinkNode(node.id)}
                  className="ml-2 hover:text-green-900"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Node Selector */}
      {showNodeSelector && (
        <div className="p-4">
          {/* Topics */}
          {topics.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                主题 ({topics.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {topics.map((topic: any) => {
                  const isLinked = linkedNodes.some(n => n.id === topic.properties?.name);
                  return (
                    <div
                      key={topic.properties?.name}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {topic.properties?.name}
                        </div>
                        {topic.properties?.description && (
                          <div className="text-xs text-gray-600">
                            {topic.properties.description}
                          </div>
                        )}
                      </div>
                      {!isLinked ? (
                        <button
                          onClick={() => linkNode(topic.properties?.name, 'topic')}
                          className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        >
                          关联
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">已关联</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Authors */}
          {authors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">
                作者 ({authors.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-auto">
                {authors.map((author: any) => {
                  const isLinked = linkedNodes.some(n => n.id === author.properties?.username);
                  return (
                    <div
                      key={author.properties?.username}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {author.properties?.name || author.properties?.username}
                        </div>
                        {author.properties?.affiliation && (
                          <div className="text-xs text-gray-600">
                            {author.properties.affiliation}
                          </div>
                        )}
                      </div>
                      {!isLinked ? (
                        <button
                          onClick={() => linkNode(author.properties?.username, 'author')}
                          className="px-3 py-1 text-xs font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                        >
                          关联
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">已关联</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {topics.length === 0 && authors.length === 0 && (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                暂无可关联的知识图谱节点
              </p>
              <p className="text-xs text-gray-400 mt-1">
                系统将在后台为此资源构建知识图谱
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!showNodeSelector && linkedNodes.length === 0 && (
        <div className="p-4 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            暂未关联任何知识图谱节点
          </p>
          <button
            onClick={() => setShowNodeSelector(true)}
            className="mt-2 text-xs text-green-600 hover:text-green-800 font-medium"
          >
            开始添加
          </button>
        </div>
      )}
    </div>
  );
}
