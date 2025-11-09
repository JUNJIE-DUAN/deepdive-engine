#!/bin/bash

# DeepDive Engine - 全面代码检查工具
# 用法: bash .claude/tools/check-all.sh

set -e  # 遇到错误立即退出

echo "========================================="
echo "DeepDive Engine - Code Quality Check"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数器
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 辅助函数
check_start() {
    echo -e "${YELLOW}▶ $1${NC}"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

check_pass() {
    echo -e "${GREEN}  ✓ $1${NC}"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
}

check_fail() {
    echo -e "${RED}  ✗ $1${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

# ==================== Frontend Checks ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend (Next.js) Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "frontend" ]; then
    cd frontend

    # ESLint检查
    check_start "Running ESLint..."
    if npm run lint &> /dev/null; then
        check_pass "ESLint passed"
    else
        check_fail "ESLint failed - Run 'npm run lint' in frontend/ to see details"
    fi

    # TypeScript类型检查
    check_start "Running TypeScript type check..."
    if npx tsc --noEmit &> /dev/null; then
        check_pass "TypeScript type check passed"
    else
        check_fail "TypeScript errors found - Run 'npx tsc --noEmit' in frontend/ to see details"
    fi

    # 测试
    check_start "Running tests..."
    if npm test -- --passWithNoTests &> /dev/null; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed - Run 'npm test' in frontend/ to see details"
    fi

    cd ..
else
    check_fail "Frontend directory not found"
fi

echo ""

# ==================== Backend Checks ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend (NestJS) Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "backend" ]; then
    cd backend

    # ESLint检查
    check_start "Running ESLint..."
    if npm run lint &> /dev/null; then
        check_pass "ESLint passed"
    else
        check_fail "ESLint failed - Run 'npm run lint' in backend/ to see details"
    fi

    # TypeScript类型检查
    check_start "Running TypeScript type check..."
    if npx tsc --noEmit &> /dev/null; then
        check_pass "TypeScript type check passed"
    else
        check_fail "TypeScript errors found - Run 'npx tsc --noEmit' in backend/ to see details"
    fi

    # Prisma检查
    check_start "Validating Prisma schema..."
    if npx prisma validate &> /dev/null; then
        check_pass "Prisma schema valid"
    else
        check_fail "Prisma schema invalid - Run 'npx prisma validate' in backend/ to see details"
    fi

    # 测试
    check_start "Running tests..."
    if npm test -- --passWithNoTests &> /dev/null; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed - Run 'npm test' in backend/ to see details"
    fi

    cd ..
else
    check_fail "Backend directory not found"
fi

echo ""

# ==================== AI Service Checks ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "AI Service (Python/FastAPI) Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d "ai-service" ]; then
    cd ai-service

    # Pylint检查
    check_start "Running Pylint..."
    if pylint services/ routers/ utils/ models/ --disable=C0111,C0103 &> /dev/null; then
        check_pass "Pylint passed"
    else
        check_fail "Pylint found issues - Run 'pylint services/ routers/ utils/ models/' in ai-service/ to see details"
    fi

    # Black格式检查
    check_start "Checking code formatting with Black..."
    if black --check services/ routers/ utils/ models/ &> /dev/null; then
        check_pass "Black formatting check passed"
    else
        check_fail "Code needs formatting - Run 'black services/ routers/ utils/ models/' in ai-service/ to auto-format"
    fi

    # 测试
    check_start "Running pytest..."
    if pytest --quiet &> /dev/null; then
        check_pass "Tests passed"
    else
        check_fail "Tests failed - Run 'pytest' in ai-service/ to see details"
    fi

    cd ..
else
    check_fail "AI Service directory not found"
fi

echo ""

# ==================== Security Checks ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Security Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查敏感文件
check_start "Checking for sensitive files..."
SENSITIVE_FILES=(".env" "*.pem" "*.key" "*.crt" "*credentials*.json")
FOUND_SENSITIVE=false

for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files --error-unmatch "$pattern" &> /dev/null; then
        check_fail "Sensitive file found in git: $pattern"
        FOUND_SENSITIVE=true
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    check_pass "No sensitive files in git"
fi

# 检查硬编码密钥
check_start "Scanning for hardcoded secrets..."
if grep -r -E "(api[_-]?key|password|secret|token)\s*=\s*['\"][^'\"]{8,}" --include="*.ts" --include="*.js" --include="*.py" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist . &> /dev/null; then
    check_fail "Possible hardcoded secrets found - Review code carefully"
else
    check_pass "No obvious hardcoded secrets found"
fi

# npm audit
check_start "Running npm security audit..."
cd frontend
if npm audit --audit-level=high &> /dev/null; then
    check_pass "Frontend dependencies secure"
else
    check_fail "Frontend has high/critical vulnerabilities - Run 'npm audit' in frontend/"
fi
cd ..

cd backend
if npm audit --audit-level=high &> /dev/null; then
    check_pass "Backend dependencies secure"
else
    check_fail "Backend has high/critical vulnerabilities - Run 'npm audit' in backend/"
fi
cd ..

echo ""

# ==================== Git Checks ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Git Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查未提交的更改
check_start "Checking for uncommitted changes..."
if git diff --quiet && git diff --cached --quiet; then
    check_pass "No uncommitted changes"
else
    check_fail "Uncommitted changes detected - Commit or stash before deploying"
fi

# 检查分支
check_start "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    check_fail "On main/master branch - Create a feature branch for development"
else
    check_pass "On feature branch: $CURRENT_BRANCH"
fi

echo ""

# ==================== 总结 ====================
echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo "Total checks: $TOTAL_CHECKS"
echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Code is ready for review.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
