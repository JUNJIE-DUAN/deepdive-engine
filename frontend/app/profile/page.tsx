'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'stats'>('profile');

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-red-600 border-b-2 border-red-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'text-red-600 border-b-2 border-red-600'
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
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-cyan-400 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      P
                    </div>
                    <div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                        Upload Photo
                      </button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={userData.bio}
                        onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Interests */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Research Interests</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {userData.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                        {interest}
                      </span>
                    ))}
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                    + Add Interest
                  </button>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Notifications Settings */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates about your activity</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Recommendation Notifications</p>
                        <p className="text-sm text-gray-500">Get notified about new paper recommendations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.recommendationNotifications}
                          onChange={(e) => setSettings({ ...settings, recommendationNotifications: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Weekly Digest</p>
                        <p className="text-sm text-gray-500">Receive a weekly summary of trending papers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.weeklyDigest}
                          onChange={(e) => setSettings({ ...settings, weeklyDigest: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">Use dark theme across the application</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Bookmarked</p>
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.bookmarked}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Papers Read</p>
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.read}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Shared</p>
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.sharedCount}</p>
                  </div>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-600">Member Since</p>
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{stats.joinedDate}</p>
                  </div>
                </div>

                {/* Activity Chart Placeholder */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Reading Activity</h2>
                  <div className="h-64 flex items-center justify-center text-gray-400">
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
