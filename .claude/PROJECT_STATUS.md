# DeepDive Engine - 项目状态文档

**最后更新**: 2025-11-08 09:47 AM
**会话标识**: Stage 2 - 项目初始化与本地测试

---

## 一、项目概览

### 核心定位

- **产品名称**: DeepDive Engine
- **Slogan**: "从信息到洞察，AI重构你的知识探索之旅"
- **定位**: AI驱动的知识发现引擎（非简单内容聚合）
- **参考设计**: https://www.alphaxiv.org/
- **数据源**: Papers, News, 开源项目, 顶会, 大厂RSS

### 技术栈

```
Frontend:  Next.js 14 + React 18 + TypeScript + TailwindCSS
Backend:   NestJS 10 + Prisma ORM + PostgreSQL
AI Service: FastAPI + Grok API (首选) + OpenAI (备用)
Databases: PostgreSQL 16, Neo4j 5, Redis 7, Qdrant 1.7, MongoDB 7
```

---

## 二、当前进度总览

### ✅ 已完成 (5/17)

1. ✅ 定义项目规则和开发规范 → `project-rules.md`
2. ✅ 创建技术架构设计文档 → `architecture.md`
3. ✅ 创建根目录配置文件 → `package.json`, `docker-compose.yml`, `.env`
4. ✅ 初始化前端项目 → `frontend/` 完整结构，476个依赖包已安装
5. ✅ 初始化后端项目 → `backend/` 完整结构，647个依赖包已安装

### ⚠️ 进行中 (1/17)

6. ⚠️ **安装 Docker Desktop for Windows** ← **当前阻塞**

### ⏳ 待开始 (11/17)

7. 启动数据库容器
8. 验证后端数据库连接
9. 初始化AI服务（FastAPI + Python）
10. 集成AI服务（Grok首选，OpenAI备用，使用secretManager）
11. 开发数据采集器（arXiv, GitHub, HackerNews）
12. 实现内容展示系统（Feed, 详情页, 搜索）
13. 实现AI摘要和关键洞察提取
14. 构建知识图谱系统（Neo4j + 可视化）
15. 实现个性化推荐引擎
16. 开发用户认证和授权系统
17. 实现界面（参考AlphaXiv风格）
18. 本地运行调试和优化
19. 端到端真实数据验证测试

---

## 三、当前运行状态

### 运行中的服务

```bash
# Frontend (Background Bash 32ebac)
Status: ✅ RUNNING
URL:    http://localhost:3000
Port:   3000
Command: cd "D:\projects\deepdive-engine\frontend" && npm run dev

# Backend (Background Bash c3d6e3)
Status: ⚠️ 代码编译成功，等待数据库
Port:   4000 (预期)
Command: cd "D:\projects\deepdive-engine\backend" && npm run dev
Error:  PrismaClientInitializationError: Can't reach database server at localhost:5432
```

### 数据库状态

| 服务       | 状态      | 端口      | 镜像                 | 备注         |
| ---------- | --------- | --------- | -------------------- | ------------ |
| PostgreSQL | ❌ 未启动 | 5432      | postgres:16-alpine   | 主数据库     |
| Neo4j      | ❌ 未启动 | 7474/7687 | neo4j:5-community    | 知识图谱     |
| Redis      | ❌ 未启动 | 6379      | redis:7-alpine       | 缓存         |
| Qdrant     | ❌ 未启动 | 6333      | qdrant/qdrant:v1.7.0 | 向量数据库   |
| MongoDB    | ❌ 未启动 | 27017     | mongo:7              | 原始数据存储 |

---

## 四、关键文件清单

### 📄 文档文件

```
D:\projects\deepdive-engine\
├── prd.md                    # 产品需求文档 v2.0（AI驱动定位）
├── project-rules.md          # 开发规范（代码标准、Git流程、AI使用规则）
├── architecture.md           # 技术架构设计（系统架构、数据库设计、API规范）
├── readme.md                 # 项目说明文档
└── .claude/
    └── PROJECT_STATUS.md     # 本文件 - 项目状态交接文档
```

### ⚙️ 配置文件

```
D:\projects\deepdive-engine\
├── .env                      # 环境变量（包含secretManager占位符）
├── .gitignore                # Git忽略规则
├── docker-compose.yml        # 数据库容器编排
├── package.json              # 根package.json（workspaces配置）
├── frontend/
│   ├── package.json          # 前端依赖（476个包已安装）
│   ├── next.config.js        # Next.js配置
│   ├── tailwind.config.ts    # TailwindCSS配置（AlphaXiv蓝色主题）
│   └── tsconfig.json         # TypeScript配置
└── backend/
    ├── package.json          # 后端依赖（647个包已安装）
    ├── nest-cli.json         # NestJS CLI配置
    ├── tsconfig.json         # TypeScript配置
    └── prisma/
        └── schema.prisma     # 数据库Schema（User, Resource, Collection等）
```

### 💻 核心代码文件

```
frontend/
├── app/
│   ├── layout.tsx            # 根布局（元数据、全局字体）
│   ├── page.tsx              # 首页（当前显示"前端项目已初始化成功"）
│   └── globals.css           # 全局样式（TailwindCSS导入）
└── lib/
    └── (待创建: API客户端、状态管理、工具函数)

backend/
├── src/
│   ├── main.ts               # 应用入口（CORS、验证、端口4000）
│   ├── app.module.ts         # 根模块（ConfigModule、PrismaModule）
│   ├── app.controller.ts     # 根控制器（/api/v1, /api/v1/health）
│   ├── app.service.ts        # 根服务（欢迎消息）
│   └── common/
│       └── prisma/
│           ├── prisma.service.ts   # Prisma数据库服务
│           └── prisma.module.ts    # Prisma全局模块
└── (待创建: auth, resources, collections, ai, crawler等模块)
```

---

## 五、当前阻塞问题

### 🚫 主要阻塞

**问题**: Docker Desktop 未安装
**影响**: 无法启动数据库容器，后端无法连接 PostgreSQL
**错误信息**:

```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
Error Code: P1001
```

**解决方案**: 用户需要手动安装 Docker Desktop for Windows

1. 下载地址: https://www.docker.com/products/docker-desktop/
2. 安装时选择 "Use WSL 2 instead of Hyper-V"
3. 安装完成后重启计算机
4. 验证安装: `docker --version` 和 `docker-compose --version`

### 📋 次要问题

1. **API密钥占位符**: `.env` 中 GROK_API_KEY 和 OPENAI_API_KEY 为占位符
   - 解决: 后续从 secretManager 获取真实密钥
2. **AI服务未创建**: FastAPI 项目结构尚未初始化
3. **数据采集器未开发**: arXiv、GitHub、HackerNews 爬虫未实现

---

## 六、下一步操作指南

### Docker 安装完成后立即执行

#### Step 1: 启动数据库容器

```bash
cd D:\projects\deepdive-engine
docker-compose up -d
```

#### Step 2: 验证容器状态

```bash
docker-compose ps
# 应该看到所有服务状态为 "Up"
```

#### Step 3: 初始化数据库结构

```bash
cd backend
npx prisma migrate dev --name init
```

#### Step 4: 重启后端服务

```bash
# 杀掉当前后端进程
# 使用 KillShell 工具终止 bash_id: c3d6e3

# 重新启动后端
cd D:\projects\deepdive-engine\backend
npm run dev
```

#### Step 5: 验证完整运行

```bash
# 测试前端
curl http://localhost:3000

# 测试后端健康检查
curl http://localhost:4000/api/v1/health

# 应该返回:
# {
#   "status": "ok",
#   "timestamp": "2025-11-08T...",
#   "service": "DeepDive Backend",
#   "version": "1.0.0"
# }
```

### 后续开发顺序（Docker启动后）

**阶段 3: AI服务开发**

1. 创建 `ai-service/` 目录结构
2. 初始化 FastAPI 项目
3. 实现 Grok API 客户端（优先）
4. 实现 OpenAI API 客户端（备用）
5. 实现故障切换逻辑
6. 集成 secretManager

**阶段 4: 数据采集器**

1. 创建 `backend/src/crawler/` 模块
2. 实现 arXiv 论文采集器
3. 实现 GitHub 项目采集器
4. 实现 HackerNews 新闻采集器
5. 实现数据去重和存储逻辑

**阶段 5: 核心功能实现**

1. 资源管理 API（CRUD）
2. AI摘要生成集成
3. 搜索功能（全文 + 语义）
4. Feed流展示
5. 用户认证系统

**阶段 6: 知识图谱**

1. Neo4j 集成
2. 实体提取和关系构建
3. D3.js 可视化组件

**阶段 7: 前端UI实现**

1. 参考 AlphaXiv 设计实现组件库
2. Feed 页面
3. 详情页
4. 搜索页
5. 知识图谱可视化页

**阶段 8: 端到端测试**

1. 真实数据采集测试
2. AI生成测试
3. 用户流程测试
4. 性能优化

---

## 七、重要配置速查

### 环境变量 (.env)

```bash
# AI服务（待从secretManager获取）
GROK_API_KEY=your_grok_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 数据库连接
DATABASE_URL=postgresql://deepdive:deepdive_dev_password@localhost:5432/deepdive
NEO4J_URL=bolt://localhost:7687
MONGO_URL=mongodb://deepdive:mongo_dev_password@localhost:27017/deepdive
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333

# 应用配置
NODE_ENV=development
BACKEND_PORT=4000
AI_SERVICE_PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=deepdive_dev_secret_key_change_in_production
```

### 端口映射

```
3000  → Frontend (Next.js)
4000  → Backend API (NestJS)
5000  → AI Service (FastAPI, 待创建)
5432  → PostgreSQL
6379  → Redis
6333  → Qdrant
7474  → Neo4j HTTP
7687  → Neo4j Bolt
27017 → MongoDB
```

### Prisma 数据模型

```prisma
- User (用户)
- Resource (资源: 论文/项目/新闻/活动/RSS)
- Collection (收藏夹)
- UserActivity (用户行为)
- LearningPath (学习路径)
```

---

## 八、关键设计决策记录

### 1. AI服务选型

- **首选**: Grok API (x.AI)
- **备用**: OpenAI GPT-4
- **切换策略**: 失败计数达阈值自动切换
- **密钥管理**: secretManager（非硬编码）

### 2. UI设计风格

- **参考**: https://www.alphaxiv.org/
- **主题色**: #2563eb (AlphaXiv蓝)
- **设计原则**: 简洁、学术、专业

### 3. 数据采集策略

- **去重**: 基于资源URL和标题哈希
- **更新频率**:
  - 论文: 每日
  - 新闻: 每小时
  - GitHub: 每6小时
- **存储**: 原始数据 → MongoDB, 结构化数据 → PostgreSQL

### 4. 知识图谱设计

- **节点类型**: Paper, Author, Topic, Institution, Project
- **关系类型**: CITES, AUTHORED_BY, BELONGS_TO, RELATED_TO
- **可视化**: D3.js force-directed graph

---

## 九、恢复会话检查清单

当新会话接手项目时，请按以下清单验证：

- [ ] 阅读 `prd.md` 了解产品定位
- [ ] 阅读 `project-rules.md` 了解开发规范
- [ ] 阅读 `architecture.md` 了解技术架构
- [ ] 阅读本文件 `PROJECT_STATUS.md` 了解当前状态
- [ ] 检查 Docker 是否已安装: `docker --version`
- [ ] 检查数据库容器是否运行: `docker-compose ps`
- [ ] 检查前端是否运行: 访问 http://localhost:3000
- [ ] 检查后端是否运行: `curl http://localhost:4000/api/v1/health`
- [ ] 查看待办事项列表确定下一步任务
- [ ] 确认是否有用户新的指示或反馈

---

## 十、联系与支持

**项目路径**: `D:\projects\deepdive-engine\`
**Git仓库**: 尚未初始化（需要先 `git init`）
**文档版本**: v1.0
**更新频率**: 每完成一个阶段或遇到重要变更时更新

---

**🔴 重要提醒**:

- Docker 安装是当前唯一阻塞项
- 前端已正常运行在 http://localhost:3000
- 后端代码编译成功，仅等待数据库连接
- 所有核心配置文件和项目结构已完成
- 可随时从本文件恢复工作上下文
