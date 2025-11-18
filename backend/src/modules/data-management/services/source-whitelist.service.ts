import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";
import { ResourceType } from "@prisma/client";
import { getErrorMessage } from "../../../common/utils/error.utils";

interface CreateWhitelistDto {
  resourceType: ResourceType;
  allowedDomains: string[]; // 完整域名或通配符模式
  description?: string;
}

interface UpdateWhitelistDto {
  allowedDomains?: string[];
  description?: string;
  isActive?: boolean;
}

/**
 * Source Whitelist Service
 * 负责管理各资源类型允许的数据源白名单
 */
@Injectable()
export class SourceWhitelistService {
  private readonly logger = new Logger(SourceWhitelistService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 为资源类型创建白名单
   */
  async createWhitelist(dto: CreateWhitelistDto) {
    try {
      // 检查是否已存在
      const existing = await this.prisma.sourceWhitelist.findUnique({
        where: { resourceType: dto.resourceType },
      });

      if (existing) {
        this.logger.warn(
          `Whitelist for ${dto.resourceType} already exists, updating instead`,
        );
        return this.updateWhitelist(dto.resourceType, {
          allowedDomains: dto.allowedDomains,
          description: dto.description,
        });
      }

      const whitelist = await this.prisma.sourceWhitelist.create({
        data: {
          resourceType: dto.resourceType,
          allowedDomains: dto.allowedDomains,
          description: dto.description,
          isActive: true,
        },
      });

      this.logger.log(
        `Created whitelist for ${dto.resourceType} with ${dto.allowedDomains.length} domains`,
      );
      return whitelist;
    } catch (error) {
      this.logger.error(
        `Failed to create whitelist: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 获取特定资源类型的白名单
   */
  async getWhitelist(resourceType: ResourceType) {
    try {
      const whitelist = await this.prisma.sourceWhitelist.findUnique({
        where: { resourceType },
      });

      if (!whitelist) {
        this.logger.warn(`Whitelist not found for ${resourceType}`);
        return null;
      }

      return whitelist;
    } catch (error) {
      this.logger.error(`Failed to get whitelist: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  /**
   * 获取所有白名单
   */
  async getAllWhitelists() {
    try {
      const whitelists = await this.prisma.sourceWhitelist.findMany({
        orderBy: { createdAt: "asc" },
      });

      return whitelists;
    } catch (error) {
      this.logger.error(
        `Failed to get all whitelists: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 更新白名单
   */
  async updateWhitelist(resourceType: ResourceType, dto: UpdateWhitelistDto) {
    try {
      const whitelist = await this.prisma.sourceWhitelist.update({
        where: { resourceType },
        data: {
          ...(dto.allowedDomains && { allowedDomains: dto.allowedDomains }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Updated whitelist for ${resourceType}`);
      return whitelist;
    } catch (error) {
      this.logger.error(
        `Failed to update whitelist: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 删除白名单
   */
  async deleteWhitelist(resourceType: ResourceType) {
    try {
      await this.prisma.sourceWhitelist.delete({
        where: { resourceType },
      });

      this.logger.log(`Deleted whitelist for ${resourceType}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete whitelist: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 验证URL是否在白名单中
   * 支持完整域名和通配符模式 (e.g., *.ieee.org)
   */
  async validateUrl(
    resourceType: ResourceType,
    url: string,
  ): Promise<{
    isValid: boolean;
    matchedDomain?: string;
    reason?: string;
  }> {
    try {
      const whitelist = await this.getWhitelist(resourceType);

      if (!whitelist || !whitelist.isActive) {
        return {
          isValid: false,
          reason: `No active whitelist found for ${resourceType}`,
        };
      }

      // 从URL提取域名
      const domain = this.extractDomain(url);
      if (!domain) {
        return {
          isValid: false,
          reason: "Invalid URL format",
        };
      }

      // 检查域名是否在白名单中
      const allowedDomains = whitelist.allowedDomains as string[];
      const isMatched = this.isDomainAllowed(domain, allowedDomains);

      if (isMatched) {
        // 更新验证统计
        await this.prisma.sourceWhitelist.update({
          where: { resourceType },
          data: {
            totalValidated: { increment: 1 },
            lastValidatedAt: new Date(),
          },
        });

        return {
          isValid: true,
          matchedDomain: domain,
        };
      } else {
        // 更新被拒绝的统计
        await this.prisma.sourceWhitelist.update({
          where: { resourceType },
          data: {
            totalRejected: { increment: 1 },
            lastValidatedAt: new Date(),
          },
        });

        return {
          isValid: false,
          reason: `Domain ${domain} is not in the whitelist for ${resourceType}`,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to validate URL: ${getErrorMessage(error)}`);
      return {
        isValid: false,
        reason: `Validation error: ${getErrorMessage(error)}`,
      };
    }
  }

  /**
   * 批量验证URL
   */
  async validateUrls(
    resourceType: ResourceType,
    urls: string[],
  ): Promise<
    Array<{
      url: string;
      isValid: boolean;
      matchedDomain?: string;
      reason?: string;
    }>
  > {
    const results = [];

    for (const url of urls) {
      const result = await this.validateUrl(resourceType, url);
      results.push({
        url,
        ...result,
      });
    }

    return results;
  }

  /**
   * 添加允许的域名
   */
  async addAllowedDomain(resourceType: ResourceType, domain: string) {
    try {
      const whitelist = await this.getWhitelist(resourceType);

      if (!whitelist) {
        throw new Error(`Whitelist not found for ${resourceType}`);
      }

      const allowedDomains = (whitelist.allowedDomains as string[]) || [];

      // 检查是否已存在
      if (allowedDomains.includes(domain)) {
        this.logger.warn(
          `Domain ${domain} already exists in whitelist for ${resourceType}`,
        );
        return whitelist;
      }

      const updated = await this.prisma.sourceWhitelist.update({
        where: { resourceType },
        data: {
          allowedDomains: [...allowedDomains, domain],
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Added domain ${domain} to whitelist for ${resourceType}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to add allowed domain: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 移除允许的域名
   */
  async removeAllowedDomain(resourceType: ResourceType, domain: string) {
    try {
      const whitelist = await this.getWhitelist(resourceType);

      if (!whitelist) {
        throw new Error(`Whitelist not found for ${resourceType}`);
      }

      const allowedDomains = (whitelist.allowedDomains as string[]) || [];
      const filtered = allowedDomains.filter((d) => d !== domain);

      const updated = await this.prisma.sourceWhitelist.update({
        where: { resourceType },
        data: {
          allowedDomains: filtered,
          updatedAt: new Date(),
        },
      });

      this.logger.log(
        `Removed domain ${domain} from whitelist for ${resourceType}`,
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `Failed to remove allowed domain: ${getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * 从URL提取域名
   */
  private extractDomain(url: string): string | null {
    try {
      // 处理没有 scheme 的 URL
      let urlStr = url;
      if (!url.match(/^https?:\/\//i)) {
        urlStr = "https://" + url;
      }

      const urlObj = new URL(urlStr);
      return urlObj.hostname || null;
    } catch (error) {
      this.logger.warn(`Failed to extract domain from URL: ${url}`);
      return null;
    }
  }

  /**
   * 检查域名是否被允许
   * 支持通配符模式: *.ieee.org 会匹配 example.ieee.org
   */
  private isDomainAllowed(domain: string, allowedPatterns: string[]): boolean {
    for (const pattern of allowedPatterns) {
      if (this.matchDomain(domain, pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 匹配域名与模式
   * 支持通配符: * 匹配任意子域名
   */
  private matchDomain(domain: string, pattern: string): boolean {
    // 精确匹配
    if (domain === pattern) {
      return true;
    }

    // 通配符匹配 (*.example.com)
    if (pattern.startsWith("*.")) {
      const baseDomain = pattern.slice(2); // 移除 *.
      // 检查域名是否以 baseDomain 结尾且有一个子域名
      if (domain.endsWith("." + baseDomain)) {
        return true;
      }
    }

    // 正则表达式匹配 (如果需要的话)
    try {
      if (pattern.startsWith("/") && pattern.endsWith("/")) {
        const regexPattern = pattern.slice(1, -1);
        const regex = new RegExp(regexPattern);
        return regex.test(domain);
      }
    } catch (error) {
      // 忽略无效的正则表达式
    }

    return false;
  }

  /**
   * 初始化默认白名单
   * 这个方法可以在应用启动时调用，以创建基本的白名单
   */
  async initializeDefaultWhitelists() {
    try {
      const defaults: CreateWhitelistDto[] = [
        {
          resourceType: "PAPER" as ResourceType,
          allowedDomains: [
            "arxiv.org",
            "*.arxiv.org",
            "ieee.org",
            "*.ieee.org",
            "acm.org",
            "*.acm.org",
            "springer.com",
            "*.springer.com",
            "sciencedirect.com",
            "scholar.google.com",
            "researchgate.net",
          ],
          description: "Academic paper repositories and databases",
        },
        {
          resourceType: "PROJECT" as ResourceType,
          allowedDomains: [
            "github.com",
            "*.github.com",
            "gitlab.com",
            "*.gitlab.com",
            "bitbucket.org",
            "*.bitbucket.org",
            "gitee.com",
            "sourceforge.net",
          ],
          description: "Code repository platforms",
        },
        {
          resourceType: "NEWS" as ResourceType,
          allowedDomains: [
            "techcrunch.com",
            "theverge.com",
            "arstechnica.com",
            "wired.com",
            "engadget.com",
            "anandtech.com",
            "tomshardware.com",
            "cnbc.com",
            "reuters.com",
            "bbc.com",
            "theguardian.com",
          ],
          description: "Tech news and media outlets",
        },
        {
          resourceType: "YOUTUBE_VIDEO" as ResourceType,
          allowedDomains: [
            "youtube.com",
            "youtu.be",
            "www.youtube.com",
            "m.youtube.com",
          ],
          description: "YouTube video platform",
        },
        {
          resourceType: "RSS" as ResourceType,
          allowedDomains: ["*"], // RSS 可以来自任何地方
          description: "RSS feed sources (unrestricted)",
        },
        {
          resourceType: "REPORT" as ResourceType,
          allowedDomains: [
            "gartner.com",
            "forrester.com",
            "idc.com",
            "mckinsey.com",
            "bcg.com",
            "bain.com",
            "accenture.com",
            "deloitte.com",
            "*.gartner.com",
            "*.forrester.com",
          ],
          description: "Industry analysis and research reports",
        },
        {
          resourceType: "EVENT" as ResourceType,
          allowedDomains: [
            "eventbrite.com",
            "meetup.com",
            "conference.com",
            "nvidia.com",
            "intel.com",
            "amd.com",
            "*.nvidia.com",
            "*.intel.com",
          ],
          description: "Event and conference platforms",
        },
      ];

      for (const defaultWhitelist of defaults) {
        const existing = await this.prisma.sourceWhitelist.findUnique({
          where: { resourceType: defaultWhitelist.resourceType },
        });

        if (!existing) {
          await this.createWhitelist(defaultWhitelist);
          this.logger.log(
            `Initialized default whitelist for ${defaultWhitelist.resourceType}`,
          );
        }
      }

      this.logger.log("Default whitelists initialization completed");
    } catch (error) {
      this.logger.error(
        `Failed to initialize default whitelists: ${getErrorMessage(error)}`,
      );
      // 不要抛出错误，因为这可能在初始化时发生
    }
  }
}
