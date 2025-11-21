#!/bin/bash
set -e

# Frontend instance initialization script
echo "Initializing frontend instance..."

# Update system
apt-get update
apt-get install -y curl wget docker.io nginx

# Start Docker
systemctl start docker
systemctl enable docker

# Pull and run frontend container
docker pull ${OCI_REGISTRY_NAMESPACE}/deepdive-frontend:latest
docker run -d \
  --name frontend \
  -p 80:3000 \
  -p 443:3000 \
  -e NODE_ENV=production \
  ${OCI_REGISTRY_NAMESPACE}/deepdive-frontend:latest

# Configure Nginx as reverse proxy
cat > /etc/nginx/conf.d/deepdive.conf <<'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

systemctl start nginx
systemctl enable nginx

echo "Frontend initialization complete"
