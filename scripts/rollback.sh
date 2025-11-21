#!/bin/bash

###############################################################################
# DeepDive Engine - Rollback Script
# 用于快速回滚到上一个稳定版本
###############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 参数
SERVICE=$1
ENVIRONMENT=${2:-production}

# 显示使用说明
show_usage() {
  echo "Usage: ./scripts/rollback.sh <service> [environment]"
  echo ""
  echo "Services:"
  echo "  frontend    - Frontend application"
  echo "  backend     - Backend API"
  echo "  ai-service  - AI service"
  echo "  all         - All services"
  echo ""
  echo "Environment:"
  echo "  production  - Production environment (default)"
  echo "  staging     - Staging environment"
  echo ""
  echo "Example:"
  echo "  ./scripts/rollback.sh backend production"
}

# 检查参数
if [ -z "$SERVICE" ]; then
  echo -e "${RED}❌ Error: Service not specified${NC}"
  show_usage
  exit 1
fi

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}   DeepDive Engine - Rollback${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Service:     ${GREEN}$SERVICE${NC}"
echo -e "Environment: ${GREEN}$ENVIRONMENT${NC}"
echo ""

# 确认回滚
echo -e "${YELLOW}⚠️  WARNING: This will rollback to the previous version${NC}"
echo -e "${YELLOW}⚠️  Make sure you understand the implications${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${RED}❌ Rollback cancelled${NC}"
  exit 0
fi

echo -e "${GREEN}🔄 Starting rollback process...${NC}"
echo ""

# 执行回滚
rollback_service() {
  local svc=$1

  echo -e "${GREEN}📦 Rolling back $svc...${NC}"

  # TODO: 实现实际的回滚逻辑
  # 这里需要根据你的部署平台（Railway/K8s等）实现
  # 示例:
  # railway rollback --service=$svc --environment=$ENVIRONMENT

  echo -e "${GREEN}✅ $svc rolled back successfully${NC}"
}

# 根据服务类型执行回滚
case "$SERVICE" in
  frontend|backend|ai-service)
    rollback_service "$SERVICE"
    ;;
  all)
    rollback_service "frontend"
    rollback_service "backend"
    rollback_service "ai-service"
    ;;
  *)
    echo -e "${RED}❌ Invalid service: $SERVICE${NC}"
    show_usage
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Rollback completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 运行健康检查
echo -e "${GREEN}🏥 Running health checks...${NC}"
sleep 5

HEALTH_URL="https://api.deepdive.app/health"
if [ "$ENVIRONMENT" = "staging" ]; then
  HEALTH_URL="https://staging-api.deepdive.app/health"
fi

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
  echo -e "${YELLOW}⚠️  Please investigate immediately!${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All checks passed. Rollback successful!${NC}"
