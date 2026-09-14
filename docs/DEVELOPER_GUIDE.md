# Autonoma ERP — Master Developer Handbook
**Version 3.0 (Stable)** | **Standardized: May 2026**

This document serves as the canonical reference for developing, maintaining, and deploying the Autonoma ERP platform. All developers must strictly follow these standards to ensure consistency, clean architecture, and error-free database synchronization.

---

## 🚀 1. Quick Start & Docker Setup

Autonoma ERP is built with a decoupled architecture containing a Spring Boot backend, a Vite-based React frontend, and standard database services.

### Directory Structure at a Glance
```
ERP/
├── docker-compose.yml       ← Shared database containers
├── autonoma-backend/        ← Spring Boot REST API (Port 8081)
└── autonoma-frontend/       ← Vite + React UI (Port 3000)
```

### Starting the Stack
Open three separate terminal sessions to spin up the local development environment:

1. **Terminal 1 — Database Environment**:
   ```bash
   docker-compose up -d
   ```
   *Note: Standard environment defaults use H2 database with file persistence for development, but Docker manages base database resources (like MSSQL images for validation).*

2. **Terminal 2 — Spring Boot Backend**:
   ```bash
   cd autonoma-backend
   mvn spring-boot:run
   ```
   *The custom `SqlMigrationRunner` will scan and execute new scripts in `src/main/resources/dbscripts/` on startup.*

3. **Terminal 3 — React Frontend**:
   ```bash
   cd autonoma-frontend
   npm run dev
   ```
   *The client web portal will run on http://localhost:3000 with Hot Module Replacement (HMR) enabled.*

---

## 🗂️ 2. Database Standards & Governance

### 1. Unified Naming Conventions
*   **Casing**: All table names, column names, constraints, and indexes must be in **UPPERCASE** (e.g. `QMS_AUDIT_SCHEDULE`).
*   **Separators**: Words must be separated by a single underscore (`_`).
*   **Primary Keys**: Must be defined as `id` (`BIGINT IDENTITY(1,1)` or H2-compatible equivalent).
*   **Foreign Keys**: Must match the format `[PARENT_TABLE_NAME_SINGULAR]_ID` (e.g., `EMPLOYEE_ID` referencing `HRM_EMPLOYEE_MASTER`).

### 2. Module Name Prefixes
Every table in our codebase must begin with its designated module code, followed by the page/sub-module descriptor:
*   `QMS_`: Quality Management System (e.g., `QMS_AUDIT_TYPE`, `QMS_MEETING_MASTER`).
*   `IND_`: Induction / ATS module (e.g., `IND_INDUCTION_ASSIGNMENT`).
*   `HRM_`: Human Resource Management (e.g., `HRM_EMPLOYEE_MASTER`).
*   `SM_`: Sales & Marketing (e.g., `SM_CURRENCY`).

### 3. Database Normalization (Junction Tables)
Storing comma-separated or serialized JSON arrays for multi-selection dropdown values in single columns violates 1NF (First Normal Form). You **must** extract multi-select fields to separate mapping tables:
*   **Format**: `[PARENT_TABLE_NAME]_[PROPERTY_NAME_PLURAL]`
*   **Example**: `QMS_MASTER_CHECKLIST_DEPARTMENTS` with columns:
    *   `id` (`BIGINT IDENTITY(1,1)` Primary Key)
    *   `CHECKLIST_ID` (`BIGINT` Foreign Key)
    *   `DEPARTMENT_NAME` (`NVARCHAR(100)`)

### 4. Audit Fields Specification
Every table (excluding junction/mapping tables) must declare these four audit columns:
1.  `CREATED_USER` (`NVARCHAR(100)`): Stores user ID/name who created the record.
2.  `CREATED_DATE` (`DATETIME`): Defaults to `GETDATE()` or H2 `NOW()`.
3.  `UPDATED_USER` (`NVARCHAR(100)`): Stores user ID/name of the last modifier.
4.  `UPDATED_DATE` (`DATETIME`): Updates automatically on modification.

### 5. Migration Execution Flow (No Flyway)
*   **Flyway is disabled** (`spring.flyway.enabled=false`) to avoid collision with manual migrations in legacy databases.
*   **Custom SqlMigrationRunner**: All database scripts must be saved in `autonoma-backend/src/main/resources/dbscripts/` following the TIS standard name: `YYYYMMDD_V[Version]__[Description]__TIS.sql`.
*   **H2 Mode Configuration**: The H2 database running in development runs with MSSQL server compatibility:
    `spring.datasource.url=jdbc:h2:file:./db/AUTONOMA;DB_CLOSE_DELAY=-1;MODE=MSSQLServer`
    SQL scripts must use standard H2-compatible syntax (avoiding MSSQL T-SQL specific blocks).
*   **Failing Hard on Errors**: If any script contains an error during startup, `SqlMigrationRunner` prints the full stack trace to the console and throws a `RuntimeException` to halt startup, ensuring immediate visibility.

---

## 📝 3. Logging & Logging Interceptors

### 1. Enterprise Log Format
All SLF4J logging statements must follow a standardized, structured format for easy parsing:
`[LEVEL] [TRANSACTION_ID] [MODULE] [CLASS] [METHOD] - Message: <message_text>, Metadata: {key=val, key2=val2}`

*   **Helper Class**: Use `com.autonoma.erp.util.LogHelper` to automatically format logs.
*   **Example SLF4J Output**:
    `[INFO] [TX-48291] [QMS] [ChecklistService] [saveChecklist] - Message: Checklist created successfully, Metadata: {checklistId=12, user=Admin}`

### 2. Request & Response Interceptors
The backend automatically logs incoming and outgoing boundaries for API controllers:
*   **API Request bounds**: `[API_REQUEST] [METHOD] [URI] - User: {}, Payload: {}`
*   **API Response bounds**: `[API_RESPONSE] [METHOD] [URI] - Status: {}, Duration: {}ms`

---

## 🛠️ 4. Backend Module Development Standards

When adding new tables or building a new backend feature:

### 1. Model / JPA Entity Definition
*   Create model classes under `com.autonoma.erp.model`.
*   Inherit all JPA entities from the base class: `com.autonoma.erp.model.BaseAuditEntity`. This class automatically manages the four audit fields using Hibernate `@PrePersist` and `@PreUpdate` lifecycle annotations.
*   Annotate class with `@Table(name = "PRE_TABLE_NAME")` in uppercase.
*   Annotate all fields with explicit column mappings: `@Column(name = "COLUMN_NAME")`.

### 2. Controller & DTO Standards
*   Controllers must reside in `com.autonoma.erp.controller.[module]`.
*   Endpoints must be versioned and mapped consistently (e.g. `@RequestMapping("/api/qms/audit/observation")`).
*   Include descriptive exception handling and throw customized Exceptions (e.g., `ResourceNotFoundException`).

---

## 🎨 5. Frontend UI & Reusable BOS Component Standards

All frontend UI code must strictly reuse the central, certified **BOS ecosystem** components located in `src/ui-component/bos/`. Never write raw tables, dialogs, or file inputs from scratch.

### 1. Universal Page Structure (The 70/30 Split)
Every core transactional or editing dialog must use the Split-Pane pattern:
*   **Left Pane (70% - Data Entry)**: Fields grouped into `BOSFormSection` with a 2-column grid layout.
*   **Right Pane (30% - Sticky Audit Sidebar)**: Employs `BOSPersonnelCard` and the audit tracking widget showing `CREATED USER`, `CREATED DATE`, `UPDATED USER`, and `UPDATED DATE`.

### 2. Certified BOS Component Catalog

#### A. BOSDataTable (`src/ui-component/bos/BOSDataTable.jsx`)
Standard datatable wrapping Material UI. Provides consistent styling, pagination, double-click to edit, and action menus.
*   Audit columns must use uppercase labels:
    ```javascript
    const columns = [
      { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
      { id: 'createdDate', label: 'CREATED DATE', minWidth: 150 },
      { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120 },
      { id: 'updatedDate', label: 'UPDATED DATE', minWidth: 150 }
    ];
    ```

#### B. BOSFormDialog & useBOSForm
Uniform dialog wrapper for form inputs. It works seamlessly with `useBOSForm` hook to coordinate error status and validations:
*   Form inputs must employ `BOSTextField`.
*   Required fields must shake dynamically on invalid save submissions by applying the standard error style.

#### C. BOSExportButton (`src/ui-component/bos/BOSExportButton.jsx`)
Standardized Excel exporting button. Placing it in the secondary card stack automatically adds `CREATED USER`, `CREATED DATE`, `UPDATED USER`, and `UPDATED DATE` fields to the sheet columns.

#### D. BOSFileUpload & BOSFilePreview (The "Eye" preview)
*   **BOSFileUpload**: Standardized drag-and-drop file input. Enforces consistent upload paths and provides immediate feedback.
*   **BOSFilePreview**: Provides a premium glassmorphic modal viewport to render PDFs, Word files, Excel files, or images directly in-app.

---

## 📎 6. File Upload Directories & Cross-Platform Paths

### 1. Directory Structure
Uploaded files are saved to a directory named `BOS_DOCUMENTS` with dynamic subdirectories:
*   `BOS_DOCUMENTS/HRA/`: Employee photos, NDA, fitness documents.
*   `BOS_DOCUMENTS/QMS/`: Checklist and audit attachments.
*   `BOS_DOCUMENTS/Sales/`: Customer profiles, quotation sheets.

### 2. Path Resolution in Java (`FileService.java`)
The backend resolves root directory pathing gracefully:
*   **Windows Hosts**: Standardizes on `D:\BOS_DOCUMENTS`.
*   **Mac / Linux Hosts**: Resolves relative to the workspace parent folder: `../BOS_DOCUMENTS`.
*   **Fallback Sequence**: If the primary folder is not writable, the system falls back to `~/BOS_DOCUMENTS` (user home directory), and then to temporary storage `/tmp/BOS_DOCUMENTS`.

### 3. Frontend Placeholders & Defensiveness
Legacies database dumps might contain placeholder string hyphens (`"-"`) or `"null"` for missing paths. The frontend sanitizes raw values dynamically before calling download or rendering endpoints:
```javascript
export const getFileViewUrl = (serverFileName) => {
  if (!serverFileName) return '';
  const clean = String(serverFileName).trim();
  if (!clean || clean === '-' || clean === 'null' || clean === 'undefined') return '';
  return `/api/files/view?path=${encodeURIComponent(clean)}`;
};
```

---

## 🚨 7. Error Interception & Alerting Standards

The platform handles backend and frontend exceptions defensively, preventing silent bugs or unreadable stack-traces.

### 1. Centralized Axios Interceptor (`axios.js`)
*   Catches HTTP response errors (status $\ge 400$).
*   Parses structured backend error payloads (extracting messages, timestamps, and stack traces).
*   Alerts the developer/user using a custom UI window alert while printing full trace details into the browser console.

### 2. Global Runtime Error Catcher (`index.jsx`)
To capture front-end rendering failures:
*   `window.onerror`: Alerts users on raw JS engine compile/run issues.
*   `window.addEventListener('unhandledrejection')`: Intercepts unhandled promise rejections and surfaces alert popups.
*   **Throttling**: The custom popup triggers are throttled (maximum one alert window every 1 second) to prevent infinite loops of dialogue popups.

---

## 📦 8. Production Deployment & Build Pipeline

### 1. Build and Compile Commands
*   **Backend Build**:
    ```bash
    mvn clean package -DskipTests
    ```
    This creates an executable uber-JAR: `target/Autonoma.jar`.
*   **Frontend Build**:
    ```bash
    npm run build
    ```
    This outputs minified assets inside `dist/`.

### 2. Persistent Storage (DevOps)
When running inside containers, you **must mount persistent directories** for the following resources to prevent data loss:
*   **H2 Database File**: `./db/` inside the backend directory.
*   **Document Uploads**: The host directory mapped to the application's resolved upload directory (`/app/BOS_DOCUMENTS`).

#### Docker Compose Example:
```yaml
services:
  erp-backend:
    image: autonoma-erp-backend:latest
    volumes:
      - /var/lib/autonoma/db:/app/db
      - /var/lib/autonoma/BOS_DOCUMENTS:/app/BOS_DOCUMENTS
    ports:
      - "8081:8081"
```
