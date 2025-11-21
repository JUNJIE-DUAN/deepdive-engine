# 多阶段构建：减小最终镜像大小
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# ============================================================================
# 生产镜像
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# 安装 dumb-init 用于正确的信号处理和 curl 用于健康检查
RUN apk add --no-cache dumb-init curl

# 复制 package 文件
COPY package.json package-lock.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从 builder 镜像复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 启动应用以确保正确的信号处理
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
