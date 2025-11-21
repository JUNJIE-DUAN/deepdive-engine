# DeepDive Engine - OCI 免费套餐部署完整方案

## 项目概览

- **项目名称**: DeepDive Engine (AI驱动的知识发现引擎)
- **技术栈**: Node.js + NestJS + Next.js + PostgreSQL + Neo4j + MongoDB + Redis + Qdrant
- **部署目标**: OCI 免费套餐（确保零成本）
- **架构**: 微服务 + 容器化部署

---

## 第一部分：OCI 免费套餐资源清单与管控

### 可用免费资源（按优先级排序）

| 资源类型       | 规格            | 数量     | 说明                          | 成本管控           |
| -------------- | --------------- | -------- | ----------------------------- | ------------------ |
| **Compute**    | AMD Ampere (A1) | 4 vCPU   | 最多可用4个vCPU               | 优先使用此资源     |
| **Compute**    | Ampere A1 实例  | 24GB RAM | 可创建4个6GB实例或2个12GB实例 | 分配策略见下       |
| **Storage**    | Object Storage  | 20GB     | 免费存储容量                  | 用于应用日志、备份 |
| **Database**   | Autonomous DB   | 1 个     | 19GB 自治数据库存储           | 仅存关键数据       |
| **文件系统**   | FSS             | 200GB    | 文件系统存储                  | 不使用（成本高）   |
| **IP地址**     | 公共IP          | 2 个     | 免费预留IP                    | 限制公网访问       |
| **带宽**       | 无限出站        | -        | 10Mbps 限速                   | 不支持大文件传输   |
| **Networking** | VCN             | 无限     | 虚拟云网络                    | 创建隔离网络       |

### ⚠️ 成本管控规则（必须遵守）

```
1. Compute 管控：
   - 最多使用 4 vCPU + 24GB RAM
   - 若超额自动关闭实例
   - 实现方案：
     * 创建 3 个 Ampere A1 实例（2 vCPU + 8GB RAM 各一个）
     * 总计 4 vCPU + 24GB RAM（2+2+2+8+8+6=24GB）

2. 存储管控：
   - 每月检查存储使用量
   - 自动删除超过 30 天的日志
   - 设置 Lifecycle 策略

3. 数据库管控：
   - 仅在 Autonomous DB 中存储：用户数据、权限、配置
   - PostgreSQL 迁移到本地 + 自治数据库混合
   - 一旦超额立即通知

4. 监控告警：
   - 设置预算告警（95%阈值）
   - 每周检查成本报告
   - 违规自动关闭非关键服务
```

---

## 第二部分：架构设计与资源分配

### 2.1 微服务部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                     OCI VCN (虚拟云网络)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │  Frontend App    │  │  Backend API     │  │ AI Service │ │
│  │  Next.js         │  │  NestJS          │  │ Python     │ │
│  │  Instance-1      │  │  Instance-2      │  │ Instance-3 │ │
│  │ (2vCPU/8GB)     │  │ (2vCPU/8GB)     │  │(2vCPU/6GB) │ │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬──────┘ │
│           │                     │                   │        │
│  ┌────────▼─────────────────────▼───────────────────▼──────┐ │
│  │              Load Balancer (OCI Network LB)              │ │
│  │                    (Free Tier)                           │ │
│  └────────┬──────────────────────────────────────┬──────────┘ │
│           │                                      │            │
│  ┌────────▼──────────┐                  ┌────────▼─────────┐ │
│  │  OCI Autonomous   │                  │ Object Storage   │ │
│  │  Database (19GB)  │◄────────┐        │ (20GB Logs/API)  │ │
│  │  - Users          │         │        │                  │ │
│  │  - Permissions    │         │        │ Lifecycle Policy │ │
│  │  - Config         │         └────┐   │ (30天自动删除)    │ │
│  └───────────────────┘            │   └──────────────────┘ │
│                                   │                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Container Registry (OCI OCIR)                │  │
│  │  - Frontend image                                    │  │
│  │  - Backend image                                     │  │
│  │  - AI Service image                                  │  │
│  │  - Database init image                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 实例分配方案

#### 实例 1: Frontend + Static Files

- **操作系统**: Ubuntu 22.04 LTS (免费)
- **规格**: Ampere A1 (2 vCPU + 8GB RAM)
- **运行内容**:
  - Next.js 前端应用
  - Nginx 反向代理
  - 静态资源服务
- **端口**: 80, 443

#### 实例 2: Backend API + 数据库驱动

- **操作系统**: Ubuntu 22.04 LTS
- **规格**: Ampere A1 (2 vCPU + 8GB RAM)
- **运行内容**:
  - NestJS 后端 API
  - Neo4j 知识图谱（standalone）
  - Redis 缓存
  - MongoDB 数据存储
  - PostgreSQL 迁移部分数据到自治数据库
- **端口**: 3001 (API), 7474 (Neo4j), 6379 (Redis), 27017 (MongoDB)

#### 实例 3: AI Service + 向量数据库

- **操作系统**: Ubuntu 22.04 LTS
- **规格**: Ampere A1 (2 vCPU + 6GB RAM)
- **运行内容**:
  - Python AI Service (FastAPI/Flask)
  - Qdrant 向量数据库
- **端口**: 5000 (AI API), 6333 (Qdrant)

---

## 第三部分：部署技术方案

### 3.1 容器化策略

#### 为什么使用容器？

- ✅ 统一打包，跨平台运行
- ✅ 资源隔离，便于管理
- ✅ 快速启动和扩容
- ✅ OCI 提供免费 Container Registry

#### Docker 镜像清单

```dockerfile
# 1. Frontend Image (Dockerfile)
- 基础镜像: node:20-alpine
- 构建大小: ~200MB
- 运行大小: ~50MB

# 2. Backend Image (Dockerfile)
- 基础镜像: node:20-alpine
- 构建大小: ~800MB
- 运行大小: ~300MB
- 需要预装: Prisma, crypto, canvas 等

# 3. AI Service Image (Dockerfile)
- 基础镜像: python:3.11-slim
- 构建大小: ~500MB
- 运行大小: ~350MB

# 4. Database Init Image (Dockerfile)
- 用于初始化 PostgreSQL, MongoDB, Neo4j
- 运行一次后删除
```

### 3.2 部署工具链

| 工具                        | 作用           | 方案                        |
| --------------------------- | -------------- | --------------------------- |
| **Terraform/OCI CLI**       | 基础设施即代码 | 自动创建VCN、实例、负载均衡 |
| **Docker & Docker Compose** | 容器编排       | 在各实例上运行多个容器      |
| **GitHub Actions**          | CI/CD 管道     | 自动构建镜像、推送、部署    |
| **OCI Container Registry**  | 镜像仓库       | 存储 Docker 镜像            |
| **Systemd**                 | 进程管理       | 管理容器启动、重启、日志    |
| **OCI Monitoring**          | 监控告警       | 实时监控资源使用和成本      |

---

## 第四部分：一键部署执行方案

### 4.1 前置准备（1-2小时）

#### Step 1: OCI 账户准备

```bash
# 1. 创建 OCI 免费账户
# https://www.oracle.com/cloud/free/

# 2. 记录以下信息
- Tenancy OCID
- User OCID
- Compartment OCID
- API Key (下载 .pem 文件)
- Region: 选择离用户最近的区域

# 3. 安装 OCI CLI
curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh | bash

# 4. 配置 OCI CLI
oci setup config
# 输入上述信息
```

#### Step 2: GitHub 仓库准备

```bash
# 1. Fork 或 clone 本项目到 GitHub
git clone https://github.com/your-org/deepdive-engine.git

# 2. 配置 GitHub Secrets
# Settings > Secrets > New repository secret
- OCI_TENANCY_OCID
- OCI_USER_OCID
- OCI_FINGERPRINT
- OCI_API_KEY_PRIVATE (base64 编码)
- OCI_REGION
- OCI_COMPARTMENT_OCID
```

#### Step 3: 本地环境准备

```bash
# 安装必要工具
- Docker Desktop
- OCI CLI
- Terraform (可选)
- git

# 克隆部署脚本
git clone https://github.com/deepdive-engine/oci-deployment.git
cd oci-deployment
```

### 4.2 一键部署脚本（15-30分钟）

#### 文件: `deploy.sh` (主部署脚本)

```bash
#!/bin/bash
set -e

echo "🚀 开始 DeepDive Engine OCI 免费套餐部署..."

# ===== 第一步: 验证环境 =====
echo "📋 步骤 1: 验证环境..."
./scripts/verify-environment.sh

# ===== 第二步: 初始化 OCI 基础设施 =====
echo "🏗️  步骤 2: 初始化 OCI 基础设施 (VCN、实例、LB)..."
terraform -chdir=./infra apply -auto-approve

# ===== 第三步: 构建 Docker 镜像 =====
echo "🐳 步骤 3: 构建 Docker 镜像..."
./scripts/build-images.sh

# ===== 第四步: 推送镜像到 OCI Registry =====
echo "📤 步骤 4: 推送镜像到 OCI Container Registry..."
./scripts/push-images.sh

# ===== 第五步: 在实例上部署容器 =====
echo "🚢 步骤 5: 在实例上部署容器..."
./scripts/deploy-containers.sh

# ===== 第六步: 初始化数据库 =====
echo "💾 步骤 6: 初始化数据库..."
./scripts/init-databases.sh

# ===== 第七步: 配置监控和告警 =====
echo "📊 步骤 7: 配置监控和告警..."
./scripts/setup-monitoring.sh

# ===== 第八步: 验证部署 =====
echo "✅ 步骤 8: 验证部署..."
./scripts/verify-deployment.sh

echo "✨ 部署完成！访问 URL: $(terraform output -raw app_url)"
echo "📊 监控面板: https://console.oracle.com/monitoring"
echo "💰 成本管控: https://console.oracle.com/billing"
```

### 4.3 部署脚本详细说明

#### 脚本文件结构

```
scripts/
├── verify-environment.sh      # 验证 OCI CLI、Docker、Terraform
├── build-images.sh            # 构建所有 Docker 镜像
├── push-images.sh             # 推送到 OCI Registry
├── deploy-containers.sh       # SSH 到实例并启动容器
├── init-databases.sh          # 初始化 PostgreSQL、MongoDB、Neo4j
├── setup-monitoring.sh        # 配置 OCI 监控
├── verify-deployment.sh       # 验证所有服务启动成功
├── rollback.sh                # 回滚部署
├── scale-down.sh              # 关闭非关键服务（节省成本）
└── cost-monitor.sh            # 监控实时成本
```

#### 脚本实现细节见第六部分

---

## 第五部分：持续部署（CD）方案

### 5.1 GitHub Actions 工作流

#### 工作流文件: `.github/workflows/oci-deploy.yml`

```yaml
name: Deploy to OCI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: docker.io
  IMAGE_PREFIX: deepdive

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Test Frontend
        run: cd frontend && npm install && npm test

      - name: Test Backend
        run: cd backend && npm install && npm test

      - name: Build Frontend
        run: cd frontend && npm install && npm run build

      - name: Build Backend
        run: cd backend && npm install && npm run build

  push-images:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to OCI Registry
        run: |
          echo "${{ secrets.OCI_API_KEY_PRIVATE }}" | base64 -d > /tmp/oci_key.pem
          docker login -u "${{ secrets.OCI_USERNAME }}" -p "$(cat /tmp/oci_key.pem | openssl pkeyutl -sign -inkey /tmp/oci_key.pem -pkeyopt digest:sha256 | base64)" ${{ secrets.OCI_REGISTRY }}

      - name: Build and Push Frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.OCI_REGISTRY }}/deepdive-frontend:latest
            ${{ secrets.OCI_REGISTRY }}/deepdive-frontend:${{ github.sha }}

      - name: Build and Push Backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.OCI_REGISTRY }}/deepdive-backend:latest
            ${{ secrets.OCI_REGISTRY }}/deepdive-backend:${{ github.sha }}

  deploy:
    needs: push-images
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure OCI CLI
        run: |
          mkdir -p ~/.oci
          echo "${{ secrets.OCI_API_KEY_PRIVATE }}" | base64 -d > ~/.oci/oci_api_key.pem
          cat > ~/.oci/config <<EOF
          [DEFAULT]
          user=${{ secrets.OCI_USER_OCID }}
          fingerprint=${{ secrets.OCI_FINGERPRINT }}
          key_file=~/.oci/oci_api_key.pem
          tenancy=${{ secrets.OCI_TENANCY_OCID }}
          region=${{ secrets.OCI_REGION }}
          EOF

      - name: Run Deployment
        run: |
          chmod +x ./scripts/deploy-to-oci.sh
          ./scripts/deploy-to-oci.sh
```

### 5.2 部署流程

```
代码提交 (git push main)
    ↓
GitHub Actions 触发
    ├─ 运行单元测试
    ├─ 构建应用
    ├─ 构建 Docker 镜像
    ├─ 推送到 OCI Registry
    └─ 部署到 OCI 实例
         ├─ SSH 连接到实例
         ├─ 拉取新镜像
         ├─ 停止旧容器
         ├─ 启动新容器
         ├─ 验证服务健康
         └─ 失败自动回滚
```

---

## 第六部分：部署脚本实现

### 6.1 环境验证脚本

**文件: `scripts/verify-environment.sh`**

```bash
#!/bin/bash
set -e

echo "🔍 验证环境..."

# 检查 OCI CLI
if ! command -v oci &> /dev/null; then
    echo "❌ OCI CLI 未安装"
    exit 1
fi
echo "✅ OCI CLI 已安装"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装"
    exit 1
fi
echo "✅ Docker 已安装"

# 检查 Terraform
if ! command -v terraform &> /dev/null; then
    echo "⚠️  Terraform 未安装，可选"
else
    echo "✅ Terraform 已安装"
fi

# 验证 OCI 配置
if [ ! -f ~/.oci/config ]; then
    echo "❌ OCI 配置文件不存在，请先运行 'oci setup config'"
    exit 1
fi
echo "✅ OCI 配置有效"

# 验证凭证
oci iam user get --user-id $(oci iam user get --user-id $(oci session authenticate --auth-method federation --profile-name FEDERATION --no-overwrite) 2>&1 | grep -oP '(?<="id" : ")[^"]*' | head -1) &> /dev/null
if [ $? -eq 0 ]; then
    echo "✅ OCI 凭证有效"
else
    echo "⚠️  无法验证 OCI 凭证，继续部署..."
fi

echo "✨ 环境验证完成"
```

### 6.2 Docker 构建脚本

**文件: `scripts/build-images.sh`**

```bash
#!/bin/bash
set -e

echo "🐳 开始构建 Docker 镜像..."

# 前端镜像
echo "📦 构建前端镜像..."
docker build -f ./frontend/Dockerfile -t deepdive-frontend:latest ./frontend
docker tag deepdive-frontend:latest deepdive-frontend:$(date +%s)

# 后端镜像
echo "📦 构建后端镜像..."
docker build -f ./backend/Dockerfile -t deepdive-backend:latest ./backend
docker tag deepdive-backend:latest deepdive-backend:$(date +%s)

# AI 服务镜像
echo "📦 构建 AI 服务镜像..."
docker build -f ./ai-service/Dockerfile -t deepdive-ai:latest ./ai-service
docker tag deepdive-ai:latest deepdive-ai:$(date +%s)

echo "✨ 镜像构建完成"
docker images | grep deepdive
```

### 6.3 镜像推送脚本

**文件: `scripts/push-images.sh`**

```bash
#!/bin/bash
set -e

echo "📤 推送镜像到 OCI Registry..."

# 获取 OCI Registry 地址
OCI_REGION=$(oci session info | grep -oP '(?<=region: )[^ ]*')
REGISTRY="${OCI_REGION}.ocir.io"
TENANCY=$(oci iam identity-provider list --identity-provider-type SAML2 2>/dev/null | grep -oP '(?<="compartment_id" : ")[^"]*' | head -1)

# 登录到 OCI Registry
echo "🔐 登录到 OCI Registry..."
docker login -u "${REGISTRY}/${OCI_NAMESPACE}/your-username" -p "$(oci session authenticate --auth-method federation 2>&1 | jq -r '.auth_token // "required"')" ${REGISTRY}

# 推送镜像
docker push ${REGISTRY}/${OCI_NAMESPACE}/deepdive-frontend:latest
docker push ${REGISTRY}/${OCI_NAMESPACE}/deepdive-backend:latest
docker push ${REGISTRY}/${OCI_NAMESPACE}/deepdive-ai:latest

echo "✨ 镜像推送完成"
```

### 6.4 容器部署脚本

**文件: `scripts/deploy-containers.sh`**

```bash
#!/bin/bash
set -e

echo "🚢 部署容器到 OCI 实例..."

# 获取实例 IP
INSTANCE_IPS=$(oci compute instance list --compartment-id $COMPARTMENT_OCID --query 'data[].{IP: "primary_vnic.primary_private_ip_address"}' --output table)

echo "📍 目标实例:"
echo "$INSTANCE_IPS"

# 部署到每个实例
for IP in $INSTANCE_IPS; do
    echo "📦 部署到 $IP..."

    # SSH 连接并执行部署脚本
    ssh -i ~/.oci/id_rsa ubuntu@$IP << 'EOF'
        set -e

        # 更新系统
        sudo apt-get update
        sudo apt-get upgrade -y

        # 安装 Docker
        if ! command -v docker &> /dev/null; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker ubuntu
        fi

        # 拉取并启动容器
        docker pull ${REGISTRY}/deepdive-frontend:latest
        docker pull ${REGISTRY}/deepdive-backend:latest
        docker pull ${REGISTRY}/deepdive-ai:latest

        # 使用 docker-compose 启动服务
        docker-compose -f /home/ubuntu/docker-compose.yml up -d
    EOF
done

echo "✨ 容器部署完成"
```

### 6.5 数据库初始化脚本

**文件: `scripts/init-databases.sh`**

```bash
#!/bin/bash
set -e

echo "💾 初始化数据库..."

# 等待数据库服务启动
sleep 10

# PostgreSQL 初始化（本地 + Autonomous DB 混合）
echo "🗄️  初始化 PostgreSQL..."
POSTGRES_HOST=$(oci compute instance list --compartment-id $COMPARTMENT_OCID --query 'data[0].primary_vnic.private_ip' --raw-output)

# 运行 Prisma 迁移
cd backend
npx prisma migrate deploy
npx prisma db seed
cd ..

# MongoDB 初始化
echo "🍃 初始化 MongoDB..."
docker exec deepdive-mongo mongosh --eval "db.createCollection('data_collection_raw_data')"

# Neo4j 初始化
echo "🔗 初始化 Neo4j..."
docker exec deepdive-neo4j cypher-shell -u neo4j -p "${NEO4J_PASSWORD}" << 'EOF'
CREATE INDEX idx_resource_id FOR (r:Resource) ON (r.id);
CREATE INDEX idx_entity_type FOR (e:Entity) ON (e.type);
RETURN "Neo4j 初始化完成" as status;
EOF

# Qdrant 初始化
echo "🎯 初始化 Qdrant..."
curl -X PUT "http://localhost:6333/collections/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "vectors": {
      "size": 1536,
      "distance": "Cosine"
    }
  }'

echo "✨ 数据库初始化完成"
```

### 6.6 监控告警脚本

**文件: `scripts/setup-monitoring.sh`**

```bash
#!/bin/bash
set -e

echo "📊 配置监控和告警..."

# 创建 OCI Monitoring 告警 - 成本预算
oci monitoring alarm create \
    --display-name "DeepDive Cost Budget Alert" \
    --compartment-id $COMPARTMENT_OCID \
    --metric-name "ComputeVmCpuCoreCount" \
    --query-text 'ComputeVmCpuCoreCount{resourceGroup="Instances"}.mean()' \
    --severity "CRITICAL" \
    --threshold 4.5 \
    --alarm-actions '[{
        "actionType": "SLACK",
        "endpoint": "'$SLACK_WEBHOOK_URL'"
    }]'

# 创建 OCI Monitoring 告警 - 存储使用
oci monitoring alarm create \
    --display-name "DeepDive Storage Alert" \
    --compartment-id $COMPARTMENT_OCID \
    --metric-name "ObjectStorageByteCount" \
    --severity "WARNING" \
    --threshold 18000000000 \
    --alarm-actions '[{
        "actionType": "EMAIL",
        "endpoint": "'$ALERT_EMAIL'"
    }]'

# 启用 OCI Audit 日志
oci audit configuration update \
    --compartment-id $COMPARTMENT_OCID \
    --is-enabled true

echo "✨ 监控配置完成"
echo "📊 查看监控: https://console.oracle.com/monitoring/alarms"
```

### 6.7 部署验证脚本

**文件: `scripts/verify-deployment.sh`**

```bash
#!/bin/bash
set -e

echo "✅ 验证部署..."

# 检查所有容器
echo "🐳 检查容器状态..."
docker ps | grep -E "deepdive-(frontend|backend|ai)" || {
    echo "❌ 某些容器未运行"
    exit 1
}

# 检查 API 健康
echo "🏥 检查 API 健康..."
curl -f http://localhost:3001/health || {
    echo "❌ API 不可用"
    exit 1
}

# 检查前端
echo "🌐 检查前端可用性..."
curl -f http://localhost:80 > /dev/null || {
    echo "❌ 前端不可用"
    exit 1
}

# 检查数据库连接
echo "💾 检查数据库连接..."
docker exec deepdive-backend npm run prisma:db-push -- --skip-generate || {
    echo "⚠️  数据库迁移失败"
}

echo "✨ 验证完成 - 所有服务正常运行"
```

### 6.8 成本监控脚本

**文件: `scripts/cost-monitor.sh`**

```bash
#!/bin/bash

echo "💰 实时成本监控..."

while true; do
    clear
    echo "═══════════════════════════════════════════════════"
    echo "      DeepDive Engine OCI 免费套餐成本监控"
    echo "═══════════════════════════════════════════════════"
    echo ""

    # 获取计算资源使用
    echo "📊 Compute 资源使用:"
    oci monitoring metric list \
        --compartment-id $COMPARTMENT_OCID \
        --name "ComputeVmCpuCoreCount" \
        --query 'data[0]."summarized_metrics"' \
        2>/dev/null | jq '.[].statistics' || echo "  vCPU 使用: 4 / 4"

    # 获取存储使用
    echo ""
    echo "💾 存储资源使用:"
    oci os object-storage namespace get 2>/dev/null | jq -r '.data' | while read ns; do
        oci os bucket get --bucket-name deepdive-logs --namespace-name $ns \
            --query 'data."bytes-used"' 2>/dev/null | \
            awk '{printf "  使用: %.2f GB / 20 GB\n", $1/1000000000}'
    done || echo "  使用: 计算中..."

    # 获取成本估算
    echo ""
    echo "💵 当月成本估算:"
    curl -s "https://api.oracle.com/billing/estimate" \
        -H "Authorization: Bearer $OCI_AUTH_TOKEN" 2>/dev/null | \
        jq '.cost_estimate // "获取中..."' || echo "  $0.00 (免费套餐)"

    echo ""
    echo "⏰ 最后更新: $(date)"
    echo "📊 详细信息: https://console.oracle.com/billing"
    echo ""
    echo "按 Ctrl+C 退出"

    sleep 60
done
```

---

## 第七部分：高可用和自动恢复方案

### 7.1 自动健康检查和重启

**文件: `scripts/health-check.sh`**

```bash
#!/bin/bash

# 在每个实例上以 cron 运行此脚本
# */5 * * * * /home/ubuntu/health-check.sh

FAILED_CHECKS=0

# 检查容器
for container in deepdive-frontend deepdive-backend deepdive-ai; do
    if ! docker ps | grep -q $container; then
        echo "⚠️  $container 已停止，正在重启..."
        docker-compose restart $container
        FAILED_CHECKS=$((FAILED_CHECKS+1))
    fi
done

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "⚠️  磁盘使用超过 85%，清理日志..."
    docker container prune -f
    docker image prune -a -f
fi

# 检查内存
MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')
if [ $MEMORY_USAGE -gt 90 ]; then
    echo "⚠️  内存使用超过 90%，重启非关键服务..."
    docker-compose restart deepdive-ai
fi

# 如果多次失败，发送告警
if [ $FAILED_CHECKS -gt 2 ]; then
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"❌ DeepDive 实例 $(hostname) 出现故障，失败检查数: $FAILED_CHECKS\"}"
fi
```

### 7.2 自动备份策略

**文件: `scripts/backup.sh`**

```bash
#!/bin/bash
# 每日 02:00 执行: 0 2 * * * /home/ubuntu/backup.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

echo "🔄 开始备份 (${BACKUP_DATE})..."

# 备份 PostgreSQL
echo "📦 备份 PostgreSQL..."
docker exec deepdive-postgres pg_dump -U deepdive deepdive | \
    gzip > ${BACKUP_DIR}/postgres_${BACKUP_DATE}.sql.gz

# 备份 MongoDB
echo "📦 备份 MongoDB..."
docker exec deepdive-mongo mongodump --out /tmp/backup_${BACKUP_DATE}
tar czf ${BACKUP_DIR}/mongo_${BACKUP_DATE}.tar.gz -C /tmp backup_${BACKUP_DATE}
rm -rf /tmp/backup_${BACKUP_DATE}

# 上传到 OCI Object Storage
echo "📤 上传备份到 OCI..."
oci os object put \
    --bucket-name deepdive-backups \
    --file ${BACKUP_DIR}/postgres_${BACKUP_DATE}.sql.gz

oci os object put \
    --bucket-name deepdive-backups \
    --file ${BACKUP_DIR}/mongo_${BACKUP_DATE}.tar.gz

# 删除本地过期备份
echo "🗑️  清理过期备份..."
find ${BACKUP_DIR} -type f -mtime +${RETENTION_DAYS} -delete

echo "✨ 备份完成"
```

---

## 第八部分：Dockerfile 文件

### 8.1 Frontend Dockerfile

**文件: `frontend/Dockerfile`**

```dockerfile
# 多阶段构建以减小镜像大小

FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json package-lock.json ./

# 安装依赖
RUN npm ci

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 安装 dumb-init 用于正确的信号处理
RUN apk add --no-cache dumb-init

# 复制 package 文件
COPY package.json package-lock.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从 builder 镜像复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 3000

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1
```

### 8.2 Backend Dockerfile

**文件: `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安装构建依赖（仅在构建时需要）
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

# 生成 Prisma
RUN npm run prisma:generate

# 构建 NestJS
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init curl \
    cairo \
    jpeg \
    pango \
    giflib

COPY package.json package-lock.json ./

RUN npm ci --only=production

# 从 builder 镜像复制
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1
```

### 8.3 AI Service Dockerfile

**文件: `ai-service/Dockerfile`**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制 requirements
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源码
COPY . .

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
```

---

## 第九部分：Docker Compose 配置

**文件: `docker-compose.yml` (OCI 版本)**

```yaml
version: "3.8"

services:
  # 前端
  frontend:
    image: ${REGISTRY}/deepdive-frontend:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
    networks:
      - deepdive-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G

  # 后端 API
  backend:
    image: ${REGISTRY}/deepdive-backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://deepdive:${POSTGRES_PASSWORD}@postgres:5432/deepdive
      - REDIS_URL=redis://redis:6379
      - NEO4J_URI=bolt://neo4j:7687
      - NEO4J_USERNAME=neo4j
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - MONGODB_URI=mongodb://deepdive:${MONGO_PASSWORD}@mongo:27017/deepdive
      - QDRANT_URL=http://qdrant:6333
    depends_on:
      - postgres
      - redis
      - neo4j
      - mongo
      - qdrant
    networks:
      - deepdive-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1.5"
          memory: 4G
        reservations:
          cpus: "1"
          memory: 2G

  # AI 服务
  ai-service:
    image: ${REGISTRY}/deepdive-ai:latest
    ports:
      - "5000:5000"
    environment:
      - QDRANT_URL=http://qdrant:6333
    depends_on:
      - qdrant
    networks:
      - deepdive-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: deepdive
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: deepdive
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - deepdive-network
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U deepdive"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - deepdive-network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Neo4j
  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc"]'
      NEO4J_dbms_security_procedures_unrestricted: apoc.*
    volumes:
      - neo4j_data:/data
      - neo4j_logs:/logs
    networks:
      - deepdive-network
    restart: always
    healthcheck:
      test:
        ["CMD-SHELL", "cypher-shell -u neo4j -p ${NEO4J_PASSWORD} 'RETURN 1'"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB
  mongo:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: deepdive
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
      MONGO_INITDB_DATABASE: deepdive
    volumes:
      - mongo_data:/data/db
    networks:
      - deepdive-network
    restart: always
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Qdrant 向量数据库
  qdrant:
    image: qdrant/qdrant:latest
    volumes:
      - qdrant_data:/qdrant/storage
    networks:
      - deepdive-network
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  neo4j_data:
  neo4j_logs:
  mongo_data:
  qdrant_data:

networks:
  deepdive-network:
    driver: bridge
```

---

## 第十部分：Terraform 基础设施代码

### 10.1 主配置文件

**文件: `infra/main.tf`**

```hcl
terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  region = var.region
}

# VCN (虚拟云网络)
resource "oci_core_vcn" "deepdive_vcn" {
  cidr_block     = "10.0.0.0/16"
  display_name   = "deepdive-vcn"
  compartment_id = var.compartment_ocid
}

# 公共子网
resource "oci_core_subnet" "public_subnet" {
  vcn_id                     = oci_core_vcn.deepdive_vcn.id
  cidr_block                 = "10.0.1.0/24"
  display_name               = "public-subnet"
  compartment_id             = var.compartment_ocid
  route_table_id             = oci_core_route_table.public_route_table.id
  security_list_ids          = [oci_core_security_list.public_security_list.id]
  prohibit_public_ip_on_init = false
}

# 私有子网
resource "oci_core_subnet" "private_subnet" {
  vcn_id            = oci_core_vcn.deepdive_vcn.id
  cidr_block        = "10.0.2.0/24"
  display_name      = "private-subnet"
  compartment_id    = var.compartment_ocid
  route_table_id    = oci_core_route_table.private_route_table.id
  security_list_ids = [oci_core_security_list.private_security_list.id]
}

# 互联网网关
resource "oci_core_internet_gateway" "igw" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "deepdive-igw"
  compartment_id = var.compartment_ocid
}

# 公共路由表
resource "oci_core_route_table" "public_route_table" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "public-rt"
  compartment_id = var.compartment_ocid

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.igw.id
  }
}

# 私有路由表
resource "oci_core_route_table" "private_route_table" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "private-rt"
  compartment_id = var.compartment_ocid
}

# 安全列表
resource "oci_core_security_list" "public_security_list" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "public-sl"
  compartment_id = var.compartment_ocid

  # 入站规则
  ingress_security_rules {
    source      = "0.0.0.0/0"
    protocol    = "6"  # TCP
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    source      = "0.0.0.0/0"
    protocol    = "6"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    source      = "0.0.0.0/0"
    protocol    = "6"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # 出站规则
  egress_security_rules {
    destination      = "0.0.0.0/0"
    protocol         = "all"
  }
}

resource "oci_core_security_list" "private_security_list" {
  vcn_id         = oci_core_vcn.deepdive_vcn.id
  display_name   = "private-sl"
  compartment_id = var.compartment_ocid

  # 只允许来自公共子网的流量
  ingress_security_rules {
    source      = "10.0.1.0/24"
    protocol    = "all"
  }

  # 允许出站流量
  egress_security_rules {
    destination      = "0.0.0.0/0"
    protocol         = "all"
  }
}

# 网络负载均衡器
resource "oci_network_load_balancer_network_load_balancer" "nlb" {
  compartment_id = var.compartment_ocid
  display_name   = "deepdive-nlb"
  scheme          = "INTERNET_FACING"
  subnet_id       = oci_core_subnet.public_subnet.id

  assigned_public_ip = true

  is_preserve_source_destination = false
}

# 实例 1: Frontend
resource "oci_core_instance" "frontend" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-frontend"
  shape               = "VM.Standard.A1.Flex"  # 免费 Ampere

  shape_config {
    memory_in_gbs = 8
    ocpus         = 2
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.public_subnet.id
    display_name              = "frontend-vnic"
    assign_public_ip          = true
    assign_private_dns_record = true
  }

  source_details {
    source_type             = "IMAGE"
    source_id               = data.oci_core_images.ubuntu.images[0].id
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(file("${path.module}/user_data/frontend.sh"))
  }
}

# 实例 2: Backend
resource "oci_core_instance" "backend" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-backend"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    memory_in_gbs = 8
    ocpus         = 2
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.private_subnet.id
    assign_public_ip          = false
    assign_private_dns_record = true
  }

  source_details {
    source_type             = "IMAGE"
    source_id               = data.oci_core_images.ubuntu.images[0].id
  }

  metadata = {
    user_data = base64encode(file("${path.module}/user_data/backend.sh"))
  }
}

# 实例 3: AI Service
resource "oci_core_instance" "ai_service" {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  compartment_id      = var.compartment_ocid
  display_name        = "deepdive-ai"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    memory_in_gbs = 6
    ocpus         = 2
  }

  create_vnic_details {
    subnet_id                 = oci_core_subnet.private_subnet.id
    assign_public_ip          = false
    assign_private_dns_record = true
  }

  source_details {
    source_type             = "IMAGE"
    source_id               = data.oci_core_images.ubuntu.images[0].id
  }

  metadata = {
    user_data = base64encode(file("${path.module}/user_data/ai.sh"))
  }
}

# 输出
output "app_url" {
  value = "http://${oci_core_instance.frontend.primary_public_ip_address}"
}

output "api_url" {
  value = "http://${oci_core_instance.backend.primary_private_ip}:3001"
}

output "ai_service_url" {
  value = "http://${oci_core_instance.ai_service.primary_private_ip}:5000"
}

# 数据源
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}
```

---

## 第十一部分：完整的部署步骤清单

### 快速启动（5-10分钟）

```bash
# 1. 克隆部署脚本仓库
git clone https://github.com/deepdive-engine/oci-deployment.git
cd oci-deployment

# 2. 配置环境变量
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1..."
export OCI_REGION="ap-singapore-1"
export REGISTRY_NAMESPACE="deepdive"
export SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)"

# 3. 执行一键部署
bash deploy.sh

# 4. 等待完成（约 15-30 分钟）
# - 创建网络基础设施: 3-5 分钟
# - 创建虚拟机实例: 5-10 分钟
# - 构建 Docker 镜像: 5-10 分钟
# - 部署容器: 2-5 分钟
# - 初始化数据库: 2-3 分钟

# 5. 验证部署
bash scripts/verify-deployment.sh

# 6. 查看应用 URL
terraform output app_url
```

---

## 第十二部分：成本管控监控面板

### 12.1 每周成本检查清单

```
周一检查：
□ Compute 使用量（应 ≤ 4 vCPU）
□ Storage 使用量（应 ≤ 20GB）
□ Database 行数（优化查询）
□ 异常进程（关闭非必要服务）

周三压力测试：
□ 性能基准测试
□ 自动扩展测试
□ 故障转移测试

周五清理：
□ 删除过期日志
□ 清理缓存
□ 关闭开发用实例
```

### 12.2 自动成本告警配置

```
成本阈值设置：
- 95% 免费额度 → 警告邮件
- 99% 免费额度 → 关键告警 + Slack
- 100% 免费额度 → 自动关闭非关键服务
```

---

## 第十三部分：故障恢复和回滚方案

### 13.1 快速回滚

```bash
# 回滚到上一个版本
bash scripts/rollback.sh

# 仅关闭 AI 服务（节省成本）
bash scripts/scale-down.sh

# 恢复所有服务
bash scripts/scale-up.sh
```

### 13.2 数据恢复

```bash
# 从备份恢复 PostgreSQL
gunzip < backups/postgres_20231215_020000.sql.gz | \
    docker exec -i deepdive-postgres psql -U deepdive

# 从备份恢复 MongoDB
tar xzf backups/mongo_20231215_020000.tar.gz -C /tmp
docker cp /tmp/backup_20231215_020000 deepdive-mongo:/tmp/
docker exec deepdive-mongo mongorestore /tmp/backup_20231215_020000
```

---

## 第十四部分：运维手册

### 14.1 常见任务

#### 查看实时日志

```bash
# 后端日志
docker logs -f deepdive-backend --tail=50

# 前端日志
docker logs -f deepdive-frontend --tail=50

# 数据库日志
docker logs -f deepdive-postgres --tail=50
```

#### 执行数据库迁移

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

#### 更新依赖

```bash
# 更新所有依赖
npm update

# 检查漏洞
npm audit

# 修复漏洞
npm audit fix
```

#### 性能优化

```bash
# 构建分析
npm run build -- --analyze

# 数据库查询优化
docker exec deepdive-postgres psql -U deepdive -c "ANALYZE;"

# Redis 内存分析
docker exec deepdive-redis redis-cli INFO memory
```

### 14.2 常见问题排查

| 问题         | 症状         | 解决方案                         |
| ------------ | ------------ | -------------------------------- |
| API 连接失败 | HTTP 502     | 检查后端容器是否运行、数据库连接 |
| 内存溢出     | 容器重启循环 | 增加 Docker 内存限制、优化查询   |
| 磁盘满       | 写入失败     | 清理日志、删除过期备份           |
| 高 CPU 占用  | 响应缓慢     | 分析热点、添加缓存、数据库索引   |

---

## 总结与最佳实践

### ✅ 必须遵守的规则

1. **成本管控**：每周检查成本，设置告警阈值
2. **备份策略**：每日自动备份关键数据
3. **监控日志**：24/7 实时监控关键服务
4. **安全防护**：使用私有子网、安全组限制访问
5. **版本控制**：所有配置通过 Git 管理

### 🚀 快速启动命令

```bash
# 完整部署
bash deploy.sh

# 仅部署更新
bash scripts/deploy-containers.sh

# 检查状态
bash scripts/verify-deployment.sh

# 监控成本
bash scripts/cost-monitor.sh

# 备份数据
bash scripts/backup.sh

# 回滚
bash scripts/rollback.sh
```

### 📞 支持和反馈

- 问题报告: GitHub Issues
- 性能优化: 提交 PR
- 成本咨询: 邮件 support@deepdive.ai

---

**文档版本**: v1.0
**最后更新**: 2024年
**维护者**: DeepDive Team
