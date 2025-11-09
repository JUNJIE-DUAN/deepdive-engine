# DeepDive Engine - TODO任务清单

> **目标**: MVP 1.0-2.0完整实现
> **时间**: 2周（2025-11-09 → 2025-11-23）
> **优先级**: P0 > P1 > P2

---

## 🔥 紧急修复（P0）- Day 1

### ✅ 数据层修复

- [x] 调查数据采集问题（已完成）
- [ ] **执行resourceId链接脚本**
  - 文件：`backend/src/scripts/link-raw-data.ts`
  - 命令：`cd backend && npx ts-node src/scripts/link-raw-data.ts`
  - 预期：73条raw_data都有resourceId

- [ ] **修复GitHub资源的title**
  - 位置：`backend/src/crawler/github.service.ts`
  - 问题：30条GitHub数据没有title
  - 方案：使用`fullName`或`name`作为title
  ```typescript
  // 在createResource时
  title: rawData.data.name || rawData.data.fullName
  ```

- [ ] **验证数据完整性**
  - 检查所有resource都有对应的raw_data
  - 检查所有raw_data都有resourceId
  - 创建验证脚本：`debug/validate-data.ts`

---

## 📱 前端核心功能（P0）- Day 2-5

### 1. 智能搜索框（Day 2）

**后端API**:
- [ ] **创建搜索建议API**
  - 文件：`backend/src/resource/resource.controller.ts`
  - 路由：`GET /api/v1/resources/search/suggestions`
  - 参数：`?q=query&limit=5`
  - 返回：
  ```typescript
  {
    suggestions: [
      {
        id: string,
        title: string,
        type: 'paper' | 'project' | 'news',
        abstract: string,
        highlight: string // 匹配的关键词
      }
    ]
  }
  ```

- [ ] **实现混合搜索算法**
  - 向量搜索（Qdrant）：语义相似度
  - 全文搜索（PostgreSQL）：精确匹配
  - 合并排序：0.6 * vector_score + 0.4 * text_score

**前端实现**:
- [ ] **更新搜索框组件** (`frontend/app/page.tsx`)
  ```typescript
  // 添加状态
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 防抖搜索
  const debouncedSearch = useMemo(
    () => debounce(async (q) => {
      if (q.length < 2) return;
      const res = await fetch(`/api/v1/resources/search/suggestions?q=${q}`);
      const data = await res.json();
      setSearchSuggestions(data.suggestions);
      setShowSuggestions(true);
    }, 300),
    []
  );
  ```

- [ ] **添加建议下拉框UI**
  - 参考AlphaXiv样式
  - 键盘导航支持（↑↓回车）
  - 点击外部关闭
  - 加载状态显示

- [ ] **添加Agent模式切换**
  - agent模式：调用AI回答
  - search模式：搜索资源

**验收标准**:
- ✓ 输入2个字符后300ms内显示建议
- ✓ 建议列表最多5条
- ✓ 高亮匹配关键词
- ✓ 点击建议跳转到详情

---

### 2. PDF缩略图（Day 3）

**后端服务**:
- [ ] **创建缩略图生成服务**
  - 文件：`backend/src/resource/thumbnail.service.ts`
  - 依赖：安装`pdf-image` npm包
  ```bash
  npm install pdf-image
  ```

- [ ] **生成并存储缩略图**
  ```typescript
  async generateThumbnail(pdfUrl: string): Promise<string> {
    // 1. 下载PDF
    // 2. 使用pdf.js提取第一页
    // 3. 转换为JPEG（压缩80%）
    // 4. 存储到MongoDB或文件系统
    // 5. 返回URL
  }
  ```

- [ ] **批量生成现有资源的缩略图**
  - 脚本：`backend/src/scripts/generate-thumbnails.ts`
  - 对所有type=paper的资源生成
  - 进度条显示

**前端显示**:
- [ ] **更新资源卡片组件**
  - 位置：`frontend/app/page.tsx`（ResourceCard部分）
  - 左侧显示缩略图（固定宽度120px）
  - 失败时显示占位图标
  ```typescript
  <div className="flex gap-4">
    <div className="w-30 h-40 flex-shrink-0">
      {resource.thumbnailUrl ? (
        <img
          src={resource.thumbnailUrl}
          alt={resource.title}
          className="w-full h-full object-cover rounded"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
          <FileIcon />
        </div>
      )}
    </div>
    <div className="flex-1">
      {/* 标题、摘要等 */}
    </div>
  </div>
  ```

**验收标准**:
- ✓ 所有Paper类型资源都有缩略图
- ✓ 缩略图清晰可读
- ✓ 加载失败有占位符
- ✓ 点击缩略图放大预览

---

### 3. 卡片元数据（Day 3）

- [ ] **添加统计数据API**
  - 路由：`GET /api/v1/resources/:id/stats`
  - 返回：
  ```typescript
  {
    views: number,      // 浏览次数
    bookmarks: number,  // 收藏次数
    forks: number,      // Fork次数（GitHub）
    citations: number   // 引用次数（Paper）
  }
  ```

- [ ] **创建统计表**
  ```sql
  CREATE TABLE resource_stats (
    resource_id TEXT PRIMARY KEY,
    views INT DEFAULT 0,
    bookmarks INT DEFAULT 0,
    forks INT DEFAULT 0,
    citations INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **更新卡片UI**
  - 显示图标+数字（📊 1,470  🔄 2  👍 71）
  - 日期显示（04 Nov 2025）
  - 标签显示（从categories提取）

**验收标准**:
- ✓ 每个卡片都显示统计数据
- ✓ 数字格式化（1.2k, 1.5M）
- ✓ 标签最多显示3个

---

### 4. 右侧AI面板（Day 4-5）

**后端优化**:
- [ ] **确保Grok API可用**
  - 测试：`ai-service/routers/ai.py`
  - 路由：`POST /api/v1/ai/chat`
  - 参数：
  ```json
  {
    "messages": [...],
    "model": "grok",
    "stream": true,
    "context": {
      "resourceId": "xxx",
      "title": "...",
      "abstract": "..."
    }
  }
  ```

- [ ] **添加流式响应**
  - SSE（Server-Sent Events）
  - 前端实时显示

**前端实现**:
- [ ] **重构AI面板组件**
  - 位置：`frontend/app/page.tsx`（AI Interaction Panel部分）
  - 默认显示"Ask Grok anything..."
  - 选中资源时自动加载上下文

- [ ] **添加模型切换器**
  ```typescript
  <select
    value={selectedModel}
    onChange={(e) => setSelectedModel(e.target.value)}
  >
    <option value="grok">Grok (Fast & Free)</option>
    <option value="gpt-4">GPT-4 (Powerful)</option>
  </select>
  ```

- [ ] **快速操作按钮**
  ```typescript
  <div className="quick-actions">
    <button onClick={() => askAI("Summarize this paper")}>
      📝 Summary
    </button>
    <button onClick={() => askAI("What are the key insights?")}>
      💡 Insights
    </button>
    <button onClick={() => askAI("Explain the methodology")}>
      🔬 Methodology
    </button>
  </div>
  ```

- [ ] **流式输出显示**
  ```typescript
  useEffect(() => {
    const eventSource = new EventSource('/api/ai/chat-stream');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAiMessages(prev => [...prev.slice(0, -1), {
        ...prev[prev.length - 1],
        content: prev[prev.length - 1].content + data.delta
      }]);
    };
  }, []);
  ```

**验收标准**:
- ✓ 默认显示Grok
- ✓ 可切换到GPT-4
- ✓ 流式输出显示
- ✓ 快速操作可用
- ✓ 历史记录保存

---

## 🎯 导航页面实现（P1）- Day 6-8

### 5. My Library页面（Day 6）

- [ ] **后端API**
  - `GET /api/v1/bookmarks` - 获取用户收藏
  - `DELETE /api/v1/bookmarks/:id` - 删除收藏
  - `POST /api/v1/bookmarks/export` - 导出（Markdown/BibTeX）

- [ ] **前端页面**
  - 文件：`frontend/app/library/page.tsx`
  - 功能：
    - 显示所有收藏（复用ResourceCard组件）
    - 筛选器：All | Papers | Projects | News
    - 排序：Latest | Title | Date Added
    - 批量操作：Delete | Export

**UI布局**:
```
┌────────────────────────────────────────┐
│  My Library (23 items)     [Export ▼] │
├────────────────────────────────────────┤
│  [All] [Papers] [Projects] [News]      │
│  Sort: [Latest ▼]                      │
├────────────────────────────────────────┤
│  ┌──────────────────────────────────┐ │
│  │ [✓] Paper Card 1                  │ │
│  │ [✓] Paper Card 2                  │ │
│  │ [✓] Project Card 1                │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

### 6. Notifications页面（Day 6）

- [ ] **创建通知表**
  ```sql
  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT, -- 'new_paper', 'trending', 'mention'
    title TEXT,
    content TEXT,
    resource_id TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **前端页面**
  - 文件：`frontend/app/notifications/page.tsx`
  - 功能：
    - 显示所有通知
    - 标记为已读
    - 清空所有

**通知类型**:
1. 新论文推荐："基于你的兴趣，推荐5篇新论文"
2. 热门内容："你收藏的论文获得100个赞"
3. 系统消息："数据库更新完成"

---

### 7. Profile页面（Day 7）

- [ ] **前端页面**
  - 文件：`frontend/app/profile/page.tsx`
  - 功能：
    - 用户信息编辑
    - 偏好设置（主题、语言、通知）
    - 统计数据（收藏数、阅读数）
    - API密钥管理

**UI布局**:
```
┌────────────────────────────────────────┐
│  Profile                               │
├────────────────────────────────────────┤
│  Avatar:  [📷 Upload]                  │
│  Name:    [Input field]                │
│  Email:   [Input field]                │
│                                        │
│  Preferences:                          │
│  Theme:   ○ Light  ● Dark  ○ Auto     │
│  Lang:    [English ▼]                  │
│                                        │
│  Statistics:                           │
│  📚 Bookmarks: 23                      │
│  👁️ Views: 1,234                       │
│  🎯 Interests: 5 topics                │
└────────────────────────────────────────┘
```

---

### 8. Labs和Feedback页面（Day 7）

**Labs页面**:
- 实验性功能展示
- 知识图谱可视化（预览）
- 趋势分析（预览）

**Feedback页面**:
- 简单表单
- 问题类型：Bug | Feature Request | General
- 提交到后端或GitHub Issues

---

## 🚀 智能推荐（P1）- Day 9-11

### 9. 向量嵌入和推荐算法（Day 9）

- [ ] **生成资源嵌入**
  - 脚本：`backend/src/scripts/generate-embeddings.ts`
  - 对所有资源生成embedding
  - 存储到Qdrant

- [ ] **实现推荐API**
  - 路由：`GET /api/v1/recommendations`
  - 算法：
  ```typescript
  async getRecommendations(userId: string) {
    // 1. 获取用户收藏的资源
    const bookmarks = await this.getBookmarks(userId);

    // 2. 提取标签和embedding
    const tags = extractTags(bookmarks);
    const avgEmbedding = averageEmbeddings(bookmarks);

    // 3. 向量搜索
    const similar = await this.qdrant.search(avgEmbedding, 50);

    // 4. 过滤已收藏
    const filtered = similar.filter(x => !bookmarks.includes(x.id));

    // 5. 多样性调整
    return diversify(filtered, 10);
  }
  ```

---

### 10. 筛选和排序（Day 10）

- [ ] **添加筛选UI**
  ```typescript
  <div className="filters">
    {/* 类型筛选 */}
    <select value={typeFilter}>
      <option value="all">All Types</option>
      <option value="paper">Papers</option>
      <option value="project">Projects</option>
      <option value="news">News</option>
    </select>

    {/* 时间筛选 */}
    <select value={timeFilter}>
      <option value="all">All Time</option>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
    </select>

    {/* 标签筛选 */}
    <div className="tags">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={selectedTags.includes(tag) ? 'active' : ''}
        >
          {tag}
        </button>
      ))}
    </div>
  </div>
  ```

- [ ] **添加排序UI**
  ```typescript
  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="hot">🔥 Hot</option>
    <option value="latest">🆕 Latest</option>
    <option value="views">👁️ Most Viewed</option>
    <option value="bookmarks">💾 Most Bookmarked</option>
  </select>
  ```

---

### 11. 标签自动提取（Day 11）

- [ ] **使用AI提取标签**
  - 对现有资源调用Grok提取3-5个关键标签
  - 脚本：`backend/src/scripts/extract-tags.ts`
  ```typescript
  async extractTags(resource: Resource) {
    const prompt = `Extract 3-5 key technical tags from this content:
    Title: ${resource.title}
    Abstract: ${resource.abstract}

    Return only tags separated by commas.`;

    const response = await this.grok.chat([
      { role: "user", content: prompt }
    ]);

    const tags = response.split(',').map(t => t.trim());
    return tags;
  }
  ```

- [ ] **更新资源模型**
  - 添加tags字段到Resource表
  - 创建Tags表（多对多关系）

---

## 🎨 UI优化（P2）- Day 12-13

### 12. 响应式设计

- [ ] **移动端适配**
  - 侧边栏在移动端自动折叠
  - 卡片在小屏幕上单列显示
  - AI面板在移动端底部弹出

- [ ] **平板适配**
  - 侧边栏可折叠
  - 卡片两列显示

---

### 13. 加载状态和错误处理

- [ ] **Skeleton Loading**
  - 卡片加载骨架屏
  - 搜索建议加载状态

- [ ] **错误提示**
  - Toast通知（成功、警告、错误）
  - 网络错误重试机制

---

### 14. 性能优化

- [ ] **虚拟滚动**
  - 使用react-window优化长列表
  - 只渲染可见区域的卡片

- [ ] **图片懒加载**
  - PDF缩略图懒加载
  - Intersection Observer

- [ ] **API缓存**
  - React Query缓存
  - SWR策略

---

## 🧪 测试和部署（P2）- Day 14

### 15. 测试

- [ ] **E2E测试**
  - 搜索流程
  - 收藏流程
  - AI对话流程

- [ ] **单元测试**
  - 推荐算法
  - 搜索建议
  - 标签提取

---

### 16. 部署准备

- [ ] **环境变量配置**
  - 所有API密钥移到secretManager
  - 环境区分（dev/staging/prod）

- [ ] **Docker配置**
  - 更新docker-compose.yml
  - 添加健康检查

- [ ] **文档更新**
  - README.md
  - API文档
  - 部署指南

---

## 📊 验收标准

### MVP-1.0（Week 2结束）

**必须完成**:
- ✅ 所有导航页面可访问
- ✅ 搜索建议可用（<500ms）
- ✅ PDF缩略图显示（>50%）
- ✅ Grok AI可用
- ✅ 收藏功能完整

**性能指标**:
- 首页加载：<2s
- 搜索响应：<500ms
- AI回复：<5s

### MVP-2.0（Week 4结束）

**必须完成**:
- ✅ 个性化推荐可用
- ✅ 筛选排序完整
- ✅ 标签系统运行
- ✅ 导出功能可用

**性能指标**:
- 推荐准确率：>60%
- 页面响应：<1s
- AI回复：<3s

---

## 🎯 每日工作流

**每天开始**:
1. 查看TODO，选择今日任务
2. 创建新分支：`git checkout -b feature/task-name`
3. 开发并测试
4. 提交：`git commit -m "feat: task description"`
5. 合并到main：`git merge feature/task-name`

**每天结束**:
1. 更新TODO状态
2. 推送代码
3. 记录问题和想法

---

**开始日期**: 2025-11-09
**预计完成**: 2025-11-23（2周）
**当前进度**: 5%（数据调查完成）
