import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { AuthService } from "../auth.service";

/**
 * Google OAuth 策略
 *
 * 配置说明：
 * 1. 在 Google Cloud Console 创建 OAuth 2.0 凭据
 * 2. 设置环境变量：
 *    - GOOGLE_CLIENT_ID: Google OAuth客户端ID
 *    - GOOGLE_CLIENT_SECRET: Google OAuth客户端密钥
 *    - GOOGLE_CALLBACK_URL: 回调URL (例如：http://localhost:8080/api/v1/auth/google/callback)
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ["email", "profile"],
    });

    this.logger.log("Google OAuth Strategy initialized");
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, displayName, emails, photos } = profile;

      if (!emails || emails.length === 0) {
        return done(new Error("No email found in Google profile"), undefined);
      }

      const email = emails[0].value;
      const picture = photos && photos.length > 0 ? photos[0].value : undefined;

      this.logger.log(`Google OAuth validation for: ${email}`);

      const userProfile = {
        id,
        email,
        displayName,
        picture,
      };

      const result = await this.authService.findOrCreateGoogleUser(userProfile);

      done(null, result);
    } catch (error) {
      this.logger.error(`Google OAuth validation failed: ${error}`);
      done(error as Error, undefined);
    }
  }
}
