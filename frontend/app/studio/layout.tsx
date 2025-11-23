'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { TrendingUp, Network, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Overview',
      href: '/studio',
      icon: BarChart3,
      description: 'Studio overview and insights',
    },
    {
      name: 'Trends',
      href: '/studio/trends',
      icon: TrendingUp,
      description: 'Hot topics tracking and trend analysis',
    },
    {
      name: 'Network',
      href: '/studio/network',
      icon: Network,
      description: 'Concept relationship network',
    },
    {
      name: 'Reports',
      href: '/studio/reports',
      icon: FileText,
      description: 'Personal reading reports',
    },
    {
      name: 'Analytics',
      href: '/studio/analytics',
      icon: BarChart3,
      description: 'Data collection analytics',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/25">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Studio</h1>
                <p className="text-sm text-gray-500">
                  数据工作台 - 可视化分析与洞察
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="px-8">
              <nav className="flex space-x-1" aria-label="Studio tabs">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className="group relative px-4 py-3.5 transition-all"
                      title={tab.description}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? 'text-purple-600'
                              : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isActive
                              ? 'text-gray-900'
                              : 'text-gray-700 group-hover:text-gray-900'
                          }`}
                        >
                          {tab.name}
                        </span>
                      </div>

                      {/* Active indicator */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all ${
                          isActive ? 'bg-purple-600' : 'bg-transparent'
                        }`}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
