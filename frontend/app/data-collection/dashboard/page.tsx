'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Copy,
  Database,
  Activity,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  getDashboardStats,
  DashboardStats,
  CollectionTask,
} from '@/lib/api/data-collection';

interface FormattedStats {
  totalSources: number;
  activeSources: number;
  totalTasks: number;
  runningTasks: number;
  todayCollected: number;
  todaySuccess: number;
  todayFailed: number;
  todayDuplicates: number;
  avgQuality: number;
  successRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<FormattedStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<CollectionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        const data = response.data;

        // Map API response to UI format
        setStats({
          totalSources: data.sourceStats.total,
          activeSources: data.sourceStats.active,
          totalTasks: data.taskStats.total,
          runningTasks: data.taskStats.running,
          todayCollected: data.todayStats.collected,
          todaySuccess: Math.round(
            data.todayStats.collected * (data.todayStats.successRate / 100)
          ),
          todayFailed: 0,
          todayDuplicates: 0,
          avgQuality: data.todayStats.avgQuality,
          successRate: data.todayStats.successRate,
        });

        setRecentTasks(data.recentTasks || []);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Helper function to format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-sm text-gray-900">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Collected Today */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Collected Today</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.todayCollected}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-600">+12.5%</span>
                <span className="text-gray-500">vs yesterday</span>
              </div>
            </div>
            <div className="rounded-lg bg-blue-100 p-2">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.successRate.toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-600">
                  {stats.todaySuccess} succeeded
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-emerald-100 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Tasks</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.runningTasks}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-blue-600">
                  {stats.totalTasks} total tasks
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-violet-100 p-2">
              <Activity className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Avg Quality */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Quality</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stats.avgQuality.toFixed(1)}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="font-medium text-emerald-600">+3.2%</span>
                <span className="text-gray-500">this week</span>
              </div>
            </div>
            <div className="rounded-lg bg-amber-100 p-2">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
          <p className="text-sm text-gray-500">Live collection task status</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No recent tasks found
            </div>
          ) : (
            recentTasks.map((task) => (
              <div key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      {task.status === 'RUNNING' && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Activity className="h-3 w-3" />
                          Running
                        </span>
                      )}
                      {task.status === 'COMPLETED' && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </span>
                      )}
                      {task.status === 'FAILED' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </span>
                      )}
                      {task.status === 'PENDING' && (
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {task.successItems} collected
                      </span>
                      <span className="flex items-center gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        {task.duplicateItems} duplicates
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(task.startedAt)}
                      </span>
                    </div>
                    {task.status === 'RUNNING' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{task.progress.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full bg-blue-600 transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <button
          onClick={() => router.push('/data-collection/config')}
          className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-all hover:cursor-pointer hover:border-blue-300 hover:bg-blue-50/50"
        >
          <Database className="mx-auto h-8 w-8 text-gray-400" />
          <h4 className="mt-2 font-medium text-gray-900">Add Data Source</h4>
          <p className="text-sm text-gray-500">Configure a new data source</p>
        </button>
        <button
          onClick={() => router.push('/data-collection/scheduler')}
          className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-all hover:cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50"
        >
          <Activity className="mx-auto h-8 w-8 text-gray-400" />
          <h4 className="mt-2 font-medium text-gray-900">Create Task</h4>
          <p className="text-sm text-gray-500">Start a new collection task</p>
        </button>
        <button
          onClick={() => router.push('/data-collection/scheduler')}
          className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-all hover:cursor-pointer hover:border-violet-300 hover:bg-violet-50/50"
        >
          <Clock className="mx-auto h-8 w-8 text-gray-400" />
          <h4 className="mt-2 font-medium text-gray-900">Schedule Job</h4>
          <p className="text-sm text-gray-500">Set up automated collection</p>
        </button>
      </div>
    </div>
  );
}
