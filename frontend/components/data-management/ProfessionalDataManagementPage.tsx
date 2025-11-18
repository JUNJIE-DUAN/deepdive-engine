'use client';

import React, { useState } from 'react';
import {
  Settings,
  BarChart3,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { CollectionConfigurationPanel } from './CollectionConfigurationPanel';

type ResourceType = 'PAPER' | 'BLOG' | 'REPORT' | 'YOUTUBE_VIDEO' | 'NEWS';
type ManagementTab = 'configuration' | 'monitoring' | 'quality';

const RESOURCE_TYPES: Array<{
  id: ResourceType;
  name: string;
  icon: string;
  color: string;
  borderColor: string;
  lightBg: string;
}> = [
  {
    id: 'PAPER',
    name: '学术论文',
    icon: '📄',
    color: 'text-blue-600',
    borderColor: 'border-blue-200',
    lightBg: 'bg-blue-50',
  },
  {
    id: 'BLOG',
    name: '研究博客',
    icon: '📝',
    color: 'text-purple-600',
    borderColor: 'border-purple-200',
    lightBg: 'bg-purple-50',
  },
  {
    id: 'REPORT',
    name: '商业报告',
    icon: '📊',
    color: 'text-amber-600',
    borderColor: 'border-amber-200',
    lightBg: 'bg-amber-50',
  },
  {
    id: 'YOUTUBE_VIDEO',
    name: 'YouTube视频',
    icon: '🎬',
    color: 'text-red-600',
    borderColor: 'border-red-200',
    lightBg: 'bg-red-50',
  },
  {
    id: 'NEWS',
    name: '科技新闻',
    icon: '📰',
    color: 'text-green-600',
    borderColor: 'border-green-200',
    lightBg: 'bg-green-50',
  },
];

const MANAGEMENT_TABS: Array<{
  id: ManagementTab;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
}> = [
  {
    id: 'configuration',
    name: '采集配置',
    icon: Settings,
    description: '管理关键词、URL模式和采集规则',
  },
  {
    id: 'monitoring',
    name: '监控',
    icon: Activity,
    description: '实时监控采集任务状态',
  },
  {
    id: 'quality',
    name: '质量',
    icon: AlertCircle,
    description: '数据去重和质量评分',
  },
];

// Mock statistics data
const MOCK_STATS = {
  PAPER: {
    totalCollected: 5432,
    todayCollected: 234,
    successRate: 98.5,
    duplicates: 45,
    qualityScore: 4.5,
    needsReview: 12,
    lastUpdate: '2024-11-18 14:30',
  },
  BLOG: {
    totalCollected: 1234,
    todayCollected: 45,
    successRate: 97.2,
    duplicates: 8,
    qualityScore: 4.3,
    needsReview: 3,
    lastUpdate: '2024-11-18 15:45',
  },
  REPORT: {
    totalCollected: 456,
    todayCollected: 12,
    successRate: 99.1,
    duplicates: 2,
    qualityScore: 4.7,
    needsReview: 1,
    lastUpdate: '2024-11-18 13:20',
  },
  YOUTUBE_VIDEO: {
    totalCollected: 789,
    todayCollected: 34,
    successRate: 96.8,
    duplicates: 15,
    qualityScore: 4.1,
    needsReview: 5,
    lastUpdate: '2024-11-18 14:00',
  },
  NEWS: {
    totalCollected: 3456,
    todayCollected: 156,
    successRate: 97.9,
    duplicates: 34,
    qualityScore: 4.4,
    needsReview: 8,
    lastUpdate: '2024-11-18 15:30',
  },
};

export function ProfessionalDataManagementPage() {
  const [selectedResourceType, setSelectedResourceType] =
    useState<ResourceType>('PAPER');
  const [activeTab, setActiveTab] = useState<ManagementTab>('configuration');

  const stats = MOCK_STATS[selectedResourceType];
  const resourceTypeInfo = RESOURCE_TYPES.find((t) => t.id === selectedResourceType)!;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Global Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Title and Breadcrumb */}
        <div className="border-b border-gray-200 bg-white px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⚙️</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">数据采集管理</h1>
              <p className="mt-1 text-sm text-gray-500">
                统一管理各类数据的采集配置、监控和质量控制
              </p>
            </div>
          </div>
        </div>

        {/* Resource Type TABs - Horizontal Tabs */}
        <div className="border-b border-gray-200 bg-white px-8">
          <div className="flex gap-1 overflow-x-auto">
            {RESOURCE_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedResourceType(type.id)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  selectedResourceType === type.id
                    ? `border-b-2 border-current ${type.color}`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto flex flex-col">
          {/* Management TABs */}
          <div className="border-b border-gray-200 bg-white px-8 py-4">
            <div className="flex gap-4">
              {MANAGEMENT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {MANAGEMENT_TABS.find((t) => t.id === activeTab)?.description}
            </p>
          </div>

          {/* Content Area with Statistics Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Content Panel */}
            <div className="flex-1 overflow-auto p-8">
              {activeTab === 'configuration' && (
                <div className="max-w-6xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {resourceTypeInfo.name} 采集配置
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      配置关键词、URL模式和采集规则，系统将自动按照规则采集数据
                    </p>
                  </div>
                  <CollectionConfigurationPanel
                    resourceType={selectedResourceType}
                  />
                </div>
              )}

              {activeTab === 'monitoring' && (
                <div className="max-w-6xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      采集监控 - {resourceTypeInfo.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      实时监控采集任务的执行状态和统计数据
                    </p>
                  </div>

                  {/* Monitoring Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Success Rate */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">成功率</p>
                          <p className="mt-2 text-3xl font-bold text-green-600">
                            {stats.successRate}%
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                      </div>
                    </div>

                    {/* Today Collected */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">今日采集</p>
                          <p className="mt-2 text-3xl font-bold text-blue-600">
                            {stats.todayCollected}
                          </p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-500 opacity-50" />
                      </div>
                    </div>

                    {/* Duplicates */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">重复项</p>
                          <p className="mt-2 text-3xl font-bold text-orange-600">
                            {stats.duplicates}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-orange-500 opacity-50" />
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                      <div>
                        <p className="text-sm text-gray-600">最后更新</p>
                        <p className="mt-2 text-sm font-mono text-gray-900">
                          {stats.lastUpdate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="max-w-6xl">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      质量管理 - {resourceTypeInfo.name}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                      数据去重、质量评分和审核状态管理
                    </p>
                  </div>

                  {/* Quality Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Quality Score */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <p className="text-sm text-gray-600">质量评分</p>
                      <div className="mt-4 flex items-end gap-2">
                        <p className="text-3xl font-bold text-blue-600">
                          {stats.qualityScore}
                        </p>
                        <p className="text-sm text-gray-500 mb-1">/5.0</p>
                      </div>
                      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                          style={{
                            width: `${(stats.qualityScore / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Total Collected */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <p className="text-sm text-gray-600">总采集数</p>
                      <p className="mt-4 text-3xl font-bold text-purple-600">
                        {stats.totalCollected.toLocaleString()}
                      </p>
                    </div>

                    {/* Needs Review */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <p className="text-sm text-gray-600">待审核</p>
                      <p className="mt-4 text-3xl font-bold text-yellow-600">
                        {stats.needsReview}
                      </p>
                    </div>

                    {/* Duplicate Rate */}
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <p className="text-sm text-gray-600">重复率</p>
                      <p className="mt-4 text-3xl font-bold text-red-600">
                        {(
                          (stats.duplicates / stats.totalCollected) *
                          100
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Quick Stats */}
            <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-auto">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {resourceTypeInfo.name}
                  </p>
                  <p className="mt-3 text-sm text-gray-600">采集概览</p>
                </div>

                {/* Quick Stats Cards */}
                <div className={`rounded-xl ${resourceTypeInfo.lightBg} border ${resourceTypeInfo.borderColor} p-4`}>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    总数据量
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {stats.totalCollected.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    今日: +{stats.todayCollected}
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    成功率
                  </p>
                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {stats.successRate}%
                  </p>
                  <div className="mt-3 h-1.5 bg-green-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                      style={{ width: `${stats.successRate}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    质量评分
                  </p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {stats.qualityScore}/5.0
                  </p>
                  <div className="mt-3 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-500"
                      style={{ width: `${(stats.qualityScore / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    重复项
                  </p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">
                    {stats.duplicates}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    重复率: {((stats.duplicates / stats.totalCollected) * 100).toFixed(2)}%
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 p-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    待审核
                  </p>
                  <p className="mt-2 text-2xl font-bold text-yellow-700">
                    {stats.needsReview}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    需要人工审核
                  </p>
                </div>

                {/* Action Button */}
                <button className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-medium text-white hover:shadow-lg transition-shadow">
                  <span>查看详细报告</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
