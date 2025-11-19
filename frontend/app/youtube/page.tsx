'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { config } from '@/lib/config';
import Sidebar from '@/components/layout/Sidebar';
import {
  AIContextBuilder,
  type Resource as AIResource,
} from '@/lib/ai-context-builder';
import ReactMarkdown from 'react-markdown';
import KeyMomentsPanel, {
  type KeyMoment,
} from '@/components/youtube/KeyMomentsPanel';
import { SubtitleExportButton } from '@/components/youtube';

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

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

function YouTubeTLDWContent() {
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

  // AI interaction states
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiModel, setAiModel] = useState('grok');

  // Right panel collapse state
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Translation control states
  const [showTranslation, setShowTranslation] = useState(false);
  const [translations, setTranslations] = useState<Map<number, string>>(
    new Map()
  );
  const [translationLoading, setTranslationLoading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({
    current: 0,
    total: 0,
  });

  // Key moments states
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Generate key moments from transcript
  useEffect(() => {
    if (!transcript || transcript.length === 0) {
      setKeyMoments([]);
      return;
    }

    // Generate mock key moments based on transcript segments
    // In production, this would come from AI analysis
    const moments: KeyMoment[] = [
      {
        id: '1',
        timestamp: transcript[Math.floor(transcript.length * 0.1)]?.start || 0,
        title: 'Introduction & Overview',
        summary: 'Opening remarks and introduction to the main topic',
        importance: 'high',
        tags: ['intro', 'overview'],
      },
      {
        id: '2',
        timestamp: transcript[Math.floor(transcript.length * 0.3)]?.start || 0,
        title: 'Key Concept Explanation',
        summary: 'Detailed explanation of the core concept',
        importance: 'high',
        tags: ['concept', 'explanation'],
      },
      {
        id: '3',
        timestamp: transcript[Math.floor(transcript.length * 0.5)]?.start || 0,
        title: 'Practical Examples',
        summary: 'Real-world examples and use cases',
        importance: 'medium',
        tags: ['examples', 'practical'],
      },
      {
        id: '4',
        timestamp: transcript[Math.floor(transcript.length * 0.7)]?.start || 0,
        title: 'Advanced Topics',
        summary: 'Deep dive into advanced techniques',
        importance: 'medium',
        tags: ['advanced', 'techniques'],
      },
      {
        id: '5',
        timestamp: transcript[Math.floor(transcript.length * 0.9)]?.start || 0,
        title: 'Summary & Conclusion',
        summary: 'Recap of key points and final thoughts',
        importance: 'high',
        tags: ['summary', 'conclusion'],
      },
    ];

    setKeyMoments(moments);
  }, [transcript]);

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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  // Send AI message with video context
  const sendAIMessage = async () => {
    if (!aiInput.trim() || !videoId) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: aiInput,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    const currentInput = aiInput;
    setAiInput('');
    setIsStreaming(true);

    try {
      // Build context for YouTube video
      const transcriptText = transcript
        .map((seg) => `[${formatTime(seg.start)}] ${seg.text}`)
        .join('\n');

      let context = `=== RESOURCE TYPE: YouTube Video ===\n\n`;
      context += `VIDEO ID: ${videoId}\n`;
      context += `CURRENT PLAYBACK TIME: ${formatTime(currentTime)}\n\n`;

      if (transcriptText) {
        context += `VIDEO TRANSCRIPT:\n${transcriptText.substring(0, 15000)}\n\n`;
      }

      if (topics.length > 0) {
        context += `VIDEO TOPICS:\n`;
        topics.forEach((topic) => {
          context += `- [${formatTime(topic.timestamp)}] ${topic.title}\n`;
        });
      }

      const res = await fetch('/api/ai-service/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          context: context,
          model: aiModel,
          stream: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch');

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setAiMessages((prev) => [...prev, assistantMessage]);
      const messageIndex = aiMessages.length + 1;

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setAiMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[messageIndex] = {
                    ...newMessages[messageIndex],
                    content: newMessages[messageIndex].content + parsed.content,
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.debug('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: AIMessage = {
        role: 'assistant',
        content:
          'AI服务暂时不可用，请检查AI服务是否运行（http://localhost:5000）',
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  // Translate current segment when it's played (on-demand translation)
  useEffect(() => {
    const translateCurrentSegment = async () => {
      if (
        !showTranslation ||
        activeSegmentIndex === -1 ||
        transcript.length === 0
      )
        return;

      // Check if already translated
      if (translations.has(activeSegmentIndex)) return;

      const currentSegment = transcript[activeSegmentIndex];
      if (!currentSegment || !currentSegment.text) return;

      setTranslationLoading(true);
      try {
        const res = await fetch('/api/ai-service/ai/translate-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: currentSegment.text,
            targetLanguage: 'zh-CN',
            model: 'openai', // 使用最便宜的模型 gpt-4o-mini
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to translate');
        }

        const data = await res.json();

        // Update translations map
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(
            activeSegmentIndex,
            data.translation || currentSegment.text
          );
          return newMap;
        });

        console.log(
          `Translated segment ${activeSegmentIndex}: "${currentSegment.text}" -> "${data.translation}"`
        );
      } catch (error: any) {
        console.error('Failed to translate segment:', error?.message || error);
        // Fallback to original text on error
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(activeSegmentIndex, currentSegment.text);
          return newMap;
        });
      } finally {
        setTranslationLoading(false);
      }
    };

    translateCurrentSegment();
  }, [showTranslation, activeSegmentIndex, transcript, translations]);

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
      <main className="flex flex-1 overflow-hidden overflow-x-hidden">
        {/* Left Column - Video & Topics */}
        <div
          className={`flex flex-col border-r border-gray-200 p-6 transition-all duration-300 ${
            rightPanelCollapsed ? 'w-full' : 'w-1/2'
          }`}
        >
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
          <div className="relative mb-6">
            <div
              ref={playerContainerRef}
              className="aspect-video w-full overflow-hidden rounded-lg bg-black"
            />
          </div>

          {/* Key Moments Section - Below Video */}
          <div className="mb-4 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">关键时刻</h3>
                  <p className="text-xs text-gray-500">
                    {keyMoments.length} 个重点
                  </p>
                </div>
              </div>
            </div>

            {/* Key Moments List */}
            <div
              className="overflow-y-auto p-3"
              style={{ maxHeight: 'calc(100vh - 600px)' }}
            >
              {keyMoments.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-4xl">🔍</div>
                  <p className="mt-2 text-sm text-gray-500">暂无关键时刻</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {keyMoments.map((moment) => {
                    const isActive =
                      currentTime >= moment.timestamp &&
                      (keyMoments.find((m) => m.timestamp > currentTime)
                        ?.timestamp || Infinity) > moment.timestamp;

                    const importanceConfig = {
                      high: {
                        icon: '■',
                        color: 'bg-blue-50 border-blue-200 text-blue-900',
                        badgeColor: 'bg-blue-600 text-white',
                        hoverColor: 'hover:border-blue-300 hover:bg-blue-100',
                      },
                      medium: {
                        icon: '■',
                        color: 'bg-slate-50 border-slate-200 text-slate-900',
                        badgeColor: 'bg-slate-500 text-white',
                        hoverColor: 'hover:border-slate-300 hover:bg-slate-100',
                      },
                      low: {
                        icon: '■',
                        color: 'bg-gray-50 border-gray-200 text-gray-700',
                        badgeColor: 'bg-gray-400 text-white',
                        hoverColor: 'hover:border-gray-300 hover:bg-gray-100',
                      },
                    };

                    const config = importanceConfig[moment.importance];

                    return (
                      <div
                        key={moment.id}
                        onClick={() => {
                          if (playerRef.current) {
                            playerRef.current.seekTo(moment.timestamp, true);
                          }
                        }}
                        className={`group cursor-pointer rounded-lg border-2 p-3 transition-all ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : `${config.color} ${config.hoverColor}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xl">{config.icon}</span>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-bold ${
                                isActive
                                  ? 'bg-blue-600 text-white'
                                  : config.badgeColor
                              }`}
                            >
                              {formatTime(moment.timestamp)}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-sm font-semibold leading-snug ${
                                isActive ? 'text-blue-900' : 'text-gray-900'
                              }`}
                            >
                              {moment.title}
                            </h4>

                            {moment.summary && (
                              <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                {moment.summary}
                              </p>
                            )}

                            {moment.tags && moment.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {moment.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-medium text-gray-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Transcript */}
        {!rightPanelCollapsed && (
          <div className="flex w-1/2 flex-col">
            {/* Tabs Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-2 py-2">
              <div className="flex items-center justify-between">
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={`group relative flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 ${
                      activeTab === 'transcript'
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20'
                        : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow'
                    }`}
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="leading-tight">Transcript</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`group relative flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 ${
                      activeTab === 'chat'
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20'
                        : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow'
                    }`}
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
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="leading-tight">Chat</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('notes')}
                    className={`group relative flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 ${
                      activeTab === 'notes'
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20'
                        : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow'
                    }`}
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span className="leading-tight">Notes</span>
                  </button>
                </div>

                {/* Toggle Buttons Group */}
                <div className="flex items-center gap-1">
                  {/* Translation Toggle */}
                  <button
                    onClick={() => {
                      const newShowTranslation = !showTranslation;
                      setShowTranslation(newShowTranslation);
                      // 重新打开翻译时，清除缓存以便重新翻译
                      if (newShowTranslation) {
                        setTranslations(new Map());
                      }
                    }}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      showTranslation
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <span>翻译</span>
                    <div
                      className={`h-4 w-8 rounded-full transition-colors ${
                        showTranslation ? 'bg-purple-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          showTranslation ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Auto Scroll Toggle */}
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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

                  {/* Subtitle Export Button */}
                  <SubtitleExportButton
                    videoId={videoId}
                    variant="icon"
                  />
                </div>
              </div>
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
                          className={`group cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                            isActive
                              ? 'border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm'
                              : 'border-l-4 border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 text-xs font-medium ${
                                isActive ? 'text-red-600' : 'text-gray-400'
                              }`}
                            >
                              {formatTime(segment.start)}
                            </span>
                            <div className="flex-1">
                              <div
                                className={`leading-relaxed ${
                                  isActive
                                    ? 'font-medium text-gray-900'
                                    : 'text-gray-700'
                                }`}
                              >
                                {segment.text}
                              </div>
                              {showTranslation && (
                                <div className="mt-1.5 text-sm leading-relaxed text-blue-600">
                                  {translationLoading && isActive
                                    ? '翻译中...'
                                    : translations.get(index) ||
                                      (isActive ? '' : '')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="flex h-full flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {aiMessages.length > 0 ? (
                      aiMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            <div
                              className={`mt-1 text-xs ${
                                msg.role === 'user'
                                  ? 'text-red-100'
                                  : 'text-gray-500'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <h3 className="mt-2 text-sm font-semibold text-gray-900">
                            与AI对话
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            询问视频内容、获取总结或深入讨论
                          </p>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-gray-200 bg-white p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && !e.shiftKey && sendAIMessage()
                        }
                        placeholder="Ask about the video..."
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                        disabled={isStreaming}
                      />
                      <button
                        onClick={sendAIMessage}
                        disabled={!aiInput.trim() || isStreaming}
                        className="rounded-lg bg-gradient-to-br from-red-500 to-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isStreaming ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
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
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-gray-400">Notes 功能开发中</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-l-lg bg-white p-2 shadow-lg transition-all hover:bg-gray-50"
          title={rightPanelCollapsed ? '展开右侧面板' : '折叠右侧面板'}
        >
          <svg
            className={`h-5 w-5 text-gray-600 transition-transform ${
              rightPanelCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </main>
    </div>
  );
}

export default function YouTubeTLDW() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // On server, render nothing to avoid hydration mismatch
  // On client, render the actual content immediately
  if (!isMounted) {
    return null;
  }

  return (
    <Suspense fallback={<YouTubeLoadingFallback />}>
      <YouTubeTLDWContent />
    </Suspense>
  );
}

function YouTubeLoadingFallback() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex w-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    </div>
  );
}
