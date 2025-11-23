'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  TrendingUp,
  Database,
  AlertCircle,
  Cpu,
  HardDrive,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  getRunningTasks,
  getSystemMetrics,
  CollectionTask,
} from '@/lib/api/data-collection';

export default function MonitorPage() {
  const [runningTasks, setRunningTasks] = useState<CollectionTask[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [tasksResponse, metricsResponse] = await Promise.all([
          getRunningTasks(),
          getSystemMetrics(),
        ]);
        setRunningTasks(tasksResponse.data);
        setMetrics(metricsResponse.data);
      } catch (err) {
        console.error('Failed to fetch monitor data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load monitoring data'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading && !runningTasks.length && !metrics) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading monitor data...</p>
        </div>
      </div>
    );
  }

  if (error && !runningTasks.length && !metrics) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <p className="mt-2 text-sm text-gray-900">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Real-time Monitoring
          </h2>
          <p className="text-sm text-gray-500">Auto-refresh every 5 seconds</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 animate-pulse text-green-500" />
          Live
        </div>
      </div>

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">CPU Usage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {metrics.cpu?.usage?.toFixed(1) || 0}%
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {metrics.cpu?.cores || 0} cores
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Memory Usage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {metrics.memory?.percentage?.toFixed(1) || 0}%
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {((metrics.memory?.used || 0) / 1024 / 1024 / 1024).toFixed(
                    1
                  )}{' '}
                  GB /
                  {((metrics.memory?.total || 0) / 1024 / 1024 / 1024).toFixed(
                    1
                  )}{' '}
                  GB
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2">
                <HardDrive className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Active / Queued</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {metrics.activeTasks || 0} / {metrics.queuedTasks || 0}
                </p>
                <p className="mt-1 text-xs text-gray-500">Collection tasks</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Running Tasks */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Running Tasks</h3>
          <p className="text-sm text-gray-500">
            {runningTasks.length} task{runningTasks.length !== 1 ? 's' : ''}{' '}
            currently running
          </p>
        </div>

        {runningTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No running tasks
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tasks will appear here when they start
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {runningTasks.map((task) => (
              <div key={task.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{task.name}</h4>
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        <Activity className="h-3 w-3 animate-pulse" />
                        Running
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        {task.successItems} success
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                        {task.failedItems} failed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Started {formatRelativeTime(task.startedAt)}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Progress: {task.processedItems} /{' '}
                          {task.totalItems || '?'}
                        </span>
                        <span>{task.progress.toFixed(1)}%</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
