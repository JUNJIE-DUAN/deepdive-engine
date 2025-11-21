import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Response,
  Logger,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";

/**
 * 认证控制器
 */
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * 用户注册
   * POST /api/v1/auth/register
   */
  @Post("register")
  async register(
    @Body("email") email: string,
    @Body("username") username: string,
    @Body("password") password: string,
  ) {
    this.logger.log(`Registration attempt: ${email}`);
    return this.authService.register(email, username, password);
  }

  /**
   * 用户登录
   * POST /api/v1/auth/login
   */
  @Post("login")
  async login(
    @Body("email") email: string,
    @Body("password") password: string,
  ) {
    this.logger.log(`Login attempt: ${email}`);
    return this.authService.login(email, password);
  }

  /**
   * 刷新 token
   * POST /api/v1/auth/refresh
   */
  @Post("refresh")
  @UseGuards(AuthGuard("jwt"))
  async refresh(@Request() req: { user: { id: string } }) {
    return this.authService.refreshToken(req.user.id);
  }

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/me
   */
  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  getProfile(@Request() req: { user: unknown }) {
    return req.user;
  }

  /**
   * Google OAuth 登录
   * GET /api/v1/auth/google
   */
  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Guard redirects to Google
  }

  /**
   * Google OAuth 回调
   * GET /api/v1/auth/google/callback
   */
  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthCallback(@Request() req: any, @Response() res: any) {
    // 成功认证后，返回用户信息和tokens
    const { user, accessToken, refreshToken } = req.user;

    this.logger.log(`Google OAuth callback for user: ${user.email}`);

    // 重定向到前端，携带token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/auth/callback?token=${accessToken}&refreshToken=${refreshToken}`;

    return res.redirect(redirectUrl);
  }
}
