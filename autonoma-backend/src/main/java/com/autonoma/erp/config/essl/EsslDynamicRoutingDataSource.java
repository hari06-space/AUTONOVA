package com.autonoma.erp.config.essl;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class EsslDynamicRoutingDataSource extends AbstractRoutingDataSource {

    private final Map<Object, Object> targetDataSources = new ConcurrentHashMap<>();

    @Override
    protected Object determineCurrentLookupKey() {
        try {
            return EsslDataSourceContextHolder.getClientId();
        } catch (NoClassDefFoundError e) {
            return null;
        }
    }

    @Override
    public void setTargetDataSources(Map<Object, Object> targetDataSources) {
        this.targetDataSources.putAll(targetDataSources);
        super.setTargetDataSources(this.targetDataSources);
    }

    public void addDataSource(String clientId, DataSource dataSource) {
        this.targetDataSources.put(clientId, dataSource);
        super.setTargetDataSources(this.targetDataSources);
        super.afterPropertiesSet();
    }

    public void removeDataSource(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return;
        }
        String normalizedId = clientId.trim().toUpperCase();
        DataSource existing = getRegisteredDataSource(normalizedId);
        if (existing instanceof HikariDataSource hikari) {
            hikari.close();
        }
        targetDataSources.remove(normalizedId);
        super.setTargetDataSources(this.targetDataSources);
        super.afterPropertiesSet();
    }

    public boolean containsDataSource(String clientId) {
        return targetDataSources.containsKey(clientId);
    }

    public DataSource getRegisteredDataSource(String clientId) {
        Object ds = targetDataSources.get(clientId);
        return ds instanceof DataSource ? (DataSource) ds : null;
    }

    public int getRegisteredCount() {
        return targetDataSources.size();
    }
}
