-- ===============================================================================
-- 20260722_V1048.0__Update_Assigned_To_And_By_In_Qms_Close_Mom.sql
-- Purpose: Populate existing ASSIGNED_TO_ID and ASSIGNED_BY_ID values
-- ===============================================================================

update a set a.ASSIGNED_BY_ID= b.ASSIGNED_BY_ID,a.ASSIGNED_TO_ID=b.ASSIGNED_TO_ID from QMS_CLOSE_MOM_AND_VERIFY a
INNER JOIN QMS_MOM_DETAILS b on b.ID=a.ACTION_ITEM_ID
