# 目录结构规范

**版本：** 1.0
**强制级别：** 🔴 MUST
**更新日期：** 2025-11-08

---

## 核心原则

```
✅ Monorepo 结构 - 前端、后端、AI服务、爬虫统一管理
✅ 模块化设计 - 每个服务独立但协同工作
✅ 清晰的分层 - API层、业务层、数据层明确分离
✅ 一致的结构 - 同类文件放在固定位置
✅ 易于导航 - 新开发者能快速找到代码
```

---

## 完整目录树

```
deepdive-engine/
│
├── 📄 readme.md                       ← 项目说明
├── 📄 prd.md                          ← 产品需求文档
├── 📄 architecture.md                 ← 技术架构文档
├── 📄 project-rules.md                ← 项目开发规范
├── 📄 .gitignore                      ← Git忽略规则
├── 📄 .env.example                    ← 环境变量模板
├── 📄 docker-compose.yml              ← 本地开发环境
├── 📄 package.json                    ← Monorepo根配置
│
├── frontend/                          ← ✅ Next.js 前端服务
│   ├── app/                           ← App Router
│   │   ├── page.tsx                   ← 首页
│   │   ├── layout.tsx                 ← 全局布局
│   │   ├── api/                       ← API Routes
│   │   └── (routes)/                  ← 路由组
│   ├── components/                    ← React组件
│   │   ├── ui/                        ← UI基础组件
│   │   ├── features/                  ← 功能组件
│   │   └── layout/                    ← 布局组件
│   ├── lib/                           ← 工具函数
│   │   ├── api.ts                     ← API客户端
│   │   ├── utils.ts                   ← 工具函数
│   │   └── hooks/                     ← 自定义Hooks
│   ├── public/                        ← 静态资源
│   ├── styles/                        ← 全局样式
│   ├── types/                         ← TypeScript类型定义
│   ├── .eslintrc.json                 ← ESLint配置
│   ├── tailwind.config.ts             ← TailwindCSS配置
│   ├── tsconfig.json                  ← TypeScript配置
│   ├── next.config.js                 ← Next.js配置
│   └── package.json                   ← 前端依赖
│
├── backend/                           ← ✅ NestJS 后端服务
│   ├── src/
│   │   ├── main.ts                    ← 应用入口
│   │   ├── app.module.ts              ← 根模块
│   │   ├── app.controller.ts          ← 根控制器
│   │   ├── common/                    ← 共享代码
│   │   │   ├── filters/               ← 异常过滤器
│   │   │   ├── guards/                ← 守卫
│   │   │   ├── interceptors/          ← 拦截器
│   │   │   ├── pipes/                 ← 管道
│   │   │   ├── decorators/            ← 装饰器
│   │   │   └── dto/                   ← 公共DTO
│   │   ├── modules/                   ← 功能模块（按领域）
│   │   │   ├── resource/              ← 资源管理模块
│   │   │   │   ├── resource.module.ts
│   │   │   │   ├── resource.controller.ts
│   │   │   │   ├── resource.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-resource.dto.ts
│   │   │   │   │   └── update-resource.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── resource.entity.ts
│   │   │   ├── feed/                  ← Feed流模块
│   │   │   ├── ai-summary/            ← AI总结模块
│   │   │   └── knowledge-graph/       ← 知识图谱模块
│   │   ├── proxy/                     ← 代理服务
│   │   │   ├── proxy.module.ts
│   │   │   └── proxy.controller.ts
│   │   ├── config/                    ← 配置管理
│   │   │   ├── database.config.ts
│   │   │   ├── neo4j.config.ts
│   │   │   └── mongodb.config.ts
│   │   └── utils/                     ← 工具函数
│   ├── prisma/                        ← Prisma ORM
│   │   ├── schema.prisma              ← 数据库Schema
│   │   ├── migrations/                ← 数据库迁移
│   │   └── seed.ts                    ← 种子数据
│   ├── test/                          ← E2E测试
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── .eslintrc.js                   ← ESLint配置
│   ├── tsconfig.json                  ← TypeScript配置
│   ├── nest-cli.json                  ← NestJS CLI配置
│   └── package.json                   ← 后端依赖
│
├── ai-service/                        ← ✅ Python AI服务
│   ├── main.py                        ← FastAPI应用入口
│   ├── routers/                       ← API路由
│   │   ├── __init__.py
│   │   └── ai.py                      ← AI相关端点
│   ├── services/                      ← 业务逻辑
│   │   ├── __init__.py
│   │   ├── grok_client.py             ← Grok API客户端
│   │   ├── openai_client.py           ← OpenAI客户端
│   │   ├── ai_orchestrator.py         ← AI服务编排
│   │   └── prompts.py                 ← Prompt模板
│   ├── models/                        ← 数据模型
│   │   ├── __init__.py
│   │   ├── request.py                 ← 请求模型
│   │   └── response.py                ← 响应模型
│   ├── utils/                         ← 工具函数
│   │   ├── __init__.py
│   │   ├── logger.py                  ← 日志配置
│   │   └── secret_manager.py          ← 密钥管理
│   ├── tests/                         ← 测试
│   │   ├── __init__.py
│   │   ├── test_grok_client.py
│   │   └── test_orchestrator.py
│   ├── requirements.txt               ← Python依赖
│   ├── .env.example                   ← 环境变量示例
│   └── pytest.ini                     ← Pytest配置
│
├── crawler/                           ← ✅ 数据采集服务
│   ├── src/
│   │   ├── index.ts                   ← 入口文件
│   │   ├── crawlers/                  ← 爬虫实现
│   │   │   ├── arxiv-crawler.ts       ← arXiv爬虫
│   │   │   ├── github-crawler.ts      ← GitHub爬虫
│   │   │   ├── hackernews-crawler.ts  ← HackerNews爬虫
│   │   │   └── base-crawler.ts        ← 爬虫基类
│   │   ├── parsers/                   ← 数据解析
│   │   │   ├── arxiv-parser.ts
│   │   │   ├── github-parser.ts
│   │   │   └── hn-parser.ts
│   │   ├── storage/                   ← 数据存储
│   │   │   ├── mongodb-client.ts      ← MongoDB客户端
│   │   │   └── postgres-client.ts     ← PostgreSQL客户端
│   │   ├── scheduler/                 ← 任务调度
│   │   │   └── cron-jobs.ts
│   │   ├── utils/                     ← 工具函数
│   │   │   ├── logger.ts
│   │   │   ├── deduplicator.ts        ← 去重逻辑
│   │   │   └── rate-limiter.ts
│   │   └── types/                     ← TypeScript类型
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                              ← ✅ 文档
│   ├── readme.md
│   ├── product/                       ← 产品文档
│   │   └── requirements.md
│   ├── tech/                          ← 技术文档
│   │   ├── architecture.md
│   │   ├── api-design.md
│   │   ├── database-schema.md
│   │   └── deployment.md
│   ├── development/                   ← 开发指南
│   │   ├── setup.md
│   │   ├── testing.md
│   │   └── troubleshooting.md
│   └── api/                           ← API文档
│       ├── backend-api.md
│       └── ai-service-api.md
│
├── .claude/                           ← ✅ 规范和配置
│   ├── standards/                     ← 规范文档库
│   │   ├── 00-overview.md
│   │   ├── 02-directory-structure.md
│   │   ├── 03-naming-conventions.md
│   │   ├── 04-code-style.md
│   │   ├── 05-api-design.md
│   │   ├── 06-database-design.md
│   │   ├── 07-testing-standards.md
│   │   ├── 08-git-workflow.md
│   │   ├── 09-documentation.md
│   │   ├── 10-security.md
│   │   ├── 11-deployment.md
│   │   └── 99-quick-reference.md
│   ├── tools/                         ← 自动化工具
│   │   ├── check-all.sh
│   │   ├── auto-fix.sh
│   │   ├── setup-standards.sh
│   │   └── validate-commit.sh
│   └── hooks/                         ← Git hooks
│       ├── install-hooks.sh
│       ├── pre-commit
│       ├── commit-msg
│       └── pre-push
│
├── scripts/                           ← 工具脚本
│   ├── setup.sh                       ← 项目初始化
│   ├── dev.sh                         ← 启动开发环境
│   ├── build.sh                       ← 构建所有服务
│   ├── test.sh                        ← 运行所有测试
│   └── migrate.sh                     ← 数据库迁移
│
├── infra/                             ← 基础设施代码
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.ai-service
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── frontend/
│   │   ├── backend/
│   │   └── ai-service/
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── .github/                           ← GitHub配置
    ├── workflows/
    │   ├── frontend-ci.yml            ← 前端CI
    │   ├── backend-ci.yml             ← 后端CI
    │   ├── ai-service-ci.yml          ← AI服务CI
    │   └── deploy.yml                 ← 部署流程
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   └── feature_request.md
    └── pull_request_template.md
```

---

## 目录规则

### 🔴 MUST - 严格遵守

#### 1. 服务独立性

```
✅ frontend/ - 完整的Next.js应用
✅ backend/ - 完整的NestJS应用
✅ ai-service/ - 完整的FastAPI应用
✅ crawler/ - 独立的数据采集服务

❌ 跨服务直接文件引用（必须通过API通信）
❌ 在根目录放置服务代码
```

#### 2. 模块化组织（Backend/NestJS）

```
✅ backend/src/modules/resource/
    ├── resource.module.ts
    ├── resource.controller.ts
    ├── resource.service.ts
    ├── dto/
    └── entities/

❌ backend/src/controllers/resource.controller.ts (分散结构)
❌ backend/src/services/resource.service.ts (分散结构)
```

#### 3. 组件化结构（Frontend/Next.js）

```
✅ frontend/components/ui/Button.tsx
✅ frontend/components/features/FeedCard.tsx
✅ frontend/components/layout/Header.tsx

❌ frontend/components/Button.tsx (未分类)
❌ frontend/Button.tsx (位置错误)
```

#### 4. Python模块结构（AI Service）

```
✅ ai-service/
    ├── __init__.py (包标记)
    ├── main.py
    ├── services/
    │   ├── __init__.py
    │   └── grok_client.py
    └── tests/
        ├── __init__.py
        └── test_grok_client.py

❌ ai-service/grok_client.py (应该在services/下)
❌ ai-service/services/ 目录缺少 __init__.py
```

#### 5. 配置文件位置

```
✅ 服务根目录：package.json, tsconfig.json, .eslintrc.js
✅ 项目根目录：docker-compose.yml, .gitignore, .env.example
✅ .claude/ 目录：规范、工具、hooks

❌ 配置文件混在代码目录中
❌ 多个相同配置文件在不同位置
```

---

## 各服务目录结构细则

### Frontend (Next.js 14)

#### App Router 结构

```
frontend/app/
├── page.tsx                    ← 首页 /
├── layout.tsx                  ← 根布局
├── loading.tsx                 ← 加载状态
├── error.tsx                   ← 错误处理
├── not-found.tsx               ← 404页面
├── (dashboard)/                ← 路由组（不影响URL）
│   ├── feed/
│   │   └── page.tsx            ← /feed
│   ├── knowledge-graph/
│   │   └── page.tsx            ← /knowledge-graph
│   └── layout.tsx              ← Dashboard布局
└── api/                        ← API Routes
    ├── resources/
    │   └── route.ts            ← GET/POST /api/resources
    └── feed/
        └── route.ts            ← GET /api/feed
```

#### Components 组织

```
frontend/components/
├── ui/                         ← 基础UI组件（可复用）
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Dialog.tsx
│   └── Input.tsx
├── features/                   ← 功能组件（业务相关）
│   ├── FeedCard.tsx
│   ├── ResourceDetail.tsx
│   ├── KnowledgeGraph.tsx
│   └── AIInsightPanel.tsx
└── layout/                     ← 布局组件
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### Backend (NestJS)

#### 模块组织

```
backend/src/modules/resource/
├── resource.module.ts          ← 模块定义
├── resource.controller.ts      ← 控制器（API端点）
├── resource.service.ts         ← 业务逻辑
├── dto/                        ← 数据传输对象
│   ├── create-resource.dto.ts
│   ├── update-resource.dto.ts
│   └── query-resource.dto.ts
├── entities/                   ← 实体定义
│   └── resource.entity.ts
├── interfaces/                 ← 接口定义
│   └── resource.interface.ts
└── resource.controller.spec.ts ← 测试
```

#### Common 目录

```
backend/src/common/
├── filters/                    ← 异常过滤器
│   └── http-exception.filter.ts
├── guards/                     ← 守卫（权限控制）
│   └── auth.guard.ts
├── interceptors/               ← 拦截器
│   └── logging.interceptor.ts
├── pipes/                      ← 管道（数据验证转换）
│   └── validation.pipe.ts
├── decorators/                 ← 自定义装饰器
│   └── user.decorator.ts
└── dto/                        ← 公共DTO
    └── pagination.dto.ts
```

### AI Service (FastAPI)

#### Python包结构

```
ai-service/
├── __init__.py                 ← 包标记
├── main.py                     ← FastAPI应用
├── routers/                    ← API路由
│   ├── __init__.py
│   └── ai.py
├── services/                   ← 业务逻辑
│   ├── __init__.py
│   ├── grok_client.py
│   ├── openai_client.py
│   └── ai_orchestrator.py
├── models/                     ← 数据模型
│   ├── __init__.py
│   ├── request.py
│   └── response.py
├── utils/                      ← 工具函数
│   ├── __init__.py
│   ├── logger.py
│   └── secret_manager.py
└── tests/                      ← 测试
    ├── __init__.py
    ├── test_grok_client.py
    └── test_orchestrator.py
```

**重要：** 每个Python包目录必须包含 `__init__.py` 文件！

---

## 不允许的结构

```
❌ 在项目根目录创建代码文件
❌ 跨服务直接引用文件（必须通过API）
❌ 混合不同服务的代码
❌ 配置文件分散在多个位置
❌ 测试文件与源代码文件分离过远
❌ Python包缺少 __init__.py
❌ 超过5层的深层嵌套目录
```

---

## 添加新功能的目录规范

### 场景 1：添加新的 Backend 模块

```bash
# 1. 创建模块目录
mkdir -p backend/src/modules/analytics

# 2. 创建必要文件
cd backend/src/modules/analytics
touch analytics.module.ts
touch analytics.controller.ts
touch analytics.service.ts
mkdir dto entities

# 3. 创建测试
touch analytics.controller.spec.ts
touch analytics.service.spec.ts
```

### 场景 2：添加新的 Frontend 页面

```bash
# 1. 在 app/ 下创建路由
mkdir -p frontend/app/analytics

# 2. 创建页面文件
cd frontend/app/analytics
touch page.tsx
touch layout.tsx
touch loading.tsx

# 3. 创建相关组件
mkdir -p frontend/components/features/analytics
touch frontend/components/features/analytics/AnalyticsChart.tsx
```

### 场景 3：添加新的 AI 服务功能

```bash
# 1. 创建服务文件
touch ai-service/services/text_analysis.py

# 2. 创建路由
# 在 ai-service/routers/ai.py 中添加端点

# 3. 创建测试
touch ai-service/tests/test_text_analysis.py

# 4. 确保包含 __init__.py
# 检查所有目录都有 __init__.py
```

---

## 检查清单

提交代码前检查：

- [ ] 所有文件都在正确的服务目录下
- [ ] NestJS模块使用模块化结构（module/controller/service）
- [ ] Next.js组件按类型分类（ui/features/layout）
- [ ] Python包都有 `__init__.py` 文件
- [ ] 测试文件与源代码在同一模块
- [ ] 配置文件在正确位置
- [ ] 没有跨服务直接文件引用
- [ ] 目录深度 < 5 层

---

## 常见问题

### Q: 某个文件应该放在哪里？

**A:** 按照这个优先级判断：

1. 是哪个服务？→ frontend/backend/ai-service/crawler
2. 是什么类型？→ 组件/API/服务/工具/配置
3. 是什么功能？→ 具体的业务模块

### Q: 跨服务共享代码怎么办？

**A:**

- **不推荐：** 直接文件引用
- **推荐：** 通过 API 通信
- **可选：** 创建独立的共享包（发布到 npm）

### Q: 测试文件放在哪里？

**A:**

- **NestJS：** 与源文件同目录，文件名 `*.spec.ts`
- **Next.js：** 与组件同目录，文件名 `*.test.tsx`
- **Python：** 在 `tests/` 目录，文件名 `test_*.py`

---

**记住：** 好的目录结构让项目易于理解和维护。遵循约定胜于配置的原则，新开发者能快速上手！
