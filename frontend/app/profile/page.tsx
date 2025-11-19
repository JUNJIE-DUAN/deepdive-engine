'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';

function ProfileContent() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'stats'>(
    'profile'
  );

  // Mock user data
  const [userData, setUserData] = useState({
    name: 'DeepDive User',
    email: 'user@deepdive.ai',
    bio: 'AI researcher and enthusiast',
    interests: ['Machine Learning', 'Computer Vision', 'NLP', 'Robotics'],
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    recommendationNotifications: true,
    weeklyDigest: false,
    darkMode: false,
    language: 'en',
  });

  // Mock stats
  const stats = {
    bookmarked: 15,
    read: 42,
    sharedCount: 8,
    joinedDate: 'November 2024',
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Profile & Settings
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl">
            {/* Tabs */}
            <div className="mb-6 flex items-center gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-red-600 text-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Statistics
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Profile Picture
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-3xl font-bold text-white">
                      P
                    </div>
                    <div>
                      <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
                        Upload Photo
                      </button>
                      <p className="mt-2 text-xs text-gray-500">
                        JPG, PNG or GIF. Max size 2MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Basic Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) =>
                          setUserData({ ...userData, name: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) =>
                          setUserData({ ...userData, email: e.target.value })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Bio
                      </label>
                      <textarea
                        value={userData.bio}
                        onChange={(e) =>
                          setUserData({ ...userData, bio: e.target.value })
                        }
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Research Interests
                  </h2>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {userData.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                  <button className="text-sm font-medium text-red-600 hover:text-red-700">
                    + Add Interest
                  </button>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Notifications Settings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Email Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive email updates about your activity
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              emailNotifications: e.target.checked,
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Recommendation Notifications
                        </p>
                        <p className="text-sm text-gray-500">
                          Get notified about new paper recommendations
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings.recommendationNotifications}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              recommendationNotifications: e.target.checked,
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Weekly Digest
                        </p>
                        <p className="text-sm text-gray-500">
                          Receive a weekly summary of trending papers
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings.weeklyDigest}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              weeklyDigest: e.target.checked,
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">
                          Use dark theme across the application
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              darkMode: e.target.checked,
                            })
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
                      </label>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Language
                      </label>
                      <select
                        value={settings.language}
                        onChange={(e) =>
                          setSettings({ ...settings, language: e.target.value })
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button className="rounded-lg bg-red-600 px-6 py-2 font-medium text-white transition-colors hover:bg-red-700">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Bookmarked
                      </p>
                      <svg
                        className="h-5 w-5 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.bookmarked}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Papers Read
                      </p>
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.read}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Shared
                      </p>
                      <svg
                        className="h-5 w-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.sharedCount}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-600">
                        Member Since
                      </p>
                      <svg
                        className="h-5 w-5 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {stats.joinedDate}
                    </p>
                  </div>
                </div>

                {/* Activity Chart Placeholder */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold">
                    Reading Activity
                  </h2>
                  <div className="flex h-64 items-center justify-center text-gray-400">
                    <p>Activity chart coming soon...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Profile() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return <ProfileContent />;
}
