import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { YoutubeService } from "./youtube.service";

@Controller("youtube")
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  @Get("transcript/:videoId")
  async getTranscript(@Param("videoId") videoId: string) {
    this.logger.log(`Received request for video transcript: ${videoId}`);

    if (!videoId || videoId.trim().length === 0) {
      throw new BadRequestException("Video ID is required");
    }

    const cleanVideoId = videoId.trim();
    return await this.youtubeService.getTranscript(cleanVideoId);
  }
}
