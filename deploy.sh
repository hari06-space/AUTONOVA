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
echo "🚀 Starting Decoupled Full Deployment to AWS EC2 (${SERVER_IP})"
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
npx corepack yarn install --no-immutable
npx corepack yarn build
cd ..

# Restore original .env.production
echo "🔧 Restoring original .env.production..."
mv "${ENV_FILE}.bak" "$ENV_FILE"

# 2. Package and Upload Frontend Assets
echo "📦 Packaging frontend assets..."
tar -czf autonoma-frontend/dist.tar.gz -C autonoma-frontend/dist .

echo "📤 Uploading frontend package to EC2 (/tmp)..."
scp -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" autonoma-frontend/dist.tar.gz "${REMOTE_HOST}:/tmp/dist.tar.gz"

echo "⚙️ Extracting frontend assets on server..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" "$REMOTE_HOST" "sudo rm -rf /var/www/html/* && sudo tar -xzf /tmp/dist.tar.gz -C /var/www/html/ && rm -f /tmp/dist.tar.gz"
rm -f autonoma-frontend/dist.tar.gz

# 3. Clean and Build Backend JAR (clean backend without duplicated static resources)
echo "🧹 Cleaning legacy static assets from backend..."
rm -rf autonoma-backend/src/main/resources/static/*

echo "📦 Building clean backend JAR..."
cd autonoma-backend
./mvnw package -Dmaven.test.skip=true -DskipFrontend=true
cd ..

# Compress backend JAR to speed up transfer
echo "📦 Compressing backend JAR to .tar.gz format..."
tar -czf autonoma-backend/target/erp-backend.tar.gz -C autonoma-backend/target Autonoma.jar

# 4. Upload backend package
echo "📤 Uploading compressed backend package to EC2..."
rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i \"$PEM_KEY\"" autonoma-backend/target/erp-backend.tar.gz "${REMOTE_HOST}:/home/ubuntu/autonoma-backend-new.tar.gz"

# Write Decoupled Nginx configuration to upload
echo "📝 Generating decoupled Nginx configuration..."
cat << 'EOF' > nginx-default.conf
server {
    listen 80 default_server;
    server_name _;
    client_max_body_size 100M;

    root /var/www/html;
    index index.html;

    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

scp -C -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" nginx-default.conf "${REMOTE_HOST}:/home/ubuntu/nginx-default.conf"
rm -f nginx-default.conf

# 5. Remote Server Config and Restart
echo "🔧 Executing remote deployment commands..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" "$REMOTE_HOST" << 'EOF'
    set -e
    
    echo "⚙️ Applying Nginx configuration..."
    sudo mv /home/ubuntu/nginx-default.conf /etc/nginx/sites-available/default
    sudo systemctl reload nginx
    
    echo "🔄 Restarting backend service..."
    PID=$(pgrep -f autonoma-backend.jar || true)
    if [ -n "$PID" ]; then
        echo "Killing running backend process: $PID"
        sudo kill -15 $PID
        sleep 3
        PID2=$(pgrep -f autonoma-backend.jar || true)
        if [ -n "$PID2" ]; then
            echo "Force killing remaining process: $PID2"
            sudo kill -9 $PID2
        fi
    fi
    
    echo "⚙️ Extracting new backend JAR version..."
    tar -xzf /home/ubuntu/autonoma-backend-new.tar.gz -C /home/ubuntu/
    mv /home/ubuntu/Autonoma.jar /home/ubuntu/autonoma-backend.jar
    rm -f /home/ubuntu/autonoma-backend-new.tar.gz
    
    echo "Starting new backend instance with RDS datasource overrides..."
    nohup java -Dspring.datasource.url="jdbc:sqlserver://autonoma-db.cnwa8gmoetf9.ap-south-1.rds.amazonaws.com:1433;databaseName=AUTONOMA;loginTimeout=5;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;encrypt=true" -Dspring.datasource.username="sa" -Dspring.datasource.password="Eashwar2005" -Dspring.datasource.hikari.connection-timeout=5000 -Dspring.secondary.datasource.url="jdbc:sqlserver://autonoma-db.cnwa8gmoetf9.ap-south-1.rds.amazonaws.com:1433;databaseName=ERPDb_NUTECH;loginTimeout=5;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;encrypt=true" -Dspring.secondary.datasource.username="sa" -Dspring.secondary.datasource.password="Eashwar2005" -jar /home/ubuntu/autonoma-backend.jar > /home/ubuntu/erp-backend.log 2>&1 &

    
    echo "⏳ Waiting for backend to bind and start (checking port 8081)..."
    MAX_WAIT=120
    WAIT_INTERVAL=5
    ELAPSED=0
    SUCCESS=0
    
    while [ $ELAPSED -lt $MAX_WAIT ]; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:8081/api/test || true)
        if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "" ]; then
            echo "✅ Backend successfully started and listening on port 8081! (HTTP Code: $HTTP_CODE)"
            SUCCESS=1
            break
        fi
        echo "⏳ Still waiting for port 8081 to bind... (${ELAPSED}s elapsed, last HTTP code: $HTTP_CODE)"
        sleep $WAIT_INTERVAL
        ELAPSED=$((ELAPSED + WAIT_INTERVAL))
    done

    if [ $SUCCESS -ne 1 ]; then
        echo "❌ Error: Backend failed to start on port 8081 after ${MAX_WAIT} seconds."
        echo "🔍 Last 30 lines of backend log (/home/ubuntu/erp-backend.log):"
        tail -n 30 /home/ubuntu/erp-backend.log
        exit 1
    fi
EOF

echo "=========================================="
echo "🎉 Decoupled Full Deployment Completed Successfully!"
echo "Visit http://${SERVER_IP} to access the application."
echo "=========================================="
