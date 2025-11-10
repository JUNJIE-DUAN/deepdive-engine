'use client';

import { useState } from 'react';
import { config } from '@/lib/config';
import Sidebar from '@/components/Sidebar';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface TranscriptReport {
  title: string;
  summary: string;
  sections: {
    title: string;
    content: string;
  }[];
}

export default function YouTubePage() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[] | null>(null);
  const [report, setReport] = useState<TranscriptReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedTranscript, setTranslatedTranscript] = useState<TranscriptSegment[] | null>(null);

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Fetch transcript
  const handleFetchTranscript = async () => {
    if (!youtubeUrl.trim()) {
      setError('请输入YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('无效的YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);
    setTranscript(null);
    setReport(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/youtube/transcript/${videoId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '获取字幕失败');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setVideoTitle(data.title || 'YouTube Video');
    } catch (err: any) {
      console.error('Fetch transcript error:', err);
      setError(err.message || '获取字幕失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Generate report from transcript
  const handleGenerateReport = async () => {
    if (!transcript) {
      setError('请先获取字幕');
      return;
    }

    setGenerating(true);
    setError(null);
    setReport(null);

    try {
      // Combine transcript segments into full text
      const fullText = transcript.map(seg => seg.text).join(' ');

      // Call AI service directly (localhost:5000)
      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5000';
      const response = await fetch(`${aiServiceUrl}/api/v1/ai/youtube-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle,
          transcript: fullText,
          model: 'gpt-4'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '生成报告失败');
      }

      const reportData = await response.json();
      setReport(reportData);
    } catch (err: any) {
      console.error('Generate report error:', err);
      setError(err.message || '生成报告失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  // Translate transcript to Chinese
  const handleTranslate = async () => {
    if (!transcript) {
      setError('请先获取字幕');
      return;
    }

    setTranslating(true);
    setError(null);

    try {
      const fullText = transcript.map(seg => seg.text).join('\n');

      const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5000';
      const response = await fetch(`${aiServiceUrl}/api/v1/ai/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullText,
          targetLanguage: 'zh-CN',
          model: 'gpt-4'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '翻译失败');
      }

      const { translatedText } = await response.json();
      const translatedLines = translatedText.split('\n');

      const translated = transcript.map((seg, idx) => ({
        ...seg,
        text: translatedLines[idx] || seg.text
      }));

      setTranslatedTranscript(translated);
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || '翻译失败，请重试');
    } finally {
      setTranslating(false);
    }
  };

  // Export report to PDF
  const handleExportPDF = async () => {
    if (!report) {
      setError('请先生成报告');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set font (use built-in Helvetica for English/numbers)
      doc.setFont('helvetica');

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      doc.setFontSize(20);
      doc.text(report.title, margin, yPosition);
      yPosition += 15;

      // Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary:', margin, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(report.summary, maxWidth);
      doc.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 10;

      // Sections
      report.sections.forEach((section, idx) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, margin, yPosition);
        yPosition += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const contentLines = doc.splitTextToSize(section.content, maxWidth);

        contentLines.forEach((line: string) => {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
      });

      // Save the PDF
      const fileName = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}_report.pdf`;
      doc.save(fileName);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setError(err.message || 'PDF导出失败，请重试');
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">YouTube 字幕提取</h1>
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
              YouTube 视频 URL
            </label>
            <div className="flex gap-3">
              <input
                id="youtube-url"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleFetchTranscript();
                  }
                }}
              />
              <button
                onClick={handleFetchTranscript}
                disabled={loading || !youtubeUrl.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '获取中...' : '获取字幕'}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              支持格式：https://www.youtube.com/watch?v=VIDEO_ID 或 https://youtu.be/VIDEO_ID
            </p>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{videoTitle}</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleTranslate}
                  disabled={translating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {translating ? '翻译中...' : '翻译成中文'}
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {generating ? '生成中...' : '生成报告'}
                </button>
              </div>
            </div>

            {/* Original Transcript */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">原文字幕</h3>
              <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-4">
                {transcript.map((segment, index) => (
                  <div key={index} className="flex gap-3 text-sm">
                    <span className="text-gray-400 font-mono min-w-[50px]">
                      {formatTime(segment.start)}
                    </span>
                    <p className="text-gray-700">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Translated Transcript */}
            {translatedTranscript && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">中文翻译</h3>
                <div className="max-h-96 overflow-y-auto space-y-2 border border-purple-200 rounded-lg p-4 bg-purple-50">
                  {translatedTranscript.map((segment, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <span className="text-purple-400 font-mono min-w-[50px]">
                        {formatTime(segment.start)}
                      </span>
                      <p className="text-gray-700">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-3 text-sm text-gray-500">
              总计 {transcript.length} 条字幕片段
            </p>
          </div>
        )}

        {/* Report Display */}
        {report && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  导出PDF
                </button>
              </div>
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-gray-700">{report.summary}</p>
              </div>
            </div>

            <div className="space-y-6">
              {report.sections.map((section, index) => (
                <div key={index} className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
                  <div className="prose max-w-none">
                    <div
                      className="text-gray-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br/>') }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {(loading || generating || translating) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">
                {loading && '正在获取字幕...'}
                {generating && '正在生成报告...'}
                {translating && '正在翻译字幕...'}
              </p>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
