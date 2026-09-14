@echo off
echo ========================================================
echo Starting Autonoma ERP Backend with Docker SQL Server
echo ========================================================
set "SPRING_DATASOURCE_URL=jdbc:sqlserver://localhost:1433;databaseName=AUTONOMA;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;sendTimeAsDateTime=false"
set "DB_USERNAME=sa"
set "DB_PASSWORD=nutech@2026"
set "SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=com.autonoma.erp.config.CustomSQLServerDialect"
set "SECONDARY_DB_URL=jdbc:sqlserver://localhost:1433;databaseName=ERPDb_NUTECH;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;sendTimeAsDateTime=false"
set "ESSL_DB_URL=jdbc:sqlserver://localhost:1433;databaseName=NT_ESSL;trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;sendTimeAsDateTime=false"
call mvnw.cmd spring-boot:run
