# 🛡️ Autonoma ERP System

A premium enterprise resource planning solution built with **React 19 (Frontend)** and **Spring Boot 3.x (Backend)**, powered by **H2 (Development)** and **Microsoft SQL Server 2022 (Production)** compatibility.

---

## 📚 Technical Documentation Center

For comprehensive system documentation, architecture guidelines, coding conventions, database migrations, and operational guidelines, refer to the master handbook:

👉 **[Master Developer Handbook](./docs/DEVELOPER_GUIDE.md)**

---

## 🚀 Quick Start (Docker Development)

1. **Start the Database Containers**:
   ```bash
   docker-compose up -d
   ```

2. **Launch the Spring Boot API**:
   ```bash
   cd autonoma-backend
   mvn spring-boot:run
   ```
   *APIs will run at `http://localhost:8081`.*

3. **Launch the Vite React Web App**:
   ```bash
   cd autonoma-frontend
   npm install
   npm run dev
   ```
   *The UI portal will be available at `http://localhost:3000`.*

---

## 🤝 Development Standards
*   **Java 21 (LTS)** is required for backend services.
*   **Flyway** is the sole authority for database schema changes.
*   **BOS Components** must be used for all new UI development to ensure consistency.

---

## 📂 System Core Modules
*   `autonoma-backend/`: REST API controllers, repositories, JPA models, security configs, and background services.
*   `autonoma-frontend/`: User interface views, REDUX stores, routing paths, and reusable BOS ecosystem components.
