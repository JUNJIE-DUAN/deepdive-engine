#!/bin/bash
set -e

# Backend instance initialization script
echo "Initializing backend instance..."

# Update system
apt-get update
apt-get install -y curl wget docker.io

# Start Docker
systemctl start docker
systemctl enable docker

# Pull and run backend container
docker pull ${OCI_REGISTRY_NAMESPACE}/deepdive-backend:latest
docker run -d \
  --name backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  ${OCI_REGISTRY_NAMESPACE}/deepdive-backend:latest

echo "Backend initialization complete"
