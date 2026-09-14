-- ============================================================
-- Security Migration: Rotate SUPER BOSS Password to BCrypt
-- Password: admin123 (BCrypt cost factor 12)
-- RUN THIS SCRIPT ONCE on the AUTONOMA master database BEFORE
-- deploying the updated backend that uses BCryptPasswordEncoder.
-- After this script runs, the SUPER BOSS account can only be
-- authenticated with the BCrypt-aware encoder.
-- ============================================================

-- 1. Update the SUPER BOSS password to a BCrypt hash.
--    The plaintext password is: admin123
UPDATE AD_USER_CREDENTIAL
SET PASSWORD = '$2b$12$qdpmFklqFMZVvglamOAODu0J60cFu9VsBT4CYoLNp5hlEFpt7PwSK',
    UPDATED_BY = 'SECURITY_MIGRATION',
    UPDATED_DATE = GETDATE()
WHERE USER_ID = 'SUPER BOSS';

-- 2. Terminate all currently active sessions to force re-authentication
--    with the new password encoder.
UPDATE AD_USER_SESSION_AUDIT
SET SESSION_STATUS = 'COMPLETED',
    LOGOUT_TIME = GETDATE()
WHERE SESSION_STATUS = 'ACTIVE';

-- 3. Verify the update was applied.
SELECT USER_ID, LEFT(PASSWORD, 7) AS HASH_PREFIX, UPDATED_DATE
FROM AD_USER_CREDENTIAL WITH (NOLOCK)
WHERE USER_ID = 'SUPER BOSS';
