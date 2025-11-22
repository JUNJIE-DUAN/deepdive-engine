'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, LogIn, UserCircle } from 'lucide-react';
import Link from 'next/link';

interface UserProfileButtonProps {
  isCollapsed?: boolean;
}

/**
 * UserProfileButton - User authentication and profile button
 *
 * Features:
 * - Login button when not authenticated
 * - User avatar with dropdown menu when authenticated
 * - Logout functionality
 * - Adapts to sidebar collapsed/expanded state
 */
export default function UserProfileButton({
  isCollapsed = false,
}: UserProfileButtonProps) {
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
      <div
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm`}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    );
  }

  // Not logged in - show login button
  if (!user) {
    return (
      <button
        onClick={loginWithGoogle}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50`}
        title="Login with Google"
      >
        <LogIn className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && <span>Login</span>}
      </button>
    );
  }

  // Logged in - show user profile with dropdown
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50`}
        title={user.username || user.email}
      >
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username || user.email}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-3.5 w-3.5 text-gray-600" />
          )}
        </div>
        {!isCollapsed && (
          <span className="flex-1 truncate text-left text-gray-900">
            {user.username || user.email.split('@')[0]}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-3">
            <div className="font-medium text-gray-900">
              {user.username || 'User'}
            </div>
            <div className="mt-0.5 truncate text-sm text-gray-500">
              {user.email}
            </div>
          </div>
          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setShowMenu(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <UserCircle className="h-4 w-4" />
              <span>Profile</span>
            </Link>
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
