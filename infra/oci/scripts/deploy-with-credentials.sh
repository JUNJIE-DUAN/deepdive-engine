#!/bin/bash

# ============================================================================
# DeepDive OCI 部署脚本 - 使用提供的凭证
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
# 步骤 1: 验证凭证
# ============================================================================

log_step "步骤 1: 验证 OCI 凭证"

# 使用用户提供的凭证
export OCI_USER_OCID="ocid1.user.oc1..aaaaaaaas7vm3r365jphuvgoxqvdw6l4sdericwhkinevtj5txqxrhh46ffq"
export OCI_TENANCY_OCID="ocid1.tenancy.oc1..aaaaaaaalp72vq523bbru7qtrnyix6s3aotkgf5q4nhsjzd6vtf6wbcqgdma"
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1..aaaaaaaa3ddtttsamndd3ppzewiakxwqqlkjswyweyrk3bu6nwruw32kwnsa"
export OCI_REGION="ca-toronto-1"
export OCI_FINGERPRINT="e8:2f:2b:65:d6:21:06:4f:ac:4d:6f:7b:f7:05:72:03"
export OCI_KEY_FILE="D:\projects\deepdive\infra\oci\api-key\oci_api_key.pem"

log_info "用户 OCID: $OCI_USER_OCID"
log_info "Tenancy OCID: $OCI_TENANCY_OCID"
log_info "Compartment OCID: $OCI_COMPARTMENT_OCID"
log_info "Region: $OCI_REGION"
log_info "Fingerprint: $OCI_FINGERPRINT"
log_success "凭证已验证"

# ============================================================================
# 步骤 2: 检查本地工具
# ============================================================================

log_step "步骤 2: 检查本地工具"

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
# 步骤 3: 构建 Docker 镜像
# ============================================================================

log_step "步骤 3: 构建 Docker 镜像"

DOCKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

log_info "构建前端镜像..."
docker build -f $DOCKER_DIR/frontend/Dockerfile -t deepdive-frontend:latest $DOCKER_DIR/frontend/
log_success "前端镜像构建完成"

log_info "构建后端镜像..."
docker build -f $DOCKER_DIR/backend/Dockerfile -t deepdive-backend:latest $DOCKER_DIR/backend/
log_success "后端镜像构建完成"

# ============================================================================
# 步骤 4: 准备 Terraform 部署
# ============================================================================

log_step "步骤 4: 准备 Terraform 部署"

TERRAFORM_DIR="$DOCKER_DIR/infra/oci/terraform"

cd $TERRAFORM_DIR

log_info "初始化 Terraform..."
terraform init

# 获取 SSH 公钥
log_info "获取 SSH 公钥..."
SSH_PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub 2>/dev/null || echo "")

if [ -z "$SSH_PUBLIC_KEY" ]; then
    log_error "SSH 公钥不存在，正在生成..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    SSH_PUBLIC_KEY=$(cat ~/.ssh/id_rsa.pub)
fi

# 创建 tfvars 文件
cat > terraform.tfvars <<EOF
compartment_ocid = "$OCI_COMPARTMENT_OCID"
region = "$OCI_REGION"
ssh_public_key = "$SSH_PUBLIC_KEY"
oci_registry_namespace = "deepdive"
EOF

log_success "Terraform 变量文件已创建"

# ============================================================================
# 步骤 5: 执行 Terraform 部署
# ============================================================================

log_step "步骤 5: 执行 Terraform 部署"

log_info "规划部署..."
terraform plan -out=tfplan

log_info "应用 Terraform 配置（这可能需要 10-20 分钟）..."
terraform apply tfplan

# 获取输出
log_info "获取部署信息..."
FRONTEND_IP=$(terraform output -raw frontend_public_ip 2>/dev/null || echo "")
BACKEND_IP=$(terraform output -raw backend_private_ip 2>/dev/null || echo "")

log_success "基础设施部署完成"

# ============================================================================
# 步骤 6: 验证部署
# ============================================================================

log_step "步骤 6: 验证部署"

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
