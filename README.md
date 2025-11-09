# DeepDive Engine

> AI驱动的知识发现引擎 - 从信息到洞察，重构你的知识探索之旅

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRD](https://img.shields.io/badge/docs-PRD-green.svg)](PRD.md)
[![Architecture](https://img.shields.io/badge/docs-Architecture-orange.svg)](ARCHITECTURE.md)

## 📖 项目简介

DeepDive Engine 不是简单的内容聚合平台，而是一个**AI驱动的知识发现引擎**。

### 核心特性

- 🤖 **AI智能推荐** - 基于知识图谱的个性化推荐
- 🧠 **知识图谱** - 自动构建用户的知识网络
- 🎯 **学习路径** - AI生成定制化学习路线
- 📊 **洞察生成** - AI趋势报告、技术对比
- 🔍 **智能发现** - 主动推荐知识盲区

### 数据源

- 📄 **学术论文**: arXiv, Semantic Scholar
- 💻 **开源项目**: GitHub Trending
- 📰 **技术新闻**: HackerNews, TechCrunch
- 🏢 **大厂动态**: OpenAI/Google/Meta Blog

---

## 🚀 快速开始

### 前置要求

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 16+
- Neo4j 5+

### 安装步骤

#### 1. 克隆项目

\`\`\`bash
git clone https://github.com/JUNJIE-DUAN/deepdive-engine.git
cd deepdive-engine
\`\`\`

#### 2. 配置环境变量

\`\`\`bash
# 复制环境变量示例
cp .env.example .env

# 编辑.env文件，填入实际配置
\`\`\`

**选项 A: 使用 GCP Secret Manager（推荐）**

AI 服务支持从 GCP Secret Manager 自动获取密钥：

1. 在 GCP Secret Manager 中创建以下密钥：
   - `GROK_API_KEY`
   - `OPENAI_API_KEY`

2. 配置 `ai-service/.env`:
   \`\`\`env
   USE_GCP_SECRET_MANAGER=true
   GCP_PROJECT_ID=your-gcp-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   \`\`\`

3. 详细配置步骤请参考: [GCP Secret Manager 配置指南](ai-service/docs/GCP_SECRET_MANAGER_SETUP.md)

**选项 B: 使用环境变量（开发环境）**

直接在 `.env` 文件中配置：
- GROK_API_KEY
- OPENAI_API_KEY
- NEO4J_PASSWORD
- 等

#### 3. 启动数据库（Docker）

\`\`\`bash
docker-compose up -d
\`\`\`

这将启动：
- PostgreSQL (5432)
- Neo4j (7474, 7687)
- Redis (6379)
- Qdrant (6333)
- MongoDB (27017)

#### 4. 安装依赖

\`\`\`bash
# 根目录（monorepo）
npm install

# 前端
cd frontend
npm install

# 后端
cd ../backend
npm install

# AI服务
cd ../ai-service
pip install -r requirements.txt
\`\`\`

#### 5. 数据库迁移

\`\`\`bash
cd backend
npx prisma migrate dev
npx prisma db seed  # 可选：填充示例数据
\`\`\`

#### 6. 启动开发服务器

\`\`\`bash
# 终端1：前端
cd frontend
npm run dev  # http://localhost:3000

# 终端2：后端
cd backend
npm run dev  # http://localhost:4000

# 终端3：AI服务
cd ai-service
uvicorn main:app --reload --port 5000  # http://localhost:5000

# 终端4：数据采集器（可选）
cd crawler
npm run dev
\`\`\`

#### 7. 访问应用

打开浏览器访问: [http://localhost:3000](http://localhost:3000)

---

## 📁 项目结构

\`\`\`
deepdive-engine/
├── docs/                    # 文档
│   ├── PRD.md              # 产品需求文档
│   ├── ARCHITECTURE.md     # 技术架构
│   └── API.md              # API文档
│
├── frontend/               # Next.js前端
│   ├── app/               # App Router
│   ├── components/        # React组件
│   └── lib/               # 工具函数
│
├── backend/                # NestJS后端
│   ├── src/
│   │   ├── modules/       # 功能模块
│   │   └── common/        # 共享代码
│   └── prisma/            # 数据库Schema
│
├── ai-service/             # Python AI服务
│   ├── services/          # AI客户端
│   └── models/            # ML模型
│
├── crawler/                # 数据采集
│   └── src/crawlers/      # 各数据源爬虫
│
├── docker-compose.yml      # 本地开发环境
├── PROJECT_RULES.md        # 开发规范
└── README.md               # 本文件
\`\`\`

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14, React 18, TypeScript
- **样式**: TailwindCSS（参考AlphaXiv风格）
- **状态**: Zustand
- **数据**: TanStack Query
- **图表**: D3.js

### 后端
- **框架**: NestJS, Node.js 20
- **API**: GraphQL, REST
- **ORM**: Prisma
- **认证**: JWT

### AI服务
- **首选**: Grok API (x.AI)
- **备用**: OpenAI GPT-4
- **框架**: FastAPI (Python)

### 数据库
- **主库**: PostgreSQL 16
- **图谱**: Neo4j 5
- **向量**: Qdrant
- **缓存**: Redis 7
- **原始**: MongoDB 7

---

## 📚 核心功能

### 1. 智能发现
- 个性化Feed（基于知识图谱）
- AI日报（每日3大技术突破）
- 知识盲区主动提醒

### 2. 知识管理
- 个人知识图谱自动构建
- 智能收藏分类
- 笔记与标注（AI增强）

### 3. 学习辅助
- AI学习路径生成
- 难度自适应推荐
- 进度可视化追踪

### 4. 洞察生成
- 每周AI趋势报告
- 技术对比分析
- 研究空白发现

---

## 🧪 测试

\`\`\`bash
# 单元测试
npm test

# E2E测试
npm run test:e2e

# 覆盖率
npm run test:cov
\`\`\`

---

## 📖 文档

- [产品需求文档 (PRD)](PRD.md)
- [技术架构设计](ARCHITECTURE.md)
- [项目开发规范](PROJECT_RULES.md)
- [API文档](docs/API.md) _(待创建)_
- [部署指南](docs/DEPLOYMENT.md) _(待创建)_

---

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (\`git checkout -b feature/amazing-feature\`)
3. 提交代码 (\`git commit -m 'feat: add amazing feature'\`)
4. 推送到分支 (\`git push origin feature/amazing feature\`)
5. 打开 Pull Request

**注意**: 请遵循 [项目开发规范](PROJECT_RULES.md)

---

## 📝 开发规范

- **代码规范**: ESLint + Prettier
- **提交规范**: Conventional Commits
- **分支规范**: feature/* | bugfix/* | hotfix/*
- **AI使用**: Grok优先，OpenAI备用
- **密钥管理**: 使用secretManager，禁止硬编码

详见: [PROJECT_RULES.md](PROJECT_RULES.md)

---

## 🔐 安全

- 所有API密钥存储在secretManager
- 不提交\`.env\`文件到Git
- 定期更新依赖（\`npm audit\`）
- 遵循OWASP安全最佳实践

---

## 📊 项目状态

- [x] 产品定义完成
- [x] 技术架构设计完成
- [x] 项目规范制定完成
- [x] 项目初始化完成
- [x] 核心功能开发（进行中 90%）
  - [x] 数据采集（arXiv, GitHub, HackerNews）
  - [x] AI总结与洞察生成
  - [x] Feed流展示
  - [x] PDF/HTML代理预览
  - [ ] 知识图谱可视化
  - [ ] 用户认证系统
- [ ] Beta测试（待开始）
- [ ] 生产部署（待开始）

---

## 📄 许可证

[MIT License](LICENSE)

---

## 👥 团队

- **产品**: Product Team
- **开发**: Engineering Team
- **AI**: AI Team

---

## 🔗 相关链接

- **参考设计**: [AlphaXiv](https://www.alphaxiv.org/)
- **官网**: _(待部署)_
- **博客**: _(待创建)_

---

## 📞 联系我们

- **Issues**: [GitHub Issues](https://github.com/JUNJIE-DUAN/deepdive-engine/issues)
- **Email**: team@deepdive-engine.com

---

**Built with ❤️ by DeepDive Team**
