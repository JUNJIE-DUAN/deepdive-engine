'use client';

import {
  FileText,
  Rss,
  FileBarChart,
  Youtube,
  Newspaper,
  Plus,
  Filter,
} from 'lucide-react';

export type TabType = 'papers' | 'blogs' | 'reports' | 'youtube' | 'news';

interface ResponsiveNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onImportClick: () => void;
  onFilterClick: () => void;
  filterActive?: boolean;
  className?: string;
}

interface NavTab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    active: string;
    inactive: string;
  };
}

const NAV_TABS: NavTab[] = [
  {
    id: 'papers',
    label: 'Papers',
    icon: FileText,
    color: {
      active: 'border-blue-200 bg-blue-50 text-blue-700',
      inactive:
        'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
    },
  },
  {
    id: 'blogs',
    label: 'Blogs',
    icon: Rss,
    color: {
      active: 'border-purple-200 bg-purple-50 text-purple-700',
      inactive:
        'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
    },
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileBarChart,
    color: {
      active: 'border-amber-200 bg-amber-50 text-amber-700',
      inactive:
        'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
    },
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    color: {
      active: 'border-red-200 bg-red-50 text-red-700',
      inactive:
        'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
    },
  },
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
    color: {
      active: 'border-green-200 bg-green-50 text-green-700',
      inactive:
        'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
    },
  },
];

/**
 * ResponsiveNav - Responsive navigation component
 *
 * Features:
 * - Always shows all 5 tabs (Papers, Blogs, Reports, YouTube, News)
 * - Icon-only action buttons (Import, Filter) on the right
 * - Horizontal scrolling on small screens
 * - Responsive text sizing
 */
export default function ResponsiveNav({
  activeTab,
  onTabChange,
  onImportClick,
  onFilterClick,
  filterActive,
  className = '',
}: ResponsiveNavProps) {
  return (
    <div
      className={`flex items-center justify-between gap-2 sm:gap-3 ${className}`}
    >
      {/* Main Tabs - Always visible, horizontal scroll on small screens */}
      <div className="scrollbar-hide flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-shrink-0 items-center gap-1.5
                whitespace-nowrap rounded-lg border px-2
                py-1.5 text-xs font-medium
                shadow-sm transition-all duration-200
                sm:gap-2 sm:px-3
                sm:py-2 sm:text-sm
                md:px-4 md:py-2.5
                ${isActive ? tab.color.active : tab.color.inactive}
              `}
            >
              <Icon className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons - Icon only */}
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        {/* Import Button - Icon only */}
        <button
          onClick={onImportClick}
          className="
            flex items-center justify-center
            rounded-lg border border-gray-300
            bg-white p-2 text-gray-700
            transition-colors hover:bg-gray-50
            sm:p-2.5
          "
          title="Import URL or file"
          aria-label="Import"
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
        </button>

        {/* Filter Button - Icon only with active indicator */}
        <button
          onClick={onFilterClick}
          className={`
            relative flex items-center justify-center
            rounded-lg border p-2
            transition-colors sm:p-2.5
            ${
              filterActive
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          title="Advanced filters"
          aria-label="Filter"
        >
          <Filter className="h-4 w-4 flex-shrink-0" />
          {filterActive && (
            <span className="absolute -right-1 -top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
