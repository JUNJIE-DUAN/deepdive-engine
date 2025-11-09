/**
 * 应用配置
 * 统一管理环境变量和配置
 */

export const config = {
  /**
   * API基础URL
   * 从环境变量读取，开发环境默认localhost:4000
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',

  /**
   * API版本
   */
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || 'v1',

  /**
   * 完整API URL前缀
   */
  get apiUrl() {
    return `${this.apiBaseUrl}/api/${this.apiVersion}`;
  },

  /**
   * 环境标识
   */
  env: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',

  /**
   * 是否开发环境
   */
  get isDevelopment() {
    return this.env === 'development';
  },

  /**
   * 是否生产环境
   */
  get isProduction() {
    return this.env === 'production';
  },
} as const;
