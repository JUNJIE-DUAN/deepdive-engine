import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { MongoDBService } from "../../../common/mongodb/mongodb.service.postgres";

export interface IntegrityReport {
  timestamp: Date;
  postgresql: {
    totalPapers: number;
    papersWithRawDataId: number;
    papersWithoutRawDataId: number;
    completenessPercentage: number;
  };
  mongodb: {
    totalRawData: number;
    rawDataWithResourceId: number;
    rawDataWithoutResourceId: number;
  };
  validReferences: number;
  brokenReferences: number;
  orphanedRawData: number;
  status: "healthy" | "warning" | "critical";
  recommendations: string[];
}

/**
 * 数据完整性验证服务
 * 验证PostgreSQL和MongoDB之间的双向引用完整性
 */
@Injectable()
export class DataIntegrityValidatorService {
  private readonly logger = new Logger(DataIntegrityValidatorService.name);

  constructor(
    private prisma: PrismaService,
    private mongodb: MongoDBService,
  ) {}

  /**
   * 验证所有双向引用完整性
   */
  async validateAll(): Promise<IntegrityReport> {
    const startTime = Date.now();

    try {
      // 1. 收集PostgreSQL数据
      const pgStats = await this.validatePostgresql();

      // 2. 收集MongoDB数据
      const mongoStats = await this.validateMongoDB();

      // 3. 验证双向引用
      const referenceStats = await this.validateBidirectionalReferences();

      // 4. 判断状态
      const status = this.determineStatus(pgStats, mongoStats, referenceStats);

      // 5. 生成建议
      const recommendations = this.generateRecommendations(
        pgStats,
        mongoStats,
        referenceStats,
      );

      const report: IntegrityReport = {
        timestamp: new Date(),
        postgresql: pgStats,
        mongodb: mongoStats,
        ...referenceStats,
        status,
        recommendations,
      };

      const executionTime = Date.now() - startTime;
      this.logger.log(
        `✅ 完整性验证完成 (耗时: ${executionTime}ms, 状态: ${status})`,
      );

      return report;
    } catch (error) {
      this.logger.error(
        `❌ 完整性验证失败: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  }

  /**
   * 验证PostgreSQL中的数据
   */
  private async validatePostgresql() {
    const totalPapers = await this.prisma.resource.count({
      where: { type: "PAPER" },
    });

    const papersWithRawDataId = await this.prisma.resource.count({
      where: {
        type: "PAPER",
        rawDataId: { not: null },
      },
    });

    const papersWithoutRawDataId = totalPapers - papersWithRawDataId;
    const completenessPercentage =
      totalPapers > 0 ? (papersWithRawDataId / totalPapers) * 100 : 100;

    return {
      totalPapers,
      papersWithRawDataId,
      papersWithoutRawDataId,
      completenessPercentage: Math.round(completenessPercentage * 100) / 100,
    };
  }

  /**
   * 验证MongoDB中的数据
   */
  private async validateMongoDB() {
    const rawDataCollection = this.mongodb.getRawDataCollection();

    const totalRawData = await rawDataCollection.countDocuments({});
    const rawDataWithResourceId = await rawDataCollection.countDocuments({
      resourceId: { $ne: null },
    });

    const rawDataWithoutResourceId = totalRawData - rawDataWithResourceId;

    return {
      totalRawData,
      rawDataWithResourceId,
      rawDataWithoutResourceId,
    };
  }

  /**
   * 验证双向引用完整性
   */
  private async validateBidirectionalReferences() {
    const rawDataCollection = this.mongodb.getRawDataCollection();

    // 获取所有有rawDataId的Resource
    const resourcesWithRawDataId = await this.prisma.resource.findMany({
      where: {
        rawDataId: { not: null },
      },
      select: {
        id: true,
        rawDataId: true,
      },
    });

    let validReferences = 0;
    let brokenReferences = 0;

    // 验证每个引用
    for (const resource of resourcesWithRawDataId) {
      if (!resource.rawDataId) continue;

      try {
        const { ObjectId } = require("mongodb");
        const rawData = await rawDataCollection.findOne({
          _id: new ObjectId(resource.rawDataId),
        });

        if (!rawData) {
          brokenReferences++;
        } else if (rawData.resourceId !== resource.id) {
          // 不一致但可修复
          brokenReferences++;
        } else {
          validReferences++;
        }
      } catch (error) {
        brokenReferences++;
      }
    }

    // 检查孤立的MongoDB数据
    const orphanedRawDataDocs = await rawDataCollection
      .find({ resourceId: { $ne: null } })
      .toArray();

    let orphanedRawData = 0;
    for (const rawData of orphanedRawDataDocs) {
      const resource = await this.prisma.resource.findUnique({
        where: { id: rawData.resourceId },
      });

      if (!resource) {
        orphanedRawData++;
      }
    }

    return {
      validReferences,
      brokenReferences,
      orphanedRawData,
    };
  }

  /**
   * 判断系统状态
   */
  private determineStatus(
    pgStats: any,
    mongoStats: any,
    referenceStats: any,
  ): "healthy" | "warning" | "critical" {
    // 健康检查条件
    const isPgHealthy = pgStats.completenessPercentage === 100;
    const isMongoHealthy = mongoStats.rawDataWithoutResourceId === 0;
    const isReferencesHealthy =
      referenceStats.brokenReferences === 0 &&
      referenceStats.orphanedRawData === 0;

    if (isPgHealthy && isMongoHealthy && isReferencesHealthy) {
      return "healthy";
    } else if (
      pgStats.completenessPercentage >= 90 &&
      referenceStats.brokenReferences < 5
    ) {
      return "warning";
    } else {
      return "critical";
    }
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(
    pgStats: any,
    mongoStats: any,
    referenceStats: any,
  ): string[] {
    const recommendations: string[] = [];

    if (pgStats.papersWithoutRawDataId > 0) {
      recommendations.push(
        `⚠️ 有 ${pgStats.papersWithoutRawDataId} 篇论文缺少MongoDB原始数据，建议运行数据修复脚本: npx ts-node src/scripts/repair-paper-raw-data.ts`,
      );
    }

    if (mongoStats.rawDataWithoutResourceId > 0) {
      recommendations.push(
        `⚠️ 有 ${mongoStats.rawDataWithoutResourceId} 条MongoDB原始数据缺少resourceId引用，建议进行数据清理`,
      );
    }

    if (referenceStats.brokenReferences > 0) {
      recommendations.push(
        `❌ 有 ${referenceStats.brokenReferences} 个断裂的双向引用，需要手动检查或修复`,
      );
    }

    if (referenceStats.orphanedRawData > 0) {
      recommendations.push(
        `⚠️ 有 ${referenceStats.orphanedRawData} 条孤立的MongoDB数据（对应Resource已删除），建议进行清理`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ 系统状态良好，所有双向引用都保持一致");
    }

    return recommendations;
  }

  /**
   * 获取详细的诊断报告
   */
  async getDiagnosticReport(): Promise<string> {
    const report = await this.validateAll();

    const lines: string[] = [
      "",
      "=".repeat(70),
      "数据完整性诊断报告",
      "=".repeat(70),
      "",
      `📊 生成时间: ${report.timestamp.toISOString()}`,
      `🔍 系统状态: ${this.getStatusEmoji(report.status)} ${report.status.toUpperCase()}`,
      "",
      "📈 PostgreSQL 数据统计:",
      `   总论文数: ${report.postgresql.totalPapers}`,
      `   有rawDataId: ${report.postgresql.papersWithRawDataId}`,
      `   缺少rawDataId: ${report.postgresql.papersWithoutRawDataId}`,
      `   完整性: ${report.postgresql.completenessPercentage}%`,
      "",
      "📦 MongoDB 数据统计:",
      `   总原始数据: ${report.mongodb.totalRawData}`,
      `   有resourceId: ${report.mongodb.rawDataWithResourceId}`,
      `   缺少resourceId: ${report.mongodb.rawDataWithoutResourceId}`,
      "",
      "🔗 双向引用验证:",
      `   有效引用: ${report.validReferences}`,
      `   断裂引用: ${report.brokenReferences}`,
      `   孤立数据: ${report.orphanedRawData}`,
      "",
      "📋 建议:",
    ];

    report.recommendations.forEach((rec) => {
      lines.push(`   ${rec}`);
    });

    lines.push("", "=".repeat(70), "");

    return lines.join("\n");
  }

  private getStatusEmoji(status: "healthy" | "warning" | "critical"): string {
    switch (status) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "critical":
        return "❌";
    }
  }
}
