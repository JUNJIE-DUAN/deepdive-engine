'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface CollectionRule {
  id: string;
  resourceType: string;
  cronExpression: string;
  maxConcurrent: number;
  timeout: number;
  isActive: boolean;
  description?: string;
  lastExecutedAt?: string;
  nextScheduledAt?: string;
}

interface CollectionStats {
  resourceType: string;
  totalCollected: number;
  totalSuccessful: number;
  totalFailed: number;
  totalDuplicates: number;
  averageQualityScore: number;
  successRate: number;
  lastCollectionAt?: string;
}

export default function CollectionManagement() {
  const [rules, setRules] = useState<CollectionRule[]>([]);
  const [stats, setStats] = useState<CollectionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    resourceType: 'PAPER',
    cronExpression: '0 */6 * * *',
    maxConcurrent: 3,
    timeout: 300,
    description: '',
  });

  useEffect(() => {
    fetchRulesAndStats();
  }, []);

  const fetchRulesAndStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [rulesRes, statsRes] = await Promise.all([
        fetch('/api/v1/data-management/rules'),
        fetch('/api/v1/data-management/dashboard/summary'),
      ]);

      if (!rulesRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const rulesData = await rulesRes.json();
      const statsData = await statsRes.json();

      setRules(rulesData.data || []);
      setStats(statsData.data?.statistics || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    try {
      const res = await fetch('/api/v1/data-management/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      });

      if (!res.ok) throw new Error('Failed to create rule');

      setNewRule({
        resourceType: 'PAPER',
        cronExpression: '0 */6 * * *',
        maxConcurrent: 3,
        timeout: 300,
        description: '',
      });
      setShowAddRule(false);
      await fetchRulesAndStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule');
    }
  };

  const handleToggleRule = async (rule: CollectionRule) => {
    try {
      const res = await fetch(
        `/api/v1/data-management/rules/${rule.resourceType}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rule, isActive: !rule.isActive }),
        }
      );

      if (!res.ok) throw new Error('Failed to update rule');
      await fetchRulesAndStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const handleExecuteRule = async (resourceType: string) => {
    try {
      const res = await fetch(
        `/api/v1/data-management/rules/${resourceType}/execute`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) throw new Error('Failed to execute rule');
      await fetchRulesAndStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rule');
    }
  };

  const handleDeleteRule = async (resourceType: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const res = await fetch(`/api/v1/data-management/rules/${resourceType}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete rule');
      await fetchRulesAndStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading collection settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200/50 bg-red-50/50 p-4 backdrop-blur-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Collection Statistics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Collection Statistics
            </h2>
          </div>
          <div className="space-y-4">
            {stats.length === 0 ? (
              <p className="text-gray-500">No statistics available yet</p>
            ) : (
              stats.map((stat) => (
                <div
                  key={stat.resourceType}
                  className="border-b border-gray-100/50 pb-4 last:border-0 last:pb-0"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100">
                        <span className="text-xs font-semibold text-blue-600">
                          {stat.resourceType.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stat.resourceType}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">
                      {stat.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${stat.successRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded bg-gray-50/50 px-2 py-1.5">
                      <span className="block text-gray-500">Collected</span>
                      <span className="font-semibold text-gray-900">
                        {stat.totalCollected}
                      </span>
                    </div>
                    <div className="rounded bg-gray-50/50 px-2 py-1.5">
                      <span className="block text-gray-500">Failed</span>
                      <span className="font-semibold text-gray-900">
                        {stat.totalFailed}
                      </span>
                    </div>
                    <div className="rounded bg-gray-50/50 px-2 py-1.5">
                      <span className="block text-gray-500">Duplicates</span>
                      <span className="font-semibold text-gray-900">
                        {stat.totalDuplicates}
                      </span>
                    </div>
                    <div className="rounded bg-gray-50/50 px-2 py-1.5">
                      <span className="block text-gray-500">Quality</span>
                      <span className="font-semibold text-gray-900">
                        {stat.averageQualityScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Collection Rules */}
        <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                Collection Rules
              </h2>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                {rules.length}
              </span>
            </div>
            <button
              onClick={() => setShowAddRule(!showAddRule)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              New Rule
            </button>
          </div>

          {showAddRule && (
            <div className="mb-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Resource Type
                </label>
                <select
                  value={newRule.resourceType}
                  onChange={(e) =>
                    setNewRule({ ...newRule, resourceType: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option>PAPER</option>
                  <option>BLOG</option>
                  <option>NEWS</option>
                  <option>YOUTUBE_VIDEO</option>
                  <option>PROJECT</option>
                  <option>EVENT</option>
                  <option>REPORT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={newRule.cronExpression}
                  onChange={(e) =>
                    setNewRule({ ...newRule, cronExpression: e.target.value })
                  }
                  placeholder="0 */6 * * *"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">
                  e.g., '0 */6 * * *' = every 6 hours
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Concurrent
                  </label>
                  <input
                    type="number"
                    value={newRule.maxConcurrent}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        maxConcurrent: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={newRule.timeout}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        timeout: parseInt(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddRule}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Create Rule
                </button>
                <button
                  onClick={() => setShowAddRule(false)}
                  className="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-gray-500">No collection rules configured</p>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {rule.isActive ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">
                        {rule.resourceType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Cron: {rule.cronExpression}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExecuteRule(rule.resourceType)}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                      title="Execute now"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        rule.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.resourceType)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Collection Import Dialog */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Import
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Import data sources by URL. The system will validate and add them
          based on whitelist rules.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {['PAPER', 'BLOG', 'NEWS', 'YOUTUBE_VIDEO', 'PROJECT', 'EVENT'].map(
            (type) => (
              <button
                key={type}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Import {type}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
