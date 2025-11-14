'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';

interface Notification {
  id: string;
  type: 'system' | 'recommendation' | 'update' | 'achievement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export default function Notifications() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Mock notifications data
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'recommendation',
      title: 'New paper recommendation',
      message:
        'Based on your interests, we found "Attention Is All You Need" that might interest you.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/',
    },
    {
      id: '2',
      type: 'update',
      title: 'Resource updated',
      message: 'A paper you bookmarked has been updated with new content.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'achievement',
      title: 'Milestone reached!',
      message: "Congratulations! You've bookmarked 10 papers.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '4',
      type: 'system',
      title: 'Welcome to DeepDive',
      message:
        'Explore AI papers, projects, and news from multiple platforms in one place.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter((n) => !n.read);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        );
      case 'achievement':
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-5 w-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600">
              {unreadCount} unread notifications
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  filter === 'unread'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-lg px-4 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Mark all as read
              </button>
            )}
          </div>
        </header>

        {/* Notifications List */}
        <main className="flex-1 overflow-y-auto p-6">
          {filteredNotifications.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <svg
                className="mb-4 h-24 w-24 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h2 className="mb-2 text-xl font-semibold text-gray-700">
                No notifications
              </h2>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border bg-white p-4 transition-shadow hover:shadow-md ${
                    !notification.read
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    {getNotificationIcon(notification.type)}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                          {notification.title}
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-red-600"></span>
                          )}
                        </h3>
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-gray-600">
                        {notification.message}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="text-sm font-medium text-red-600 hover:text-red-700"
                          >
                            View
                          </Link>
                        )}
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-sm font-medium text-gray-600 hover:text-gray-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
