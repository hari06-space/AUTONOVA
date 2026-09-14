package com.autonoma.erp.modules.platform.identity.service;

import com.autonoma.erp.modules.platform.identity.dto.DatabaseConnectionRequestDTO;
import com.autonoma.erp.modules.platform.identity.dto.DatabaseTestResultDTO;

import java.util.List;

public interface DatabaseConnectionService {

    /**
     * Test connection to database server using provided connection parameters.
     */
    DatabaseTestResultDTO testConnection(DatabaseConnectionRequestDTO request);

    /**
     * List all accessible databases on the server using provided connection parameters.
     */
    List<String> listDatabases(DatabaseConnectionRequestDTO request);

    /**
     * Perform database backup (save to server folder or return byte stream for client download)
     */
    byte[] backupDatabase(DatabaseConnectionRequestDTO request, String backupFolder, boolean download) throws Exception;
}
