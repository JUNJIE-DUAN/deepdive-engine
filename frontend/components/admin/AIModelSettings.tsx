'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  displayName: string;
  icon: string;
  color: string;
  apiKeyEnvVar: string;
  apiEndpoint: string;
  isEnabled: boolean;
  isDefault: boolean;
  maxTokens: number;
  temperature: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const defaultModels: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'grok',
    provider: 'xAI',
    modelId: 'grok-beta',
    displayName: 'Grok',
    icon: '⚡',
    color: 'from-blue-500 to-blue-600',
    apiKeyEnvVar: 'XAI_API_KEY',
    apiEndpoint: 'https://api.x.ai/v1/chat/completions',
    isEnabled: true,
    isDefault: true,
    maxTokens: 4096,
    temperature: 0.7,
    description: 'xAI Grok - Fast and capable AI assistant',
  },
  {
    name: 'gpt-4',
    provider: 'OpenAI',
    modelId: 'gpt-4-turbo-preview',
    displayName: 'GPT-4',
    icon: '🧠',
    color: 'from-green-500 to-green-600',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    isEnabled: true,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    description: 'OpenAI GPT-4 Turbo - Most capable model',
  },
  {
    name: 'claude',
    provider: 'Anthropic',
    modelId: 'claude-3-opus-20240229',
    displayName: 'Claude',
    icon: '🎭',
    color: 'from-orange-500 to-orange-600',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    isEnabled: true,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    description: 'Anthropic Claude 3 Opus - Best for analysis',
  },
  {
    name: 'gemini',
    provider: 'Google',
    modelId: 'gemini-2.0-flash-exp',
    displayName: 'Gemini',
    icon: '✨',
    color: 'from-purple-500 to-purple-600',
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    isEnabled: true,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    description: 'Google Gemini 2.0 Flash - Fast multimodal model',
  },
];

export default function AIModelSettings() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string; latency?: number }>
  >({});

  // Fetch models
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/admin/ai-models`);
      if (response.ok) {
        const data = await response.json();
        setModels(data);
      } else {
        // If API returns 404 or error, use default models
        setModels(
          defaultModels.map((m, i) => ({
            ...m,
            id: `default-${i}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch AI models:', err);
      // Use default models on error
      setModels(
        defaultModels.map((m, i) => ({
          ...m,
          id: `default-${i}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (model: AIModel) => {
    const updated = { ...model, isEnabled: !model.isEnabled };
    setModels(models.map((m) => (m.id === model.id ? updated : m)));

    try {
      await fetch(`${config.apiUrl}/admin/ai-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: updated.isEnabled }),
      });
      setSuccess(
        `${model.displayName} ${updated.isEnabled ? 'enabled' : 'disabled'}`
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update model:', err);
    }
  };

  const handleSetDefault = async (model: AIModel) => {
    const updatedModels = models.map((m) => ({
      ...m,
      isDefault: m.id === model.id,
    }));
    setModels(updatedModels);

    try {
      await fetch(`${config.apiUrl}/admin/ai-models/${model.id}/set-default`, {
        method: 'POST',
      });
      setSuccess(`${model.displayName} set as default`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  const handleSaveModel = async (model: AIModel) => {
    setSaving(true);
    try {
      const response = await fetch(
        `${config.apiUrl}/admin/ai-models/${model.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(model),
        }
      );

      if (response.ok) {
        setModels(models.map((m) => (m.id === model.id ? model : m)));
        setEditingModel(null);
        setSuccess('Model settings saved');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to save model settings');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModel = async (
    model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    setSaving(true);
    try {
      const response = await fetch(`${config.apiUrl}/admin/ai-models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      });

      if (response.ok) {
        const newModel = await response.json();
        setModels([...models, newModel]);
        setShowAddModal(false);
        setSuccess('New model added');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to add model');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModel = async (model: AIModel) => {
    if (!confirm(`Are you sure you want to delete ${model.displayName}?`))
      return;

    try {
      await fetch(`${config.apiUrl}/admin/ai-models/${model.id}`, {
        method: 'DELETE',
      });
      setModels(models.filter((m) => m.id !== model.id));
      setSuccess('Model deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete model');
      setTimeout(() => setError(null), 3000);
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
            Configure available AI models and their settings
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
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${model.color} text-2xl text-white shadow-sm`}
                >
                  {model.icon}
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
                <span className="font-mono text-gray-700">
                  {model.apiKeyEnvVar}
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

            {/* Description */}
            <p className="mb-4 text-sm text-gray-600">{model.description}</p>

            {/* Actions */}
            <div className="flex gap-2">
              {!model.isDefault && model.isEnabled && (
                <button
                  onClick={() => handleSetDefault(model)}
                  className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Set as Default
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
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
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
  onSave: (model: AIModel) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState(model);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
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
              value={formData.description}
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
            onClick={() => onSave(formData)}
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
  onAdd: (model: Omit<AIModel, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    modelId: '',
    displayName: '',
    icon: '🤖',
    color: 'from-gray-500 to-gray-600',
    apiKeyEnvVar: '',
    apiEndpoint: '',
    isEnabled: true,
    isDefault: false,
    maxTokens: 4096,
    temperature: 0.7,
    description: '',
  });

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Name (ID)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., gpt-4o"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
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
                placeholder="e.g., GPT-4o"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Provider
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="e.g., OpenAI"
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
                placeholder="e.g., gpt-4o-2024-05-13"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Icon (Emoji)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key Environment Variable
            </label>
            <input
              type="text"
              value={formData.apiKeyEnvVar}
              onChange={(e) =>
                setFormData({ ...formData, apiKeyEnvVar: e.target.value })
              }
              placeholder="e.g., OPENAI_API_KEY"
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
              placeholder="e.g., https://api.openai.com/v1/chat/completions"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
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
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
              placeholder="Brief description of the model..."
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
            onClick={() => onAdd(formData)}
            disabled={saving || !formData.name || !formData.displayName}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Model'}
          </button>
        </div>
      </div>
    </div>
  );
}
