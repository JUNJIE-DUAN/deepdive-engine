FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev openssl openssl-dev

COPY package.json ./
RUN npm install

COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Install OpenSSL 1.1 compatibility and other runtime deps
RUN apk add --no-cache dumb-init curl cairo jpeg pango giflib 

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 4000
ENV PORT=4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
