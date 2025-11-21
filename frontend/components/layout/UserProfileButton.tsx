'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, LogIn } from 'lucide-react';

/**
 * UserProfileButton - User authentication and profile button
 *
 * Features:
 * - Login button when not authenticated
 * - User avatar with dropdown menu when authenticated
 * - Logout functionality
 */
export default function UserProfileButton() {
  const { user, loginWithGoogle, logout, isLoading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 sm:h-10 sm:w-10">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={loginWithGoogle}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:px-4"
        title="Login with Google"
      >
        <LogIn className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline">Login</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-white transition-colors hover:border-gray-400 sm:h-10 sm:w-10"
        title={user.username || user.email}
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username || user.email}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-3">
            <div className="font-medium text-gray-900">
              {user.username || 'User'}
            </div>
            <div className="mt-0.5 truncate text-sm text-gray-500">
              {user.email}
            </div>
          </div>
          <div className="p-1">
            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
