# 会话恢复快速指南

**立即阅读**: `D:\projects\deepdive-engine\.claude\TODO.md`

---

## 当前状态（一句话）
基础设施搭建完成（44%），前后端+数据库+AI服务全部运行正常，准备开始数据采集器开发。

---

## 当前无阻塞
✅ 所有基础服务运行正常，进入数据采集器开发阶段（任务 #12-15）

---

## 运行中的服务

```bash
# 前端 - 正常运行
URL: http://localhost:3000
Status: ✅ RUNNING

# 后端 - 正常运行
Background Bash ID: ac1f3e
URL: http://localhost:4000
Status: ✅ RUNNING (Prisma connected to PostgreSQL)
Health: {"status":"ok","service":"DeepDive Backend","version":"1.0.0"}

# AI 服务 - 正常运行
Background Bash ID: 8826cd
URL: http://localhost:5000
Status: ✅ RUNNING (FastAPI + Grok/OpenAI orchestrator)
Health: {"status":"error","grok_available":false,"openai_available":false}
Note: API 密钥为占位符，服务框架正常运行
```

### 数据库容器状态
```bash
✅ PostgreSQL 16 @ localhost:5432
✅ Neo4j 5 @ localhost:7474/7687
✅ Redis 7 @ localhost:6379
✅ Qdrant @ localhost:6333
✅ MongoDB 7 @ localhost:27017
```

验证命令:
```bash
docker-compose ps
curl http://localhost:4000/api/v1/health
curl http://localhost:5000/api/v1/ai/health
```

---

## ✅ 已完成的任务（11/25, 44%）

### 阶段 1: 项目初始化 (5/5)
- ✅ 项目规范和架构文档
- ✅ 根目录配置文件
- ✅ 前端项目（Next.js + TypeScript + TailwindCSS）
- ✅ 后端项目（NestJS + Prisma）

### 阶段 2: 环境配置 (4/4)
- ✅ Docker Desktop 安装（v28.5.1）
- ✅ 5个数据库容器启动
- ✅ PostgreSQL 数据库初始化（Prisma migration）
- ✅ 后端数据库连接验证

### 阶段 3: AI服务 (2/2)
- ✅ FastAPI 项目结构搭建
- ✅ Grok + OpenAI 客户端集成
- ✅ AI 编排器（故障切换逻辑）
- ✅ 4个 AI API 端点（summary, insights, classify, health）

---

## 🎯 下一步任务（任务 #12-15）

**P0 - 立即开始**（用户最关注的功能）:

### 任务 #12: arXiv 论文采集器
- 文件: `backend/src/crawler/arxiv.service.ts`
- 关键要求:
  - ✅ 存储完整信息到 MongoDB `data_collection_raw_data` 集合
  - ✅ 建立 `raw_data` ↔ `resource` 的引用关系（rawDataId 字段）
  - ✅ 基于 arXiv ID 去重
  - ✅ 解析完整元数据（标题、作者、摘要、分类、PDF链接、发布日期等）

### 任务 #13: GitHub 项目采集器
- 文件: `backend/src/crawler/github.service.ts`
- 关键要求同上

### 任务 #14: HackerNews 采集器
- 文件: `backend/src/crawler/hackernews.service.ts`
- 关键要求同上

### 任务 #15: 统一去重和存储逻辑
- 文件: `backend/src/crawler/deduplication.service.ts`
- 实现: URL哈希 + 标题相似度检测

---

## 用户关键反馈（必须解决）

> 我手工测试了一下，发现3个巨大的问题：
> 1、data_collection_raw_data集合中，各类数据基本没有有效的信息，只存储了极其基本的信息
> 2、data_collection_raw_data的数据表中，根本没有对resource的任何引用
> 3、resource-xxx的数据集合，存在大量的重复，在业务代码上根本没有进行判重和去重
> 4、resource-xxx的数据集合不全

**解决方案**（必须在数据采集器中实现）:
- ✅ MongoDB 存储完整原始数据（所有字段）
- ✅ PostgreSQL resource 表添加 `rawDataId` 字段引用 MongoDB
- ✅ 实现去重逻辑（URL哈希 + 内容指纹）
- ✅ 确保所有字段完整采集

---

## 重要文件速查

| 文件 | 用途 | 状态 |
|------|------|------|
| `TODO.md` | **最重要** - 完整任务清单（11/25完成） | ✅ 最新 |
| `PROJECT_STATUS.md` | 完整项目状态和交接文档 | ⚠️ 需更新 |
| `prd.md` | 产品定位和功能需求 | ✅ 完成 |
| `project-rules.md` | 开发规范 | ✅ 完成 |
| `architecture.md` | 技术架构和数据库设计 | ✅ 完成 |

---

## 快速命令参考

```bash
# 查看后台进程
/bashes

# 查看进程输出
BashOutput tool with bash_id

# 数据库相关
docker-compose ps                    # 查看容器状态
docker-compose logs -f postgres      # 查看 PostgreSQL 日志
docker-compose logs -f mongo         # 查看 MongoDB 日志

# Prisma 相关
cd backend && npx prisma studio      # 打开数据库管理界面
cd backend && npx prisma migrate dev # 创建新迁移

# 测试服务
curl http://localhost:3000
curl http://localhost:4000/api/v1/health
curl http://localhost:5000/api/v1/ai/health
```

---

**最后更新**: 2025-11-08 10:55 AM
**下次更新时机**: 数据采集器开发完成后
