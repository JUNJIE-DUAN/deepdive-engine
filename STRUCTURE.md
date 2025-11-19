# DeepDive Engine 项目结构

## 📁 目录组织

```
deepdive-engine/
├── frontend/                    # 前端代码
│   ├── app/                     # Next.js路由
│   ├── components/              # React组件库
│   ├── lib/                     # 工具库
│   ├── stores/                  # 状态管理
│   └── public/                  # 静态资源
│
├── backend/                     # 后端代码
│   ├── src/
│   │   ├── modules/             # 功能模块
│   │   ├── common/              # 公共工具
│   │   ├── config/              # 配置文件
│   │   └── main.ts              # 应用入口
│   ├── prisma/                  # 数据库ORM
│   └── dist/                    # 编译输出
│
├── docs/                        # 📚 项目文档
│   ├── api/                     # API文档
│   ├── architecture/            # 架构设计文档
│   ├── design/                  # UI设计规范
│   ├── guides/                  # 开发指南
│   ├── prd/                     # 产品需求文档
│   ├── data-management/         # Data Management模块文档
│   │   ├── DATA-MANAGEMENT-IMPLEMENTATION.md
│   │   ├── DATA-MANAGEMENT-VALIDATION.md
│   │   ├── DATA-MANAGEMENT-QUICK-GUIDE.md
│   │   └── UI-REDESIGN-REPORT.md
│   └── project-reports/         # 项目交付报告
│       └── DELIVERY-MANIFEST.txt
│
├── scripts/                     # 🛠️ 脚本和工具
│   ├── start-all.bat
│   ├── stop-all.bat
│   └── test-data-management-api.sh
│
├── package.json                 # 项目配置
├── docker-compose.yml           # Docker配置
├── README.md                    # 项目说明
└── STRUCTURE.md                 # 本文件
```

---

## 📚 文档指南

### Data Management 模块文档

位置: `docs/data-management/`

1. **UI-REDESIGN-REPORT.md** - UI整改报告
   - Icon专业化分析
   - 空间优化方案
   - 设计改进指标

2. **BUG-FIX-REPORT.md** - Bug修复报告
   - 页面头部优化
   - API 404错误修复
   - 验证步骤

3. **DATA-MANAGEMENT-IMPLEMENTATION.md** - 实现方案文档
   - 完整架构设计
   - 功能说明
   - API文档
   - 扩展建议

4. **DATA-MANAGEMENT-VALIDATION.md** - 验证报告
   - PRD要求对标
   - 功能完整性检查
   - 质量评分
   - 上线清单

5. **DATA-MANAGEMENT-QUICK-GUIDE.md** - 快速参考
   - 页面位置
   - 核心特性
   - 常见问题
   - 开发指南

6. **UI-REDESIGN-REPORT.md** - UI整改报告
   - Icon专业化分析
   - 空间优化方案
   - 设计改进指标

### 项目报告文档

位置: `docs/project-reports/`

1. **DELIVERY-MANIFEST.txt** - 交付清单
   - 文件清单
   - 功能清单
   - 技术指标
   - 上线清单

---

## 🚀 快速开始

### 启动项目

```bash
# 启动所有服务
scripts/start-all.bat          # Windows
./scripts/start-all.bat        # Git Bash

# 或手动启动
npm run dev                     # 前端开发服务
npm run backend:dev            # 后端开发服务
```

### 停止项目

```bash
# 停止所有服务
scripts/stop-all.bat           # Windows
./scripts/stop-all.bat         # Git Bash
```

### 测试API

```bash
./scripts/test-data-management-api.sh
```

---

## 📖 阅读建议

### 快速了解项目

1. 阅读 `README.md` (3分钟)
2. 阅读 `docs/project-reports/COMPLETION-SUMMARY.md` (5分钟)
3. 阅读 `docs/data-management/DATA-MANAGEMENT-QUICK-GUIDE.md` (10分钟)

### 深入了解Data Management

1. `docs/data-management/DATA-MANAGEMENT-IMPLEMENTATION.md` (15分钟)
2. `docs/data-management/DATA-MANAGEMENT-VALIDATION.md` (20分钟)
3. `docs/data-management/UI-REDESIGN-REPORT.md` (10分钟)

### 开发相关

- `docs/guides/` - 开发指南
- `docs/api/` - API文档
- `docs/architecture/` - 架构文档

---

## 🗂️ 文件清单

### 根目录文件

- `README.md` - 项目说明
- `package.json` - 项目配置
- `docker-compose.yml` - Docker配置
- `.env.example` - 环境变量示例
- `.gitignore` - Git忽略规则

### 文档文件 (已组织)

```
docs/
├── data-management/
│   ├── DATA-MANAGEMENT-IMPLEMENTATION.md
│   ├── DATA-MANAGEMENT-QUICK-GUIDE.md
│   ├── DATA-MANAGEMENT-VALIDATION.md
│   └── UI-REDESIGN-REPORT.md
└── project-reports/
    └── DELIVERY-MANIFEST.txt
```

### 脚本文件 (已组织)

```
scripts/
├── start-all.bat
├── stop-all.bat
└── test-data-management-api.sh
```

---

## ✅ 组织规范

### 文档命名

- `*-REPORT.md` - 报告类文档
- `*-GUIDE.md` - 指南类文档
- `*-IMPLEMENTATION.md` - 实现方案文档
- `README.md` - 说明文档

### 目录命名

- 使用小写英文
- 使用连字符分隔单词
- 简短明确

### 脚本文件

- 所有脚本放在 `scripts/` 目录
- 启动/停止脚本以 `-all` 结尾
- 测试脚本以 `test-` 开头

---

## 📝 维护指南

### 添加新文档

1. 确定文档类型 (报告/指南/实现)
2. 选择合适目录 (data-management/project-reports/guides等)
3. 遵循命名规范
4. 在本文件中更新目录结构

### 添加新脚本

1. 将脚本放在 `scripts/` 目录
2. 遵循命名规范
3. 添加执行权限 (`chmod +x script.sh`)
4. 在README中说明用途

---

## 🔍 查找文件

| 文件类型 | 位置                    |
| -------- | ----------------------- |
| 前端代码 | `frontend/`             |
| 后端代码 | `backend/`              |
| API文档  | `docs/api/`             |
| 产品文档 | `docs/prd/`             |
| 实现报告 | `docs/data-management/` |
| 项目报告 | `docs/project-reports/` |
| 启动脚本 | `scripts/`              |

---

**最后更新**: 2024-11-19
**维护者**: Claude Code
**版本**: 1.0
