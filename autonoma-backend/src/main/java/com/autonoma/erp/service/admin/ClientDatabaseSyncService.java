package com.autonoma.erp.service.admin;

import com.autonoma.erp.model.admin.CompanyCredential;
import com.autonoma.erp.modules.platform.identity.entity.CliClientDatabaseConfig;

public interface ClientDatabaseSyncService {

    /**
     * Synchronize company details into the client's dedicated database by company ID.
     */
    default ClientDbSyncResult syncToClientDatabase(Long companyId) {
        return syncToClientDatabase(companyId, null);
    }

    ClientDbSyncResult syncToClientDatabase(Long companyId, java.util.Set<String> modifiedFieldKeys);

    default ClientDbSyncResult syncToClientDatabase(CompanyCredential company, CliClientDatabaseConfig dbConfig) {
        return syncToClientDatabase(company, dbConfig, null);
    }

    ClientDbSyncResult syncToClientDatabase(CompanyCredential company, CliClientDatabaseConfig dbConfig, java.util.Set<String> modifiedFieldKeys);
}
