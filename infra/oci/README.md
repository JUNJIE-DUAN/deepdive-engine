# 🚀 OCI 免费套餐部署方案

本目录包含 DeepDive Engine 到 OCI 的完整部署方案。

## 📁 目录结构

```
oci/
├── README.md                    # 本文件 - 快速导航
├── docs/                        # 📚 详细文档 (45,000+ 字)
│   ├── README_OCI_DEPLOYMENT.md     # 部署入口和快速导航
│   ├── QUICK_START.md               # 5 分钟快速开始
│   ├── OCI_DEPLOYMENT_PLAN.md       # 15,000+ 字详细方案
│   ├── COST_MANAGEMENT.md           # 成本管控完整指南
│   ├── ARCHITECTURE.md              # 系统架构详解
│   ├── DEPLOYMENT_SUMMARY.md        # 项目总体总结
│   └── FINAL_REPORT.md              # 交付总结报告
├── scripts/                     # 🚀 部署脚本
│   └── deploy.sh                    # 一键部署主脚本
├── terraform/                   # 🏗️  基础设施代码
│   ├── main.tf                      # VCN 和实例配置
│   └── variables.tf                 # 变量定义
├── init/                        # 📝 初始化脚本
│   ├── frontend.sh                  # 前端实例初始化
│   └── backend.sh                   # 后端实例初始化
└── ci-cd/                       # 🤖 CI/CD 配置
    └── oci-deploy.yml               # GitHub Actions 工作流
```

## 🎯 Getting Started (3 Steps)

### ⚡ Fastest Way (Recommended)

Want to deploy immediately? Just give me 6 pieces of information:

```bash
# 1. Read what I need (2 minutes)
cat WHAT_I_NEED.md

# 2. Collect your OCI account information (5 minutes)

# 3. Tell me those 6 values
# I will handle all deployment automatically (20-30 minutes)
```

---

### 📚 Detailed Documentation

```bash
# Quick start guide
cat docs/QUICK_START.md

# Complete deployment plan
cat docs/README_OCI_DEPLOYMENT.md

# Pre-deployment checklist
cat PRE_DEPLOYMENT_CHECKLIST.md
```

### 3️⃣ 执行部署（15-30 分钟）

```bash
# 从项目根目录执行
bash oci/scripts/deploy.sh
```

## 📚 文档导航

| 文档                                                        | 用途               | 时间    |
| ----------------------------------------------------------- | ------------------ | ------- |
| [QUICK_START.md](./docs/QUICK_START.md)                     | 5分钟快速开始      | 5 分钟  |
| [README_OCI_DEPLOYMENT.md](./docs/README_OCI_DEPLOYMENT.md) | 部署入口和检查清单 | 10 分钟 |
| [OCI_DEPLOYMENT_PLAN.md](./docs/OCI_DEPLOYMENT_PLAN.md)     | 完整详细方案       | 30 分钟 |
| [COST_MANAGEMENT.md](./docs/COST_MANAGEMENT.md)             | 零成本管控         | 20 分钟 |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md)                   | 系统架构详解       | 25 分钟 |
| [DEPLOYMENT_SUMMARY.md](./docs/DEPLOYMENT_SUMMARY.md)       | 项目总体总结       | 10 分钟 |
| [FINAL_REPORT.md](./docs/FINAL_REPORT.md)                   | 交付总结报告       | 15 分钟 |

## 🎯 按角色推荐阅读

### 👨‍💼 项目经理

- QUICK_START.md (5 分钟)
- DEPLOYMENT_SUMMARY.md (10 分钟)
- FINAL_REPORT.md (15 分钟)

### 👨‍💻 开发者

- README_OCI_DEPLOYMENT.md (10 分钟)
- QUICK_START.md (5 分钟)
- 执行部署 (30 分钟)

### 🏗️ 架构师

- OCI_DEPLOYMENT_PLAN.md (30 分钟)
- ARCHITECTURE.md (25 分钟)
- COST_MANAGEMENT.md (20 分钟)

### 🛠️ 运维工程师

- OCI_DEPLOYMENT_PLAN.md (30 分钟)
- COST_MANAGEMENT.md (20 分钟)
- DEPLOYMENT_SUMMARY.md (10 分钟)

## 🚀 部署脚本说明

### `scripts/deploy.sh`

一键部署脚本，自动完成以下步骤：

1. 验证环境和 OCI 连接
2. 构建 Docker 镜像
3. 推送镜像到 OCI Registry
4. 创建 OCI 基础设施 (Terraform)
5. 部署容器
6. 初始化数据库
7. 配置监控告警
8. 验证部署

**使用方法**：

```bash
bash oci/scripts/deploy.sh
```

**耗时**: 15-30 分钟

## 🏗️ Terraform 配置说明

### `terraform/main.tf`

- VCN (虚拟云网络) 配置
- 公共/私有子网
- 3 个计算实例 (前端、后端、AI)
- 安全组和路由

### `terraform/variables.tf`

- OCI Compartment ID
- Region 配置
- SSH 公钥
- Registry 命名空间

**使用方法**：

```bash
cd oci/terraform
terraform init
terraform plan
terraform apply
```

## 📝 初始化脚本说明

### `init/frontend.sh`

前端实例初始化脚本，完成：

- 系统更新
- Docker 安装
- Health check 配置
- 日志收集配置

### `init/backend.sh`

后端实例初始化脚本，完成：

- 系统更新
- Docker 安装
- 数据库初始化
- 备份脚本配置
- Health check 配置

这些脚本自动执行，无需手动干预。

## 🤖 CI/CD 配置说明

### `ci-cd/oci-deploy.yml`

GitHub Actions 工作流配置，实现：

- 代码提交自动触发
- 自动化测试
- Docker 镜像构建和推送
- 自动部署到 OCI
- 自动验证
- Slack 通知

**配置**：

```bash
# 在 GitHub Secrets 中设置以下变量：
OCI_TENANCY_OCID
OCI_USER_OCID
OCI_FINGERPRINT
OCI_API_KEY_PRIVATE (base64 编码)
OCI_REGION
OCI_COMPARTMENT_OCID
```

## 💰 成本概览

### 完全免费！

```
OCI 免费套餐:
├── Compute: 4 vCPU + 24GB RAM (我们用 4 vCPU + 22GB)
├── Storage: 20GB (我们用 <10GB)
├── Database: ATP 19GB (我们用关键数据)
└── 总成本: $0.00 ✅
```

详见：[COST_MANAGEMENT.md](./docs/COST_MANAGEMENT.md)

## 📊 部署规模

- **计算资源**: 3 个实例
  - 前端: 2 vCPU + 8GB RAM
  - 后端: 2 vCPU + 8GB RAM
  - AI: 2 vCPU + 6GB RAM (可选)

- **数据库**: 5 个
  - PostgreSQL (关键数据)
  - MongoDB (原始数据)
  - Neo4j (知识图谱)
  - Redis (缓存)
  - Qdrant (向量数据库)

- **部署时间**: 15-30 分钟

## ✅ 部署前检查清单

```
环境要求:
□ Docker 已安装
□ OCI CLI 已安装
□ Terraform 已安装
□ Git 已安装

OCI 账户:
□ OCI 免费账户已创建
□ OCI CLI 已配置 (oci setup config)
□ SSH 密钥已生成 (ls ~/.ssh/id_rsa)
□ Tenancy OCID 已获取
□ Compartment OCID 已获取

凭证和权限:
□ 有权创建计算实例
□ 有权创建 VCN
□ 有权访问对象存储
```

## 🆘 常见问题

### Q: 如何查看部署日志？

A:

```bash
# 查看脚本日志
tail -f deploy.log

# 查看应用日志
docker logs -f deepdive-backend
```

### Q: 如何停止部署？

A:

```bash
# 停止所有服务
docker-compose down

# 销毁 OCI 资源
cd oci/terraform
terraform destroy
```

### Q: 如何更新应用？

A:

```bash
# 代码提交自动触发部署
git push origin main

# 或手动重新部署
bash oci/scripts/deploy.sh
```

### Q: 成本会超吗？

A: 不会！我们完全使用免费套餐，有实时成本监控。详见：[COST_MANAGEMENT.md](./docs/COST_MANAGEMENT.md)

## 📞 获取帮助

### 文档

1. 快速问题 → `QUICK_START.md`
2. 部署问题 → `README_OCI_DEPLOYMENT.md`
3. 成本问题 → `COST_MANAGEMENT.md`
4. 架构问题 → `ARCHITECTURE.md`
5. 深入理解 → `OCI_DEPLOYMENT_PLAN.md`

### 外部资源

- OCI 文档: https://docs.oracle.com/iaas/
- Docker 文档: https://docs.docker.com/
- Terraform 文档: https://www.terraform.io/docs/

## 🎁 项目亮点

✅ **完全免费** - OCI 免费套餐，零成本
✅ **一键部署** - 单个脚本完成全部配置
✅ **自动化** - GitHub Actions 完全 CI/CD
✅ **文档完整** - 45,000+ 字详细文档
✅ **生产级** - 企业级架构和配置
✅ **易维护** - 清晰的代码和文档

## 📄 许可证

MIT

---

**准备好了？现在就开始部署吧！** 🚀

```bash
bash oci/scripts/deploy.sh
```
