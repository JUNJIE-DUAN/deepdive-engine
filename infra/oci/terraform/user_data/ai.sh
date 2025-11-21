#!/bin/bash
set -e

# AI Service instance initialization script
echo "Initializing AI service instance..."

# Update system
apt-get update
apt-get install -y curl wget docker.io python3 python3-pip

# Start Docker
systemctl start docker
systemctl enable docker

# Pull and run AI service container
docker pull ${OCI_REGISTRY_NAMESPACE}/deepdive-ai:latest || echo "AI container not available yet"
docker run -d \
  --name ai-service \
  -p 5000:5000 \
  -e NODE_ENV=production \
  ${OCI_REGISTRY_NAMESPACE}/deepdive-ai:latest || echo "Failed to run AI container"

echo "AI service initialization complete"
