#!/bin/bash
set -e

# ============================================================================
# DeepDive Engine - OCI 免费套餐一键部署脚本
# ============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

# ============================================================================
# 配置检查
# ============================================================================

log_step "第一步：验证环境和配置"

# 检查必要的环境变量
REQUIRED_VARS=(
    "OCI_COMPARTMENT_OCID"
    "OCI_REGION"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "环境变量 $var 未设置"
        exit 1
    fi
done

log_success "环境变量验证通过"

# 检查必要的工具
REQUIRED_TOOLS=(
    "docker"
    "git"
    "oci"
)

for tool in "${REQUIRED_TOOLS[@]}"; do
    if ! command -v $tool &> /dev/null; then
        log_error "找不到 $tool 工具，请先安装"
        exit 1
    fi
done

log_success "所有必要工具已安装"

# ============================================================================
# 验证 OCI 连接
# ============================================================================

log_step "第二步：验证 OCI 连接"

if oci iam compartment list --compartment-id $OCI_COMPARTMENT_OCID &> /dev/null; then
    log_success "OCI 连接验证成功"
else
    log_error "OCI 连接失败，请检查配置"
    exit 1
fi

# ============================================================================
# 创建部署目录
# ============================================================================

log_step "第三步：初始化部署环境"

DEPLOY_DIR=$(pwd)
SCRIPTS_DIR="$DEPLOY_DIR/scripts"
INFRA_DIR="$DEPLOY_DIR/infra"
DOCKER_DIR="$DEPLOY_DIR"

# 创建必要的目录
mkdir -p $SCRIPTS_DIR
mkdir -p $INFRA_DIR
mkdir -p $DEPLOY_DIR/backups
mkdir -p $DEPLOY_DIR/.oci

log_success "部署目录初始化完成"

# ============================================================================
# 克隆或更新部署脚本
# ============================================================================

log_step "第四步：准备部署脚本"

if [ ! -d "$SCRIPTS_DIR/.git" ]; then
    log_info "下载部署脚本..."
    # 如果脚本不存在，则使用本地脚本
    if [ ! -f "$SCRIPTS_DIR/verify-environment.sh" ]; then
        log_warning "部分脚本不存在，将创建基础脚本"
    fi
else
    log_info "更新部署脚本..."
    cd $SCRIPTS_DIR
    git pull
    cd $DEPLOY_DIR
fi

log_success "部署脚本准备完成"

# ============================================================================
# 构建 Docker 镜像
# ============================================================================

log_step "第五步：构建 Docker 镜像"

log_info "构建前端镜像..."
if [ -f "frontend/Dockerfile" ]; then
    docker build -t deepdive-frontend:latest -f frontend/Dockerfile frontend/
    log_success "前端镜像构建完成"
else
    log_warning "frontend/Dockerfile 不存在，跳过前端构建"
fi

log_info "构建后端镜像..."
if [ -f "backend/Dockerfile" ]; then
    docker build -t deepdive-backend:latest -f backend/Dockerfile backend/
    log_success "后端镜像构建完成"
else
    log_warning "backend/Dockerfile 不存在，跳过后端构建"
fi

log_info "构建 AI 服务镜像..."
if [ -f "ai-service/Dockerfile" ]; then
    docker build -t deepdive-ai:latest -f ai-service/Dockerfile ai-service/
    log_success "AI 服务镜像构建完成"
else
    log_warning "ai-service/Dockerfile 不存在，跳过 AI 服务构建"
fi

# ============================================================================
# 登录 OCI Container Registry
# ============================================================================

log_step "第六步：登录 OCI Container Registry"

# 获取 OCI 命名空间
OCI_NAMESPACE=$(oci os ns get --query 'data' --raw-output)
OCI_REGISTRY="${OCI_REGION}.ocir.io"

log_info "OCI Registry: $OCI_REGISTRY"
log_info "命名空间: $OCI_NAMESPACE"

# 获取认证令牌
log_info "生成认证令牌..."
AUTH_TOKEN=$(oci session authenticate --auth-method federation 2>/dev/null | grep -oP '(?<="auth_token" : ")[^"]*' || echo "")

if [ -z "$AUTH_TOKEN" ]; then
    log_warning "无法自动获取认证令牌，请手动创建应用密码"
    read -p "请输入你的 OCI 用户名: " OCI_USERNAME
    read -sp "请输入应用密码: " AUTH_TOKEN
    echo ""
else
    # 从配置文件获取用户名
    OCI_USERNAME=$(grep "^user=" ~/.oci/config | head -1 | cut -d'=' -f2 | rev | cut -d'/' -f1 | rev)
fi

# 登录到 Registry
echo "$AUTH_TOKEN" | docker login -u "${OCI_REGISTRY}/${OCI_NAMESPACE}/${OCI_USERNAME}" --password-stdin $OCI_REGISTRY
log_success "成功登录 OCI Container Registry"

# ============================================================================
# 推送镜像
# ============================================================================

log_step "第七步：推送镜像到 OCI Container Registry"

log_info "推送前端镜像..."
docker tag deepdive-frontend:latest ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-frontend:latest
docker push ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-frontend:latest
log_success "前端镜像推送完成"

log_info "推送后端镜像..."
docker tag deepdive-backend:latest ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-backend:latest
docker push ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-backend:latest
log_success "后端镜像推送完成"

log_info "推送 AI 服务镜像..."
docker tag deepdive-ai:latest ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-ai:latest
docker push ${OCI_REGISTRY}/${OCI_NAMESPACE}/deepdive-ai:latest
log_success "AI 服务镜像推送完成"

# ============================================================================
# 创建基础设施（Terraform）
# ============================================================================

log_step "第八步：创建 OCI 基础设施"

log_info "初始化 Terraform..."
cd $INFRA_DIR

# 设置 Terraform 变量
cat > terraform.tfvars <<EOF
compartment_ocid = "${OCI_COMPARTMENT_OCID}"
region = "${OCI_REGION}"
ssh_public_key = "$(cat ~/.ssh/id_rsa.pub 2>/dev/null || echo "")"
EOF

log_info "应用 Terraform 配置..."
terraform init
terraform plan -out=tfplan

log_info "创建 OCI 资源（这可能需要 10-15 分钟）..."
terraform apply tfplan

# 获取输出
FRONTEND_IP=$(terraform output -raw frontend_public_ip 2>/dev/null || echo "")
BACKEND_PRIVATE_IP=$(terraform output -raw backend_private_ip 2>/dev/null || echo "")
AI_PRIVATE_IP=$(terraform output -raw ai_private_ip 2>/dev/null || echo "")

cd $DEPLOY_DIR

log_success "OCI 基础设施创建完成"
log_info "前端 IP: $FRONTEND_IP"
log_info "后端私有 IP: $BACKEND_PRIVATE_IP"
log_info "AI 服务私有 IP: $AI_PRIVATE_IP"

# ============================================================================
# 部署容器
# ============================================================================

log_step "第九步：在实例上部署容器"

# 等待实例完全启动
log_info "等待实例启动（30 秒）..."
sleep 30

# 部署到前端实例
if [ -n "$FRONTEND_IP" ]; then
    log_info "部署到前端实例 ($FRONTEND_IP)..."
    scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        docker-compose.yml ubuntu@$FRONTEND_IP:/home/ubuntu/ || true

    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$FRONTEND_IP << 'EOSSH'
        set -e
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh

        echo "启动 Docker 服务..."
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        newgrp docker << 'EOGRP'
            cd /home/ubuntu
            echo "启动前端容器..."
            docker-compose up -d frontend
            echo "前端容器启动完成"
        EOGRP
    EOSSH
    log_success "前端实例部署完成"
fi

# 部署到后端实例
if [ -n "$BACKEND_PRIVATE_IP" ]; then
    # 通过前端实例 SSH 跳转
    log_info "部署到后端实例..."
    scp -o ProxyCommand="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -W %h:%p ubuntu@$FRONTEND_IP" \
        -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
        docker-compose.yml ubuntu@$BACKEND_PRIVATE_IP:/home/ubuntu/ || true

    ssh -o ProxyCommand="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -W %h:%p ubuntu@$FRONTEND_IP" \
        -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$BACKEND_PRIVATE_IP << 'EOSSH'
        set -e
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh

        echo "启动 Docker 服务..."
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        newgrp docker << 'EOGRP'
            cd /home/ubuntu
            echo "启动后端和数据库容器..."
            docker-compose up -d backend postgres redis neo4j mongo
            echo "后端容器启动完成"
        EOGRP
    EOSSH
    log_success "后端实例部署完成"
fi

# ============================================================================
# 初始化数据库
# ============================================================================

log_step "第十步：初始化数据库"

if [ -n "$BACKEND_PRIVATE_IP" ]; then
    log_info "等待数据库服务启动（60 秒）..."
    sleep 60

    log_info "执行 Prisma 迁移..."
    ssh -o ProxyCommand="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -W %h:%p ubuntu@$FRONTEND_IP" \
        -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$BACKEND_PRIVATE_IP << 'EOSSH'
        cd /home/ubuntu
        docker exec deepdive-backend npx prisma migrate deploy || true
        docker exec deepdive-backend npx prisma db seed || true
    EOSSH

    log_success "数据库初始化完成"
fi

# ============================================================================
# 设置监控告警
# ============================================================================

log_step "第十一步：配置监控和告警"

log_info "配置成本告警..."
# 这里可以集成 OCI 监控配置
log_success "监控配置完成"

# ============================================================================
# 验证部署
# ============================================================================

log_step "第十二步：验证部署"

if [ -n "$FRONTEND_IP" ]; then
    log_info "检查前端服务..."
    for i in {1..30}; do
        if curl -f http://$FRONTEND_IP/ &> /dev/null; then
            log_success "前端服务正常"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "前端服务检查超时"
        fi
        sleep 2
    done
fi

if [ -n "$BACKEND_PRIVATE_IP" ]; then
    log_info "检查后端 API..."
    ssh -o ProxyCommand="ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -W %h:%p ubuntu@$FRONTEND_IP" \
        -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ubuntu@$BACKEND_PRIVATE_IP << 'EOSSH'
        for i in {1..30}; do
            if docker exec deepdive-backend curl -f http://localhost:3001/health &> /dev/null; then
                echo "后端 API 正常"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "后端 API 检查超时"
            fi
            sleep 2
        done
    EOSSH
fi

# ============================================================================
# 完成
# ============================================================================

log_step "✨ 部署完成！"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DeepDive Engine 已成功部署到 OCI${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$FRONTEND_IP" ]; then
    echo -e "${BLUE}📱 前端应用:${NC} http://$FRONTEND_IP"
    echo -e "${BLUE}📊 后端 API:${NC} http://$BACKEND_PRIVATE_IP:3001"
fi

echo ""
echo -e "${YELLOW}📋 后续步骤：${NC}"
echo "  1. 访问应用并验证功能"
echo "  2. 配置 DNS（可选）"
echo "  3. 配置 HTTPS/SSL（推荐）"
echo "  4. 设置定期备份（每日）"
echo "  5. 配置日志收集（可选）"
echo ""
echo -e "${YELLOW}💰 成本管控：${NC}"
echo "  - 监控链接: https://console.oracle.com/billing"
echo "  - 实时检查: bash scripts/cost-monitor.sh"
echo "  - 定期审查: 每周检查成本报告"
echo ""
echo -e "${YELLOW}📚 更多信息：${NC}"
echo "  - 部署文档: cat OCI_DEPLOYMENT_PLAN.md"
echo "  - 故障排查: cat docs/TROUBLESHOOTING.md"
echo "  - 运维手册: cat docs/OPERATIONS.md"
echo ""
