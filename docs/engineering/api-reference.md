# API Reference - Content Enhancement Features

## 概述

本文档详细说明内容增强功能的所有 API 端点，包括笔记和评论系统。

**Base URL:** `http://localhost:4000/api/v1`

**认证:** JWT Bearer Token (待集成)

## Notes API

### 1. 创建笔记

**端点:** `POST /notes`

**描述:** 为资源创建新笔记

**请求体:**

```json
{
  "resourceId": "resource-uuid",
  "title": "My Study Notes",
  "content": "# Chapter 1\n\nSome notes...",
  "highlights": [
    {
      "text": "Important concept",
      "color": "yellow",
      "position": {
        "page": 1,
        "startOffset": 100,
        "endOffset": 120
      },
      "note": "This is key!"
    }
  ],
  "tags": ["machine-learning", "deep-learning"]
}
```

**响应:** `201 Created`

```json
{
  "id": "note-uuid",
  "userId": "user-uuid",
  "resourceId": "resource-uuid",
  "title": "My Study Notes",
  "content": "# Chapter 1\n\nSome notes...",
  "highlights": [...],
  "tags": ["machine-learning", "deep-learning"],
  "aiInsights": null,
  "graphNodes": [],
  "createdAt": "2025-11-09T10:00:00Z",
  "updatedAt": "2025-11-09T10:00:00Z",
  "resource": {
    "id": "resource-uuid",
    "title": "Resource Title",
    "type": "PDF"
  }
}
```

**错误响应:**

```json
{
  "statusCode": 400,
  "message": "Resource not found",
  "error": "Bad Request"
}
```

---

### 2. 获取用户所有笔记

**端点:** `GET /notes/my`

**描述:** 获取当前用户的所有笔记

**查询参数:**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| page | number | 否 | 页码（默认: 1） |
| limit | number | 否 | 每页数量（默认: 20） |
| sort | string | 否 | 排序字段（updatedAt, createdAt, title） |
| order | string | 否 | 排序顺序（asc, desc，默认: desc） |
| resourceId | string | 否 | 过滤特定资源 |
| tag | string | 否 | 过滤特定标签 |

**示例请求:**

```
GET /notes/my?page=1&limit=10&sort=updatedAt&order=desc
```

**响应:** `200 OK`

```json
{
  "data": [
    {
      "id": "note-uuid-1",
      "title": "Chapter 1 Notes",
      "content": "...",
      "createdAt": "2025-11-09T10:00:00Z",
      "updatedAt": "2025-11-09T11:00:00Z",
      "resource": {
        "id": "resource-uuid",
        "title": "Resource Title",
        "type": "PDF"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### 3. 获取单个笔记

**端点:** `GET /notes/:id`

**描述:** 获取笔记详细信息

**路径参数:**

- `id`: 笔记ID

**响应:** `200 OK`

```json
{
  "id": "note-uuid",
  "userId": "user-uuid",
  "resourceId": "resource-uuid",
  "title": "My Study Notes",
  "content": "# Chapter 1\n\nSome notes...",
  "highlights": [
    {
      "text": "Important concept",
      "color": "yellow",
      "position": {
        "page": 1,
        "startOffset": 100,
        "endOffset": 120
      },
      "note": "This is key!"
    }
  ],
  "tags": ["machine-learning"],
  "aiInsights": {
    "explanations": [
      {
        "text": "Important concept",
        "explanation": "AI explanation here...",
        "timestamp": "2025-11-09T10:30:00Z"
      }
    ]
  },
  "graphNodes": [
    {
      "id": "node-uuid",
      "label": "Neural Networks",
      "type": "CONCEPT"
    }
  ],
  "createdAt": "2025-11-09T10:00:00Z",
  "updatedAt": "2025-11-09T11:00:00Z",
  "resource": {
    "id": "resource-uuid",
    "title": "Resource Title",
    "type": "PDF",
    "url": "https://..."
  }
}
```

**错误响应:**

```json
{
  "statusCode": 404,
  "message": "Note not found",
  "error": "Not Found"
}
```

---

### 4. 更新笔记

**端点:** `PATCH /notes/:id`

**描述:** 更新笔记内容

**路径参数:**

- `id`: 笔记ID

**请求体:** (所有字段可选)

```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "highlights": [...],
  "tags": ["new-tag"]
}
```

**响应:** `200 OK`

```json
{
  "id": "note-uuid",
  "title": "Updated Title",
  "content": "Updated content...",
  "updatedAt": "2025-11-09T12:00:00Z",
  ...
}
```

---

### 5. 删除笔记

**端点:** `DELETE /notes/:id`

**描述:** 删除笔记（硬删除）

**路径参数:**

- `id`: 笔记ID

**响应:** `200 OK`

```json
{
  "message": "Note deleted successfully"
}
```

---

### 6. 请求AI解释

**端点:** `POST /notes/:id/ai/explain`

**描述:** 请求AI对选中文本进行解释

**路径参数:**

- `id`: 笔记ID

**请求体:**

```json
{
  "text": "Neural networks are computational models...",
  "context": "Machine learning chapter"
}
```

**响应:** `200 OK`

```json
{
  "explanation": "Neural networks are inspired by biological neurons...",
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**错误响应:**

```json
{
  "statusCode": 503,
  "message": "AI service unavailable",
  "error": "Service Unavailable"
}
```

---

### 7. 关联知识图谱节点

**端点:** `POST /notes/:id/graph/link`

**描述:** 关联笔记与知识图谱节点

**路径参数:**

- `id`: 笔记ID

**请求体:**

```json
{
  "nodeId": "node-uuid",
  "relationship": "DISCUSSES"
}
```

**响应:** `200 OK`

```json
{
  "noteId": "note-uuid",
  "nodeId": "node-uuid",
  "relationship": "DISCUSSES",
  "createdAt": "2025-11-09T10:30:00Z"
}
```

---

### 8. 取消关联知识图谱节点

**端点:** `DELETE /notes/:id/graph/link/:nodeId`

**描述:** 取消笔记与知识图谱节点的关联

**路径参数:**

- `id`: 笔记ID
- `nodeId`: 节点ID

**响应:** `200 OK`

```json
{
  "message": "Node unlinked successfully"
}
```

---

### 9. 搜索笔记

**端点:** `GET /notes/search`

**描述:** 全文搜索笔记

**查询参数:**

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**示例请求:**

```
GET /notes/search?q=neural+networks&page=1&limit=10
```

**响应:** `200 OK`

```json
{
  "data": [
    {
      "id": "note-uuid",
      "title": "Neural Networks Notes",
      "content": "...neural networks...",
      "matchScore": 0.95,
      "highlights": [
        {
          "field": "content",
          "matched": "...neural networks are..."
        }
      ]
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 10
}
```

---

## Comments API

### 1. 创建评论

**端点:** `POST /comments`

**描述:** 创建新评论或回复

**请求体:**

```json
{
  "resourceId": "resource-uuid",
  "content": "This is a great resource!",
  "parentId": "parent-comment-uuid"  // 可选，回复时提供
}
```

**响应:** `201 Created`

```json
{
  "id": "comment-uuid",
  "userId": "user-uuid",
  "resourceId": "resource-uuid",
  "content": "This is a great resource!",
  "parentId": null,
  "upvoteCount": 0,
  "replyCount": 0,
  "isEdited": false,
  "isDeleted": false,
  "createdAt": "2025-11-09T10:00:00Z",
  "updatedAt": "2025-11-09T10:00:00Z",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "fullName": "John Doe",
    "avatarUrl": "https://..."
  }
}
```

**错误响应:**

```json
{
  "statusCode": 400,
  "message": "Parent comment not found",
  "error": "Bad Request"
}
```

---

### 2. 获取资源评论

**端点:** `GET /comments/resource/:resourceId`

**描述:** 获取资源的所有评论（树形结构，3层嵌套）

**路径参数:**

- `resourceId`: 资源ID

**响应:** `200 OK`

```json
[
  {
    "id": "comment-1",
    "content": "Great resource!",
    "upvoteCount": 5,
    "replyCount": 2,
    "createdAt": "2025-11-09T10:00:00Z",
    "user": {
      "username": "john_doe",
      "avatarUrl": "https://..."
    },
    "replies": [
      {
        "id": "comment-2",
        "content": "I agree!",
        "upvoteCount": 2,
        "replyCount": 1,
        "createdAt": "2025-11-09T10:05:00Z",
        "user": {
          "username": "jane_smith"
        },
        "replies": [
          {
            "id": "comment-3",
            "content": "Me too!",
            "upvoteCount": 1,
            "replyCount": 0,
            "createdAt": "2025-11-09T10:10:00Z",
            "user": {
              "username": "bob_wilson"
            },
            "replies": []
          }
        ]
      }
    ]
  }
]
```

---

### 3. 获取单个评论

**端点:** `GET /comments/:id`

**描述:** 获取评论详细信息

**路径参数:**

- `id`: 评论ID

**响应:** `200 OK`

```json
{
  "id": "comment-uuid",
  "userId": "user-uuid",
  "resourceId": "resource-uuid",
  "content": "Great resource!",
  "parentId": null,
  "upvoteCount": 5,
  "replyCount": 2,
  "isEdited": false,
  "isDeleted": false,
  "createdAt": "2025-11-09T10:00:00Z",
  "updatedAt": "2025-11-09T10:00:00Z",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "fullName": "John Doe",
    "avatarUrl": "https://..."
  },
  "resource": {
    "id": "resource-uuid",
    "title": "Resource Title"
  }
}
```

---

### 4. 更新评论

**端点:** `PATCH /comments/:id`

**描述:** 更新评论内容（仅所有者）

**路径参数:**

- `id`: 评论ID

**请求体:**

```json
{
  "content": "Updated comment content"
}
```

**响应:** `200 OK`

```json
{
  "id": "comment-uuid",
  "content": "Updated comment content",
  "isEdited": true,
  "updatedAt": "2025-11-09T11:00:00Z",
  ...
}
```

**错误响应:**

```json
{
  "statusCode": 403,
  "message": "You are not the owner of this comment",
  "error": "Forbidden"
}
```

---

### 5. 删除评论

**端点:** `DELETE /comments/:id`

**描述:** 软删除评论（仅所有者或管理员）

**路径参数:**

- `id`: 评论ID

**响应:** `200 OK`

```json
{
  "message": "Comment deleted successfully"
}
```

**注意:** 软删除后：
- `isDeleted` = true
- `content` = "[此评论已被删除]"
- 子回复仍可见

---

### 6. 点赞评论

**端点:** `POST /comments/:id/upvote`

**描述:** 给评论点赞

**路径参数:**

- `id`: 评论ID

**响应:** `200 OK`

```json
{
  "upvoteCount": 6
}
```

**注意:**
- 用户只能点赞一次（需要记录在用户-评论关系表）
- 目前实现为简单计数器

---

### 7. 获取评论统计

**端点:** `GET /comments/resource/:resourceId/stats`

**描述:** 获取资源的评论统计信息

**路径参数:**

- `resourceId`: 资源ID

**响应:** `200 OK`

```json
{
  "total": 25,       // 总评论数
  "topLevel": 10,    // 顶层评论数
  "replies": 15      // 回复数
}
```

---

## 数据类型定义

### Highlight

```typescript
interface Highlight {
  text: string;           // 高亮文本
  color: string;          // 颜色（yellow, green, blue, red, purple）
  position: {
    page?: number;        // PDF 页码
    startOffset: number;  // 起始偏移
    endOffset: number;    // 结束偏移
  };
  note?: string;          // 高亮备注
}
```

### AIInsights

```typescript
interface AIInsights {
  explanations: Array<{
    text: string;         // 原文本
    explanation: string;  // AI解释
    timestamp: string;    // ISO 8601
  }>;
  summary?: string;       // 笔记摘要
  keywords?: string[];    // 关键词
}
```

### GraphNode

```typescript
interface GraphNode {
  id: string;             // Neo4j 节点ID
  label: string;          // 节点标签
  type: string;           // 节点类型（CONCEPT, PERSON, THEORY等）
  properties?: object;    // 节点属性
}
```

---

## 错误代码

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复创建） |
| 500 | 服务器内部错误 |
| 503 | 服务不可用（如AI服务） |

---

## 认证

**当前状态:** 使用 mock user ID

**计划实现:** JWT Bearer Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**认证流程:**

1. 用户登录获取 JWT token
2. 所有请求携带 token 在 Authorization header
3. 后端验证 token 并提取 userId
4. 根据 userId 进行权限控制

---

## 速率限制

**计划实现:**

- 创建笔记: 100次/小时
- 创建评论: 50次/小时
- AI解释请求: 20次/小时
- 其他读取操作: 1000次/小时

---

## WebSocket 事件（计划）

### 实时评论更新

```javascript
// 订阅资源评论
socket.emit('subscribe:comments', { resourceId: 'resource-uuid' });

// 接收新评论
socket.on('comment:new', (comment) => {
  console.log('New comment:', comment);
});

// 接收评论更新
socket.on('comment:updated', (comment) => {
  console.log('Comment updated:', comment);
});

// 接收评论删除
socket.on('comment:deleted', (commentId) => {
  console.log('Comment deleted:', commentId);
});
```

---

## 测试示例

### cURL 示例

```bash
# 创建笔记
curl -X POST http://localhost:4000/api/v1/notes \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "resource-uuid",
    "title": "My Notes",
    "content": "# Chapter 1\n\nNotes here..."
  }'

# 获取用户笔记
curl http://localhost:4000/api/v1/notes/my

# 创建评论
curl -X POST http://localhost:4000/api/v1/comments \
  -H "Content-Type: application/json" \
  -d '{
    "resourceId": "resource-uuid",
    "content": "Great resource!"
  }'

# 获取资源评论
curl http://localhost:4000/api/v1/comments/resource/resource-uuid
```

### JavaScript/Fetch 示例

```javascript
// 创建笔记
const createNote = async () => {
  const response = await fetch('http://localhost:4000/api/v1/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer token'
    },
    body: JSON.stringify({
      resourceId: 'resource-uuid',
      title: 'My Notes',
      content: '# Chapter 1\n\nNotes here...'
    })
  });

  const note = await response.json();
  console.log(note);
};

// 获取评论
const getComments = async (resourceId) => {
  const response = await fetch(
    `http://localhost:4000/api/v1/comments/resource/${resourceId}`
  );
  const comments = await response.json();
  console.log(comments);
};
```

---

## 版本历史

- **v1.0** (2025-11-09): 初始版本
  - Notes API (9个端点)
  - Comments API (7个端点)
  - 基础认证（mock）

---

## 相关文档

- [Week 2 实现总结 - 笔记系统](./week2-notes-implementation.md)
- [Week 3 实现总结 - 评论系统](./week3-comments-implementation.md)
- [Week 4 实现总结 - 集成](./week4-integration-implementation.md)
- [测试指南](./testing-guide.md)
- [部署指南](./deployment-guide.md)
