#!/bin/bash
set -e

# Configuration
if [ -f "/Users/eash/Downloads/autonoma-key.pem" ]; then
    PEM_KEY="/Users/eash/Downloads/autonoma-key.pem"
else
    PEM_KEY="/Users/darshankrishnakumar/Downloads/autonoma-key.pem"
fi
SERVER_IP="43.205.136.227"
SERVER_USER="ubuntu"
REMOTE_HOST="${SERVER_USER}@${SERVER_IP}"

echo "=========================================="
echo "🚀 Starting Rapid Frontend Deployment to AWS EC2 (${SERVER_IP})"
echo "=========================================="

# Temporarily update .env.production to clear VITE_APP_API_URL for relative paths
echo "🔧 Configuring .env.production for relative paths..."
ENV_FILE="autonoma-frontend/.env.production"
cp "$ENV_FILE" "${ENV_FILE}.bak"
echo "VITE_API_URL=" > "$ENV_FILE"
echo "VITE_APP_API_URL=" >> "$ENV_FILE"

# 1. Build Frontend
echo "📦 Building frontend static assets..."
cd autonoma-frontend
npm run build
cd ..

# Restore original .env.production
echo "🔧 Restoring original .env.production..."
mv "${ENV_FILE}.bak" "$ENV_FILE"

# 2. Package and Upload Frontend Assets
echo "📦 Packaging assets..."
tar -czf autonoma-frontend/dist.tar.gz -C autonoma-frontend/dist .

echo "📤 Uploading package to EC2 (/tmp)..."
scp -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" autonoma-frontend/dist.tar.gz "${REMOTE_HOST}:/tmp/dist.tar.gz"

echo "⚙️ Extracting assets on server..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" "$REMOTE_HOST" "sudo rm -rf /var/www/html/* && sudo tar -xzf /tmp/dist.tar.gz -C /var/www/html/ && rm -f /tmp/dist.tar.gz"

# Cleanup local archive
rm -f autonoma-frontend/dist.tar.gz

echo "=========================================="
echo "🎉 Frontend Deployment Completed Successfully!"
echo "Visit http://${SERVER_IP} to access the application."
echo "=========================================="
