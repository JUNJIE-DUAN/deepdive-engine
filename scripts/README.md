# Scripts Directory

本目录包含项目的各类工具脚本，按功能模块组织。

## 目录结构

```
scripts/
├── merge-to-main/          # 代码合并到主干相关脚本
│   ├── pre-merge-validation.sh    # 合并前验证（质量检查、测试、提交规范）
│   ├── monitor-ci.sh              # CI/CD监控工具
│   ├── rollback-merge.sh          # 合并回滚工具
│   └── rollback.sh                # 通用回滚脚本
│
├── docs-specialist/        # 文档管理相关脚本（对应docs-specialist agent）
│   ├── docs-validation.sh         # 文档验证工具
│   ├── docs-reorganization-master.sh  # 文档重组主脚本
│   ├── rename-docs-lowercase.sh   # 文档文件名规范化（Unix/Mac）
│   ├── rename-docs-lowercase.bat  # 文档文件名规范化（Windows）
│   ├── update-doc-links.sh        # 更新文档链接
│   └── check-file-naming.js       # 检查文件命名规范
│
├── monitoring/              # 生产监控相关脚本（对应monitoring agent）
│   ├── setup-prometheus.sh        # 部署Prometheus监控栈
│   ├── health-check.sh            # 监控服务健康检查
│   ├── check-alerts.sh            # 查看活跃告警
│   └── validate-config.sh         # 验证监控配置
│
├── local-server/            # 开发环境相关脚本
│   ├── start-all.bat              # 启动所有服务（Windows）
│   └── stop-all.bat               # 停止所有服务（Windows）
│
├── utils/                  # 通用工具脚本
│   └── test-data-management-api.sh # 测试数据管理API
│
└── README.md               # 本文件
```

## merge-to-main/ - 代码合并工具

### pre-merge-validation.sh

**功能：** 在合并代码到主干前执行全面验证

**使用方法：**

```bash
./scripts/merge-to-main/pre-merge-validation.sh [target_branch]

# 示例
./scripts/merge-to-main/pre-merge-validation.sh develop
./scripts/merge-to-main/pre-merge-validation.sh main
```

**检查项：**

- ✅ Git状态（分支、工作目录、同步状态）
- ✅ 提交信息规范（Conventional Commits）
- ✅ 代码质量（Lint、Type Check）
- ✅ 测试通过（单元测试、覆盖率）
- ✅ 合并冲突检测
- ✅ 敏感信息扫描

**输出：**

- 验证报告保存到：`.claude/logs/pre-merge-validation-YYYYMMDD-HHMMSS.log`

### monitor-ci.sh

**功能：** 实时监控GitHub Actions workflow执行状态

**使用方法：**

```bash
./scripts/merge-to-main/monitor-ci.sh [branch] [timeout_seconds]

# 示例
./scripts/merge-to-main/monitor-ci.sh develop 900
./scripts/merge-to-main/monitor-ci.sh main 1200

# 查看历史
./scripts/merge-to-main/monitor-ci.sh history 10

# 查看失败日志
./scripts/merge-to-main/monitor-ci.sh logs [run_id]
```

**功能：**

- 🔄 实时显示workflow执行进度
- ✅ 自动检测成功/失败
- 📊 显示各job的执行时间
- 📝 记录CI执行历史
- ⏱️ 超时检测（默认15分钟）

**依赖：**

- GitHub CLI (`gh`) - https://cli.github.com/
- jq - JSON处理工具

### rollback-merge.sh

**功能：** 回滚已合并到主干的代码

**使用方法：**

```bash
./scripts/merge-to-main/rollback-merge.sh <merge_commit_sha> [branch]

# 示例
./scripts/merge-to-main/rollback-merge.sh abc123def456 develop

# 查找merge commits
git log --oneline --merges -10
```

**功能：**

- ✅ 验证merge commit
- 🔄 自动创建revert commit
- 📝 记录回滚日志
- ⚠️ 安全确认机制

**输出：**

- 回滚日志保存到：`.claude/logs/merge-rollbacks.jsonl`

---

## docs-specialist/ - 文档管理工具

### docs-validation.sh

**功能：** 验证文档的格式、链接和命名规范

**使用方法：**

```bash
./scripts/docs-specialist/docs-validation.sh
```

### check-file-naming.js

**功能：** 检查文档文件名是否符合kebab-case规范

**使用方法：**

```bash
node scripts/docs-specialist/check-file-naming.js
```

### rename-docs-lowercase.sh / .bat

**功能：** 将文档文件名转换为kebab-case格式

**使用方法：**

```bash
# Unix/Mac
./scripts/docs-specialist/rename-docs-lowercase.sh

# Windows
scripts\docs-specialist\rename-docs-lowercase.bat
```

---

## monitoring/ - 生产监控工具

### setup-prometheus.sh

**功能：** 自动化部署Prometheus监控栈

**使用方法：**

```bash
./scripts/monitoring/setup-prometheus.sh [environment]

# 示例
./scripts/monitoring/setup-prometheus.sh staging
./scripts/monitoring/setup-prometheus.sh production
```

**部署组件：**

- Prometheus (指标收集，端口9090)
- Grafana (可视化，端口3000)
- AlertManager (告警管理，端口9093)
- Exporters (PostgreSQL, Redis, MongoDB, Node, cAdvisor)

**输出：**

- 监控服务访问URLs
- Grafana登录凭证 (admin/admin)
- Docker Compose配置文件

### health-check.sh

**功能：** 检查所有监控服务健康状态

**使用方法：**

```bash
./scripts/monitoring/health-check.sh
```

**检查项：**

- ✅ Prometheus, Grafana, AlertManager状态
- ✅ 所有Exporters连接状态

### check-alerts.sh

**功能：** 查看当前活跃告警

**使用方法：**

```bash
# 查看所有告警
./scripts/monitoring/check-alerts.sh

# 按严重程度过滤
./scripts/monitoring/check-alerts.sh --severity critical
./scripts/monitoring/check-alerts.sh --severity warning

# 按服务过滤
./scripts/monitoring/check-alerts.sh --service backend
./scripts/monitoring/check-alerts.sh --service database
```

**输出格式：**

```
🚨 Critical Alerts (2)
---
[1] BackendDown
    Service: backend
    Duration: 5m
    Summary: Backend API is down

⚠️ Warning Alerts (3)
---
[1] HighLatency
    Service: backend
    Duration: 10m
    Summary: P95 latency above 1 second
```

### validate-config.sh

**功能：** 验证监控配置文件语法和有效性

**使用方法：**

```bash
# 验证所有配置
./scripts/monitoring/validate-config.sh

# 验证特定类型
./scripts/monitoring/validate-config.sh prometheus
./scripts/monitoring/validate-config.sh alerts
./scripts/monitoring/validate-config.sh grafana
```

**验证内容：**

- YAML语法正确性
- Prometheus配置有效性
- 告警规则表达式
- Grafana配置完整性

---

## local-server/ - 开发环境工具

### start-all.bat

**功能：** 启动所有开发服务（Windows）

**使用方法：**

```cmd
scripts\local-server\start-all.bat
```

### stop-all.bat

**功能：** 停止所有开发服务（Windows）

**使用方法：**

```cmd
scripts\local-server\stop-all.bat
```

---

## utils/ - 通用工具

### test-data-management-api.sh

**功能：** 测试数据管理API端点

**使用方法：**

```bash
./scripts/utils/test-data-management-api.sh
```

---

## 与Claude Code Agent的集成

scripts目录中的工具脚本与`.claude/agents/`中的agent配置对应：

| Agent             | 对应脚本目录               |
| ----------------- | -------------------------- |
| `merge-to-main`   | `scripts/merge-to-main/`   |
| `docs-specialist` | `scripts/docs-specialist/` |
| `monitoring`      | `scripts/monitoring/`      |

### 使用Agent执行脚本

在Claude Code中，可以通过agent自动调用这些脚本：

```bash
# 使用merge-to-main agent
# Agent会自动调用相应的验证、监控、回滚脚本
```

---

## 脚本使用权限

**Unix/Mac系统需要添加执行权限：**

```bash
# 一次性添加所有脚本的执行权限
chmod +x scripts/**/*.sh
```

或单个添加：

```bash
chmod +x scripts/merge-to-main/pre-merge-validation.sh
chmod +x scripts/merge-to-main/monitor-ci.sh
chmod +x scripts/merge-to-main/rollback-merge.sh
```

---

## 最佳实践

### 1. 代码合并工作流

```bash
# Step 1: 运行pre-merge验证
./scripts/merge-to-main/pre-merge-validation.sh develop

# Step 2: 如果验证通过，执行merge
git checkout develop
git merge --no-ff feature/xxx

# Step 3: 推送并监控CI
git push origin develop
./scripts/merge-to-main/monitor-ci.sh develop

# Step 4: 如果CI失败，执行回滚
./scripts/merge-to-main/rollback-merge.sh <merge_commit> develop
```

### 2. 文档维护工作流

```bash
# Step 1: 检查文件命名规范
node scripts/docs-specialist/check-file-naming.js

# Step 2: 规范化文件名（如需要）
./scripts/docs-specialist/rename-docs-lowercase.sh

# Step 3: 验证文档
./scripts/docs-specialist/docs-validation.sh
```

---

## 配置文件

相关配置文件位于`.claude/config/`：

- `.claude/config/merge-to-main.yml` - merge-to-main agent配置

---

## 日志文件

脚本执行日志保存在`.claude/logs/`：

- `merge-audit.jsonl` - 合并审计日志
- `merge-rollbacks.jsonl` - 回滚记录
- `ci-monitoring.jsonl` - CI监控记录
- `pre-merge-validation-*.log` - 验证报告

---

## 故障排查

### GitHub CLI未安装

```bash
# 安装GitHub CLI
# Windows (scoop)
scoop install gh

# Mac (Homebrew)
brew install gh

# 认证
gh auth login
```

### jq未安装

```bash
# Windows (scoop)
scoop install jq

# Mac (Homebrew)
brew install jq

# 或使用npm全局安装
npm install -g jq
```

### 脚本执行权限问题

```bash
# Unix/Mac
chmod +x scripts/**/*.sh

# Windows
# 使用Git Bash或WSL执行.sh脚本
# 或使用对应的.bat脚本
```

---

## 贡献指南

添加新脚本时，请遵循以下规范：

1. **放置位置：** 根据功能选择合适的子目录
2. **命名规范：** kebab-case（如：pre-merge-validation.sh）
3. **文件头注释：** 说明用途、用法、依赖
4. **错误处理：** 使用`set -e`，失败时退出
5. **日志输出：** 使用统一的颜色和格式
6. **更新文档：** 在本README中添加使用说明

---

**相关文档：**

- [Merge to Main Agent 文档](../.claude/agents/merge-to-main.md)
- [Docs Specialist Agent 文档](../.claude/agents/docs-specialist.md)
- [Git工作流规范](../.claude/standards/08-git-workflow.md)
