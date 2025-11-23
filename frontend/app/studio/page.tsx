'use client';

import { TrendingUp, Network, FileText, BarChart3 } from 'lucide-react';

export default function InsightsPage() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        {/* Feature Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trends Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-4 top-4 rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Trends</h3>
            <p className="mt-2 text-sm text-gray-600">
              热门话题追踪、新兴技术雷达、作者影响力分析
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                Coming Soon
              </span>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                <span>热门话题排行榜</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                <span>技术趋势预测</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                <span>影响力作者分析</span>
              </div>
            </div>
          </div>

          {/* Network Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-4 top-4 rounded-full bg-blue-100 p-3">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Network</h3>
            <p className="mt-2 text-sm text-gray-600">
              概念关系网络、引用图谱、作者协作分析
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Coming Soon
              </span>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                <span>概念关系图谱</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                <span>论文引用网络</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                <span>作者协作网络</span>
              </div>
            </div>
          </div>

          {/* Reports Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-4 top-4 rounded-full bg-emerald-100 p-3">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Reports</h3>
            <p className="mt-2 text-sm text-gray-600">
              个人阅读报告、知识覆盖度、学习路径建议
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Coming Soon
              </span>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                <span>个人阅读统计</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                <span>知识领域分析</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                <span>学习路径推荐</span>
              </div>
            </div>
          </div>

          {/* Analytics Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg">
            <div className="absolute right-4 top-4 rounded-full bg-amber-100 p-3">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Analytics</h3>
            <p className="mt-2 text-sm text-gray-600">
              数据采集分析、质量评估、成本监控
            </p>
            <div className="mt-4">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Coming Soon
              </span>
            </div>
            <div className="mt-6 space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                <span>采集任务统计</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                <span>数据质量分析</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                <span>成本与效率监控</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-purple-100 p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Studio 功能规划中</h4>
              <p className="mt-1 text-sm text-gray-600">
                我们正在打造强大的数据洞察功能，包括趋势分析、关系网络可视化、智能报告生成等。
                敬请期待！
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
