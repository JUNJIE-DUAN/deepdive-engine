# 🚀 如何部署 DeepDive 到 OCI

## 📋 简单 3 步完成部署

### ✅ 第 1 步：收集 OCI 账户信息（5 分钟）

登录 OCI 控制台（https://console.oracle.com）并按下面收集信息：

#### 信息清单

复制粘贴下面的表格，填入你的信息，然后提供给我：

```
=== 我的 OCI 账户信息 ===

1️⃣ Tenancy OCID (从菜单→管理→舱室→根舱室 复制)
ocid1.tenancy.oc1...........................

2️⃣ User OCID (从菜单→身份和访问管理→用户 复制你的用户)
ocid1.user.oc1...........................

3️⃣ Compartment OCID (从菜单→身份和访问管理→舱室 复制你的舱室)
ocid1.compartment.oc1...........................

4️⃣ Region (选一个，推荐：ap-singapore-1)
ap-singapore-1

5️⃣ API 密钥 Fingerprint (从菜单→身份和访问管理→用户→你的用户→API 密钥 复制)
a1:b2:c3:d4:e5:f6:g7:h8:i9:j0:k1:l2:m3:n4:o5:p6

6️⃣ 私钥文件路径 (API 密钥下载保存的位置，例如：)
/Users/yourname/.oci/oci_api_key.pem
或
C:\Users\yourname\.oci\oci_api_key.pem
```

**详细说明见**: `infra/oci/ACCOUNT_INFO_TEMPLATE.md`

---

### ✅ 第 2 步：提供信息给我

按照上面的格式填写好 6 个信息项，告诉我：

> 我已收集好账户信息，完整信息如下：
>
> ```
> Tenancy OCID: ocid1.tenancy.oc1.xxx
> User OCID: ocid1.user.oc1.xxx
> Compartment OCID: ocid1.compartment.oc1.xxx
> Region: ap-singapore-1
> API 密钥 Fingerprint: a1:b2:c3:...
> 私钥文件路径: /path/to/oci_api_key.pem
> ```

---

### ✅ 第 3 步：我来执行部署

收到你的信息后，我会：

1. 🔧 配置 OCI CLI
2. 🔐 设置 API 密钥认证
3. 🐳 构建 Docker 镜像
4. 📤 推送镜像到 OCI Registry
5. 🏗️ 使用 Terraform 创建云资源
6. 🚀 部署应用到云端
7. ✅ 验证应用可访问

---

## ⏱️ 耗时预估

- 第 1 步（收集信息）: **5 分钟**
- 第 2 步（提供信息）: **1 分钟**
- 第 3 步（自动部署）: **20-30 分钟** ⏳

**总计: 25-35 分钟** 即可完全部署好应用！

---

## 💰 成本

完全免费！使用 OCI 永久免费套餐，零费用。

---

## 🎯 部署完成后

你将获得：

✅ **前端应用** - 可在浏览器访问的网址
✅ **后端 API** - REST API 服务
✅ **数据库** - PostgreSQL, MongoDB, Neo4j, Redis, Qdrant
✅ **AI 服务** - AI 模型服务

---

## 📖 更多信息

需要了解更多细节？查看这些文档：

- `infra/oci/docs/QUICK_START.md` - 快速开始
- `infra/oci/docs/architecture.md` - 系统架构
- `infra/oci/docs/COST_MANAGEMENT.md` - 成本管理
- `infra/oci/PRE_DEPLOYMENT_CHECKLIST.md` - 详细检查清单

---

## 🚀 准备好了吗？

**现在就开始：**

1. 登录 OCI 控制台
2. 按上面的方式收集 6 个信息
3. 提供给我即可！

**让我们开始部署吧！** 💪
