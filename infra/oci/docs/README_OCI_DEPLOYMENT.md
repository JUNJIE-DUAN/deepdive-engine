# 🚀 DeepDive Engine OCI 免费套餐部署方案

## 📖 快速导航

本项目已完整部署方案已准备就绪。请按照以下指南操作：

### 🎯 我是谁？需要什么？

- **首次接触** → 阅读 [QUICK_START.md](./QUICK_START.md) (5 分钟)
- **需要完整方案** → 阅读 [OCI_DEPLOYMENT_PLAN.md](./OCI_DEPLOYMENT_PLAN.md) (30 分钟)
- **关心成本管控** → 阅读 [COST_MANAGEMENT.md](./COST_MANAGEMENT.md) (20 分钟)
- **项目概览** → 阅读 [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) (10 分钟)

---

## ⚡ 30 秒快速开始

```bash
# 1. 设置环境
export OCI_COMPARTMENT_OCID="你的 compartment ID"
export OCI_REGION="ap-singapore-1"

# 2. 一键部署
bash deploy.sh

# 3. 等待完成（15-30 分钟）
# 脚本会输出访问 URL

# 4. 访问应用
# 前端: http://<输出的 IP 地址>
# 后端 API: http://<后端 IP>:3001
```

---

## 📋 部署前检查清单

在执行 `deploy.sh` 之前，请确保：

### 环境要求

```bash
# 检查工具版本
✅ Docker 已安装: docker --version
✅ OCI CLI 已安装: oci --version
✅ Git 已安装: git --version
✅ Terraform 已安装: terraform --version
```

### OCI 账户准备

```
✅ OCI 免费账户已创建: https://www.oracle.com/cloud/free/
✅ OCI CLI 已配置: oci setup config
✅ SSH 密钥已生成: ls ~/.ssh/id_rsa
✅ Tenancy OCID 已获取: ocid1.tenancy.oc1...
✅ Compartment OCID 已获取: ocid1.compartment.oc1...
✅ Region 已确定: ap-singapore-1 (推荐)
```

### 凭证和权限

```
✅ 有权创建计算实例
✅ 有权创建 VCN 和网络资源
✅ 有权访问对象存储
✅ API 密钥已生成并配置
```

---

## 🚀 部署步骤

### Step 1: 准备环境（5 分钟）

```bash
# 1.1 克隆项目
git clone https://github.com/deepdive-engine/deepdive-engine.git
cd deepdive-engine

# 1.2 验证文件
ls -la deploy.sh                  # 应该存在
ls -la OCI_DEPLOYMENT_PLAN.md     # 应该存在
ls -la docker-compose.yml         # 应该存在

# 1.3 配置环境变量
# 从 OCI 控制台获取这些值：
# 路径: 菜单 → 管理 → 舱室 (Compartment)

export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1.phx.aaaaaaaxxxxxxxxx"
export OCI_REGION="ap-singapore-1"  # 或其他区域
export REGISTRY_NAMESPACE="deepdive"

# 验证变量
echo "Compartment: $OCI_COMPARTMENT_OCID"
echo "Region: $OCI_REGION"
```

### Step 2: 执行部署脚本（15-30 分钟）

```bash
# 2.1 赋予脚本执行权限
chmod +x deploy.sh

# 2.2 执行部署
bash deploy.sh

# 脚本会自动执行以下操作：
# ✅ 验证 OCI CLI 连接
# ✅ 构建 Docker 镜像
# ✅ 推送到 OCI Registry
# ✅ 创建 VCN 和子网
# ✅ 创建 3 个计算实例
# ✅ 配置安全组
# ✅ 部署容器
# ✅ 初始化数据库
# ✅ 配置监控

# ⏱️  总耗时: 15-30 分钟
# 大部分时间用于实例创建和初始化
```

### Step 3: 验证部署（5 分钟）

```bash
# 3.1 脚本完成后会输出：
# 📱 前端应用: http://XXX.XXX.XXX.XXX
# 📊 后端 API: http://10.0.2.XXX:3001

# 3.2 验证前端
curl http://<前端-IP>/
# 应返回 HTML 页面

# 3.3 验证后端
curl http://<后端-IP>:3001/health
# 应返回: {"status":"ok"}

# 3.4 查看日志
docker logs -f deepdive-backend --tail=20
```

### Step 4: 配置和优化（根据需要）

```bash
# 4.1 配置自定义域名（可选）
# 在 DNS 提供商处添加 A 记录指向前端 IP

# 4.2 启用 HTTPS（推荐）
bash scripts/setup-ssl.sh

# 4.3 配置备份（推荐）
bash scripts/backup.sh

# 4.4 配置监控告警
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
bash scripts/setup-monitoring.sh
```

---

## 📊 部署完成后

### 验证清单

```
应用服务:
□ 前端可访问
□ 后端 API 可访问
□ 数据库已初始化
□ 日志正常输出

监控告警:
□ 成本监控已启用
□ 健康检查已运行
□ 备份已验证
□ 告警已配置

文档:
□ 已阅读 QUICK_START.md
□ 已阅读 COST_MANAGEMENT.md
□ 已记录关键 IP 地址
□ 已配置通知渠道
```

### 日常运维

```bash
# 查看应用状态
docker ps

# 查看实时日志
docker logs -f deepdive-backend

# 监控成本（后台运行）
nohup bash scripts/cost-monitor.sh > cost.log 2>&1 &

# 定期备份
bash scripts/backup.sh

# 检查健康状态
bash scripts/verify-deployment.sh
```

---

## 🆘 常见问题

### Q1: deploy.sh 执行失败

**症状**: 脚本中途停止

**解决方案**:

```bash
# 1. 检查错误信息
# 脚本会输出详细错误

# 2. 验证 OCI 连接
oci iam compartment list --compartment-id $OCI_COMPARTMENT_OCID

# 3. 重新运行脚本
# 脚本设计支持断点续传
bash deploy.sh
```

### Q2: 无法连接前端

**症状**: `curl http://<IP>` 超时

**解决方案**:

```bash
# 1. 检查实例是否启动
oci compute instance list \
  --compartment-id $OCI_COMPARTMENT_OCID \
  --query 'data[].{name: display_name, state: lifecycle_state}'

# 2. 检查安全组规则
# 控制台 → VCN → 安全列表

# 3. SSH 连接到实例调试
ssh -i ~/.ssh/id_rsa ubuntu@<前端-IP>
docker ps
```

### Q3: 成本超额告警

**症状**: 收到超额告警

**解决方案**:

```bash
# 1. 立即关闭 AI 服务（可选）
docker-compose stop deepdive-ai

# 2. 检查资源使用
bash scripts/cost-monitor.sh

# 3. 优化应用
# - 减少数据库查询
# - 启用缓存
# - 删除日志

# 4. 查看详细成本
# 控制台 → 成本管理
```

### Q4: 部署时超时

**症状**: "等待实例启动" 卡住

**解决方案**:

```bash
# 实例创建可能需要较长时间（10-20 分钟）
# 可以手动检查进度：

oci compute instance list \
  --compartment-id $OCI_COMPARTMENT_OCID

# 状态应为 RUNNING
```

---

## 💾 备份和恢复

### 自动备份

部署脚本已配置自动备份（每日 02:00 执行）：

```bash
# 手动触发备份
bash scripts/backup.sh

# 查看备份
ls -lh /home/ubuntu/backups/

# 从备份恢复 PostgreSQL
gunzip < /home/ubuntu/backups/postgres_*.sql.gz | \
    docker exec -i deepdive-postgres psql -U deepdive
```

### 灾难恢复

```bash
# 回滚到上一个版本
bash scripts/rollback.sh

# 在新实例上恢复
# 1. 创建新实例
# 2. 部署应用
# 3. 恢复备份数据
```

---

## 📈 性能调优

### 监控指标

```bash
# 实时资源使用
docker stats

# 数据库性能
docker exec deepdive-postgres psql -U deepdive -c "SELECT version();"

# API 性能
curl -w "@curl-format.txt" http://<backend-IP>:3001/health
```

### 常见优化

```bash
# 1. 启用数据库缓存
docker exec deepdive-postgres psql -U deepdive -c "ANALYZE;"

# 2. 清理日志
find /var/log -name "*.log" -type f -mtime +30 -delete

# 3. 优化 Docker 镜像
docker image ls
docker image prune -a

# 4. 启用 Redis 缓存
# 见 backend/.env
```

---

## 🔒 安全建议

### 必须做的

```
✅ 修改所有默认密码
✅ 启用 HTTPS/SSL
✅ 配置防火墙规则
✅ 定期更新依赖
✅ 启用日志审计
```

### 可选的

```
⭐ 启用 VPN 访问后端
⭐ 配置 Web 应用防火墙
⭐ 启用数据加密
⭐ 定期安全审计
```

---

## 📞 获取支持

### 文档

- 📖 详细方案: [OCI_DEPLOYMENT_PLAN.md](./OCI_DEPLOYMENT_PLAN.md)
- 🚀 快速开始: [QUICK_START.md](./QUICK_START.md)
- 💰 成本管控: [COST_MANAGEMENT.md](./COST_MANAGEMENT.md)
- 📊 项目汇总: [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)

### 外部资源

- OCI 官方文档: https://docs.oracle.com/iaas/
- OCI 免费套餐: https://www.oracle.com/cloud/free/
- Docker 文档: https://docs.docker.com/
- Terraform 文档: https://www.terraform.io/docs/

### 问题报告

- GitHub Issues: https://github.com/deepdive-engine/issues
- Email: support@deepdive.ai

---

## 📝 变更日志

### v1.0 (2024)

- ✅ 初始版本发布
- ✅ 完整的部署方案
- ✅ 一键部署脚本
- ✅ CI/CD 流程
- ✅ 成本管控指南
- ✅ 详细文档

---

## ✨ 项目亮点

✅ **完全免费** - 使用 OCI 免费套餐，零成本
✅ **一键部署** - 执行单个脚本完成全部配置
✅ **自动化** - GitHub Actions 完全自动化 CI/CD
✅ **文档完整** - 15000+ 字详细文档
✅ **可靠** - 自动健康检查和故障恢复
✅ **易维护** - 清晰的脚本和配置文件

---

## 🎯 下一步行动

```
立即开始:
1. 阅读 QUICK_START.md (5 分钟)
2. 检查部署前清单 (3 分钟)
3. 执行 bash deploy.sh (15-30 分钟)
4. 验证部署 (5 分钟)

共计: 30-45 分钟，获得完整的应用部署！
```

---

**祝你部署顺利！** 🚀

---

**版本**: v1.0
**创建时间**: 2024
**维护者**: DeepDive 团队
**许可证**: MIT
