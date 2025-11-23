import { Injectable } from "@nestjs/common";
import { isWorkspaceAiV2Enabled } from "./common/utils/feature-flags";

@Injectable()
export class AppService {
  getHello(): any {
    return {
      message: "Welcome to DeepDive Engine API",
      version: "1.0.0",
      docs: "/api/v1",
      health: "/api/v1/health",
      workspaceAiV2Enabled: isWorkspaceAiV2Enabled(),
    };
  }
}
