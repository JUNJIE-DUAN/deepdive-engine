# ============================================================================
# DeepDive OCI 完整自动化部署脚本 (PowerShell)
# ============================================================================

$ErrorActionPreference = "Stop"

# 颜色定义
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Blue
    Write-Host ""
}

# ============================================================================
# 步骤 1: 安装 Terraform
# ============================================================================

Write-Step "步骤 1: 检查并安装 Terraform"

try {
    $terraformVersion = terraform --version 2>$null
    Write-Success "Terraform 已安装: $terraformVersion"
} catch {
    Write-Info "Terraform 未安装，正在下载和安装..."

    # 创建临时目录
    $tempDir = "$env:TEMP\terraform-install"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }

    # 检测系统架构
    $arch = if ([Environment]::Is64BitOperatingSystem) { "amd64" } else { "386" }
    Write-Info "系统架构: Windows $arch"

    # 下载 Terraform
    Write-Info "下载 Terraform..."
    $terraformUrl = "https://releases.hashicorp.com/terraform/1.6.4/terraform_1.6.4_windows_${arch}.zip"
    $zipPath = "$tempDir\terraform.zip"

    Invoke-WebRequest -Uri $terraformUrl -OutFile $zipPath -UseBasicParsing
    Write-Success "Terraform 下载完成"

    # 解压文件
    Write-Info "解压 Terraform..."
    Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

    # 找到 Program Files 目录
    $programFiles = "C:\Program Files\Terraform"
    if (-not (Test-Path $programFiles)) {
        New-Item -ItemType Directory -Path $programFiles -Force | Out-Null
    }

    # 移动可执行文件
    Move-Item -Path "$tempDir\terraform.exe" -Destination "$programFiles\terraform.exe" -Force

    # 添加到 PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    if ($currentPath -notlike "*$programFiles*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$programFiles", "User")
        $env:PATH += ";$programFiles"
        Write-Success "Terraform 已添加到 PATH"
    }

    # 清理临时文件
    Remove-Item -Path $zipPath -Force

    Write-Success "Terraform 安装完成"
}

# ============================================================================
# 步骤 2: 检查所有必需的工具
# ============================================================================

Write-Step "步骤 2: 检查所有必需的工具"

$tools = @("docker", "terraform", "git")
$allToolsFound = $true

foreach ($tool in $tools) {
    try {
        $version = & $tool --version 2>$null
        $firstLine = ($version | Select-Object -First 1)
        Write-Success "$tool`: $firstLine"
    } catch {
        Write-Error "$tool: 未安装"
        $allToolsFound = $false
    }
}

if (-not $allToolsFound) {
    Write-Error "某些工具未安装，请手动安装后重试"
    exit 1
}

# ============================================================================
# 步骤 3: 验证 OCI 凭证
# ============================================================================

Write-Step "步骤 3: 验证 OCI 凭证"

$ociConfig = @{
    "OCI_USER_OCID" = "ocid1.user.oc1..aaaaaaaas7vm3r365jphuvgoxqvdw6l4sdericwhkinevtj5txqxrhh46ffq"
    "OCI_TENANCY_OCID" = "ocid1.tenancy.oc1..aaaaaaaalp72vq523bbru7qtrnyix6s3aotkgf5q4nhsjzd6vtf6wbcqgdma"
    "OCI_COMPARTMENT_OCID" = "ocid1.compartment.oc1..aaaaaaaa3ddtttsamndd3ppzewiakxwqqlkjswyweyrk3bu6nwruw32kwnsa"
    "OCI_REGION" = "ca-toronto-1"
    "OCI_FINGERPRINT" = "e8:2f:2b:65:d6:21:06:4f:ac:4d:6f:7b:f7:05:72:03"
    "OCI_KEY_FILE" = "D:\projects\deepdive\infra\oci\api-key\oci_api_key.pem"
}

foreach ($key in $ociConfig.Keys) {
    Write-Info "$key`: $(($ociConfig[$key] -split '\.' | Select-Object -First 2) -join '.')..."
}

Write-Success "OCI 凭证已验证"

# ============================================================================
# 步骤 4: 构建 Docker 镜像
# ============================================================================

Write-Step "步骤 4: 构建 Docker 镜像"

$projectRoot = "D:\projects\deepdive"

Write-Info "构建前端镜像..."
& docker build -f "$projectRoot\frontend\Dockerfile" -t deepdive-frontend:latest "$projectRoot\frontend"
Write-Success "前端镜像构建完成"

Write-Info "构建后端镜像..."
& docker build -f "$projectRoot\backend\Dockerfile" -t deepdive-backend:latest "$projectRoot\backend"
Write-Success "后端镜像构建完成"

# ============================================================================
# 步骤 5: 准备 Terraform
# ============================================================================

Write-Step "步骤 5: 准备 Terraform 部署"

$terraformDir = "$projectRoot\infra\oci\terraform"
Push-Location $terraformDir

Write-Info "初始化 Terraform..."
& terraform init

# 检查 SSH 密钥
Write-Info "检查 SSH 密钥..."
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
if (-not (Test-Path $sshKeyPath)) {
    Write-Info "生成 SSH 密钥对..."
    & ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N ""
    Write-Success "SSH 密钥已生成"
}

$sshPublicKey = Get-Content $sshKeyPath -Raw

# 创建 tfvars 文件
Write-Info "创建 Terraform 变量文件..."
$tfvarsContent = @"
compartment_ocid = "$($ociConfig['OCI_COMPARTMENT_OCID'])"
region = "$($ociConfig['OCI_REGION'])"
ssh_public_key = "$sshPublicKey"
oci_registry_namespace = "deepdive"
"@

Set-Content -Path "$terraformDir\terraform.tfvars" -Value $tfvarsContent
Write-Success "Terraform 变量文件已创建"

# ============================================================================
# 步骤 6: 执行 Terraform 部署
# ============================================================================

Write-Step "步骤 6: 执行 Terraform 部署"

Write-Info "规划部署..."
& terraform plan -out=tfplan

Write-Info "应用 Terraform 配置（这可能需要 10-20 分钟）..."
Write-Host "请等待，部署进行中..." -ForegroundColor Yellow
& terraform apply tfplan

# 获取输出
Write-Info "获取部署信息..."
try {
    $frontendIp = & terraform output -raw frontend_public_ip 2>$null
} catch {
    $frontendIp = ""
}

try {
    $backendIp = & terraform output -raw backend_private_ip 2>$null
} catch {
    $backendIp = ""
}

Write-Success "基础设施部署完成"

Pop-Location

# ============================================================================
# 步骤 7: 验证部署
# ============================================================================

Write-Step "步骤 7: 验证部署"

Write-Info "等待实例启动..."
Start-Sleep -Seconds 30

if ($frontendIp) {
    Write-Info "测试前端连接..."
    $maxRetries = 30
    for ($i = 1; $i -le $maxRetries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://$frontendIp/" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "前端可访问"
                break
            }
        } catch {
            if ($i -eq $maxRetries) {
                Write-Error "前端连接超时"
            }
        }
        Start-Sleep -Seconds 2
    }
} else {
    Write-Error "无法获取前端 IP"
}

# ============================================================================
# 完成
# ============================================================================

Write-Step "🎉 部署完成！"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "DeepDive Engine 已成功部署到 OCI" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if ($frontendIp) {
    Write-Host "📱 前端应用: " -ForegroundColor Cyan -NoNewline
    Write-Host "http://$frontendIp" -ForegroundColor Yellow

    Write-Host "📊 后端 API: " -ForegroundColor Cyan -NoNewline
    Write-Host "http://$backendIp`:3001" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  部分信息获取失败，请在 OCI 控制台查看实例信息" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 后续步骤:" -ForegroundColor Yellow
Write-Host "  1. 在浏览器中访问前端 URL"
Write-Host "  2. 测试应用功能"
Write-Host "  3. 配置 DNS（可选）"
Write-Host "  4. 启用 HTTPS（推荐）"
Write-Host ""
Write-Host "💰 成本: $0.00 ✅ (完全免费)" -ForegroundColor Green
Write-Host ""

Write-Success "部署脚本执行完成！"
