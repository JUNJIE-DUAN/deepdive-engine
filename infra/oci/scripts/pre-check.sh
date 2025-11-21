#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  DeepDive Engine - OCI 部署前检查${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# 初始化检查计数
CHECKS_PASSED=0
CHECKS_FAILED=0

# 检查函数
check_tool() {
    local tool=$1
    local display=$2

    if command -v $tool &> /dev/null; then
        VERSION=$($tool --version 2>&1 | head -1)
        echo -e "${GREEN}✅${NC} $display: $VERSION"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} $display: 未安装"
        ((CHECKS_FAILED++))
    fi
}

check_file() {
    local file=$1
    local display=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $display 存在"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} $display 不存在"
        ((CHECKS_FAILED++))
    fi
}

check_env() {
    local var=$1
    local display=$2

    if [ -n "${!var}" ]; then
        echo -e "${GREEN}✅${NC} $display: 已设置"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠️ ${NC} $display: 未设置"
        ((CHECKS_FAILED++))
    fi
}

# 第一部分：工具检查
echo -e "${BLUE}📦 第一部分：工具检查${NC}"
echo ""
check_tool "docker" "Docker"
check_tool "oci" "OCI CLI"
check_tool "terraform" "Terraform"
check_tool "git" "Git"
echo ""

# 第二部分：文件检查
echo -e "${BLUE}📁 第二部分：项目文件检查${NC}"
echo ""

# 获取脚本所在目录的上级目录（项目根）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

check_file "$PROJECT_ROOT/frontend/Dockerfile" "Frontend Dockerfile"
check_file "$PROJECT_ROOT/backend/Dockerfile" "Backend Dockerfile"
check_file "$PROJECT_ROOT/docker-compose.yml" "docker-compose.yml"
check_file "$PROJECT_ROOT/infra/oci/terraform/main.tf" "Terraform main.tf"
check_file "$PROJECT_ROOT/infra/oci/terraform/variables.tf" "Terraform variables.tf"
echo ""

# 第三部分：环境变量检查
echo -e "${BLUE}🔐 第三部分：OCI 环境变量检查${NC}"
echo ""
check_env "OCI_COMPARTMENT_OCID" "OCI_COMPARTMENT_OCID"
check_env "OCI_REGION" "OCI_REGION"
echo ""

# 第四部分：Docker 连接检查
echo -e "${BLUE}🐳 第四部分：Docker 连接检查${NC}"
echo ""
if docker ps &> /dev/null; then
    CONTAINER_COUNT=$(docker ps -q | wc -l)
    echo -e "${GREEN}✅${NC} Docker 连接正常 (当前运行: $CONTAINER_COUNT 个容器)"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}❌${NC} Docker 连接失败"
    ((CHECKS_FAILED++))
fi
echo ""

# 第五部分：OCI CLI 连接检查
echo -e "${BLUE}☁️  第五部分：OCI CLI 连接检查${NC}"
echo ""
if [ -n "$OCI_COMPARTMENT_OCID" ]; then
    if oci iam compartment get --compartment-id $OCI_COMPARTMENT_OCID &> /dev/null; then
        echo -e "${GREEN}✅${NC} OCI CLI 连接正常"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌${NC} OCI CLI 连接失败 (请检查凭证)"
        ((CHECKS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️ ${NC} 跳过 OCI 连接检查 (未设置 OCI_COMPARTMENT_OCID)"
fi
echo ""

# 第六部分：SSH 密钥检查
echo -e "${BLUE}🔑 第六部分：SSH 密钥检查${NC}"
echo ""
if [ -f ~/.ssh/id_rsa ]; then
    echo -e "${GREEN}✅${NC} SSH 私钥存在"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} SSH 私钥不存在 (可以生成: ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N \"\")"
    ((CHECKS_FAILED++))
fi

if [ -f ~/.ssh/id_rsa.pub ]; then
    echo -e "${GREEN}✅${NC} SSH 公钥存在"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}⚠️ ${NC} SSH 公钥不存在"
    ((CHECKS_FAILED++))
fi
echo ""

# 汇总
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  检查结果汇总${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "✅ 通过: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "❌ 失败或警告: ${YELLOW}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！可以开始部署了！${NC}"
    echo ""
    echo -e "${BLUE}下一步:${NC}"
    echo "  bash infra/oci/scripts/deploy.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  存在 $CHECKS_FAILED 个需要修复的问题${NC}"
    echo ""
    echo -e "${BLUE}建议:${NC}"
    echo "  1. 安装缺失的工具"
    echo "  2. 设置必要的环境变量"
    echo "  3. 检查 OCI CLI 凭证配置"
    echo ""
    echo "  详见: infra/oci/PRE_DEPLOYMENT_CHECKLIST.md"
    echo ""
    exit 1
fi
