import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Innertube } from 'youtubei.js';

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResponse {
  videoId: string;
  title: string;
  transcript: TranscriptSegment[];
}

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private youtube: Innertube | null = null;

  async onModuleInit() {
    try {
      this.youtube = await Innertube.create();
      this.logger.log('YouTube client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize YouTube client:', error);
    }
  }

  /**
   * Fetch YouTube video transcript
   * @param videoId YouTube video ID
   * @returns Transcript data
   */
  async getTranscript(videoId: string): Promise<TranscriptResponse> {
    try {
      this.logger.log(`Fetching transcript for video: ${videoId}`);

      if (!this.youtube) {
        this.youtube = await Innertube.create();
      }

      // Get video info
      const info = await this.youtube.getInfo(videoId);

      if (!info) {
        throw new NotFoundException('Video not found');
      }

      const title = info.basic_info.title ?? `YouTube Video ${videoId}`;

      // Get transcript
      const transcriptData = await info.getTranscript();

      if (!transcriptData || !transcriptData.transcript) {
        throw new NotFoundException(
          'Transcript not available for this video. The video may not have captions enabled.',
        );
      }

      // Transform transcript data
      if (!transcriptData.transcript.content || !transcriptData.transcript.content.body) {
        throw new NotFoundException('Invalid transcript data structure');
      }

      const transcript: TranscriptSegment[] = transcriptData.transcript.content.body.initial_segments.map((segment: {
        snippet: { text: string };
        start_ms: number;
        end_ms: number;
      }) => ({
        text: segment.snippet.text,
        start: segment.start_ms / 1000, // Convert milliseconds to seconds
        duration: segment.end_ms / 1000 - segment.start_ms / 1000,
      }));

      if (transcript.length === 0) {
        throw new NotFoundException('No transcript segments found for this video');
      }

      this.logger.log(`Successfully fetched ${transcript.length} transcript segments for "${title}"`);

      return {
        videoId,
        title,
        transcript,
      };
    } catch (error: unknown) {
      this.logger.error(`Failed to fetch transcript for ${videoId}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('not found')) {
        throw new NotFoundException('Video not found or transcript not available');
      }

      if (errorMessage.includes('Invalid')) {
        throw new BadRequestException('Invalid YouTube video ID');
      }

      throw new BadRequestException(
        `Failed to fetch transcript: ${errorMessage}`,
      );
    }
  }

  /**
   * Extract video ID from various YouTube URL formats
   * @param url YouTube URL
   * @returns Video ID
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }
}
