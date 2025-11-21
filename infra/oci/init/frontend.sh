#!/bin/bash
set -e

# ============================================================================
# Frontend Instance User Data Script
# ============================================================================

echo "Starting frontend instance setup..."

# 更新系统
apt-get update
apt-get upgrade -y

# 安装必要工具
apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    docker-compose \
    htop \
    ntp

# 配置 Docker
systemctl start docker
systemctl enable docker

# 添加当前用户到 docker 组
usermod -aG docker ubuntu

# 创建应用目录
mkdir -p /home/ubuntu/deepdive
cd /home/ubuntu/deepdive

# 配置 Docker 日志轮转（避免磁盘满）
cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

systemctl restart docker

# 拉取 docker-compose 文件（从对象存储或 Git）
# 这里假设通过 cloud-init 已经传递了文件
# 或者从 OCI Object Storage 下载

# 等待 Docker 启动
sleep 10

# 创建 health check 脚本
cat > /home/ubuntu/health-check.sh <<'EOHC'
#!/bin/bash

# 检查容器运行状态
RUNNING=0
TOTAL=0

for container in deepdive-frontend; do
    TOTAL=$((TOTAL + 1))
    if docker ps | grep -q $container; then
        RUNNING=$((RUNNING + 1))
    else
        docker-compose restart $container
    fi
done

# 检查磁盘空间
DISK_USAGE=$(df /home/ubuntu | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "Disk usage high: $DISK_USAGE%"
    docker system prune -f
fi

# 写入日志
echo "[$(date)] Health check: $RUNNING/$TOTAL containers running" >> /var/log/deepdive-healthcheck.log
EOHC

chmod +x /home/ubuntu/health-check.sh

# 添加 cron 任务来定期运行 health check
(crontab -l 2>/dev/null || true; echo "*/5 * * * * /home/ubuntu/health-check.sh") | crontab - -

# 创建日志收集脚本
cat > /home/ubuntu/collect-logs.sh <<'EOLC'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/logs"
mkdir -p $BACKUP_DIR

# 收集 Docker 日志
docker logs deepdive-frontend > $BACKUP_DIR/frontend-$(date +%s).log 2>&1 || true

# 删除 30 天前的日志
find $BACKUP_DIR -type f -mtime +30 -delete
EOLC

chmod +x /home/ubuntu/collect-logs.sh

# 添加日志收集 cron 任务
(crontab -l 2>/dev/null || true; echo "0 2 * * * /home/ubuntu/collect-logs.sh") | crontab - -

# 配置 NTP（时间同步）
systemctl start ntp
systemctl enable ntp

# 输出完成信息
echo "Frontend instance setup completed at $(date)" > /var/log/frontend-setup.log

echo "✅ Frontend instance is ready"
