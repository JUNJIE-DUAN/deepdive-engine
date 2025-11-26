import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  UnauthorizedException,
} from "@nestjs/common";
import { YoutubeVideosService } from "./youtube-videos.service";
import { SaveVideoDto } from "./dto/save-video.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

/**
 * YouTube视频管理控制器
 */
@Controller("youtube-videos")
@UseGuards(JwtAuthGuard)
export class YoutubeVideosController {
  constructor(private readonly youtubeVideosService: YoutubeVideosService) {}

  @Post()
  async saveVideo(@Request() req: any, @Body() saveVideoDto: SaveVideoDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    return this.youtubeVideosService.saveVideo(userId, saveVideoDto);
  }

  @Get()
  async getUserVideos(@Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    return this.youtubeVideosService.getUserVideos(userId);
  }

  @Get(":id")
  async getVideoById(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    return this.youtubeVideosService.getVideoById(id, userId);
  }

  @Delete(":id")
  async deleteVideo(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    return this.youtubeVideosService.deleteVideo(id, userId);
  }
}
