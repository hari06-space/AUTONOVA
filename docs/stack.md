# Local Development Stack Guide

This document lists the startup steps and parameters to spin up the local development stack quickly.

---

## 1. Stack Components & Ports

| Component | Host Port | Run Location | Purpose |
| :--- | :--- | :--- | :--- |
| **SQL Server** | `1433` | Docker Container | MSSQL Database |
| **Java Backend** | `8081` | Host Machine | Spring Boot API & SQL Migrations |
| **Email & OCR Service** | `9090` | Host Machine | Shared Mailbox Polling & OCR Endpoints |
| **React Frontend** | `3001` | Host Machine | Vite Development Server (Hot Reloading) |

---

## 2. Fast Startup Commands

### Step 1: Database (Docker)
Spin up only the database in the background:
```bash
docker compose up -d sqlserver
```

### Step 2: Main Backend (Local Host)
Run the Spring Boot application (will automatically run pending migrations in `dbscripts/` on startup):
```bash
cd autonoma-backend
./mvnw spring-boot:run
```

### Step 3: Email & OCR Service (Local Host)
Start the email processing and OCR service (required for handling Inbox and OCR mapping routes):
```bash
cd autonoma-backend/email-service
./mvnw spring-boot:run
```

### Step 4: Frontend (Local Host)
Configure Corepack and start the hot-reloading development server:
```bash
cd autonoma-frontend
corepack enable
yarn install
yarn start
```
*Access the UI at `http://localhost:3001`.*

---

## 3. Configuration Locations & Multi-Container Setup

- **Database Connection**: Configured in [application.properties](file:///Users/eash/Desktop/ERP%201.11.56%20AM/autonoma-backend/src/main/resources/application.properties)
- **Vite Proxy Settings**: Mapped in [vite.config.mjs](file:///Users/eash/Desktop/ERP%201.11.56%20AM/autonoma-frontend/vite.config.mjs) (routes `/api/*` requests from port `3001` to backend on `8081`).
- **Containerized Backend Routing (Optional)**: If you run the main backend inside Docker, it cannot reach the OCR service on `localhost:9090`. You must expose the host's port by adding the environment variable to your docker-compose config:
  ```yaml
  environment:
    - OCR_SERVICE_URL=http://host.docker.internal:9090
  ```

---

## 4. Useful Logs & Troubleshooting

- **Check port conflicts** (if `8081`, `9090`, or `3001` is already in use):
  ```bash
  lsof -i :8081
  lsof -i :9090
  lsof -i :3001
  ```
- **Stop running docker containers** (if docker is holding onto ports `8081` or `3001`):
  ```bash
  docker compose down backend frontend
  ```
