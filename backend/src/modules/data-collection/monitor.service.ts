import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface TaskMonitor {
  id: string;
  name: string;
  sourceName: string;
  status: string;
  progress: number;
  currentStep: string;
  collected: number;
  duplicates: number;
  failed: number;
  startedAt: Date | null;
  elapsedTime: number; // 秒
  estimatedTimeLeft: number; // 秒
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  activeTasks: number;
  queuedTasks: number;
  collectionsPerMinute: number;
  errorRate: number;
}

@Injectable()
export class MonitorService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有运行中的任务
   */
  async getRunningTasks(): Promise<TaskMonitor[]> {
    const tasks = await this.prisma.collectionTask.findMany({
      where: {
        status: "RUNNING",
      },
      include: {
        source: true,
      },
      orderBy: { startedAt: "desc" },
    });

    return tasks.map((task) => {
      const elapsedTime = task.startedAt
        ? Math.floor((Date.now() - task.startedAt.getTime()) / 1000)
        : 0;

      const estimatedTimeLeft =
        task.progress > 0
          ? Math.floor((elapsedTime / task.progress) * (100 - task.progress))
          : 0;

      return {
        id: task.id,
        name: task.name,
        sourceName: task.source.name,
        status: task.status,
        progress: task.progress,
        currentStep: task.currentStep || "Processing",
        collected: task.successItems,
        duplicates: task.duplicateItems,
        failed: task.failedItems,
        startedAt: task.startedAt,
        elapsedTime,
        estimatedTimeLeft,
      };
    });
  }

  /**
   * 获取系统指标
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const tasks = await this.prisma.collectionTask.findMany();

    const activeTasks = tasks.filter((t) => t.status === "RUNNING").length;
    const queuedTasks = tasks.filter((t) => t.status === "PENDING").length;

    // 计算最近1分钟的采集速率
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentTasks = tasks.filter(
      (t) => t.completedAt && t.completedAt >= oneMinuteAgo,
    );
    const collectionsPerMinute = recentTasks.reduce(
      (sum, t) => sum + t.successItems,
      0,
    );

    // 计算错误率
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED");
    const failedTasks = tasks.filter((t) => t.status === "FAILED");
    const errorRate =
      completedTasks.length + failedTasks.length > 0
        ? (failedTasks.length / (completedTasks.length + failedTasks.length)) *
          100
        : 0;

    return {
      cpu: Math.random() * 100, // 模拟数据，实际需要从系统获取
      memory: Math.random() * 100,
      activeTasks,
      queuedTasks,
      collectionsPerMinute,
      errorRate,
    };
  }

  /**
   * 获取任务详细监控数据
   */
  async getTaskDetail(taskId: string): Promise<any> {
    const task = await this.prisma.collectionTask.findUnique({
      where: { id: taskId },
      include: {
        source: true,
        resources: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
        deduplicationRecords: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      return null;
    }

    const elapsedTime = task.startedAt
      ? Math.floor((Date.now() - task.startedAt.getTime()) / 1000)
      : 0;

    return {
      ...task,
      elapsedTime,
      throughput: elapsedTime > 0 ? task.processedItems / elapsedTime : 0,
    };
  }

  /**
   * 获取实时日志（最近100条）
   */
  async getRecentLogs(taskId?: string): Promise<any[]> {
    // TODO: 实现真实的日志系统
    // 这里返回模拟数据
    const logs = [
      {
        timestamp: new Date(),
        level: "INFO",
        taskId: taskId || "all",
        message: "Task started successfully",
      },
      {
        timestamp: new Date(Date.now() - 5000),
        level: "INFO",
        message: "Fetching data from source",
      },
      {
        timestamp: new Date(Date.now() - 10000),
        level: "WARN",
        message: "Duplicate detected, skipping item",
      },
    ];

    return logs;
  }

  /**
   * 获取性能图表数据
   */
  async getPerformanceMetrics(hours: number = 1): Promise<any[]> {
    const startTime = new Date(Date.now() - hours * 3600000);

    const tasks = await this.prisma.collectionTask.findMany({
      where: {
        startedAt: {
          gte: startTime,
        },
      },
      orderBy: { startedAt: "asc" },
    });

    // 按5分钟间隔分组
    const interval = 5 * 60 * 1000; // 5分钟
    const metrics: Record<string, any> = {};

    tasks.forEach((task) => {
      if (!task.startedAt) return;

      const timeKey =
        Math.floor(task.startedAt.getTime() / interval) * interval;
      const timestamp = new Date(timeKey);

      if (!metrics[timeKey]) {
        metrics[timeKey] = {
          timestamp,
          collected: 0,
          duplicates: 0,
          errors: 0,
          activeTasks: 0,
        };
      }

      metrics[timeKey].collected += task.successItems;
      metrics[timeKey].duplicates += task.duplicateItems;
      metrics[timeKey].errors += task.failedItems;

      if (task.status === "RUNNING") {
        metrics[timeKey].activeTasks += 1;
      }
    });

    return Object.values(metrics).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
  }
}
