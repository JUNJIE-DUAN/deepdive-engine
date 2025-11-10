'use client';

import { useState, useCallback } from 'react';
import { config } from '@/lib/config';

interface AIExplanation {
  text: string;
  explanation: string;
  timestamp: string;
}

interface AIAssistantProps {
  noteId: string;
  existingInsights?: {
    explanations?: AIExplanation[];
  };
  onExplanationAdded?: (explanation: AIExplanation) => void;
}

/**
 * AI助手组件
 *
 * 功能：
 * - 选择文本并请求AI解释
 * - 显示AI生成的解释
 * - 保存解释历史
 * - 显示先前的解释
 */
export default function AIAssistant({
  noteId,
  existingInsights,
  onExplanationAdded,
}: AIAssistantProps) {
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState<AIExplanation | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const explanations = existingInsights?.explanations || [];

  // Request AI explanation
  const requestExplanation = useCallback(async (text?: string) => {
    const textToExplain = text || selectedText;
    if (!textToExplain.trim()) {
      setError('请输入或选择文本');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/notes/${noteId}/ai-explain`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToExplain }),
        }
      );

      if (response.ok) {
        const explanation = await response.json();
        setCurrentExplanation(explanation);
        onExplanationAdded?.(explanation);
        setSelectedText('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'AI服务暂时不可用');
      }
    } catch (err) {
      console.error('Failed to get AI explanation:', err);
      setError('请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [noteId, selectedText, onExplanationAdded]);

  // Get explanation from selection
  const handleGetSelectionExplanation = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text) {
      setSelectedText(text);
      requestExplanation(text);
    } else {
      setError('请先选择文本');
    }
  }, [requestExplanation]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              AI助手
            </h3>
          </div>

          {explanations.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              {showHistory ? '隐藏' : '查看'} 历史 ({explanations.length})
            </button>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入文本或选择文本后点击"解释选中"
          </label>
          <textarea
            value={selectedText}
            onChange={(e) => setSelectedText(e.target.value)}
            placeholder="输入需要解释的文本..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => requestExplanation()}
            disabled={loading || !selectedText.trim()}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                AI思考中...
              </span>
            ) : (
              '获取解释'
            )}
          </button>

          <button
            onClick={handleGetSelectionExplanation}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
          >
            解释选中
          </button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 bg-red-100 border border-red-400 text-red-700 text-xs rounded">
            {error}
          </div>
        )}
      </div>

      {/* Current Explanation */}
      {currentExplanation && (
        <div className="px-4 pb-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="mb-2">
              <span className="text-xs font-medium text-purple-900">
                原文：
              </span>
              <p className="text-sm text-gray-700 italic mt-1">
                "{currentExplanation.text}"
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-purple-900">
                AI解释：
              </span>
              <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                {currentExplanation.explanation}
              </p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {new Date(currentExplanation.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && explanations.length > 0 && (
        <div className="px-4 pb-4 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            解释历史
          </h4>
          <div className="space-y-3 max-h-96 overflow-auto">
            {explanations.map((exp, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    原文：
                  </span>
                  <p className="text-xs text-gray-600 italic mt-1">
                    "{exp.text}"
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-700">
                    解释：
                  </span>
                  <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                    {exp.explanation}
                  </p>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {new Date(exp.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentExplanation && explanations.length === 0 && !error && (
        <div className="px-4 pb-4 text-center">
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
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            选择文本并获取AI解释
          </p>
        </div>
      )}
    </div>
  );
}
