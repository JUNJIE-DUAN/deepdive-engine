# 多阶段构建：NestJS 后端
FROM node:20-alpine AS builder

WORKDIR /app

# 安装构建依赖（仅在构建时需要）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

COPY package.json ./
COPY package-lock.json* ./

RUN npm install

COPY . .

# 生成 Prisma 客户端
RUN npm run prisma:generate

# 构建 NestJS 应用
RUN npm run build

# ============================================================================
# 生产镜像
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# 安装运行时依赖和工具
RUN apk add --no-cache \
    dumb-init \
    curl \
    cairo \
    jpeg \
    pango \
    giflib

COPY package.json ./
COPY package-lock.json* ./

# 仅安装生产依赖
RUN npm install --only=production || npm install --production

# 从 builder 镜像复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# 暴露端口 (Railway will use PORT env var)
EXPOSE 4000

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]

# 健康检查 - 使用API健康端点
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-4000}/api/v1/health || exit 1
