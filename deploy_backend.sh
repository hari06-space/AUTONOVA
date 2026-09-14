#!/bin/bash
set -e

# Configuration
if [ -f "/Users/eash/Downloads/autonoma-key.pem" ]; then
    PEM_KEY="/Users/eash/Downloads/autonoma-key.pem"
else
    PEM_KEY="/Users/darshankrishnakumar/Downloads/autonoma-key.pem"
fi
SERVER_IP="${SERVER_IP:-43.205.136.227}"
SERVER_USER="ubuntu"
REMOTE_HOST="${SERVER_USER}@${SERVER_IP}"
DB_URL="${DB_URL:-jdbc:sqlserver://autonoma-db.cnwa8gmoetf9.ap-south-1.rds.amazonaws.com:1433;databaseName=AUTONOMA;loginTimeout=5;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;encrypt=true}"

# Auto-configure JAVA_HOME to JDK 21 on macOS if present
if [ -d "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home" ]; then
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "=========================================="
echo "🚀 Fast Backend-Only Deployment to AWS EC2 (${SERVER_IP})"
echo "=========================================="

# 1. Clean and Build Backend JAR
echo "🧹 Cleaning legacy static assets from backend..."
rm -rf autonoma-backend/src/main/resources/static/*

echo "📦 Building backend JAR..."
cd autonoma-backend
./mvnw package -Dmaven.test.skip=true
cd ..

# 2. Upload backend JAR
echo "📤 Uploading backend JAR package to EC2..."
rsync -avz --progress -e "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i \"$PEM_KEY\"" autonoma-backend/target/Autonoma.jar "${REMOTE_HOST}:/home/ubuntu/autonoma-backend-new.jar"

# 3. Remote Server Config and Restart
echo "🔧 Executing remote deployment commands..."
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=10 -o TCPKeepAlive=yes -i "$PEM_KEY" "$REMOTE_HOST" "export DB_URL='$DB_URL'; bash -s" << 'EOF'
    set -e
    
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
    
    echo "⚙️ Moving new backend JAR version..."
    mv /home/ubuntu/autonoma-backend-new.jar /home/ubuntu/autonoma-backend.jar
    
    # Dynamically map SECONDARY_DB_URL by changing the databaseName of DB_URL to ERPDb_NUTECH
    SECONDARY_DB_URL=$(echo "$DB_URL" | sed 's/databaseName=[a-zA-Z0-9_]*/databaseName=ERPDb_NUTECH/g')

    echo "Starting new backend instance with RDS datasource overrides..."
    nohup java -Dspring.datasource.url="$DB_URL" -Dspring.datasource.username="sa" -Dspring.datasource.password="Eashwar2005" -Dspring.datasource.hikari.connection-timeout=5000 -Dspring.secondary.datasource.url="$SECONDARY_DB_URL" -Dspring.secondary.datasource.username="sa" -Dspring.secondary.datasource.password="Eashwar2005" -jar /home/ubuntu/autonoma-backend.jar > /home/ubuntu/erp-backend.log 2>&1 &
    
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
echo "🎉 Backend Deployment Completed Successfully!"
echo "=========================================="
