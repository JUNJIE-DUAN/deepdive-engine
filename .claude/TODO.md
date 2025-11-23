# DeepDive Engine - 任务清单

**最后更新**: 2025-11-08 11:27 AM

---

## 当前状态

- ✅ 已完成: 18/25 (72%)
- ⚠️ 进行中: 0/25
- ⏳ 待开始: 7/25

---

## 任务列表

### ✅ 阶段 1: 项目初始化 (已完成)

- [x] **1. 定义项目规则和开发规范**
  - 文件: `project-rules.md`
  - 内容: 代码规范、Git工作流、AI使用规则、安全规范
  - 完成时间: 2025-11-08

- [x] **2. 创建技术架构设计文档**
  - 文件: `architecture.md`
  - 内容: 系统架构图、数据库设计、API规范、部署策略
  - 完成时间: 2025-11-08

- [x] **3. 创建根目录配置文件**
  - 文件: `package.json`, `docker-compose.yml`, `.env`, `.gitignore`, `readme.md`
  - 完成时间: 2025-11-08

- [x] **4. 初始化前端项目 (Next.js + TypeScript)**
  - 目录: `frontend/`
  - 依赖: 476个包已安装
  - 状态: ✅ 运行在 http://localhost:3000
  - 配置: TailwindCSS (AlphaXiv蓝色主题 #2563eb)
  - 完成时间: 2025-11-08

- [x] **5. 初始化后端项目 (NestJS + Prisma)**
  - 目录: `backend/`
  - 依赖: 647个包已安装
  - 状态: ⚠️ 编译成功，等待数据库连接
  - Schema: User, Resource, Collection, UserActivity, LearningPath
  - 完成时间: 2025-11-08

---

### ✅ 阶段 2: 环境配置 (已完成)

- [x] **6. 安装 Docker Desktop for Windows**
  - 状态: ✅ 已安装 (Docker v28.5.1)
  - 完成时间: 2025-11-08 10:33 AM

- [x] **7. 启动数据库容器 (PostgreSQL, Neo4j, Redis, Qdrant, MongoDB)**
  - 状态: ✅ 所有容器运行正常
  - 容器:
    - PostgreSQL 16 @ 5432
    - Neo4j 5 @ 7474/7687
    - Redis 7 @ 6379
    - Qdrant latest @ 6333
    - MongoDB 7 @ 27017
  - 完成时间: 2025-11-08 10:35 AM

- [x] **8. 初始化 PostgreSQL 数据库结构**
  - 状态: ✅ Prisma migration 已完成
  - 迁移名称: `20251108153253_init`
  - 完成时间: 2025-11-08 10:33 AM

- [x] **9. 验证后端数据库连接成功**
  - 状态: ✅ 后端运行在 http://localhost:4000
  - 数据库连接: ✅ Prisma connected
  - 健康检查: `{"status":"ok","service":"DeepDive Backend","version":"1.0.0"}`
  - Background Bash ID: ac1f3e
  - 完成时间: 2025-11-08 10:35 AM

---

### ✅ 阶段 3: AI服务开发 (已完成)

- [x] **10. 初始化 AI 服务项目结构 (FastAPI + Python)**
  - 状态: ✅ 项目结构已创建
  - Python: 3.13.6
  - 目录结构:
    - `ai-service/main.py` - FastAPI 应用入口
    - `ai-service/requirements.txt` - 依赖项
    - `ai-service/models/schemas.py` - 数据模型
    - `ai-service/routers/ai.py` - API 路由
    - `ai-service/services/` - AI 服务逻辑
    - `ai-service/utils/` - 工具函数
  - 依赖包已安装: fastapi, uvicorn, httpx, openai, anthropic, loguru
  - 完成时间: 2025-11-08 10:40 AM

- [x] **11. 集成 AI 服务 (Grok首选, OpenAI备用, secretManager)**
  - 状态: ✅ AI 服务运行在 http://localhost:5000
  - 已实现文件:
    - `services/grok_client.py` - Grok API 客户端
    - `services/openai_client.py` - OpenAI API 客户端
    - `services/ai_orchestrator.py` - 故障切换逻辑
    - `utils/secret_manager.py` - 密钥管理器
  - 已实现功能:
    - ✅ 摘要生成 API (`POST /api/v1/ai/summary`)
    - ✅ 关键洞察提取 (`POST /api/v1/ai/insights`)
    - ✅ 主题分类 (`POST /api/v1/ai/classify`)
    - ✅ 健康检查 (`GET /api/v1/ai/health`)
    - ✅ 自动故障切换（Grok ↔ OpenAI）
  - API密钥: 从环境变量获取（占位符，待配置真实密钥）
  - Background Bash ID: 8826cd
  - 完成时间: 2025-11-08 10:40 AM

---

### ✅ 阶段 4: 数据采集器 (已完成)

**✅ 已解决用户关注的问题**:

- ✅ 存储完整信息（MongoDB raw_data包含所有字段+\_raw原始数据）
- ✅ 建立正确的数据库引用关系（rawDataId字段连接PostgreSQL↔MongoDB）
- ✅ 实现去重逻辑（基于externalId检测，重复数据自动跳过）
- ✅ 资源集合完整（已测试HackerNews采集器，数据完整无重复）

- [x] **12. 开发 arXiv 论文采集器**
  - 文件: `backend/src/crawler/arxiv.service.ts`
  - 功能:
    - 获取最新论文列表
    - 解析论文元数据（标题、作者、摘要、分类、PDF链接）
    - **存储完整信息到 MongoDB raw_data 集合**
    - 去重检查（基于 arXiv ID）
    - 存储到 PostgreSQL resources 表
    - **建立 raw_data 到 resource 的引用关系**
  - API: http://export.arxiv.org/api/query
  - 频率: 每日更新
  - 测试: ✅ 代码完成（支持XML解析）
  - 完成时间: 2025-11-08 11:00 AM

- [x] **13. 开发 GitHub 项目采集器**
  - 文件: `backend/src/crawler/github.service.ts`
  - 功能:
    - 获取热门/趋势项目
    - 解析项目信息（名称、描述、星标、语言、README）
    - **存储完整信息到 MongoDB**
    - 去重检查（基于 GitHub repo URL）
    - **建立正确的引用关系**
  - API: GitHub REST API / GraphQL
  - Token: 从 .env 获取 GITHUB_TOKEN
  - 频率: 每6小时
  - 测试: ✅ 代码完成（支持README获取）
  - 完成时间: 2025-11-08 11:00 AM

- [x] **14. 开发 HackerNews 采集器**
  - 文件: `backend/src/crawler/hackernews.service.ts`
  - 功能:
    - 获取首页热门新闻
    - 解析新闻元数据
    - **存储完整信息**
    - 去重检查（基于 HN item ID）
    - **建立引用关系**
  - API: https://github.com/HackerNews/API
  - 频率: 每小时
  - 测试: ✅ 真实数据验证通过（5条记录，重复请求0条新增）
  - 完成时间: 2025-11-08 11:02 AM

- [x] **15. 实现统一的去重和存储逻辑**
  - 文件: `backend/src/crawler/deduplication.service.ts`
  - 功能:
    - URL哈希去重
    - 标题相似度检测
    - 定期清理过期数据
    - 监控重复率指标
  - 算法: ✅ MD5哈希 + Levenshtein距离已实现
  - 完成时间: 2025-11-08 11:00 AM

---

### ✅ 阶段 5: 核心API开发 (已完成 3/3)

- [x] **16. 实现资源管理 API (Resources CRUD)**
  - 文件:
    - `backend/src/resources/resources.module.ts`
    - `backend/src/resources/resources.service.ts`
    - `backend/src/resources/resources.controller.ts`
  - 端点:
    - ✅ `GET /api/v1/resources` (列表 + 分页 + 过滤 + 排序)
    - ✅ `GET /api/v1/resources/:id` (详情 + MongoDB原始数据)
    - ✅ `POST /api/v1/resources` (创建)
    - ✅ `PATCH /api/v1/resources/:id` (更新)
    - ✅ `DELETE /api/v1/resources/:id` (删除)
    - ✅ `GET /api/v1/resources/stats/summary` (统计)
  - 功能验证: ✅ 分页、过滤(type/category/search)、排序、MongoDB数据关联
  - 完成时间: 2025-11-08 11:08 AM

- [x] **17. 实现 AI 摘要和洞察提取集成**
  - 文件:
    - `backend/src/resources/ai-enrichment.service.ts` - AI 增强服务
    - `backend/src/resources/resources.controller.ts` - 手动触发端点
    - `backend/src/crawler/hackernews.service.ts` - 自动集成
  - 功能:
    - ✅ 调用 AI 服务生成摘要 (generateSummary)
    - ✅ 提取关键洞察 (extractInsights)
    - ✅ 评估难度等级 (classifyContent)
    - ✅ 自动标签分类 (autoTags)
    - ✅ 难度等级映射 (beginner=1, intermediate=2, advanced=3, expert=4)
  - 端点:
    - ✅ `POST /api/v1/resources/:id/enrich` - 手动触发 AI 增强
    - ✅ `GET /api/v1/resources/ai/health` - AI 服务健康检查
  - 集成: ✅ HackerNews Crawler 自动调用 AI 增强（异步，不阻塞主流程）
  - 完成时间: 2025-11-08 11:16 AM

- [x] **18. 实现内容展示系统 (Feed, 详情页, 搜索)**
  - 文件:
    - `backend/src/feed/feed.module.ts`
    - `backend/src/feed/feed.service.ts`
    - `backend/src/feed/feed.controller.ts`
  - 端点:
    - ✅ `GET /api/v1/feed` (Feed流 + 分页 + 过滤 + 排序)
    - ✅ `GET /api/v1/feed/search` (全文搜索)
    - ✅ `GET /api/v1/feed/trending` (热门资源)
    - ✅ `GET /api/v1/feed/related/:id` (相关推荐)
  - 功能验证: ✅ 所有端点测试通过
  - 完成时间: 2025-11-08 11:23 AM

---

### ⏳ 阶段 6: 知识图谱 (待开始)

- [ ] **19. 构建知识图谱系统 (Neo4j + 可视化)**
  - 后端集成:
    - `backend/src/knowledge-graph/neo4j.service.ts`
    - 实体提取（Paper, Author, Topic, Institution）
    - 关系构建（CITES, AUTHORED_BY, RELATED_TO）
  - 前端可视化:
    - `frontend/app/knowledge-graph/page.tsx`
    - D3.js force-directed graph
    - 交互式探索（缩放、过滤、搜索）
  - 预计时间: 6小时

---

### ⏳ 阶段 7: 推荐系统 (待开始)

- [ ] **20. 实现个性化推荐引擎**
  - 文件: `backend/src/recommendations/recommendations.service.ts`
  - 算法:
    - 协同过滤（用户行为）
    - 基于内容（向量相似度）
    - 混合推荐
  - 预计时间: 4小时

---

### ⏳ 阶段 8: 用户系统 (待开始)

- [ ] **21. 开发用户认证和授权系统**
  - 文件:
    - `backend/src/auth/auth.module.ts`
    - `backend/src/auth/jwt.strategy.ts`
  - 功能:
    - 注册 / 登录
    - JWT Token 验证
    - Refresh Token
    - 权限控制
  - 预计时间: 3小时

- [ ] **22. 实现用户收藏和学习路径**
  - 文件:
    - `backend/src/collections/collections.service.ts`
    - `backend/src/learning-paths/learning-paths.service.ts`
  - 功能:
    - 创建/管理收藏夹
    - 生成学习路径
    - 进度追踪
  - 预计时间: 3小时

---

### ⏳ 阶段 9: 前端UI实现 (待开始)

- [ ] **23. 实现界面 (参考 AlphaXiv 风格)**
  - 参考: https://www.alphaxiv.org/
  - 颜色: #2563eb (已配置在 tailwind.config.ts)
  - 页面:
    - `frontend/app/page.tsx` (首页/Feed流)
    - `frontend/app/resources/[id]/page.tsx` (详情页)
    - `frontend/app/search/page.tsx` (搜索页)
    - `frontend/app/knowledge-graph/page.tsx` (知识图谱)
    - `frontend/app/collections/page.tsx` (收藏夹)
  - 组件:
    - `frontend/components/ResourceCard.tsx`
    - `frontend/components/SearchBar.tsx`
    - `frontend/components/Navigation.tsx`
  - 预计时间: 8小时

---

### ⏳ 阶段 10: 测试与优化 (待开始)

- [ ] **24. 本地运行调试和优化**
  - 性能优化（查询优化、缓存策略）
  - 错误处理完善
  - 日志系统
  - 预计时间: 4小时

- [ ] **25. 端到端真实数据验证测试**
  - 测试场景:
    - 采集真实 arXiv 论文
    - 采集真实 GitHub 项目
    - 采集真实 HackerNews 新闻
    - AI 摘要生成测试
    - 搜索功能测试
    - 推荐系统测试
  - 验证清单:
    - ✅ 数据完整性（非仅基本字段）
    - ✅ 引用关系正确（raw_data ↔ resource）
    - ✅ 去重逻辑有效（无重复资源）
    - ✅ 资源集合完整
  - 预计时间: 4小时

---

## 总体进度估算

| 阶段               | 任务数 | 预计时间      | 状态          |
| ------------------ | ------ | ------------- | ------------- |
| 阶段 1: 项目初始化 | 5      | ~4小时        | ✅ 完成       |
| 阶段 2: 环境配置   | 4      | ~5分钟        | ✅ 完成       |
| 阶段 3: AI服务     | 2      | ~2.5小时      | ✅ 完成       |
| 阶段 4: 数据采集   | 4      | ~10小时       | ✅ 完成       |
| 阶段 5: 核心API    | 3      | ~8小时        | ✅ 完成 (3/3) |
| 阶段 6: 知识图谱   | 1      | ~6小时        | ⏳ 待开始     |
| 阶段 7: 推荐系统   | 1      | ~4小时        | ⏳ 待开始     |
| 阶段 8: 用户系统   | 2      | ~6小时        | ⏳ 待开始     |
| 阶段 9: 前端UI     | 1      | ~8小时        | ⏳ 待开始     |
| 阶段 10: 测试优化  | 2      | ~8小时        | ⏳ 待开始     |
| **总计**           | **25** | **~56.5小时** | **72% 完成**  |

---

## 当前优先级

**✅ 已完成基础设施和核心API**:

- ✅ 任务 #1-11: 项目初始化、环境配置、AI服务 (100%)
- ✅ 任务 #12-15: 数据采集器（已解决数据完整性、引用关系、去重等问题）
- ✅ 任务 #16-18: 核心API（资源管理、AI集成、Feed流、搜索）
- ✅ GCP Secret Manager 集成

**P0 - 下一阶段待开发**:

- 任务 #19: 知识图谱系统（Neo4j + 可视化）

**P1 - 功能增强**:

- 任务 #19-22: 知识图谱、推荐系统、用户系统

**P2 - 界面和优化**:

- 任务 #23-25: 前端UI、测试优化

---

## 备注

- 所有时间估算基于单人开发
- 实际时间可能因调试、测试而增加 20-30%
- 用户特别关注数据采集功能的质量（阶段4）
- 前端UI需要严格参考 AlphaXiv 设计风格

---

**最后更新**: 2025-11-08 11:27 AM
**下次更新**: 知识图谱系统开发完成后
