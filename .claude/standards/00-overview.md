# DeepDive Engine - 开发规范总览

**版本：** 1.0
**更新日期：** 2025-11-08
**规范级别：** 🔴 MUST

---

## 规范体系架构

DeepDive Engine 采用系统化、自动化的开发规范体系，确保代码质量、团队协作效率和项目长期可维护性。

### 核心理念

```
✅ 标准化 - 统一的代码风格和项目结构
✅ 自动化 - 自动检查、自动格式化、自动部署
✅ 文档化 - 代码即文档，文档即代码
✅ 可追溯 - 清晰的Git历史和变更记录
✅ 高质量 - 测试覆盖率 > 85%，代码审查必须
```

---

## 规范文档索引

### 📋 基础规范

| 编号 | 文档                                  | 描述                         | 级别    |
| ---- | ------------------------------------- | ---------------------------- | ------- |
| 00   | [总览](00-overview.md)                | 规范体系架构和使用指南       | 🔴 MUST |
| 02   | [目录结构](02-directory-structure.md) | Monorepo 项目目录组织规范    | 🔴 MUST |
| 03   | [命名规范](03-naming-conventions.md)  | 文件、类、函数、变量命名规则 | 🔴 MUST |

### 💻 代码质量

| 编号 | 文档                                | 描述                              | 级别      |
| ---- | ----------------------------------- | --------------------------------- | --------- |
| 04   | [代码风格](04-code-style.md)        | TypeScript/Python 代码规范        | 🔴 MUST   |
| 05   | [API 设计](05-api-design.md)        | RESTful/GraphQL API 设计规范      | 🔴 MUST   |
| 06   | [数据库设计](06-database-design.md) | PostgreSQL/MongoDB/Neo4j 设计规范 | 🟡 SHOULD |
| 07   | [测试规范](07-testing-standards.md) | 单元/集成/E2E 测试规范            | 🔴 MUST   |

### 🔄 流程规范

| 编号 | 文档                             | 描述                          | 级别      |
| ---- | -------------------------------- | ----------------------------- | --------- |
| 08   | [Git 工作流](08-git-workflow.md) | 分支策略、提交规范、PR 流程   | 🔴 MUST   |
| 09   | [文档规范](09-documentation.md)  | 代码注释、技术文档、CHANGELOG | 🔴 MUST   |
| 10   | [安全规范](10-security.md)       | 密钥管理、数据安全、漏洞防护  | 🔴 MUST   |
| 11   | [部署规范](11-deployment.md)     | CI/CD、环境配置、监控告警     | 🟡 SHOULD |

### 🚀 快速参考

| 编号 | 文档                              | 描述               |
| ---- | --------------------------------- | ------------------ |
| 99   | [快速参考](99-quick-reference.md) | 常用命令和检查清单 |

---

## 技术栈概览

DeepDive Engine 是一个 **Monorepo** 项目，包含三个主要服务：

### 前端 (Frontend)

- **框架：** Next.js 14, React 18, TypeScript
- **样式：** TailwindCSS
- **状态管理：** Zustand
- **数据获取：** TanStack Query
- **图表：** D3.js

### 后端 (Backend)

- **框架：** NestJS, Node.js 20, TypeScript
- **API：** REST + GraphQL
- **ORM：** Prisma
- **认证：** JWT
- **数据库：** PostgreSQL 16, MongoDB 7, Neo4j 5

### AI 服务 (AI Service)

- **框架：** FastAPI, Python 3.11
- **AI 提供商：** Grok API (首选), OpenAI GPT-4 (备用)
- **数据处理：** Pandas, NumPy
- **向量数据库：** Qdrant

### 数据采集 (Crawler)

- **语言：** TypeScript/Node.js
- **爬虫：** Puppeteer, Cheerio
- **数据源：** arXiv, GitHub, HackerNews

---

## 规范级别说明

### 🔴 MUST（必须遵守）

- 违反会导致代码审查不通过
- CI/CD 自动检查会失败
- 必须在合并前修复

**示例：**

- 代码必须通过 ESLint/Pylint 检查
- 测试覆盖率必须 > 85%
- 提交信息必须遵循 Conventional Commits
- 所有 API 密钥必须通过 SecretManager

### 🟡 SHOULD（强烈建议）

- 建议遵守以提高代码质量
- Code Review 时会提醒
- 可以在特殊情况下例外

**示例：**

- 函数名长度建议 3-40 字符
- 注释应该解释"为什么"而不是"是什么"
- PR 改动建议 < 500 行

### 🟢 MAY（可选）

- 根据具体情况决定
- 鼓励但不强制

**示例：**

- 可以使用更高级的 TypeScript 特性
- 可以添加性能优化注释

---

## 工具和自动化

### `.claude/tools/` - 自动化脚本

| 工具                 | 功能             | 使用方式                                |
| -------------------- | ---------------- | --------------------------------------- |
| `check-all.sh`       | 运行所有代码检查 | `bash .claude/tools/check-all.sh`       |
| `auto-fix.sh`        | 自动修复格式问题 | `bash .claude/tools/auto-fix.sh`        |
| `setup-standards.sh` | 初始化项目规范   | `bash .claude/tools/setup-standards.sh` |
| `validate-commit.sh` | 验证提交信息格式 | `bash .claude/tools/validate-commit.sh` |

### `.claude/hooks/` - Git Hooks

| Hook         | 功能                   |
| ------------ | ---------------------- |
| `pre-commit` | 提交前自动格式化和检查 |
| `commit-msg` | 验证提交信息格式       |
| `pre-push`   | 推送前运行测试         |

**安装 Hooks：**

```bash
bash .claude/hooks/install-hooks.sh
```

---

## 快速开始

### 1. 新开发者上手

```bash
# 1. 克隆项目
git clone https://github.com/JUNJIE-DUAN/deepdive-engine.git
cd deepdive-engine

# 2. 安装 Git Hooks
bash .claude/hooks/install-hooks.sh

# 3. 阅读核心规范
cat .claude/standards/00-overview.md
cat .claude/standards/08-git-workflow.md
cat .claude/standards/03-naming-conventions.md

# 4. 运行自动检查
bash .claude/tools/check-all.sh
```

### 2. 开发新功能

```bash
# 1. 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/001-add-feature

# 2. 开发代码
# ... 编写代码和测试 ...

# 3. 提交前检查
bash .claude/tools/check-all.sh

# 4. 提交代码
git commit -m "feat(module): add feature description"

# 5. 推送并创建 PR
git push origin feature/001-add-feature
```

### 3. Code Review 检查清单

- [ ] 代码遵循命名规范 ([03-naming-conventions.md](03-naming-conventions.md))
- [ ] 代码通过所有自动检查 (ESLint, Pylint, Prettier)
- [ ] 测试覆盖率 > 85% ([07-testing-standards.md](07-testing-standards.md))
- [ ] 提交信息遵循 Conventional Commits ([08-git-workflow.md](08-git-workflow.md))
- [ ] API 变更已更新文档 ([09-documentation.md](09-documentation.md))
- [ ] 没有硬编码的密钥或敏感信息 ([10-security.md](10-security.md))
- [ ] PR 描述清晰，包含测试步骤

---

## 常见问题 FAQ

### Q1: 如何运行自动检查？

```bash
# 检查前端
cd frontend && npm run lint && npm run type-check

# 检查后端
cd backend && npm run lint && npm run test

# 检查 AI 服务
cd ai-service && pylint services/ && pytest --cov=services
```

### Q2: 提交信息格式是什么？

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例：**

```
feat(crawler): add arXiv paper crawler

- Implement RSS feed parser for arXiv
- Add deduplication based on paper ID
- Support filtering by category

Closes #123
```

详见：[08-git-workflow.md](08-git-workflow.md)

### Q3: 如何添加新的 API 端点？

1. 在对应模块创建 endpoint
2. 编写 DTO/Schema validation
3. 添加单元测试和集成测试
4. 更新 API 文档

详见：[05-api-design.md](05-api-design.md)

### Q4: 密钥管理怎么做？

- **开发环境：** `.env` 文件（不提交到 Git）
- **生产环境：** GCP Secret Manager
- **禁止：** 硬编码密钥到代码

详见：[10-security.md](10-security.md)

---

## 学习路径

### 新手开发者（0-3 个月经验）

1. 阅读 [00-overview.md](00-overview.md)
2. 阅读 [03-naming-conventions.md](03-naming-conventions.md)
3. 阅读 [08-git-workflow.md](08-git-workflow.md)
4. 阅读 [99-quick-reference.md](99-quick-reference.md)
5. 开始做小任务，提 PR，接受 Code Review

### 中级开发者（3-12 个月经验）

1. 深入学习 [04-code-style.md](04-code-style.md)
2. 深入学习 [05-api-design.md](05-api-design.md)
3. 深入学习 [07-testing-standards.md](07-testing-standards.md)
4. 开始 Review 别人的代码
5. 开始设计和实现复杂功能

### 高级开发者（1 年以上经验）

1. 深入学习 [06-database-design.md](06-database-design.md)
2. 深入学习 [10-security.md](10-security.md)
3. 深入学习 [11-deployment.md](11-deployment.md)
4. 制定架构决策
5. 指导其他开发者

---

## 规范更新流程

### 如何提议规范变更？

1. **创建 Issue**

   ```
   标题：[STANDARD] Propose change to naming convention
   内容：描述问题和建议的改进
   ```

2. **讨论和投票**
   - 团队成员讨论
   - 至少 2/3 成员同意

3. **更新文档**
   - 创建 PR 更新对应规范文档
   - 更新版本号
   - 更新"更新日期"

4. **通知团队**
   - 在团队会议上宣布
   - 发送邮件通知所有成员

---

## 联系和反馈

- **Issues：** [GitHub Issues](https://github.com/JUNJIE-DUAN/deepdive-engine/issues)
- **讨论：** 创建 Issue 标签为 `question` 或 `standard`
- **贡献：** 参考 [CONTRIBUTING.md](../../docs/CONTRIBUTING.md)

---

**记住：** 规范的目的是提高效率和质量，而不是限制创造力。如果规范阻碍了你的工作，请提出改进建议！
