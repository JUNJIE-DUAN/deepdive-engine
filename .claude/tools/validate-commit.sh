#!/bin/bash

# DeepDive Engine - Commit Message Validator
# 验证提交信息是否遵循 Conventional Commits 规范
# 用法: bash .claude/tools/validate-commit.sh "feat(frontend): add new feature"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取提交信息
if [ $# -eq 0 ]; then
    # 如果没有参数，从最后一次提交获取
    COMMIT_MSG=$(git log -1 --pretty=%B)
else
    # 使用提供的参数
    COMMIT_MSG="$1"
fi

echo "========================================="
echo "Commit Message Validator"
echo "========================================="
echo ""
echo "Validating: $COMMIT_MSG"
echo ""

# 验证计数器
ERRORS=0

# 合法的类型
VALID_TYPES=(feat fix refactor test docs chore perf ci style revert)

# 合法的作用域
VALID_SCOPES=(frontend backend ai-service crawler proxy resource feed api database auth config kg)

# 提取类型和作用域
if [[ $COMMIT_MSG =~ ^([a-z]+)(\(([a-z-]+)\))?:\ (.+)$ ]]; then
    TYPE="${BASH_REMATCH[1]}"
    SCOPE="${BASH_REMATCH[3]}"
    SUBJECT="${BASH_REMATCH[4]}"

    echo -e "${GREEN}✓${NC} Basic format valid"
else
    echo -e "${RED}✗${NC} Invalid format"
    echo "   Expected: <type>(<scope>): <subject>"
    echo "   Example: feat(frontend): add user dashboard"
    ERRORS=$((ERRORS + 1))
    TYPE=""
    SCOPE=""
    SUBJECT=""
fi

# 验证类型
if [ -n "$TYPE" ]; then
    if [[ " ${VALID_TYPES[@]} " =~ " ${TYPE} " ]]; then
        echo -e "${GREEN}✓${NC} Type '$TYPE' is valid"
    else
        echo -e "${RED}✗${NC} Type '$TYPE' is invalid"
        echo "   Valid types: ${VALID_TYPES[*]}"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 验证作用域（可选，但如果提供必须有效）
if [ -n "$SCOPE" ]; then
    if [[ " ${VALID_SCOPES[@]} " =~ " ${SCOPE} " ]]; then
        echo -e "${GREEN}✓${NC} Scope '$SCOPE' is valid"
    else
        echo -e "${YELLOW}⚠${NC} Scope '$SCOPE' is not in standard list"
        echo "   Standard scopes: ${VALID_SCOPES[*]}"
        echo "   (This is a warning, not an error)"
    fi
fi

# 验证主题
if [ -n "$SUBJECT" ]; then
    # 检查首字母小写
    if [[ $SUBJECT =~ ^[a-z] ]]; then
        echo -e "${GREEN}✓${NC} Subject starts with lowercase"
    else
        echo -e "${RED}✗${NC} Subject should start with lowercase"
        ERRORS=$((ERRORS + 1))
    fi

    # 检查是否以句号结尾
    if [[ $SUBJECT =~ \.$ ]]; then
        echo -e "${RED}✗${NC} Subject should not end with period"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓${NC} Subject does not end with period"
    fi

    # 检查长度
    SUBJECT_LENGTH=${#SUBJECT}
    if [ $SUBJECT_LENGTH -le 50 ]; then
        echo -e "${GREEN}✓${NC} Subject length OK ($SUBJECT_LENGTH chars)"
    elif [ $SUBJECT_LENGTH -le 72 ]; then
        echo -e "${YELLOW}⚠${NC} Subject is a bit long ($SUBJECT_LENGTH chars)"
        echo "   Recommended: ≤ 50 chars"
    else
        echo -e "${RED}✗${NC} Subject too long ($SUBJECT_LENGTH chars)"
        echo "   Maximum: 72 chars, Recommended: ≤ 50 chars"
        ERRORS=$((ERRORS + 1))
    fi

    # 检查是否使用祈使语（简单检查）
    if [[ $SUBJECT =~ ^(added|fixed|updated|changed) ]]; then
        echo -e "${RED}✗${NC} Use imperative mood (add, fix, update, not added, fixed, updated)"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓${NC} Appears to use imperative mood"
    fi
fi

echo ""
echo "========================================="
echo "Validation Result"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Commit message is valid!${NC}"
    echo ""
    echo "Examples of good commit messages:"
    echo "  feat(frontend): add user dashboard"
    echo "  fix(backend): resolve database connection issue"
    echo "  docs(readme): update installation instructions"
    echo "  refactor(ai-service): optimize retry logic"
    exit 0
else
    echo -e "${RED}✗ Commit message has $ERRORS error(s)${NC}"
    echo ""
    echo "Conventional Commits Format:"
    echo "  <type>(<scope>): <subject>"
    echo ""
    echo "Types:"
    echo "  feat:      New feature"
    echo "  fix:       Bug fix"
    echo "  refactor:  Code refactoring"
    echo "  test:      Add or modify tests"
    echo "  docs:      Documentation changes"
    echo "  chore:     Build/tooling changes"
    echo "  perf:      Performance improvement"
    echo "  ci:        CI/CD changes"
    echo "  style:     Code formatting"
    echo "  revert:    Revert previous commit"
    echo ""
    echo "Scopes (examples):"
    echo "  frontend, backend, ai-service, crawler,"
    echo "  proxy, resource, feed, api, database, auth"
    echo ""
    echo "Rules:"
    echo "  • Subject must start with lowercase"
    echo "  • Subject must not end with period"
    echo "  • Subject should be ≤ 50 characters"
    echo "  • Use imperative mood (add, not added)"
    echo ""
    echo "Good examples:"
    echo "  feat(proxy): add PDF proxy for research papers"
    echo "  fix(frontend): resolve PDF iframe blocking"
    echo "  refactor(ai): optimize Grok API retry logic"
    echo ""
    exit 1
fi
