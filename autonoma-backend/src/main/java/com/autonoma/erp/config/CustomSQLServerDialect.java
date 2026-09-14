package com.autonoma.erp.config;

import org.hibernate.dialect.SQLServerDialect;
import org.hibernate.dialect.identity.IdentityColumnSupport;

public class CustomSQLServerDialect extends SQLServerDialect {

    public CustomSQLServerDialect() {
        super();
    }

    @Override
    public IdentityColumnSupport getIdentityColumnSupport() {
        return new CustomIdentityColumnSupportImpl();
    }
}

