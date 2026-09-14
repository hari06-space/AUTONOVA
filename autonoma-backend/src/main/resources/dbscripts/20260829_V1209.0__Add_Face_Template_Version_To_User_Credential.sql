-- Organization: Nutech
-- Owner: Nutech
-- Created At: 2026-08-29
-- Description: Add FACE_TEMPLATE_VERSION column to AD_USER_CREDENTIAL to track
--              the face-api.js model version used during enrollment. This enables
--              safe future model migrations and identifies LEGACY templates that
--              were enrolled under older, lower-quality thresholds.

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'AD_USER_CREDENTIAL')
      AND name = N'FACE_TEMPLATE_VERSION'
)
BEGIN
    ALTER TABLE AD_USER_CREDENTIAL
        ADD FACE_TEMPLATE_VERSION NVARCHAR(20) NULL;
END
GO
