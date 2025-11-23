'use client';

import { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  Copy,
  TrendingUp,
} from 'lucide-react';
import {
  getHistory,
  getHistoryStats,
  HistoryRecord,
  HistoryStats,
} from '@/lib/api/data-collection';

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [historyResponse, statsResponse] = await Promise.all([
          getHistory({ limit: 50 }),
          getHistoryStats(period),
        ]);
        setHistory(historyResponse.data);
        setStats(statsResponse.data);
      } catch (err) {
        console.error('Failed to fetch history data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatRelativeTime = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Loading history...</p>
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

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Collection History
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('day')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === 'day'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === 'week'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              period === 'month'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Tasks</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.totalTasks}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span>{stats.completedTasks} completed</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.totalCollected.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Copy className="h-3 w-3" />
              <span>{stats.totalDuplicates} duplicates</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {stats.successRate.toFixed(1)}%
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>Trending up</span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Avg Duration</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatDuration(Math.round(stats.avgDuration))}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Per task</span>
            </div>
          </div>
        </div>
      )}

      {/* History List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
          <p className="text-sm text-gray-500">{history.length} records</p>
        </div>

        {history.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <HistoryIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">
              No history found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Completed tasks will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">
                        {item.taskName}
                      </h4>
                      {item.status === 'COMPLETED' && (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      )}
                      {item.status === 'FAILED' && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Source: {item.sourceName}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        {item.successItems} collected
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Copy className="h-3.5 w-3.5" />
                        {item.duplicateItems} duplicates
                      </span>
                      {item.failedItems > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                            {item.failedItems} failed
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(item.duration)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(item.completedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
