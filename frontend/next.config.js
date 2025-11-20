/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['arxiv.org', 'github.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
      {
        source: '/api/ai-service/:path*',
        destination: 'http://localhost:5000/api/v1/:path*',
      },
    ];
  },
  // 添加安全头部配置以支持iframe预览
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 允许iframe加载来自localhost:4000的内容(代理服务)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' blob: data:",
              // 允许所有脚本来源（因为iframe内容来自Blob URL，需要允许内联脚本）
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data: https: http:",
              // 允许所有样式来源
              "style-src 'self' 'unsafe-inline' blob: data: https: http:",
              // 允许所有图片来源
              "img-src 'self' data: blob: https: http:",
              // 允许所有字体来源
              "font-src 'self' data: blob: https: http:",
              // 允许所有API连接
              "connect-src 'self' http://localhost:4000 http://localhost:5000 ws://localhost:* wss://localhost:* blob: data: https: http: wss: ws:",
              // 允许所有iframe来源（内容通过Blob URL加载）
              "frame-src 'self' http://localhost:4000 blob: data: https: http:",
              // 允许所有worker来源
              "worker-src 'self' blob: data: https: http:",
              // 允许所有object来源（PDF）
              "object-src 'self' blob: data: https: http:",
              // 允许所有base-uri
              "base-uri 'self' https: http: blob: data:",
              // 允许所有form action
              "form-action 'self' https: http:",
              // 允许iframe被嵌入
              "frame-ancestors 'self'",
              // 允许媒体来源
              "media-src 'self' blob: data: https: http:",
              // 允许manifest来源
              "manifest-src 'self' blob: data: https: http:"
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
