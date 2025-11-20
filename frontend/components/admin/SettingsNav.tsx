'use client';

type SettingsTab = 'whitelist' | 'collection' | 'quality';

interface SettingsNavProps {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export default function SettingsNav({
  activeTab,
  setActiveTab,
}: SettingsNavProps) {
  const tabs = [
    {
      id: 'collection' as SettingsTab,
      label: 'Collection',
      description: 'Manage data collection rules and scheduling',
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-colors ${active ? 'text-blue-600' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      id: 'whitelist' as SettingsTab,
      label: 'Whitelists',
      description: 'Configure domain whitelists for each resource type',
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-colors ${active ? 'text-blue-600' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'quality' as SettingsTab,
      label: 'Data Quality',
      description: 'Monitor and manage data quality metrics',
      icon: (active: boolean) => (
        <svg
          className={`h-5 w-5 transition-colors ${active ? 'text-blue-600' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="border-b border-gray-100 bg-white/50 backdrop-blur-sm">
      <div className="px-8">
        <nav className="flex space-x-1" aria-label="Settings tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="group relative px-4 py-3.5 transition-all"
                title={tab.description}
              >
                <div className="flex items-center gap-2">
                  {tab.icon(isActive)}
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-gray-900'
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </span>
                </div>

                {/* Active indicator - bottom border */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all ${
                    isActive ? 'bg-blue-600' : 'bg-transparent'
                  }`}
                  style={{
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
