'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import {
  LayoutDashboard,
  Database,
  Calendar,
  Activity,
  Shield,
  History,
  Users,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DataCollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Dashboard',
      href: '/data-collection/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and statistics',
    },
    {
      name: 'Users',
      href: '/data-collection/users',
      icon: Users,
      description: 'User management',
    },
    {
      name: 'Config',
      href: '/data-collection/config',
      icon: Database,
      description: 'Configure data sources',
    },
    {
      name: 'Whitelists',
      href: '/data-collection/whitelists',
      icon: Shield,
      description: 'Manage domain whitelists',
    },
    {
      name: 'Scheduler',
      href: '/data-collection/scheduler',
      icon: Calendar,
      description: 'Collection schedules',
    },
    {
      name: 'Monitor',
      href: '/data-collection/monitor',
      icon: Activity,
      description: 'Real-time monitoring',
    },
    {
      name: 'Quality',
      href: '/data-collection/quality',
      icon: Shield,
      description: 'Data quality management',
    },
    {
      name: 'History',
      href: '/data-collection/history',
      icon: History,
      description: 'Collection history',
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  System Management
                </h1>
                <p className="text-sm text-gray-500">
                  Admin control panel for system management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-100 bg-white/50 backdrop-blur-sm">
            <div className="px-8">
              <nav className="flex space-x-1" aria-label="Data collection tabs">
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
                              ? 'text-blue-600'
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
                          isActive ? 'bg-blue-600' : 'bg-transparent'
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
