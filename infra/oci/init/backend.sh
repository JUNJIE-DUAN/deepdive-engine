#!/bin/bash
set -e

echo "Starting backend instance setup..."

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
    ntp \
    postgresql-client

# 配置 Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# 创建应用目录
mkdir -p /home/ubuntu/deepdive
cd /home/ubuntu/deepdive

# 配置 Docker 日志轮转
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

sleep 10

# 创建环境配置文件
cat > /home/ubuntu/.env <<'EOENV'
NODE_ENV=production
DATABASE_URL=postgresql://deepdive:deepdive_password@localhost:5432/deepdive
REDIS_URL=redis://localhost:6379
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=neo4j_password
MONGODB_URI=mongodb://deepdive:mongo_password@localhost:27017/deepdive
QDRANT_URL=http://localhost:6333
JWT_SECRET=$(openssl rand -base64 32)
EOENV

# 数据库初始化脚本
cat > /home/ubuntu/init-databases.sh <<'EODBINIT'
#!/bin/bash
set -e

echo "Initializing databases..."

# 等待容器启动
sleep 30

# PostgreSQL 初始化
docker exec deepdive-postgres createdb -U deepdive deepdive 2>/dev/null || true
docker exec deepdive-postgres psql -U deepdive -d deepdive -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;" || true

echo "✅ Databases initialized"
EODBINIT

chmod +x /home/ubuntu/init-databases.sh

# 健康检查脚本
cat > /home/ubuntu/health-check.sh <<'EOHC'
#!/bin/bash

CONTAINERS=(
    "deepdive-backend"
    "deepdive-postgres"
    "deepdive-redis"
    "deepdive-neo4j"
    "deepdive-mongo"
)

RUNNING=0
TOTAL=${#CONTAINERS[@]}

for container in "${CONTAINERS[@]}"; do
    if docker ps | grep -q $container; then
        RUNNING=$((RUNNING + 1))
    else
        echo "⚠️  Container $container is not running"
        docker-compose restart $container || true
    fi
done

# 检查磁盘空间
DISK_USAGE=$(df /home/ubuntu | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "❌ Critical: Disk usage at $DISK_USAGE%"
    docker system prune -f
fi

echo "[$(date)] Health check: $RUNNING/$TOTAL containers running" >> /var/log/deepdive-healthcheck.log
EOHC

chmod +x /home/ubuntu/health-check.sh

# 健康检查 cron
(crontab -l 2>/dev/null || true; echo "*/5 * * * * /home/ubuntu/health-check.sh") | crontab - -

# 备份脚本
cat > /home/ubuntu/backup.sh <<'EOBAK'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
RETENTION_DAYS=7
mkdir -p $BACKUP_DIR

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

echo "Starting backup at $BACKUP_DATE..."

# PostgreSQL 备份
docker exec deepdive-postgres pg_dump -U deepdive deepdive | \
    gzip > $BACKUP_DIR/postgres_$BACKUP_DATE.sql.gz

# MongoDB 备份
docker exec deepdive-mongo mongodump --out /tmp/backup_$BACKUP_DATE || true
tar czf $BACKUP_DIR/mongo_$BACKUP_DATE.tar.gz -C /tmp backup_$BACKUP_DATE 2>/dev/null || true
rm -rf /tmp/backup_$BACKUP_DATE

# 清理旧备份
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed"
EOBAK

chmod +x /home/ubuntu/backup.sh

# 每日 02:00 执行备份
(crontab -l 2>/dev/null || true; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab - -

# 配置 NTP
systemctl start ntp
systemctl enable ntp

# 配置系统限制（数据库性能优化）
cat >> /etc/security/limits.conf <<EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 32768
* hard nproc 32768
EOF

echo "✅ Backend instance setup completed"
