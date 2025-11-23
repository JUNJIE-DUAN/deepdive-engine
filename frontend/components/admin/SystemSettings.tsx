'use client';

import { useState } from 'react';
import { Server, Database, Bell, Mail, Globe, Save } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    apiCacheEnabled: true,
    apiCacheDuration: 3600,
    maxConcurrentCrawlers: 10,
    crawlerTimeout: 300,
    emailNotifications: true,
    notificationEmail: 'admin@example.com',
    webhookUrl: '',
    defaultLanguage: 'en',
  });

  const handleSave = async () => {
    // TODO: Implement save logic
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6 p-8">
      {/* API Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2">
            <Server className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">API Settings</h3>
            <p className="text-sm text-gray-500">
              Configure API behavior and caching
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">
                Enable Caching
              </label>
              <p className="text-sm text-gray-500">
                Cache API responses to improve performance
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  apiCacheEnabled: !settings.apiCacheEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.apiCacheEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.apiCacheEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cache Duration (seconds)
            </label>
            <input
              type="number"
              value={settings.apiCacheDuration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  apiCacheDuration: parseInt(e.target.value),
                })
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Crawler Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Database className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Crawler Settings</h3>
            <p className="text-sm text-gray-500">
              Configure crawler behavior and limits
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Concurrent Crawlers
            </label>
            <input
              type="number"
              value={settings.maxConcurrentCrawlers}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxConcurrentCrawlers: parseInt(e.target.value),
                })
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum number of crawlers that can run simultaneously
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.crawlerTimeout}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  crawlerTimeout: parseInt(e.target.value),
                })
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Timeout for crawler requests
            </p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2">
            <Bell className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <p className="text-sm text-gray-500">
              Configure notification preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive email alerts for important events
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  emailNotifications: !settings.emailNotifications,
                })
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Mail className="mb-1 inline h-4 w-4" /> Notification Email
            </label>
            <input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) =>
                setSettings({ ...settings, notificationEmail: e.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={settings.webhookUrl}
              onChange={(e) =>
                setSettings({ ...settings, webhookUrl: e.target.value })
              }
              placeholder="https://example.com/webhook"
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Receive webhook notifications for events
            </p>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-100 p-2">
            <Globe className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">General</h3>
            <p className="text-sm text-gray-500">General system preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Language
            </label>
            <select
              value={settings.defaultLanguage}
              onChange={(e) =>
                setSettings({ ...settings, defaultLanguage: e.target.value })
              }
              className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30"
        >
          <Save className="h-4 w-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
