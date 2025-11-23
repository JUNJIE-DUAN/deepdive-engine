# Merge to Main Agent - 安装完成

**日期：** 2025-11-23
**状态：** ✅ 已完成

---

## 📦 已创建的组件

### 1. Agent配置文件

```
.claude/agents/
├── README.md                    # Agent系统架构总览（新增）
├── merge-to-main.md             # Merge to Main Agent配置（新增）
└── docs-specialist.md           # Docs Specialist Agent（已存在）
```

### 2. 配置文件

```
.claude/config/
└── merge-to-main.yml            # Merge配置文件（新增）
```

### 3. 工具脚本

```
.claude/tools/
├── pre-merge-validation.sh      # 合并前验证（新增）
├── monitor-ci.sh                # CI/CD监控（新增）
└── rollback-merge.sh            # 回滚工具（新增）
```

### 4. Scripts目录（已重组）

```
scripts/
├── README.md                    # 脚本使用文档（更新）
│
├── merge-to-main/               # 对应 merge-to-main agent
│   ├── pre-merge-validation.sh
│   ├── monitor-ci.sh
│   ├── rollback-merge.sh
│   └── rollback.sh
│
├── docs-specialist/             # 对应 docs-specialist agent（重命名）
│   ├── docs-validation.sh
│   ├── docs-reorganization-master.sh
│   ├── rename-docs-lowercase.sh
│   ├── rename-docs-lowercase.bat
│   ├── update-doc-links.sh
│   └── check-file-naming.js
│
├── local-server/                # 开发环境工具（重命名）
│   ├── start-all.bat
│   └── stop-all.bat
│
└── utils/                       # 通用工具
    └── test-data-management-api.sh
```

### 5. 日志目录（将自动创建）

```
.claude/logs/
├── merge-audit.jsonl            # 合并审计日志
├── merge-rollbacks.jsonl        # 回滚记录
├── ci-monitoring.jsonl          # CI监控日志
└── pre-merge-validation-*.log   # 验证报告
```

---

## 🎯 功能概览

### Merge to Main Agent

**核心能力：**

1. **Pre-Merge Validation（合并前验证）**
   - ✅ Git状态检查
   - ✅ 提交信息验证（Conventional Commits）
   - ✅ 代码Lint检查
   - ✅ TypeScript类型检查
   - ✅ 单元测试执行
   - ✅ 测试覆盖率验证（≥85%）
   - ✅ 合并冲突检测
   - ✅ 敏感信息扫描

2. **Merge Execution（安全合并）**
   - ✅ 自动更新目标分支
   - ✅ 安全merge（--no-ff）
   - ✅ 推送到远程仓库

3. **CI/CD Monitoring（实时监控）**
   - ✅ 监控GitHub Actions workflow
   - ✅ 实时显示job执行状态
   - ✅ 超时检测（默认15分钟）
   - ✅ 失败日志提取

4. **Rollback & Recovery（自动回滚）**
   - ✅ CI失败自动触发
   - ✅ 创建revert commit
   - ✅ 保留完整历史
   - ✅ 记录回滚日志

5. **Security & Audit（安全审计）**
   - ✅ 敏感信息扫描
   - ✅ 禁止文件检查
   - ✅ 操作审计日志
   - ✅ 完整追溯记录

---

## 🚀 快速开始

### 使用Agent（推荐）

在Claude Code中直接调用：

```
"请帮我将当前分支合并到develop，并监控CI执行情况"
```

Agent会自动执行：

1. Pre-merge验证
2. 执行merge
3. 监控CI/CD
4. 失败时自动回滚

### 手动使用脚本

```bash
# 1. 合并前验证
./scripts/merge-to-main/pre-merge-validation.sh develop

# 2. 手动merge
git checkout develop
git merge --no-ff feature/xxx
git push origin develop

# 3. 监控CI
./scripts/merge-to-main/monitor-ci.sh develop

# 4. 如果需要回滚
./scripts/merge-to-main/rollback-merge.sh <merge_commit> develop
```

---

## ⚙️ 配置说明

### 修改配置

编辑 `.claude/config/merge-to-main.yml`：

```yaml
# 示例：增加CI超时时间
ci_monitoring:
  timeout:
    total: 1800  # 30分钟

# 示例：禁用自动回滚（需要人工确认）
rollback:
  auto_rollback: false

# 示例：添加Slack通知
rollback:
  notification:
    slack_webhook: "https://hooks.slack.com/..."
```

---

## 📋 完整工作流程

### 场景1：日常功能合并到develop

```bash
# 1. 开发完成
git commit -m "feat(backend): add RSS parser"

# 2. 调用agent
# Claude Code: "请将当前分支合并到develop"

# 3. Agent自动执行：
✓ Pre-merge验证（3分钟）
✓ 执行merge
✓ 监控CI（10分钟）
✓ 全部通过！

# 4. 完成 ✅
```

### 场景2：发布到production（main）

```bash
# 1. 准备release
git checkout -b release/v1.2.0
# 更新版本号、CHANGELOG
git commit -m "chore(release): prepare v1.2.0"

# 2. 调用agent
# Claude Code: "请将release分支合并到main并打tag v1.2.0"

# 3. Agent确认：
? PR已审核？ ✓
? develop测试通过？ ✓
? 版本号？ v1.2.0

# 4. 执行merge + tag
✓ 合并到main
✓ 创建tag: v1.2.0
✓ 监控CI
✓ 完成 ✅
```

### 场景3：CI失败自动回滚

```bash
# 1. merge到develop
✓ Pre-merge验证通过
✓ 执行merge
✓ 推送成功

# 2. 监控CI
[1/5] quality-check ✅
[2/5] backend-test ❌ FAILED

# 3. 自动回滚
⏪ 检测到CI失败
🔄 自动回滚merge commit
✅ develop恢复到merge前状态
📝 记录失败日志

# 4. 在feature分支修复
git checkout feature/xxx
# 修复问题
git commit -m "fix(backend): resolve test failure"

# 5. 再次尝试merge
# Claude Code: "请再次尝试合并"
```

---

## 🔧 依赖检查

### 必需依赖

```bash
# 1. GitHub CLI
gh --version
# 如未安装：https://cli.github.com/

# 认证
gh auth login

# 2. jq（JSON处理）
jq --version
# 如未安装：
# Windows: scoop install jq
# Mac: brew install jq

# 3. Git
git --version

# 4. Node.js（测试需要）
node --version
npm --version
```

### 脚本权限（Unix/Mac）

```bash
# 添加执行权限
chmod +x scripts/merge-to-main/*.sh
chmod +x scripts/docs-specialist/*.sh
chmod +x .claude/tools/*.sh
```

---

## 📊 监控与审计

### 查看审计日志

```bash
# 查看所有merge记录
cat .claude/logs/merge-audit.jsonl | jq .

# 查看失败的merge
cat .claude/logs/merge-audit.jsonl | jq 'select(.rollback == true)'

# 查看最近10次merge
tail -10 .claude/logs/merge-audit.jsonl | jq .

# 统计最近7天的merge次数
cat .claude/logs/merge-audit.jsonl | \
  jq -r '.timestamp' | \
  grep $(date -d '7 days ago' +%Y-%m) | \
  wc -l
```

### 查看CI监控历史

```bash
# 最近10次CI运行
./scripts/merge-to-main/monitor-ci.sh history 10

# 查看特定run的日志
./scripts/merge-to-main/monitor-ci.sh logs <run_id>
```

---

## 🎓 培训与文档

### 必读文档

1. **[Agent系统架构](.claude/agents/README.md)**
   - 系统总览
   - Agent能力
   - 使用场景

2. **[Merge to Main Agent详细文档](.claude/agents/merge-to-main.md)**
   - 完整功能说明
   - 配置选项
   - 故障排查

3. **[Scripts使用指南](../../scripts/README.md)**
   - 脚本功能
   - 使用方法
   - 最佳实践

4. **[Git工作流规范](.claude/standards/08-git-workflow.md)**
   - 分支策略
   - 提交规范
   - PR流程

---

## ✅ 验收清单

安装完成后，请验证以下内容：

### 文件检查

- [ ] `.claude/agents/merge-to-main.md` 存在
- [ ] `.claude/agents/README.md` 存在
- [ ] `.claude/config/merge-to-main.yml` 存在
- [ ] `scripts/merge-to-main/` 目录存在
- [ ] `scripts/docs-specialist/` 目录存在（重命名）
- [ ] `scripts/local-server/` 目录存在（重命名）

### 脚本测试

```bash
# 测试pre-merge-validation
./scripts/merge-to-main/pre-merge-validation.sh develop
# 应该执行所有检查

# 测试monitor-ci
./scripts/merge-to-main/monitor-ci.sh history 5
# 应该显示最近5次CI运行

# 测试GitHub CLI
gh auth status
# 应该显示已认证
```

### Agent测试

在Claude Code中测试：

```
"请帮我分析当前的Git状态，检查是否可以合并到develop"
```

应该返回详细的Git状态分析。

---

## 🔮 后续改进建议

### 短期（1-2周）

1. **添加更多通知渠道**
   - Slack集成
   - Email通知
   - 企业微信/钉钉

2. **增强安全扫描**
   - 使用truffleHog扫描secrets
   - 添加依赖漏洞检查
   - SAST静态分析集成

3. **性能优化**
   - 并行执行检查
   - 缓存依赖安装
   - 增量测试

### 中期（1个月）

1. **新增Agent**
   - `test-runner` - 自动化测试执行
   - `security-scanner` - 安全扫描
   - `performance-analyzer` - 性能分析

2. **增强CI监控**
   - 可视化dashboard
   - 历史趋势分析
   - 性能指标追踪

3. **自动化改进**
   - 智能冲突解决建议
   - 测试失败根因分析
   - 自动生成修复建议

---

## 📞 支持与反馈

### 遇到问题？

1. **查看文档**
   - [Agent README](.claude/agents/README.md)
   - [Scripts README](../../scripts/README.md)
   - [故障排查](../../scripts/README.md#故障排查)

2. **检查日志**
   - `.claude/logs/merge-audit.jsonl`
   - `.claude/logs/ci-monitoring.jsonl`

3. **提交Issue**
   - 项目仓库Issues页面
   - 联系DevOps团队

### 改进建议

欢迎提交PR改进：

- Agent配置
- 脚本功能
- 文档更新
- 新功能建议

---

## 🎉 总结

**merge-to-main agent已成功部署！**

核心价值：

- ✅ 自动化代码合并流程
- ✅ 实时监控CI/CD状态
- ✅ 失败自动回滚保护主干
- ✅ 完整的审计追溯
- ✅ 提高开发效率和代码质量

**下一步：**

1. 阅读文档熟悉功能
2. 在feature分支测试
3. 逐步推广到团队使用

---

**版本：** 1.0
**创建日期：** 2025-11-23
**维护者：** DevOps Team
