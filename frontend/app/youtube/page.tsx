'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { config } from '@/lib/config';
import Sidebar from '@/components/layout/Sidebar';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface Topic {
  title: string;
  timestamp: number;
  color: string;
}

type YTPlayer = {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: string | HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function YouTubeTLDW() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams?.get('videoId') || '';

  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'chat' | 'notes'>(
    'transcript'
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  // Initialize YouTube Player
  useEffect(() => {
    if (!videoId) return;

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initializePlayer();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    };

    const initializePlayer = () => {
      if (!playerContainerRef.current) return;

      playerRef.current = new window.YT!.Player(playerContainerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            startPlaybackTracking();
          },
        },
      });
    };

    loadYouTubeAPI();

    return () => {
      stopPlaybackTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Failed to destroy player', err);
        }
      }
    };
  }, [videoId]);

  const startPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) return;

    playbackIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
        } catch (err) {
          // Ignore errors
        }
      }
    }, 500);
  }, []);

  const stopPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  // Fetch transcript
  useEffect(() => {
    if (!videoId) return;

    const fetchTranscript = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${config.apiUrl}/youtube/transcript/${videoId}`
        );
        const data = await response.json();

        if (data.transcript && Array.isArray(data.transcript)) {
          setTranscript(data.transcript);

          // Generate topics from transcript (mock implementation)
          const mockTopics: Topic[] = [
            {
              title: 'Organizing your closet feels like shopping.',
              timestamp: 48,
              color: 'bg-orange-400',
            },
            {
              title: 'Fans: Underrated comfort saving money and planet.',
              timestamp: 61,
              color: 'bg-purple-400',
            },
            {
              title: 'Digital detox: an eye-opening monthly reset.',
              timestamp: 55,
              color: 'bg-red-400',
            },
            {
              title: 'A better desk chair boosts motivation.',
              timestamp: 56,
              color: 'bg-green-400',
            },
          ];
          setTopics(mockTopics);
        }
      } catch (error) {
        console.error('Failed to fetch transcript:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTranscript();
  }, [videoId]);

  // Track active segment
  useEffect(() => {
    if (!transcript || transcript.length === 0) {
      setActiveSegmentIndex(-1);
      return;
    }

    const nextIndex = transcript.findIndex((segment, index) => {
      const start = segment.start;
      const nextSegment = transcript[index + 1];
      const end = nextSegment?.start ?? segment.start + segment.duration;
      return currentTime >= start && currentTime < end;
    });

    if (nextIndex !== -1 && nextIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(nextIndex);
    }
  }, [currentTime, transcript, activeSegmentIndex]);

  // Auto-scroll to active segment
  useEffect(() => {
    if (!autoScroll || activeSegmentIndex < 0) return;

    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegmentIndex, autoScroll]);

  const handleSeekToTopic = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp, true);
      playerRef.current.playVideo();
    }
  };

  const handleSeekToSegment = (start: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(start, true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoId) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">
              输入视频 URL 并获取字幕后即可在此
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />

      {/* Main Content - 2 Column Layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Column - Video & Topics */}
        <div className="flex w-1/2 flex-col border-r border-gray-200 p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push('/?tab=youtube')}
            className="mb-4 flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>返回 YouTube 列表</span>
          </button>

          {/* Video Player */}
          <div className="mb-6">
            <div
              ref={playerContainerRef}
              className="aspect-video w-full overflow-hidden rounded-lg bg-black"
            />
          </div>

          {/* Topics Section */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">视频</h3>
            <div className="space-y-3">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  onClick={() => handleSeekToTopic(topic.timestamp)}
                  className="group flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${topic.color}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{topic.title}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatTime(topic.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Transcript */}
        <div className="flex w-1/2 flex-col">
          {/* Tabs Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('transcript')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'transcript'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Transcript
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Notes
              </button>
            </div>

            {/* Auto Toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                autoScroll
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span>Auto</span>
              <div
                className={`h-4 w-8 rounded-full transition-colors ${
                  autoScroll ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    autoScroll ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {activeTab === 'transcript' && (
              <div className="space-y-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-gray-400">加载字幕中...</div>
                  </div>
                ) : transcript.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-sm text-gray-400">暂无字幕</div>
                  </div>
                ) : (
                  transcript.map((segment, index) => {
                    const isActive = index === activeSegmentIndex;
                    return (
                      <div
                        key={`${segment.start}-${index}`}
                        ref={isActive ? activeSegmentRef : null}
                        onClick={() => handleSeekToSegment(segment.start)}
                        className={`cursor-pointer rounded px-2 py-1.5 text-sm transition-colors ${
                          isActive ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-2 text-gray-400">&gt;&gt;</span>
                        <span
                          className={
                            isActive ? 'text-gray-900' : 'text-gray-700'
                          }
                        >
                          {segment.text}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-gray-400">Chat 功能开发中</div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="flex items-center justify-center py-12">
                <div className="text-sm text-gray-400">Notes 功能开发中</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
