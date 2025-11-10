'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { useThumbnailGenerator } from '@/lib/use-thumbnail-generator';

// Disable static generation for this page (requires browser APIs)
export const dynamic = 'force-dynamic';

interface Resource {
  id: string;
  title: string;
  pdfUrl?: string;
  thumbnailUrl?: string;
}

interface ApiResponse {
  resources: Resource[];
}

export default function ThumbnailsAdminPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const {
    generateAndUploadThumbnail,
    batchGenerateThumbnails,
    isGenerating,
  } = useThumbnailGenerator();

  useEffect(() => {
    void fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiBaseUrl}/api/v1/resources?take=100`);
      if (response.ok) {
        const data = (await response.json()) as ApiResponse;
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const resourcesNeedingThumbnails = resources.filter(
    (r) => r.pdfUrl && !r.thumbnailUrl
  );

  const handleGenerateAll = async () => {
    const resourcesToGenerate = resourcesNeedingThumbnails
      .filter((r) => r.pdfUrl !== undefined)
      .map((r) => ({ id: r.id, pdfUrl: r.pdfUrl as string }));

    if (resourcesToGenerate.length === 0) {
      setStatusMessage('No resources need thumbnails!');
      return;
    }

    const confirmed = window.confirm(
      `Generate thumbnails for ${resourcesToGenerate.length} resources?`
    );

    if (confirmed) {
      const results = await batchGenerateThumbnails(resourcesToGenerate);
      setStatusMessage(
        `Generation complete!\nSuccess: ${results.success}\nFailed: ${results.failed}\n${results.errors.length > 0 ? `Errors:\n${results.errors.join('\n')}` : ''}`
      );
      void fetchResources(); // Refresh the list
    }
  };

  const handleGenerateSelected = async () => {
    const resourcesToGenerate = resources
      .filter((r) => selectedResources.includes(r.id) && r.pdfUrl)
      .filter((r) => r.pdfUrl !== undefined)
      .map((r) => ({ id: r.id, pdfUrl: r.pdfUrl as string }));

    if (resourcesToGenerate.length === 0) {
      setStatusMessage('No valid resources selected!');
      return;
    }

    const results = await batchGenerateThumbnails(resourcesToGenerate);
    setStatusMessage(
      `Generation complete!\nSuccess: ${results.success}\nFailed: ${results.failed}\n${results.errors.length > 0 ? `Errors:\n${results.errors.join('\n')}` : ''}`
    );
    void fetchResources();
  };

  const handleGenerateSingle = async (id: string, pdfUrl: string) => {
    const success = await generateAndUploadThumbnail(id, pdfUrl);
    setStatusMessage(success ? 'Thumbnail generated successfully!' : 'Failed to generate thumbnail');
    void fetchResources();
  };

  const toggleSelection = (id: string) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllNeedingThumbnails = () => {
    setSelectedResources(resourcesNeedingThumbnails.map((r) => r.id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            PDF Thumbnail Generator
          </h1>

          {statusMessage && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              <p className="whitespace-pre-line">{statusMessage}</p>
              <button
                onClick={() => setStatusMessage('')}
                className="mt-2 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading resources...</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Resources</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {resources.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">With Thumbnails</p>
                    <p className="text-2xl font-bold text-green-600">
                      {resources.filter((r) => r.thumbnailUrl).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Need Thumbnails</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {resourcesNeedingThumbnails.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    Generating thumbnails...
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse w-full"></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => void handleGenerateAll()}
                  disabled={resourcesNeedingThumbnails.length === 0 || isGenerating}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Generate All ({resourcesNeedingThumbnails.length})
                </button>

                <button
                  onClick={selectAllNeedingThumbnails}
                  disabled={resourcesNeedingThumbnails.length === 0}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Select All Needing Thumbnails
                </button>

                {selectedResources.length > 0 && (
                  <button
                    onClick={() => void handleGenerateSelected()}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Generate Selected ({selectedResources.length})
                  </button>
                )}
              </div>

              {/* Resources List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {resources.map((resource) => {
                      const hasThumbnail = !!resource.thumbnailUrl;
                      const hasPdf = !!resource.pdfUrl;

                      return (
                        <tr key={resource.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {hasPdf && !hasThumbnail && (
                              <input
                                type="checkbox"
                                checked={selectedResources.includes(resource.id)}
                                onChange={() => toggleSelection(resource.id)}
                                className="w-4 h-4"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="max-w-md truncate">{resource.title}</div>
                          </td>
                          <td className="px-4 py-3">
                            {hasThumbnail && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Has Thumbnail
                              </span>
                            )}
                            {!hasThumbnail && hasPdf && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Needs Thumbnail
                              </span>
                            )}
                            {!hasPdf && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                No PDF
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasPdf && !hasThumbnail && resource.pdfUrl && (
                              <button
                                onClick={() => void handleGenerateSingle(resource.id, resource.pdfUrl as string)}
                                disabled={isGenerating}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:text-gray-400"
                              >
                                Generate
                              </button>
                            )}
                            {hasThumbnail && (
                              <a
                                href={`${config.apiBaseUrl}${resource.thumbnailUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View
                              </a>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
