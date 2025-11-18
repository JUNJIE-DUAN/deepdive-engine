'use client';

/**
 * YouTube Subtitle Export - Example Page
 *
 * This page demonstrates how to use the YouTube subtitle export components.
 * You can test the export functionality with any YouTube video that has subtitles.
 */

import React, { useState } from 'react';
import { SubtitleExportButton } from '@/components/youtube';

export default function YoutubeExportExample() {
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ'); // Default test video
  const [customVideoId, setCustomVideoId] = useState('');

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomVideoId(e.target.value);
  };

  const handleSetVideoId = () => {
    if (customVideoId.trim()) {
      setVideoId(customVideoId.trim());
    }
  };

  const extractVideoId = (input: string): string => {
    // Extract video ID from YouTube URL or use as-is if already an ID
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return input;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customVideoId.trim()) {
      const extractedId = extractVideoId(customVideoId.trim());
      setVideoId(extractedId);
      setCustomVideoId('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            YouTube Subtitle Export
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Export YouTube video subtitles to PDF with bilingual support (English + Chinese).
            Choose from multiple export formats and customization options.
          </p>
        </div>

        {/* Video Input Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Enter YouTube Video
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL or Video ID
              </label>
              <div className="flex gap-3">
                <input
                  id="videoUrl"
                  type="text"
                  value={customVideoId}
                  onChange={handleVideoIdChange}
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Load Video
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Current Video ID: <code className="bg-gray-100 px-2 py-1 rounded">{videoId}</code>
            </p>
          </form>
        </div>

        {/* Video Preview and Export Options */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="aspect-video bg-black flex items-center justify-center relative">
            {/* YouTube iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />

            {/* Export button overlay */}
            <div className="absolute top-4 right-4">
              <SubtitleExportButton
                videoId={videoId}
                variant="icon"
              />
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Export Options
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <SubtitleExportButton
                videoId={videoId}
                variant="primary"
                className="w-full"
              />
              <SubtitleExportButton
                videoId={videoId}
                variant="secondary"
                className="w-full"
              />
              <button
                onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Open in YouTube
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Export Formats</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Bilingual (Side-by-Side) - English | Chinese</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Bilingual (Stacked) - Vertical layout</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>English Only - Single language</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Chinese Only - Single language</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Automatic timestamp alignment</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Include video metadata</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Page numbers and navigation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Professional PDF formatting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use
          </h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">1.</span>
              <span>Enter a YouTube video URL or video ID in the input field above</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">2.</span>
              <span>Click "Load Video" to update the preview</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">3.</span>
              <span>Click "Export Subtitles" button to open the export dialog</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">4.</span>
              <span>Choose your preferred export format and options</span>
            </li>
            <li className="flex items-start">
              <span className="font-semibold text-blue-600 mr-3">5.</span>
              <span>Click "Export PDF" to download your subtitles</span>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This feature requires the video to have subtitles enabled.
              If subtitles are not available, you will see an error message.
            </p>
          </div>
        </div>

        {/* Example Videos */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Try These Example Videos
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
              { id: 'jNQXAC9IVRw', title: 'Me at the zoo (First YouTube Video)' },
              { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE' },
            ].map((video) => (
              <button
                key={video.id}
                onClick={() => setVideoId(video.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
              >
                <div className="text-sm font-medium text-gray-900 mb-1">{video.title}</div>
                <div className="text-xs text-gray-500 font-mono">{video.id}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
