package com.autonoma.erp.config.essl;

import com.autonoma.erp.modules.hr.attendance.entity.ClientEsslConfig;
import com.autonoma.erp.modules.hr.attendance.repository.ClientEsslConfigRepository;
import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.service.admin.CompanyCredentialService;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Service
public class EsslDataSourceService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(EsslDataSourceService.class);
    public static final String DEFAULT_CLIENT_ID = "DEFAULT";

    @Autowired
    private EsslDynamicRoutingDataSource esslRoutingDataSource;

    @Autowired
    private ClientEsslConfigRepository configRepository;

    @Autowired
    private CompanyCredentialService companyCredentialService;

    @Value("${essl.datasource.url:}")
    private String fallbackJdbcUrl;

    @Value("${essl.datasource.username:}")
    private String fallbackUsername;

    @Value("${essl.datasource.password:}")
    private String fallbackPassword;

    @Override
    public void run(ApplicationArguments args) {
        refreshAllDataSources();
    }

    public synchronized void refreshAllDataSources() {
        for (ClientEsslConfig config : configRepository.findByIsActiveTrue()) {
            registerDataSource(config);
        }

        try {
            java.util.List<CompanyCredential> companies = companyCredentialService.findAll();
            for (CompanyCredential comp : companies) {
                if (comp.getEsslServerIp() != null && !comp.getEsslServerIp().trim().isEmpty() &&
                    comp.getEsslDbName() != null && !comp.getEsslDbName().trim().isEmpty() &&
                    comp.getEsslUsername() != null && !comp.getEsslUsername().trim().isEmpty()) {
                    
                    int port = 1433;
                    try {
                        if (comp.getEsslPort() != null) {
                            port = comp.getEsslPort();
                        }
                    } catch (Exception e) {}

                    String jdbcUrl = "jdbc:sqlserver://" + comp.getEsslServerIp().trim() + ":" + port +
                            ";databaseName=" + comp.getEsslDbName().trim() +
                            ";trustServerCertificate=true;sendStringParametersAsUnicode=true;responseBuffering=adaptive;sendTimeAsDateTime=false";

                    String clientId = comp.getDbSourceName() != null ? comp.getDbSourceName().trim().toUpperCase() : "AUTONOMA";
                    
                    if (esslRoutingDataSource.containsDataSource(clientId)) {
                        closeExistingPool(clientId);
                    }

                    HikariDataSource ds = buildPool(
                            clientId,
                            jdbcUrl,
                            comp.getEsslUsername(),
                            comp.getEsslPassword()
                    );
                    esslRoutingDataSource.addDataSource(clientId, ds);
                    log.info("Registered dynamic Company profile ESSL datasource for client: {} using URL: {}", clientId, jdbcUrl);
                }
            }
        } catch (Exception e) {
            log.error("Failed to register ESSL datasource from company credentials: {}", e.getMessage());
        }

        if (!esslRoutingDataSource.containsDataSource(DEFAULT_CLIENT_ID) && hasFallbackProperties()) {
            registerFallbackDataSource();
        }

        log.info("ESSL routing datasource initialized with {} client(s)", esslRoutingDataSource.getRegisteredCount());
    }

    public synchronized void registerDataSource(ClientEsslConfig config) {
        if (config == null || config.getClientId() == null || config.getClientId().isBlank()) {
            return;
        }

        String clientId = config.getClientId().trim().toUpperCase();
        if (esslRoutingDataSource.containsDataSource(clientId)) {
            closeExistingPool(clientId);
        }

        HikariDataSource ds = buildPool(
                clientId,
                config.getJdbcUrl(),
                config.getUsername(),
                config.getPassword()
        );
        esslRoutingDataSource.addDataSource(clientId, ds);
        log.info("Registered ESSL datasource for client: {}", clientId);
    }

    public synchronized void removeDataSource(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return;
        }
        esslRoutingDataSource.removeDataSource(clientId.trim().toUpperCase());
    }

    private void registerFallbackDataSource() {
        HikariDataSource ds = buildPool(DEFAULT_CLIENT_ID, fallbackJdbcUrl, fallbackUsername, fallbackPassword);
        esslRoutingDataSource.setDefaultTargetDataSource(ds);
        esslRoutingDataSource.addDataSource(DEFAULT_CLIENT_ID, ds);
        log.info("Registered fallback ESSL datasource from application.properties as {}", DEFAULT_CLIENT_ID);
    }

    private HikariDataSource buildPool(String poolName, String jdbcUrl, String username, String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setPoolName("ESSL-" + poolName + "-Pool");
        ds.setMinimumIdle(1);
        ds.setMaximumPoolSize(10);
        ds.setIdleTimeout(300_000);
        ds.setConnectionTimeout(3000);
        ds.setInitializationFailTimeout(-1);
        return ds;
    }

    private void closeExistingPool(String clientId) {
        DataSource existing = esslRoutingDataSource.getRegisteredDataSource(clientId);
        if (existing instanceof HikariDataSource hikari) {
            hikari.close();
        }
    }

    private boolean hasFallbackProperties() {
        return fallbackJdbcUrl != null && !fallbackJdbcUrl.isBlank();
    }
}
