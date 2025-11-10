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
    <aside className={`${isCollapsed ? 'w-16' : 'w-52'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2">
          <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {!isCollapsed && (
            <Link href="/" className="text-lg font-bold text-gray-900">
              DeepDive
            </Link>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Explore"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!isCollapsed && <span>Explore</span>}
          </Link>

          <Link
            href="/library"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/library') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="My Library"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            {!isCollapsed && <span>My Library</span>}
          </Link>

          <Link
            href="/youtube"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/youtube') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="YouTube Transcript"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            {!isCollapsed && <span>YouTube 字幕</span>}
          </Link>

          <Link
            href="/notifications"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/notifications') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Notifications"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {!isCollapsed && <span>Notifications</span>}
          </Link>

          <Link
            href="/profile"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm font-medium rounded-lg ${
              isActive('/profile') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
            title="Profile"
          >
            <div className="w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              P
            </div>
            {!isCollapsed && <span>Profile</span>}
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          href="/labs"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm rounded-lg ${
            isActive('/labs') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Labs"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          {!isCollapsed && <span>Labs</span>}
        </Link>
        <Link
          href="/feedback"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm rounded-lg ${
            isActive('/feedback') ? 'text-gray-900 bg-pink-50' : 'text-gray-700 hover:bg-gray-50'
          }`}
          title="Feedback"
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {!isCollapsed && <span>Feedback</span>}
        </Link>
      </div>
    </aside>
  );
}
