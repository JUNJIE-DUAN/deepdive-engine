# DeepDive Engine - API 完整参考

**Base URL**: `http://localhost:4000/api/v1`
**认证**: 开发环境无需认证，生产环境将使用 JWT
**最后更新**: 2025-11-15

---

## 📍 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端** | http://localhost:3000 | Next.js应用 |
| **后端 API** | http://localhost:4000/api/v1 | NestJS API |
| **AI 服务** | http://localhost:5000/api/v1/ai | FastAPI AI服务 |
| **PostgreSQL** | localhost:5432 | 主数据库 |
| **MongoDB** | localhost:27017 | 原始数据存储 |
| **Neo4j** | http://localhost:7474 | 知识图谱 |
| **Redis** | localhost:6379 | 缓存 |
| **Qdrant** | http://localhost:6333 | 向量数据库 |

---

## 📚 目录

### 核心功能
1. [健康检查](#健康检查)
2. [Feed流](#feed流api)
3. [资源管理](#resources管理api)
4. [AI增强](#ai增强api)
5. [数据采集](#数据采集api)

### 内容增强
6. [笔记系统](#notes-api)
7. [评论系统](#comments-api)

### 其他
8. [快速测试](#快速测试流程)
9. [数据格式](#数据格式)
10. [错误码](#错误码说明)

---

## 健康检查

### 后端健康检查
```bash
GET /health

curl http://localhost:4000/api/v1/health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T10:00:00.000Z"
}
```

### AI服务健康检查
```bash
GET /resources/ai/health

curl http://localhost:4000/api/v1/resources/ai/health
```

---

## Feed流API

### 1. 获取Feed流
获取资源列表，支持分页、过滤和排序

**端点**: `GET /feed`

**查询参数**:
- `skip` (number): 跳过前N条，默认0
- `take` (number): 获取N条，默认20
- `type` (enum): 类型过滤 - NEWS | PAPER | PROJECT
- `category` (string): 类别过滤
- `minQualityScore` (number): 最低质量分，默认0
- `sortBy` (string): 排序字段 - publishedAt | qualityScore | trendingScore

**示例**:
```bash
# 获取最新20条资源
curl "http://localhost:4000/api/v1/feed?take=20"

# 获取热门AI新闻
curl "http://localhost:4000/api/v1/feed?type=NEWS&category=AI&sortBy=trendingScore"
```

---

### 2. 搜索资源
全文搜索资源（标题、摘要、内容）

**端点**: `GET /feed/search`

**查询参数**:
- `q` (string, 必需): 搜索关键词
- `skip`, `take`, `type`, `category`: 同上

**示例**:
```bash
# 搜索AI相关资源
curl "http://localhost:4000/api/v1/feed/search?q=AI"

# 搜索论文
curl "http://localhost:4000/api/v1/feed/search?q=deep+learning&type=PAPER"
```

---

### 3. 获取热门资源
按趋势分数排序的热门资源

**端点**: `GET /feed/trending`

**查询参数**:
- `take` (number): 获取前N条，默认10

**示例**:
```bash
curl "http://localhost:4000/api/v1/feed/trending?take=10"
```

---

### 4. 获取相关资源
根据资源ID获取相关推荐

**端点**: `GET /feed/related/:id`

**查询参数**:
- `take` (number): 获取N条相关资源，默认5

**示例**:
```bash
curl "http://localhost:4000/api/v1/feed/related/2e944e29-e033-4d03-99d3-d04c16cfe3c6"
```

---

## Resources管理API

### 1. 获取资源列表
**端点**: `GET /resources`

**查询参数**:
- `skip`, `take`: 分页参数
- `type`, `category`, `search`: 过滤参数
- `sortBy`, `sortOrder`: 排序参数

**示例**:
```bash
curl "http://localhost:4000/api/v1/resources?take=10"
```

---

### 2. 获取资源详情
**端点**: `GET /resources/:id`

**响应**: 包含PostgreSQL资源数据 + MongoDB原始数据

**示例**:
```bash
curl "http://localhost:4000/api/v1/resources/[resource-id]"
```

---

### 3. 创建资源
**端点**: `POST /resources`

**请求体**:
```json
{
  "type": "PAPER",
  "title": "Example Paper",
  "sourceUrl": "https://example.com/paper.pdf"
}
```

**示例**:
```bash
curl -X POST "http://localhost:4000/api/v1/resources" \
  -H "Content-Type: application/json" \
  -d '{"type":"PAPER","title":"Test Paper","sourceUrl":"https://test.com"}'
```

---

### 4. 更新资源
**端点**: `PATCH /resources/:id`

**请求体**:
```json
{
  "title": "Updated Title"
}
```

---

### 5. 删除资源
**端点**: `DELETE /resources/:id`

---

### 6. 获取统计信息
**端点**: `GET /resources/stats/summary`

**响应**:
```json
{
  "total": 150,
  "byType": {
    "PAPER": 60,
    "NEWS": 70,
    "PROJECT": 20
  },
  "avgQualityScore": 75.5
}
```

---

## AI增强API

### 1. 手动触发AI增强
对指定资源进行AI摘要、洞察提取和分类

**端点**: `POST /resources/:id/enrich`

**示例**:
```bash
curl -X POST "http://localhost:4000/api/v1/resources/[resource-id]/enrich"
```

---

### 2. AI服务直接调用

#### 生成摘要
**端点**: `POST /ai/summary` (AI服务: http://localhost:5000/api/v1/ai/summary)

**请求体**:
```json
{
  "content": "文章内容...",
  "max_length": 200,
  "language": "zh"
}
```

#### 提取洞察
**端点**: `POST /ai/insights`

**请求体**:
```json
{
  "content": "文章内容...",
  "language": "zh"
}
```

#### 内容分类
**端点**: `POST /ai/classify`

**请求体**:
```json
{
  "content": "文章内容..."
}
```

---

## 数据采集API

### 1. HackerNews采集

#### 采集热门故事
**端点**: `POST /crawler/hackernews/top`

**请求体**:
```json
{
  "maxResults": 30
}
```

**示例**:
```bash
curl -X POST "http://localhost:4000/api/v1/crawler/hackernews/top" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":5}'
```

#### 采集最新故事
**端点**: `POST /crawler/hackernews/new`

#### 采集最佳故事
**端点**: `POST /crawler/hackernews/best`

---

### 2. GitHub采集

#### 采集热门仓库
**端点**: `POST /crawler/github/trending`

**请求体**:
```json
{
  "language": "typescript",
  "maxResults": 20
}
```

#### 搜索仓库
**端点**: `POST /crawler/github/search`

**请求体**:
```json
{
  "query": "machine learning",
  "maxResults": 20
}
```

---

### 3. arXiv采集

#### 采集最新论文
**端点**: `POST /crawler/arxiv/latest`

**请求体**:
```json
{
  "category": "cs.AI",
  "maxResults": 20
}
```

#### 搜索论文
**端点**: `POST /crawler/arxiv/search`

**请求体**:
```json
{
  "query": "deep learning",
  "maxResults": 20
}
```

---

### 4. 批量采集
**端点**: `POST /crawler/fetch-all`

**请求体**:
```json
{
  "maxResultsPerSource": 10
}
```

从所有源（HN + GitHub + arXiv）批量采集数据

---

### 5. 采集器健康检查
**端点**: `GET /crawler/health`

---

## Notes API

### 1. 创建笔记
**端点**: `POST /notes`

**请求体**:
```json
{
  "resourceId": "resource-uuid",
  "title": "My Study Notes",
  "content": "# Chapter 1\n\nSome notes...",
  "highlights": [
    {
      "text": "Important concept",
      "color": "yellow",
      "position": {
        "page": 1,
        "startOffset": 100,
        "endOffset": 120
      },
      "note": "This is key!"
    }
  ],
  "tags": ["machine-learning", "deep-learning"]
}
```

**响应**: `201 Created`

---

### 2. 获取用户所有笔记
**端点**: `GET /notes/my`

**查询参数**:
- `page` (number): 页码，默认1
- `limit` (number): 每页数量，默认20
- `sort` (string): 排序字段 - updatedAt | createdAt | title
- `order` (string): 排序顺序 - asc | desc
- `resourceId` (string): 过滤特定资源
- `tag` (string): 过滤特定标签

---

### 3. 获取特定笔记
**端点**: `GET /notes/:id`

---

### 4. 更新笔记
**端点**: `PATCH /notes/:id`

**请求体**:
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

---

### 5. 删除笔记
**端点**: `DELETE /notes/:id`

---

### 6. AI辅助功能

#### 生成AI洞察
**端点**: `POST /notes/:id/generate-insights`

自动分析笔记内容，提取关键洞察

#### 连接到知识图谱
**端点**: `POST /notes/:id/connect-graph`

将笔记内容提取为知识图谱节点

---

## Comments API

### 1. 创建评论
**端点**: `POST /comments`

**请求体**:
```json
{
  "resourceId": "resource-uuid",
  "content": "Great article!",
  "parentId": null
}
```

---

### 2. 获取资源评论
**端点**: `GET /comments/resource/:resourceId`

**查询参数**:
- `page`, `limit`: 分页
- `sort`: updatedAt | createdAt | upvotes
- `order`: asc | desc

**响应**: 树状结构评论列表

---

### 3. 更新评论
**端点**: `PATCH /comments/:id`

---

### 4. 删除评论
**端点**: `DELETE /comments/:id`

---

### 5. 点赞/取消点赞
**端点**: `POST /comments/:id/upvote`

---

## 快速测试流程

完整工作流示例：

```bash
# 1. 检查服务健康
curl http://localhost:4000/api/v1/health

# 2. 采集数据（HackerNews热门新闻）
curl -X POST "http://localhost:4000/api/v1/crawler/hackernews/top" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":5}'

# 3. 查看Feed流
curl "http://localhost:4000/api/v1/feed?take=10"

# 4. 搜索资源
curl "http://localhost:4000/api/v1/feed/search?q=AI"

# 5. 查看热门资源
curl "http://localhost:4000/api/v1/feed/trending?take=5"

# 6. 查看资源详情（含MongoDB原始数据）
curl "http://localhost:4000/api/v1/resources/[resource-id]"

# 7. 手动触发AI增强
curl -X POST "http://localhost:4000/api/v1/resources/[resource-id]/enrich"

# 8. 查看统计数据
curl "http://localhost:4000/api/v1/resources/stats/summary"
```

---

## 数据格式

### Resource 对象结构

```json
{
  "id": "uuid",
  "type": "PAPER | NEWS | PROJECT",
  "title": "标题",
  "abstract": "摘要",
  "content": "内容",
  "sourceUrl": "来源URL",
  "pdfUrl": "PDF链接",
  "codeUrl": "代码链接",
  "authors": [{"username": "作者", "platform": "平台"}],
  "publishedAt": "2025-11-08T00:00:00.000Z",
  "aiSummary": "AI生成的摘要",
  "keyInsights": [{"title": "洞察", "description": "描述"}],
  "primaryCategory": "主分类",
  "categories": ["分类1", "分类2"],
  "tags": ["标签1", "标签2"],
  "autoTags": ["AI生成的标签"],
  "difficultyLevel": 2,
  "qualityScore": 85,
  "trendingScore": 450.5,
  "viewCount": 0,
  "upvoteCount": 42,
  "commentCount": 15,
  "rawDataId": "mongodb-object-id",
  "createdAt": "2025-11-08T00:00:00.000Z",
  "updatedAt": "2025-11-08T00:00:00.000Z"
}
```

---

## 错误码说明

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | 成功 | GET请求成功 |
| 201 | 创建成功 | POST创建资源成功 |
| 400 | 请求错误 | 缺少必需参数 |
| 404 | 未找到 | 资源不存在 |
| 429 | 限流 | 请求过于频繁（60请求/分钟） |
| 500 | 服务器错误 | 内部错误 |
| 503 | 服务不可用 | AI服务暂时不可用 |

**标准错误响应**:
```json
{
  "statusCode": 400,
  "timestamp": "2025-11-15T10:00:00.000Z",
  "path": "/api/v1/resources",
  "method": "POST",
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 安全与限流

### 当前配置（开发环境）
- ✅ 全局限流: 60请求/分钟
- ✅ 安全头: Helmet.js CSP
- ✅ 输入验证: ValidationPipe
- ❌ 认证: 暂未启用（开发环境）

### 生产环境计划
- JWT Bearer Token认证
- API Key认证
- 分级限流（认证端点5次/分，其他60次/分）
- HTTPS强制

---

## 相关文档

- [架构设计](../architecture/OVERVIEW.md)
- [开发指南](../guides/development.md)
- [部署指南](../guides/deployment.md)
- [测试指南](../guides/testing.md)

---

**维护者**: DeepDive Team
**最后更新**: 2025-11-15
**API版本**: v1
