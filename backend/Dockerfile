# Multi-stage build for production
FROM node:20-slim AS builder

# Install dependencies for native modules (canvas requires cairo, pango, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm install --no-package-lock --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove devDependencies for smaller production image
RUN npm prune --production --legacy-peer-deps

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install curl for healthcheck, OpenSSL for Prisma, and runtime libs for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    openssl \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libpixman-1-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start command
CMD ["node", "dist/main"]
