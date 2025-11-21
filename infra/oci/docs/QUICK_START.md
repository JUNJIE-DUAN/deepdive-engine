# DeepDive Engine - OCI 部署快速启动指南

## 5 分钟快速开始

### 前置条件检查

```bash
# 1. 确认已安装必要工具
docker --version        # Docker Desktop
oci --version          # OCI CLI
git --version          # Git

# 2. OCI 账户已配置
cat ~/.oci/config       # 验证 OCI CLI 配置

# 3. SSH 密钥已生成
ls ~/.ssh/id_rsa        # 验证 SSH 密钥
```

### 一键部署（3 个步骤）

#### 步骤 1: 设置环境变量

```bash
# 从 OCI 控制台获取以下信息
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1.phx..."
export OCI_REGION="ap-singapore-1"
export REGISTRY_NAMESPACE="deepdive"

# 验证
echo "Compartment: $OCI_COMPARTMENT_OCID"
echo "Region: $OCI_REGION"
```

#### 步骤 2: 执行部署脚本

```bash
# 从项目根目录执行
bash deploy.sh

# 脚本会自动：
# ✅ 验证环境
# ✅ 构建 Docker 镜像
# ✅ 推送到 OCI Registry
# ✅ 创建 OCI 基础设施
# ✅ 部署容器
# ✅ 初始化数据库
# ✅ 配置监控
```

#### 步骤 3: 验证部署

```bash
# 部署完成后会输出访问 URL，例如：
# 📱 前端应用: http://123.45.67.89
# 📊 后端 API: http://10.0.2.xxx:3001

# 验证服务状态
curl http://<frontend-ip>/
curl http://<backend-ip>:3001/health
```

---

## 常见问题排查

### Q1: 部署失败 - OCI 连接错误

```bash
# 检查 OCI 配置
oci iam compartment list --compartment-id $OCI_COMPARTMENT_OCID

# 重新配置 OCI CLI
oci setup config
```

### Q2: 镜像推送失败

```bash
# 确认登录状态
oci session authenticate --auth-method federation

# 重新登录 Registry
docker logout <registry>
docker login <registry>
```

### Q3: 实例创建超时

```bash
# 检查 OCI 免费套餐配额
# 确保选择的 Region 有可用资源

# 查看实例创建状态
oci compute instance list --compartment-id $OCI_COMPARTMENT_OCID
```

---

## 部署后的下一步

### 1. 验证应用

```bash
# 访问前端
open http://<frontend-ip>

# 检查后端 API
curl http://<backend-ip>:3001/api/health
```

### 2. 配置监控告警（可选）

```bash
# 监控成本使用
bash scripts/cost-monitor.sh

# 配置 Slack 告警
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
bash scripts/setup-monitoring.sh
```

### 3. 配置 HTTPS/SSL（推荐）

```bash
# 使用 Let's Encrypt
# 前提：已配置域名
bash scripts/setup-ssl.sh
```

### 4. 设置定期备份

```bash
# 验证备份脚本
bash scripts/backup.sh

# 检查备份
ls -lh /home/ubuntu/backups/
```

---

## 成本管控清单

### 日常检查（每天）

- [ ] 检查实例是否正常运行
- [ ] 查看日志中是否有异常错误
- [ ] 验证数据库连接正常

### 周度检查（每周一）

- [ ] 查看 OCI 成本报告
- [ ] 检查 vCPU 使用是否超过 4
- [ ] 检查存储是否超过 20GB
- [ ] 清理过期日志

### 月度检查（每月初）

- [ ] 审计数据库中的数据
- [ ] 优化慢查询
- [ ] 检查是否有泄漏资源
- [ ] 更新文档

---

## 快速命令参考

```bash
# ===== 部署相关 =====
bash deploy.sh                    # 完整部署
bash scripts/deploy-containers.sh # 更新部署
bash scripts/verify-deployment.sh # 验证部署
bash scripts/rollback.sh          # 回滚部署

# ===== 监控相关 =====
bash scripts/cost-monitor.sh      # 监控成本
bash scripts/health-check.sh      # 检查健康状态
bash scripts/backup.sh            # 执行备份

# ===== 日志相关 =====
docker logs -f deepdive-backend --tail=50    # 后端日志
docker logs -f deepdive-frontend --tail=50   # 前端日志
docker logs -f deepdive-postgres --tail=50   # 数据库日志

# ===== 数据库相关 =====
docker exec deepdive-postgres psql -U deepdive -d deepdive  # 连接数据库
docker exec deepdive-mongo mongosh -u deepdive            # 连接 MongoDB
docker exec deepdive-neo4j cypher-shell -u neo4j          # 连接 Neo4j

# ===== 故障排除 =====
docker ps                         # 列出所有容器
docker-compose down              # 停止所有服务
docker-compose up -d             # 启动所有服务
```

---

## 获取帮助

- 📖 详细文档: `cat OCI_DEPLOYMENT_PLAN.md`
- 🐛 故障排查: `cat docs/TROUBLESHOOTING.md`
- 📚 运维手册: `cat docs/OPERATIONS.md`
- 🔗 OCI 官方文档: https://docs.oracle.com/iaas/Content/home.htm

---

**Version**: 1.0
**Last Updated**: 2024
**Maintainer**: DeepDive Team
