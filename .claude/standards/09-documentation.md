# 09 - 文档编写规范 | Documentation Standards

> **优先级**: 🟡 SHOULD
> **更新日期**: 2025-11-09
> **适用范围**: 所有文档、注释、README文件

---

## 目录

1. [文档类型](#文档类型)
2. [README规范](#readme规范)
3. [API文档](#api文档)
4. [代码注释](#代码注释)
5. [架构决策记录](#架构决策记录-adr)
6. [文档维护](#文档维护)

---

## 文档类型

DeepDive Engine的文档体系：

```
docs/
├── README.md                    # 项目概览
├── CONTRIBUTING.md              # 贡献指南
├── CHANGELOG.md                 # 变更日志
├── .claude/
│   ├── standards/               # 工程标准
│   │   ├── 00-overview.md
│   │   ├── 03-naming-conventions.md
│   │   ├── 04-code-style.md
│   │   ├── 05-api-design.md
│   │   ├── 06-database-design.md
│   │   ├── 07-testing-standards.md
│   │   └── 09-documentation.md
│   └── adrs/                    # 架构决策记录
│       ├── README.md
│       ├── template.md
│       └── NNNN-decision-title.md
├── architecture/                # 架构文档
│   ├── system-overview.md
│   ├── data-flow.md
│   └── api-design.md
└── guides/                      # 开发指南
    ├── getting-started.md
    ├── development-setup.md
    └── deployment.md
```

---

## README规范

### 1. 项目README结构 🔴 MUST

```markdown
# 项目名称

> 一句话描述项目是什么

![CI](https://github.com/org/repo/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/org/repo/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 目录

- [简介](#简介)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [API文档](#api文档)
- [测试](#测试)
- [部署](#部署)
- [贡献](#贡献)
- [许可证](#许可证)

## 简介

详细描述项目的目的、背景和价值。

## 功能特性

- ✨ 功能1：描述
- 🚀 功能2：描述
- 📊 功能3：描述

## 快速开始

### 前置要求

- Node.js >= 18.0.0
- PostgreSQL >= 15.0
- MongoDB >= 7.0

### 安装

\```bash
# 克隆项目
git clone https://github.com/org/repo.git

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 运行数据库迁移
npm run db:migrate

# 启动开发服务器
npm run dev
\```

### 访问应用

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API文档: http://localhost:4000/api-docs

## 项目结构

\```
deepdive-engine/
├── frontend/           # Next.js前端应用
├── backend/            # NestJS后端API
├── ai-service/         # Python AI服务
├── .claude/            # 项目标准和ADR
└── docs/               # 详细文档
\```

详见 [项目结构文档](docs/project-structure.md)

## 开发指南

详见 [开发指南](docs/guides/development-setup.md)

## API文档

- [REST API文档](http://localhost:4000/api-docs)
- [API设计规范](.claude/standards/05-api-design.md)

## 测试

\```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage

# 运行E2E测试
npm run test:e2e
\```

## 部署

详见 [部署指南](docs/guides/deployment.md)

## 贡献

欢迎贡献！请阅读 [贡献指南](CONTRIBUTING.md)

## 许可证

MIT © [Your Organization]
```

### 2. 模块README 🟡 SHOULD

每个主要模块/包应该有自己的README：

```markdown
# Resources Module

资源管理模块，负责处理各类学习资源的CRUD操作。

## 功能

- 创建、读取、更新、删除资源
- 资源搜索和过滤
- 资源收藏和分享

## 使用示例

\```typescript
import { ResourcesService } from './resources.service';

const service = new ResourcesService(prisma, mongodb);

// 获取资源列表
const resources = await service.findAll({
  page: 1,
  limit: 20,
  type: 'ARTICLE'
});
\```

## API端点

- `GET /api/v1/resources` - 获取资源列表
- `POST /api/v1/resources` - 创建资源
- `GET /api/v1/resources/:id` - 获取单个资源
- `PUT /api/v1/resources/:id` - 更新资源
- `DELETE /api/v1/resources/:id` - 删除资源

## 测试

\```bash
npm test -- resources
\```

## 相关文档

- [API设计规范](../.claude/standards/05-api-design.md)
- [数据库设计](../.claude/standards/06-database-design.md)
```

---

## API文档

### 1. OpenAPI/Swagger 🔴 MUST

```typescript
// backend/src/resources/resources.controller.ts
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('resources')
@Controller('api/v1/resources')
export class ResourcesController {
  @Get()
  @ApiOperation({
    summary: '获取资源列表',
    description: '支持分页、过滤和排序的资源列表查询'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码（从1开始）',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页数量（默认20，最大100）',
    example: 20
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ResourceType,
    description: '资源类型过滤'
  })
  @ApiResponse({
    status: 200,
    description: '成功返回资源列表',
    schema: {
      example: {
        data: [
          {
            id: '123',
            title: 'Resource Title',
            type: 'ARTICLE',
            sourceUrl: 'https://example.com'
          }
        ],
        pagination: {
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5
        }
      }
    }
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: ResourceType,
  ) {
    return this.service.findAll({ page, limit, type });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个资源' })
  @ApiParam({
    name: 'id',
    description: '资源ID',
    example: 'clxy123456'
  })
  @ApiResponse({
    status: 200,
    description: '成功返回资源详情'
  })
  @ApiResponse({
    status: 404,
    description: '资源不存在'
  })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
```

### 2. DTO文档 🔴 MUST

```typescript
// backend/src/resources/dto/create-resource.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, Length, IsUrl } from 'class-validator';
import { ResourceType } from '@prisma/client';

/**
 * 创建资源DTO
 */
export class CreateResourceDto {
  @ApiProperty({
    description: '资源标题',
    example: 'Introduction to Machine Learning',
    minLength: 1,
    maxLength: 500
  })
  @IsString()
  @Length(1, 500)
  title: string;

  @ApiProperty({
    description: '资源类型',
    enum: ResourceType,
    example: 'ARTICLE'
  })
  @IsEnum(ResourceType)
  type: ResourceType;

  @ApiProperty({
    description: '资源描述',
    example: 'A comprehensive guide to machine learning basics',
    required: false,
    maxLength: 2000
  })
  @IsString()
  @IsOptional()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({
    description: '资源来源URL',
    example: 'https://example.com/article',
    format: 'uri'
  })
  @IsUrl()
  sourceUrl: string;
}
```

---

## 代码注释

### 1. 函数注释 🔴 MUST

**TypeScript (JSDoc)**:

```typescript
/**
 * 计算两个文本的相似度
 *
 * @param text1 - 第一个文本
 * @param text2 - 第二个文本
 * @param method - 相似度计算方法，支持 'cosine' 和 'jaccard'
 * @returns 相似度分数，范围 [0, 1]
 * @throws {Error} 当method不支持时抛出错误
 *
 * @example
 * ```typescript
 * const similarity = calculateSimilarity('hello', 'hello world', 'cosine');
 * console.log(similarity); // 0.816
 * ```
 */
export function calculateSimilarity(
  text1: string,
  text2: string,
  method: 'cosine' | 'jaccard' = 'cosine'
): number {
  // implementation
}
```

**Python (docstring)**:

```python
def calculate_similarity(text1: str, text2: str, method: str = "cosine") -> float:
    """
    计算两个文本的相似度

    Args:
        text1: 第一个文本
        text2: 第二个文本
        method: 相似度计算方法，支持 'cosine', 'jaccard'

    Returns:
        相似度分数，范围 [0, 1]

    Raises:
        ValueError: 当method不支持时

    Examples:
        >>> calculate_similarity("hello", "hello world")
        0.816
    """
    pass
```

### 2. 类注释 🔴 MUST

```typescript
/**
 * 资源服务类
 *
 * 负责处理资源相关的业务逻辑，包括CRUD操作、搜索、过滤等。
 *
 * @remarks
 * 该服务使用PostgreSQL存储结构化数据，MongoDB存储原始数据。
 * 所有操作都会记录审计日志。
 *
 * @example
 * ```typescript
 * const service = new ResourcesService(prisma, mongodb);
 * const resources = await service.findAll({ page: 1, limit: 20 });
 * ```
 */
@Injectable()
export class ResourcesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mongodb: MongodbService,
  ) {}

  // methods...
}
```

### 3. 复杂逻辑注释 🔴 MUST

```typescript
async function syncResourceData(resourceId: string) {
  // HACK: API v1不返回完整数据，需要额外请求
  // TODO(2024-12): 迁移到API v2后移除此workaround
  const basicData = await fetchBasicData(resourceId);
  const detailData = await fetchDetailData(resourceId);

  // NOTE: 这里使用merge而不是Object.assign，因为需要深度合并
  const merged = merge(basicData, detailData);

  // IMPORTANT: 必须先验证数据再存储，否则可能导致数据库不一致
  const validated = await validateResourceData(merged);

  return validated;
}
```

**注释标签**:
- `TODO`: 待办事项（必须包含日期和负责人）
- `FIXME`: 已知问题，需要修复
- `HACK`: 临时解决方案，需要改进
- `NOTE`: 重要说明
- `IMPORTANT`: 特别重要的说明
- `WARNING`: 警告信息

### 4. 不要写无用注释 ❌

```typescript
// ❌ 错误 - 陈述显而易见的事实
// 获取用户名
const username = user.name;

// 循环遍历数组
for (const item of items) {
  // ...
}

// 创建新的资源对象
const resource = new Resource();

// ✅ 正确 - 解释"为什么"
// 使用缓存避免重复计算，该函数在大数据集上很慢（O(n²)）
const result = cachedCalculation(data);

// 必须先清理HTML标签，因为用户输入可能包含XSS攻击
const cleanText = sanitizeHtml(userInput);
```

---

## 架构决策记录 (ADR)

### 1. ADR模板 🔴 MUST

```markdown
# ADR-NNNN: 决策标题

## 状态

提议中 | 已接受 | 已弃用 | 已被ADR-XXXX取代

## 上下文

描述导致做出此决策的背景和问题。

- 当前面临什么问题？
- 有哪些约束条件？
- 需要实现什么目标？

## 决策

我们决定采用 [选项X] 方案。

详细描述选择的方案和实施方式。

## 考虑的方案

### 方案A: [名称]

**优点**:
- 优点1
- 优点2

**缺点**:
- 缺点1
- 缺点2

### 方案B: [名称]

**优点**:
- 优点1

**缺点**:
- 缺点1

## 结果

描述实施此决策的预期结果：

**正面影响**:
- 影响1
- 影响2

**负面影响**:
- 影响1
- 权衡点

**风险**:
- 风险1及缓解措施

## 参考资料

- [相关文档链接]
- [技术文章链接]
```

### 2. ADR示例

```markdown
# ADR-0002: 采用TypeScript严格模式

## 状态

已接受 - 2025-11-09

## 上下文

当前Backend的TypeScript配置禁用了所有严格检查选项：
- `strictNullChecks: false`
- `noImplicitAny: false`
- `strictBindCallApply: false`

这导致：
1. 运行时类型错误频发
2. 代码质量难以保证
3. 重构风险高
4. 不符合行业最佳实践

## 决策

启用TypeScript完整严格模式：
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

并修复所有因此产生的类型错误。

## 考虑的方案

### 方案A: 立即全面启用严格模式

**优点**:
- 彻底解决类型安全问题
- 一次性完成，无技术债务

**缺点**:
- 需要修复大量现有代码
- 可能需要1-2周时间

### 方案B: 渐进式启用（仅对新代码）

**优点**:
- 不影响现有代码
- 改动较小

**缺点**:
- 技术债务持续存在
- 新旧代码标准不一致
- 最终还是要全量修复

### 方案C: 保持现状

**优点**:
- 无需改动

**缺点**:
- 持续产生运行时错误
- 不符合工程标准

## 决策选择

选择**方案A**，理由：
1. 长痛不如短痛
2. 项目处于MVP阶段，代码量适中
3. 符合工程最佳实践
4. Frontend已经使用strict mode，后端应保持一致

## 结果

**正面影响**:
- ✅ 减少90%+的类型相关运行时错误
- ✅ 提高代码可维护性
- ✅ 更好的IDE支持和自动补全
- ✅ 更安全的重构

**负面影响**:
- ⚠️ 需要投入1-2周时间修复现有代码
- ⚠️ 短期内可能降低开发速度

**风险与缓解**:
- 风险: 修复过程中可能引入bug
  - 缓解: 充分的测试覆盖
- 风险: 某些第三方库类型定义不完善
  - 缓解: 使用类型断言或自定义类型定义

## 实施计划

1. [Week 1] 启用strict mode并修复编译错误
2. [Week 1-2] 运行完整测试套件，修复发现的问题
3. [Week 2] 代码审查确保质量
4. [Week 2] 更新文档和团队培训

## 参考资料

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
```

### 3. ADR命名 🔴 MUST

```
格式: NNNN-descriptive-title.md

示例:
0001-monorepo-architecture.md
0002-typescript-strict-mode.md
0003-use-prisma-for-orm.md
0004-mongodb-for-raw-data.md
```

---

## 文档维护

### 1. 文档更新原则 🔴 MUST

- 🔴 MUST: 代码变更必须同步更新文档
- 🔴 MUST: API变更必须更新Swagger文档
- 🔴 MUST: 重要决策必须记录ADR
- 🟡 SHOULD: 每个PR应该检查文档是否需要更新
- 🟡 SHOULD: 定期审查文档准确性（每季度）

### 2. 文档审查清单

PR提交前检查：
- [ ] README是否需要更新？
- [ ] API文档是否需要更新？
- [ ] 是否需要添加代码注释？
- [ ] 是否需要创建ADR？
- [ ] 是否需要更新CHANGELOG？

### 3. CHANGELOG规范 🔴 MUST

遵循 [Keep a Changelog](https://keepachangelog.com/) 格式：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 新增资源缩略图功能 (#123)

### Changed
- 优化搜索性能，响应时间减少50% (#124)

### Fixed
- 修复资源列表分页bug (#125)

## [1.2.0] - 2024-01-15

### Added
- GitHub仓库数据采集功能
- 资源推荐算法

### Changed
- 升级Next.js到14.0版本

### Deprecated
- `/api/v1/old-endpoint` 将在v2.0中移除

### Fixed
- 修复用户登录session过期问题
```

---

## 工具推荐

### 文档生成工具

- **TypeDoc**: TypeScript API文档生成
- **Docusaurus**: 文档网站生成
- **Swagger UI**: REST API文档
- **Compodoc**: Angular/NestJS文档生成

### Markdown工具

- **Markdown Lint**: Markdown格式检查
- **Prettier**: Markdown格式化
- **markdown-toc**: 自动生成目录

---

## 参考资料

- [Write The Docs](https://www.writethedocs.org/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Microsoft Writing Style Guide](https://docs.microsoft.com/en-us/style-guide/welcome/)
- [Keep a Changelog](https://keepachangelog.com/)
