# PDF缩略图生成功能使用指南

## 功能概述

PDF缩略图功能现已完全支持！系统采用**前端客户端生成方案**，避免了Windows环境下原生依赖的复杂性问题。

## 技术实现

- **前端**: 使用 PDF.js 在浏览器中渲染 PDF 第一页生成缩略图
- **后端**: 接收并保存上传的缩略图文件
- **存储**: 缩略图保存在 `backend/public/thumbnails/` 目录
- **访问**: 通过 `http://localhost:4000/thumbnails/{resourceId}.jpg` 访问

## 使用方法

### 方式一：使用管理界面（推荐）

1. 访问缩略图管理页面：
   ```
   http://localhost:3006/admin/thumbnails
   ```

2. 页面功能：
   - 查看所有资源的缩略图状态
   - **批量生成**：一键为所有需要的资源生成缩略图
   - **选择生成**：勾选特定资源进行生成
   - **单个生成**：为单个资源生成缩略图
   - 实时查看生成进度

3. 点击"Generate All"按钮，系统将自动：
   - 检测所有有 PDF 但没有缩略图的资源
   - 使用 PDF.js 在浏览器中渲染 PDF 第一页
   - 生成 400x566 像素的 JPEG 缩略图
   - 上传到后端服务器
   - 更新资源的 `thumbnailUrl` 字段

### 方式二：使用 API

**上传缩略图 API**:
```bash
POST http://localhost:4000/api/v1/resources/:id/thumbnail
Content-Type: multipart/form-data

# Form Data
thumbnail: [image file]
```

**响应**:
```json
{
  "message": "Thumbnail uploaded successfully",
  "thumbnailUrl": "/thumbnails/{resourceId}.jpg",
  "resource": { ... }
}
```

## 架构说明

### 前端组件

1. **PDF缩略图生成工具** (`frontend/lib/pdf-thumbnail.ts`)
   - `generatePdfThumbnail()`: 生成单个缩略图
   - `generateAndSaveThumbnail()`: 生成并上传到后端
   - `batchGenerateThumbnails()`: 批量生成

2. **React Hook** (`frontend/lib/useThumbnailGenerator.ts`)
   - 管理生成状态
   - 跟踪进度
   - 处理错误

3. **管理页面** (`frontend/app/admin/thumbnails/page.tsx`)
   - 可视化界面
   - 批量操作
   - 状态监控

### 后端组件

1. **文件上传端点** (`backend/src/resources/resources.controller.ts`)
   - 接收缩略图文件
   - 保存到 `public/thumbnails/` 目录
   - 更新数据库记录

2. **静态文件服务** (`backend/src/app.module.ts`)
   - 配置 ServeStaticModule
   - 提供 `/thumbnails/*` 访问

## 配置参数

缩略图默认配置：
- 宽度: 400px
- 高度: 566px (A4 比例)
- 格式: JPEG
- 质量: 85%
- 最大文件大小: 5MB

可在 `frontend/lib/pdf-thumbnail.ts` 中修改 `DEFAULT_OPTIONS` 来调整参数。

## 注意事项

1. **浏览器兼容性**: 需要支持 Canvas API 的现代浏览器
2. **PDF.js 版本**: 使用 CDN 加载 worker，无需本地编译
3. **CORS**: 确保 PDF URL 支持跨域访问
4. **性能**: 批量生成时有500ms延迟，避免浏览器过载

## 故障排除

### 问题: 缩略图生成失败

**可能原因**:
- PDF URL 无法访问
- PDF 文件损坏
- 浏览器不支持 Canvas API

**解决方案**:
- 检查浏览器控制台错误信息
- 确认 PDF URL 可以直接访问
- 使用支持的浏览器（Chrome, Firefox, Edge）

### 问题: 缩略图无法显示

**可能原因**:
- 静态文件服务未正确配置
- 文件路径错误
- 后端服务未运行

**解决方案**:
- 确认后端运行在端口 4000
- 检查 `backend/public/thumbnails/` 目录是否存在
- 直接访问 `http://localhost:4000/thumbnails/{resourceId}.jpg` 测试

## 开发说明

如需扩展功能，可参考以下文件：

- 前端缩略图工具: `frontend/lib/pdf-thumbnail.ts`
- React Hook: `frontend/lib/useThumbnailGenerator.ts`
- 管理页面: `frontend/app/admin/thumbnails/page.tsx`
- 后端API: `backend/src/resources/resources.controller.ts`
- 后端配置: `backend/src/app.module.ts`

## 更新日志

- 2025-11-09: 初始实现，采用前端客户端生成方案
- 支持批量生成、单个生成、进度跟踪
- 创建专门的管理界面
