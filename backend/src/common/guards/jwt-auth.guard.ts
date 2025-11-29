import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

/**
 * JWT认证守卫
 *
 * 用于保护需要认证的路由
 * 自动从请求头中提取JWT token并验证
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 调用父类的canActivate，会触发JwtStrategy的validate方法
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any) {
    // 如果有错误或没有用户，抛出未授权异常
    if (err || !user) {
      throw err || new UnauthorizedException("Please sign in to continue");
    }
    return user;
  }
}
