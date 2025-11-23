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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            YouTube Subtitle Export
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Export YouTube video subtitles to PDF with bilingual support
            (English + Chinese). Choose from multiple export formats and
            customization options.
          </p>
        </div>

        {/* Video Input Form */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Enter YouTube Video
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="videoUrl"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                YouTube URL or Video ID
              </label>
              <div className="flex gap-3">
                <input
                  id="videoUrl"
                  type="text"
                  value={customVideoId}
                  onChange={handleVideoIdChange}
                  placeholder="https://www.youtube.com/watch?v=... or video ID"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Load Video
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Current Video ID:{' '}
              <code className="rounded bg-gray-100 px-2 py-1">{videoId}</code>
            </p>
          </form>
        </div>

        {/* Video Preview and Export Options */}
        <div className="mb-8 overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="relative flex aspect-video items-center justify-center bg-black">
            {/* YouTube iframe */}
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />

            {/* Export button overlay */}
            <div className="absolute right-4 top-4">
              <SubtitleExportButton videoId={videoId} variant="icon" />
            </div>
          </div>

          <div className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Export Options
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
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
                onClick={() =>
                  window.open(
                    `https://www.youtube.com/watch?v=${videoId}`,
                    '_blank'
                  )
                }
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Open in YouTube
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Export Formats
              </h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">•</span>
                <span>Bilingual (Side-by-Side) - English | Chinese</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">•</span>
                <span>Bilingual (Stacked) - Vertical layout</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">•</span>
                <span>English Only - Single language</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-blue-600">•</span>
                <span>Chinese Only - Single language</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Features</h3>
            </div>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Automatic timestamp alignment</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Include video metadata</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Page numbers and navigation</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 text-green-600">✓</span>
                <span>Professional PDF formatting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            How to Use
          </h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-blue-600">1.</span>
              <span>
                Enter a YouTube video URL or video ID in the input field above
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-blue-600">2.</span>
              <span>Click "Load Video" to update the preview</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-blue-600">3.</span>
              <span>
                Click "Export Subtitles" button to open the export dialog
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-blue-600">4.</span>
              <span>Choose your preferred export format and options</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-semibold text-blue-600">5.</span>
              <span>Click "Export PDF" to download your subtitles</span>
            </li>
          </ol>

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This feature requires the video to have
              subtitles enabled. If subtitles are not available, you will see an
              error message.
            </p>
          </div>
        </div>

        {/* Example Videos */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-lg">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Try These Example Videos
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                id: 'dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up',
              },
              {
                id: 'jNQXAC9IVRw',
                title: 'Me at the zoo (First YouTube Video)',
              },
              { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE' },
            ].map((video) => (
              <button
                key={video.id}
                onClick={() => setVideoId(video.id)}
                className="rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
              >
                <div className="mb-1 text-sm font-medium text-gray-900">
                  {video.title}
                </div>
                <div className="font-mono text-xs text-gray-500">
                  {video.id}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
