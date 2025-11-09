# 07 - 测试标准 | Testing Standards

> **优先级**: 🔴 MUST
> **更新日期**: 2025-11-09
> **适用范围**: Backend, Frontend测试

---

## 目录

1. [测试策略](#测试策略)
2. [单元测试](#单元测试)
3. [集成测试](#集成测试)
4. [E2E测试](#e2e测试)
5. [测试覆盖率](#测试覆盖率)
6. [测试工具配置](#测试工具配置)

---

## 测试策略

### Testing Trophy 原则

DeepDive Engine采用**Testing Trophy**策略（优化版的测试金字塔）：

```
        ╱╲  E2E Tests (10%)
       ╱  ╲  - 关键用户流程
      ╱────╲
     ╱      ╲ Integration Tests (60%)
    ╱────────╲ - API endpoints
   ╱          ╲ - 组件集成
  ╱────────────╲
 ╱              ╲ Unit Tests (30%)
╱────────────────╲ - 工具函数
                   - 复杂业务逻辑
```

**测试分配原则**:
- **30% 单元测试**: 纯函数、工具函数、复杂算法
- **60% 集成测试**: API endpoints、React组件、数据库交互
- **10% E2E测试**: 关键用户流程（登录、创建资源、搜索）

### 测试覆盖率目标

**阶段性目标** 🔴 MUST:

| 阶段 | 时间线 | 目标覆盖率 | 重点 |
|------|--------|-----------|------|
| Phase 1 | Week 1-2 | 50% | 核心services, utils |
| Phase 2 | Week 3-6 | 70% | 所有services, 主要组件 |
| Phase 3 | Week 7+ | 85%+ | 完整覆盖 + E2E |

**强制要求**:
- 🔴 MUST: 新代码必须达到目标覆盖率
- 🔴 MUST: PR必须包含相关测试
- 🔴 MUST: CI失败如果覆盖率下降

---

## 单元测试

### 1. 测试结构 🔴 MUST

使用**AAA模式**（Arrange-Act-Assert）：

```typescript
describe('calculateSimilarity', () => {
  it('should return 1.0 for identical texts', () => {
    // Arrange - 准备测试数据
    const text1 = 'hello world';
    const text2 = 'hello world';

    // Act - 执行被测试的代码
    const result = calculateSimilarity(text1, text2);

    // Assert - 验证结果
    expect(result).toBe(1.0);
  });

  it('should return 0.0 for completely different texts', () => {
    const text1 = 'hello';
    const text2 = 'world';

    const result = calculateSimilarity(text1, text2);

    expect(result).toBeLessThan(0.3);
  });

  it('should handle empty strings', () => {
    const result = calculateSimilarity('', '');

    expect(result).toBe(0);
  });

  it('should throw error for invalid method', () => {
    expect(() => {
      calculateSimilarity('a', 'b', 'invalid');
    }).toThrow('Unsupported similarity method');
  });
});
```

### 2. 命名规范 🔴 MUST

```typescript
// ✅ 正确 - 描述性的测试名称
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => { });
    it('should throw ValidationError for invalid email', async () => { });
    it('should throw ConflictError if user already exists', async () => { });
    it('should hash password before saving', async () => { });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => { });
    it('should return null if user not found', async () => { });
    it('should throw error if id is invalid', async () => { });
  });
});

// ❌ 错误 - 模糊的测试名称
describe('UserService', () => {
  it('test1', () => { });
  it('should work', () => { });
  it('test user creation', () => { });
});
```

**命名规则**:
- 使用`describe`描述被测试的单元（类/函数）
- 嵌套`describe`描述具体方法
- `it`描述具体行为，使用`should`开头
- 清晰描述输入和预期输出

### 3. 工具函数测试示例

```typescript
// src/lib/utils.ts
export function formatDate(date: Date, format: string): string {
  // implementation
}

// src/lib/utils.spec.ts
import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format date to ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');

    const result = formatDate(date, 'ISO');

    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should format date to readable string', () => {
    const date = new Date('2024-01-15');

    const result = formatDate(date, 'READABLE');

    expect(result).toBe('January 15, 2024');
  });

  it('should handle invalid date', () => {
    const invalidDate = new Date('invalid');

    expect(() => formatDate(invalidDate, 'ISO')).toThrow('Invalid date');
  });
});
```

### 4. Service层测试示例（Backend）

```typescript
// backend/src/resources/resources.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ResourcesService', () => {
  let service: ResourcesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        {
          provide: PrismaService,
          useValue: {
            resource: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return paginated resources', async () => {
      const mockResources = [
        { id: '1', title: 'Resource 1' },
        { id: '2', title: 'Resource 2' },
      ];

      jest.spyOn(prisma.resource, 'findMany').mockResolvedValue(mockResources);
      jest.spyOn(prisma.resource, 'count').mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockResources);
      expect(result.pagination.total).toBe(2);
      expect(prisma.resource.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by resource type', async () => {
      jest.spyOn(prisma.resource, 'findMany').mockResolvedValue([]);

      await service.findAll({ type: 'ARTICLE' });

      expect(prisma.resource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: 'ARTICLE' },
        })
      );
    });
  });

  describe('create', () => {
    it('should create resource with valid data', async () => {
      const createDto = {
        title: 'New Resource',
        type: 'ARTICLE',
        sourceUrl: 'https://example.com',
      };

      const mockResource = { id: '123', ...createDto };
      jest.spyOn(prisma.resource, 'create').mockResolvedValue(mockResource);

      const result = await service.create(createDto);

      expect(result).toEqual(mockResource);
      expect(prisma.resource.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw ConflictError if resource already exists', async () => {
      const createDto = {
        title: 'Duplicate',
        type: 'ARTICLE',
        sourceUrl: 'https://example.com',
      };

      jest.spyOn(prisma.resource, 'create').mockRejectedValue({
        code: 'P2002',
      });

      await expect(service.create(createDto)).rejects.toThrow('already exists');
    });
  });
});
```

---

## 集成测试

### 1. API端点测试（Backend） 🔴 MUST

```typescript
// backend/src/resources/resources.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('ResourcesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prisma.resource.deleteMany();
  });

  describe('GET /api/v1/resources', () => {
    it('should return empty list initially', () => {
      return request(app.getHttpServer())
        .get('/api/v1/resources')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.pagination.total).toBe(0);
        });
    });

    it('should return resources with pagination', async () => {
      // 准备测试数据
      await prisma.resource.createMany({
        data: [
          { title: 'Resource 1', type: 'ARTICLE', sourceUrl: 'https://1.com' },
          { title: 'Resource 2', type: 'VIDEO', sourceUrl: 'https://2.com' },
        ],
      });

      return request(app.getHttpServer())
        .get('/api/v1/resources?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.pagination.total).toBe(2);
        });
    });

    it('should filter resources by type', async () => {
      await prisma.resource.createMany({
        data: [
          { title: 'Article', type: 'ARTICLE', sourceUrl: 'https://1.com' },
          { title: 'Video', type: 'VIDEO', sourceUrl: 'https://2.com' },
        ],
      });

      return request(app.getHttpServer())
        .get('/api/v1/resources?type=ARTICLE')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.data[0].type).toBe('ARTICLE');
        });
    });
  });

  describe('POST /api/v1/resources', () => {
    it('should create resource with valid data', () => {
      const createDto = {
        title: 'New Resource',
        type: 'ARTICLE',
        sourceUrl: 'https://example.com',
      };

      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toMatchObject(createDto);
          expect(res.body.data.id).toBeDefined();
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .send({ title: '' })  // 缺少必需字段
        .expect(400)
        .expect((res) => {
          expect(res.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    it('should return 409 for duplicate resource', async () => {
      const resourceData = {
        title: 'Duplicate',
        type: 'ARTICLE',
        sourceUrl: 'https://duplicate.com',
      };

      // 第一次创建成功
      await request(app.getHttpServer())
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(201);

      // 第二次创建应该失败
      return request(app.getHttpServer())
        .post('/api/v1/resources')
        .send(resourceData)
        .expect(409);
    });
  });
});
```

### 2. React组件测试（Frontend） 🔴 MUST

```typescript
// frontend/features/resources/components/ResourceCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ResourceCard } from './ResourceCard';

describe('ResourceCard', () => {
  const mockResource = {
    id: '123',
    title: 'Test Resource',
    description: 'Test description',
    type: 'ARTICLE',
    sourceUrl: 'https://example.com',
    createdAt: new Date('2024-01-01'),
  };

  it('should render resource information', () => {
    render(<ResourceCard resource={mockResource} />);

    expect(screen.getByText('Test Resource')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onBookmark when bookmark button clicked', () => {
    const handleBookmark = jest.fn();

    render(
      <ResourceCard
        resource={mockResource}
        onBookmark={handleBookmark}
      />
    );

    const bookmarkButton = screen.getByRole('button', { name: /bookmark/i });
    fireEvent.click(bookmarkButton);

    expect(handleBookmark).toHaveBeenCalledWith('123');
  });

  it('should show bookmarked state', () => {
    render(<ResourceCard resource={{ ...mockResource, isBookmarked: true }} />);

    const bookmarkButton = screen.getByRole('button', { name: /unbookmark/i });
    expect(bookmarkButton).toBeInTheDocument();
  });

  it('should render in compact mode', () => {
    const { container } = render(
      <ResourceCard resource={mockResource} variant="compact" />
    );

    expect(container.firstChild).toHaveClass('card-compact');
  });
});
```

### 3. React Hook测试

```typescript
// frontend/features/resources/hooks/useResources.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResources } from './useResources';
import { resourcesApi } from '../api/resources-api';

jest.mock('../api/resources-api');

describe('useResources', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient.clear();
  });

  it('should fetch resources successfully', async () => {
    const mockResources = [
      { id: '1', title: 'Resource 1' },
      { id: '2', title: 'Resource 2' },
    ];

    (resourcesApi.getAll as jest.Mock).mockResolvedValue({
      data: mockResources,
      pagination: { total: 2 },
    });

    const { result } = renderHook(() => useResources({}), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toEqual(mockResources);
    expect(resourcesApi.getAll).toHaveBeenCalledWith({});
  });

  it('should handle error', async () => {
    (resourcesApi.getAll as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useResources({}), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

---

## E2E测试

### 1. Playwright配置 🟡 SHOULD

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
```

### 2. E2E测试示例

```typescript
// e2e/resources.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Resources Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display resource list', async ({ page }) => {
    // 等待资源列表加载
    await page.waitForSelector('[data-testid="resource-card"]');

    // 验证至少有一个资源显示
    const resources = await page.locator('[data-testid="resource-card"]').count();
    expect(resources).toBeGreaterThan(0);
  });

  test('should filter resources by type', async ({ page }) => {
    // 选择过滤器
    await page.click('[data-testid="filter-type"]');
    await page.click('text=Article');

    // 等待过滤结果
    await page.waitForSelector('[data-testid="resource-card"]');

    // 验证所有显示的资源都是文章类型
    const types = await page.locator('[data-testid="resource-type"]').allTextContents();
    expect(types.every(type => type === 'ARTICLE')).toBe(true);
  });

  test('should search resources', async ({ page }) => {
    // 输入搜索关键词
    await page.fill('[data-testid="search-input"]', 'machine learning');
    await page.press('[data-testid="search-input"]', 'Enter');

    // 等待搜索结果
    await page.waitForSelector('[data-testid="resource-card"]');

    // 验证结果包含关键词
    const firstResult = await page.locator('[data-testid="resource-card"]').first();
    const text = await firstResult.textContent();
    expect(text?.toLowerCase()).toContain('machine learning');
  });

  test('should bookmark resource', async ({ page }) => {
    // 点击书签按钮
    await page.click('[data-testid="bookmark-button"]');

    // 验证书签状态改变
    await expect(page.locator('[data-testid="bookmark-button"]')).toHaveAttribute(
      'data-bookmarked',
      'true'
    );

    // 导航到书签页面验证
    await page.click('[data-testid="nav-bookmarks"]');
    await page.waitForSelector('[data-testid="resource-card"]');

    const bookmarkedResources = await page.locator('[data-testid="resource-card"]').count();
    expect(bookmarkedResources).toBeGreaterThan(0);
  });
});
```

---

## 测试覆盖率

### 1. Jest配置 🔴 MUST

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,      // Phase 1: 50%
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### 2. 覆盖率目标递进

```javascript
// Phase 1 (Week 1-2): 50%
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}

// Phase 2 (Week 3-6): 70%
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}

// Phase 3 (Week 7+): 85%
coverageThreshold: {
  global: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### 3. 查看覆盖率报告

```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 打开HTML报告
open coverage/lcov-report/index.html
```

---

## 测试工具配置

### Backend (NestJS + Jest)

```json
// backend/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0"
  }
}
```

### Frontend (React + Vitest)

```json
// frontend/package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^23.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## 测试最佳实践清单

### ✅ DO

- ✅ 为每个public方法编写测试
- ✅ 测试边界情况和错误处理
- ✅ 使用描述性的测试名称
- ✅ 保持测试独立（不依赖其他测试）
- ✅ 使用测试数据构建器模式
- ✅ Mock外部依赖（API、数据库）
- ✅ 在CI中运行测试
- ✅ 定期审查和更新测试

### ❌ DON'T

- ❌ 测试实现细节
- ❌ 写脆弱的测试（容易因小改动而失败）
- ❌ 忽略失败的测试
- ❌ 复制粘贴测试代码
- ❌ 过度Mock（导致测试不真实）
- ❌ 忽略测试性能（慢测试）
- ❌ 为getter/setter写测试（浪费时间）

---

## 参考资料

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Documentation](https://playwright.dev/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
