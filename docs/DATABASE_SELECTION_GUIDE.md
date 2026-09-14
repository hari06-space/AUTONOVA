# 📘 AI Agent Instruction Guide: How to Safely Switch Target Databases

This document provides clear, step-by-step instructions for AI Coding Agents and developers on how to inspect local databases, determine which database contains populated data, and safely switch the active database configuration across Spring Boot and Docker without corrupting database migration scripts.

---

## 🎯 Core Rule
> **NEVER modify or rewrite versioned SQL migration scripts (`autonoma-backend/src/main/resources/dbscripts/`) or `init.sql` when changing active databases.**  
> Target database selection MUST be controlled exclusively via configuration properties (`application.properties`) and environment variables (`docker-compose.yml`).

---

## 📋 Step-by-Step AI Agent Instructions

### Step 1: Inspect Available Databases & Data Volume
Before changing any configuration, inspect the databases in the local SQL Server instance to verify table counts and row counts:

```bash
# List all databases and creation dates
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "SELECT name, create_date FROM sys.databases;"

# Check table and row count for a specific database (e.g. AT_NUTECH vs AUTONOMA)
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "USE AT_NUTECH; SELECT SUM(p.rows) AS TotalRows, COUNT(DISTINCT t.name) AS TotalTables FROM sys.tables t JOIN sys.partitions p ON t.object_id = p.object_id WHERE p.index_id IN (0,1);"
```

- **`AUTONOMA`**: Default fresh schema database (~1,100 seed/metadata rows).
- **`AT_NUTECH`**: Main populated database (~1.37 Million records: meeting schedules, MOMs, checklists, employees, suppliers, customers).

---

### Step 2: Update Spring Boot Backend Configuration
Modify `autonoma-backend/src/main/resources/application.properties` to update the default fallback database name:

```properties
# Change default database name property (Line 7)
spring.datasource.databasename=${DB_NAME:AT_NUTECH}
```

---

### Step 3: Update Docker Compose Configuration
Modify `docker-compose.yml` under the `backend` service environment section so containerized deployments also target the populated database:

```yaml
  backend:
    environment:
      - SPRING_DATASOURCE_URL=jdbc:sqlserver://sqlserver:1433;databaseName=AT_NUTECH;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;selectMethod=direct
      - SECONDARY_DB_URL=jdbc:sqlserver://sqlserver:1433;databaseName=AT_NUTECH;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive
      - SPRING_SECONDARY_DATASOURCE_URL=jdbc:sqlserver://sqlserver:1433;databaseName=AT_NUTECH;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;selectMethod=direct
```

---

### Step 4: Rebuild Backend Package & Restart Services
Execute Maven packaging to embed static assets and build `Autonoma.jar`:

```bash
# Package backend JAR (skipping tests)
cd autonoma-backend && mvn package -Dmaven.test.skip=true

# Restart application suite
cd .. && ./start.sh
```

---

### Step 5: Verify Active Database Connections
Verify that Spring Boot's Hikari connection pool has established active connections to the target database:

```bash
docker exec autonoma-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "nutech@2026" -C -Q "SELECT DB_NAME(dbid) AS DatabaseName, COUNT(*) AS ActiveConnections FROM sys.sysprocesses WHERE dbid > 0 GROUP BY DB_NAME(dbid);"
```

**Expected Output**:
```text
DatabaseName    ActiveConnections
------------    -----------------
AT_NUTECH       2 (or higher)
```

---

## 🚫 AI Agent Anti-Patterns (What NOT to Do)
1. **DO NOT** modify existing SQL migration scripts in `dbscripts/` (e.g. changing `USE [AT_NUTECH];` inside `V1_102...sql`).
2. **DO NOT** modify `init.sql` database creation statements.
3. **DO NOT** execute manual `DROP DATABASE` or `CREATE DATABASE` queries via `sqlcmd`.
4. **DO NOT** alter `application.properties` credentials without using environment variable overrides `${DB_NAME:...}`.
