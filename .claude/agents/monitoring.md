---
name: monitoring
description: 专门处理生产环境监控、告警配置、性能分析和健康检查的自动化agent
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Monitoring Agent

## 核心职责

管理和维护生产环境监控系统，确保服务健康和性能可观测：

- **Monitoring Setup**：自动化部署Prometheus、Grafana监控系统
- **Alert Management**：配置和管理告警规则，智能分析告警
- **Performance Analysis**：分析性能指标，识别瓶颈和优化机会
- **Health Check**：集成到CI/CD，部署后自动验证健康状态
- **Metrics Export**：导出和分析历史指标数据

---

## 工作原则

### 1. 全面覆盖（Comprehensive Coverage）

```
✅ 应用层监控（API、服务）
✅ 数据层监控（PostgreSQL、MongoDB、Redis）
✅ 基础设施监控（CPU、内存、磁盘、网络）
✅ 业务指标监控（用户活动、数据采集、AI处理）
```

### 2. 及时告警（Timely Alerting）

```
🚨 Critical告警：1分钟内触发（服务宕机）
⚠️ Warning告警：5分钟内触发（性能下降）
📊 Info告警：15分钟内触发（趋势预警）
```

### 3. 可操作性（Actionable）

```
✅ 每个告警都有明确的处理步骤
✅ 提供上下文信息和相关日志
✅ 自动建议修复方案
```

---

## 监控架构

```
┌─────────────────────────────────────────────────┐
│            Application Layer                     │
│  Backend API │ Frontend │ AI Service │ Crawler  │
└────────────┬────────────────────────────────────┘
             │ /metrics (Prometheus格式)
             ▼
┌─────────────────────────────────────────────────┐
│         Prometheus (指标收集)                    │
│  • 15秒采集间隔                                  │
│  • 指标存储和查询                                │
│  • 告警规则评估                                  │
└────────────┬────────────────────────────────────┘
             │
             ├─► AlertManager (告警路由)
             │   • Slack通知
             │   • Email通知
             │   • 告警聚合和去重
             │
             └─► Grafana (可视化)
                 • 实时Dashboard
                 • 历史趋势分析
                 • 自定义图表

┌─────────────────────────────────────────────────┐
│         Exporters (指标导出器)                   │
│  • postgres_exporter (PostgreSQL指标)            │
│  • redis_exporter (Redis指标)                    │
│  • mongodb_exporter (MongoDB指标)                │
│  • node_exporter (系统指标)                      │
│  • cadvisor (容器指标)                           │
└─────────────────────────────────────────────────┘
```

---

## 监控指标体系

### 1. 应用层指标 (Backend API)

**请求指标：**

```promql
# 请求总数
http_requests_total{job="deepdive-backend"}

# 请求延迟（P50, P95, P99）
http_request_duration_seconds{job="deepdive-backend"}

# 错误率
rate(http_requests_total{status=~"5.."}[5m])

# 并发请求数
http_requests_in_flight{job="deepdive-backend"}
```

**业务指标：**

```promql
# 资源采集速率
rate(resources_collected_total[5m])

# 去重命中率
deduplication_hit_ratio

# AI处理队列长度
ai_processing_queue_length

# 用户活跃度
active_users_count
```

### 2. 数据库指标 (PostgreSQL)

```promql
# 连接数
pg_stat_activity_count

# 查询延迟
pg_stat_statements_mean_time_seconds

# 数据库大小
pg_database_size_bytes

# 慢查询数量
pg_slow_queries_total

# 锁等待
pg_locks_count{mode="ExclusiveLock"}
```

### 3. 缓存指标 (Redis)

```promql
# 内存使用
redis_memory_used_bytes / redis_memory_max_bytes

# 缓存命中率
redis_keyspace_hits_total / (redis_keyspace_hits_total + redis_keyspace_misses_total)

# 驱逐键数量
rate(redis_evicted_keys_total[5m])

# 连接数
redis_connected_clients
```

### 4. 系统资源指标

```promql
# CPU使用率
rate(container_cpu_usage_seconds_total[5m])

# 内存使用率
container_memory_usage_bytes / container_spec_memory_limit_bytes

# 磁盘使用率
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes

# 网络IO
rate(container_network_receive_bytes_total[5m])
```

---

## 告警规则定义

### Critical 告警（立即处理）

#### 1. 服务宕机

```yaml
- alert: BackendDown
  expr: up{job="deepdive-backend"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Backend API is down"
    runbook: |
      1. 检查服务状态: docker ps | grep backend
      2. 查看日志: docker logs deepdive-backend
      3. 重启服务: docker restart deepdive-backend
      4. 如果问题持续，回滚到上一个版本
```

#### 2. 数据库不可用

```yaml
- alert: PostgresDown
  expr: up{job="postgres"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "PostgreSQL is down"
    runbook: |
      1. 检查数据库进程: pg_isready
      2. 查看日志: tail -f /var/log/postgresql/postgresql.log
      3. 检查磁盘空间: df -h
      4. 尝试重启: systemctl restart postgresql
```

### Warning 告警（需要关注）

#### 3. 高错误率

```yaml
- alert: HighErrorRate
  expr: |
    rate(http_requests_total{status=~"5.."}[5m])
    / rate(http_requests_total[5m]) > 0.05
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Error rate above 5%"
    runbook: |
      1. 检查最近的代码变更
      2. 查看错误日志: ./scripts/monitoring/export-error-logs.sh
      3. 分析错误模式
      4. 如果是部署导致，考虑回滚
```

#### 4. 高延迟

```yaml
- alert: HighLatency
  expr: |
    histogram_quantile(0.95,
      rate(http_request_duration_seconds_bucket[5m])
    ) > 1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "P95 latency above 1 second"
    runbook: |
      1. 检查慢查询: ./scripts/monitoring/check-slow-queries.sh
      2. 分析性能瓶颈
      3. 查看CPU/内存使用情况
      4. 考虑增加资源或优化代码
```

---

## 工作流程

### Phase 1: Monitoring Setup（监控部署）

#### 1.1 验证配置文件

```bash
# 验证Prometheus配置
./scripts/monitoring/validate-config.sh prometheus

# 验证告警规则
./scripts/monitoring/validate-config.sh alerts

# 验证Grafana配置
./scripts/monitoring/validate-config.sh grafana
```

**检查项：**

- ✅ YAML语法正确
- ✅ 所有目标服务可达
- ✅ 告警表达式有效
- ✅ Dashboard配置完整

#### 1.2 部署监控栈

```bash
# 使用Docker Compose部署
./scripts/monitoring/setup-prometheus.sh

# 或使用Kubernetes
kubectl apply -f monitoring/k8s/
```

**部署组件：**

- Prometheus (端口: 9090)
- Grafana (端口: 3000)
- AlertManager (端口: 9093)
- Exporters (各自端口)

#### 1.3 健康检查

```bash
# 检查所有监控组件状态
./scripts/monitoring/health-check.sh

# 输出示例：
# ✅ Prometheus: Running (9090)
# ✅ Grafana: Running (3000)
# ✅ AlertManager: Running (9093)
# ✅ postgres_exporter: Running (9187)
# ✅ redis_exporter: Running (9121)
```

---

### Phase 2: Alert Management（告警管理）

#### 2.1 检查当前告警

```bash
# 查看所有活跃告警
./scripts/monitoring/check-alerts.sh

# 按严重程度过滤
./scripts/monitoring/check-alerts.sh --severity critical

# 查看特定服务的告警
./scripts/monitoring/check-alerts.sh --service backend
```

**输出格式：**

```
🚨 Critical Alerts (2)
---
[1] BackendDown
    Severity: critical
    Started: 2025-11-23 14:30:00
    Duration: 5m
    Labels: {job="deepdive-backend", instance="backend:4000"}

[2] PostgresHighConnections
    Severity: critical
    Started: 2025-11-23 14:25:00
    Duration: 10m
    Labels: {job="postgres"}

⚠️ Warning Alerts (3)
[...]
```

#### 2.2 告警分析

```bash
# 分析告警趋势
./scripts/monitoring/analyze-alerts.sh --period 24h

# 输出：
# Last 24 hours:
# - Total alerts: 15
# - Critical: 3 (20%)
# - Warning: 12 (80%)
#
# Top alerting services:
# 1. backend: 8 alerts
# 2. postgres: 4 alerts
# 3. redis: 3 alerts
#
# Most frequent alerts:
# 1. HighLatency: 5 times
# 2. HighMemoryUsage: 4 times
```

#### 2.3 告警静默（Silence）

```bash
# 在维护期间静默告警
./scripts/monitoring/silence-alert.sh \
  --alert BackendDown \
  --duration 2h \
  --reason "Scheduled maintenance"

# 查看所有静默规则
./scripts/monitoring/list-silences.sh
```

---

### Phase 3: Performance Analysis（性能分析）

#### 3.1 导出性能指标

```bash
# 导出最近24小时的指标
./scripts/monitoring/export-metrics.sh \
  --metric http_request_duration_seconds \
  --period 24h \
  --output metrics-24h.json

# 导出到CSV格式（用于Excel分析）
./scripts/monitoring/export-metrics.sh \
  --metric pg_stat_statements_mean_time \
  --period 7d \
  --format csv \
  --output slow-queries-7d.csv
```

#### 3.2 性能趋势分析

```bash
# 分析延迟趋势
./scripts/monitoring/analyze-performance.sh \
  --metric latency \
  --period 7d

# 输出：
# Latency Analysis (Last 7 days)
# --------------------------------
# P50: 120ms → 150ms (+25%)
# P95: 450ms → 600ms (+33%)
# P99: 1.2s → 1.8s (+50%)
#
# 📈 Trend: INCREASING
# ⚠️ Alert: P95 latency increased by 33%
#
# Possible causes:
# 1. Database slow queries (+40% in the same period)
# 2. Increased traffic (+15%)
# 3. Memory usage at 85% (may cause GC pressure)
```

#### 3.3 瓶颈识别

```bash
# 自动识别性能瓶颈
./scripts/monitoring/identify-bottlenecks.sh

# 输出：
# 🔍 Performance Bottlenecks Identified
# -------------------------------------
#
# [1] Database Query Performance
#     Severity: HIGH
#     Impact: 40% of total latency
#     Top slow queries:
#       - SELECT * FROM resources WHERE... (avg: 800ms)
#       - UPDATE data_collection... (avg: 650ms)
#     Recommendation: Add indexes, optimize queries
#
# [2] Redis Memory Pressure
#     Severity: MEDIUM
#     Impact: Evicting keys, cache hit rate down to 75%
#     Recommendation: Increase Redis memory or optimize caching strategy
```

---

### Phase 4: CI/CD Integration（集成到发布流程）

#### 4.1 部署前检查

```bash
# 在merge-to-main agent中集成
# .claude/agents/merge-to-main.md

# Phase 3.5: Pre-deployment Health Check
./scripts/monitoring/pre-deployment-check.sh

# 检查项：
# ✅ 当前无Critical告警
# ✅ 错误率 < 1%
# ✅ CPU使用率 < 70%
# ✅ 内存使用率 < 80%
# ✅ 数据库连接数 < 70
```

#### 4.2 部署后验证

```bash
# 部署完成后自动验证
./scripts/monitoring/post-deployment-check.sh

# 验证步骤：
# 1. 等待2分钟（预热）
# 2. 检查错误率是否增加
# 3. 检查延迟是否增加
# 4. 检查是否有新的告警
# 5. 对比部署前后指标

# 如果验证失败，触发自动回滚
```

**示例输出：**

```
🚀 Post-Deployment Validation
----------------------------

Deployment: v1.2.3 → v1.2.4
Time: 2025-11-23 15:00:00

✅ Error Rate: 0.2% (was 0.3%, -33%) ✓
✅ P95 Latency: 420ms (was 450ms, -7%) ✓
✅ CPU Usage: 45% (was 50%, -10%) ✓
✅ Memory Usage: 68% (was 70%, -3%) ✓
⚠️ New Alert: None

🎉 Deployment validation: PASSED
```

---

## 配置文件管理

### 目录结构

```
monitoring/
├── config/
│   ├── prometheus.yml           # Prometheus主配置
│   ├── prometheus-staging.yml   # Staging环境配置
│   ├── prometheus-production.yml # Production环境配置
│   │
│   ├── alerts/
│   │   ├── backend.yml          # Backend告警规则
│   │   ├── database.yml         # 数据库告警规则
│   │   ├── cache.yml            # 缓存告警规则
│   │   └── infrastructure.yml   # 基础设施告警规则
│   │
│   ├── grafana/
│   │   ├── datasources.yml      # 数据源配置
│   │   └── dashboards/
│   │       ├── overview.json    # 总览Dashboard
│   │       ├── backend-api.json # Backend Dashboard
│   │       ├── database.json    # 数据库Dashboard
│   │       └── business.json    # 业务指标Dashboard
│   │
│   └── alertmanager/
│       └── alertmanager.yml     # AlertManager配置
│
└── docker-compose.yml           # 监控栈部署配置
```

### 环境配置

**Staging环境：**

```yaml
# monitoring/config/prometheus-staging.yml
global:
  scrape_interval: 15s
  external_labels:
    environment: staging
    cluster: staging-01
# 告警阈值更宽松
# 保留数据7天
```

**Production环境：**

```yaml
# monitoring/config/prometheus-production.yml
global:
  scrape_interval: 10s
  external_labels:
    environment: production
    cluster: prod-01
# 告警阈值严格
# 保留数据30天
# 高可用配置
```

---

## Dashboard设计

### 1. Overview Dashboard（总览）

**指标卡片：**

```
┌─────────────────────────────────────────────────┐
│  🟢 All Services Healthy                        │
│  ├─ Backend API: ✅ Running                     │
│  ├─ PostgreSQL: ✅ Running (45 connections)     │
│  ├─ Redis: ✅ Running (85% memory)              │
│  └─ AI Service: ✅ Running (3 tasks queued)     │
│                                                  │
│  📊 Key Metrics (Last 1 hour)                   │
│  ├─ Requests: 125.3k (+5%)                      │
│  ├─ Error Rate: 0.2% (↓ from 0.3%)              │
│  ├─ P95 Latency: 420ms (↓ from 450ms)           │
│  └─ Active Users: 1,234 (+10%)                  │
│                                                  │
│  🚨 Active Alerts: 0                            │
└─────────────────────────────────────────────────┘
```

**时序图表：**

- 请求速率 (RPS)
- 错误率趋势
- 延迟分布 (P50, P95, P99)
- 系统资源使用 (CPU, Memory)

### 2. Backend API Dashboard

**图表：**

1. 请求速率（按endpoint分组）
2. 错误率（按status code分组）
3. 延迟热图（Heatmap）
4. 慢接口排行 (Top 10)
5. 并发连接数

### 3. Database Dashboard

**图表：**

1. 连接数趋势
2. 查询性能（平均执行时间）
3. 慢查询列表
4. 数据库大小增长
5. 锁等待情况

---

## 使用示例

### 示例1：部署监控系统

```bash
# Agent调用
"请帮我部署监控系统到staging环境"

# Agent执行流程：
🔍 [1/5] 验证配置文件
✅ prometheus-staging.yml: 有效
✅ alerts-staging.yml: 14条规则，语法正确
✅ grafana配置: 4个dashboard

🚀 [2/5] 部署监控栈
✅ 启动Prometheus (端口: 9090)
✅ 启动Grafana (端口: 3000)
✅ 启动AlertManager (端口: 9093)
✅ 启动Exporters

🔍 [3/5] 健康检查
✅ 所有组件运行正常
✅ 采集器连接成功（5/5）

📊 [4/5] 导入Dashboard
✅ Overview Dashboard
✅ Backend API Dashboard
✅ Database Dashboard
✅ Business Metrics Dashboard

✅ [5/5] 验证告警规则
✅ 14条规则加载成功
✅ 无激活告警

🎉 监控系统部署完成！
访问: http://localhost:3000 (admin/admin)
```

### 示例2：分析性能下降

```bash
# 用户报告：最近API变慢了

# Agent调用
"帮我分析最近24小时的性能问题"

# Agent执行：
🔍 分析性能指标...

📊 Performance Analysis (Last 24 hours)
---------------------------------------

1️⃣ Latency Increase Detected
   P95: 450ms → 850ms (+89%)
   P99: 1.2s → 2.5s (+108%)

2️⃣ Root Cause Analysis
   ├─ Database Query Time: +120%
   │  Top Slow Queries:
   │  • SELECT * FROM resources WHERE category='NEWS' (1.2s avg)
   │  • UPDATE data_collection_raw_data... (800ms avg)
   │
   ├─ Database Connections: 78 (High)
   │  近期增长40%，可能导致锁竞争
   │
   └─ Memory Usage: 88%
      GC频率增加，可能导致停顿

3️⃣ Recommendations
   ✅ [High Priority] 添加索引: resources.category
   ✅ [High Priority] 优化慢查询（见建议SQL）
   ✅ [Medium] 增加数据库连接池大小
   ✅ [Medium] 增加应用内存限制

4️⃣ Estimated Impact
   预计改进后P95延迟可降低至~350ms (-58%)
```

### 示例3：集成到部署流程

```bash
# merge-to-main agent自动调用

# Phase 3.5: Pre-deployment Check
🔍 检查部署前系统状态...

✅ No critical alerts
✅ Error rate: 0.2% (healthy)
✅ CPU usage: 45% (healthy)
✅ Memory usage: 68% (healthy)
✅ Database connections: 42 (healthy)

✓ Safe to deploy

# Phase 5: Post-deployment Validation
🚀 部署完成，验证中...

⏱️ Waiting 2 minutes for warm-up...

✅ Error rate: 0.2% → 0.15% (improved)
✅ P95 latency: 450ms → 420ms (improved)
✅ No new alerts triggered

🎉 Deployment validation: PASSED
```

---

## 告警处理Runbook

### Backend Down

**症状：** Backend API不响应

**影响：** 用户无法访问系统

**处理步骤：**

```bash
# 1. 检查服务状态
docker ps | grep backend
docker logs --tail 100 deepdive-backend

# 2. 尝试重启
docker restart deepdive-backend

# 3. 如果问题持续，检查依赖
./scripts/monitoring/check-dependencies.sh

# 4. 考虑回滚
./scripts/merge-to-main/rollback-merge.sh <commit>

# 5. 通知团队
./scripts/monitoring/notify-team.sh "Backend Down - Investigating"
```

### High Error Rate

**症状：** 错误率 > 5%

**可能原因：**

- 最近代码变更引入bug
- 依赖服务异常
- 资源耗尽

**处理步骤：**

```bash
# 1. 导出错误日志
./scripts/monitoring/export-error-logs.sh --last 15m

# 2. 分析错误模式
grep -E "Error|Exception" errors.log | sort | uniq -c | sort -rn

# 3. 检查最近部署
git log --oneline -5

# 4. 如果是部署导致，回滚
./scripts/merge-to-main/rollback-merge.sh <commit>

# 5. 否则，深入调查
./scripts/monitoring/analyze-errors.sh
```

---

## 最佳实践

### 1. 告警疲劳预防

```yaml
# 使用合理的告警阈值
- alert: HighErrorRate
  expr: error_rate > 0.05  # 5%，而不是0.01（太敏感）
  for: 5m                  # 持续5分钟，而不是立即触发

# 告警分组和去重
route:
  group_by: ['service', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h  # 4小时后才重复发送
```

### 2. 有意义的告警

**好的告警：**

```
❌ Bad: "CPU > 80%"
✅ Good: "CPU > 80% for 10m, causing request queuing"

❌ Bad: "Disk usage high"
✅ Good: "Disk 90% full, estimated 2 days until full"
```

### 3. SLO/SLI定义

```yaml
# Service Level Indicators
SLI:
  availability: 99.9% # 每月允许停机43分钟
  latency_p95: < 500ms # 95%的请求在500ms内响应
  error_rate: < 0.5% # 错误率低于0.5%

# Service Level Objectives
SLO:
  - metric: availability
    target: 99.9%
    period: 30d

  - metric: latency_p95
    target: 500ms
    period: 7d
```

---

## 相关文档

- [Monitoring配置文档](../../monitoring/README.md)
- [Prometheus查询语言](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard设计](https://grafana.com/docs/grafana/latest/dashboards/)
- [告警最佳实践](https://landing.google.com/sre/workbook/chapters/alerting-on-slos/)

---

**记住：好的监控系统能让你在用户发现问题之前就知道并解决！**
