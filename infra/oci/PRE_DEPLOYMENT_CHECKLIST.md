# 🚀 OCI 部署前完整检查清单

在开始部署前，请按照以下步骤逐一检查。

## ✅ 第一部分：工具和环境检查

### 1. 安装必要的工具

```bash
# 检查 Docker
docker --version
# 应输出: Docker version 20.x 或更高

# 检查 OCI CLI
oci --version
# 应输出: OCI CLI version x.x.x

# 检查 Terraform
terraform --version
# 应输出: Terraform v1.x or higher

# 检查 Git
git --version
# 应输出: git version x.x.x
```

### 2. OCI CLI 配置

```bash
# 配置 OCI CLI
oci setup config

# 验证配置
oci iam user get --user-id $(oci iam user list --query 'data[0].id' --raw-output) | head -5
# 应该成功输出用户信息
```

### 3. 生成 SSH 密钥

```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# 验证密钥
ls -la ~/.ssh/id_rsa*
# 应该看到 id_rsa 和 id_rsa.pub
```

---

## ✅ 第二部分：OCI 账户检查

### 1. 获取必要的信息

从 OCI 控制台（https://console.oracle.com）获取以下信息：

```bash
# 1. Tenancy OCID
# 路径: 菜单 → 管理 → 舱室 → 根舱室
# 复制 OCID (ocid1.tenancy.oc1...)

# 2. User OCID
# 路径: 菜单 → 身份和访问管理 → 用户
# 复制自己的用户 OCID (ocid1.user.oc1...)

# 3. Compartment OCID
# 路径: 菜单 → 身份和访问管理 → 舱室
# 复制自己的舱室 OCID (ocid1.compartment.oc1...)

# 4. Region
# 推荐: ap-singapore-1 (亚太新加坡)
# 其他选择: ap-tokyo-1, ap-mumbai-1, us-phoenix-1, eu-frankfurt-1
```

### 2. 检查 API 密钥

```bash
# 列出 API 密钥
oci iam api-key list --user-id $(oci iam user get --user-id $(oci session authenticate --auth-method federation 2>/dev/null | grep -oP '(?<="id"": ")[^"]*' || echo "") 2>/dev/null || echo "")

# 或使用预配置的 fingerprint 检查
oci iam api-key list --user-id $OCI_USER_OCID
```

### 3. 检查免费套餐配额

```bash
# 查看计算实例配额
oci compute shape list --compartment-id $OCI_COMPARTMENT_OCID --query 'data[?contains(shape, "A1")]'

# 应该看到 VM.Standard.A1.Flex 可用
```

---

## ✅ 第三部分：环境变量设置

### 1. 设置必要的环境变量

```bash
# 最小配置
export OCI_COMPARTMENT_OCID="ocid1.compartment.oc1.phx.xxxxxxxx"
export OCI_REGION="ap-singapore-1"

# 可选但推荐
export REGISTRY_NAMESPACE="deepdive"
export OCI_TENANCY_OCID="ocid1.tenancy.oc1.xxxxxxxx"
export OCI_USER_OCID="ocid1.user.oc1.xxxxxxxx"
```

### 2. 验证环境变量

```bash
# 检查是否已设置
echo "Compartment: $OCI_COMPARTMENT_OCID"
echo "Region: $OCI_REGION"

# 应该输出有效的值，不是空白
```

### 3. 验证 OCI 连接

```bash
# 测试连接
oci iam compartment get --compartment-id $OCI_COMPARTMENT_OCID

# 应该成功输出舱室信息
```

---

## ✅ 第四部分：项目代码检查

### 1. 验证项目结构

```bash
# 检查项目根目录
ls -la
# 应该看到:
# - frontend/
# - backend/
# - infra/
# - docker-compose.yml
# - package.json

# 检查 infra/oci 结构
ls -la infra/oci/
# 应该看到:
# - readme.md
# - docs/
# - scripts/
# - terraform/
# - init/
```

### 2. 验证 Docker 文件

```bash
# 检查 Dockerfile
test -f frontend/Dockerfile && echo "✅ frontend/Dockerfile 存在"
test -f backend/Dockerfile && echo "✅ backend/Dockerfile 存在"

# 验证 docker-compose.yml
test -f docker-compose.yml && echo "✅ docker-compose.yml 存在"
```

### 3. 验证部署脚本

```bash
# 检查部署脚本
test -x infra/oci/scripts/deploy.sh && echo "✅ deploy.sh 可执行"

# 如果不可执行，添加执行权限
chmod +x infra/oci/scripts/deploy.sh
```

---

## ✅ 第五部分：预热检查

### 1. Docker 测试

```bash
# 测试 Docker 连接
docker ps
# 应该成功列出容器

# 测试镜像构建（可选）
docker build -f frontend/Dockerfile -t deepdive-frontend:test ./frontend
# 应该成功构建
```

### 2. Terraform 验证

```bash
# 初始化 Terraform
cd infra/oci/terraform
terraform init

# 验证配置
terraform validate
# 应该输出: Success! The configuration is valid.

# 返回项目根目录
cd ../../..
```

### 3. OCI CLI 完整测试

```bash
# 列出实例（应该为空，因为还没部署）
oci compute instance list --compartment-id $OCI_COMPARTMENT_OCID

# 应该成功执行，返回空或很少的实例
```

---

## 🚀 第六部分：部署前最终检查

在执行 deploy.sh 前，运行以下检查：

```bash
# 1. 确认所有环境变量已设置
echo "=== 环境变量检查 ==="
echo "Compartment: $OCI_COMPARTMENT_OCID"
echo "Region: $OCI_REGION"

# 2. 确认 Docker 运行
echo "=== Docker 检查 ==="
docker ps

# 3. 确认 OCI 连接
echo "=== OCI 连接检查 ==="
oci iam compartment get --compartment-id $OCI_COMPARTMENT_OCID | head -10

# 4. 确认部署脚本可执行
echo "=== 部署脚本检查 ==="
ls -la infra/oci/scripts/deploy.sh
```

---

## ⚠️ 常见问题排查

### 问题 1: OCI CLI 找不到

**症状**: `oci: command not found`

**解决**:

```bash
# 安装 OCI CLI
curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh | bash

# 或使用 pip
pip install oci-cli
```

### 问题 2: Terraform 初始化失败

**症状**: `Error: Failed to download module`

**解决**:

```bash
# 删除 Terraform 缓存
rm -rf infra/oci/terraform/.terraform

# 重新初始化
cd infra/oci/terraform
terraform init
```

### 问题 3: Docker 权限问题

**症状**: `permission denied while trying to connect to Docker daemon`

**解决**:

```bash
# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker ps
```

### 问题 4: SSH 密钥权限

**症状**: `Permission denied (publickey)`

**解决**:

```bash
# 修正 SSH 密钥权限
chmod 600 ~/.ssh/id_rsa
chmod 644 ~/.ssh/id_rsa.pub
```

### 问题 5: OCI 凭证过期

**症状**: `Error: InvalidHeader.AuthorizationHeaderMalformed`

**解决**:

```bash
# 重新配置 OCI CLI
oci setup config

# 或重新生成 API 密钥
# 1. 登录 OCI 控制台
# 2. 用户 → API 密钥
# 3. 添加新的 API 密钥
```

---

## 📋 部署清单模板

复制以下清单，在部署前逐一检查：

```
部署日期: ___________
操作人: ___________

工具检查:
☐ Docker 已安装 (docker --version)
☐ OCI CLI 已安装 (oci --version)
☐ Terraform 已安装 (terraform --version)
☐ Git 已安装 (git --version)

OCI 账户:
☐ 获得 Tenancy OCID
☐ 获得 User OCID
☐ 获得 Compartment OCID
☐ 选择 Region
☐ 配置 OCI CLI (oci setup config)
☐ 生成 SSH 密钥对

环境变量:
☐ 设置 OCI_COMPARTMENT_OCID
☐ 设置 OCI_REGION
☐ 验证环境变量正确

项目检查:
☐ 项目代码完整
☐ frontend/Dockerfile 存在
☐ backend/Dockerfile 存在
☐ docker-compose.yml 存在
☐ infra/oci 目录完整

工具验证:
☐ Docker 连接正常 (docker ps)
☐ OCI CLI 连接正常 (oci iam compartment get ...)
☐ Terraform 验证通过 (terraform validate)
☐ SSH 密钥权限正确

部署检查:
☐ 部署脚本可执行 (ls -la infra/oci/scripts/deploy.sh)
☐ 所有环境变量已设置并验证
☐ 已备份重要数据（如有）
☐ 网络连接稳定
☐ 已阅读部署文档

准备就绪:
☐ 已完成所有检查
☐ 已获得必要的账户权限
☐ 已确认费用预算（本次 $0.00）

开始部署:
时间: ___________
命令: bash infra/oci/scripts/deploy.sh
```

---

## 🎯 下一步

当所有检查都通过后，你可以执行：

```bash
# 从项目根目录执行
bash infra/oci/scripts/deploy.sh
```

部署会自动完成以下步骤：

1. ✅ 环境验证
2. ✅ Docker 镜像构建
3. ✅ 镜像推送到 OCI Registry
4. ✅ 创建 OCI 基础设施
5. ✅ 部署容器
6. ✅ 初始化数据库
7. ✅ 配置监控
8. ✅ 验证部署

预计耗时: **15-30 分钟**

---

## 📞 如需帮助

- 快速问题: `cat infra/oci/docs/QUICK_START.md`
- 详细问题: `cat infra/oci/docs/README_OCI_DEPLOYMENT.md`
- 成本问题: `cat infra/oci/docs/COST_MANAGEMENT.md`

**祝你部署顺利！** 🚀
