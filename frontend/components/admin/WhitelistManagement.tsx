'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
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

export default function WhitelistManagement() {
  const [whitelists, setWhitelists] = useState<Whitelist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWhitelists();
  }, []);

  const fetchWhitelists = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/data-management/whitelists');
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update whitelist'
      );
    }
  };

  const toggleExpanded = (resourceType: string) => {
    const newSet = new Set(expandedTypes);
    if (newSet.has(resourceType)) {
      newSet.delete(resourceType);
    } else {
      newSet.add(resourceType);
    }
    setExpandedTypes(newSet);
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

      <div className="rounded-xl border border-gray-200/50 bg-white/70 p-6 shadow-sm backdrop-blur-sm">
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
                  d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
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

        <div className="space-y-4">
          {whitelists.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">No whitelists configured</p>
            </div>
          ) : (
            whitelists.map((whitelist) => (
              <div
                key={whitelist.resourceType}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                {/* Header */}
                <div
                  className="flex cursor-pointer items-center justify-between bg-gray-50 px-6 py-4 hover:bg-gray-100"
                  onClick={() => toggleExpanded(whitelist.resourceType)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-5 w-5 flex-shrink-0 text-gray-600 transition-transform duration-200 ${
                          expandedTypes.has(whitelist.resourceType)
                            ? 'rotate-90'
                            : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <h3 className="font-semibold text-gray-900">
                        {whitelist.resourceType}
                      </h3>
                      {whitelist.description && (
                        <span className="ml-2 text-xs text-gray-500">
                          - {whitelist.description}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {whitelist.totalValidated} validated,{' '}
                        {whitelist.totalRejected} rejected
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWhitelist(
                          whitelist.resourceType,
                          whitelist.isActive
                        );
                      }}
                      className={`rounded-full p-2 transition-colors ${
                        whitelist.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={whitelist.isActive ? 'Active' : 'Inactive'}
                    >
                      {whitelist.isActive ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTypes.has(whitelist.resourceType) && (
                  <div className="space-y-4 border-t border-gray-200 bg-white px-6 py-4">
                    {/* Domains List */}
                    <div>
                      <h4 className="mb-3 font-medium text-gray-900">
                        Allowed Domains
                      </h4>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {whitelist.allowedDomains.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No domains configured
                          </p>
                        ) : (
                          whitelist.allowedDomains.map((domain) => (
                            <div
                              key={domain}
                              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                            >
                              <code className="break-all text-sm text-gray-700">
                                {domain}
                              </code>
                              <button
                                onClick={() =>
                                  handleRemoveDomain(
                                    whitelist.resourceType,
                                    domain
                                  )
                                }
                                className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
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
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="mb-3 font-medium text-gray-900">
                        Add Domain
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., example.com or *.example.com"
                          value={
                            selectedType === whitelist.resourceType
                              ? newDomain
                              : ''
                          }
                          onChange={(e) => {
                            setSelectedType(whitelist.resourceType);
                            setNewDomain(e.target.value);
                          }}
                          onFocus={() =>
                            setSelectedType(whitelist.resourceType)
                          }
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() =>
                            handleAddDomain(whitelist.resourceType)
                          }
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Wildcards (*) and regex patterns (/pattern/) are
                        supported
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 font-medium text-blue-900">
            Domain Pattern Examples
          </h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>
              •{' '}
              <code className="rounded bg-blue-100 px-2 py-1">example.com</code>{' '}
              - Exact match
            </li>
            <li>
              •{' '}
              <code className="rounded bg-blue-100 px-2 py-1">
                *.example.com
              </code>{' '}
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
      </div>
    </div>
  );
}
