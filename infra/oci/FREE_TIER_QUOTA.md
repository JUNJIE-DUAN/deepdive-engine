# OCI Free Tier 永久免费配额详情

## 🎯 计算资源 (Compute)

### Ampere A1 Compute Instances

- **数量**: 4 个实例
- **配置**: 可灵活配置，总计最多 4 个 ARM OCPU + 24GB RAM
- **示例配置**:
  - 4 × (1 vCPU + 6GB RAM)
  - 2 × (2 vCPU + 12GB RAM)
  - 1 × (4 vCPU + 24GB RAM)
  - 或其他组合方式

### 其他计算选项

- **VM.Standard.E2.1.Micro** (x86): 1 个实例（仅美国地区）
- **VM.Standard.E3.1.Micro** (x86): 部分地区可用

## 💾 存储资源 (Storage)

### Block Storage (块存储)

- **总额**: 200GB
- **每月免费**: 2M 次读取 + 2M 次写入

### Object Storage (对象存储)

- **总额**: 20GB (不限制对象数)
- **每月免费**: 10M 次请求操作

### Archive Storage (归档存储)

- **总额**: 20GB

## 🗄️ 数据库资源 (Database)

### Oracle Autonomous Databases

- **数量**: 2 个共享基础设施数据库
- **存储**: 20GB 总计
- **包括**:
  - Autonomous Transaction Processing (ATP)
  - Autonomous Data Warehouse (ADW)

### MySQL 数据库服务

- **存储**: 各 100GB

### NoSQL Database

- **存储**: 25GB
- **请求单位**: 每月 100M

## 🌐 网络资源 (Networking)

### Virtual Cloud Network (VCN)

- **数量**: 无限制
- **带宽**: 入站/出站流量免费
- **地址**:
  - 3 个公有 IP 地址
  - VCN 路由表、安全列表等: 无限制

### Load Balancer

- **数量**: 1 个
- **带宽**: 10Mbps 免费流量

### NAT Gateway

- **数量**: 1 个
- **用途**: 允许私有实例访问互联网

## 📊 监控与分析 (Monitoring)

- **Application Performance Monitoring**: 500M 字节/月
- **Cloud Guard**: 免费启用
- **Events Rules**: 无限制

## 📧 其他服务

- **Email Delivery**: 每月 100 封邮件
- **Outbound Data Transfer**: 10GB/月免费（超过部分按费用计算）

---

## ❌ 你当前遇到的问题

你的账户报告 **"Out of host capacity"** 错误，这意味着：

1. **ca-toronto-1 Region 的 Ampere A1 实例已满** - 该 region 的 4 个免费实例槽位都被占用了
2. 这不是你的配额问题，而是 **该 region 的容量已饱和**

## 🔧 解决方案

### 方案 A: 等待容量释放

```bash
# 稍后重试（可能需要等待几小时或天）
cd /d/projects/deepdive/infra/oci/terraform
terraform apply -auto-approve
```

### 方案 B: 切换到其他 Region

可用的免费 Ampere A1 regions:

- `us-ashburn-1` (Virginia, US)
- `us-phoenix-1` (Phoenix, US)
- `eu-frankfurt-1` (Frankfurt, EU)
- `ap-tokyo-1` (Tokyo, JP)
- 等其他地区

修改文件:

```hcl
# terraform.tfvars
region = "us-ashburn-1"  # 改为其他 region
```

然后执行：

```bash
cd /d/projects/deepdive/infra/oci/terraform
terraform apply -auto-approve
```

### 方案 C: 使用本地 Docker Compose

所有 Docker 镜像已准备好，可在本地完整运行：

```bash
cd /d/projects/deepdive
docker-compose up -d
```

这样可以立即在本地获得完整的 DeepDive Engine 堆栈！

---

## 📈 成本预估 (如果超出免费额度)

| 资源类型       | 免费额度 | 超出部分费用          |
| -------------- | -------- | --------------------- |
| Ampere A1 vCPU | 4 个     | $0.0117 / vCPU / 小时 |
| RAM            | 24GB     | $0.0117 / GB / 小时   |
| Block Storage  | 200GB    | $0.0425 / GB / 月     |
| Object Storage | 20GB     | $0.0255 / GB / 月     |
| 出站带宽       | 10GB/月  | $0.0085 / GB          |

---

## ✅ 建议

鉴于 ca-toronto-1 容量已满，建议：

1. **立即尝试其他 Region**（最快的解决方案）
2. **或使用本地 Docker Compose**（无需云资源）
3. **或等待 OCI 释放容量**（被动方案）
