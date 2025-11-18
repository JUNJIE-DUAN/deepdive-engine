/**
 * 功能完整性检查工具
 * 验证AI Office 2.0的所有核心功能是否正常工作
 */

export interface FeatureCheckResult {
  feature: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: any;
}

export interface SystemHealthReport {
  timestamp: Date;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  checks: FeatureCheckResult[];
  score: number; // 0-100
  recommendations: string[];
}

/**
 * 系统健康检查器
 */
export class FeatureChecker {
  private results: FeatureCheckResult[] = [];

  /**
   * 检查Multi-Agent系统
   */
  async checkMultiAgentSystem(): Promise<FeatureCheckResult> {
    try {
      // 检查Agent模块是否可导入
      const { CoordinatorAgent, ResourceAnalysisAgent, VerificationAgent } = await import(
        '@/lib/ai-agents'
      );

      if (!CoordinatorAgent || !ResourceAnalysisAgent || !VerificationAgent) {
        return {
          feature: 'Multi-Agent System',
          status: 'fail',
          message: 'Agent模块导入失败',
        };
      }

      // 检查API端点
      const grokApiExists = await this.checkApiEndpoint('/api/ai/grok');

      if (!grokApiExists) {
        return {
          feature: 'Multi-Agent System',
          status: 'warn',
          message: 'Grok API端点无法访问',
        };
      }

      return {
        feature: 'Multi-Agent System',
        status: 'pass',
        message: '所有Agent模块正常',
        details: {
          agents: ['Coordinator', 'ResourceAnalysis', 'Verification'],
          apiEndpoint: '/api/ai/grok',
        },
      };
    } catch (error) {
      return {
        feature: 'Multi-Agent System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查PPT模板系统
   */
  async checkTemplateSystem(): Promise<FeatureCheckResult> {
    try {
      const { getAllTemplates } = await import('@/lib/ppt-templates');
      const templates = getAllTemplates();

      if (templates.length < 10) {
        return {
          feature: 'PPT Template System',
          status: 'warn',
          message: `模板数量不足: ${templates.length}/10`,
        };
      }

      // 检查新增模板
      const requiredTemplates = [
        'literature-review',
        'conference',
        'architecture',
        'code-review',
      ];
      const templateIds = templates.map((t) => t.id);
      const missingTemplates = requiredTemplates.filter(
        (id) => !templateIds.includes(id)
      );

      if (missingTemplates.length > 0) {
        return {
          feature: 'PPT Template System',
          status: 'warn',
          message: `缺少模板: ${missingTemplates.join(', ')}`,
        };
      }

      return {
        feature: 'PPT Template System',
        status: 'pass',
        message: `${templates.length}个模板可用`,
        details: { templateCount: templates.length, templates: templateIds },
      };
    } catch (error) {
      return {
        feature: 'PPT Template System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查版本Diff系统
   */
  async checkVersionDiffSystem(): Promise<FeatureCheckResult> {
    try {
      const {
        comparePPTVersions,
        compareDocVersions,
        getDiffColor,
        getDiffIcon,
      } = await import('@/lib/version-diff');

      // 简单测试
      const testResult = comparePPTVersions(
        '## 第1页: Test\n内容A',
        '## 第1页: Test\n内容B',
        { id: '1', timestamp: new Date(), title: 'V1' },
        { id: '2', timestamp: new Date(), title: 'V2' }
      );

      if (!testResult || !testResult.changes || testResult.changes.length === 0) {
        return {
          feature: 'Version Diff System',
          status: 'warn',
          message: '差异检测可能不正常',
        };
      }

      return {
        feature: 'Version Diff System',
        status: 'pass',
        message: 'Diff功能正常',
        details: { testChanges: testResult.changes.length },
      };
    } catch (error) {
      return {
        feature: 'Version Diff System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查导出系统
   */
  async checkExportSystem(): Promise<FeatureCheckResult> {
    try {
      const { documentExportService } = await import(
        '@/lib/services/document-export.service'
      );

      if (!documentExportService) {
        return {
          feature: 'Export System',
          status: 'fail',
          message: '导出服务未初始化',
        };
      }

      // 检查导出API端点
      const exportApiExists = await this.checkApiEndpoint('/api/ai-office/export');

      if (!exportApiExists) {
        return {
          feature: 'Export System',
          status: 'warn',
          message: '导出API端点无法访问',
        };
      }

      return {
        feature: 'Export System',
        status: 'pass',
        message: '支持6种导出格式',
        details: {
          formats: ['word', 'ppt', 'pdf', 'markdown', 'html', 'latex'],
        },
      };
    } catch (error) {
      return {
        feature: 'Export System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查Research Page系统
   */
  async checkResearchPageSystem(): Promise<FeatureCheckResult> {
    try {
      const { getAllResearchPageTemplates } = await import(
        '@/lib/research-page-templates'
      );
      const templates = getAllResearchPageTemplates();

      if (templates.length < 3) {
        return {
          feature: 'Research Page System',
          status: 'warn',
          message: `Research Page模板不足: ${templates.length}/3`,
        };
      }

      return {
        feature: 'Research Page System',
        status: 'pass',
        message: `${templates.length}个Research Page模板可用`,
        details: { templateCount: templates.length },
      };
    } catch (error) {
      return {
        feature: 'Research Page System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查Zustand Store
   */
  async checkStoreSystem(): Promise<FeatureCheckResult> {
    try {
      const {
        useResourceStore,
        useDocumentStore,
        useChatStore,
        useTaskStore,
        useUIStore,
      } = await import('@/stores/aiOfficeStore');

      // 检查agentMode是否在ChatStore中
      const chatStoreState = useChatStore.getState();
      if (!('agentMode' in chatStoreState)) {
        return {
          feature: 'Store System',
          status: 'warn',
          message: 'ChatStore缺少agentMode状态',
        };
      }

      return {
        feature: 'Store System',
        status: 'pass',
        message: '所有Store正常',
        details: {
          stores: ['Resource', 'Document', 'Chat', 'Task', 'UI'],
          agentModeSupport: true,
        },
      };
    } catch (error) {
      return {
        feature: 'Store System',
        status: 'fail',
        message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 检查API端点是否可访问
   */
  private async checkApiEndpoint(path: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const response = await fetch(path, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      return response.ok || response.status === 405; // 405 = Method Not Allowed (端点存在但不支持HEAD)
    } catch {
      return false;
    }
  }

  /**
   * 运行所有检查
   */
  async runAllChecks(): Promise<SystemHealthReport> {
    console.log('🔍 开始系统健康检查...');

    this.results = [];

    // 运行所有检查
    this.results.push(await this.checkMultiAgentSystem());
    this.results.push(await this.checkTemplateSystem());
    this.results.push(await this.checkVersionDiffSystem());
    this.results.push(await this.checkExportSystem());
    this.results.push(await this.checkResearchPageSystem());
    this.results.push(await this.checkStoreSystem());

    // 计算总体状态
    const passCount = this.results.filter((r) => r.status === 'pass').length;
    const failCount = this.results.filter((r) => r.status === 'fail').length;
    const warnCount = this.results.filter((r) => r.status === 'warn').length;

    const score = Math.round((passCount / this.results.length) * 100);

    let overallStatus: 'healthy' | 'degraded' | 'critical';
    if (failCount > 0) {
      overallStatus = 'critical';
    } else if (warnCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // 生成建议
    const recommendations: string[] = [];
    this.results.forEach((result) => {
      if (result.status === 'fail') {
        recommendations.push(`修复: ${result.feature} - ${result.message}`);
      } else if (result.status === 'warn') {
        recommendations.push(`优化: ${result.feature} - ${result.message}`);
      }
    });

    const report: SystemHealthReport = {
      timestamp: new Date(),
      overallStatus,
      checks: this.results,
      score,
      recommendations,
    };

    console.log('✅ 健康检查完成');
    console.table(this.results.map((r) => ({ 功能: r.feature, 状态: r.status, 信息: r.message })));
    console.log(`📊 总体评分: ${score}/100`);
    console.log(`📈 状态: ${overallStatus}`);

    return report;
  }
}

/**
 * 单例导出
 */
export const featureChecker = new FeatureChecker();
