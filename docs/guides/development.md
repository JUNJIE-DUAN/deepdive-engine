# DeepDive Engine 开发指南

欢迎加入DeepDive Engine开发团队！本指南将帮助您快速上手项目开发。

---

## 📚 目录

- [快速开始](#快速开始)
- [工程规范](#工程规范)
- [开发工作流](#开发工作流)
- [常见问题FAQ](#常见问题faq)
- [故障排除](#故障排除)

---

## 🚀 快速开始

### 1. 环境要求

- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 15.0
- **MongoDB**: >= 7.0
- **Python**: >= 3.11 (AI服务)

### 2. 克隆项目

```bash
git clone https://github.com/your-org/deepdive-engine.git
cd deepdive-engine
```

### 3. 安装依赖

```bash
# 安装所有依赖（monorepo）
npm install

# Husky Git hooks会自动安装
```

### 4. 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 编辑配置文件填入实际值
```

### 5. 启动数据库

```bash
# 使用Docker启动数据库
npm run db:setup

# 运行数据库迁移
npm run db:migrate
```

### 6. 启动开发服务器

```bash
# 同时启动frontend, backend, ai-service
npm run dev

# 或分别启动
npm run dev:frontend   # http://localhost:3000
npm run dev:backend    # http://localhost:4000
npm run dev:ai         # http://localhost:5000
```

---

## 📐 工程规范

### 必读文档

所有开发人员**必须**阅读以下标准文档：

1. **[代码风格指南](.claude/standards/04-code-style.md)** 🔴 MUST READ
   - TypeScript/Python/React编码规范
   - 命名规范、注释规范
   - 常见反模式

2. **[API设计规范](.claude/standards/05-api-design.md)** 🔴 MUST READ
   - RESTful API设计原则
   - 请求/响应格式
   - 错误处理标准

3. **[数据库设计规范](.claude/standards/06-database-design.md)** 🔴 MUST READ
   - PostgreSQL+MongoDB双库策略
   - Schema设计原则
   - 数据一致性保证

4. **[测试标准](.claude/standards/07-testing-standards.md)** 🔴 MUST READ
   - Testing Trophy策略
   - 单元/集成/E2E测试指南
   - 覆盖率要求（50% → 70% → 85%）

5. **[文档编写规范](.claude/standards/09-documentation.md)** 🟡 SHOULD READ
   - README规范
   - 代码注释规范
   - ADR编写指南

### 核心原则

#### 1. 类型安全 🔴 MUST

- ✅ TypeScript严格模式已启用
- ❌ 禁止使用`any`类型
- ✅ 所有公共函数必须有类型标注

#### 2. 代码质量 🔴 MUST

- ✅ ESLint检查必须通过
- ✅ Prettier格式化必须通过
- ✅ 测试覆盖率必须达标（当前50%）

#### 3. 提交规范 🔴 MUST

- ✅ 遵循Conventional Commits
- ✅ 格式：`<type>(<scope>): <subject>`
- ✅ 示例：`feat(resources): add thumbnail generation`

---

## 🔄 开发工作流

### Git工作流

#### 1. 创建Feature分支

```bash
# 格式: feature/{issue-number}-{description}
git checkout -b feature/123-add-bookmark-feature
```

#### 2. 开发代码

```typescript
// 遵循代码规范
// 编写测试
// 更新文档
```

#### 3. 提交代码

```bash
# 每次commit会自动触发：
# - Prettier格式化
# - ESLint检查
# - TypeScript类型检查

git add .
git commit -m "feat(bookmarks): add bookmark functionality"

# ⚠️ 如果提交被拒绝，说明没有通过检查
# 修复问题后重新提交
```

#### 4. 推送代码

```bash
# Push前会自动运行所有测试
git push origin feature/123-add-bookmark-feature

# ⚠️ 如果push被拒绝，说明测试失败
# 修复失败的测试后重新push
```

#### 5. 创建Pull Request

```bash
# 使用gh CLI快速创建PR
gh pr create --title "feat(bookmarks): add bookmark functionality" \
  --body "$(cat <<'EOF'
## Summary
- Added bookmark functionality for resources
- Updated API endpoints
- Added tests with 60% coverage

## Test Plan
- [x] Unit tests pass
- [x] Integration tests pass
- [x] Manual testing completed

🤖 Generated with Claude Code
EOF
)"
```

### 自动化检查

#### Pre-commit（提交前）

- ✅ Prettier自动格式化
- ✅ ESLint自动检查和修复
- ✅ TypeScript类型检查

#### Commit-msg（提交消息验证）

- ✅ Conventional Commits规范验证

#### Pre-push（推送前）

- ✅ 运行所有测试
- ✅ 检查测试覆盖率

#### CI/CD（GitHub Actions）

- ✅ 代码质量检查
- ✅ 运行完整测试套件
- ✅ 构建检查
- ✅ 覆盖率上传到Codecov

---

## ❓ 常见问题FAQ

### Q1: Git commit被拒绝，提示"does not match the pattern"

**问题**: 提交消息不符合Conventional Commits规范

**解决方案**:

```bash
# ❌ 错误示例
git commit -m "add new feature"
git commit -m "fixed bug"
git commit -m "WIP"

# ✅ 正确示例
git commit -m "feat(resources): add search functionality"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(api): update API documentation"
```

**提交类型**:

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档变更
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变动

### Q2: TypeScript编译错误：Cannot find module '@/...'

**问题**: 路径别名未正确配置

**解决方案**:

```typescript
// ❌ 错误
import { something } from "@/utils/helper";

// ✅ 正确 - 检查tsconfig.json中的paths配置
// Backend: "@/*": ["src/*"]
// Frontend: "@/*": ["./*"]
```

### Q3: ESLint报错：'any' is not allowed

**问题**: 启用严格模式后禁止使用`any`类型

**解决方案**:

```typescript
// ❌ 错误
function process(data: any) {
  return data.value;
}

// ✅ 正确 - 使用具体类型
interface Data {
  value: string;
}
function process(data: Data) {
  return data.value;
}

// ✅ 正确 - 或使用unknown（更安全）
function process(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as Data).value;
  }
  throw new Error("Invalid data");
}
```

### Q4: 测试覆盖率不达标

**问题**: PR被CI拒绝，提示coverage below threshold

**解决方案**:

```bash
# 1. 运行测试查看覆盖率
npm run test:coverage

# 2. 查看HTML报告找到未覆盖的代码
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows

# 3. 为未覆盖的代码添加测试
```

### Q5: Prisma迁移失败

**问题**: `prisma migrate dev`失败

**解决方案**:

```bash
# 1. 检查数据库是否运行
docker ps | grep postgres

# 2. 检查DATABASE_URL是否正确
echo $DATABASE_URL  # macOS/Linux
echo %DATABASE_URL% # Windows

# 3. 重置数据库（⚠️ 会删除所有数据）
cd backend
npx prisma migrate reset

# 4. 重新生成Prisma Client
npx prisma generate
```

### Q6: MongoDB连接失败

**问题**: 无法连接到MongoDB

**解决方案**:

```bash
# 1. 检查MongoDB是否运行
docker ps | grep mongo

# 2. 检查MONGODB_URI
# 正确格式: mongodb://localhost:27017/deepdive

# 3. 测试连接
mongosh mongodb://localhost:27017/deepdive
```

### Q7: Pre-commit hook太慢

**问题**: 每次commit都很慢

**解决方案**:

```bash
# Lint-staged只检查staged文件，不应该很慢
# 如果确实太慢，可以临时跳过（不推荐）
git commit --no-verify -m "..."

# 更好的方法：优化检查
# 编辑 .lintstagedrc.json，移除type-check（最慢的部分）
```

### Q8: 如何跳过Git hooks（紧急情况）

**⚠️ 警告**: 仅在紧急情况使用，会绕过所有质量检查！

```bash
# 跳过pre-commit和commit-msg
git commit --no-verify -m "hotfix: emergency fix"

# 跳过pre-push
git push --no-verify
```

**注意**: CI仍然会运行所有检查，如果不通过无法合并PR。

### Q9: 如何查看项目的架构决策？

**问题**: 不理解为什么用双数据库/monorepo等架构

**解决方案**:

```bash
# 查看所有ADR（架构决策记录）
ls .claude/adrs/

# 阅读相关ADR
cat .claude/adrs/0003-dual-database-strategy.md
```

### Q10: Frontend和Backend如何共享类型？

**问题**: 避免重复定义类型

**解决方案**:

```typescript
// 方案1: Backend导出类型，Frontend导入（推荐）
// backend/src/resources/dto/resource.dto.ts
export class ResourceDto {
  id: string;
  title: string;
  type: ResourceType;
}

// frontend使用
import type { ResourceDto } from "@/types/resource";

// 方案2: 创建共享types包（未来考虑）
// packages/shared-types/
```

---

## 🔧 故障排除

### 常见错误和解决方案

#### 错误1: "Module not found"

```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 错误2: "Port already in use"

```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

#### 错误3: Docker容器无法启动

```bash
# 停止所有容器
docker-compose down

# 清理并重启
docker-compose up -d --force-recreate
```

#### 错误4: Prisma Client版本不匹配

```bash
cd backend
npx prisma generate
npm install @prisma/client@latest
```

### 获取帮助

如果遇到无法解决的问题：

1. **查看标准文档**: `.claude/standards/`
2. **查看ADR**: `.claude/adrs/`
3. **搜索Issue**: GitHub Issues
4. **询问团队**: Slack/Discord
5. **创建Issue**: 详细描述问题和复现步骤

---

## 📖 进阶学习

### 推荐阅读

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Testing Library](https://testing-library.com/docs/)

### 内部资源

- 📚 工程标准：`.claude/standards/`
- 📖 架构决策：`.claude/adrs/`
- 🎥 技术分享：(待补充)
- 💬 团队Wiki：(待补充)

---

## ✅ 开发清单

新成员加入时，请确保完成以下任务：

- [ ] 阅读本开发指南
- [ ] 阅读5个核心标准文档
- [ ] 阅读3个ADR示例
- [ ] 完成开发环境搭建
- [ ] 提交第一个测试PR
- [ ] 完成代码Review培训
- [ ] 了解CI/CD流程

---

**欢迎来到DeepDive Engine！有问题随时在团队频道提问。**
