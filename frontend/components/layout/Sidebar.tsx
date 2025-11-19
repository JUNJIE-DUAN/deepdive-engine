'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useResourceStore } from '@/stores/aiOfficeStore';
import { UserCircle } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // 默认折叠，但读取localStorage的设置
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const pathname = usePathname();
  const aiOfficeResourceCount = useResourceStore(
    (state) => state.resources.length
  );

  // 持久化折叠状态
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-52'} relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${className}`}
    >
      {/* Collapse/Expand Button - Vertically Centered */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="group absolute -right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm ring-1 ring-gray-200/50 transition-all duration-200 hover:shadow-md hover:ring-blue-300/50"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`h-4 w-4 text-gray-600 transition-all duration-200 group-hover:text-blue-600 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-400/0 to-purple-400/0 opacity-0 transition-opacity duration-200 group-hover:from-blue-400/10 group-hover:to-purple-400/10 group-hover:opacity-100" />
      </button>

      {/* Header */}
      <div
        className={`flex items-center p-4 ${isCollapsed ? 'justify-center' : ''}`}
      >
        {isCollapsed ? (
          /* Collapsed Logo - Abstract nested circles suggesting depth */
          <Link href="/" className="group" title="DeepDive Engine">
            <svg
              className="h-10 w-10 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
              {/* Abstract nested circles - represents depth layers */}
              <circle cx="12" cy="12" r="9" stroke="url(#logoBg)" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" stroke="url(#logoBg)" strokeWidth="1" opacity="0.6" />
              <circle cx="12" cy="12" r="3" fill="url(#logoBg)" opacity="0.8" />
            </svg>
          </Link>
        ) : (
          /* Expanded Logo - Icon + Text */
          <Link
            href="/"
            className="group flex items-center gap-3"
            title="DeepDive Engine"
          >
            <svg
              className="h-10 w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <defs>
                <linearGradient id="logoBg2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#9333ea" />
                </linearGradient>
              </defs>
              {/* Abstract nested circles - represents depth layers */}
              <circle cx="12" cy="12" r="9" stroke="url(#logoBg2)" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" stroke="url(#logoBg2)" strokeWidth="1" opacity="0.6" />
              <circle cx="12" cy="12" r="3" fill="url(#logoBg2)" opacity="0.8" />
            </svg>
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              DeepDive
            </span>
          </Link>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <Link
            href="/"
            onClick={(e) => {
              // Force navigation even if already on homepage
              if (pathname === '/') {
                e.preventDefault();
                window.location.href = '/';
              }
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/')
                ? 'bg-pink-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Explore"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {!isCollapsed && <span>Explore</span>}
          </Link>

          <Link
            href="/ai-office"
            onClick={(e) => {
              // Force navigation even if already on ai-office page
              if (pathname === '/ai-office') {
                e.preventDefault();
                window.location.href = '/ai-office';
              }
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} relative rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/ai-office') || pathname?.startsWith('/ai-office')
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900 shadow-sm'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="AI Office"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            {!isCollapsed && (
              <div className="flex flex-1 items-center justify-between">
                <span>AI Office</span>
                {aiOfficeResourceCount > 0 && (
                  <span className="ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {aiOfficeResourceCount}
                  </span>
                )}
              </div>
            )}
            {isCollapsed && aiOfficeResourceCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                {aiOfficeResourceCount > 9 ? '9+' : aiOfficeResourceCount}
              </span>
            )}
          </Link>

          <Link
            href="/data-management"
            onClick={(e) => {
              // Force navigation even if already on data-management page
              if (pathname === '/data-management') {
                e.preventDefault();
                window.location.href = '/data-management';
              }
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/data-management')
                ? 'bg-emerald-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Collection"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            {!isCollapsed && <span>Collection</span>}
          </Link>

          <Link
            href="/library"
            onClick={(e) => {
              // Force navigation even if already on library page
              if (pathname === '/library') {
                e.preventDefault();
                window.location.href = '/library';
              }
            }}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/library')
                ? 'bg-pink-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="My Library"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            {!isCollapsed && <span>My Library</span>}
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="flex flex-1 flex-col justify-end space-y-1 border-t border-gray-200 p-3">
        <Link
          href="/notifications"
          onClick={(e) => {
            // Force navigation even if already on notifications page
            if (pathname === '/notifications') {
              e.preventDefault();
              window.location.href = '/notifications';
            }
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm ${
            isActive('/notifications')
              ? 'bg-pink-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Notifications"
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {!isCollapsed && <span>Notifications</span>}
        </Link>

        <Link
          href="/profile"
          onClick={(e) => {
            // Force navigation even if already on profile page
            if (pathname === '/profile') {
              e.preventDefault();
              window.location.href = '/profile';
            }
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm ${
            isActive('/profile')
              ? 'bg-pink-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Profile"
        >
          <UserCircle className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Profile</span>}
        </Link>

        <Link
          href="/labs"
          onClick={(e) => {
            // Force navigation even if already on labs page
            if (pathname === '/labs') {
              e.preventDefault();
              window.location.href = '/labs';
            }
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm ${
            isActive('/labs')
              ? 'bg-pink-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Labs"
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          {!isCollapsed && <span>Labs</span>}
        </Link>
        <Link
          href="/feedback"
          onClick={(e) => {
            // Force navigation even if already on feedback page
            if (pathname === '/feedback') {
              e.preventDefault();
              window.location.href = '/feedback';
            }
          }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm ${
            isActive('/feedback')
              ? 'bg-pink-50 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Feedback"
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {!isCollapsed && <span>Feedback</span>}
        </Link>
      </div>
    </aside>
  );
}
