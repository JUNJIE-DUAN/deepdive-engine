'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import {
  AlertCircle,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  X,
  Globe,
  FileText,
  Video,
  Newspaper,
  FolderGit2,
  Rss,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface Whitelist {
  id: string;
  resourceType: string;
  allowedDomains: string[];
  description?: string;
  isActive: boolean;
  totalValidated: number;
  totalRejected: number;
  createdAt: string;
  updatedAt: string;
}

const resourceTypeIcons: Record<string, React.ReactNode> = {
  YOUTUBE_VIDEO: <Video className="h-6 w-6" />,
  PAPER: <FileText className="h-6 w-6" />,
  BLOG: <Globe className="h-6 w-6" />,
  NEWS: <Newspaper className="h-6 w-6" />,
  PROJECT: <FolderGit2 className="h-6 w-6" />,
  RSS: <Rss className="h-6 w-6" />,
  REPORT: <BarChart3 className="h-6 w-6" />,
  EVENT: <Calendar className="h-6 w-6" />,
};

const resourceTypeColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  YOUTUBE_VIDEO: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  PAPER: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  BLOG: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
  },
  NEWS: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  PROJECT: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
  RSS: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  REPORT: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
  },
  EVENT: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
};

export default function WhitelistManagement() {
  const [whitelists, setWhitelists] = useState<Whitelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWhitelist, setSelectedWhitelist] = useState<Whitelist | null>(
    null
  );
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    fetchWhitelists();
  }, []);

  const fetchWhitelists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${config.apiUrl}/data-management/whitelists`);
      if (!res.ok) throw new Error('Failed to fetch whitelists');
      const data = await res.json();
      setWhitelists(data.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load whitelists'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (resourceType: string) => {
    if (!newDomain.trim()) return;

    try {
      const res = await fetch(
        `/api/v1/data-management/whitelists/${resourceType}/domains`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: newDomain }),
        }
      );

      if (!res.ok) throw new Error('Failed to add domain');
      setNewDomain('');
      await fetchWhitelists();
      // Update selected whitelist
      const updated = await fetch(
        `${config.apiUrl}/data-management/whitelists`
      );
      const data = await updated.json();
      const updatedWhitelist = (data.data || []).find(
        (w: Whitelist) => w.resourceType === resourceType
      );
      if (updatedWhitelist) setSelectedWhitelist(updatedWhitelist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add domain');
    }
  };

  const handleRemoveDomain = async (resourceType: string, domain: string) => {
    try {
      const res = await fetch(
        `/api/v1/data-management/whitelists/${resourceType}/domains/${encodeURIComponent(domain)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) throw new Error('Failed to remove domain');
      await fetchWhitelists();
      // Update selected whitelist
      const updated = await fetch(
        `${config.apiUrl}/data-management/whitelists`
      );
      const data = await updated.json();
      const updatedWhitelist = (data.data || []).find(
        (w: Whitelist) => w.resourceType === resourceType
      );
      if (updatedWhitelist) setSelectedWhitelist(updatedWhitelist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove domain');
    }
  };

  const handleToggleWhitelist = async (
    resourceType: string,
    isActive: boolean
  ) => {
    try {
      const whitelist = whitelists.find((w) => w.resourceType === resourceType);
      if (!whitelist) return;

      const res = await fetch(
        `/api/v1/data-management/whitelists/${resourceType}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...whitelist,
            isActive: !isActive,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to update whitelist');
      await fetchWhitelists();
      // Update selected whitelist
      if (selectedWhitelist?.resourceType === resourceType) {
        setSelectedWhitelist({ ...selectedWhitelist, isActive: !isActive });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update whitelist'
      );
    }
  };

  const getColors = (resourceType: string) => {
    return (
      resourceTypeColors[resourceType] || {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
      }
    );
  };

  const getIcon = (resourceType: string) => {
    return resourceTypeIcons[resourceType] || <Globe className="h-6 w-6" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading whitelists...</p>
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
            <Check className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            Domain Whitelists
          </h2>
        </div>
        <button
          onClick={() => fetchWhitelists()}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {whitelists.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No whitelists configured</p>
          </div>
        ) : (
          whitelists.map((whitelist) => {
            const colors = getColors(whitelist.resourceType);
            return (
              <div
                key={whitelist.resourceType}
                onClick={() => setSelectedWhitelist(whitelist)}
                className={`group cursor-pointer rounded-xl border ${colors.border} ${colors.bg} p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}
              >
                {/* Icon and Status */}
                <div className="mb-4 flex items-start justify-between">
                  <div className={`rounded-xl ${colors.bg} p-3 ${colors.text}`}>
                    {getIcon(whitelist.resourceType)}
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      whitelist.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {whitelist.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-1 font-semibold text-gray-900">
                  {whitelist.resourceType.replace(/_/g, ' ')}
                </h3>

                {/* Description */}
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                  {whitelist.description || 'No description'}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between border-t border-gray-200/50 pt-3">
                  <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {whitelist.allowedDomains.length}
                    </span>{' '}
                    domains
                  </div>
                  <div className="text-xs text-gray-500">
                    {whitelist.totalValidated} validated
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="mb-2 font-medium text-blue-900">
          Domain Pattern Examples
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>
            • <code className="rounded bg-blue-100 px-2 py-1">example.com</code>{' '}
            - Exact match
          </li>
          <li>
            •{' '}
            <code className="rounded bg-blue-100 px-2 py-1">*.example.com</code>{' '}
            - Wildcard for subdomains
          </li>
          <li>
            •{' '}
            <code className="rounded bg-blue-100 px-2 py-1">
              /^example\.com$/
            </code>{' '}
            - Regex pattern
          </li>
        </ul>
      </div>

      {/* Configuration Modal */}
      {selectedWhitelist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div
              className={`flex items-center justify-between rounded-t-2xl ${getColors(selectedWhitelist.resourceType).bg} px-6 py-4`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2 ${getColors(selectedWhitelist.resourceType).text}`}
                >
                  {getIcon(selectedWhitelist.resourceType)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedWhitelist.resourceType.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedWhitelist.description ||
                      'Configure allowed domains'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWhitelist(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-white/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Status Toggle */}
              <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Whitelist Status
                  </h4>
                  <p className="text-sm text-gray-500">
                    {selectedWhitelist.isActive
                      ? 'This whitelist is currently active'
                      : 'This whitelist is currently disabled'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleWhitelist(
                      selectedWhitelist.resourceType,
                      selectedWhitelist.isActive
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    selectedWhitelist.isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedWhitelist.isActive
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Domains List */}
              <div className="mb-6">
                <h4 className="mb-3 font-medium text-gray-900">
                  Allowed Domains ({selectedWhitelist.allowedDomains.length})
                </h4>
                <div className="max-h-60 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {selectedWhitelist.allowedDomains.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                      No domains configured
                    </p>
                  ) : (
                    selectedWhitelist.allowedDomains.map((domain) => (
                      <div
                        key={domain}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 transition-colors hover:bg-gray-100"
                      >
                        <code className="break-all text-sm text-gray-700">
                          {domain}
                        </code>
                        <button
                          onClick={() =>
                            handleRemoveDomain(
                              selectedWhitelist.resourceType,
                              domain
                            )
                          }
                          className="ml-2 flex-shrink-0 rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Remove domain"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Domain Form */}
              <div>
                <h4 className="mb-3 font-medium text-gray-900">
                  Add New Domain
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., example.com or *.example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddDomain(selectedWhitelist.resourceType);
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      handleAddDomain(selectedWhitelist.resourceType)
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Press Enter to add quickly. Wildcards (*) and regex patterns
                  (/pattern/) are supported.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
              <div className="text-sm text-gray-500">
                {selectedWhitelist.totalValidated} validated ·{' '}
                {selectedWhitelist.totalRejected} rejected
              </div>
              <button
                onClick={() => setSelectedWhitelist(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
