import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',

    // 超时配置 - 修复pool timeout问题
    testTimeout: 60000, // 60秒
    hookTimeout: 60000, // 60秒

    // 使用threads pool而不是forks，更稳定
    // 单线程模式避免pool timeout问题
    pool: 'threads',
    // @ts-expect-error - poolOptions exists at runtime but not in type definitions for vitest 4.0.8
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'app/layout.tsx', // Next.js layout文件
        '.next/**',
      ],

      // 覆盖率阈值 - Phase 1: 50%
      // 根据测试标准文档，采用渐进式提升策略
      // Phase 1 (Week 1-2): 50%
      // Phase 2 (Week 3-6): 70%
      // Phase 3 (Week 7+): 85%
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
