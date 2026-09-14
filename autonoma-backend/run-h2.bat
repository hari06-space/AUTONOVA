@echo off
echo ========================================================
echo Starting Autonoma ERP Backend with H2 local database
echo ========================================================
set "SPRING_DATASOURCE_URL=jdbc:h2:file:./db/AUTONOMA;MODE=MSSQLServer;CASE_INSENSITIVE_IDENTIFIERS=TRUE;AUTO_SERVER=TRUE"
set "DB_USERNAME=sa"
set "DB_PASSWORD=sa"
set "SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.H2Dialect"
set "SECONDARY_DB_URL=jdbc:h2:file:./db/ERPDb_NUTECH;MODE=MSSQLServer;CASE_INSENSITIVE_IDENTIFIERS=TRUE;AUTO_SERVER=TRUE"
set "ESSL_DB_URL=jdbc:h2:file:./db/NT_ESSL;MODE=MSSQLServer;CASE_INSENSITIVE_IDENTIFIERS=TRUE;AUTO_SERVER=TRUE"
call mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.datasource.driver-class-name=org.h2.Driver -Dspring.secondary.datasource.driver-class-name=org.h2.Driver -Dessl.datasource.driver-class-name=org.h2.Driver -Dspring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
