# DeepDive Engine - MVP实施计划

> **版本**: MVP v1.0-2.0
> **参考设计**: AlphaXiv (https://www.alphaxiv.org/)
> **目标**: 2周内完成可用的AI驱动知识发现平台
> **创建日期**: 2025-11-09

---

## 产品定位（聚焦版）

**DeepDive Engine** = AlphaXiv + Grok AI + 个性化推荐

**核心价值**:
- 📄 聚合Papers/Projects/News
- 🤖 Grok AI智能问答和摘要
- 🎯 个性化收藏和推荐
- 🔍 智能搜索和筛选

---

## MVP-1.0：基础可用（Week 1-2）

### 功能清单

#### 1. 左侧导航（完整实现）

**已有**:
- ✓ Explore（主页）
- ✓ My Library
- ✓ Notifications
- ✓ Profile
- ✓ Labs
- ✓ Feedback
- ✓ Dark mode
- ✓ 侧边栏折叠

**需补充**:
- ❌ 各页面的实际功能实现
- ❌ Notifications的消息提醒
- ❌ Profile的用户设置

#### 2. 智能搜索框（参考AlphaXiv）

**功能要求**:
```
┌─────────────────────────────────────────┐
│ ∞ agent ▼  │ AI                        │
│             └─────────────────────────  │
│                                    🔄📎⬆│
└─────────────────────────────────────────┘
     ↓ 用户输入时动态显示
┌─────────────────────────────────────────┐
│ Papers                                   │
│ • Constitutional AI: Harmlessness...    │
│ • Towards an AI-Augmented Textbook      │
│ • Kosmos: An AI Scientist for Auto...   │
│                                          │
│ Loading suggestions...                  │
└─────────────────────────────────────────┘
```

**技术实现**:
- Agent模式切换（agent/search）
- 实时搜索建议（debounce 300ms）
- 向量搜索匹配（top 5）
- 历史记录（localStorage）

#### 3. 论文卡片（带缩略图）

**卡片布局**:
```
┌─────────────────────────────────────────────┐
│ 📊 1,470 ⬆   04 Nov 2025                    │
│                                              │
│ [PDF缩略图]     Kosmos: An AI Scientist     │
│   预览图        for Autonomous Discovery    │
│  (左侧)                                      │
│               Abstract: Edison Scientific   │
│               Inc. developed Kosmos...       │
│                                              │
│               🏷️ agentic-frameworks agents  │
│               💾 Bookmark ▼  🔄 2  👍 71    │
└─────────────────────────────────────────────┘
```

**数据展示**:
- PDF缩略图（第一页截图）
- 阅读数/引用数
- 发布日期
- 标签（自动提取）
- 互动按钮（Bookmark, Fork, Like）

#### 4. 右侧AI面板（Grok默认）

**功能**:
- Tab切换：Assistant | Notes | Comments | Similar
- Assistant默认显示Grok
- 快速操作：Summary, Insights, Q&A
- 模型切换：Grok | GPT-4

**交互流程**:
```
用户选择论文 →
  自动加载到AI面板 →
    显示"Ask Grok anything about this paper" →
      用户提问 →
        Grok回答（流式输出）
```

---

## MVP-2.0：智能推荐（Week 3-4）

### 功能清单

#### 1. My Library（收藏管理）

**功能**:
- 查看所有收藏的资源
- 智能分类（AI自动打标签）
- 按标签/类型/时间筛选
- 导出功能（Markdown/BibTeX）

#### 2. 个性化推荐

**推荐策略**:
```python
def recommend(user_id):
    # 1. 基于收藏的标签
    tags = get_user_bookmarked_tags(user_id)

    # 2. 向量相似度匹配
    embeddings = get_user_interests_embedding(user_id)
    similar = vector_search(embeddings, top_k=20)

    # 3. 热度衰减
    scored = []
    for item in similar:
        score = (
            0.4 * similarity_score +
            0.3 * quality_score +
            0.2 * recency_score +
            0.1 * diversity_score
        )
        scored.append((item, score))

    return sorted(scored, key=lambda x: x[1], reverse=True)[:10]
```

#### 3. 筛选和排序

**筛选维度**:
- 类型：Papers | Projects | News
- 时间：Today | Week | Month | Year
- 标签：AI/ML, Web Dev, Cloud等
- 难度：Beginner | Intermediate | Advanced

**排序方式**:
- Hot（综合评分）
- Latest（最新）
- Most Viewed（最多阅读）
- Most Bookmarked（最多收藏）

---

## 界面设计规范

### 配色方案（参考AlphaXiv）

```css
/* 主题色 */
--primary: #991B1B;      /* 深红色 */
--primary-light: #FEE2E2;
--primary-dark: #7F1D1D;

/* 中性色 */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-500: #6B7280;
--gray-900: #111827;

/* 语义色 */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
```

### 组件规范

**卡片阴影**:
```css
box-shadow: 0 1px 3px rgba(0,0,0,0.1);
hover: box-shadow: 0 4px 6px rgba(0,0,0,0.1);
```

**圆角**:
- 小组件：4px
- 卡片：8px
- 模态框：12px

**间距**:
- 卡片间距：16px
- 内边距：12px (小) | 16px (中) | 24px (大)

---

## 技术实现要点

### 1. PDF缩略图生成

**方案**:
```typescript
// 使用pdf.js生成缩略图
async function generateThumbnail(pdfUrl: string) {
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 0.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}
```

**存储**:
- 生成后存储到MongoDB（Base64或URL）
- CDN加速（可选）

### 2. 智能搜索建议

**后端API**:
```typescript
// GET /api/search/suggestions?q=AI&limit=5
async searchSuggestions(query: string, limit = 5) {
  // 1. 向量搜索
  const embedding = await this.embeddingService.embed(query);
  const vectorResults = await this.qdrant.search(embedding, limit * 2);

  // 2. 全文搜索
  const textResults = await this.prisma.resource.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { abstract: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit * 2
  });

  // 3. 合并去重
  const merged = this.mergeAndRank(vectorResults, textResults);
  return merged.slice(0, limit);
}
```

**前端实现**:
```typescript
const [suggestions, setSuggestions] = useState([]);
const debouncedSearch = useMemo(
  () => debounce(async (q) => {
    if (q.length < 2) return;
    const res = await fetch(`/api/search/suggestions?q=${q}`);
    const data = await res.json();
    setSuggestions(data);
  }, 300),
  []
);
```

### 3. Grok集成

**配置**:
```typescript
// ai-service/services/grok_client.py
class GrokClient:
    def __init__(self):
        self.api_key = get_secret("GROK_API_KEY")
        self.base_url = "https://api.x.ai/v1"
        self.model = "grok-beta"

    async def chat(self, messages, stream=True):
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=stream,
            temperature=0.7,
            max_tokens=2000
        )
        return response
```

**前端使用**:
```typescript
async function askGrok(question: string, context: Resource) {
  const messages = [
    {
      role: "system",
      content: "You are a helpful AI assistant analyzing academic papers."
    },
    {
      role: "user",
      content: `Based on this paper:\n\nTitle: ${context.title}\nAbstract: ${context.abstract}\n\nQuestion: ${question}`
    }
  ];

  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, model: 'grok' })
  });

  return response.body; // Stream
}
```

---

## 数据修复任务

### 问题1: raw_data缺少resourceId

**脚本已有**: `backend/src/scripts/link-raw-data.ts`

**执行**:
```bash
cd backend
npx ts-node src/scripts/link-raw-data.ts
```

### 问题2: GitHub数据缺少title

**修复方案**:
```typescript
// 使用fullName或name作为title
await prisma.resource.updateMany({
  where: {
    type: 'project',
    title: null
  },
  data: {
    // 从rawData中提取
  }
});
```

### 问题3: 重复数据清理

**去重逻辑**:
- arXiv: 基于externalId（arXiv ID）
- GitHub: 基于fullName
- HackerNews: 基于id

---

## 关键指标

| 指标 | MVP-1.0目标 | MVP-2.0目标 |
|-----|------------|------------|
| 功能完成度 | 80% | 100% |
| 页面响应时间 | <2s | <1s |
| AI回复速度 | <5s | <3s |
| 搜索建议延迟 | <500ms | <300ms |
| PDF缩略图覆盖率 | 50% | 80% |

---

**下一步**: 查看TODO任务清单（TODO.md）
