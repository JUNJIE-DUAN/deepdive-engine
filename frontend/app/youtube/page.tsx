'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { config } from '@/lib/config';
import Sidebar from '@/components/Sidebar';

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  translation?: string;
}

interface SavedVideo {
  id: string;
  videoId: string;
  title: string;
  url: string;
  transcript?: TranscriptSegment[] | null;
  translatedText?: string | null;
  aiReport?: TranscriptReport | null;
  createdAt: string;
}

type YTPlayer = {
  destroy: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
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
            onStateChange?: (event: { target: YTPlayer; data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState?: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[] | null>(
    null
  );
  const [report, setReport] = useState<TranscriptReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedTranscript, setTranslatedTranscript] = useState<
    TranscriptSegment[] | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [savedVideosLoading, setSavedVideosLoading] = useState(false);
  const [selectedSavedVideoId, setSelectedSavedVideoId] = useState<string | null>(null);
  const [loadingSavedVideo, setLoadingSavedVideo] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedVideoParam = useMemo(
    () => searchParams?.get('saved') ?? null,
    [searchParams]
  );
  const hasTranslationsAvailable = useMemo(() => {
    if (!transcript || transcript.length === 0) {
      return false;
    }

    if (
      transcript.some(
        (segment) =>
          typeof segment.translation === 'string' &&
          segment.translation.trim().length > 0
      )
    ) {
      return true;
    }

    if (translatedTranscript) {
      return translatedTranscript.some(
        (segment) => segment.text && segment.text.trim().length > 0
      );
    }

    return false;
  }, [transcript, translatedTranscript]);

  const normalizeSegments = useCallback((segments: any[]): TranscriptSegment[] => {
    if (!Array.isArray(segments)) {
      return [];
    }

    return segments
      .map((segment) => {
        const text =
          typeof segment?.text === 'string'
            ? segment.text
            : Array.isArray(segment?.text)
            ? segment.text.join(' ')
            : '';
        const translation =
          typeof segment?.translation === 'string'
            ? segment.translation
            : undefined;

        return {
          text,
          start: Number(segment?.start ?? segment?.offset ?? 0),
          duration: Number(segment?.duration ?? segment?.dur ?? segment?.length ?? 0),
          translation,
        } as TranscriptSegment;
      })
      .filter((segment) => segment.text.trim().length > 0)
      .sort((a, b) => a.start - b.start);
  }, []);

  const stopPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  }, []);

  const startPlaybackTracking = useCallback(() => {
    if (playbackIntervalRef.current) {
      return;
    }

    playbackIntervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      try {
        const time = player.getCurrentTime();
        setCurrentTime(time);
      } catch (err) {
        console.error('Failed to read current time from player', err);
      }
    }, 300);
  }, []);

  const loadYouTubeAPI = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }

    if (window.YT?.Player) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (existingScript) {
        window.onYouTubeIframeAPIReady = () => resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () =>
        reject(new Error('Failed to load YouTube iframe API script'));
      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  }, []);

  const initializePlayer = useCallback(
    async (videoId: string) => {
      if (!videoId) {
        return;
      }

      try {
        await loadYouTubeAPI();

        const container = playerContainerRef.current;
        if (!container) {
          return;
        }

        if (playerRef.current) {
          stopPlaybackTracking();
          playerRef.current.cueVideoById(videoId);
          setCurrentTime(0);
          return;
        }

        playerRef.current = new window.YT!.Player(container, {
          videoId,
          playerVars: {
            modestbranding: 1,
            rel: 0,
            cc_load_policy: 0,
          },
          events: {
            onReady: () => {
              playerRef.current?.cueVideoById(videoId);
              setCurrentTime(0);
            },
            onStateChange: (event) => {
              const playerState = window.YT?.PlayerState;
              if (!playerState) {
                return;
              }

              if (event.data === playerState.PLAYING) {
                startPlaybackTracking();
              } else if (
                event.data === playerState.PAUSED ||
                event.data === playerState.ENDED
              ) {
                stopPlaybackTracking();
              }
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize YouTube player', err);
      }
    },
    [loadYouTubeAPI, startPlaybackTracking, stopPlaybackTracking]
  );

  const handleSegmentSeek = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    try {
      player.seekTo(seconds, true);
      player.playVideo();
    } catch (err) {
      console.error('Failed to seek player', err);
    }
  }, []);

  const loadSavedVideos = useCallback(async () => {
    setSavedVideosLoading(true);
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/v1/youtube-videos`);
      if (!response.ok) {
        throw new Error('æ— æ³•åŠ è½½å·²ä¿å­˜çš„è§†é¢‘');
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        setSavedVideos([]);
        return;
      }

      const normalized: SavedVideo[] = data.map((video: any) => ({
        id: video.id,
        videoId: video.videoId ?? video.video_id ?? '',
        title: video.title ?? 'Î´ÃüÃûÊÓÆµ',
        url: video.url ?? '',
        transcript: null,
        translatedText: video.translatedText ?? video.translated_text ?? null,
        aiReport: video.aiReport ?? video.ai_report ?? null,
        createdAt: video.createdAt ?? video.created_at ?? '',
      }));

      setSavedVideos(normalized);
    } catch (err) {
      console.error('Load saved videos error:', err);
    } finally {
      setSavedVideosLoading(false);
    }
  }, []);

  const handleLoadSavedVideo = useCallback(
    async (id: string) => {
      if (!id) {
        return;
      }

      setLoading(true);
      setLoadingSavedVideo(true);
      setError(null);
      setReport(null);
      setTranslatedTranscript(null);
      setSaved(false);

      try {
        const response = await fetch(
          `${config.apiBaseUrl}/api/v1/youtube-videos/${id}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'åŠ è½½ä¿å­˜çš„è§†é¢‘å¤±è´?);
        }

        const data = await response.json();
        const videoId: string =
          data.videoId ?? data.video_id ?? extractVideoId(data.url) ?? '';

        const normalizedTranscript = normalizeSegments(
          Array.isArray(data.transcript)
            ? data.transcript
            : typeof data.transcript === 'string'
            ? (() => {
                try {
                  const parsed = JSON.parse(data.transcript);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : []
        );

        setYoutubeUrl(
          data.url ?? (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
        );
        setVideoTitle(data.title ?? 'YouTube è§†é¢‘');
        setTranscript(normalizedTranscript);
        setReport(data.aiReport ?? data.ai_report ?? null);
        setCurrentVideoId(videoId || null);
        setActiveSegmentIndex(-1);
        setCurrentTime(0);
        setSelectedSavedVideoId(data.id ?? id);

        if (videoId) {
          void initializePlayer(videoId);
        }

        let translations: string[] | null = null;

        if (
          normalizedTranscript.length > 0 &&
          normalizedTranscript.some((seg) => seg.translation)
        ) {
          translations = normalizedTranscript.map((seg) => seg.translation ?? '');
        } else if (typeof data.translatedText === 'string') {
          translations = data.translatedText
            .split(/\r?\n/)
            .map((line: string) => line.trim());
        } else if (typeof data.translated_text === 'string') {
          translations = data.translated_text
            .split(/\r?\n/)
            .map((line: string) => line.trim());
        }

        if (translations && normalizedTranscript.length > 0) {
          const bilingualTranscript = normalizedTranscript.map(
            (segment, index) => ({
              ...segment,
              translation: translations?.[index] ?? segment.translation,
            })
          );

          setTranscript(bilingualTranscript);
          setTranslatedTranscript(
            bilingualTranscript.map((segment) => ({
              text: segment.translation ?? segment.text,
              start: segment.start,
              duration: segment.duration,
            }))
          );
        } else {
          setTranslatedTranscript(
            normalizedTranscript.length
              ? normalizedTranscript.map((segment) => ({
                  text: segment.translation ?? '',
                  start: segment.start,
                  duration: segment.duration,
                }))
              : null
          );
        }
      } catch (err: any) {
        console.error('Load saved video error:', err);
        setError(err.message || 'åŠ è½½ä¿å­˜çš„è§†é¢‘å¤±è´?);
      } finally {
        setLoading(false);
        setLoadingSavedVideo(false);
      }
    },
    [initializePlayer, normalizeSegments]
  );

  const handleSelectSavedVideo = useCallback(
    (id: string) => {
      if (!id) {
        return;
      }
      setSelectedSavedVideoId(id);
      void handleLoadSavedVideo(id);
      router.replace(`/youtube?saved=${id}`, { scroll: false });
    },
    [handleLoadSavedVideo, router]
  );

  useEffect(() => {
    void loadSavedVideos();
  }, [loadSavedVideos]);

  useEffect(() => {
    if (!savedVideoParam) {
      setSelectedSavedVideoId(null);
      return;
    }

    if (savedVideoParam === selectedSavedVideoId) {
      return;
    }

    void handleLoadSavedVideo(savedVideoParam);
  }, [handleLoadSavedVideo, savedVideoParam, selectedSavedVideoId]);

  useEffect(() => {
    return () => {
      stopPlaybackTracking();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (err) {
          console.error('Failed to destroy YouTube player', err);
        }
      }
    };
  }, [stopPlaybackTracking]);

  useEffect(() => {
    if (!transcript || transcript.length === 0) {
      if (activeSegmentIndex !== -1) {
        setActiveSegmentIndex(-1);
      }
      return;
    }

    const nextIndex = transcript.findIndex((segment, index) => {
      const start = segment.start;
      const nextSegment = transcript[index + 1];
      const end =
        nextSegment?.start ??
        segment.start + (segment.duration > 0 ? segment.duration : 4);

      return currentTime >= start && currentTime < end;
    });

    if (nextIndex !== -1 && nextIndex !== activeSegmentIndex) {
      setActiveSegmentIndex(nextIndex);
    }
  }, [activeSegmentIndex, currentTime, transcript]);

  useEffect(() => {
    if (activeSegmentIndex < 0) {
      return;
    }

    if (activeSegmentRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeSegmentIndex]);

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
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
      setError('è¯·è¾“å…¥YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('æ— æ•ˆçš„YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);
    setTranscript(null);
    setReport(null);
    setTranslatedTranscript(null);
    setSaved(false);
    setSelectedSavedVideoId(null);
    setActiveSegmentIndex(-1);
    setCurrentTime(0);
    setCurrentVideoId(videoId);

    void initializePlayer(videoId);
    router.replace('/youtube', { scroll: false });

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/youtube/transcript/${videoId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
      }

      const data = await response.json();
      const normalizedTranscript = normalizeSegments(
        Array.isArray(data.transcript) ? data.transcript : []
      );
      setTranscript(normalizedTranscript);
      setVideoTitle(data.title || 'YouTube è§†é¢‘');
    } catch (err: any) {
      console.error('Fetch transcript error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    } finally {
      setLoading(false);
    }
  };

  // Generate report from transcript
  const handleGenerateReport = async () => {
    if (!transcript) {
      setError('è¯·å…ˆè·å–å­—å¹•');
      return;
    }

    setGenerating(true);
    setError(null);
    setReport(null);

    try {
      // Combine transcript segments into full text
      const fullText = transcript.map((seg) => seg.text).join(' ');

      // Call AI service directly (localhost:5000)
      const aiServiceUrl =
        process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5000';
      const response = await fetch(`${aiServiceUrl}/api/v1/ai/youtube-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: videoTitle,
          transcript: fullText,
          model: 'gpt-4',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
      }

      const reportData = await response.json();
      setReport(reportData);

      // Auto-scroll to report after generation
      setTimeout(() => {
        const reportElement = document.getElementById('youtube-report');
        if (reportElement) {
          reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Generate report error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    } finally {
      setGenerating(false);
    }
  };

  // Translate transcript to Chinese
  const handleTranslate = async () => {
    if (!transcript || transcript.length === 0) {
      setError('è¯·å…ˆè·å–å­—å¹•');
      return;
    }

    setTranslating(true);
    setError(null);

    try {
      const aiServiceUrl =
        process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:5000';

      const response = await fetch(
        `${aiServiceUrl}/api/v1/ai/translate-segments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments: transcript.map((segment) => segment.text),
            targetLanguage: 'zh-CN',
            model: 'gpt-4',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
      }

      const data = await response.json();
      if (!Array.isArray(data.translations)) {
        throw new Error('ç¿»è¯‘ç»“æœæ ¼å¼å¼‚å¸¸');
      }

      const bilingualTranscript = transcript.map((segment, index) => ({
        ...segment,
        translation:
          typeof data.translations[index] === 'string' && data.translations[index]
            ? data.translations[index]
            : segment.translation ?? segment.text,
      }));

      setTranscript(bilingualTranscript);
      setTranslatedTranscript(
        bilingualTranscript.map((segment) => ({
          text: segment.translation ?? segment.text,
          start: segment.start,
          duration: segment.duration,
        }))
      );
      setSaved(false);
    } catch (err: any) {
      console.error('Translation error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    } finally {
      setTranslating(false);
    }
  };

  // Export bilingual transcript to PDF
  const handleExportBilingualPDF = async () => {
    if (!transcript || transcript.length === 0) {
      setError('è¯·å…ˆè·å–å­—å¹•');
      return;
    }

    const hasTranslation = transcript.some(
      (segment) => typeof segment.translation === 'string' && segment.translation
    );

    if (!hasTranslation) {
      setError('è¯·å…ˆè¿›è¡Œå­—å¹•ç¿»è¯‘');
      return;
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const transcriptElement = document.getElementById(
        'bilingual-transcript'
      );

      if (!transcriptElement) {
        throw new Error('æ— æ³•æ‰¾åˆ°å­—å¹•å†…å®¹åŒºåŸŸ');
      }

      const clone = transcriptElement.cloneNode(true) as HTMLElement;
      clone.id = 'bilingual-transcript-export';
      clone.style.maxHeight = 'none';
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.padding = '24px';
      clone.style.backgroundColor = '#ffffff';
      clone.classList.remove('max-h-96', 'overflow-y-auto');
      clone.querySelectorAll('button').forEach((button) => {
        (button as HTMLElement).style.display = 'none';
      });
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(clone);

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const doc = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      const imageData = canvas.toDataURL('image/png');
      doc.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeTitle = videoTitle
        ? videoTitle.replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '_')
        : 'youtube_video';
      doc.save(`${safeTitle}_bilingual_subtitles.pdf`);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    }
  };

  // Export report to PDF
  const handleExportPDF = async () => {
    if (!report) {
      setError('è¯·å…ˆç”ŸæˆæŠ¥å‘Š');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set font (use built-in Helvetica for English/numbers)
      doc.setFont('helvetica');

      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      doc.setFontSize(20);
      doc.text('YouTube Video Analysis Report', margin, yPosition);
      yPosition += 10;

      // Video Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      const videoTitleLines = doc.splitTextToSize(
        `Video: ${videoTitle}`,
        maxWidth
      );
      doc.text(videoTitleLines, margin, yPosition);
      yPosition += videoTitleLines.length * 6 + 10;

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
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    }
  };

  // Export report to PDF using html2canvas (Chinese-friendly)
  const handleExportPDFNew = async () => {
    if (!report) {
      setError('è¯·å…ˆç”ŸæˆæŠ¥å‘Š');
      return;
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Get the report element
      const reportElement = document.getElementById('youtube-report');
      if (!reportElement) {
        throw new Error('æ— æ³•æ‰¾åˆ°æŠ¥å‘Šå…ƒç´ ');
      }

      // Hide the export button temporarily
      const exportBtn = reportElement.querySelector('button');
      const originalDisplay = exportBtn
        ? (exportBtn as HTMLElement).style.display
        : '';
      if (exportBtn) {
        (exportBtn as HTMLElement).style.display = 'none';
      }

      // Render the report as canvas
      const canvas = await html2canvas(reportElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Restore the export button
      if (exportBtn) {
        (exportBtn as HTMLElement).style.display = originalDisplay;
      }

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const doc = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      doc.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `YouTube_Report_${new Date().getTime()}.pdf`;
      doc.save(fileName);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    }
  };

  // Save video to backend
  const handleSaveVideo = async () => {
    if (!transcript || transcript.length === 0) {
      setError('è¯·å…ˆè·å–å­—å¹•');
      return;
    }

    const videoId = currentVideoId ?? extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('æ— æ•ˆçš„YouTube URL');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const hasTranslations = transcript.some(
        (segment) => typeof segment.translation === 'string' && segment.translation
      );
      const translationText = hasTranslations
        ? transcript
            .map((segment) => segment.translation ?? '')
            .join('\n')
        : undefined;

      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/youtube-videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId,
            title: videoTitle || 'YouTube è§†é¢‘',
            url:
              youtubeUrl ||
              `https://www.youtube.com/watch?v=${videoId}`,
            transcript: transcript.map((segment) => ({
              text: segment.text,
              start: segment.start,
              duration: segment.duration,
              translation: segment.translation,
            })),
            translatedText: translationText,
            aiReport: report || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
      }

      const savedVideo = await response.json();

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      const savedId = savedVideo?.id ?? selectedSavedVideoId;
      if (savedId) {
        setSelectedSavedVideoId(savedId);
        router.replace(`/youtube?saved=${savedId}`, { scroll: false });
      }

      void loadSavedVideos();
    } catch (err: any) {
      console.error('Save video error:', err);
      setError(err.message || '¼ÓÔØ±£´æµÄÊÓÆµÊ§°Ü£¬ÇëÖØÊÔ');
    } finally {
      setSaving(false);
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
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-8 text-2xl font-bold text-gray-900">
            YouTube å­—å¹•æå–
          </h1>
          {/* Input Section */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4">
              <label
                htmlFor="youtube-url"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                YouTube è§†é¢‘ URL
              </label>
              <div className="flex gap-3">
                <input
                  id="youtube-url"
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleFetchTranscript();
                    }
                  }}
                />
                <button
                  onClick={handleFetchTranscript}
                  disabled={loading || !youtubeUrl.trim()}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? 'è·å–ä¸?..' : 'è·å–å­—å¹•'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                æ”¯æŒæ ¼å¼ï¼šhttps://www.youtube.com/watch?v=VIDEO_ID æˆ?
                https://youtu.be/VIDEO_ID
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>

          {/* Player & Saved Videos */}
          <div className="mb-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">è§†é¢‘æ’­æ”¾</h2>
                {currentVideoId && (
                  <span className="text-xs text-gray-500">
                    å½“å‰è¿›åº¦ {formatTime(currentTime)}
                  </span>
                )}
              </div>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <div ref={playerContainerRef} className="h-full w-full" />
                {!currentVideoId && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                    è¾“å…¥è§†é¢‘ URL å¹¶è·å–å­—å¹•åå³å¯åœ¨æ­¤æ’­æ”¾
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">å·²ä¿å­˜çš„è§†é¢‘</h2>
                <button
                  onClick={() => void loadSavedVideos()}
                  disabled={savedVideosLoading}
                  className="text-xs text-blue-600 transition-colors hover:text-blue-700 disabled:text-gray-400"
                >
                  {savedVideosLoading ? 'åˆ·æ–°ä¸?..' : 'åˆ·æ–°åˆ—è¡¨'}
                </button>
              </div>
              {savedVideosLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : savedVideos.length === 0 ? (
                <p className="text-sm text-gray-500">
                  æš‚æ— ä¿å­˜çš„è§†é¢‘ï¼Œè§£æå®Œæˆåç‚¹å‡»â€œä¿å­˜è§†é¢‘â€å³å¯æ”¶è—ã€?
                </p>
              ) : (
                <div className="space-y-2">
                  {savedVideos.map((video) => {
                    const isActive = selectedSavedVideoId === video.id;
                    const createdAtLabel = video.createdAt
                      ? new Date(video.createdAt).toLocaleDateString('zh-CN')
                      : '';

                    return (
                      <button
                        key={video.id}
                        onClick={() => handleSelectSavedVideo(video.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        disabled={loadingSavedVideo && isActive}
                      >
                        <div className="flex items-center justify-between">
                          <span className="line-clamp-2 font-medium">
                            {video.title}
                          </span>
                          <span className="ml-3 text-xs text-gray-400">
                            {createdAtLabel}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                          <span>è§†é¢‘IDï¼š{video.videoId || 'æœªçŸ¥'}</span>
                          {loadingSavedVideo && isActive && (
                            <span className="text-blue-600">¼ÓÔØÖĞ...</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  {videoTitle}
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={handleTranslate}
                    disabled={translating}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
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
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    {translating ? 'ç¿»è¯‘ä¸?..' : 'ç¿»è¯‘æˆä¸­æ–?}
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generating}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {generating ? 'ç”Ÿæˆä¸?..' : 'ç”ŸæˆæŠ¥å‘Š'}
                  </button>
                  <button
                    onClick={handleSaveVideo}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors disabled:cursor-not-allowed ${
                      saved
                        ? 'bg-gray-500'
                        : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {saved ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      )}
                    </svg>
                    {saving ? 'ä¿å­˜ä¸?..' : saved ? 'å·²ä¿å­? : 'ä¿å­˜è§†é¢‘'}
                  </button>
                </div>
              </div>

                        {/* Bilingual Transcript (Original + Translation) */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                {hasTranslationsAvailable ? 'åŒè¯­å­—å¹•ï¼ˆä¸­è‹±å¯¹ç…§ï¼‰' : 'åŸæ–‡å­—å¹•'}
              </h3>
              {hasTranslationsAvailable && (
                <button
                  onClick={handleExportBilingualPDF}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  å¯¼å‡ºåŒè¯­PDF
                </button>
              )}
            </div>
            <div
              id="bilingual-transcript"
              className="max-h-96 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-4"
            >
              {transcript.map((segment, index) => {
                const translationText =
                  segment.translation ??
                  (translatedTranscript
                    ? translatedTranscript[index]?.text
                    : '');
                const hasTranslation =
                  typeof translationText === 'string' &&
                  translationText.trim().length > 0;
                const isActive = index === activeSegmentIndex;

                return (
                  <div
                    key={`${segment.start}-${index}`}
                    ref={isActive ? activeSegmentRef : null}
                    onClick={() => handleSegmentSeek(segment.start)}
                    className={`cursor-pointer rounded-lg border border-transparent p-3 transition-colors ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 shadow-inner'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 min-w-[60px] font-mono text-gray-400">
                        {formatTime(segment.start)}
                      </span>
                      <p className="flex-1 font-medium text-gray-900">
                        {segment.text}
                      </p>
                    </div>
                    {hasTranslation && (
                      <div className="mt-2 pl-[60px] text-sm text-purple-700">
                        {translationText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            æ€»è®¡ {transcript.length} æ¡å­—å¹•ç‰‡æ®?
          </p>
        </div>
      )}
      {/* Report Display */}
      {report && (
        <div
          id="youtube-report"
          className="rounded-lg bg-white p-6 shadow-sm"
        >
          <div className="mb-6">
            <div className="mb-4">
              <div className="mb-3 flex items-start justify-between gap-4">
                    <h2 className="flex-1 text-2xl font-bold text-gray-900">
                      YouTube è§†é¢‘åˆ†ææŠ¥å‘Š
                    </h2>
                    <button
                      onClick={handleExportPDFNew}
                      className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                    >
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      å¯¼å‡ºPDF
                    </button>
                  </div>
                  <div className="mb-3 text-sm text-gray-600">
                    è§†é¢‘æ ‡é¢˜: {videoTitle}
                  </div>
                </div>
                <div className="rounded border-l-4 border-blue-500 bg-blue-50 p-4">
                  <p className="text-gray-700">{report.summary}</p>
                </div>
              </div>

              <div className="space-y-6">
                {report.sections.map((section, index) => (
                  <div
                    key={index}
                    className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0"
                  >
                    <h3 className="mb-3 text-xl font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <div className="prose max-w-none">
                      <div
                        className="whitespace-pre-wrap text-gray-700"
                        dangerouslySetInnerHTML={{
                          __html: section.content.replace(/\n/g, '<br/>'),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {(loading || generating || translating) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="flex items-center gap-4 rounded-lg bg-white p-6">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="text-gray-700">
                  {loading && 'æ­£åœ¨è·å–å­—å¹•...'}
                  {generating && 'æ­£åœ¨ç”ŸæˆæŠ¥å‘Š...'}
                  {translating && 'æ­£åœ¨ç¿»è¯‘å­—å¹•...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}









