import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
} from "@nestjs/common";
import { YoutubeVideosService } from "./youtube-videos.service";
import { SaveVideoDto } from "./dto/save-video.dto";
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * YouTube视频管理控制器
 */
@Controller("youtube-videos")
// @UseGuards(JwtAuthGuard) // TODO: Enable when auth is ready
export class YoutubeVideosController {
  constructor(private readonly youtubeVideosService: YoutubeVideosService) {}

  @Post()
  async saveVideo(@Request() req: any, @Body() saveVideoDto: SaveVideoDto) {
    // TODO: Get userId from JWT token
    const userId = req.user?.userId || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.youtubeVideosService.saveVideo(userId, saveVideoDto);
  }

  @Get()
  async getUserVideos(@Request() req: any) {
    // TODO: Get userId from JWT token
    const userId = req.user?.userId || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.youtubeVideosService.getUserVideos(userId);
  }

  @Get(":id")
  async getVideoById(@Param("id") id: string, @Request() req: any) {
    // TODO: Get userId from JWT token
    const userId = req.user?.userId || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.youtubeVideosService.getVideoById(id, userId);
  }

  @Delete(":id")
  async deleteVideo(@Param("id") id: string, @Request() req: any) {
    // TODO: Get userId from JWT token
    const userId = req.user?.userId || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.youtubeVideosService.deleteVideo(id, userId);
  }
}
