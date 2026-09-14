import { useMemo } from 'react';
import useSWR from 'swr';
import useAuth from 'hooks/useAuth';
import { fetcher } from 'utils/axios';

/**
 * usePagePermissions — BOS SOP Compliant Permission Hook
 *
 * Fetches the current user's page-level authorization flags from the backend
 * and returns a clean permission object for the given pageCode.
 *
 * Usage:
 *   const perms = usePagePermissions('M3110');
 *   if (perms.write) { // show + New button }
 *   if (perms.delete) { // show delete action }
 *   if (perms.export) { // show export button }
 *   if (perms.approval) { // show approve/reject actions }
 *
 * @param {string} pageCode - The unique page code (e.g., 'M3110', 'QM1210', 'AD1130')
 * @returns {{ loading: boolean, enabled: boolean, read: boolean, write: boolean, delete: boolean, export: boolean, approval: boolean, manager: boolean }}
 */
export default function usePagePermissions(pageCode, overrideUserId = null) {
  const { user } = useAuth();
  const isWaiting = overrideUserId === 'WAITING';
  const userId = isWaiting ? null : (overrideUserId || user?.userId || user?.id);

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const isPublicInduction = window.location.pathname.replace(/\/$/, '') === '/hra/ats/induction-trainee' && token && pageCode === 'HA1430';

  const { data: auths, isLoading, mutate } = useSWR((userId && !isWaiting) ? `/api/user-page-auth/${userId}` : null, fetcher, {
    revalidateIfStale: true,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10000 // 10-second deduping interval so newly granted permissions reflect immediately
  });

  return useMemo(() => {
    if (isWaiting) {
      return {
        loading: true,
        enabled: false,
        read: false,
        write: false,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: false
      };
    }

    if (isPublicInduction) {
      return {
        loading: false,
        enabled: true,
        read: true,
        write: true,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: false
      };
    }
    // Find the permission record for this specific pageCode
    const pageAuth = Array.isArray(auths) ? auths.find((a) => a?.page?.pageCode === pageCode) : null;

    const isCheckingOtherUser = overrideUserId && overrideUserId !== (user?.userId || user?.id);

    // If the user is a BOS admin (SuperUser) AND we are checking their own permissions, grant all unconditionally
    if (!isCheckingOtherUser && user?.userLevel >= 5) {
      return {
        loading: false,
        enabled: true,
        read: true,
        write: true,
        delete: true,
        export: true,
        approval: true,
        manager: true,
        additional1: true,
        additional2: true,
        dashboard: true
      };
    }

    // Admin (1) override: grant all EXCEPT for Super BOS(S) pages
    if (!isCheckingOtherUser && user?.userLevel === 1) {
      if (['AD1210', 'AD1220', 'AD1230', 'AD1240'].includes(pageCode)) {
        // Fall back to actual permissions for Super BOS(S) pages
      } else {
        return {
          loading: false,
          enabled: true,
          read: true,
          write: true,
          delete: true,
          export: true,
          approval: true,
          manager: true,
          additional1: true,
          additional2: true,
          dashboard: true,
          rawManager: pageAuth ? pageAuth.manager === 1 : false,
          rawAdditional1: pageAuth ? pageAuth.additional1 === 1 : false
        };
      }
    }

    // Rule: For Normal Users (Level 0), disabled pages must not be accessible.
    // If the backend didn't send the record, it's disabled.
    // If it sent the record but enable=0, it's disabled EXCEPT we preserve specific flags like dashboard if explicitly set.
    if (auths && (!pageAuth || pageAuth.enable === 0)) {
      return {
        loading: false,
        enabled: false,
        read: false,
        write: false,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: pageAuth ? pageAuth.addTaskEnable === 1 : false
      };
    }

    if (!pageAuth) {
      return {
        loading: false,
        enabled: false,
        read: false,
        write: false,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: false
      };
    }

    // While loading, default to read-only (graceful degradation — don't block users)
    if (isLoading || !auths) {
      return {
        loading: isLoading,
        enabled: true,
        read: true,
        write: false,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: false
      };
    }

    // If page is disabled for this user, block everything EXCEPT dashboard which can be independently granted
    if (pageAuth.enable === 0) {
      return {
        loading: false,
        enabled: false,
        read: false,
        write: false,
        delete: false,
        export: false,
        approval: false,
        manager: false,
        additional1: false,
        additional2: false,
        dashboard: pageAuth.addTaskEnable === 1
      };
    }

    // Normal case — return exact permission flags
    return {
      loading: false,
      enabled: true,
      read: pageAuth.readAcs === 1,
      write: pageAuth.write === 1,
      delete: pageAuth.deleteAcs === 1,
      export: pageAuth.export === 1,
      approval: pageAuth.approval === 1,
      manager: pageAuth.manager === 1,
      additional1: pageAuth.additional1 === 1,
      additional2: pageAuth.additional2 === 1,
      dashboard: pageAuth.addTaskEnable === 1
    };
  }, [auths, pageCode, isLoading]);
}

/**
 * Canonical mapping of all BOS page codes.
 * Import this in view files: import { PAGE_CODES } from 'hooks/usePagePermissions';
 * Usage: const pu
 * erms = usePagePermissions(PAGE_CODES.NPD_ITEM_GROUP);
 */
export const PAGE_CODES = {
  // 🛒 Purchase Reports 🛒
  PUR_BATCH_TRACEABILITY_REPORT: 'PUR1001',
  // ── HRA ──
  HRA_ATS: 'HA1110',
  HRA_INTERVIEW_PROCESS: 'HA1120',
  HRA_INTERVIEW_FINAL_PROCESS: 'HA1130',
  EMPLOYEE_TRANSFER: 'HA1280',
  HRA_PAYROLL_PENALTY: 'HA1290',
  HRA_LEAVE_ENCASHMENT_ENTRY: 'HA1294',
  HRA_LEAVE_ENCASHMENT_VERIFIED: 'HA1295',
  HRA_PAYROLL_PROCESS: 'HA1296',
  HRA_MY_HOLIDAY_REQUESTS: 'HA1210',
  HRA_HOLIDAY_MASTER: 'HA1320',
  HRA_HOLIDAY_APPROVALS_MGR: 'HA1220',
  HRA_HOLIDAY_APPROVALS_HR: 'HA1230',
  HRA_HOLIDAY_CALENDAR_REPORT: 'HA1240',
  HRA_HOLIDAY_YEARLY_SUMMARY: 'HA1250',
  HRA_ATTENDANCE_PERMISSION: 'HA1310',
  HRA_ATTENDANCE_PERMISSION_VERIFICATION: 'HA1315',
  HRA_ATTENDANCE_OD_ENTRY: 'HA1330',
  HRA_ATTENDANCE_OD_DETAILS: 'HA1330',
  HRA_ATTENDANCE_OD_VERIFY: 'HA1342',
  HRA_ATTENDANCE_LEAVE_DETAILS: 'HA1390',
  HRA_ATTENDANCE_LEAVE_VERIFICATION: 'HA1392',
  HRA_ATTENDANCE_LTA_DETAILS: 'HA1396',
  HRA_ATTENDANCE_LTA_VERIFICATION: 'HA1394',
  HRA_BIOMETRIC_ATTENDANCE: 'HA1340',
  HRA_ATTENDANCE_ENTRY: 'HA1345',
  HRA_SATISFACTION_DASHBOARD: 'HA1350',
  HRA_SATISFACTION_VENDOR_DASHBOARD: 'HA1365',
  HRA_SATISFACTION_CUSTOMER_DASHBOARD: 'HA1375',
  HRA_SATISFACTION_INTERNAL_CUSTOMER_DASHBOARD: 'HA1385',
  HRA_EMPLOYEE_ONBOARDING: 'HA1360',
  HRA_ONBOARDING_OFFER_LETTER: 'HA1360',
  HRA_ONBOARDING_APPOINTMENT_ORDER: 'HA1370',
  HRA_ONBOARDING_CONFIRMATION_ORDER: 'HA1380',
  HRA_ONBOARDING_RELIEVING_ORDER: 'HA1388',
  HRA_EMPLOYEE_MEMO_ENTRY: 'HA1370',
  HRA_EMPLOYEE_MEMO_LIST: 'HA1285',

  // ── Masters > HR > ATS ──
  ATS_INTERVIEW_CRITERIA: 'M2110',
  ATS_EMAIL_CONTENT: 'M2120',
  ATS_VERIFICATION: 'M2130',
  ATS_INDUCTION_CRITERIA: 'M2140',
  ATS_INDUCTION_ROUND: 'M2180',
  ATS_INDUCTION_PENDING: 'HA1410',
  ATS_INDUCTION_TRAINING: 'HA1420',
  ATS_INDUCTION_TRAINEE: 'HA1430',

  // ── Masters > HR > Employee ──
  EMP_TYPE: 'M2220',
  EMP_DEPARTMENT: 'M2230',
  EMP_DESIGNATION: 'M2240',
  EMP_LEVEL: 'M2250',
  EMP_SATISFACTION: 'M2270',
  EMP_MASTER: 'M2210',
  EMP_GRADE: 'M2260',
  EMP_ONBOARDING: 'M2280',

  // ── Masters > HR > Payroll ──
  PAY_HOLIDAY: 'M2310',
  PAY_BANK: 'M2320',
  PAY_SHIFT: 'M2330',
  PAY_LOAN: 'M2340',
  PAY_MONTH: 'M2395',
  PAY_LEAVE: 'M2350',
  PAY_LEAVE_ENTRY: 'HA1390',
  PAY_LEAVE_VERIFICATION: 'HA1392',
  PAY_LEAVE_CONFIG: 'M2393',
  PAY_LTA_VERIFICATION: 'HA1394',
  PAY_LTA_ENTRY: 'HA1396',
  PAY_PERMISSION: 'M2360',
  PAY_PETROL: 'M2370',
  PAY_POLICY: 'M2380',

  // ── Masters > HR > Asset ──
  ASSET_GROUP: 'M2510',
  ASSET_TYPE: 'M2520',
  ASSET_SUB_TYPE: 'M2530',

  // ── Masters > QMS ──
  QMS_CHECKLIST: 'M1210',
  QMS_AUDIT_TYPE: 'M1110',
  QMS_AUDIT_AREA: 'M1120',
  QMS_AUDIT_CRITERIA: 'M1130',
  QMS_MEETING: 'M1310',
  QMS_EB_SLAB: 'M1410',
  QMS_EB_METER: 'M1420',
  QMS_EB_POWER_CONSUMPTION: 'M1430',

  // ── Masters > NPD ──
  NPD_ITEM_TYPE: 'M3120',
  NPD_ITEM_SUBTYPE: 'M3130',
  NPD_OEM: 'M3140',
  NPD_OEM_MAPPING: 'M3150',
  NPD_MODEL: 'M3160',
  NPD_CAPACITY: 'M3170',
  NPD_ITEM_GROUP: 'M3110',
  NPD_PRODUCT_MASTER: 'M3115',
  NPD_PRODUCT_BOM: 'DD1110',
  NPD_PRODUCT_BUNDLE: 'DD1112',
  NPD_PRODUCT_PROCESS: 'DD1111',
  NPD_PACKING_PROCEDURE: 'DD1113',
  NPD_WIND_FARM: 'M3210',
  NPD_INVENTORY_TYPE: 'M3230',
  NPD_MATERIAL: 'M3300',
  NPD_MATERIAL_TYPE: 'M3310',
  NPD_MATERIAL_GRADE: 'M3320',
  NPD_SHAPE_MASTER: 'M3330',
  NPD_MATERIAL_CONDITION: 'M3340',
  NPD_PROCESS: 'M3180',
  NPD_PRODUCT_IPP: 'M3190',
  NPD_CHARACTER_SPECIFICATION: 'M3360',
  NPD_SAMPLE_SIZE: 'M3370',
  NPD_SAMPLE_FREQUENCY: 'M3380',
  NPD_CONTROL_METHOD: 'M3390',
  NPD_FEASIBILITY_CATEGORY: 'M3400',
  NPD_CORRECTIVE_ACTION: 'M3410',
  NPD_REACTION_PLAN: 'M3420',
  NPD_SEVERITY_FMEA: 'M3430',
  NPD_DETECTION_FMEA: 'M3440',
  NPD_OCCURANCE_FMEA: 'M3450',

  // ── Masters > Sales > CRM ──
  CRM_SATISFACTION: 'M5110',
  CRM_CONTACT: 'M5120',
  CRM_CUSTOMER: 'M5130',
  CRM_POTENTIAL: 'M5140',

  // ── Masters > Sales > Logistics ──
  LOG_PAYMENT_TERMS: 'M5210',
  LOG_DELIVERY_TERMS: 'M5220',
  LOG_CURRENCY: 'M5230',
  LOG_COUNTRY: 'M5250',
  LOG_STATE: 'M5260',
  LOG_SEGMENT: 'M5270',
  LOG_SUB_SEGMENT: 'M5280',
  LOG_DESPATCH_MODE: 'M5290',
  LOG_FREIGHT: 'M5300',

  // ── Masters > Vendor ──
  VEN_SUPPLIER: 'M4110',

  // ── QMS Transactions ──
  QMS_CHECKLIST_VERIFY: 'QM1110',
  QMS_CLOSE_RENEWAL: 'QM1120',
  QMS_CHECKLIST_CLOSE: 'QM1120',
  QMS_RENEWAL_VERIFY: 'QM1130',
  QMS_CHECKLIST_RENEWAL_VERIFY: 'QM1130',
  QMS_RENEWAL_REPORT: 'QM1140',
  QMS_CHECKLIST_REPORT: 'QM1140',
  QMS_AUDIT_SCHEDULE: 'QM1210',
  QMS_AUDIT_ATTENDANCE: 'QM1220',
  QMS_AUDIT_OBSERVATION: 'QM1230',
  QMS_AUDIT_NCR_CLOSE: 'QM1240',
  QMS_AUDIT_NCR_APPROVAL: 'QM1250',
  QMS_AUDIT_REPORT: 'QM1260',
  QMS_AUDIT_SCORE_REPORT: 'QM1270',
  QMS_AUDIT_VS_ACTUAL_REPORT: 'QM1280',
  QMS_MEETING_SCHEDULE: 'QM1310',
  QMS_MOM: 'QM1330',
  QMS_MEETING_MOM: 'QM1330',
  QMS_MEETING_ATTENDANCE: 'QM1320',
  QMS_CLOSE_MOM: 'QM1340',
  QMS_MEETING_CLOSE_MOM: 'QM1340',
  QMS_MOM_APPROVAL: 'QM1350',
  QMS_MEETING_MOM_APPROVAL: 'QM1350',
  QMS_MOM_REPORT: 'QM1360',
  QMS_MOM_SUMMARY_REPORT: 'QM1370',
  QMS_LOAN_APPLY: 'QM1410',
  HRA_LOAN_VERIFICATION: 'QM1420',
  HRA_LOAN_ISSUE: 'QM1430',
  HRA_LOAN_SHORT_CLOSE: 'QM1440',

  // ── Sales & Marketing ──
  SM_OCR_DASHBOARD: 'SM1110',
  SM_ENQUIRY: 'SM1120',
  SM_PRICE_MASTER: 'SM1130',
  SM_QUOTATION: 'SM1140',
  SM_QUOTATION_FOLLOW_UP: 'SM1141',
  SM_TYPE_OF_SERVICE: 'SM1150',
  SM_ORDER_MANAGEMENT: 'SM1160',
  SM_CUSTOMER_ORDER_SCHEDULE: 'SM1170',
  SM_INVOICES: 'SM1180',
  SM_DELIVERY_RECEIPTS: 'SM1190',

  // ── Admin Hub ──
  AD_COMPANY_PROFILE: 'AD1110',
  AD_DIVISION: 'AD1120',
  AD_USER_CREDENTIALS: 'AD1130',
  AD_USER_ACCESS: 'AD1140',
  AD_AUDIT_TRAIL: 'AD1150',
  AD_SESSION_ANALYTICS: 'AD1160',
  AD_FILE_TRACEABILITY: 'AD1170',
  DM_DOCUMENT_SEARCH: 'DM1010',
  AD_REPORT_TEMPLATE_DESIGNER: 'AD1200',
  AD_DATA_MIGRATION: 'AD1180',
  AD_ORGANIZATION_CHART: 'AD1190',
  AD_PAYROLL_WORKSPACE: 'AD1250',
  AD_AUTOMATION_DESIGNER: 'AD1270',
  AD_UOM: 'M5240',
  AD_HSN_CODE: 'M3220',
  AD_CURRENCY: 'M5230',
  AD_COUNTRY: 'M5250',
  AD_STATE: 'M5260',
  AD_CITY: 'M5265',

  // ── BOS Admin ──
  AD_BUSINESS_AUTH: 'AD1210',
  AD_APP_PREFERENCE: 'AD1220',
  AD_PREFIX_CREDENTIALS: 'AD1230',
  AD_SESSION_MONITORING: 'AD1240',
  AD_PROCESS_TRIGGER: 'AD1290',
  AD_TRIGGER_CONFIGURATION: 'AD1300',
  AD_CLIENT_NOTIFICATIONS: 'AD1310',

  // ── Support ──
  SUPPORT_RAISED_BY_ME: 'S1110',
  SUPPORT_RAISED_FOR_ME: 'S1120',
  SUPPORT_NOTEBOOK: 'S1130',

  // ── Missing Page Codes ──
  QMS_MEETING_UNNAMED: 'M1320',
  QMS_CHECKLIST_ACKNOWLEDGEMENT: 'QM1150',

  // ── Order Management ──
  OM_VISITOR_GATE_PASS: 'OM1000',
  OM_VISITOR_GATE_ENTRY: 'OM1001',

  // ── Dashboard ──
  DASHBOARD_DEFAULT: 'DB1110',
  DASHBOARD_ANALYTICS: 'DB1120',
  DASHBOARD_UNIFIED: 'DB1170',
  DASHBOARD_TASK: 'DB1160',
  DASHBOARD_EPM: 'DB1300',
  DASHBOARD_EXECUTIVE: 'DB1400',
  DASHBOARD_PRODUCT_360: 'DB1500',

  // ── Employee Self Care ──
  SELF_CARE_LEAVE_APPLICATION: 'ESC1010',
  SELF_CARE_LEAVE_TRAVEL_APPLICATION: 'ESC1020',
  SELF_CARE_OD_APPLY: 'ESC1030',
  SELF_CARE_PERMISSION_APPLY: 'ESC1040',
  SELF_CARE_LEAVE_ENCASHMENT_ENTRY: 'ESC1050',

  // ── Inventory ──
  INV_TRANSACTION_TYPE: 'AD1190',
  INV_CURRENT_STOCK_REPORT: 'INV1001',
  INV_STOCK_LEDGER_REPORT: 'INV1002',
  INV_REJECTION_STOCK_REPORT: 'INV1003',
  INV_STOCK_MOVEMENT_REPORT: 'INV1004'
};
