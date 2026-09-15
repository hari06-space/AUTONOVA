#!/bin/bash

# start.sh - Autonova ERP Startup Script for macOS

# Auto-configure JAVA_HOME to JDK 21 on macOS if present
if [ -d "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home" ]; then
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home"
    export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "=========================================================="
echo "🚀 Starting Autonova ERP Application Suite (macOS)..."
echo "=========================================================="

# 1. Start Docker Container if not running
echo "Checking Docker container: autonoma-sqlserver..."
docker start autonoma-sqlserver 2>/dev/null || true

# 2. Wait for SQL Server to be online (Max 10 retries / 30 seconds)
echo "Waiting for SQL Server to accept connections..."
SQL_READY=0
SQL_ATTEMPTS=0
MAX_SQL_ATTEMPTS=10

while [ $SQL_ATTEMPTS -lt $MAX_SQL_ATTEMPTS ]; do
  if docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "SELECT 1" >/dev/null 2>&1; then
    SQL_READY=1
    break
  fi
  
  # Fallback: check if port 1433 is open and listening
  if nc -z 127.0.0.1 1433 >/dev/null 2>&1 || lsof -i :1433 >/dev/null 2>&1; then
    SQL_READY=1
    break
  fi

  SQL_ATTEMPTS=$((SQL_ATTEMPTS + 1))
  echo "  SQL Server starting up... (${SQL_ATTEMPTS}/${MAX_SQL_ATTEMPTS} attempts)"
  sleep 3
done

if [ $SQL_READY -eq 1 ]; then
  echo "✅ SQL Server is online and ready!"
else
  echo "⚠️ Warning: SQL Server container wait timed out. Proceeding with application startup..."
fi

# 3. Terminate any processes already running on ports 8081, 3001, 8000, or 9090
echo "Cleaning up existing processes on ports 8081, 3001, 8000, and 9090..."
kill -9 $(lsof -t -i :8081 -i :3001 -i :8000 -i :9090 2>/dev/null) 2>/dev/null || true

# 4. Start the Python Email/OAuth Service (Port 8000)
echo "Starting Python Email/OAuth Service (Port 8000)..."
cd autonoma-backend/python-email-service
nohup python3 app.py > ../../logs/python_email_nohup.log 2>&1 &
cd ../..

# 5. Start the OCR & Email Microservice (Port 9090)
echo "Starting OCR & Email Microservice (Port 9090)..."
cd autonoma-backend/email-service
nohup java -DDB_NAME=AT_NUTECH -Dspring.datasource.databasename=AT_NUTECH -jar target/nutech-email-backend-1.0.0-SNAPSHOT.jar > ../../logs/ocr_email_nohup.log 2>&1 &
cd ../..

# 6. Start the Backend (Port 8081)
echo "Starting Spring Boot Backend (Port 8081)..."
cd autonoma-backend
nohup java -Dbypass.license=true -DDB_NAME=AT_NUTECH -Dspring.datasource.databasename=AT_NUTECH -jar target/Autonova.jar > ../logs/backend_nohup.log 2>&1 &
cd ..

# 7. Start the Frontend (Port 3001)
echo "Starting Vite Frontend (Port 3001)..."
cd autonoma-frontend
nohup npm start > ../logs/frontend_nohup.log 2>&1 &
cd ..

# 8. Wait and check status
echo "⏳ Waiting for backend to bind and start (checking port 8081)..."
MAX_WAIT=120
WAIT_INTERVAL=5
ELAPSED=0
SUCCESS=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:8081/api/admin/schedule-config || true)
    if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "" ] && [ "$HTTP_CODE" != "404" ]; then
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
    echo "🔍 Last 30 lines of backend log:"
    tail -n 30 logs/backend_nohup.log
    exit 1
fi

echo "----------------------------------------------------------"
echo "Checking active ports:"
lsof -i :8081 -i :3001 -i :8000 -i :9090

echo "=========================================================="
echo "🎉 Autonova ERP is running!"
echo "   - Python Service: http://localhost:8000"
echo "   - OCR Service:    http://localhost:9090"
echo "   - Frontend:       http://localhost:3001"
echo "   - Backend:        http://localhost:8081"
echo "=========================================================="
