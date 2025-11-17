# Phase 1 MVP - Staging 部署指南

本指南详细说明如何在 staging 环境中部署 Phase 1 MVP，包括灰度测试和监控配置。

## 快速开始 (5分钟)

### 前置条件

- Docker & Docker Compose >= 20.10
- Node.js >= 18.x
- Git

### 部署步骤

#### 1. 拉取最新代码和标签

```bash
cd /path/to/deepdive-engine

# 拉取最新代码
git fetch origin

# 检出 Phase 1 标签
git checkout v1.0.0-phase1

# 确认分支
git status
```

#### 2. 配置 Staging 环境变量

创建 `.env.staging` 文件：

```bash
# 后端
NODE_ENV=staging
PORT=4000
LOG_LEVEL=debug
DATABASE_URL="postgresql://deepdive:staging_postgres_pwd@postgres:5432/deepdive_staging"
MONGO_URI="mongodb://deepdive:staging_mongo_pwd@mongo:27017/deepdive_staging?authSource=admin"
REDIS_HOST=redis
REDIS_PORT=6379
CORS_ORIGIN="http://localhost:3000"

# Prometheus & Grafana
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# 数据库密码
POSTGRES_PASSWORD=staging_postgres_pwd
MONGO_PASSWORD=staging_mongo_pwd
GRAFANA_PASSWORD=staging_grafana_pwd
```

#### 3. 启动 Staging 环境

```bash
# 使用 staging 配置启动
docker-compose -f docker-compose.staging.yml up -d

# 查看日志
docker-compose -f docker-compose.staging.yml logs -f

# 等待所有服务启动 (30-60秒)
docker-compose -f docker-compose.staging.yml ps
```

#### 4. 验证服务状态

```bash
# 后端健康检查
curl http://localhost:4000/health

# 前端可用性
curl http://localhost:3000

# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
open http://localhost:3001  # 用户名: admin, 密码: staging_grafana_pwd
```

## 监控设置

### Prometheus (http://localhost:9090)

**关键指标:**

```promql
# 后端 API 请求速率
rate(http_requests_total{job="deepdive-backend"}[5m])

# 错误率
rate(http_requests_total{job="deepdive-backend",status=~"5.."}[5m])

# 响应时间 (P95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="deepdive-backend"}[5m]))

# 数据库连接
pg_stat_activity_count{job="postgres"}

# Redis 内存使用
redis_memory_used_bytes / redis_memory_max_bytes
```

### Grafana (http://localhost:3001)

**登录凭证:**
- Username: `admin`
- Password: `staging_grafana_pwd`

**导入仪表板:**

1. 进入 Grafana 首页
2. 点击 "+" → "Import"
3. 上传 `monitoring/dashboards/*.json` 中的仪表板

**推荐查看的仪表板:**
- Backend Performance - API 性能监控
- Database Health - 数据库健康状态
- Service Dependencies - 服务依赖关系

## 烟雾测试 (Smoke Tests)

### 运行完整烟雾测试

```bash
# 安装依赖
npm install

# 运行烟雾测试
npm run test:smoke

# 指定 API URL
API_URL=http://localhost:4000 npm run test:smoke
```

### 测试覆盖范围

✅ 后端健康检查
✅ 前端可用性
✅ API 端点测试
✅ 内容提取服务 (4层降级)
✅ 全局去重机制
✅ 新闻元数据提取
✅ 数据库引用同步
✅ 爬虫服务状态
✅ 数据库连接状态

**成功标准:** 所有测试通过率 > 95%

### 查看测试报告

```bash
# 最新报告
cat reports/smoke-test-latest.json

# 所有报告
ls -la reports/smoke-test-*.json
```

## 灰度测试 (Canary Deployment)

### 金丝雀部署策略

**第一阶段: 内部测试 (24小时)**

```bash
# 部署到 staging 环境
docker-compose -f docker-compose.staging.yml up -d

# 运行烟雾测试验证
npm run test:smoke

# 运行集成测试
npm run test:integration

# 监控关键指标
# - 错误率 < 0.5%
# - 响应时间 P95 < 1s
# - 数据库连接池使用率 < 70%
```

**第二阶段: Beta 用户测试 (3-7天)**

```bash
# 启用特性开关 (待实现)
ENABLE_PHASE1_FEATURES=true

# 流量分配: 10% → 25% → 50% → 100%
# 通过负载均衡器配置
```

**第三阶段: 全量发布 (生产环境)**

```bash
# 推送到生产环境
docker-compose -f docker-compose.prod.yml up -d

# 验证生产环境
npm run test:smoke -- --env=production
```

### 监控灰度指标

```bash
# 部署前基准线
curl http://localhost:4000/metrics | grep http_requests_total

# 部署后监控
# - 观察 5-10 分钟
# - 检查错误率、延迟、成功率
# - 验证数据一致性

# 如需回滚
docker-compose -f docker-compose.staging.yml down
git checkout v1.0.0-phase0
docker-compose -f docker-compose.staging.yml up -d
```

## 数据库迁移

### 初始化 Staging 数据库

```bash
# 进入后端容器
docker-compose -f docker-compose.staging.yml exec backend bash

# 运行迁移
npx prisma migrate deploy --skip-generate

# 生成 Prisma Client
npx prisma generate

# 验证迁移
npx prisma migrate status
```

### 导入测试数据

```bash
# 运行数据播种脚本
npm run db:seed

# 验证导入
npm run db:validate
```

## 故障排查

### 后端无法启动

```bash
# 查看后端日志
docker-compose -f docker-compose.staging.yml logs backend

# 常见问题:
# 1. 数据库连接失败 → 检查 DATABASE_URL
# 2. 端口被占用 → 修改 PORT 或关闭占用进程
# 3. 模块缺失 → npm install
```

### 前端加载失败

```bash
# 查看前端日志
docker-compose -f docker-compose.staging.yml logs frontend

# 清除缓存重新构建
docker-compose -f docker-compose.staging.yml rebuild frontend
docker-compose -f docker-compose.staging.yml up frontend
```

### 数据库连接异常

```bash
# 检查数据库服务
docker-compose -f docker-compose.staging.yml ps postgres
docker-compose -f docker-compose.staging.yml ps mongo

# 查看数据库日志
docker-compose -f docker-compose.staging.yml logs postgres
docker-compose -f docker-compose.staging.yml logs mongo

# 重启数据库服务
docker-compose -f docker-compose.staging.yml restart postgres mongo
```

### 监控无数据

```bash
# 检查 Prometheus 数据源
curl http://localhost:9090/api/v1/query?query=up

# 重启 Prometheus
docker-compose -f docker-compose.staging.yml restart prometheus

# 检查告警规则
curl http://localhost:9090/api/v1/rules
```

## 性能基准 (Baseline)

部署后应该达到的性能指标：

| 指标 | 目标 | 临界值 |
|------|------|--------|
| 内容提取成功率 | > 95% | < 90% ⚠️ |
| API 响应时间 (P95) | < 1s | > 2s ⚠️ |
| 错误率 | < 0.5% | > 1% ⚠️ |
| 数据库连接数 | < 50 | > 80 ⚠️ |
| Redis 内存使用 | < 70% | > 85% ⚠️ |
| 去重精确度 | > 99% | < 95% ⚠️ |

## 清理和停止

```bash
# 停止所有服务
docker-compose -f docker-compose.staging.yml down

# 删除所有卷 (包括数据)
docker-compose -f docker-compose.staging.yml down -v

# 清理未使用的镜像
docker image prune -a
```

## 下一步

✅ Phase 1 MVP 部署完成
✅ 烟雾测试通过
✅ 监控配置就绪

📋 **待办:**
- [ ] Phase 2: 前端优化和用户界面改进
- [ ] Phase 3: 实时数据流和 WebSocket 支持
- [ ] 生产环境部署
- [ ] 自动化 CI/CD Pipeline

## 支持和反馈

- 文档: `docs/guides/deployment.md`
- 问题跟踪: GitHub Issues
- 技术讨论: 团队 Slack
