'use client';

import { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Rss,
  FileBarChart,
  Youtube,
  Newspaper,
  Plus,
  Filter,
  ChevronDown,
  MoreHorizontal,
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

export default function ResponsiveNav({
  activeTab,
  onTabChange,
  onImportClick,
  onFilterClick,
  filterActive,
  className = '',
}: ResponsiveNavProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [visibleTabs, setVisibleTabs] = useState<TabType[]>([]);
  const [hiddenTabs, setHiddenTabs] = useState<TabType[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Calculate visible/hidden tabs based on container width
  useEffect(() => {
    const calculateVisibility = () => {
      if (!navRef.current || !tabsRef.current) return;

      const containerWidth = navRef.current.clientWidth;
      const actionsWidth = 200; // Approximate width for Import + Filter buttons
      const availableWidth = containerWidth - actionsWidth - 100; // Extra margin

      // On large screens (>1280px), show all tabs
      if (containerWidth > 1280) {
        setVisibleTabs(NAV_TABS.map((t) => t.id));
        setHiddenTabs([]);
        return;
      }

      // On medium screens (768px-1280px), show first 3-4 tabs
      if (containerWidth > 768) {
        const visible =
          availableWidth > 600
            ? NAV_TABS.slice(0, 4).map((t) => t.id)
            : NAV_TABS.slice(0, 3).map((t) => t.id);
        const hidden = NAV_TABS.slice(visible.length).map((t) => t.id);
        setVisibleTabs(visible);
        setHiddenTabs(hidden);
        return;
      }

      // On small screens (<768px), show first 2 tabs + more menu
      setVisibleTabs(NAV_TABS.slice(0, 2).map((t) => t.id));
      setHiddenTabs(NAV_TABS.slice(2).map((t) => t.id));
    };

    calculateVisibility();
    window.addEventListener('resize', calculateVisibility);
    return () => window.removeEventListener('resize', calculateVisibility);
  }, []);

  const renderTab = (tab: NavTab, showLabel: boolean = true) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        onClick={() => {
          onTabChange(tab.id);
          setShowMoreMenu(false);
        }}
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
        {showLabel && <span className="hidden sm:inline">{tab.label}</span>}
      </button>
    );
  };

  return (
    <div
      ref={navRef}
      className={`flex items-center justify-between gap-2 sm:gap-4 ${className}`}
    >
      {/* Main Tabs - Responsive */}
      <div
        ref={tabsRef}
        className="scrollbar-hide flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1"
      >
        {/* Visible tabs */}
        {NAV_TABS.filter((tab) => visibleTabs.includes(tab.id)).map((tab) =>
          renderTab(tab)
        )}

        {/* More menu for hidden tabs */}
        {hiddenTabs.length > 0 && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`
                flex items-center gap-1.5 rounded-lg
                border px-2 py-1.5 text-xs
                font-medium shadow-sm transition-all
                duration-200 sm:gap-2 sm:px-3
                sm:py-2 sm:text-sm
                md:px-4 md:py-2.5
                ${
                  hiddenTabs.includes(activeTab)
                    ? 'border-gray-300 bg-gray-100 text-gray-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">More</span>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            {/* Dropdown menu */}
            {showMoreMenu && (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-[150px] rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="p-1">
                  {NAV_TABS.filter((tab) => hiddenTabs.includes(tab.id)).map(
                    (tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            onTabChange(tab.id);
                            setShowMoreMenu(false);
                          }}
                          className={`
                          flex w-full items-center gap-2
                          rounded-md px-3 py-2
                          text-sm font-medium
                          transition-colors
                          ${
                            isActive
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
        {/* Import Button */}
        <button
          onClick={onImportClick}
          className="
            flex items-center gap-1 whitespace-nowrap
            rounded-lg border border-gray-300
            bg-white px-2 py-1 text-xs
            font-medium text-gray-700 transition-colors
            hover:bg-gray-50 sm:gap-2
            sm:px-3
            sm:py-1.5
            sm:text-sm
          "
          title="Import URL or file"
        >
          <Plus className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
          <span className="hidden md:inline">Import</span>
        </button>

        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          className={`
            relative flex items-center gap-1 whitespace-nowrap
            rounded-lg border
            px-2 py-1 text-xs font-medium
            transition-colors sm:gap-2 sm:px-3
            sm:py-1.5
            sm:text-sm
            ${
              filterActive
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          title="Advanced filters"
        >
          <Filter className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
          <span className="hidden md:inline">Filter</span>
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

// Utility CSS class for hiding scrollbar
// Add to global CSS:
/*
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
*/
