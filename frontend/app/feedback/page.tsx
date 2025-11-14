'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function Feedback() {
  const [feedbackType, setFeedbackType] = useState<
    'bug' | 'feature' | 'improvement' | 'other'
  >('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mock submission
    console.log('Feedback submitted:', {
      feedbackType,
      title,
      description,
      email,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setDescription('');
      setEmail('');
    }, 3000);
  };

  const feedbackTypes = [
    {
      value: 'bug',
      label: 'Bug Report',
      icon: '🐛',
      description: 'Report a bug or issue',
    },
    {
      value: 'feature',
      label: 'Feature Request',
      icon: '💡',
      description: 'Suggest a new feature',
    },
    {
      value: 'improvement',
      label: 'Improvement',
      icon: '⚡',
      description: 'Suggest an improvement',
    },
    {
      value: 'other',
      label: 'Other',
      icon: '💬',
      description: 'General feedback',
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center border-b border-gray-200 bg-white px-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Feedback</h1>
            <p className="text-sm text-gray-600">Help us improve DeepDive</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            {submitted ? (
              /* Success Message */
              <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Thank you!
                </h2>
                <p className="text-gray-600">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            ) : (
              /* Feedback Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type Selection */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    What type of feedback do you have?
                  </label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {feedbackTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFeedbackType(type.value as any)}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                          feedbackType === type.value
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {type.label}
                            </p>
                            <p className="text-sm text-gray-500">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Description */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your feedback..."
                    required
                    rows={8}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {feedbackType === 'bug' &&
                      'Please include steps to reproduce the issue and any error messages.'}
                    {feedbackType === 'feature' &&
                      "Describe the feature you'd like to see and how it would help you."}
                    {feedbackType === 'improvement' &&
                      'Explain what could be improved and why.'}
                    {feedbackType === 'other' &&
                      'Share your thoughts, suggestions, or questions.'}
                  </p>
                </div>

                {/* Email (Optional) */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Email (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Provide your email if you'd like us to follow up with you.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">* Required fields</p>
                  <button
                    type="submit"
                    disabled={!title || !description}
                    className="rounded-lg bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            )}

            {/* Additional Info */}
            {!submitted && (
              <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-6 w-6 flex-shrink-0 text-blue-600"
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
                  <div>
                    <h3 className="mb-1 font-semibold text-blue-900">
                      Your privacy matters
                    </h3>
                    <p className="text-sm text-blue-800">
                      We take your feedback seriously and will use it to improve
                      DeepDive. Your information will never be shared with third
                      parties.
                    </p>
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
