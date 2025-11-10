# 🚀 DeepDive Engine - API 访问地址

## 📍 服务地址

| 服务 | 地址 | 状态 |
|------|------|------|
| **前端** | http://localhost:3000 | 🟡 待启动 |
| **后端 API** | http://localhost:4000 | ✅ 运行中 |
| **AI 服务** | http://localhost:5000 | ✅ 运行中 |
| **PostgreSQL** | localhost:5432 | ✅ 运行中 |
| **MongoDB** | localhost:27017 | ✅ 运行中 |
| **Redis** | localhost:6379 | 🟡 待启动 |
| **Neo4j** | http://localhost:7474 | 🟡 待启动 |
| **Qdrant** | http://localhost:6333 | 🟡 待启动 |

---

## 📚 API 文档

### 🏠 基础服务

#### 健康检查
```bash
# 后端健康检查
GET http://localhost:4000/api/v1/health

# AI 服务健康检查
GET http://localhost:5000/api/v1/ai/health

# 示例
curl http://localhost:4000/api/v1/health
```

---

## 📰 Feed 流 API

### 1. 获取 Feed 流
获取资源列表，支持分页、过滤和排序

```bash
GET http://localhost:4000/api/v1/feed

# 参数
?skip=0              # 跳过前N条
&take=20             # 获取N条
&type=NEWS           # 类型过滤 (NEWS/PAPER/REPOSITORY)
&category=AI         # 类别过滤
&minQualityScore=50  # 最低质量分
&sortBy=trendingScore # 排序方式 (publishedAt/qualityScore/trendingScore)

# 示例 - 获取最新20条资源
curl "http://localhost:4000/api/v1/feed?take=20"

# 示例 - 获取热门AI新闻
curl "http://localhost:4000/api/v1/feed?type=NEWS&category=AI&sortBy=trendingScore"
```

### 2. 搜索资源
全文搜索资源（标题、摘要、内容）

```bash
GET http://localhost:4000/api/v1/feed/search

# 参数
?q=machine+learning  # 搜索关键词
&skip=0              # 跳过前N条
&take=20             # 获取N条
&type=PAPER          # 类型过滤
&category=AI         # 类别过滤

# 示例 - 搜索 AI 相关资源
curl "http://localhost:4000/api/v1/feed/search?q=AI"

# 示例 - 搜索论文
curl "http://localhost:4000/api/v1/feed/search?q=deep+learning&type=PAPER"
```

### 3. 获取热门资源
按趋势分数排序的热门资源

```bash
GET http://localhost:4000/api/v1/feed/trending

# 参数
?take=10  # 获取前N条

# 示例 - 获取Top 10热门资源
curl "http://localhost:4000/api/v1/feed/trending?take=10"
```

### 4. 获取相关资源
根据资源ID获取相关推荐

```bash
GET http://localhost:4000/api/v1/feed/related/:id

# 参数
?take=5  # 获取N条相关资源

# 示例 - 获取相关资源
curl "http://localhost:4000/api/v1/feed/related/2e944e29-e033-4d03-99d3-d04c16cfe3c6"
```

---

## 📦 Resources 管理 API

### 1. 获取资源列表
```bash
GET http://localhost:4000/api/v1/resources

# 参数
?skip=0              # 分页-跳过
&take=20             # 分页-数量
&type=NEWS           # 类型过滤
&category=AI         # 类别过滤
&search=keyword      # 关键词搜索
&sortBy=publishedAt  # 排序字段
&sortOrder=desc      # 排序方向

# 示例 - 获取资源列表
curl "http://localhost:4000/api/v1/resources?take=10"
```

### 2. 获取资源详情
```bash
GET http://localhost:4000/api/v1/resources/:id

# 示例 - 获取单个资源（含MongoDB原始数据）
curl "http://localhost:4000/api/v1/resources/2e944e29-e033-4d03-99d3-d04c16cfe3c6"
```

### 3. 创建资源
```bash
POST http://localhost:4000/api/v1/resources
Content-Type: application/json

{
  "type": "PAPER",
  "title": "Example Paper",
  "sourceUrl": "https://example.com/paper.pdf"
}

# 示例
curl -X POST "http://localhost:4000/api/v1/resources" \
  -H "Content-Type: application/json" \
  -d '{"type":"PAPER","title":"Test Paper","sourceUrl":"https://test.com"}'
```

### 4. 更新资源
```bash
PATCH http://localhost:4000/api/v1/resources/:id
Content-Type: application/json

{
  "title": "Updated Title"
}

# 示例
curl -X PATCH "http://localhost:4000/api/v1/resources/:id" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
```

### 5. 删除资源
```bash
DELETE http://localhost:4000/api/v1/resources/:id

# 示例
curl -X DELETE "http://localhost:4000/api/v1/resources/:id"
```

### 6. 获取统计信息
```bash
GET http://localhost:4000/api/v1/resources/stats/summary

# 示例
curl "http://localhost:4000/api/v1/resources/stats/summary"
```

---

## 🤖 AI 增强 API

### 1. 手动触发 AI 增强
对指定资源进行 AI 摘要、洞察提取和分类

```bash
POST http://localhost:4000/api/v1/resources/:id/enrich

# 示例 - 对资源进行AI增强
curl -X POST "http://localhost:4000/api/v1/resources/2e944e29-e033-4d03-99d3-d04c16cfe3c6/enrich"
```

### 2. 检查 AI 服务健康
```bash
GET http://localhost:4000/api/v1/resources/ai/health

# 示例
curl "http://localhost:4000/api/v1/resources/ai/health"
```

### 3. AI 服务直接调用

#### 生成摘要
```bash
POST http://localhost:5000/api/v1/ai/summary
Content-Type: application/json

{
  "content": "文章内容...",
  "max_length": 200,
  "language": "zh"
}

# 示例
curl -X POST "http://localhost:5000/api/v1/ai/summary" \
  -H "Content-Type: application/json" \
  -d '{"content":"Your content here","max_length":200,"language":"zh"}'
```

#### 提取洞察
```bash
POST http://localhost:5000/api/v1/ai/insights
Content-Type: application/json

{
  "content": "文章内容...",
  "language": "zh"
}

# 示例
curl -X POST "http://localhost:5000/api/v1/ai/insights" \
  -H "Content-Type: application/json" \
  -d '{"content":"Your content here","language":"zh"}'
```

#### 内容分类
```bash
POST http://localhost:5000/api/v1/ai/classify
Content-Type: application/json

{
  "content": "文章内容..."
}

# 示例
curl -X POST "http://localhost:5000/api/v1/ai/classify" \
  -H "Content-Type: application/json" \
  -d '{"content":"Your content here"}'
```

---

## 🕷️ 数据采集 API

### 1. HackerNews 采集

#### 采集热门故事
```bash
POST http://localhost:4000/api/v1/crawler/hackernews/top
Content-Type: application/json

{
  "maxResults": 30
}

# 示例 - 采集前5条热门新闻（自动AI增强）
curl -X POST "http://localhost:4000/api/v1/crawler/hackernews/top" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":5}'
```

#### 采集最新故事
```bash
POST http://localhost:4000/api/v1/crawler/hackernews/new

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/hackernews/new" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":10}'
```

#### 采集最佳故事
```bash
POST http://localhost:4000/api/v1/crawler/hackernews/best

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/hackernews/best" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":10}'
```

### 2. GitHub 采集

#### 采集热门仓库
```bash
POST http://localhost:4000/api/v1/crawler/github/trending
Content-Type: application/json

{
  "language": "typescript",
  "maxResults": 20
}

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/github/trending" \
  -H "Content-Type: application/json" \
  -d '{"language":"typescript","maxResults":10}'
```

#### 搜索仓库
```bash
POST http://localhost:4000/api/v1/crawler/github/search
Content-Type: application/json

{
  "query": "machine learning",
  "maxResults": 20
}

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/github/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"AI framework","maxResults":10}'
```

### 3. arXiv 采集

#### 采集最新论文
```bash
POST http://localhost:4000/api/v1/crawler/arxiv/latest
Content-Type: application/json

{
  "category": "cs.AI",
  "maxResults": 20
}

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/arxiv/latest" \
  -H "Content-Type: application/json" \
  -d '{"category":"cs.AI","maxResults":10}'
```

#### 搜索论文
```bash
POST http://localhost:4000/api/v1/crawler/arxiv/search
Content-Type: application/json

{
  "query": "deep learning",
  "maxResults": 20
}

# 示例
curl -X POST "http://localhost:4000/api/v1/crawler/arxiv/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"transformer architecture","maxResults":10}'
```

### 4. 批量采集
```bash
POST http://localhost:4000/api/v1/crawler/fetch-all
Content-Type: application/json

{
  "maxResultsPerSource": 10
}

# 示例 - 从所有源采集数据
curl -X POST "http://localhost:4000/api/v1/crawler/fetch-all" \
  -H "Content-Type: application/json" \
  -d '{"maxResultsPerSource":5}'
```

### 5. 采集器健康检查
```bash
GET http://localhost:4000/api/v1/crawler/health

# 示例
curl "http://localhost:4000/api/v1/crawler/health"
```

---

## 🧪 快速测试流程

### 完整工作流示例

```bash
# 1. 检查服务健康
curl http://localhost:4000/api/v1/health

# 2. 采集数据（HackerNews热门新闻，自动AI增强）
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

## 🔐 认证说明

当前版本为开发环境，**所有 API 均无需认证**。

生产环境将添加：
- JWT 认证
- API Key 认证
- Rate Limiting

---

## 📊 数据格式

### Resource 对象结构

```json
{
  "id": "uuid",
  "type": "PAPER | NEWS | REPOSITORY",
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
  "difficultyLevel": 2,  // 1=beginner, 2=intermediate, 3=advanced, 4=expert
  "qualityScore": "85",
  "trendingScore": "450.5",
  "viewCount": 0,
  "upvoteCount": 42,
  "commentCount": 15,
  "rawDataId": "mongodb-object-id",
  "createdAt": "2025-11-08T00:00:00.000Z",
  "updatedAt": "2025-11-08T00:00:00.000Z"
}
```

---

## 🛠️ 常用命令

### 启动服务
```bash
# 后端
cd backend && npm run dev

# AI服务
cd ai-service && python main.py

# 前端
cd frontend && npm run dev
```

### 数据库操作
```bash
# Prisma 迁移
cd backend && npx prisma migrate dev

# 查看数据库
cd backend && npx prisma studio  # http://localhost:5555
```

---

## 📖 相关文档

- [GCP Secret Manager 配置](ai-service/docs/GCP_SECRET_MANAGER_SETUP.md)
- [项目 TODO](https://claude.com/TODO.md)
- [README](README.md)

---

## 🎯 下一步开发

- [ ] 用户认证系统
- [ ] 知识图谱可视化
- [ ] 推荐系统
- [ ] 前端 UI
- [ ] WebSocket 实时更新

---

**更新时间**: 2025-11-08
**当前版本**: v0.7 (68% 完成)
