'use client';

import { useState } from 'react';
import AIModelSettings from '@/components/admin/AIModelSettings';
import ExternalAPISettings from '@/components/admin/ExternalAPISettings';

type Tab = 'models' | 'external-api';

export default function AIModelsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('models');

  return (
    <div className="flex h-full flex-col">
      {/* Sub Tabs */}
      <div className="border-b border-gray-200 bg-white px-8">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('models')}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            AI Models
          </button>
          <button
            onClick={() => setActiveTab('external-api')}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === 'external-api'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            External API
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'models' && <AIModelSettings />}
        {activeTab === 'external-api' && <ExternalAPISettings />}
      </div>
    </div>
  );
}
