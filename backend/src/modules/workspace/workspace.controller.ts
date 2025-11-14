import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from "@nestjs/common";
import {
  CreateWorkspaceDto,
  CreateWorkspaceTaskDto,
  UpdateWorkspaceResourcesDto,
} from "./dto";
import { WorkspaceService } from "./workspace.service";
import { WorkspaceTaskService } from "./workspace-task.service";
import { ReportTemplateService } from "./report-template.service";

@Controller("workspaces")
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceTaskService: WorkspaceTaskService,
    private readonly reportTemplateService: ReportTemplateService,
  ) {}

  /**
   * 创建新的工作区
   */
  @Post()
  async createWorkspace(@Request() req: any, @Body() dto: CreateWorkspaceDto) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.workspaceService.createWorkspace(userId, dto);
  }

  /**
   * 获取报告模板列表
   */
  @Get("templates")
  async listTemplates(@Query("category") category?: string) {
    return this.reportTemplateService.listTemplates(category);
  }

  /**
   * 获取工作区详情
   */
  @Get(":id")
  async getWorkspace(@Param("id") id: string, @Request() req: any) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.workspaceService.getWorkspace(id, userId);
  }

  /**
   * 更新工作区资源
   */
  @Patch(":id")
  async updateWorkspaceResources(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: UpdateWorkspaceResourcesDto,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.workspaceService.updateWorkspaceResources(id, userId, dto);
  }

  /**
   * 创建工作区任务（AI 任务）
   */
  @Post(":id/tasks")
  async createWorkspaceTask(
    @Param("id") id: string,
    @Request() req: any,
    @Body() dto: CreateWorkspaceTaskDto,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.workspaceTaskService.createTask(userId, id, dto);
  }

  /**
   * 查询任务状态
   */
  @Get(":id/tasks/:taskId")
  async getWorkspaceTask(
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "557be1bd-62cb-4125-a028-5ba740b66aca";
    return this.workspaceTaskService.getTask(userId, id, taskId);
  }
}
