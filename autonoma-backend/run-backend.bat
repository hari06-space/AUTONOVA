@echo off
rem Set Java home and path (using system environment defaults)
rem Run the Maven wrapper skipping tests
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.11"
call mvnw.cmd clean spring-boot:run -Dmaven.test.skip=true
