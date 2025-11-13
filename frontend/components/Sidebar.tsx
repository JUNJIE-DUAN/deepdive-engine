'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

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
        <div className="flex items-center gap-2">
          <svg
            className="h-8 w-8 flex-shrink-0"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Neural network nodes */}
            <circle cx="24" cy="8" r="2.5" fill="url(#gradient1)" />
            <circle cx="16" cy="16" r="2.5" fill="url(#gradient1)" />
            <circle cx="32" cy="16" r="2.5" fill="url(#gradient1)" />
            <circle cx="12" cy="24" r="2.5" fill="url(#gradient2)" />
            <circle cx="24" cy="24" r="3" fill="url(#gradient2)" />
            <circle cx="36" cy="24" r="2.5" fill="url(#gradient2)" />
            <circle cx="16" cy="32" r="2.5" fill="url(#gradient3)" />
            <circle cx="32" cy="32" r="2.5" fill="url(#gradient3)" />
            <circle cx="24" cy="40" r="3" fill="url(#gradient3)" />

            {/* Connecting lines with gradient */}
            <line
              x1="24"
              y1="8"
              x2="16"
              y2="16"
              stroke="url(#gradient1)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="24"
              y1="8"
              x2="32"
              y2="16"
              stroke="url(#gradient1)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="16"
              y1="16"
              x2="12"
              y2="24"
              stroke="url(#gradient2)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="16"
              y1="16"
              x2="24"
              y2="24"
              stroke="url(#gradient2)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="32"
              y1="16"
              x2="24"
              y2="24"
              stroke="url(#gradient2)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="32"
              y1="16"
              x2="36"
              y2="24"
              stroke="url(#gradient2)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="12"
              y1="24"
              x2="16"
              y2="32"
              stroke="url(#gradient3)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="24"
              y1="24"
              x2="16"
              y2="32"
              stroke="url(#gradient3)"
              strokeWidth="2"
              opacity="0.8"
            />
            <line
              x1="24"
              y1="24"
              x2="32"
              y2="32"
              stroke="url(#gradient3)"
              strokeWidth="2"
              opacity="0.8"
            />
            <line
              x1="24"
              y1="24"
              x2="24"
              y2="40"
              stroke="url(#gradient3)"
              strokeWidth="2.5"
              opacity="0.9"
            />
            <line
              x1="36"
              y1="24"
              x2="32"
              y2="32"
              stroke="url(#gradient3)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="16"
              y1="32"
              x2="24"
              y2="40"
              stroke="url(#gradient3)"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <line
              x1="32"
              y1="32"
              x2="24"
              y2="40"
              stroke="url(#gradient3)"
              strokeWidth="1.5"
              opacity="0.6"
            />

            {/* Gradient definitions */}
            <defs>
              <linearGradient
                id="gradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient
                id="gradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient
                id="gradient3"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
          </svg>
          {!isCollapsed && (
            <Link
              href="/"
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-lg font-bold text-transparent"
            >
              DeepDive
            </Link>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <Link
            href="/"
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
            href="/youtube"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/youtube')
                ? 'bg-pink-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="YouTube"
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            {!isCollapsed && <span>YouTube</span>}
          </Link>

          <Link
            href="/library"
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

          <Link
            href="/notifications"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
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
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2.5 text-sm font-medium ${
              isActive('/profile')
                ? 'bg-pink-50 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Profile"
          >
            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400 text-xs font-bold text-white">
              P
            </div>
            {!isCollapsed && <span>Profile</span>}
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="space-y-1 border-t border-gray-200 p-3">
        <Link
          href="/labs"
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
