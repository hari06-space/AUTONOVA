package AppUtil;

public class AppConstants {

    public static final String DEFAULT_DB_SOURCE_NAME = "AUTONOMA";
    public static final String COMPANY_CRED_LOGO_PATH = "COMPANY CREDENTIALS";
    public static final String COMPANY_CRED_LOG_IN_BG_PATH = "COMPANY CREDENTIALS";

    // Multi-tenant additions
    public static final String DEFAULT_TENANT_ID = "DEFAULT_TENANT";
    public static final String DEFAULT_CLIENT_CODE = "123456";

    // USER Level
    public static final Integer USER_LEVEL_NORMAL = 0;
    public static final Integer USER_LEVEL_ADMIN = 1;
    public static final Integer USER_LEVEL_BOS_ADMIN = 5;

    // Prevents instantiation
    private AppConstants() {
    }
}
