'use client';

/**
 * AI Image Generator Component
 * 参考 Google ImageFX 的简洁设计风格
 * - 支持多种输入：提示词、URL、文本内容、文件上传
 * - 双模型选择：文本模型（优化提示词）+ 图片模型（生成图片）
 * - 自动从配置加载可用模型
 * - 支持拖放文件上传
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { config } from '@/lib/config';
import { getAuthHeader } from '@/lib/auth';

interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  imageUrl: string;
  createdAt: string;
  width: number;
  height: number;
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  icon?: string;
  isDefault: boolean;
}

interface ModelsResponse {
  textModels: AIModel[];
  imageModels: AIModel[];
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

type InputMode = 'prompt' | 'url' | 'content' | 'files';

export default function ImageGenerator() {
  // 输入状态
  const [inputMode, setInputMode] = useState<InputMode>('prompt');
  const [prompt, setPrompt] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);
  const [content, setContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // 模型状态
  const [models, setModels] = useState<ModelsResponse>({
    textModels: [],
    imageModels: [],
  });
  const [selectedTextModelId, setSelectedTextModelId] = useState<string>('');
  const [selectedImageModelId, setSelectedImageModelId] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [skipEnhancement, setSkipEnhancement] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取可用模型
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/ai-image/models`,
        { headers: { ...getAuthHeader() } }
      );

      if (response.ok) {
        const data: ModelsResponse = await response.json();
        setModels(data);

        // 设置默认模型
        const defaultTextModel =
          data.textModels.find((m) => m.isDefault) || data.textModels[0];
        const defaultImageModel =
          data.imageModels.find((m) => m.isDefault) || data.imageModels[0];

        if (defaultTextModel) setSelectedTextModelId(defaultTextModel.id);
        if (defaultImageModel) setSelectedImageModelId(defaultImageModel.id);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Expressive chips
  const expressiveChips = [
    { label: 'cinematic lighting', category: 'lighting' },
    { label: 'golden hour', category: 'lighting' },
    { label: 'studio lighting', category: 'lighting' },
    { label: 'dramatic shadows', category: 'lighting' },
    { label: 'macro shot', category: 'angle' },
    { label: 'aerial view', category: 'angle' },
    { label: 'close-up portrait', category: 'angle' },
    { label: 'wide angle', category: 'angle' },
  ];

  // 添加URL输入
  const addUrlInput = () => {
    setUrls([...urls, '']);
  };

  // 移除URL输入
  const removeUrlInput = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  // 更新URL
  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // 文件处理函数
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      // 支持的文件类型
      const supportedTypes = [
        'text/plain',
        'text/markdown',
        'text/html',
        'application/json',
        'application/pdf',
        'text/vtt',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      const supportedExtensions = [
        '.txt',
        '.md',
        '.html',
        '.json',
        '.pdf',
        '.srt',
        '.vtt',
      ];
      const isSupported =
        supportedTypes.includes(file.type) ||
        supportedExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        ) ||
        file.type.startsWith('image/');

      if (isSupported && file.size <= 50 * 1024 * 1024) {
        const uploadedFile: UploadedFile = {
          file,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        // 为图片创建预览
        if (file.type.startsWith('image/')) {
          uploadedFile.preview = URL.createObjectURL(file);
        }

        newFiles.push(uploadedFile);
      }
    });

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // 拖放处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 获取文件图标
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    if (file.type === 'application/pdf') {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  };

  // 获取当前输入内容
  const getCurrentInput = () => {
    switch (inputMode) {
      case 'prompt':
        return prompt.trim();
      case 'url':
        return urls.filter((u) => u.trim()).join('\n');
      case 'content':
        return content.trim();
      case 'files':
        return uploadedFiles.map((f) => f.file.name).join(', ');
      default:
        return '';
    }
  };

  // 检查是否有有效输入
  const hasValidInput = () => {
    switch (inputMode) {
      case 'prompt':
        return prompt.trim().length > 0;
      case 'url':
        return urls.some((u) => u.trim().length > 0);
      case 'content':
        return content.trim().length > 0;
      case 'files':
        return uploadedFiles.length > 0;
      default:
        return false;
    }
  };

  // 生成图片
  const handleGenerate = async () => {
    if (!hasValidInput() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // 如果是文件上传模式，使用 FormData
      if (inputMode === 'files' && uploadedFiles.length > 0) {
        const formData = new FormData();

        // 添加文件
        uploadedFiles.forEach((uf) => {
          formData.append('files', uf.file);
        });

        // 添加其他参数
        if (!skipEnhancement && selectedTextModelId) {
          formData.append('textModelId', selectedTextModelId);
        }
        if (selectedImageModelId) {
          formData.append('imageModelId', selectedImageModelId);
        }
        formData.append('skipEnhancement', String(skipEnhancement));

        const response = await fetch(
          `${config.apiBaseUrl}/api/v1/ai-image/generate-with-files`,
          {
            method: 'POST',
            headers: {
              ...getAuthHeader(),
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to generate image');
        }

        const data = await response.json();
        const newImage: GeneratedImage = {
          id: data.id || Date.now().toString(),
          prompt: data.prompt || getCurrentInput(),
          enhancedPrompt: data.enhancedPrompt,
          imageUrl: data.imageUrl,
          createdAt: new Date().toISOString(),
          width: data.width || 1024,
          height: data.height || 1024,
        };

        setGeneratedImages((prev) => [newImage, ...prev]);
        setSelectedImage(newImage);
        return;
      }

      // 其他模式使用 JSON
      const requestBody: Record<string, unknown> = {
        textModelId: skipEnhancement ? undefined : selectedTextModelId,
        imageModelId: selectedImageModelId,
        skipEnhancement,
      };

      // 根据输入模式设置请求体
      switch (inputMode) {
        case 'prompt':
          requestBody.prompt = prompt.trim();
          break;
        case 'url':
          // 支持多个URL
          requestBody.urls = urls.filter((u) => u.trim());
          break;
        case 'content':
          requestBody.content = content.trim();
          break;
      }

      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/ai-image/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      const newImage: GeneratedImage = {
        id: data.id || Date.now().toString(),
        prompt: data.prompt || getCurrentInput(),
        enhancedPrompt: data.enhancedPrompt,
        imageUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
        width: data.width || 1024,
        height: data.height || 1024,
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (err) {
      console.error('Image generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && inputMode === 'prompt') {
      e.preventDefault();
      handleGenerate();
    }
  };

  const addChipToPrompt = (chip: string) => {
    const currentPrompt = prompt.trim();
    if (
      currentPrompt &&
      !currentPrompt.toLowerCase().includes(chip.toLowerCase())
    ) {
      setPrompt(`${currentPrompt}, ${chip}`);
    } else if (!currentPrompt) {
      setPrompt(chip);
    }
    inputRef.current?.focus();
  };

  const handleDownload = async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-image-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const getSelectedTextModel = () =>
    models.textModels.find((m) => m.id === selectedTextModelId);
  const getSelectedImageModel = () =>
    models.imageModels.find((m) => m.id === selectedImageModelId);

  return (
    <div className="flex h-full flex-col bg-[#1a1a2e]">
      {/* Model Selectors - Top Bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-6 py-3">
        {/* Text Model Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Text Model:</span>
          {isLoadingModels ? (
            <div className="h-7 w-36 animate-pulse rounded bg-white/10"></div>
          ) : models.textModels.length > 0 ? (
            <select
              value={selectedTextModelId}
              onChange={(e) => setSelectedTextModelId(e.target.value)}
              className="rounded bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              disabled={isGenerating || skipEnhancement}
            >
              {models.textModels.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  className="bg-[#1a1a2e]"
                >
                  {model.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-yellow-400">No text models</span>
          )}
        </div>

        {/* Image Model Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Image Model:</span>
          {isLoadingModels ? (
            <div className="h-7 w-36 animate-pulse rounded bg-white/10"></div>
          ) : models.imageModels.length > 0 ? (
            <select
              value={selectedImageModelId}
              onChange={(e) => setSelectedImageModelId(e.target.value)}
              className="rounded bg-white/10 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              disabled={isGenerating}
            >
              {models.imageModels.map((model) => (
                <option
                  key={model.id}
                  value={model.id}
                  className="bg-[#1a1a2e]"
                >
                  {model.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-yellow-400">No image models</span>
          )}
        </div>

        {/* Skip Enhancement Toggle */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={skipEnhancement}
            onChange={(e) => setSkipEnhancement(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-gray-600 bg-transparent text-purple-500 focus:ring-purple-500/50"
            disabled={isGenerating}
          />
          <span className="text-xs text-gray-400">Skip prompt enhancement</span>
        </label>

        {/* Refresh Button */}
        <button
          onClick={fetchModels}
          disabled={isLoadingModels}
          className="ml-auto rounded p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          title="Refresh models"
        >
          <svg
            className={`h-4 w-4 ${isLoadingModels ? 'animate-spin' : ''}`}
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
        </button>
      </div>

      {/* Main Image Display Area */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6">
        {selectedImage ? (
          <div className="relative max-h-full max-w-full">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="max-h-[50vh] rounded-2xl object-contain shadow-2xl"
            />
            {/* Enhanced Prompt Display */}
            {selectedImage.enhancedPrompt && (
              <div className="absolute left-4 top-4 max-w-[300px] rounded-lg bg-black/70 p-3 backdrop-blur-sm">
                <p className="text-xs text-gray-400">Enhanced prompt:</p>
                <p className="mt-1 line-clamp-3 text-xs text-white">
                  {selectedImage.enhancedPrompt}
                </p>
              </div>
            )}
            {/* Image Actions */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => handleDownload(selectedImage)}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md transition hover:bg-white/20"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
          </div>
        ) : isGenerating ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-500"></div>
              <div
                className="absolute inset-3 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500"
                style={{
                  animationDirection: 'reverse',
                  animationDuration: '1.5s',
                }}
              ></div>
            </div>
            <div className="text-center">
              <p className="text-lg text-gray-400">Creating your image...</p>
              {!skipEnhancement && getSelectedTextModel() && (
                <p className="mt-1 text-sm text-gray-500">
                  Enhancing prompt with {getSelectedTextModel()?.name}
                </p>
              )}
              {getSelectedImageModel() && (
                <p className="mt-1 text-sm text-gray-500">
                  Generating with {getSelectedImageModel()?.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex max-w-xl flex-col items-center gap-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <svg
                className="h-12 w-12 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="mb-2 text-2xl font-semibold text-white">
                Create with AI
              </h2>
              <p className="text-gray-400">
                Describe, paste URLs, or add content to generate images
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="border-t border-white/10 px-6 py-3">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {generatedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg transition ${
                  selectedImage?.id === img.id
                    ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#1a1a2e]'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Mode Tabs */}
      <div className="border-t border-white/10 px-6 pt-3">
        <div className="flex gap-1">
          {[
            {
              mode: 'prompt' as InputMode,
              label: 'Prompt',
              icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            },
            {
              mode: 'url' as InputMode,
              label: 'URLs',
              icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
            },
            {
              mode: 'content' as InputMode,
              label: 'Content',
              icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            },
            {
              mode: 'files' as InputMode,
              label: 'Files',
              icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
            },
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => setInputMode(mode)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition ${
                inputMode === mode
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={icon}
                />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expressive Chips (only for prompt mode) */}
      {inputMode === 'prompt' && (
        <div className="border-t border-white/10 px-6 py-2">
          <div className="flex flex-wrap gap-1.5">
            {expressiveChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => addChipToPrompt(chip.label)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  prompt.toLowerCase().includes(chip.label.toLowerCase())
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="mb-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Prompt Input */}
          {inputMode === 'prompt' && (
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2 ring-1 ring-white/10 focus-within:ring-purple-500/50">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to create..."
                className="flex-1 bg-transparent px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerate}
                disabled={
                  !hasValidInput() ||
                  isGenerating ||
                  models.imageModels.length === 0
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* URL Input */}
          {inputMode === 'url' && (
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 focus-within:ring-purple-500/50">
                    <svg
                      className="mr-2 h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder="https://example.com/article..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      disabled={isGenerating}
                    />
                  </div>
                  {urls.length > 1 && (
                    <button
                      onClick={() => removeUrlInput(index)}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-white/10 hover:text-white"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2">
                <button
                  onClick={addUrlInput}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  <svg
                    className="h-3.5 w-3.5"
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
                  Add URL
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={handleGenerate}
                  disabled={
                    !hasValidInput() ||
                    isGenerating ||
                    models.imageModels.length === 0
                  }
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  )}
                  Generate
                </button>
              </div>
            </div>
          )}

          {/* Content Input */}
          {inputMode === 'content' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10 focus-within:ring-purple-500/50">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste article content, paper abstract, video subtitles, or any text..."
                  className="h-32 w-full resize-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  disabled={isGenerating}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={
                    !hasValidInput() ||
                    isGenerating ||
                    models.imageModels.length === 0
                  }
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  )}
                  Generate Image
                </button>
              </div>
            </div>
          )}

          {/* Files Input */}
          {inputMode === 'files' && (
            <div className="space-y-3">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.html,.json,.pdf,.srt,.vtt,image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />

              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/20 bg-white/5 hover:border-purple-500/50 hover:bg-white/10'
                }`}
              >
                <svg
                  className={`mb-2 h-8 w-8 ${isDragging ? 'text-purple-400' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm text-gray-400">
                  {isDragging
                    ? 'Drop files here'
                    : 'Click or drag files to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  PDF, TXT, MD, HTML, JSON, SRT, VTT, Images (max 50MB)
                </p>
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedFiles.map((uf) => (
                    <div
                      key={uf.id}
                      className="group flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"
                    >
                      {uf.preview ? (
                        <img
                          src={uf.preview}
                          alt={uf.file.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={getFileIcon(uf.file)}
                          />
                        </svg>
                      )}
                      <span className="max-w-[150px] truncate text-xs text-gray-300">
                        {uf.file.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(uf.id);
                        }}
                        className="ml-1 rounded p-0.5 text-gray-500 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Generate button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={
                    !hasValidInput() ||
                    isGenerating ||
                    models.imageModels.length === 0
                  }
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 text-sm text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  )}
                  Generate from Files
                </button>
              </div>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-gray-500">
            {inputMode === 'prompt' && 'Press Enter to generate'}
            {inputMode === 'url' &&
              'Add article URLs to generate relevant images'}
            {inputMode === 'content' && 'Paste text content for AI analysis'}
            {inputMode === 'files' &&
              'Upload documents or images for AI analysis'}
          </p>
        </div>
      </div>
    </div>
  );
}
