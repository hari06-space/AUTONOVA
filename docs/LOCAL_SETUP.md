# 🚀 Developer Guide: Local Database & Docker Reset Setup

> Last updated: May 2026 · Team: TIS (QMS / Audit / Checklist / Induction)

We have standardized the database schema (capitalizing column names, removing legacy/duplicate tables, and organizing migrations). To ensure your local setup runs correctly without legacy table pollution, follow these instructions to pull the latest changes and reset your local database.

---

## Prerequisites

Install the following before you begin:

| Tool | Version | Download |
|------|---------|----------|
| **Java (JDK)** | 17 or 21 | https://adoptium.net |
| **Maven** | 3.9+ | https://maven.apache.org |
| **Node.js** | 18 or 20 | https://nodejs.org |
| **Docker Desktop** | Latest | https://docker.com |
| **Git** | Latest | https://git-scm.com |

> **Tip (macOS):** Install everything at once with Homebrew:
> ```bash
> brew install openjdk@21 maven node git
> brew install --cask docker
> ```

---

## Step 1 — Pull the Latest Code

Make sure you are on the latest `main` branch:

```bash
# From the project root
git checkout main
git pull origin main
```

---

## Step 2 — Reset your Local Docker SQL Server (Recommended)

Since we dropped duplicate legacy tables (like `EmployeeMaster`, etc.) and moved to a modular migration runner, it is **highly recommended** to start with a fresh database to avoid any constraint issues:

### 2a. Destroy the old container and its volume:

```bash
docker stop autonoma-sqlserver
docker rm autonoma-sqlserver
```

### 2b. Start the clean container using the pre-configured `docker-compose.yml` in the project root:

```bash
# From the project root
docker compose up -d
```

### 2c. Initialize the database and credentials

Wait ~15 seconds for SQL Server to boot first, then run:

```bash
docker exec -it autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U SA -P "nutech@2026" -C -N -Q "
CREATE DATABASE AUTONOMA;
GO
CREATE LOGIN nutech WITH PASSWORD = 'nutech@2026';
GO
USE AUTONOMA;
GO
CREATE USER nutech FOR LOGIN nutech;
GO
ALTER ROLE db_owner ADD MEMBER nutech;
GO
PRINT 'Database AUTONOMA and user nutech initialized!';
"
```

> **Already set up?** Just start the existing container:
> ```bash
> docker start autonoma-sqlserver
> ```

---

## Step 3 — Configure the Backend

The backend config file is at:
```
autonoma-backend/src/main/resources/application.properties
```

Make sure these lines are **active** (not commented out):

```properties
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=AUTONOMA;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive
spring.datasource.username=nutech
spring.datasource.password=nutech@2026
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
```

And these H2 lines are **commented out**:

```properties
# spring.datasource.url=jdbc:h2:file:./db/AUTONOMA;...
# spring.datasource.driver-class-name=org.h2.Driver
```

---

## Step 4 — Compile and Run the Backend

Run the backend application. Spring Boot will connect to your fresh SQL Server container and automatically execute all migration scripts (`V001` through `V012`) to seed clean, standardized tables:

```bash
cd autonoma-backend
mvn clean spring-boot:run
```

**Verification Check:**

Look for these lines in your console output:
- `SQL MIGRATION COMPLETED FOR DYNAMIC TEMPLATE`
- `NEW DUAL MIGRATION RUNNER: COMPLETED`
- `Started AutonomaBackendApplication in X seconds`

**What happens on first startup:**
- Spring Boot connects to SQL Server
- `SqlMigrationRunner` runs all pending `.sql` scripts from `src/main/resources/dbscripts/` automatically
- All QMS / Audit / Checklist / Induction tables are created and standardized
- No manual SQL execution needed

---

## Step 5 — Run the Frontend

In a **new terminal window**, start your local development UI:

```bash
cd autonoma-frontend
npm install       # only needed first time
npm start
```

Open **http://localhost:3000** and log in.

---

## Everyday Workflow

```bash
# Terminal 1 — Backend
cd autonoma-backend
mvn spring-boot:run

# Terminal 2 — Frontend
cd autonoma-frontend
npm start

# Start/stop Docker (keeps your data between restarts)
docker start autonoma-sqlserver
docker stop autonoma-sqlserver
```

---

## Migration System — How It Works

> **You never need to run SQL scripts manually.**

The app uses a custom `SqlMigrationRunner` that runs automatically at startup:

- Scripts are stored in `autonoma-backend/src/main/resources/dbscripts/`
- Each script runs **only once** — tracked in the `ERP_EXECUTED_SCRIPTS` table
- Scripts are **idempotent** — safe to re-run if something fails
- All scripts target **SQL Server only** — no H2 needed

**Adding a new migration script:**
1. Create a file in `dbscripts/` with the naming format:
   ```
   YYYYMMDD_VX.Y__Description__TIS.sql
   ```
   Example: `20260527_V40.0__Add_New_Feature__TIS.sql`
2. Write your T-SQL using `IF OBJECT_ID(...)` and `IF NOT EXISTS(...)` guards
3. Restart the backend — it runs automatically

---

## Database Naming Conventions (Our Team)

| What | Convention | Example |
|------|-----------|-|
| Table names | UPPERCASE with module prefix | `QMS_AUDIT_SCHEDULE` |
| Column names | UPPERCASE | `OBSERVATION_ID`, `CREATED_DATE` |
| Audit date columns | `CREATED_DATE`, `UPDATED_DATE` | — |
| Audit user columns | `CREATED_USER`, `UPDATED_USER` | — |
| FK constraint names | `FK_[CHILD]_[PARENT]` | `FK_QMS_MOM_DETAIL_MASTER` |
| Module prefixes | QMS = Quality, IND = Induction | — |

---

## Troubleshooting

### 💡 Connection Refused on Port 1433
Make sure Docker Desktop is open and `docker ps` shows `autonoma-sqlserver` as running:
```bash
docker start autonoma-sqlserver
```

### 💡 Database Cleanups
The application now automatically handles dropping old unused duplicate tables (`EmployeeMaster`, `STATUS_MASTER`, etc.) and maps audit fields using dual serialization (`createdAt`/`createdDate`, etc.), so **you do not need to run SQL cleanups manually**.

### ❌ "Login failed for user 'nutech'"
The DB user doesn't exist yet. Re-run Step 2c's SQL commands.

### ❌ Backend crashes with a migration error
1. Check the `ERP_FAILED_SCRIPTS` table to see which script failed:
   ```sql
   SELECT * FROM ERP_FAILED_SCRIPTS ORDER BY FAILED_AT DESC;
   ```
2. Fix the script
3. Delete the failed entry and restart:
   ```sql
   DELETE FROM ERP_FAILED_SCRIPTS WHERE SCRIPT_NAME = 'your_script.sql';
   ```
4. Restart the backend — it will retry automatically

### ❌ Port 8081 already in use
Kill the existing process:
```bash
# macOS/Linux
lsof -ti:8081 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8081).OwningProcess | Stop-Process -Force
```

### ❌ Port 3000 already in use
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### ❌ npm install fails
```bash
cd autonoma-frontend
rm -rf node_modules package-lock.json
npm install
```

### ❌ Maven build fails
```bash
cd autonoma-backend
mvn clean install -DskipTests
mvn spring-boot:run
```

---

## Verify Everything Is Working

Run these quick checks after startup:

```bash
# 1. Check backend is up
curl http://localhost:8081/actuator/health

# 2. Check SQL Server tables exist
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U nutech -P "nutech@2026" -d AUTONOMA -C -N \
  -Q "SELECT COUNT(*) as TableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'"

# 3. Check migrations ran
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U nutech -P "nutech@2026" -d AUTONOMA -C -N \
  -Q "SELECT TOP 5 SCRIPT_NAME, EXECUTED_AT FROM ERP_EXECUTED_SCRIPTS ORDER BY EXECUTED_AT DESC"
```

---

## Team Scope — What We Own

Only touch these modules (don't modify other devs' tables):

| Module | Table Prefix | Pages |
|--------|-------------|-------|
| QMS Audit | `QMS_AUDIT_*` | Audit Schedule, Observations, NCR/OFI |
| QMS Checklist | `QMS_CHECKLIST_*` | Checklist Master, Assignment, Verification |
| QMS Meeting | `QMS_MEETING_*`, `QMS_MOM_*` | Meeting Schedule, MOM |
| Induction | `IND_*` | Induction Master, Assignment, Training |

> ⚠️ **Do not touch:** Support Tickets, User Dashboard, or any `hrm_*` / `sm_*` tables not listed above.

---

## Questions?

Slack the TIS team or raise an issue on GitHub.
