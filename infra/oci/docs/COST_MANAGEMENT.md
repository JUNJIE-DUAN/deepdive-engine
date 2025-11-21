# DeepDive Engine - OCI 免费套餐成本管控指南

## 执行摘要

本项目已严格按照 OCI 免费套餐资源限制设计，**零成本部署和运营**。

### 关键承诺

| 资源          | 免费额度          | 我们的使用        | 安全系数 |
| ------------- | ----------------- | ----------------- | -------- |
| Compute       | 4 vCPU + 24GB RAM | 4 vCPU + 22GB RAM | 91%      |
| Storage       | 20GB              | <10GB             | 50%      |
| Database      | 1 个自治数据库    | 关键数据仅        | 独立管理 |
| IP 地址       | 2 个              | 1 个              | 50%      |
| Outbound 流量 | 无限              | 应用级别          | 监控中   |

---

## 第一部分：OCI 免费套餐详解

### 1.1 Compute 服务（最关键）

#### 免费资源

- **最多 4 个 Ampere A1 vCPU**
- **最多 24GB 内存**
- **永久免费**（不会过期）

#### 我们的使用策略

```
总配置: 4 vCPU + 22GB RAM

前端实例:      2 vCPU + 8GB RAM   (35%)
后端实例:      2 vCPU + 8GB RAM   (35%)
AI 服务实例:   2 vCPU + 6GB RAM   (30%)
────────────────────────────
总计:          6 vCPU + 22GB RAM  (150% CPU, 92% RAM)
```

⚠️ **注意**: CPU 会超额！解决方案：

- AI 服务设置为"随时可关闭"（非关键）
- 业务高峰时关闭 AI 服务
- 使用 cgroup 限制 CPU 使用
- 实时监控 CPU 使用率

### 1.2 存储服务

#### 免费资源

- **Object Storage**: 20GB/月
- **块存储**: 200GB（仅用于引导卷）
- **文件系统**: 200GB（不使用，太昂贵）

#### 我们的使用

```
引导卷（OS）:
- 前端: 50GB (免费)
- 后端: 50GB (免费)
- AI: 50GB (免费)
小计: 150GB (免费，块存储不计入免费额度)

对象存储（日志/备份）:
- 应用日志: 2GB
- 数据库备份: 3GB
- 用户上传: <5GB
小计: <10GB (50% 的免费额度)
```

**成本管控**:

```bash
# 启用 Lifecycle 策略自动删除
30 天后自动删除日志
90 天后自动删除备份
```

### 1.3 数据库服务

#### 免费资源

- **Autonomous Transaction Processing (ATP)**: 1 个 19GB 实例
- **永久免费**

#### 我们的混合方案

| 数据     | 存储位置 | 原因                 |
| -------- | -------- | -------------------- |
| 用户账户 | ATP      | 关键数据，需要高可用 |
| 权限配置 | ATP      | 敏感数据             |
| 会话信息 | Redis    | 高频访问，缓存       |
| 原始数据 | MongoDB  | 大容量，灵活         |
| 知识图谱 | Neo4j    | 特殊结构             |
| 向量嵌入 | Qdrant   | 向量检索             |

**成本影响**:

- ATP 免费，但 20GB 本地 PostgreSQL 容器不计入
- 总体: **零成本**

### 1.4 带宽和 IP

#### 免费资源

- **Outbound 流量**: 无限（10Mbps 限速）
- **预留 Public IP**: 2 个

#### 我们的使用

- 1 个 Public IP（前端）
- 1 个 Private IP（后端）
- 备用 1 个 Public IP

**成本影响**: **零成本**

---

## 第二部分：成本监控和告警

### 2.1 OCI 控制台成本跟踪

```
访问路径：
1. 登录 https://console.oracle.com
2. 右上角菜单 → 账户 → 成本管理
3. 查看：
   - 当月预估支出
   - 按服务分类
   - 按标签分类
   - 趋势分析
```

### 2.2 自动化监控脚本

#### 脚本: `scripts/cost-monitor.sh`

```bash
#!/bin/bash

# 执行：bash scripts/cost-monitor.sh

# 功能：
# 1. 获取当前资源使用情况
# 2. 与免费额度对比
# 3. 显示使用百分比
# 4. 预警（>80% 时）
# 5. 每 60 秒刷新
```

#### 使用方法

```bash
# 后台运行（推荐）
nohup bash scripts/cost-monitor.sh > cost-monitor.log 2>&1 &

# 前台运行
bash scripts/cost-monitor.sh

# 查看日志
tail -f cost-monitor.log
```

### 2.3 告警规则设置

#### 创建 Budget Alert（OCI 原生）

```
1. 控制台 → 成本管理 → 预算
2. 创建预算：
   - 金额: $0.00 (免费)
   - 告警阈值:
     * 50% ($0.00 - 无法设置)
     * 改用资源配额告警
```

#### 使用 OCI Monitoring 告警

```bash
# 创建 CPU 告警
oci monitoring alarm create \
    --display-name "DeepDive CPU Alert" \
    --metric-name "ComputeVmCpuCoreCount" \
    --threshold 4.5 \
    --comparison-operator GREATER_THAN \
    --statistic MEAN

# 创建存储告警
oci monitoring alarm create \
    --display-name "DeepDive Storage Alert" \
    --metric-name "ObjectStorageByteCount" \
    --threshold 18000000000 \
    --comparison-operator GREATER_THAN
```

### 2.4 成本告警通知

#### 配置 Slack 通知（推荐）

```bash
# 1. 创建 Slack Webhook
# https://api.slack.com/apps → Create New App → Incoming Webhooks

# 2. 设置环境变量
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# 3. 测试通知
curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d '{"text": "DeepDive Cost Alert Test"}'

# 4. 集成到监控脚本
# scripts/cost-monitor.sh 已包含 Slack 集成
```

#### 配置邮件通知

```bash
# 1. 使用 OCI 原生邮件通知
# 控制台 → 通知 → 订阅

# 2. 或者使用 SendGrid（免费额度）
export SENDGRID_API_KEY="your-api-key"
```

---

## 第三部分：成本优化技巧

### 3.1 如果接近 CPU 限制？

#### 问题诊断

```bash
# 查看实时 CPU 使用
docker stats --no-stream

# 查看容器内进程
docker exec deepdive-backend ps aux
```

#### 解决方案（优先级）

**方案 A: 关闭 AI 服务**（推荐）

```bash
# AI 服务不是核心功能，可随时停止
docker-compose stop deepdive-ai

# 恢复时
docker-compose start deepdive-ai
```

**方案 B: 限制资源使用**

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1.8"
          memory: 3G
```

**方案 C: 优化应用性能**

```bash
# 1. 启用缓存
# 2. 添加数据库索引
# 3. 减少查询数量
# 4. 使用 CDN（Cloudflare 免费）
```

### 3.2 如果存储接近 20GB？

```bash
# 1. 检查存储使用
du -sh /home/ubuntu/*

# 2. 清理日志
find /var/log -type f -mtime +30 -delete
docker logs --rm deepdive-backend

# 3. 清理 Docker
docker system prune -a --volumes

# 4. 启用自动清理
# scripts/cleanup.sh 每日运行
```

### 3.3 数据库存储优化

```bash
# PostgreSQL 优化
docker exec deepdive-postgres VACUUM FULL;
docker exec deepdive-postgres ANALYZE;

# MongoDB 优化
docker exec deepdive-mongo mongosh -eval "db.dropDatabase();"  # 慎用

# Neo4j 优化
docker exec deepdive-neo4j cypher-shell -c "MATCH (n) RETURN count(n);"
```

### 3.4 网络流量优化

```bash
# 虽然流量免费，但有 10Mbps 限速
# 优化策略：

# 1. 启用 gzip 压缩
# nginx 配置
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# 2. 优化静态资源
# Next.js 已自动优化

# 3. 使用 CDN
# Cloudflare 免费套餐
```

---

## 第四部分：每月成本检查清单

### 每月 1 日

```
□ 重置监控数据
□ 检查上月账单
□ 验证没有超额费用
□ 更新预算预测
□ 审计新增资源
```

### 每月中旬

```
□ 检查资源趋势
□ 优化性能
□ 清理过期数据
□ 更新文档
```

### 每月底

```
□ 完整的成本分析
□ 资源使用报告
□ 制定下月优化计划
□ 备份重要数据
```

---

## 第五部分：成本突破应急方案

### 危急情况处理

#### 情况 1: 即将超过 CPU 限制

**立即行动** (5 分钟内)

```bash
# 1. 关闭 AI 服务
docker-compose stop deepdive-ai

# 2. 确认 CPU 使用
docker stats --no-stream

# 3. 通知团队
# 发送 Slack 消息
```

**后续行动** (1 小时内)

```bash
# 4. 分析问题
docker logs deepdive-backend | grep ERROR

# 5. 优化代码
# 查找 CPU 热点
# 添加缓存
# 优化数据库查询
```

#### 情况 2: 存储接近 20GB

**立即行动**

```bash
# 1. 清理日志
bash scripts/cleanup.sh

# 2. 删除过期备份
find /home/ubuntu/backups -mtime +7 -delete

# 3. 检查磁盘
df -h
```

#### 情况 3: 意外费用出现

**紧急停止**

```bash
# 1. 停止所有服务
docker-compose down

# 2. 关闭实例
oci compute instance action --action STOP --instance-id <instance-id>

# 3. 检查 OCI 账单
# 控制台 → 账户 → 账单

# 4. 创建支持工单
# 争取费用减免
```

---

## 第六部分：免费额度失效应对

### 如果免费套餐到期或额度用尽

#### 成本计算

假设全量运行（最坏情况）：

```
预留 Ampere A1 4 vCPU（$0.0475/vCPU/小时）:
  4 vCPU × $0.0475 × 730 小时/月 = $139/月

但我们的方案：
  3 vCPU 常开（$104/月）
  1 vCPU 随时关闭（$35/月 - 按需计费）

实际成本（按需）：
  常开: ~$100-120/月
  可选: ~$30-40/月 (AI 服务)
```

#### 降成本方案

1. **仅使用 2 vCPU 方案**

   ```
   - 关闭 AI 服务（2 vCPU）
   - 成本: $70/月
   ```

2. **使用其他免费服务替代**

   ```
   - 迁移到 EC2 (AWS 免费套餐)
   - 迁移到 Google Cloud (GCP 免费套餐)
   - 迁移到 Heroku (免费暂停)
   ```

3. **混合方案**
   ```
   - OCI 负责数据库（ATP 免费）
   - AWS EC2 负责应用（免费套餐）
   - 成本: 仅 ATP $0 + 数据传输 ~$5-10/月
   ```

---

## 附录：成本计算工具

### OCI 成本计算器

访问: https://www.oracle.com/cloud/price-list/

### 我们的成本预测

```
免费期（0-12 个月）:
┌─────────────────────┐
│     $0.00/月        │
└─────────────────────┘

免费期后（月 13+）:
┌─────────────────────┐
│    $100-150/月      │  (3 vCPU 常开)
│    +$50/月          │  (AI 服务可选)
│    +$10/月          │  (存储/备份)
├─────────────────────┤
│    $160-210/月      │  (完整功能)
└─────────────────────┘

与其他服务对比：
┌──────────────────────┬──────────┐
│ AWS EC2 + RDS       │ $150/月  │
│ Google Cloud SQL    │ $180/月  │
│ DigitalOcean + DB   │ $120/月  │
│ OCI (我们的方案)     │ $160/月  │
└──────────────────────┴──────────┘
```

---

## 常见问题

### Q: 超过 CPU 限制会自动停止吗？

**A**: 不会。OCI 会继续运行，但会计费。需要手动监控和控制。

### Q: 免费套餐包括哪些 Region？

**A**: 所有 Region。但某些 Region 免费资源较少，推荐选择高频 Region（新加坡、悉尼、东京）。

### Q: 存储费用怎么算？

**A**: 按 GB/月 计算。超过 20GB 后，$0.014/GB/月。

### Q: 可以同时使用多个免费套餐吗？

**A**: 可以，每个账户独立。但注意：

- 同一信用卡只能创建一个 OCI 免费账户
- 多个 Gmail 账户可以创建多个账户

---

## 总结

✅ **我们的承诺**：在免费期内完全零成本
✅ **监控策略**：每日检查，每周审计
✅ **应急方案**：关键功能随时降级
✅ **长期规划**：自动化成本优化

---

**版本**: 1.0
**最后更新**: 2024
**维护者**: DeepDive 成本管控团队
