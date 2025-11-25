'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import { getAuthHeader } from '@/lib/auth';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  displayName: string;
  icon: string;
  color: string;
  apiEndpoint: string;
  apiKey: string | null;
  hasApiKey: boolean;
  isEnabled: boolean;
  isDefault: boolean;
  maxTokens: number;
  temperature: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  success: boolean;
  message: string;
  latency?: number;
}

// Map model names to their icon URLs
const MODEL_ICONS: Record<string, string> = {
  grok: '/icons/ai/grok.svg',
  'gpt-4': '/icons/ai/openai.svg',
  claude: '/icons/ai/claude.svg',
  gemini: '/icons/ai/gemini.svg',
};

// Standard model configurations with defaults
const STANDARD_MODEL_CONFIGS = [
  {
    id: 'grok',
    name: 'Grok',
    provider: 'xAI',
    defaultModelId: 'grok-3-latest',
    defaultEndpoint: 'https://api.x.ai/v1/chat/completions',
    icon: '/icons/ai/grok.svg',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    defaultModelId: 'gpt-4-turbo',
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    icon: '/icons/ai/openai.svg',
  },
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    defaultModelId: 'claude-sonnet-4-20250514',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    icon: '/icons/ai/claude.svg',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    defaultModelId: 'gemini-2.0-flash',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    icon: '/icons/ai/gemini.svg',
  },
] as const;

function getModelIconUrl(modelName: string): string | null {
  const name = modelName.toLowerCase();
  return MODEL_ICONS[name] || null;
}

// Model ID Selector with fetch capability
function ModelIdSelector({
  value,
  onChange,
  provider,
  apiKey,
}: {
  value: string;
  onChange: (modelId: string) => void;
  provider: string;
  apiKey: string;
}) {
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; name: string; description?: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchModels = async () => {
    if (!apiKey) {
      setError('请先输入 API Key');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/fetch-available`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          credentials: 'include',
          body: JSON.stringify({ provider, apiKey }),
        }
      );
      const data = await response.json();
      if (data.success && data.models) {
        setAvailableModels(data.models);
        setShowDropdown(true);
      } else {
        setError(data.error || '获取模型列表失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Model ID <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="gpt-4-turbo"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {showDropdown && availableModels.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id);
                    setShowDropdown(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                >
                  <div className="font-mono font-medium">{model.id}</div>
                  {model.description && (
                    <div className="text-xs text-gray-500">
                      {model.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={fetchModels}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
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
          )}
          获取
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">
        输入 API Key 后点击"获取"按钮可获取可用模型列表
      </p>
    </div>
  );
}

export default function AIModelSettings() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>(
    {}
  );

  // Fetch models from API
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/admin/ai-models`, {
        headers: { ...getAuthHeader() },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setModels(data);
        setError(null);
      } else if (response.status === 401 || response.status === 403) {
        setError('Please sign in as an admin to manage AI models');
      } else {
        setError('Failed to fetch AI models');
      }
    } catch (err) {
      console.error('Failed to fetch AI models:', err);
      setError('Failed to fetch AI models');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (model: AIModel) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          credentials: 'include',
          body: JSON.stringify({ isEnabled: !model.isEnabled }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setModels(models.map((m) => (m.id === model.id ? updated : m)));
        setSuccess(
          `${model.displayName} ${!model.isEnabled ? 'enabled' : 'disabled'}`
        );
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update model:', err);
      setError('Failed to update model');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSetDefault = async (model: AIModel) => {
    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}/set-default`,
        {
          method: 'POST',
          headers: { ...getAuthHeader() },
          credentials: 'include',
        }
      );

      if (response.ok) {
        // Refresh models to get updated default status
        await fetchModels();
        setSuccess(`${model.displayName} set as default`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Failed to set default:', err);
      setError('Failed to set default');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveModel = async (model: AIModel, newApiKey?: string) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        displayName: model.displayName,
        provider: model.provider,
        modelId: model.modelId,
        icon: model.icon,
        color: model.color,
        apiEndpoint: model.apiEndpoint,
        maxTokens: model.maxTokens,
        temperature: model.temperature,
        description: model.description,
      };

      // Only send apiKey if it was changed
      if (newApiKey !== undefined && newApiKey !== '***configured***') {
        updateData.apiKey = newApiKey;
      }

      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          credentials: 'include',
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setModels(models.map((m) => (m.id === model.id ? updated : m)));
        setEditingModel(null);
        setSuccess('Model settings saved');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      setError('Failed to save model settings');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModel = async (
    model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt' | 'hasApiKey'>
  ) => {
    setSaving(true);
    try {
      const response = await fetch(`${config.apiUrl}/admin/ai-models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: 'include',
        body: JSON.stringify(model),
      });

      if (response.ok) {
        const newModel = await response.json();
        setModels([...models, newModel]);
        setShowAddModal(false);
        setSuccess('New model added');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to add');
      }
    } catch (err) {
      setError('Failed to add model');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModel = async (model: AIModel) => {
    if (model.isDefault) {
      setError('Cannot delete the default model');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm(`Are you sure you want to delete ${model.displayName}?`))
      return;

    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}`,
        {
          method: 'DELETE',
          headers: { ...getAuthHeader() },
          credentials: 'include',
        }
      );

      if (response.ok) {
        setModels(models.filter((m) => m.id !== model.id));
        setSuccess('Model deleted');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to delete model');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleTestConnection = async (model: AIModel) => {
    setTestingModel(model.id);
    setTestResults((prev) => ({
      ...prev,
      [model.id]: { success: false, message: 'Testing...' },
    }));

    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}/test`,
        {
          method: 'POST',
          headers: { ...getAuthHeader() },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const result = await response.json();
        setTestResults((prev) => ({
          ...prev,
          [model.id]: {
            success: result.success,
            message: result.message,
            latency: result.latency,
          },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [model.id]: { success: false, message: 'Test request failed' },
        }));
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [model.id]: { success: false, message: 'Connection error' },
      }));
    } finally {
      setTestingModel(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            AI Model Configuration
          </h2>
          <p className="text-sm text-gray-500">
            Configure AI models, API keys, and test connections
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Model
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Models Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {models.map((model) => (
          <div
            key={model.id}
            className={`rounded-xl border-2 bg-white p-5 shadow-sm transition-all ${
              model.isDefault ? 'border-blue-500' : 'border-gray-200'
            } ${!model.isEnabled ? 'opacity-60' : ''}`}
          >
            {/* Model Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${model.color} text-2xl text-white shadow-sm`}
                >
                  {(() => {
                    const iconUrl = getModelIconUrl(model.name);
                    return iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={model.displayName}
                        className="h-8 w-8"
                      />
                    ) : (
                      model.icon
                    );
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {model.displayName}
                    </h3>
                    {model.isDefault && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{model.provider}</p>
                </div>
              </div>

              {/* Enable/Disable Toggle */}
              <button
                onClick={() => handleToggleEnabled(model)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  model.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    model.isEnabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Model Info */}
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Model ID:</span>
                <span className="font-mono text-gray-700">{model.modelId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">API Key:</span>
                <span
                  className={`font-mono ${model.hasApiKey ? 'text-green-600' : 'text-red-500'}`}
                >
                  {model.hasApiKey ? '✓ Configured' : '✗ Not configured'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Max Tokens:</span>
                <span className="text-gray-700">{model.maxTokens}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Temperature:</span>
                <span className="text-gray-700">{model.temperature}</span>
              </div>
            </div>

            {/* Test Result */}
            {testResults[model.id] && (
              <div
                className={`mb-4 rounded-lg p-3 text-sm ${
                  testResults[model.id].success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{testResults[model.id].message}</span>
                  {testResults[model.id].latency && (
                    <span className="font-mono text-xs">
                      {testResults[model.id].latency}ms
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {model.description && (
              <p className="mb-4 text-sm text-gray-600">{model.description}</p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Test Connection */}
              <button
                onClick={() => handleTestConnection(model)}
                disabled={testingModel === model.id || !model.isEnabled}
                className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testingModel === model.id ? (
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
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
                )}
                Test
              </button>

              {!model.isDefault && model.isEnabled && (
                <button
                  onClick={() => handleSetDefault(model)}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => setEditingModel(model)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteModel(model)}
                disabled={model.isDefault}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingModel && (
        <EditModelModal
          model={editingModel}
          onSave={handleSaveModel}
          onClose={() => setEditingModel(null)}
          saving={saving}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddModelModal
          onAdd={handleAddModel}
          onClose={() => setShowAddModal(false)}
          saving={saving}
        />
      )}
    </div>
  );
}

// Edit Model Modal
function EditModelModal({
  model,
  onSave,
  onClose,
  saving,
}: {
  model: AIModel;
  onSave: (model: AIModel, newApiKey?: string) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState(model);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Edit {model.displayName}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model ID
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) =>
                setFormData({ ...formData, modelId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Endpoint
            </label>
            <input
              type="text"
              value={formData.apiEndpoint}
              onChange={(e) =>
                setFormData({ ...formData, apiEndpoint: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key{' '}
              {model.hasApiKey && (
                <span className="text-green-600">(configured)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  model.hasApiKey
                    ? 'Enter new key to update...'
                    : 'Enter API key...'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showApiKey ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to keep existing key. Enter new value to update.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData, apiKey || undefined)}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Model Modal
function AddModelModal({
  onAdd,
  onClose,
  saving,
}: {
  onAdd: (
    model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt' | 'hasApiKey'>
  ) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    modelId: '',
    displayName: '',
    icon: '',
    color: 'from-gray-500 to-gray-600',
    apiEndpoint: '',
    apiKey: null as string | null,
    isEnabled: true,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    description: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const colorOptions = [
    { value: 'from-blue-500 to-blue-600', label: 'Blue' },
    { value: 'from-green-500 to-green-600', label: 'Green' },
    { value: 'from-orange-500 to-orange-600', label: 'Orange' },
    { value: 'from-purple-500 to-purple-600', label: 'Purple' },
    { value: 'from-red-500 to-red-600', label: 'Red' },
    { value: 'from-pink-500 to-pink-600', label: 'Pink' },
    { value: 'from-indigo-500 to-indigo-600', label: 'Indigo' },
    { value: 'from-gray-500 to-gray-600', label: 'Gray' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Add New AI Model
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.name}
              onChange={(e) => {
                const selected = STANDARD_MODEL_CONFIGS.find(
                  (m) => m.id === e.target.value
                );
                if (selected) {
                  setFormData({
                    ...formData,
                    name: selected.id,
                    displayName: selected.name,
                    provider: selected.provider,
                    modelId: selected.defaultModelId,
                    apiEndpoint: selected.defaultEndpoint,
                    icon: selected.icon,
                  });
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a model type...</option>
              {STANDARD_MODEL_CONFIGS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              选择后会自动填充默认配置
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="Auto-filled from model type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Provider
              </label>
              <input
                type="text"
                value={formData.provider}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
            </div>
          </div>

          {/* API Configuration Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-blue-800">
              API 配置
            </h4>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  API Endpoint <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apiEndpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, apiEndpoint: e.target.value })
                  }
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  API Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKey: e.target.value || null,
                      })
                    }
                    placeholder="sk-..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <ModelIdSelector
                value={formData.modelId}
                onChange={(modelId) => setFormData({ ...formData, modelId })}
                provider={formData.provider}
                apiKey={formData.apiKey || ''}
              />
            </div>
          </div>

          {/* Display Settings - Collapsed */}
          <details className="rounded-lg border border-gray-200">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              显示设置（可选）
            </summary>
            <div className="space-y-3 border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Icon Path
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="/icons/ai/grok.svg"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {colorOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </details>

          {/* Advanced Settings - Collapsed */}
          <details className="rounded-lg border border-gray-200">
            <summary className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              高级设置（可选）
            </summary>
            <div className="space-y-3 border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxTokens: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() =>
                onAdd({
                  ...formData,
                  apiKey: formData.apiKey || null,
                } as any)
              }
              disabled={saving || !formData.name || !formData.apiKey}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '添加模型'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
