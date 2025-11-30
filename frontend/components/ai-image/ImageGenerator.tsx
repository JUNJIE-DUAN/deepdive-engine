'use client';

/**
 * AI Image Generator Component
 * 类似 Google ImageFX / Ideogram 的交互式图片生成
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

interface ImageGeneratorProps {
  onImageGenerated?: (image: GeneratedImage) => void;
}

export default function ImageGenerator({
  onImageGenerated,
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<
    '1:1' | '16:9' | '9:16' | '4:3'
  >('1:1');
  const [style, setStyle] = useState<string>('realistic');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 示例提示词
  const examplePrompts = [
    'A serene Japanese garden with cherry blossoms, koi pond, and traditional wooden bridge at sunset',
    'Futuristic cityscape with flying cars and neon lights, cyberpunk style',
    'Cozy coffee shop interior with warm lighting, plants, and vintage furniture',
    'Majestic mountain landscape with aurora borealis in the night sky',
    'Abstract digital art with flowing gradients of blue and purple',
  ];

  // 风格选项
  const styleOptions = [
    { id: 'realistic', name: 'Realistic', icon: '📷' },
    { id: 'artistic', name: 'Artistic', icon: '🎨' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: '3d', name: '3D Render', icon: '🎮' },
    { id: 'sketch', name: 'Sketch', icon: '✏️' },
    { id: 'watercolor', name: 'Watercolor', icon: '🖌️' },
  ];

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [prompt]);

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
            style,
            aspectRatio,
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
      onImageGenerated?.(newImage);
    } catch (err) {
      console.error('Image generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
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
    <div className="flex h-full flex-col">
      {/* Main content area */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left side - Generated image display */}
        <div className="flex flex-1 flex-col">
          {/* Image display area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200">
            {selectedImage ? (
              <div className="relative h-full w-full">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.prompt}
                  className="h-full w-full object-contain"
                />
                {/* Image actions overlay */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedImage)}
                    className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur transition-all hover:bg-white"
                  >
                    <span className="flex items-center gap-2">
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
                    </span>
                  </button>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Creating your masterpiece...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
                  <svg
                    className="h-10 w-10 text-purple-500"
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
                  <h3 className="text-lg font-semibold text-gray-800">
                    Create with AI
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Describe your vision and watch it come to life
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Generated images gallery */}
          {generatedImages.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Recent Creations
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {generatedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                      selectedImage?.id === img.id
                        ? 'ring-2 ring-blue-500 ring-offset-2'
                        : 'hover:opacity-80'
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
        </div>

        {/* Right side - Controls */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {/* Style selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStyle(opt.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-xs transition-all ${
                    style === opt.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                    aspectRatio === ratio
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Example prompts */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Try these
            </label>
            <div className="space-y-2">
              {examplePrompts.slice(0, 3).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="w-full rounded-lg bg-gray-50 px-3 py-2 text-left text-xs text-gray-600 transition-all hover:bg-gray-100"
                >
                  {example.length > 60 ? example.slice(0, 60) + '...' : example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom input area */}
      <div className="mt-4 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-gray-200">
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the image you want to create..."
              className="w-full resize-none rounded-xl border-0 bg-gray-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              disabled={isGenerating}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {prompt.length}/1000
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
        <p className="mt-2 text-center text-xs text-gray-400">
          Press Enter to generate • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
