'use client';

/**
 * AI Image Generator Component
 * 参考 Google ImageFX 的简洁设计风格
 * - 大面积图片展示区
 * - 底部简洁的输入框
 * - Expressive chips 快速修改提示词
 */

import { useState, useRef, useEffect } from 'react';
import { config } from '@/lib/config';
import { getAuthHeader } from '@/lib/auth';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  width: number;
  height: number;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Expressive chips - 快速修改提示词的关键词
  const expressiveChips = [
    { label: 'cinematic lighting', category: 'lighting' },
    { label: 'golden hour', category: 'lighting' },
    { label: 'studio lighting', category: 'lighting' },
    { label: 'dramatic shadows', category: 'lighting' },
    { label: 'macro shot', category: 'angle' },
    { label: 'aerial view', category: 'angle' },
    { label: 'close-up portrait', category: 'angle' },
    { label: 'wide angle', category: 'angle' },
    { label: 'vibrant colors', category: 'style' },
    { label: 'minimalist', category: 'style' },
    { label: 'surreal', category: 'style' },
    { label: 'photorealistic', category: 'style' },
  ];

  // 示例提示词
  const examplePrompts = [
    'A cozy reading nook with warm sunlight streaming through large windows',
    'Futuristic city skyline at sunset with flying vehicles',
    'A mystical forest with bioluminescent plants and magical creatures',
    'Professional food photography of artisan coffee and pastries',
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/v1/ai-image/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate image');
      }

      const data = await response.json();
      const newImage: GeneratedImage = {
        id: data.id || Date.now().toString(),
        prompt: prompt.trim(),
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
    if (e.key === 'Enter') {
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

  return (
    <div className="flex h-full flex-col bg-[#1a1a2e]">
      {/* Main Image Display Area */}
      <div className="flex flex-1 items-center justify-center p-8">
        {selectedImage ? (
          <div className="relative max-h-full max-w-full">
            <img
              src={selectedImage.imageUrl}
              alt={selectedImage.prompt}
              className="max-h-[60vh] rounded-2xl object-contain shadow-2xl"
            />
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
            <p className="text-lg text-gray-400">Creating your image...</p>
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
                Describe what you want to see and watch it come to life
              </p>
            </div>
            {/* Example Prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {examplePrompts.slice(0, 2).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="rounded-full bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
                >
                  {example.length > 40 ? example.slice(0, 40) + '...' : example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="border-t border-white/10 px-8 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {generatedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition ${
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

      {/* Expressive Chips */}
      <div className="border-t border-white/10 px-8 py-3">
        <div className="flex flex-wrap gap-2">
          {expressiveChips.slice(0, 8).map((chip) => (
            <button
              key={chip.label}
              onClick={() => addChipToPrompt(chip.label)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
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

      {/* Input Area */}
      <div className="border-t border-white/10 p-6">
        <div className="mx-auto max-w-3xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 focus-within:ring-purple-500/50">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to create..."
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-gray-500">
            Press Enter to generate
          </p>
        </div>
      </div>
    </div>
  );
}
