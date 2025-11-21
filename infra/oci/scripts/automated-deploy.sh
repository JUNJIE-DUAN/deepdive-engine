#!/bin/bash

# ============================================================================
# DeepDive Engine - 完全自动化部署脚本
# 使用方式: bash automated-deploy.sh
# ============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
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
# 第一步：配置 OCI CLI
# ============================================================================

log_step "步骤 1: 配置 OCI CLI"

# 检查是否已配置
if [ -f ~/.oci/config ]; then
    log_info "检测到已有 OCI CLI 配置"
    read -p "是否使用现有配置？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_success "使用现有 OCI CLI 配置"
    else
        log_info "将创建新的 OCI CLI 配置"
        oci setup config
    fi
else
    log_info "未检测到 OCI CLI 配置，开始配置..."
    oci setup config
fi

# ============================================================================
# 第二步：获取并验证环境变量
# ============================================================================

log_step "步骤 2: 设置环境变量"

read -p "请输入 Compartment OCID (ocid1.compartment.oc1...): " OCI_COMPARTMENT_OCID
read -p "请输入 Region (例如: ap-singapore-1): " OCI_REGION

# 验证输入
if [ -z "$OCI_COMPARTMENT_OCID" ] || [ -z "$OCI_REGION" ]; then
    log_error "Compartment OCID 或 Region 不能为空"
    exit 1
fi

export OCI_COMPARTMENT_OCID=$OCI_COMPARTMENT_OCID
export OCI_REGION=$OCI_REGION

log_success "环境变量已设置"
echo "  Compartment: $OCI_COMPARTMENT_OCID"
echo "  Region: $OCI_REGION"

# ============================================================================
# 第三步：验证 OCI 连接
# ============================================================================

log_step "步骤 3: 验证 OCI 连接"

if oci iam compartment get --compartment-id $OCI_COMPARTMENT_OCID &> /dev/null; then
    log_success "OCI 连接验证成功"
else
    log_error "OCI 连接失败，请检查配置"
    exit 1
fi

# ============================================================================
# 第四步：检查本地工具
# ============================================================================

log_step "步骤 4: 检查本地工具"

for tool in docker terraform git; do
    if command -v $tool &> /dev/null; then
        VERSION=$($tool --version 2>&1 | head -1)
        log_success "$tool: $VERSION"
    else
        log_error "$tool: 未安装"
        exit 1
    fi
done

# ============================================================================
# 第五步：构建 Docker 镜像
# ============================================================================

log_step "步骤 5: 构建 Docker 镜像"

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

log_info "构建前端镜像..."
docker build -f $DOCKER_DIR/frontend/Dockerfile -t deepdive-frontend:latest $DOCKER_DIR/frontend/
log_success "前端镜像构建完成"

log_info "构建后端镜像..."
docker build -f $DOCKER_DIR/backend/Dockerfile -t deepdive-backend:latest $DOCKER_DIR/backend/
log_success "后端镜像构建完成"

# ============================================================================
# 第六步：推送镜像到 OCI Registry
# ============================================================================

log_step "步骤 6: 推送镜像到 OCI Registry"

log_info "获取 OCI Registry 信息..."
OCI_NAMESPACE=$(oci os ns get --query 'data' --raw-output)
REGISTRY="${OCI_REGION}.ocir.io"

log_info "Registry: $REGISTRY"
log_info "Namespace: $OCI_NAMESPACE"

log_info "登录到 OCI Registry..."
read -p "请输入 OCI 用户名 (邮箱或用户名): " OCI_USERNAME

# 生成认证令牌
echo -n "生成认证令牌中..."
AUTH_TOKEN=$(oci session authenticate --auth-method federation 2>/dev/null | grep -oP '(?<="auth_token" : ")[^"]*' || echo "")

if [ -z "$AUTH_TOKEN" ]; then
    log_error "无法自动生成认证令牌"
    log_info "请手动创建应用密码:"
    log_info "  1. 登录 OCI 控制台"
    log_info "  2. 右上角菜单 → 身份和访问管理 → 用户 → 用户名"
    log_info "  3. 左侧选择'应用密码'"
    log_info "  4. 点击'生成应用密码'"
    read -sp "请输入应用密码: " APP_PASSWORD
    echo
    AUTH_TOKEN=$APP_PASSWORD
fi

# 登录到 Registry
echo "$AUTH_TOKEN" | docker login -u "${REGISTRY}/${OCI_NAMESPACE}/${OCI_USERNAME}" --password-stdin $REGISTRY
log_success "成功登录 OCI Registry"

# 推送镜像
log_info "推送前端镜像..."
docker tag deepdive-frontend:latest ${REGISTRY}/${OCI_NAMESPACE}/deepdive-frontend:latest
docker push ${REGISTRY}/${OCI_NAMESPACE}/deepdive-frontend:latest
log_success "前端镜像推送完成"

log_info "推送后端镜像..."
docker tag deepdive-backend:latest ${REGISTRY}/${OCI_NAMESPACE}/deepdive-backend:latest
docker push ${REGISTRY}/${OCI_NAMESPACE}/deepdive-backend:latest
log_success "后端镜像推送完成"

# ============================================================================
# 第七步：部署基础设施 (Terraform)
# ============================================================================

log_step "步骤 7: 创建 OCI 基础设施"

TERRAFORM_DIR="$DOCKER_DIR/infra/oci/terraform"

cd $TERRAFORM_DIR

log_info "初始化 Terraform..."
terraform init

log_info "获取 SSH 公钥..."
SSH_PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub 2>/dev/null || echo "")

if [ -z "$SSH_PUBLIC_KEY" ]; then
    log_error "SSH 公钥不存在，正在生成..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    SSH_PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub)
fi

# 创建 tfvars 文件
cat > terraform.tfvars <<EOF
compartment_ocid = "${OCI_COMPARTMENT_OCID}"
region = "${OCI_REGION}"
ssh_public_key = "${SSH_PUBLIC_KEY}"
oci_registry_namespace = "deepdive"
EOF

log_info "规划部署..."
terraform plan -out=tfplan

read -p "确认部署到 OCI？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_error "用户取消部署"
    exit 1
fi

log_info "应用 Terraform 配置 (这可能需要 10-20 分钟)..."
terraform apply tfplan

# 获取输出
log_info "获取部署信息..."
FRONTEND_IP=$(terraform output -raw frontend_public_ip 2>/dev/null || echo "")
BACKEND_IP=$(terraform output -raw backend_private_ip 2>/dev/null || echo "")

log_success "基础设施部署完成"

# ============================================================================
# 第八步：验证部署
# ============================================================================

log_step "步骤 8: 验证部署"

log_info "等待实例启动..."
sleep 30

if [ -n "$FRONTEND_IP" ]; then
    log_info "测试前端连接..."
    for i in {1..30}; do
        if curl -f http://$FRONTEND_IP/ &> /dev/null; then
            log_success "前端可访问"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "前端连接超时"
        fi
        sleep 2
    done
else
    log_error "无法获取前端 IP"
fi

# ============================================================================
# 完成
# ============================================================================

log_step "🎉 部署完成！"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DeepDive Engine 已成功部署到 OCI${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$FRONTEND_IP" ]; then
    echo -e "${BLUE}📱 前端应用:${NC} http://$FRONTEND_IP"
    echo -e "${BLUE}📊 后端 API:${NC} http://$BACKEND_IP:3001"
else
    echo -e "${YELLOW}⚠️  部分信息获取失败，请在 OCI 控制台查看实例信息${NC}"
fi

echo ""
echo -e "${YELLOW}📋 后续步骤:${NC}"
echo "  1. 在浏览器中访问前端 URL"
echo "  2. 测试应用功能"
echo "  3. 配置 DNS（可选）"
echo "  4. 启用 HTTPS（推荐）"
echo ""
echo -e "${YELLOW}💰 成本:${NC} $0.00 ✅ (完全免费)"
echo ""
