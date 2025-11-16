# DeepDive Engine

> AI驱动的知识发现平台 - 从信息到洞察，重构你的知识探索之旅

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-完整文档-green.svg)](docs/readme.md)
[![PRD](https://img.shields.io/badge/产品-PRD-orange.svg)](docs/prd.md)

## 📖 项目简介

DeepDive Engine 是一个 **AI驱动的知识发现平台**，集成了内容聚合、AI分析、知识管理和智能办公功能。

### 🌟 核心特性

#### 📰 智能Feed流
- **多源数据聚合**: arXiv论文、GitHub项目、HackerNews资讯
- **AI增强**: 自动摘要、洞察生成、难度评估
- **个性化推荐**: 基于用户兴趣和阅读历史

#### 🤖 AI Office
- **智能文档编辑器**: AI辅助写作和内容生成
- **多模态支持**: 文本、表格、图表、代码
- **PPT生成**: AI自动生成演示文稿
- **协作功能**: 实时协作编辑

#### 📊 AI报告生成
- **多素材综合**: 选择2-10份资料生成分析报告
- **多种模板**: 对比分析、趋势报告、学习路径、文献综述
- **智能导出**: Markdown、PDF、DOCX格式

#### 🎯 知识管理
- **Workspace**: 组织和管理知识资源
- **智能标签**: AI自动分类和打标签
- **笔记系统**: Markdown笔记，支持AI增强

---

## 🚀 快速开始

### 前置要求

- **Node.js** 20+
- **Python** 3.11+
- **Docker** & Docker Compose
- **数据库**: PostgreSQL 16、MongoDB 7、Neo4j 5、Redis 7、Qdrant

### 一键启动（推荐）

#### Windows用户

```bash
# 停止所有服务并清理端口
stop-all.bat

# 启动所有服务
start-all.bat
```

详见: [服务管理指南](docs/guides/service-management.md)

#### 手动启动

**1. 克隆项目**

```bash
git clone https://github.com/JUNJIE-DUAN/deepdive-engine.git
cd deepdive-engine
```

**2. 配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入实际配置
# 主要配置项：
# - GROK_API_KEY: Grok AI API密钥（首选）
# - OPENAI_API_KEY: OpenAI API密钥（备用）
# - DATABASE_URL: PostgreSQL连接字符串
# - MONGODB_URI: MongoDB连接字符串
# - NEO4J_URI: Neo4j连接字符串
```

**3. 启动数据库**

```bash
docker-compose up -d
```

这将启动：
- PostgreSQL (5432) - 主数据库
- MongoDB (27017) - 原始数据存储
- Neo4j (7474, 7687) - 知识图谱
- Redis (6379) - 缓存
- Qdrant (6333) - 向量数据库

**4. 安装依赖**

```bash
# Monorepo根目录
npm install

# 前端
cd frontend && npm install

# 后端
cd ../backend && npm install

# AI服务
cd ../ai-service && pip install -r requirements.txt
```

**5. 数据库迁移**

```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # 可选：填充示例数据
```

**6. 启动服务**

```bash
# 终端1 - 前端 (端口3000)
cd frontend
npm run dev

# 终端2 - 后端 (端口4000)
cd backend
npm run dev

# 终端3 - AI服务 (端口5000)
cd ai-service
uvicorn main:app --reload --port 5000
```

**7. 访问应用**

- **前端**: http://localhost:3000
- **后端API**: http://localhost:4000/api/v1
- **AI服务**: http://localhost:5000/docs
- **Neo4j浏览器**: http://localhost:7474

详细启动指南: [开发指南](docs/guides/development.md)

---

## 📁 项目结构

```
deepdive-engine/
├── docs/                          # 📚 完整项目文档
│   ├── readme.md                  # 文档导航
│   ├── prd.md                     # 产品需求文档
│   ├── architecture/              # 架构设计
│   │   ├── overview.md
│   │   ├── ai-context.md
│   │   └── improvements-summary.md
│   ├── api/                       # API文档
│   │   └── readme.md
│   ├── guides/                    # 开发指南
│   │   ├── development.md
│   │   ├── deployment.md
│   │   ├── testing.md
│   │   ├── access.md
│   │   └── service-management.md
│   ├── features/                  # 功能文档
│   │   ├── ai-office/
│   │   ├── data-collection/
│   │   └── workspace-reporting/
│   └── archive/                   # 历史文档归档
│
├── frontend/                      # Next.js 14前端
│   ├── app/                       # App Router页面
│   │   ├── api/                   # API路由
│   │   ├── ai-office/             # AI Office功能
│   │   └── workspace/             # Workspace功能
│   ├── components/                # React组件
│   │   ├── ai-office/             # AI Office组件
│   │   ├── feed/                  # Feed流组件
│   │   └── workspace/             # Workspace组件
│   ├── lib/                       # 工具函数
│   └── stores/                    # Zustand状态管理
│
├── backend/                       # NestJS后端
│   ├── src/
│   │   ├── modules/               # 功能模块
│   │   │   ├── ai/                # AI服务集成
│   │   │   ├── resources/         # 资源管理
│   │   │   ├── reports/           # 报告生成
│   │   │   ├── notes/             # 笔记系统
│   │   │   ├── comments/          # 评论系统
│   │   │   └── crawler/           # 数据采集
│   │   ├── common/                # 共享代码
│   │   │   ├── filters/           # 全局异常过滤器
│   │   │   └── config/            # 配置（限流等）
│   │   └── proxy/                 # PDF/HTML代理服务
│   ├── prisma/                    # Prisma ORM
│   │   └── schema.prisma          # 数据库Schema
│   └── test/                      # 测试文件
│
├── ai-service/                    # FastAPI AI服务
│   ├── services/                  # AI客户端
│   │   ├── grok_client.py         # Grok API（首选）
│   │   ├── openai_client.py       # OpenAI API（备用）
│   │   └── orchestrator.py        # AI服务编排
│   ├── routers/                   # API路由
│   └── utils/                     # 工具函数
│
├── .claude/                       # Claude Code配置
│   ├── TODO.md                    # 任务追踪
│   └── PROJECT_STATUS.md          # 项目状态
│
├── docker-compose.yml             # 本地开发环境
├── project-rules.md               # 开发规范（v2.1）
├── stop-all.bat                   # 停止所有服务
├── start-all.bat                  # 启动所有服务
└── README.md                      # 本文件
```

---

## 🛠️ 技术栈

### 前端技术栈
- **框架**: Next.js 14 (App Router) + React 18 + TypeScript
- **样式**: TailwindCSS + shadcn/ui
- **状态管理**: Zustand
- **数据获取**: TanStack Query
- **富文本**: TipTap (AI Office)
- **图表**: D3.js (知识图谱可视化)

### 后端技术栈
- **框架**: NestJS 10 + Node.js 20 + TypeScript
- **API**: RESTful + GraphQL
- **ORM**: Prisma (PostgreSQL)
- **安全**: Helmet + @nestjs/throttler (限流)
- **文档**: Swagger/OpenAPI

### AI服务技术栈
- **框架**: FastAPI (Python 3.11)
- **AI提供商**:
  - **首选**: Grok API (x.AI) - 速度快、成本优
  - **备用**: OpenAI GPT-4 - 质量高、复杂推理
- **向量搜索**: Qdrant
- **Embedding**: sentence-transformers

### 数据库架构（五数据库）
- **PostgreSQL 16**: 用户、资源、笔记、评论等结构化数据
- **MongoDB 7**: 原始采集数据、非结构化内容
- **Neo4j 5**: 知识图谱、实体关系
- **Redis 7**: 缓存、会话管理
- **Qdrant**: 向量存储、语义搜索

---

## 📚 核心功能模块

### 1. 数据采集系统
- **arXiv**: 学术论文采集（每日500+ papers）
- **GitHub**: Trending项目采集
- **HackerNews**: 技术资讯采集
- **去重机制**: 基于externalId的智能去重
- **双向引用**: MongoDB ↔ PostgreSQL

### 2. AI增强服务
- **智能摘要**: 自动生成论文/项目摘要
- **洞察生成**: 提取关键insights
- **翻译服务**: 多语言支持
- **难度评估**: AI评估内容难度（1-10）
- **Fallback机制**: Grok失败自动切换OpenAI

### 3. AI Office功能
- **文档编辑器**: 富文本编辑（TipTap）
- **AI写作助手**: 智能补全、改写、扩展
- **多格式导出**: Markdown、HTML、DOCX、PDF
- **PPT生成**: AI自动生成演示文稿
- **模板系统**: 预定义文档模板

### 4. 报告生成系统
- **多素材分析**: 2-10份资料综合分析
- **报告模板**:
  - 📊 对比分析（技术选型）
  - 📈 趋势报告（技术演进）
  - 🗺️ 学习路径（知识依赖）
  - 📝 文献综述（学术风格）
- **智能导出**: Markdown/PDF/DOCX

### 5. Workspace管理
- **资源组织**: 文件夹、标签、收藏
- **协作功能**: 多人协作、权限管理
- **AI报告**: Workspace级别的AI分析报告
- **搜索**: 全文搜索 + 语义搜索

### 6. Feed流系统
- **个性化推荐**: 基于用户兴趣
- **筛选排序**: 类型、时间、难度、热度
- **实时更新**: 增量加载
- **AI摘要**: 每条内容的AI摘要

---

## 🔐 安全与最佳实践

### 安全措施
- ✅ **API限流**: 60请求/分钟（可配置）
- ✅ **安全Headers**: Helmet.js（CSP、HSTS等）
- ✅ **输入验证**: class-validator + Zod
- ✅ **SQL注入防护**: Prisma ORM参数化查询
- ✅ **密钥管理**: GCP Secret Manager + 环境变量
- ✅ **全局异常处理**: 统一错误响应格式

### 代码质量
- ✅ **TypeScript严格模式**: 类型安全
- ✅ **ESLint + Prettier**: 代码规范
- ✅ **Conventional Commits**: 提交规范
- ✅ **单元测试**: Jest测试框架（目标80%覆盖率）
- ✅ **E2E测试**: Playwright（待完善）

详见: [项目规则 v2.1](project-rules.md)

---

## 🧪 测试

```bash
# 后端单元测试
cd backend
npm test

# 特定测试
npm test -- hackernews.service.spec.ts

# 测试覆盖率
npm run test:cov

# E2E测试（待完善）
npm run test:e2e
```

当前测试状态:
- HackerNews Service: 69.2% (27/39 tests passing)
- Deduplication Service: 85.7% (24/28 tests passing)

---

## 📖 完整文档

### 📂 文档导航
所有文档已整理到 `docs/` 目录，详见: [文档导航](docs/readme.md)

### 🔍 快速链接
- [产品需求文档 (PRD)](docs/prd.md) - 产品愿景、核心功能、商业模式
- [架构总览](docs/architecture/overview.md) - 系统架构设计
- [API参考](docs/api/readme.md) - 完整API文档
- [开发指南](docs/guides/development.md) - 本地开发环境搭建
- [部署指南](docs/guides/deployment.md) - 生产环境部署
- [服务管理](docs/guides/service-management.md) - 服务启停脚本
- [AI Office文档](docs/features/ai-office/) - AI Office功能详细设计
- [项目规则](project-rules.md) - 开发规范 v2.1

### 📝 文档命名规范
从 v2.1 开始，**所有文件名强制使用小写字母**（5个例外：README.md、LICENSE、CHANGELOG.md、CONTRIBUTING.md、React组件）

详见: [项目规则 - 文件命名规范](project-rules.md#1-文件与目录命名规范-)

---

## 📊 项目状态

**当前版本**: v0.7-alpha
**完成度**: 约70%
**最后更新**: 2025-11-15

### ✅ 已完成
- [x] 产品定义和技术架构
- [x] 项目规范制定（v2.1）
- [x] Monorepo项目初始化
- [x] 五数据库架构搭建
- [x] 数据采集系统（arXiv、GitHub、HackerNews）
- [x] AI服务集成（Grok + OpenAI双保险）
- [x] Feed流展示
- [x] PDF/HTML代理预览
- [x] AI Office核心功能（文档编辑、导出）
- [x] 报告生成系统
- [x] Workspace管理
- [x] 安全加固（限流、Helmet、异常处理）
- [x] 测试框架建立

### 🚧 进行中
- [ ] AI Office完善（PPT生成、更多模板）
- [ ] 知识图谱可视化（Neo4j + D3.js）
- [ ] 用户认证系统（JWT）
- [ ] 测试覆盖率提升（目标80%）
- [ ] 性能优化（Redis缓存、查询优化）

### 📅 待开始
- [ ] 个性化推荐算法
- [ ] 移动端适配
- [ ] 国际化（i18n）
- [ ] 生产环境部署
- [ ] Beta测试

详细状态: [.claude/PROJECT_STATUS.md](.claude/PROJECT_STATUS.md)

---

## 🤝 贡献指南

### 开发流程

1. **Fork项目**
   ```bash
   git clone https://github.com/YOUR_USERNAME/deepdive-engine.git
   cd deepdive-engine
   ```

2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **遵循开发规范**
   - 文件命名: 全部小写 + 连字符（kebab-case）
   - 提交信息: Conventional Commits格式
   - 代码风格: ESLint + Prettier

4. **运行测试**
   ```bash
   npm test
   ```

5. **提交代码**
   ```bash
   git commit -m "feat(scope): add amazing feature"
   ```

6. **推送并创建PR**
   ```bash
   git push origin feature/amazing-feature
   # 然后在GitHub上创建Pull Request
   ```

### 开发规范
- **代码规范**: ESLint + Prettier
- **提交规范**: `feat|fix|docs|style|refactor|test|chore(scope): message`
- **分支规范**: `feature/*` | `bugfix/*` | `hotfix/*`
- **文件命名**: 小写 + 连字符（kebab-case）
- **AI使用**: Grok优先，OpenAI备用
- **密钥管理**: 环境变量或GCP Secret Manager，禁止硬编码

详见: [project-rules.md](project-rules.md)

---

## 📄 许可证

[MIT License](LICENSE)

---

## 👥 团队与联系

### 维护者
DeepDive Team

### 联系方式
- **GitHub**: https://github.com/JUNJIE-DUAN/deepdive-engine
- **Issues**: https://github.com/JUNJIE-DUAN/deepdive-engine/issues
- **Email**: team@deepdive-engine.com

### 参考设计
- [AlphaXiv](https://www.alphaxiv.org/) - UI设计参考

---

## 🙏 致谢

- **AI服务提供商**: x.AI (Grok)、OpenAI (GPT-4)
- **开源社区**: Next.js、NestJS、FastAPI、Prisma等优秀项目
- **数据源**: arXiv、GitHub、HackerNews

---

**Built with ❤️ by DeepDive Team**

*让知识获取更智能、更高效*
