# Railway Configuration Debug Guide

## Expected Configuration for Monorepo Services

### Backend Service Settings

```
Service Name: backend
Root Directory: backend
Source Repo: deepdive-engine
Branch: main

Build Settings:
- Builder: Dockerfile
- Dockerfile Path: Dockerfile (relative to Root Directory)
- Build Command: (empty, use Dockerfile)

Deploy Settings:
- Start Command: (from railway.toml)
- Health Check: /api/v1/health
```

### Frontend Service Settings

```
Service Name: frontend
Root Directory: frontend
Source Repo: deepdive-engine
Branch: main

Build Settings:
- Builder: Dockerfile
- Dockerfile Path: Dockerfile (relative to Root Directory)
- Build Command: (empty, use Dockerfile)

Deploy Settings:
- Start Command: npm start
- Health Check: /
```

### AI Service Settings (✅ Working - Use as Reference)

```
Service Name: ai-service
Root Directory: ai-service
Source Repo: deepdive-engine
Branch: main

Build Settings:
- Builder: Dockerfile
- Dockerfile Path: Dockerfile (relative to Root Directory)
- Build Command: (empty, use Dockerfile)

Deploy Settings:
- Start Command: python main.py
- Health Check: /
```

## How to Check Your Settings

1. Open Railway Dashboard
2. Click on the service (e.g., "backend")
3. Click "Settings" tab
4. Look for these sections:
   - **Source** - Check Root Directory
   - **Build** - Check if using Dockerfile
   - **Deploy** - Check start command

## Common Issues in Monorepo

### Issue 1: Root Directory Not Set

**Problem**: Railway uses project root instead of service directory
**Solution**: Set Root Directory to service folder (e.g., "backend")

### Issue 2: Dockerfile Path Wrong

**Problem**: Railway can't find Dockerfile
**Solution**: Set dockerfilePath="Dockerfile" in railway.toml (already done ✅)

### Issue 3: Build Context Issue

**Problem**: Dockerfile COPY commands fail
**Solution**: Ensure all paths in Dockerfile are relative to service root

## Quick Fix Steps

1. For **backend** service:

   ```
   Settings → Source → Root Directory → Set to "backend" → Save
   ```

2. For **frontend** service:

   ```
   Settings → Source → Root Directory → Set to "frontend" → Save
   ```

3. Trigger rebuild:
   ```
   Click on service → Click "Deploy" → "Redeploy"
   ```

## Verification

After setting Root Directory, the build logs should show:

```
=========================
Using Detected Dockerfile
=========================

FROM node:20-alpine3.18 AS builder
...
```

Instead of just:

```
scheduling build on Metal builder...
[snapshot] receiving snapshot...
```
