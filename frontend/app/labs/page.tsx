'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface LabFeature {
  id: string;
  name: string;
  description: string;
  status: 'beta' | 'alpha' | 'experimental';
  enabled: boolean;
  icon: string;
}

export default function Labs() {
  const [features, setFeatures] = useState<LabFeature[]>([
    {
      id: 'ai-insights',
      name: 'AI-Powered Insights',
      description: 'Automatically extract key insights and methodologies from papers using advanced AI models.',
      status: 'beta',
      enabled: true,
      icon: 'sparkles',
    },
    {
      id: 'vector-search',
      name: 'Semantic Vector Search',
      description: 'Search papers by meaning, not just keywords. Powered by embedding models.',
      status: 'alpha',
      enabled: false,
      icon: 'search',
    },
    {
      id: 'knowledge-graph',
      name: 'Knowledge Graph Visualization',
      description: 'Explore connections between papers, authors, and concepts in an interactive graph.',
      status: 'beta',
      enabled: false,
      icon: 'graph',
    },
    {
      id: 'smart-recommendations',
      name: 'Smart Recommendations',
      description: 'Get personalized paper recommendations based on your reading history and interests.',
      status: 'experimental',
      enabled: false,
      icon: 'magic',
    },
    {
      id: 'auto-summary',
      name: 'Auto-Generated Summaries',
      description: 'Automatically generate concise summaries for newly added papers.',
      status: 'beta',
      enabled: true,
      icon: 'document',
    },
    {
      id: 'citation-tracking',
      name: 'Citation Tracking',
      description: 'Track citations and references across papers to understand research impact.',
      status: 'alpha',
      enabled: false,
      icon: 'link',
    },
  ]);

  const toggleFeature = (id: string) => {
    setFeatures(features.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'beta':
        return 'bg-blue-100 text-blue-700';
      case 'alpha':
        return 'bg-yellow-100 text-yellow-700';
      case 'experimental':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getFeatureIcon = (icon: string) => {
    switch (icon) {
      case 'sparkles':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'search':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'graph':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
      case 'magic':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'link':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Experimental Features</h1>
            <p className="text-sm text-gray-600">Try out new features and help us improve</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Warning Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Experimental Features</h3>
                  <p className="text-sm text-yellow-800">
                    These features are still in development and may not work as expected. Your feedback helps us improve them.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${feature.enabled ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {getFeatureIcon(feature.icon)}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(feature.status)}`}>
                            {feature.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                        {feature.enabled && (
                          <p className="text-xs text-green-600 font-medium">✓ Enabled</p>
                        )}
                      </div>
                    </div>

                    {/* Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={() => toggleFeature(feature.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback Section */}
            <div className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 border border-red-100">
              <h3 className="font-semibold text-gray-900 mb-2">Have feedback?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your input helps us build better features. Let us know what you think!
              </p>
              <Link
                href="/feedback"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Share Feedback
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
