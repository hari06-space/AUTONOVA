package com.autonoma.erp.config;

import org.hibernate.dialect.identity.IdentityColumnSupportImpl;

public class CustomIdentityColumnSupportImpl extends IdentityColumnSupportImpl {
    @Override
    public boolean supportsIdentityColumns() {
        return true;
    }

    @Override
    public boolean supportsInsertSelectIdentity() {
        return false;
    }

    @Override
    public String getIdentitySelectString(String table, String column, int type) {
        return "select @@identity";
    }

    @Override
    public String getIdentityColumnString(int type) {
        return "identity";
    }
}
