# Multi-stage build for production
FROM node:20-alpine AS builder

# Install dependencies for native modules (canvas requires cairo, pango, etc.)
RUN apk add --no-cache python3 make g++ \
    pkgconfig \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

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
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthcheck and runtime libs for canvas
RUN apk add --no-cache curl \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start command
CMD ["node", "dist/main"]
