import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "../services/dashboard.service";
import { AuthGuard } from "@nestjs/passport";

@Controller("data-management/dashboard")
@UseGuards(AuthGuard("jwt"))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  async getSummary() {
    return this.dashboardService.getDashboardSummary();
  }

  @Get("recent-tasks")
  async getRecentTasks() {
    return this.dashboardService.getRecentTasks();
  }
}
