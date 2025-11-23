# GCP Secret Manager 配置指南

## 概述

DeepDive AI Service 支持从 Google Cloud Platform (GCP) Secret Manager 获取 API 密钥，确保密钥安全管理。

## 前提条件

1. 拥有 GCP 账号和项目
2. 已安装 `gcloud` CLI
3. 已创建 GCP Service Account（用于应用访问）

## 配置步骤

### 1. 安装依赖

```bash
cd ai-service
pip install -r requirements.txt
```

这会安装 `google-cloud-secret-manager==2.20.2`

### 2. 在 GCP Secret Manager 中创建密钥

使用 `gcloud` CLI 或 GCP Console 创建以下密钥：

#### 方法 A: 使用 gcloud CLI

```bash
# 设置项目 ID
export PROJECT_ID="your-gcp-project-id"

# 创建 GROK_API_KEY 密钥
echo -n "your-actual-grok-api-key" | gcloud secrets create GROK_API_KEY \
    --data-file=- \
    --project=$PROJECT_ID

# 创建 OPENAI_API_KEY 密钥
echo -n "your-actual-openai-api-key" | gcloud secrets create OPENAI_API_KEY \
    --data-file=- \
    --project=$PROJECT_ID
```

#### 方法 B: 使用 GCP Console

1. 访问 [GCP Secret Manager Console](https://console.cloud.google.com/security/secret-manager)
2. 点击 "CREATE SECRET"
3. 创建以下密钥：
   - Name: `GROK_API_KEY`
   - Secret value: 你的 Grok API 密钥
4. 重复步骤创建 `OPENAI_API_KEY`

### 3. 配置 Service Account 权限

为应用的 Service Account 授予访问 Secret Manager 的权限：

```bash
# 设置变量
export PROJECT_ID="your-gcp-project-id"
export SERVICE_ACCOUNT="your-service-account@your-project.iam.gserviceaccount.com"

# 授予 Secret Manager Secret Accessor 角色
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
```

### 4. 配置应用凭证

#### 方法 A: 使用 Service Account Key（开发环境）

1. 下载 Service Account Key JSON 文件：

```bash
gcloud iam service-accounts keys create ~/deepdive-sa-key.json \
    --iam-account=$SERVICE_ACCOUNT
```

2. 设置环境变量：

```bash
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/deepdive-sa-key.json"
```

#### 方法 B: 使用 Application Default Credentials（推荐生产环境）

在 GCP 环境（如 Cloud Run, GKE）中运行时，会自动使用 Application Default Credentials。

### 5. 更新 .env 配置

编辑 `ai-service/.env` 文件：

```env
# 启用 GCP Secret Manager
USE_GCP_SECRET_MANAGER=true

# 设置 GCP 项目 ID
GCP_PROJECT_ID=your-gcp-project-id

# （可选）指定 Service Account Key 路径
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 6. 验证配置

启动 AI 服务并检查日志：

```bash
cd ai-service
python main.py
```

查看日志输出：

- ✅ 成功: `GCP Secret Manager initialized (project: your-project-id)`
- ✅ 成功: `Retrieved secret GROK_API_KEY from GCP Secret Manager`
- ❌ 失败: `Failed to initialize GCP Secret Manager: ...`

## 故障排查

### 问题 1: 认证失败

**错误**: `Failed to initialize GCP Secret Manager: 403 Permission denied`

**解决方案**:

1. 确认 Service Account 有 `roles/secretmanager.secretAccessor` 角色
2. 确认 `GOOGLE_APPLICATION_CREDENTIALS` 指向正确的 key 文件
3. 运行 `gcloud auth application-default login` （开发环境）

### 问题 2: 密钥不存在

**错误**: `Failed to get secret GROK_API_KEY from GCP: 404 Secret not found`

**解决方案**:

1. 确认密钥名称拼写正确（区分大小写）
2. 确认项目 ID 正确
3. 使用 `gcloud secrets list --project=your-project-id` 查看所有密钥

### 问题 3: 库未安装

**错误**: `google-cloud-secret-manager not installed`

**解决方案**:

```bash
pip install google-cloud-secret-manager==2.20.2
```

## 本地开发

如果不想在本地配置 GCP，可以使用环境变量：

1. 设置 `USE_GCP_SECRET_MANAGER=false`
2. 在 `.env` 文件中直接配置密钥：

```env
USE_GCP_SECRET_MANAGER=false
GROK_API_KEY=your-actual-grok-key
OPENAI_API_KEY=your-actual-openai-key
```

## 密钥轮换

更新 GCP Secret Manager 中的密钥：

```bash
# 创建新版本
echo -n "new-api-key" | gcloud secrets versions add GROK_API_KEY \
    --data-file=- \
    --project=$PROJECT_ID

# AI 服务会自动使用最新版本（latest）
```

## 安全最佳实践

1. ✅ 使用 GCP Secret Manager 存储所有敏感密钥
2. ✅ 定期轮换 API 密钥
3. ✅ 使用最小权限原则配置 Service Account
4. ✅ 在生产环境使用 Application Default Credentials
5. ❌ 避免将密钥硬编码在代码中
6. ❌ 避免将 `.env` 文件提交到版本控制

## 参考文档

- [GCP Secret Manager 文档](https://cloud.google.com/secret-manager/docs)
- [Python Client Library](https://cloud.google.com/python/docs/reference/secretmanager/latest)
- [IAM 角色](https://cloud.google.com/secret-manager/docs/access-control)
