'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { config } from '@/lib/config';

interface ReportSection {
  title: string;
  content: string;
}

interface Resource {
  id: string;
  type: string;
  title: string;
  abstract?: string;
  authors?: any;
  publishedAt?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  pdfUrl?: string;
  tags?: any;
}

interface Report {
  id: string;
  title: string;
  template: string;
  templateName: string;
  templateIcon: string;
  summary: string;
  sections: ReportSection[];
  resourceIds: string[];
  resourceCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  resources?: Resource[];
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.apiBaseUrl}/api/v1/reports/${reportId}`);

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!report) return;

    let markdown = `# ${report.title}\n\n`;
    markdown += `**${report.templateIcon} ${report.templateName}** | `;
    markdown += `📄 ${report.resourceCount} 篇素材 | `;
    markdown += `🕐 ${new Date(report.createdAt).toLocaleString()}\n\n`;
    markdown += `## 📝 核心摘要\n\n${report.summary}\n\n`;

    report.sections.forEach((section) => {
      markdown += `## ${section.title}\n\n${section.content}\n\n`;
    });

    markdown += `## 📚 参考素材\n\n`;
    report.resources?.forEach((resource, idx) => {
      markdown += `${idx + 1}. **${resource.title}**\n`;
      if (resource.sourceUrl) {
        markdown += `   - 链接: ${resource.sourceUrl}\n`;
      }
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = async () => {
    if (!confirm('确定要重新生成报告吗？这将花费一些时间。')) return;

    alert('重新生成功能暂未实现');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载报告中...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">报告加载失败</h2>
          <p className="text-gray-600 mb-4">{error || '未找到报告'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <header className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {/* Metadata */}
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <span>{report.templateIcon} {report.templateName}</span>
                <span>•</span>
                <span>📄 {report.resourceCount} 篇素材</span>
                <span>•</span>
                <span>🕐 {new Date(report.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900">
                {report.title}
              </h1>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              <button
                onClick={handleExportMarkdown}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                📄 导出 MD
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                🔄 重新生成
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>📝</span>
              <span>核心摘要</span>
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
          </div>
        </header>

        {/* Sections */}
        <div className="space-y-6 mb-12">
          {report.sections.map((section, idx) => (
            <section key={idx} className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {section.title}
              </h2>
              <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-red-600 prose-strong:text-gray-900 prose-code:text-red-600 prose-code:bg-red-50 prose-pre:bg-gray-50">
                <ReactMarkdown
                  components={{
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-300 border" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th className="px-4 py-2 text-left text-sm font-semibold bg-gray-50 border" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="px-4 py-2 text-sm border" {...props} />
                    ),
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>

        {/* Referenced Resources */}
        {report.resources && report.resources.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📚</span>
              <span>参考素材 ({report.resources.length})</span>
            </h2>
            <div className="grid gap-4">
              {report.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                >
                  {/* Thumbnail */}
                  {resource.thumbnailUrl && (
                    <img
                      src={`${config.apiBaseUrl}${resource.thumbnailUrl}`}
                      alt=""
                      className="w-20 h-28 object-cover rounded"
                    />
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {resource.title}
                        </h3>
                        {resource.abstract && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {resource.abstract}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="uppercase font-medium">{resource.type}</span>
                          {resource.publishedAt && (
                            <>
                              <span>•</span>
                              <span>{new Date(resource.publishedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex gap-2">
                        {resource.pdfUrl && (
                          <a
                            href={resource.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                          >
                            PDF
                          </a>
                        )}
                        {resource.sourceUrl && (
                          <a
                            href={resource.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            查看
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 返回
          </button>
        </div>
      </div>
    </div>
  );
}
