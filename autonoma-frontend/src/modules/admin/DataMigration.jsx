import { useState, useEffect, useRef } from 'react';
import { useColorScheme } from '@mui/material/styles';
import {
  Typography, Stack, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Tab, Tabs, Box, Avatar, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, CircularProgress, LinearProgress,
  Tooltip, Checkbox, useMediaQuery, useTheme, Divider, IconButton, TextField, MenuItem,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';

import {
  IconDatabaseExport, IconPlayerPlay, IconHistory, IconInfoCircle,
  IconCheck, IconServer, IconPlayerStop, IconTrash, IconRefresh,
  IconDatabase, IconAlertTriangle, IconChevronDown, IconChevronUp,
  IconUpload, IconDownload, IconFileSpreadsheet, IconFolder,
  IconChevronLeft, IconChevronRight, IconClock
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSPageHeader, BOSPillTabs } from 'ui-component/bos';
import axios from 'utils/axios';
import { format } from 'date-fns';

// ==============================|| SCOPE DATA CONFIG ||============================== //

const SCOPE_DATA = {
  all: {
    title: 'Full Migration Scope',
    subtitle: 'All target tables and synchronization rules',
    items: [
      { table: 'hrm_department_master', tag: 'Target', desc: 'Imports departments from legacy DEPT, preserves original department codes, and registers department names.' },
      { table: 'qms_checklist_master', tag: 'Target', desc: 'Imports base checklist codes, revision headers, frequency rules, status values, and validity schedules.' },
      { table: 'qms_checklist_department', tag: 'Mapping', desc: 'Re-maps relational organization units and binds departments to imported checklist.' },
      { table: 'qms_checklist_level', tag: 'Hierarchy', desc: 'Maps structural target grades/levels to their corresponding checklist.' },
      { table: 'qms_checklist_assignment', tag: 'Target', desc: 'Imports history of checklist assignments, employee tasks, dates, carry forward counters, and verification parameters.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Tracks execution timestamps, logging user identity, records migrated, success status, and details.' }
    ]
  },
  departments: {
    title: 'Department Migration Scope',
    subtitle: 'Target tables for department import',
    items: [
      { table: 'hrm_department_master', tag: 'Target', desc: 'Imports departments from legacy DEPT, preserves original department codes, and registers department names.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  checklistsAndAssignments: {
    title: 'Checklist & Assignments Migration Scope',
    subtitle: 'Target tables for checklist templates and assignments import',
    items: [
      { table: 'qms_checklist_master', tag: 'Target', desc: 'Imports base checklist codes, revision headers, frequency rules, status values, and validity schedules.' },
      { table: 'QMS_ATTACHMENT_PATH', tag: 'Target', desc: 'Migrates physical document attachments for Checklist Masters from FILE_UPLOAD_TRANS to QMS_ATTACHMENT_PATH.' },
      { table: 'qms_checklist_department', tag: 'Mapping', desc: 'Re-maps relational organization units and binds departments to imported checklist.' },
      { table: 'qms_checklist_level', tag: 'Hierarchy', desc: 'Maps structural target grades/levels to their corresponding checklist.' },
      { table: 'qms_checklist_assignment', tag: 'Target', desc: 'Imports history of checklist assignments, employee tasks, dates, carry forward counters, and verification parameters.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  closeChecklists: {
    title: 'Close Checklist Scope',
    subtitle: 'Target tables for legacy pending master checklist tasks',
    items: [
      { table: 'qms_checklist_assignment', tag: 'Target', desc: 'Migrates active, completed, or pending checklist tasks from legacy HRMS_CHECKLIST_PENDING_MASTER table.' },
      { table: 'QMS_ATTACHMENT_PATH (QM1120)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=CLOSE CHECKLIST) using legacy ROW_ID. Copies physical files from D:\\ERPCommon\\erpimage\\HRMS to Quality Management Systems/Checklist/Close Checklist - Renewal and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=QM1120.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  checklistMasterDocuments: {
    title: 'Checklist Master Documents Scope',
    subtitle: 'Target tables for Checklist Master document attachments',
    items: [
      { table: 'QMS_ATTACHMENT_PATH', tag: 'Target', desc: 'Migrates physical document attachments for Checklist Masters from FILE_UPLOAD_TRANS to QMS_ATTACHMENT_PATH.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  checklistClosed: {
    title: 'Checklist Closed Scope',
    subtitle: 'Target table for closed checklist history records',
    items: [
      { table: 'QMS_CHECKLIST_CLOSED', tag: 'Target', desc: 'Migrates 241,663 completed/pending/unresolved records from HRMS_CHECKLIST_PENDING_MASTER. Maps status strings to AD_STATUS_MASTER (auto-creates missing statuses). Normalizes FREQUENCY_LEVEL (BI-ANNUAL→HALF_YEARLY, ANNUAL→YEARLY, null→DAILY). Processed in batches of 1,000.' },
      { table: 'QMS_ATTACHMENT_PATH (QM1120)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=CLOSE CHECKLIST) using legacy ROW_ID. Copies physical files from D:\\ERPCommon\\erpimage\\HRMS to Quality Management Systems/Checklist/Close Checklist - Renewal and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=QM1120.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  hrmsEmployeeType: {
    title: 'HRMS Employee Type Scope',
    subtitle: 'Target tables for employee types import',
    items: [
      { table: 'hr_employee_type', tag: 'Target', desc: 'Imports employee types from legacy HRMS_EMPLOYEE_TYPE_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  divisionMaster: {
    title: 'Division Master Scope',
    subtitle: 'Target tables for division master import',
    items: [
      { table: 'AD_DIVISION', tag: 'Target', desc: 'Imports division records from legacy divisions table.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  userCredentials: {
    title: 'User Credentials Scope',
    subtitle: 'Target tables for user credentials import',
    items: [
      { table: 'AD_USER_CREDENTIAL', tag: 'Target', desc: 'Imports user credentials from legacy ERP_USER table and maps roles to modern user levels.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  designations: {
    title: 'Designations Scope',
    subtitle: 'Target tables for designations import',
    items: [
      { table: 'HR_DESIGNATION', tag: 'Target', desc: 'Imports designations from legacy HRMS_DESIG_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  designationLevels: {
    title: 'Designation Levels Scope',
    subtitle: 'Target tables for designation levels import',
    items: [
      { table: 'HR_DESIGNATION_LEVEL', tag: 'Target', desc: 'Imports designation levels from legacy HRMS_DESIG_LEVEL_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  employeeMaster: {
    title: 'Employee Master Scope',
    subtitle: 'Target tables for complete employee profile',
    items: [
      { table: 'HR_EMPLOYEE', tag: 'Target', desc: 'Imports core employees from EMPLOYEE legacy table.' },
      { table: '13_SUB_TABLES', tag: 'Target', desc: 'Imports personal, job, kyc, passport, and other sub-details.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  interviewCriteria: {
    title: 'Interview Criteria Scope',
    subtitle: 'Target tables for interview criteria import',
    items: [
      { table: 'HR_INTERVIEW', tag: 'Target', desc: 'Imports interview criteria details from legacy INTERVIEW_CRITERIA_MASTER.' },
      { table: 'HR_INTERVIEW_DEPARTMENT_MAPPING', tag: 'Mapping', desc: 'Maps structural target departments to their corresponding interview criteria.' },
      { table: 'HR_INTERVIEW_LEVEL_MAPPING', tag: 'Mapping', desc: 'Maps structural target grades/levels to their corresponding interview criteria.' },
      { table: 'QMS_ATTACHMENT_PATH (M2110)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=INTERVIEW CRITERIA) using legacy ROW_ID. Copies physical files from D:\\ERPCommon\\erpimage\\CRITERIA to ATS/Interview Criteria Master and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=M2110.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  inductionCriteria: {
    title: 'Induction Criteria Scope',
    subtitle: 'Target tables for induction criteria import',
    items: [
      { table: 'HR_INDUCTION', tag: 'Target', desc: 'Imports induction criteria details from legacy INDUCTION_CRITERIA_MASTER.' },
      { table: 'HR_INDUCTION_DEPARTMENT_MAPPING', tag: 'Mapping', desc: 'Maps structural target departments to their corresponding induction criteria.' },
      { table: 'HR_INDUCTION_LEVEL_MAPPING', tag: 'Mapping', desc: 'Maps structural target grades/levels to their corresponding induction criteria.' },
      { table: 'QMS_ATTACHMENT_PATH (M2140)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=INDUCTION) using legacy ROW_ID. Copies physical files from D:\\ERPCommon\\erpimage\\INDUCTION to ATS/Induction Criteria and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=M2140.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  applicantVerificationCriteria: {
    title: 'Applicant Verification Criteria Scope',
    subtitle: 'Target tables for applicant verification criteria import',
    items: [
      { table: 'HR_VERIFICATION_CRITERIA', tag: 'Target', desc: 'Imports applicant verification criteria from legacy HRMS_APPLICANT_VERIFICATION_CRITERIA.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  atsRecruitment: {
    title: 'ATS Recruitment Scope',
    subtitle: 'Target tables for old recruitment / ATS data migration',
    items: [
      { table: 'HR_EMPLOYEE', tag: 'Target', desc: 'Imports core candidates/applicants from HRMS_NEWAPP_MASTER with default FROMWHERE=ATS.' },
      { table: 'HR_EMPLOYEE_PERSONAL', tag: 'Target', desc: 'Imports applicant personal detail sub-records.' },
      { table: 'HR_EMPLOYEE_CONTACT', tag: 'Target', desc: 'Imports applicant contact detail sub-records.' },
      { table: 'HR_EMPLOYEE_EDUCATION', tag: 'Target', desc: 'Imports applicant education detail sub-records with physical document copy from FILE_UPLOAD_TRANS to Employee Master/Education.' },
      { table: 'HR_EMPLOYEE_EXPERIENCE', tag: 'Target', desc: 'Imports applicant experience detail sub-records with physical document copy from FILE_UPLOAD_TRANS to Employee Master/Experience.' },
      { table: 'HR_EMPLOYEE_JOB_PROFILE', tag: 'Target', desc: 'Imports applicant salary details and initial job profile details.' },
      { table: 'HR_EMPLOYEE_KYC_DOCUMENT', tag: 'Target', desc: 'Imports applicant KYC documents (HRMS_KYC_DOCUMENTS) with physical document copy to Employee Master/KYC.' },
      { table: 'HR_APPLICANT_INTERVIEW', tag: 'Target', desc: 'Imports assigned interview processes (ASSIGN_INTERVIEW_PROCESS), mappings, feedback json (INTERVIEW_PROCESS_TRANS), and copies round attachments to Employee Master/Interview.' },
      { table: 'HR_EMPLOYEE_SELF_ASSESSMENT', tag: 'Target', desc: 'Imports candidate self-assessment answers (INTERVIEW_SELF_ASSESMENT) and copies previous payslips to Employee Master/SelfAssessment.' },
      { table: 'HR_EMPLOYEE_ACTIVITY', tag: 'Target', desc: 'Imports candidate additional activities (HRMS_ADDITIONAL_ACTIVITIES) and copies certificates to Employee Master/Activity.' },
      { table: 'HR_APPLICANT_VERIFICATION_SUBMISSION', tag: 'Target', desc: 'Imports applicant verification criteria headers.' },
      { table: 'HR_APPLICANT_VERIFICATION_RESPONSE', tag: 'Target', desc: 'Imports applicant verification criteria results.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  grades: {
    title: 'Grade Master Scope',
    subtitle: 'Target tables for grade master import',
    items: [
      { table: 'HR_GRADE_DETAIL', tag: 'Target', desc: 'Imports grades from legacy HRMS_GRADE_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  auditAreas: {
    title: 'Audit Area Master Scope',
    subtitle: 'Target tables for audit areas import',
    items: [
      { table: 'QMS_AUDIT_AREA', tag: 'Target', desc: 'Imports audit areas and zones from legacy AUDIT_ZONE_AREA_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  auditTypes: {
    title: 'Audit Type Master Scope',
    subtitle: 'Target tables for audit types import',
    items: [
      { table: 'QMS_AUDIT_TYPE', tag: 'Target', desc: 'Imports audit types from legacy AUDIT_TYPE_MASTER.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  auditCriteria: {
    title: 'Audit Criteria Master Scope',
    subtitle: 'Target tables for audit criteria import',
    items: [
      { table: 'QMS_AUDIT_CRITERIA', tag: 'Target', desc: 'Imports audit criteria (clause, criteria text, department, level, attachment rules) from legacy AUDIT_MASTER. De-duplicates by Clause + Audit Type.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  meetingMaster: {
    title: 'Meeting Master Scope',
    subtitle: 'Target tables for meeting master import',
    items: [
      { table: 'QMS_MEETING_MASTER', tag: 'Target', desc: 'Imports meeting master templates from legacy MINUTES_MEETING_MASTER.' },
      { table: 'QMS_MEETING_EMPLOYEE_MAPPING', tag: 'Mapping', desc: 'Maps and stores employee associations for each meeting.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  meetingSchedule: {
    title: 'Meeting Schedule Scope',
    subtitle: 'Target tables for meeting schedule import',
    items: [
      { table: 'QMS_MEETING_SCHEDULE', tag: 'Target', desc: 'Imports meeting schedules from legacy MEETING_SCHEDULE_MASTER. De-duplicates by schedule number.' },
      { table: 'QMS_MEETING_DEPARTMENT_MAPPING', tag: 'Mapping', desc: 'Maps and stores associated department details for each schedule.' },
      { table: 'QMS_MEETING_PARTICIPANT_MAPPING', tag: 'Mapping', desc: 'Maps and stores participant employee associations for each schedule.' },
      { table: 'QMS_ATTACHMENT_PATH (QM1310)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=MEETING SCHEDULE) using legacy ROW_ID. Copies physical files from D:\\ERPCommon\\erpimage\\HRMS → BOS_DOCUMENTS/QUALITY MANAGEMENT SYSTEMS/Meeting/Meeting Schedule and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=QM1310.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  meetingUserAttendance: {
    title: 'Meeting User Attendance Scope',
    subtitle: 'Target tables for meeting user attendance import',
    items: [
      { table: 'QMS_MEETING_USER_ATTENDANCE', tag: 'Target', desc: 'Imports meeting user attendance from legacy MEETING_USER_ATTENDANCE, mapping schedule and employee.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  meetingMom: {
    title: 'Meeting Observations / MOM Scope',
    subtitle: 'Target tables for meeting minutes and observations import',
    items: [
      { table: 'QMS_MOM_MASTER', tag: 'Target', desc: 'Imports MOM master templates from legacy MEETING_MINUTES_MASTER.' },
      { table: 'QMS_MOM_DETAILS', tag: 'Target', desc: 'Imports MOM details and action/info items from legacy MEETING_MINUTE_TRANS.' },
      { table: 'QMS_ATTACHMENT_PATH (QM1320)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=MEETING MINUTES) using legacy REF_ROW_ID, copies physical files from D:\\ERPCommon\\erpimage\\HRMS → Minutes of Meeting folder, and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=QM1320.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  closeMom: {
    title: 'Close MOM Scope',
    subtitle: 'Target tables for Close MOM records and attachments',
    items: [
      { table: 'QMS_CLOSE_MOM_AND_VERIFY', tag: 'Target', desc: 'Imports Close MOM records from legacy QMS_ACTION_ITEM_AUDIT table, preserving primary key IDs.' },
      { table: 'QMS_ATTACHMENT_PATH (QM1340)', tag: 'Attachment', desc: 'Reads FILE_UPLOAD_TRANS (FROM_WHERE=CORRECTIVE_ACTION) using legacy REF_ROW_ID, copies physical files from D:\\ERPCommon\\erpimage\\HRMS → QUALITY MANAGEMENT SYSTEMS/Meeting/Close MOM, and saves each record in QMS_ATTACHMENT_PATH with PAGE_CODE=QM1340.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  visitorGatePass: {
    title: 'Visitor Gate Pass Scope',
    subtitle: 'Target tables for visitor gate pass import',
    items: [
      { table: 'OM_VISITOR_GATE_PASS', tag: 'Target', desc: 'Imports visitor gate pass records from legacy VISITOR_GATE_PASS table. Maps legacy string statuses to integer representation.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  termsMaster: {
    title: 'Terms Master Scope',
    subtitle: 'Target tables for terms import',
    items: [
      { table: 'MST_TERMS_MASTER', tag: 'Target', desc: 'Imports terms from legacy termmasters table, splitting #br# delimited values into individual rows.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  },
  productBomMaster: {
    title: 'Product BOM Data Migration Scope',
    subtitle: 'Target tables for Product BOM import',
    items: [
      { table: 'NPD_BOM_MASTER', tag: 'Target', desc: 'Imports BOM headers from legacy bommaster.' },
      { table: 'NPD_BOM_PROCESS', tag: 'Hierarchy', desc: 'Imports BOM routing processes from legacy itemprocessmaster.' },
      { table: 'NPD_BOM_PROCESS_MATERIAL', tag: 'Mapping', desc: 'Imports allocated raw materials from legacy itemprocess_raw.' },
      { table: 'NPD_BOM_PROCESS_MACHINE', tag: 'Mapping', desc: 'Imports allocated machines from legacy itemprocess_machine.' },
      { table: 'NPD_BOM_PROCESS_TOOL', tag: 'Mapping', desc: 'Imports allocated tools from legacy itemprocess_tools.' },
      { table: 'ad_migration_audit_log', tag: 'Audit', desc: 'Logs execution timestamp, user identity, record count, and status for this migration step.' }
    ]
  }
};

const TAG_COLORS = {
  Target: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
  Mapping: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  Hierarchy: { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  Audit: { bg: 'rgba(148,163,184,0.12)', color: '#64748b' },
  Attachment: { bg: 'rgba(6,182,212,0.12)', color: '#0891b2' },
};

// ==============================|| STATS PARSER & HELPERS ||============================== //

// ==============================|| STATS PARSER & HELPERS ||============================== //

const parseMigrationStats = (realStats, resultMessage, latestLog) => {
  // 1. Check if active or valid realStats exists (ignore empty IDLE dummy)
  if (
    realStats &&
    realStats.status &&
    realStats.status !== 'IDLE' &&
    (realStats.totalRecords > 0 || realStats.migratedRecords > 0 || realStats.status === 'IN_PROGRESS' || realStats.status === 'STOPPED')
  ) {
    const total = realStats.totalRecords || ((realStats.migratedRecords || 0) + (realStats.failedRecords || 0));
    const migrated = realStats.migratedRecords || 0;
    const failed = realStats.failedRecords !== undefined
      ? realStats.failedRecords
      : (realStats.pendingRecords !== undefined && realStats.status === 'COMPLETED' ? realStats.pendingRecords : Math.max(0, total - migrated));
    return {
      hasData: true,
      total,
      migrated,
      failed,
      status: realStats.status || 'COMPLETED',
      rawMessage: realStats.message || ''
    };
  }

  // 2. Parse text from resultMessage OR latestLog.message
  const textToParse = typeof resultMessage === 'object'
    ? (resultMessage.message || '')
    : (resultMessage || latestLog?.message || '');

  let migrated = 0;
  let failed = 0;
  let total = 0;
  let found = false;

  if (textToParse) {
    const skippedMatch = textToParse.match(/Skipped:\s*(\d+)/i);
    const failedMatch = textToParse.match(/Failed:\s*(\d+)/i);
    const skippedCount = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
    const failedCount = failedMatch ? parseInt(failedMatch[1], 10) : 0;

    // Pattern 1: "Total records migrated: 120. Errors: 2" or "Total records migrated: 120"
    const p1 = textToParse.match(/Total records migrated:\s*(\d+)(?:\.\s*Errors:\s*(\d+))?/i);
    if (p1) {
      migrated = parseInt(p1[1], 10) || 0;
      failed = parseInt(p1[2] || '0', 10) || failedCount || skippedCount;
      total = migrated + failed;
      found = true;
    }

    // Pattern 2: "Migrated 120 / 150 records (30 skipped)"
    if (!found) {
      const p2 = textToParse.match(/Migrated\s*(\d+)\s*\/\s*(\d+)\s*(?:records|items|rows)?(?:\s*\((\d+)\s*(?:skipped|failed|errors)\))?/i);
      if (p2) {
        migrated = parseInt(p2[1], 10) || 0;
        total = parseInt(p2[2], 10) || 0;
        failed = parseInt(p2[3] || '0', 10) || skippedCount || Math.max(0, total - migrated);
        found = true;
      }
    }

    // Pattern 3: "succeeded: 120, failed: 2" or "120 succeeded, 2 failed"
    if (!found) {
      const p3 = textToParse.match(/(\d+)\s*(?:succeeded|inserted|migrated).*?(\d+)\s*(?:failed|errors|skipped)/i);
      if (p3) {
        migrated = parseInt(p3[1], 10) || 0;
        failed = parseInt(p3[2], 10) || 0;
        total = migrated + failed;
        found = true;
      }
    }

    // Pattern 4: "Successfully migrated 120 ... records/rows/items/departments"
    if (!found) {
      const p4 = textToParse.match(/(?:Successfully migrated|Migrated|Imported|Processed|Cleared|Inserted|previously migrated)\s*(\d+)/i);
      if (p4) {
        migrated = parseInt(p4[1], 10) || 0;
        failed = skippedCount + failedCount;
        total = migrated + failed;
        found = true;
      }
    }

    // Pattern 5: "(\d+) records migrated" or "(\d+) departments migrated"
    if (!found) {
      const p5 = textToParse.match(/(\d+)\s*(?:records?|items?|rows?|departments?|designations?|grades?|employees?|products?|materials?|checklists?)\s*(?:migrated|imported|processed|inserted)/i);
      if (p5) {
        migrated = parseInt(p5[1], 10) || 0;
        failed = skippedCount + failedCount;
        total = migrated + failed;
        found = true;
      }
    }
  }

  // 3. Fallback to latestLog record count if available
  const logCount = latestLog?.recordsCount ?? latestLog?.records_count ?? latestLog?.recordCount;
  if (logCount !== undefined && logCount !== null && logCount > 0) {
    if (!found) {
      migrated = logCount;
      total = logCount;
      failed = 0;
      found = true;
    } else if (logCount > total) {
      total = logCount;
      if (failed === 0 && total > migrated) {
        failed = total - migrated;
      }
    }
  }

  if (found || (textToParse && (textToParse.toLowerCase().includes('success') || textToParse.toLowerCase().includes('migrated')))) {
    const isFailed = (latestLog?.status === 'FAILED') || (textToParse && textToParse.toLowerCase().includes('failed'));
    return {
      hasData: true,
      total: total || migrated,
      migrated,
      failed,
      status: isFailed ? 'FAILED' : 'COMPLETED',
      rawMessage: textToParse || latestLog?.message || ''
    };
  }

  if (latestLog && (latestLog.recordsCount !== undefined || latestLog.status)) {
    const count = logCount || 0;
    return {
      hasData: true,
      total: count,
      migrated: count,
      failed: 0,
      status: latestLog.status || 'COMPLETED',
      rawMessage: latestLog.message || ''
    };
  }

  return {
    hasData: false,
    total: 0,
    migrated: 0,
    failed: 0,
    status: 'NOT_STARTED',
    rawMessage: ''
  };
};

const formatDuration = (seconds) => {
  if (seconds == null || isNaN(seconds) || seconds < 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
};

// ==============================|| MIGRATION CARD ||============================== //

function MigrationCard({ step, loading, isClearing, disabled, onRun, onStop, onClear, onScope, onDownloadSample, onUploadFile, onViewLog, onFinish, isDark, isExcelTab, resultMessage, latestLog }) {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);
  const [realStats, setRealStats] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalDuration, setFinalDuration] = useState(null);
  const startTimeRef = useRef(null);

  // Live timer effect for migration execution
  useEffect(() => {
    let timerInterval;
    if (loading) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      setFinalDuration(null);
      timerInterval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (startTimeRef.current) {
        const total = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
        setFinalDuration(total);
        startTimeRef.current = null;
      }
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [loading]);

  useEffect(() => {
    let intervalId;
    if (loading) {
      const pollProgress = async () => {
        try {
          const res = await axios.get('/api/admin/migration/progress/' + step.id);
          if (res.data && res.data.status && res.data.status !== 'IDLE') {
            setRealStats(res.data);
            if (res.data.elapsedSeconds != null) {
              setElapsedSeconds(res.data.elapsedSeconds);
              startTimeRef.current = Date.now() - (res.data.elapsedSeconds * 1000);
            }
            if (res.data.totalRecords > 0) {
              const currentMigrated = (res.data.migratedRecords || 0) + (res.data.failedRecords || 0);
              setProgress(Math.min(100, Math.max(5, (currentMigrated / res.data.totalRecords) * 100)));
            }
            if (res.data.status === 'COMPLETED' || res.data.status === 'FAILED' || res.data.status === 'STOPPED') {
              if (onFinish) onFinish(step.id);
            }
          }
        } catch (e) {
          // Fallback progress animation
          setProgress((oldProgress) => {
            if (oldProgress >= 90) return oldProgress;
            return Math.min(oldProgress + Math.random() * 8, 90);
          });
        }
      };

      pollProgress();
      intervalId = setInterval(pollProgress, 800);
    } else {
      setProgress((p) => {
        if (p > 0 && p < 100) return 100;
        return p;
      });
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, step.id, onFinish]);

  const stats = parseMigrationStats(realStats, resultMessage, latestLog);
  const isStopped = stats.status === 'STOPPED' || (realStats && realStats.status === 'STOPPED');
  const isFailed = stats.status === 'FAILED';
  const hasProgressData = loading || isClearing || progress > 0 || stats.hasData || isStopped;
  const fullMessage = stats.rawMessage || latestLog?.message;

  const calculatedPct = (stats.total > 0 && stats.migrated >= 0)
    ? Math.min(100, Math.max(0, Math.round((stats.migrated / stats.total) * 100)))
    : 100;

  let displayStatus = 'Pending';
  if (loading) {
    displayStatus = `${Math.max(1, Math.round(progress))}% In Progress`;
  } else if (isClearing) {
    displayStatus = 'Clearing data...';
  } else if (isStopped) {
    displayStatus = 'Stopped';
  } else if (isFailed) {
    displayStatus = 'Failed';
  } else if (stats.hasData) {
    if (stats.total > 0 && stats.migrated < stats.total && stats.migrated > 0) {
      displayStatus = `${calculatedPct}% Completed`;
    } else {
      displayStatus = '100% Completed';
    }
  }

  let countText = 'Not started';
  if (isClearing) {
    countText = 'Clearing records from database... Please wait.';
  } else if (loading) {
    if (realStats && realStats.totalRecords > 0) {
      const current = (realStats.migratedRecords || 0) + (realStats.failedRecords || 0);
      const remaining = Math.max(0, realStats.totalRecords - current);
      countText = `Migrating ${realStats.migratedRecords || current} / ${realStats.totalRecords} (${remaining} pending)...`;
    } else if (realStats && realStats.migratedRecords > 0) {
      countText = `Migrated ${realStats.migratedRecords} records...`;
    } else {
      countText = 'Migrating records...';
    }
  } else if (isStopped) {
    countText = `Migration stopped (Migrated ${stats.migrated} / ${stats.total || stats.migrated} records)`;
  } else if (isFailed) {
    countText = stats.rawMessage || 'Migration failed';
  } else if (stats.hasData) {
    if (stats.migrated > 0) {
      if (stats.failed > 0) {
        countText = `Migrated ${stats.migrated} / ${stats.total} records (${stats.failed} skipped/failed)`;
      } else if (stats.total > 0 && stats.total !== stats.migrated) {
        countText = `Migrated ${stats.migrated} / ${stats.total} records`;
      } else {
        countText = `Migrated ${stats.migrated} records`;
      }
    } else if (stats.total > 0) {
      countText = `Processed ${stats.total} records`;
    } else {
      const msg = (stats.rawMessage || '').toLowerCase();
      if (msg.includes('0 records') || msg.includes('no records') || msg.includes('not found') || msg.includes('empty')) {
        countText = '0 records found in source DB';
      } else if (stats.rawMessage && stats.rawMessage.length > 0 && !msg.includes('success')) {
        countText = stats.rawMessage;
      } else {
        countText = 'Migration completed';
      }
    }
  }

  // ── Derived visual state ──────────────────────────────────────────────────
  const accentColor = loading
    ? theme.palette.primary.main
    : isClearing
      ? '#ef4444'
      : isStopped
        ? '#f59e0b'
        : isFailed
          ? '#ef4444'
          : stats.hasData
            ? theme.palette.success.main
            : (isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1');

  const cardGlow = loading
    ? `0 0 0 1px ${theme.palette.primary.main}33, 0 8px 32px ${theme.palette.primary.main}22`
    : isClearing
      ? `0 0 0 1px rgba(239,68,68,0.33), 0 8px 32px rgba(239,68,68,0.18)`
      : stats.hasData && !isStopped && !isFailed
        ? `0 0 0 1px ${theme.palette.success.main}22, 0 8px 24px ${theme.palette.success.main}14`
        : isDark
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 2px 16px rgba(0,0,0,0.06)';

  const progressBarValue = loading
    ? progress
    : isClearing
      ? 100
      : isStopped
        ? progress
        : isFailed
          ? 100
          : stats.hasData
            ? calculatedPct
            : 0;

  return (
    <Card sx={{
      flex: 1,
      height: '100%',
      minHeight: 96,
      width: '100%',
      minWidth: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      borderRadius: '14px',
      border: isDark
        ? `1px solid ${loading ? theme.palette.primary.main + '44' : 'rgba(255,255,255,0.07)'}`
        : `1px solid ${loading ? theme.palette.primary.main + '33' : '#e8edf4'}`,
      background: isDark
        ? 'linear-gradient(145deg, rgba(22,32,52,0.98) 0%, rgba(15,23,42,0.96) 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%)',
      boxShadow: cardGlow,
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: isDark
          ? `0 0 0 1px ${theme.palette.primary.main}55, 0 12px 36px ${theme.palette.primary.main}28`
          : `0 0 0 1px ${theme.palette.primary.main}22, 0 12px 32px rgba(0,0,0,0.10)`,
        borderColor: isDark ? `${theme.palette.primary.main}66` : `${theme.palette.primary.main}44`,
      },
      // animated left-side accent line
      '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: '10%',
        bottom: '10%',
        width: '3px',
        borderRadius: '0 3px 3px 0',
        background: loading
          ? `linear-gradient(180deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
          : stats.hasData && !isStopped && !isFailed
            ? `linear-gradient(180deg, #34d399, ${theme.palette.success.main})`
            : isStopped
              ? 'linear-gradient(180deg, #fcd34d, #f59e0b)'
              : isFailed
                ? 'linear-gradient(180deg, #f87171, #ef4444)'
                : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        transition: 'background 0.4s ease',
      }
    }}>
      <CardContent sx={{ p: { xs: 1.75, sm: 2.25 }, '&:last-child': { pb: { xs: 1.75, sm: 2.25 } }, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0, pl: { xs: 2.5, sm: 3 } }}>

        {/* ── Top row: icon + info + actions ─────────────────────────── */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ width: '100%', minWidth: 0 }}>

          {/* Left: icon + title + desc */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
            {/* Icon blob */}
            <Box sx={{
              width: 40, height: 40,
              borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: isExcelTab
                ? 'linear-gradient(135deg, rgba(33,115,70,0.18) 0%, rgba(33,115,70,0.08) 100%)'
                : `linear-gradient(135deg, ${theme.palette.primary.main}28 0%, ${theme.palette.primary.main}10 100%)`,
              border: isExcelTab
                ? '1px solid rgba(33,115,70,0.22)'
                : `1px solid ${theme.palette.primary.main}22`,
              color: isExcelTab ? '#22c55e' : theme.palette.primary.main,
              // pulse ring when loading
              boxShadow: loading
                ? `0 0 0 3px ${theme.palette.primary.main}18, 0 0 0 6px ${theme.palette.primary.main}08`
                : 'none',
              transition: 'box-shadow 0.4s ease',
            }}>
              {isExcelTab ? <IconFileSpreadsheet size={20} strokeWidth={1.8} /> : <IconDatabase size={20} strokeWidth={1.8} />}
            </Box>

            {/* Title + desc */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}>
                  {step.title}
                </Typography>

                {/* Live timer / duration chip */}
                {(loading || finalDuration != null) && (
                  <Box sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    px: '6px',
                    height: 18,
                    borderRadius: '5px',
                    bgcolor: loading
                      ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(37,99,235,0.09)')
                      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    border: loading
                      ? `1px solid ${theme.palette.primary.main}33`
                      : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                    flexShrink: 0,
                  }}>
                    <IconClock size={10} color={loading ? theme.palette.primary.main : (isDark ? '#64748b' : '#94a3b8')} />
                    <Typography sx={{
                      fontSize: '0.63rem',
                      fontWeight: 700,
                      color: loading ? theme.palette.primary.main : (isDark ? '#64748b' : '#94a3b8'),
                      lineHeight: 1,
                    }}>
                      {loading ? formatDuration(elapsedSeconds) : `${formatDuration(finalDuration)}`}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {step.desc && (
                <Typography variant="caption" sx={{
                  color: isDark ? '#64748b' : '#94a3b8',
                  display: 'block',
                  mt: '2px',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {step.desc}
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Right: action buttons */}
          <Stack direction="row" spacing={0.5} flexShrink={0} alignItems="center">
            {step.hasUpload && isExcelTab && (
              <>
                <Tooltip title="Download Sample">
                  <IconButton size="small" onClick={() => onDownloadSample(step)} disabled={disabled || loading}
                    sx={{
                      width: 28, height: 28, padding: 0, borderRadius: '7px',
                      bgcolor: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.28)', color: '#3b82f6',
                      '&:hover': { bgcolor: 'rgba(59,130,246,0.16)', borderColor: '#3b82f6', transform: 'scale(1.08)' },
                      '&.Mui-disabled': { opacity: 0.35 },
                      transition: 'all 0.18s ease',
                    }}>
                    <IconDownload size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Upload Excel">
                  <IconButton size="small" component="label" disabled={disabled || loading}
                    sx={{
                      width: 28, height: 28, padding: 0, borderRadius: '7px',
                      bgcolor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', color: '#16a34a',
                      '&:hover': { bgcolor: 'rgba(34,197,94,0.16)', borderColor: '#16a34a', transform: 'scale(1.08)' },
                      '&.Mui-disabled': { opacity: 0.35 },
                      transition: 'all 0.18s ease',
                    }}>
                    <IconUpload size={14} />
                    <input type="file" hidden accept=".xlsx,.xls" onChange={(e) => onUploadFile(e, step)} />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* Run button */}
            {!isExcelTab && (
              <Tooltip title={loading ? 'Running…' : 'Run migration'}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => onRun(step.endpoint, step.success, step.id)}
                    disabled={disabled || loading}
                    sx={{
                      width: 28, height: 28, padding: 0, borderRadius: '7px',
                      background: disabled || loading
                        ? undefined
                        : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      bgcolor: disabled || loading
                        ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
                        : undefined,
                      color: '#fff',
                      boxShadow: disabled || loading ? 'none' : `0 2px 8px ${theme.palette.primary.main}55`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'scale(1.08)',
                        boxShadow: `0 4px 12px ${theme.palette.primary.main}66`,
                      },
                      '&.Mui-disabled': {
                        color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.22)',
                      },
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {loading ? <CircularProgress size={14} color="inherit" /> : <IconPlayerPlay size={14} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {/* Stop button */}
            {loading && (
              <Tooltip title="Stop migration">
                <IconButton size="small" onClick={() => onStop && onStop(step.id)}
                  sx={{
                    width: 28, height: 28, padding: 0, borderRadius: '7px',
                    bgcolor: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#ef4444',
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.16)', transform: 'scale(1.08)' },
                    transition: 'all 0.18s ease',
                  }}>
                  <IconPlayerStop size={14} />
                </IconButton>
              </Tooltip>
            )}

            {/* Clear button */}
            <Tooltip title={isClearing ? 'Clearing data...' : 'Clear data'}>
              <IconButton size="small" onClick={() => onClear(step)} disabled={disabled || loading || isClearing}
                sx={{
                  width: 28, height: 28, padding: 0, borderRadius: '7px',
                  bgcolor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)', color: '#ef4444',
                  '&:hover': { bgcolor: 'rgba(239,68,68,0.14)', borderColor: '#ef4444', transform: 'scale(1.08)' },
                  '&.Mui-disabled': { opacity: 0.35 },
                  transition: 'all 0.18s ease',
                }}>
                {isClearing ? <CircularProgress size={14} color="error" /> : <IconTrash size={14} />}
              </IconButton>
            </Tooltip>

            {/* Scope info button */}
            {(!step.hasUpload || !isExcelTab) && (
              <Tooltip title="View scope">
                <IconButton size="small" onClick={() => onScope(step.id)}
                  sx={{
                    width: 28, height: 28, padding: 0, borderRadius: '7px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#dde3ed'}`,
                    color: isDark ? '#64748b' : '#94a3b8',
                    '&:hover': { bgcolor: `${theme.palette.primary.main}12`, borderColor: theme.palette.primary.main, color: theme.palette.primary.main, transform: 'scale(1.08)' },
                    transition: 'all 0.18s ease',
                  }}>
                  <IconInfoCircle size={14} />
                </IconButton>
              </Tooltip>
            )}

            {/* View Data button (Excel tab) */}
            {step.hasUpload && isExcelTab && hasProgressData && !loading && resultMessage && typeof resultMessage === 'object' && resultMessage.details && (
              <Box sx={{ ml: 0.5, pl: 0.75, borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
                <Button variant="outlined" size="small" color="primary"
                  onClick={() => onViewLog && onViewLog(step, resultMessage)}
                  sx={{ minWidth: 0, px: 0.75, py: 0.25, fontSize: '0.63rem', height: 22, borderRadius: '5px', textTransform: 'none', fontWeight: 700 }}>
                  View Data
                </Button>
              </Box>
            )}
          </Stack>
        </Stack>

        {/* ── Progress section ────────────────────────────────────────── */}
        {((!isExcelTab && (loading || hasProgressData)) || (isExcelTab && (loading || resultMessage))) && (
          <Box sx={{ mt: 1.5, minWidth: 0 }}>
            {/* Status row */}
            <Stack direction="row" alignItems="center" spacing={1} mb={0.75} sx={{ minWidth: 0 }}>
              {/* Status badge */}
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                px: '8px',
                height: 20,
                borderRadius: '5px',
                bgcolor: loading
                  ? (isDark ? 'rgba(59,130,246,0.14)' : 'rgba(37,99,235,0.07)')
                  : isStopped
                    ? 'rgba(245,158,11,0.12)'
                    : isFailed
                      ? 'rgba(239,68,68,0.10)'
                      : stats.hasData
                        ? (isDark ? 'rgba(52,211,153,0.12)' : 'rgba(22,163,74,0.08)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                border: `1px solid ${accentColor}33`,
                flexShrink: 0,
              }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accentColor, flexShrink: 0,
                  ...(loading ? { animation: 'pulse-dot 1.2s ease-in-out infinite' } : {}),
                  '@keyframes pulse-dot': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.4, transform: 'scale(0.7)' },
                  }
                }} />
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: accentColor, lineHeight: 1 }}>
                  {displayStatus}
                </Typography>
              </Box>

              {/* Separator dot */}
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1', flexShrink: 0 }} />

              {/* Count text */}
              <Stack direction="row" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: isStopped ? '#f59e0b' : stats.failed > 0 && !loading ? '#f59e0b' : isDark ? '#64748b' : '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {countText}
                </Typography>
                {!loading && fullMessage && (
                  <Tooltip title={fullMessage} placement="top" arrow>
                    <Box sx={{ display: 'flex', ml: 0.5, cursor: 'help', color: isDark ? '#475569' : '#cbd5e1', '&:hover': { color: theme.palette.primary.main }, transition: 'color 0.15s' }}>
                      <IconInfoCircle size={13} />
                    </Box>
                  </Tooltip>
                )}
              </Stack>

              {/* Percentage label (right-aligned) */}
              {(loading || (stats.hasData && !isStopped && !isFailed)) && (
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: accentColor, flexShrink: 0 }}>
                  {Math.round(progressBarValue)}%
                </Typography>
              )}
            </Stack>

            {/* Progress track */}
            <Box sx={{
              position: 'relative',
              height: 5,
              borderRadius: 999,
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#eef2f9',
              overflow: 'hidden',
            }}>
              {/* Filled bar */}
              <Box sx={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: `${progressBarValue}%`,
                borderRadius: 999,
                background: loading
                  ? `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.light} 100%)`
                  : isStopped
                    ? 'linear-gradient(90deg, #d97706 0%, #f59e0b 100%)'
                    : isFailed
                      ? 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)'
                      : stats.hasData
                        ? (stats.total === 0 && stats.migrated === 0
                            ? (isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1')
                            : `linear-gradient(90deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`)
                        : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                transition: loading ? 'width 0.6s cubic-bezier(0.4,0,0.2,1)' : 'width 0.4s ease',
              }} />
              {/* Shimmer overlay when loading */}
              {loading && (
                <Box sx={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: `${progressBarValue}%`,
                  borderRadius: 999,
                  overflow: 'hidden',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: '-60%',
                    width: '50%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                    animation: 'shimmer-bar 1.4s ease-in-out infinite',
                  },
                  '@keyframes shimmer-bar': {
                    '0%': { left: '-60%' },
                    '100%': { left: '130%' },
                  },
                }} />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

const findLatestLog = (auditLogs, step) => {
  if (!Array.isArray(auditLogs) || !step) return null;
  return auditLogs.find(log => {
    if (!log) return false;
    const logTable = (log.tableName || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const stepTable = (step.tableName || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const title = (step.title || '').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    const stepId = (step.id || '').toLowerCase();
    const logMsg = (log.message || '').toLowerCase();

    // Direct ID or Table exact match
    if (stepTable && logTable === stepTable) return true;
    if (logTable === title) return true;
    if (logTable === stepId) return true;

    // Specific step category matches
    if (stepId === 'departments' && (logTable.includes('dept') || logTable.includes('department') || logMsg.includes('department'))) return true;
    if (stepId === 'designations' && (logTable.includes('designation') || logMsg.includes('designation')) && !logTable.includes('level') && !logMsg.includes('level')) return true;
    if (stepId === 'designationlevels' && (logTable.includes('level') || logMsg.includes('level'))) return true;
    if (stepId === 'hrmsemployeetype' && (logTable.includes('employee type') || logMsg.includes('employee type'))) return true;
    if (stepId === 'employeemaster' && (logTable.includes('hr employee') || logMsg.includes('employee master') || logTable.includes('employee profile'))) return true;
    if (stepId === 'grades' && (logTable.includes('grade') || logMsg.includes('grade'))) return true;
    if (stepId === 'productbom' && (logTable.includes('bom') || logMsg.includes('bom'))) return true;
    if (stepId === 'productmaster' && (logTable.includes('product') || logMsg.includes('product')) && !logTable.includes('bom')) return true;
    if (stepId === 'customeraccount' && logTable.includes('customer')) return true;
    if (stepId === 'supplieraccount' && logTable.includes('supplier')) return true;
    if (stepId === 'financeaccount' && logTable.includes('finance')) return true;
    if (stepId === 'taxaccount' && logTable.includes('tax')) return true;
    if (stepId === 'termsmaster' && (logTable.includes('terms') || logMsg.includes('terms'))) return true;
    if (stepId === 'ledgergroup' && (logTable.includes('ledger group') || logMsg.includes('ledger group'))) return true;

    // Substring / partial matches
    if (stepTable && (logTable.includes(stepTable) || stepTable.includes(logTable))) return true;
    if (title && (logTable.includes(title) || logMsg.includes(title))) return true;

    return false;
  });
};

// ==============================|| MAIN COMPONENT ||============================== //

export default function DataMigration() {
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [loadingSteps, setLoadingSteps] = useState({});
  const [clearingId, setClearingId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [subTab, setSubTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [scopeOpen, setScopeOpen] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmClear, setConfirmClear] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDropTables, setConfirmDropTables] = useState(false);
  const [confirmCreateTables, setConfirmCreateTables] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [confirmDeleteLog, setConfirmDeleteLog] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const stopRequestedRef = useRef(false);

  const [secondaryDbName, setSecondaryDbName] = useState('');
  const [oldAttachmentPath, setOldAttachmentPath] = useState('');
  const [confirmNoAttachment, setConfirmNoAttachment] = useState(null);
  const [dbOptions, setDbOptions] = useState([]);

  // NOTE: Credentials are kept in React state only — never persisted to localStorage.
  const [sqlIp, setSqlIp] = useState(localStorage.getItem('sqlIp') || '');
  const [sqlUsername, setSqlUsername] = useState(localStorage.getItem('sqlUsername') || '');
  const [sqlPassword, setSqlPassword] = useState('');

  const [fileIp, setFileIp] = useState(localStorage.getItem('fileIp') || '');
  const [fileUsername, setFileUsername] = useState(localStorage.getItem('fileUsername') || '');
  const [filePassword, setFilePassword] = useState('');

  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [browsePath, setBrowsePath] = useState('');
  const [browseFolders, setBrowseFolders] = useState([]);
  const [browsing, setBrowsing] = useState(false);

  // Persist only non-sensitive connection parameters (IP and username) for UX convenience.
  // Passwords are NEVER stored in localStorage.
  useEffect(() => {
    localStorage.setItem('sqlIp', sqlIp);
    localStorage.setItem('sqlUsername', sqlUsername);
    localStorage.setItem('fileIp', fileIp);
    localStorage.setItem('fileUsername', fileUsername);
  }, [sqlIp, sqlUsername, fileIp, fileUsername]);

  const [stepResults, setStepResults] = useState({});
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logDialogData, setLogDialogData] = useState(null);
  const [logTab, setLogTab] = useState(0);
  const [multiTabDialogOpen, setMultiTabDialogOpen] = useState(false);
  const [selectedSubTabs, setSelectedSubTabs] = useState([0, 1, 2, 3, 4, 5, 6]);

  // Global Active Running Status & Stopwatch State
  const [activeRunningStep, setActiveRunningStep] = useState(null);
  const [activeStats, setActiveStats] = useState(null);
  const [globalElapsedSeconds, setGlobalElapsedSeconds] = useState(0);
  const [lastCompletedInfo, setLastCompletedInfo] = useState(null);
  const activeStartTimeRef = useRef(null);

  const handleViewLog = (step, resultData) => {
    setLogDialogData({ step, data: resultData });
    setLogTab(0);
    setLogDialogOpen(true);
  };

  const loading = Object.values(loadingSteps).some(Boolean);

  // Global active migration timer & progress poller
  useEffect(() => {
    let timerId;
    let pollId;

    if (loading) {
      if (!activeStartTimeRef.current) {
        activeStartTimeRef.current = Date.now();
      }
      setGlobalElapsedSeconds(Math.floor((Date.now() - activeStartTimeRef.current) / 1000));
      timerId = setInterval(() => {
        if (activeStartTimeRef.current) {
          setGlobalElapsedSeconds(Math.floor((Date.now() - activeStartTimeRef.current) / 1000));
        }
      }, 1000);

      // Identify currently running step
      const allSteps = [
        ...HRMS_STEPS, ...QMS_STEPS, ...QUALITY_STEPS, ...NPD_STEPS, ...ORDER_STEPS, ...ADMIN_STEPS, ...ACCOUNTS_STEPS
      ];
      const runningId = Object.keys(loadingSteps).find(k => loadingSteps[k] && k !== 'all' && k !== 'currentTab');
      const stepObj = allSteps.find(s => s.id === runningId);
      setActiveRunningStep(stepObj || (runningId ? { id: runningId, title: runningId } : { title: 'Migration' }));

      // Poll progress for top status bar
      const poll = async () => {
        if (runningId) {
          try {
            const res = await axios.get('/api/admin/migration/progress/' + runningId);
            if (res.data && res.data.status && res.data.status !== 'IDLE') {
              setActiveStats(res.data);
              if (res.data.elapsedSeconds != null) {
                setGlobalElapsedSeconds(res.data.elapsedSeconds);
                activeStartTimeRef.current = Date.now() - (res.data.elapsedSeconds * 1000);
              }
            }
          } catch (e) {}
        }
      };
      poll();
      pollId = setInterval(poll, 800);
    } else {
      if (activeStartTimeRef.current && activeRunningStep) {
        const totalSec = Math.max(1, Math.floor((Date.now() - activeStartTimeRef.current) / 1000));
        setLastCompletedInfo({
          title: activeRunningStep.title || 'Migration',
          duration: formatDuration(totalSec)
        });
        activeStartTimeRef.current = null;
      }
      setActiveRunningStep(null);
      setActiveStats(null);
    }

    return () => {
      if (timerId) clearInterval(timerId);
      if (pollId) clearInterval(pollId);
    };
  }, [loading, loadingSteps]);

  const stopMigration = async (stepId) => {
    stopRequestedRef.current = true;
    if (stepId && typeof stepId === 'string') {
      setLoadingSteps(prev => ({ ...prev, [stepId]: false }));
    } else {
      setLoadingSteps({});
    }
    try {
      await axios.post('/api/admin/migration/stop', null, {
        params: { stepId: typeof stepId === 'string' ? stepId : undefined }
      });
      showNotification('Migration stop signal sent successfully.', 'info');
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to stop migration:', error);
    }
  };

  const handleClearTransaction = async () => {
    try {
      setLoadingSteps(prev => ({ ...prev, all: true }));
      const response = await axios.delete('/api/admin/migration/clear-transaction');
      showNotification(response.data.message || 'Transaction data wiped successfully', 'success');
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to clear transaction data: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoadingSteps(prev => ({ ...prev, all: false }));
      setConfirmClearAll(false);
    }
  };

  const handleDropTables = async () => {
    try {
      setLoadingSteps(prev => ({ ...prev, all: true }));
      const response = await axios.delete('/api/admin/migration/drop-tables');
      showNotification(response.data.message || 'Tables dropped successfully', 'success');
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to drop tables: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoadingSteps(prev => ({ ...prev, all: false }));
      setConfirmDropTables(false);
    }
  };

  const handleCreateTables = async () => {
    try {
      setLoadingSteps(prev => ({ ...prev, all: true }));
      const response = await axios.post('/api/admin/migration/create-tables');
      showNotification(response.data.message || 'Tables created successfully', 'success');
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to create tables: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoadingSteps(prev => ({ ...prev, all: false }));
      setConfirmCreateTables(false);
    }
  };

  const HRMS_STEPS = [
    { category: 'Employee Master', id: 'hrmsEmployeeType', title: 'Employee Type', desc: '', endpoint: '/api/admin/migration/hrms-employee-types', success: 'HRMS Employee Types migrated.', hasUpload: true, tableName: 'HRMS_EMPLOYEE_TYPE' },
    { category: 'Employee Master', id: 'departments', title: 'Department', desc: '', endpoint: '/api/admin/migration/departments', success: 'Departments migrated.', hasUpload: true, tableName: 'HRM_DEPARTMENT_MASTER' },
    { category: 'Employee Master', id: 'designations', title: 'Designation', desc: '', endpoint: '/api/admin/migration/designations', success: 'Designations migrated.', hasUpload: true, tableName: 'HRM_DESIGNATION_MASTER' },
    { category: 'Employee Master', id: 'designationLevels', title: 'Designation Level', desc: '', endpoint: '/api/admin/migration/designation-levels', success: 'Designation Levels migrated.', hasUpload: true, tableName: 'HRM_DESIGNATION_LEVEL_MASTER' },
    { category: 'Employee Master', id: 'grades', title: 'Grade', desc: '', endpoint: '/api/admin/migration/grades', success: 'Grades migrated.', hasUpload: true, tableName: 'HRM_GRADE_MASTER' },
    { category: 'Employee Master', id: 'employeeMaster', title: 'Employee Master', desc: '', endpoint: '/api/admin/migration/employee-master-all', success: 'Employee Master migrated.', tableName: 'HR_EMPLOYEE' },
    { category: 'Employee Master', id: 'employeeManagerMapping', title: 'Employee Manager Mapping', desc: '', endpoint: '/api/admin/migration/employee-manager-mapping', success: 'Employee Manager Mapping migrated.', tableName: 'EMPLOYEE_MANAGER_MAPPING' },
    { category: 'Employee Master', id: 'interviewCriteria', title: 'Interview Criteria', desc: '', endpoint: '/api/admin/migration/interview-criteria', success: 'Interview Criteria migrated.', tableName: 'INTERVIEW_CRITERIA_MASTER' },
    { category: 'Employee Master', id: 'inductionCriteria', title: 'Induction Criteria', desc: '', endpoint: '/api/admin/migration/induction-criteria', success: 'Induction Criteria migrated.', tableName: 'INDUCTION_CRITERIA_MASTER' },
    { category: 'Employee Master', id: 'applicantVerificationCriteria', title: 'Applicant Verification Criteria', desc: '', endpoint: '/api/admin/migration/applicant-verification-criteria', success: 'Applicant Verification Criteria migrated.', tableName: 'HRMS_APPLICANT_VERIFICATION_CRITERIA' },
    { category: 'Employee Master', id: 'atsRecruitment', title: 'ATS / Recruitment Migration', desc: 'Migrates recruitment candidates, contact, education, experience, salary details, interviews, KYC, self-assessments, activities, and verification data.', endpoint: '/api/admin/migration/ats-recruitment', success: 'ATS Recruitment data successfully migrated.', tableName: 'HRMS_NEWAPP_MASTER -> HR_EMPLOYEE (ATS)' },
    { category: 'Payroll', id: 'holidayMaster', title: 'Holiday Master', desc: '', endpoint: '/api/admin/migration/payroll/holidays', success: 'Holidays migrated.', tableName: 'HRMS_HOLIDAY_MASTER', hasUpload: true },
    { category: 'Payroll', id: 'bankDetails', title: 'Bank Details', desc: '', endpoint: '/api/admin/migration/payroll/banks', success: 'Bank details migrated.', tableName: 'HRMS_BANK_MASTER' },
    { category: 'Payroll', id: 'shift', title: 'Shift', desc: '', endpoint: '/api/admin/migration/payroll/shifts', success: 'Shifts migrated.', tableName: 'HRMS_SHIFT_MASTER', hasUpload: true },
    { category: 'Payroll', id: 'loanMaster', title: 'Loan Master', desc: '', endpoint: '/api/admin/migration/payroll/loans', success: 'Loans migrated.', tableName: 'HRMS_LOAN_MASTER', hasUpload: true },
    { category: 'Payroll', id: 'monthMaster', title: 'Month Master', desc: '', endpoint: '/api/admin/migration/payroll/months', success: 'Months migrated.', tableName: 'HRMS_MONTH_MASTER', hasUpload: true },
    { category: 'Payroll', id: 'permissionMaster', title: 'Permission Master', desc: '', endpoint: '/api/admin/migration/payroll/permissions', success: 'Permissions migrated.', tableName: 'HRMS_PERMISSION_MASTER', hasUpload: true },
    { category: 'Payroll', id: 'petrolAllowance', title: 'Petrol Allowance', desc: '', endpoint: '/api/admin/migration/payroll/petrol-allowances', success: 'Petrol allowances migrated.', tableName: 'HRMS_PETROL_ALLOWANCE', hasUpload: true },
    { category: 'Payroll', id: 'policyMaster', title: 'Policy Master', desc: '', endpoint: '/api/admin/migration/payroll/policies', success: 'Policies migrated.', tableName: 'HRMS_POLICY_MASTER' }
  ];

  const QMS_STEPS = [
    { category: 'Checklist', id: 'checklistsAndAssignments', title: 'Checklist & Assignments', desc: '', endpoint: '/api/admin/migration/checklists-and-assignments', success: 'Checklists migrated.', tableName: 'QMS_MASTER_CHECKLIST' },
    { category: 'Checklist', id: 'checklistClosed', title: 'Checklist Closed', desc: '', endpoint: '/api/admin/migration/checklist-closed', success: 'Checklist closed records migrated.', tableName: 'HRMS_CHECKLIST_PENDING_MASTER' },
    { category: 'Audit', id: 'auditAreas', title: 'Audit Area Master', desc: '', endpoint: '/api/admin/migration/audit-areas', success: 'Audit areas migrated.', tableName: 'AUDIT_AREA_MASTER -> QMS_AUDIT_AREA' },
    { category: 'Audit', id: 'auditTypes', title: 'Audit Type Master', desc: '', endpoint: '/api/admin/migration/audit-types', success: 'Audit types migrated.', tableName: 'AUDIT_TYPE_MASTER -> QMS_AUDIT_TYPE' },
    { category: 'Audit', id: 'auditCriteria', title: 'Audit Criteria Master', desc: '', endpoint: '/api/admin/migration/audit-criteria', success: 'Audit criteria migrated.', tableName: 'AUDIT_MASTER -> QMS_AUDIT_CRITERIA' },
    { category: 'Audit', id: 'auditSchedules', title: 'Audit Schedule', desc: '', endpoint: '/api/admin/migration/audit-schedules', success: 'Audit schedules migrated.', tableName: 'AUDIT_SCHEDULE_MASTER -> QMS_AUDIT_SCHEDULE' },
    { category: 'Audit', id: 'auditAttendances', title: 'Audit Attendance', desc: '', endpoint: '/api/admin/migration/audit-attendances', success: 'Audit attendance migrated.', tableName: 'AUDIT_ATTENDANCE_MASTER -> QMS_AUDIT_ATTENDANCE' },
    { category: 'Audit', id: 'auditObservations', title: 'Audit Observation', desc: '', endpoint: '/api/admin/migration/audit-observations', success: 'Audit observations migrated.', tableName: 'AUDIT_OBSERVATION_MASTER -> QMS_AUDIT_OBSERVATION' },
    { category: 'Audit', id: 'auditNcr', title: 'Audit NCR', desc: '', endpoint: '/api/admin/migration/audit-ncr', success: 'Audit NCRs migrated.', tableName: 'CREATE_NCR_MASTER -> QMS_NCR_REWORK_LOG' },
    { category: 'Meeting', id: 'meetingMaster', title: 'Meeting Master', desc: '', endpoint: '/api/admin/migration/meeting-master', success: 'Meeting Master migrated.', tableName: 'MINUTES_MEETING_MASTER' },
    { category: 'Meeting', id: 'meetingSchedule', title: 'Meeting Schedule', desc: '', endpoint: '/api/admin/migration/meeting-schedule', success: 'Meeting Schedule migrated.', tableName: 'MEETING_SCHEDULE_MASTER' },
    { category: 'Meeting', id: 'meetingUserAttendance', title: 'Meeting User Attendance', desc: '', endpoint: '/api/admin/migration/meeting-user-attendance', success: 'Meeting User Attendance migrated.', tableName: 'MEETING_USER_ATTENDANCE' },
    { category: 'Meeting', id: 'meetingMom', title: 'Meeting Observation / MOM', desc: '', endpoint: '/api/admin/migration/meeting-mom', success: 'Meeting Observations / MOM migrated.', tableName: 'MEETING_MOM_MASTER' },
    { category: 'Meeting', id: 'closeMom', title: 'Close MOM', desc: '', endpoint: '/api/admin/migration/close-mom', success: 'Close MOM records migrated.', tableName: 'QMS_ACTION_ITEM_AUDIT -> QMS_CLOSE_MOM_AND_VERIFY' }
  ];

  const QUALITY_STEPS = [
    { category: 'Quality Masters', id: 'aqlMaster', title: 'AQL Master', desc: '', endpoint: '/api/admin/migration/quality/aql-master', success: 'AQL Master migrated.', tableName: 'AQL_MASTER' },
    { category: 'Quality Masters', id: 'inspectionSpecification', title: 'Inspection Specification', desc: '', endpoint: '/api/admin/migration/quality/inspection-specification', success: 'Inspection Specification migrated.', tableName: 'INSPECTION_SPECIFICATION' }
  ];

  const NPD_STEPS = [
    { category: 'Material', id: 'materialType', title: 'Material Type (M3310)', desc: '', endpoint: '/api/admin/migration/npd/material-types', success: 'Material Types migrated.', tableName: 'NPD_MATERIAL_TYPE', hasUpload: true },
    { category: 'Material', id: 'materialGrade', title: 'Material Grade (M3320)', desc: '', endpoint: '/api/admin/migration/npd/material-grades', success: 'Material Grades migrated.', tableName: 'NPD_MATERIAL_GRADE', hasUpload: true },
    { category: 'Material', id: 'shapeMaster', title: 'Shape (M3330)', desc: '', endpoint: '/api/admin/migration/npd/shapes', success: 'Shapes migrated.', tableName: 'NPD_SHAPE', hasUpload: true },
    { category: 'Material', id: 'materialCondition', title: 'Material Condition (M3340)', desc: '', endpoint: '/api/admin/migration/npd/material-conditions', success: 'Material Conditions migrated.', tableName: 'NPD_MATERIAL_CONDITION', hasUpload: true },

    { category: 'Product', id: 'inventoryType', title: 'Inventory Type', desc: '', endpoint: '/api/admin/migration/npd/inventory-types', success: 'Inventory Types migrated.', tableName: 'NPD_INVENTORY_TYPE', hasUpload: true },
    { category: 'Product', id: 'productItemGroup', title: 'Product Item Group (M3110)', desc: '', endpoint: '/api/admin/migration/npd/item-groups', success: 'Product Item Groups migrated.', tableName: 'NPD_ITEM_GROUP', hasUpload: true },
    { category: 'Product', id: 'productItemType', title: 'Product Item Type (M3120)', desc: '', endpoint: '/api/admin/migration/npd/item-types', success: 'Product Item Types migrated.', tableName: 'NPD_ITEM_TYPE', hasUpload: true },
    { category: 'Product', id: 'productItemSubtype', title: 'Product Item Sub Type (M3130)', desc: '', endpoint: '/api/admin/migration/npd/item-subtypes', success: 'Product Item Sub Types migrated.', tableName: 'SUB_ITEM_TYPE_MASTER', hasUpload: true },
    { category: 'Product', id: 'productOemMaster', title: 'Product OEM (M3140)', desc: '', endpoint: '/api/admin/migration/npd/oems', success: 'Product OEMs migrated.', tableName: 'NPD_OEM', hasUpload: true },
    { category: 'Product', id: 'productOemMapping', title: 'Product OEM Mapping (M3150)', desc: '', endpoint: '/api/admin/migration/npd/oem-mappings', success: 'Product OEM Mappings migrated.', tableName: 'NPD_OEM_MAPPING', hasUpload: true },
    { category: 'Product', id: 'productModelMaster', title: 'Product Model (M3160)', desc: '', endpoint: '/api/admin/migration/npd/models', success: 'Product Models migrated.', tableName: 'PRODUCT_MODEL_MASTER', hasUpload: true },
    { category: 'Product', id: 'productCapacityMaster', title: 'Product Capacity (M3170)', desc: '', endpoint: '/api/admin/migration/npd/capacities', success: 'Product Capacities migrated.', tableName: 'PRODUCT_CAPACITY_MASTER', hasUpload: true },
    { category: 'Product', id: 'productIpp', title: 'Product IPP (M3190)', desc: '', endpoint: '/api/admin/migration/npd/ipps', success: 'Product IPPs migrated.', tableName: 'NPD_IPP', hasUpload: true },
    { category: 'Product', id: 'productProcessMaster', title: 'Process (M3180)', desc: '', endpoint: '/api/admin/migration/npd/processes', success: 'Product Processes migrated.', tableName: 'NPD_PROCESS', hasUpload: true },
    { category: 'General', id: 'windFarmMaster', title: 'Wind Farm Master', desc: '', endpoint: '/api/admin/migration/npd/wind-farms', success: 'Wind Farm Masters migrated.', tableName: 'WIND_FARM_MASTER', hasUpload: true },
    { category: 'General', id: 'uom', title: 'UOM', desc: '', endpoint: '/api/admin/migration/npd/uoms', success: 'UOM migrated.', tableName: 'QMS_UOM', hasUpload: true },
    { category: 'Product', id: 'productMaster', title: 'Product (M3115)', desc: '', endpoint: '/api/admin/migration/npd/products', success: 'Products migrated.', tableName: 'NPD_PRODUCT_MASTER', hasUpload: true },
    { category: 'Product', id: 'instrumentMaster', title: 'Instruments (M3116)', desc: '', endpoint: '/api/admin/migration/npd/instruments', success: 'Instruments migrated.', tableName: 'QMT_ASSET_MASTER', hasUpload: true },
    { category: 'Product', id: 'consumableMaster', title: 'Consumables (M3117)', desc: '', endpoint: '/api/admin/migration/npd/consumables', success: 'Consumables migrated.', tableName: 'QMT_ASSET_MASTER', hasUpload: true },
    { category: 'Product', id: 'machineAssetMaster', title: 'Machine & Assets (M3118)', desc: '', endpoint: '/api/admin/migration/npd/machines-assets', success: 'Machine Assets migrated.', tableName: 'QMT_ASSET_MASTER', hasUpload: true },
    { category: 'Product BOM', id: 'productBomMaster', title: 'Product BOM (DD1110)', desc: 'Migrates BOM Headers, Processes, Materials, Machines, and Tools', endpoint: '/api/admin/migration/npd/bom-master', success: 'Product BOMs migrated successfully.', tableName: 'NPD_BOM_MASTER', hasUpload: false }
  ];

  const ORDER_STEPS = [
    { id: 'visitorGatePass', title: 'Visitor Gate Pass', desc: '', endpoint: '/api/admin/migration/order/visitor-gate-pass', success: 'Visitor Gate Passes migrated.', tableName: 'VISITOR_GATE_PASS' }
  ];

  const ADMIN_STEPS = [
    { id: 'divisionMaster', title: 'Division Master', desc: '', endpoint: '/api/admin/migration/divisions', success: 'Divisions migrated.', tableName: 'AD_DIVISION' },
    { id: 'userCredentials', title: 'User Credentials', desc: '', endpoint: '/api/admin/migration/user-credentials', success: 'User Credentials migrated.', tableName: 'ERP_USER' }
  ];

  const ACCOUNTS_STEPS = [
    { category: 'Finance', id: 'ledgerGroup', title: 'Ledger Group', desc: '', endpoint: '/api/admin/migration/accounts/ledger-group', success: 'Ledger Groups migrated.', tableName: 'FA_LEDGER_GROUP' },
    { category: 'Finance', id: 'customerAccount', title: 'Customer Account Ledger', desc: '', endpoint: '/api/admin/migration/accounts/customer', success: 'Customer Account Ledgers migrated.', tableName: 'FA_ACCOUNT_LEDGER (CUSTOMER)' },
    { category: 'Finance', id: 'supplierAccount', title: 'Supplier Account Ledger', desc: '', endpoint: '/api/admin/migration/accounts/supplier', success: 'Supplier Account Ledgers migrated.', tableName: 'FA_ACCOUNT_LEDGER (SUPPLIER)' },
    { category: 'Finance', id: 'financeAccount', title: 'Finance Account Ledger', desc: '', endpoint: '/api/admin/migration/accounts/finance', success: 'Finance Account Ledgers migrated.', tableName: 'FA_ACCOUNT_LEDGER (FINANCE)' },
    { category: 'Finance', id: 'taxAccount', title: 'Tax Account Ledger', desc: '', endpoint: '/api/admin/migration/accounts/tax', success: 'Tax Account Ledgers migrated.', tableName: 'FA_ACCOUNT_LEDGER (TAX)' },
    { category: 'Finance', id: 'termsMaster', title: 'Terms Master', desc: '', endpoint: '/api/admin/migration/accounts/terms-master', success: 'Terms Master migrated.', tableName: 'MST_TERMS_MASTER' }
  ];

  const SUB_TABS = [
    { label: 'HRMS', id: 'hrms', steps: HRMS_STEPS },
    { label: 'QMS', id: 'qms', steps: QMS_STEPS },
    { label: 'Quality & Inspection', id: 'quality', steps: QUALITY_STEPS },
    { label: 'NPD', id: 'npd', steps: NPD_STEPS },
    { label: 'ORDER', id: 'order', steps: ORDER_STEPS },
    { label: 'Admin', id: 'admin', steps: ADMIN_STEPS },
    { label: 'ACCOUNTS', id: 'accounts', steps: ACCOUNTS_STEPS }
  ];

  const runTabSteps = async (stepsToRun) => {
    stopRequestedRef.current = false;
    if (!stepsToRun || stepsToRun.length === 0) return;

    for (const step of stepsToRun) {
      if (stopRequestedRef.current) break;
      try {
        await runMigration(step.endpoint, step.success, step.id);
      } catch (err) {
        console.error(`Step ${step.id} failed:`, err);
        // Continue to allow rest of batch to finish
      }
    }
  };

  const runCurrentTab = async () => {
    const steps = SUB_TABS[subTab]?.steps || [];
    setLoadingSteps(prev => ({ ...prev, currentTab: true }));
    await runTabSteps(steps);
    setLoadingSteps(prev => ({ ...prev, currentTab: false }));
  };

  const runSelectedTabs = async () => {
    setMultiTabDialogOpen(false);
    stopRequestedRef.current = false;
    setLoadingSteps(prev => ({ ...prev, all: true }));
    for (const tabIdx of selectedSubTabs) {
      if (stopRequestedRef.current) break;
      const steps = SUB_TABS[tabIdx]?.steps || [];
      await runTabSteps(steps);
    }
    setLoadingSteps(prev => ({ ...prev, all: false }));
  };

  const runAllSequentially = async () => {
    await runCurrentTab();
  };

  const clearMigrationData = async () => {
    if (!confirmClear) return;
    const target = confirmClear;
    setConfirmClear(null);
    setClearingId(target.id);
    showNotification(`Clearing ${target.title || target.id} records... Please wait.`, 'info');

    try {
      const idToModuleMap = {
        checklistsAndAssignments: 'checklists-and-assignments',
        closeChecklists: 'close-checklists',
        checklistClosed: 'checklist-closed',
        hrmsEmployeeType: 'hrms-employee-types',
        userCredentials: 'user-credentials',
        departments: 'departments',
        designations: 'designations',
        designationLevels: 'designation-levels',
        grades: 'grades',
        employeeMaster: 'employee-master-all',
        employeeManagerMapping: 'employee-manager-mapping',
        interviewCriteria: 'interview-criteria',
        inductionCriteria: 'induction-criteria',
        applicantVerificationCriteria: 'applicant-verification-criteria',
        atsRecruitment: 'ats-recruitment',
        auditCriteria: 'audit-criteria',
        auditSchedules: 'audit-schedules',
        meetingMaster: 'meeting-master',
        meetingSchedule: 'meeting-schedule',
        meetingUserAttendance: 'meeting-user-attendance',
        meetingMom: 'meeting-mom',
        closeMom: 'close-mom',
        visitorGatePass: 'order/visitor-gate-pass',
        productBomMaster: 'product-bom-master'
      };
      const moduleId = idToModuleMap[target.id] || target.id;
      const response = await axios.delete(`/api/admin/migration/clear/${moduleId}`);
      showNotification(response.data.message || 'Data cleared successfully', 'success');
      setStepResults(prev => ({ ...prev, [target.id]: '' }));
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to clear data: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setClearingId(null);
    }
  };

  const handleClearAllTransactions = async () => {
    try {
      setLoadingSteps(prev => ({ ...prev, all: true }));
      setConfirmClearAll(false);
      const response = await axios.delete('/api/admin/migration/clear-transaction', { timeout: 0 });
      showNotification(response.data.message || 'Transaction data wiped successfully', 'success');
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to clear transaction data: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoadingSteps(prev => ({ ...prev, all: false }));
    }
  };



  const showNotification = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchAuditLogs = async () => {
    setFetchingLogs(true);
    try {
      const response = await axios.get('/api/admin/migration/audit-logs');
      setAuditLogs(response.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setFetchingLogs(false);
    }
  };

  const deleteAuditLog = async (id) => {
    try {
      await axios.delete(`/api/admin/migration/audit-logs/${id}`);
      showNotification('Audit log deleted.', 'success');
      setSelectedLogIds((prev) => prev.filter((x) => x !== id));
      fetchAuditLogs();
    } catch (error) {
      showNotification('Failed to delete log: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setConfirmDeleteLog(null);
    }
  };

  const deleteSelectedLogs = async () => {
    try {
      await axios.delete('/api/admin/migration/audit-logs', { data: selectedLogIds });
      showNotification(`Deleted ${selectedLogIds.length} audit log(s).`, 'success');
      setSelectedLogIds([]);
      fetchAuditLogs();
    } catch (error) {
      showNotification('Bulk delete failed: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setConfirmBulkDelete(false);
    }
  };

  const toggleSelectLog = (id) => {
    setSelectedLogIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedLogIds.length === paginatedLogs.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(paginatedLogs.map((l) => l.id));
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchActiveMigrations();
  }, []);

  const fetchActiveMigrations = async () => {
    try {
      const response = await axios.get('/api/admin/migration/progress/all');
      if (response.data) {
        const newLoadingSteps = {};
        Object.entries(response.data).forEach(([key, value]) => {
          if (value.status === 'IN_PROGRESS') {
            newLoadingSteps[key] = true;
          }
        });
        setLoadingSteps(prev => ({ ...prev, ...newLoadingSteps }));
      }
    } catch (error) {
      console.error('Failed to fetch active migrations:', error);
    }
  };

  const fetchDbOptions = async () => {
    try {
      const response = await axios.get('/api/admin/migration/databases', {
        params: { sqlIp, sqlUsername, sqlPassword }
      });
      if (Array.isArray(response.data)) {
        setDbOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      showNotification('Failed to fetch DBs: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const fetchDirectories = async (path = '') => {
    setBrowsing(true);
    try {
      const response = await axios.post('/api/admin/migration/browse-path', {
        fileIp, fileUsername, filePassword, path
      });
      setBrowseFolders(response.data);
      setBrowsePath(path);
    } catch (error) {
      showNotification('Failed to fetch directories: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setBrowsing(false);
    }
  };

  const handleBrowseOpen = () => {
    if (!fileIp || !fileUsername || !filePassword) {
      showNotification('Please enter File Server IP, Username, and Password first.', 'warning');
      return;
    }
    setBrowseDialogOpen(true);
    fetchDirectories();
  };

  const runMigration = async (endpoint, successMessage, stepId, skipAttachmentCheck = false) => {
    if (stepId === 'productMaster' && (!oldAttachmentPath || oldAttachmentPath.trim() === '') && !skipAttachmentCheck) {
      setConfirmNoAttachment({ endpoint, successMessage, stepId });
      return;
    }

    setLoadingSteps(prev => ({ ...prev, [stepId]: true }));
    setStepResults(prev => ({ ...prev, [stepId]: '' }));
    try {
      const response = await axios.post(endpoint, null, {
        timeout: 0, // Disable timeout for long migrations
        params: {
          secondaryDbName: secondaryDbName || undefined,
          oldAttachmentPath: oldAttachmentPath || undefined,
          sqlIp: sqlIp || undefined,
          sqlUsername: sqlUsername || undefined,
          sqlPassword: sqlPassword || undefined,
          fileIp: fileIp || undefined,
          fileUsername: fileUsername || undefined,
          filePassword: filePassword || undefined,
          skipAttachments: skipAttachmentCheck ? true : undefined
        }
      });
      const severity = response.data?.status === 'WARNING' ? 'warning' : 'success';

      let msg = successMessage;
      if (typeof response.data === 'string') {
        msg = response.data;
      } else if (response.data && response.data.message) {
        msg = response.data.message;
      }

      if (response.data?.status === 'BACKGROUND') {
        showNotification('Migration started in background. Please wait...', 'info');
        setStepResults(prev => ({ ...prev, [stepId]: msg }));
        return; // Polling will eventually handle the completion
      }

      // Show short message in snackbar to avoid huge popups
      showNotification(successMessage || 'Migration completed successfully.', severity);

      // Store full message for tooltip
      setStepResults(prev => ({ ...prev, [stepId]: msg }));

      fetchAuditLogs();
    } catch (error) {
      showNotification('Migration failed: ' + (error.response?.data?.message || error.message), 'error');
      fetchAuditLogs();
    }

    // Only stop loading if it wasn't a background task or if it failed
    setLoadingSteps(prev => ({ ...prev, [stepId]: false }));
  };

  const handleDownloadSample = async (step) => {
    try {
      const endpoint = step.endpoint ? `${step.endpoint}/sample` : `/api/admin/migration/${step.id === 'hrmsEmployeeType' ? 'hrms-employee-types' : step.id}/sample`;
      const response = await axios.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${step.id}_Sample.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showNotification('Failed to download sample', 'error');
    }
  };

  const handleUploadFile = async (event, step) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoadingSteps(prev => ({ ...prev, [step.id]: true }));
    setStepResults(prev => ({ ...prev, [step.id]: '' }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${step.endpoint}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const severity = response.data?.status === 'WARNING' ? 'warning' : 'success';
      let msg = response.data?.details ? response.data : (response.data?.message || step.success);
      showNotification(response.data?.message || step.success, severity);
      setStepResults(prev => ({ ...prev, [step.id]: msg }));
      fetchAuditLogs();
    } catch (error) {
      showNotification('Excel migration failed: ' + (error.response?.data?.message || error.message), 'error');
      fetchAuditLogs();
    } finally {
      setLoadingSteps(prev => ({ ...prev, [step.id]: false }));
      event.target.value = ''; // Reset input
    }
  };

  const paginatedLogs = auditLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const currentScope = scopeOpen ? SCOPE_DATA[scopeOpen] : null;

  const successCount = auditLogs.filter(l => l.status === 'SUCCESS').length;
  const failedCount = auditLogs.filter(l => l.status === 'FAILED').length;

  // ── CELL STYLE helpers ──────────────────────────────────────────────────────
  const thCell = {
    fontWeight: 700,
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: isDark ? '#94a3b8' : '#64748b',
    bgcolor: isDark ? '#1e293b' : '#fff', // Use solid color for sticky header
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
    py: 1.5,
    whiteSpace: 'nowrap'
  };

  const tdCell = {
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f1f5f9',
    py: { xs: 1.25, sm: 1.5 },
    verticalAlign: 'middle'
  };

  const pillTabsData = SUB_TABS.map((t, idx) => {
    const isRunning = t.steps.some(s => loadingSteps[s.id]);
    return {
      value: idx,
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <span>{t.label}</span>
          {isRunning && (
            <CircularProgress size={12} thickness={5} sx={{ color: 'inherit' }} />
          )}
        </Box>
      )
    };
  });

  return (
    <MainCard
      title="Data Migration Hub"
      subtitle="Transfer data to the Autonova-Bos(s) architecture safely"
      icon={IconDatabaseExport}
      secondary={
        activeTab === 0 && (
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={runCurrentTab}
              disabled={loadingSteps.currentTab || loadingSteps.all}
              startIcon={loadingSteps.currentTab ? <CircularProgress size={14} color="inherit" /> : <IconPlayerPlay size={16} />}
              sx={{ borderRadius: '8px', px: 2, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', boxShadow: 'none' }}
            >
              {loadingSteps.currentTab ? `Migrating ${SUB_TABS[subTab]?.label}...` : `Start Tab (${SUB_TABS[subTab]?.label})`}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setMultiTabDialogOpen(true)}
              disabled={loadingSteps.all}
              startIcon={loadingSteps.all ? <CircularProgress size={14} color="inherit" /> : <IconDatabaseExport size={16} />}
              sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}
            >
              {loadingSteps.all ? 'Migrating All Tabs...' : 'Migrate Multiple Tabs'}
            </Button>
            {loading && (
              <Button size="small" variant="outlined" color="error" onClick={() => stopMigration()}
                sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}>
                <IconPlayerStop size={15} style={{ marginRight: 4 }} /> Stop
              </Button>
            )}
            <Button size="small" variant="outlined" onClick={() => setScopeOpen('all')}
              sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem', color: isDark ? '#f1f5f9' : 'text.primary', borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)', '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: isDark ? '#fff' : 'text.primary' } }}>
              View Scope
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={() => setConfirmClearAll(true)}
              sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}>
              Clear Transaction
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={() => setConfirmDropTables(true)}
              sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}>
              Drop Tables
            </Button>
            <Button size="small" variant="outlined" color="success" onClick={() => setConfirmCreateTables(true)}
              sx={{ borderRadius: '8px', px: 1.5, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}>
              Create Tables
            </Button>
          </Stack>
        )
      }
      sx={{
        border: 'none',
        borderRadius: '20px',
        background: isDark ? '#0f172a' : '#f8fafc',
        boxShadow: 'none',
        p: 0,
        height: { md: 'calc(100vh - 120px)' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
      contentSX={{
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}
    >

      {/* Top Fixed Section: Config + Loading Bar + Main Tabs */}
      <Box sx={{ flexShrink: 0 }}>
        {/* Temporary Migration Config */}
        <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, pb: 1.5, pt: 1.5 }}>
          <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 1.5, width: '100%' }}>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="SQL Server IP" value={sqlIp} onChange={e => { setSqlIp(e.target.value); setDbOptions([]); setSecondaryDbName(''); }} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="SQL Username" value={sqlUsername} onChange={e => { setSqlUsername(e.target.value); setDbOptions([]); setSecondaryDbName(''); }} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="SQL Password" type="password" value={sqlPassword} onChange={e => { setSqlPassword(e.target.value); setDbOptions([]); setSecondaryDbName(''); }} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={1} sx={{ width: { xs: '100%', md: '18%' } }}>
              <Button variant="outlined" fullWidth onClick={fetchDbOptions} sx={{ height: '38px', fontWeight: 600 }}>Connect</Button>
            </Grid>
            <Grid item xs={12} sm={6} md={5} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField select fullWidth size="small" label="Secondary DB Name" value={secondaryDbName} onChange={(e) => setSecondaryDbName(e.target.value)} InputLabelProps={{ shrink: true }}>
                <MenuItem value=""><em>None</em></MenuItem>
                {dbOptions.map((db) => (<MenuItem key={db} value={db}>{db}</MenuItem>))}
              </TextField>
            </Grid>
          </Grid>
          <Divider sx={{ mb: 1.5, opacity: isDark ? 0.1 : 1 }} />
          <Grid container spacing={2} alignItems="flex-end" sx={{ width: '100%' }}>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="File Server IP" value={fileIp} onChange={e => setFileIp(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="File Server Username" value={fileUsername} onChange={e => setFileUsername(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '18%' } }}>
              <TextField fullWidth size="small" label="File Server Password" type="password" value={filePassword} onChange={e => setFilePassword(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2} sx={{ width: { xs: '100%', md: '30%' } }}>
              <TextField fullWidth size="small" label="Old Attachment Path (Network Folder)" placeholder="e.g. \\192.168.1.50\BOS_DOCUMENTS" value={oldAttachmentPath} onChange={(e) => setOldAttachmentPath(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={12} md={6} sx={{ width: { xs: '100%', md: '11%' } }}>
              <Button variant="contained" onClick={handleBrowseOpen} sx={{ whiteSpace: 'nowrap', px: 2, height: '38px' }}>Browse</Button>
            </Grid>
          </Grid>
        </Box>

        {/* Loading bar */}
        {loading && (
          <LinearProgress sx={{
            mb: 1, borderRadius: '4px', height: 3,
            '& .MuiLinearProgress-bar': { background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)` },
            bgcolor: `${theme.palette.primary.main}1A`
          }} />
        )}

        {/* Main Tabs + Top Module Navigation */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0',
          mb: 2,
          px: { xs: 1.5, sm: 2, md: 3 }
        }}>
          <Tabs
            value={activeTab}
            onChange={(e, v) => setActiveTab(v)}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                fontWeight: 600, fontSize: { xs: '0.82rem', sm: '0.9rem' },
                textTransform: 'none', minHeight: 44,
                color: isDark ? '#64748b' : '#94a3b8',
                '&.Mui-selected': { color: theme.palette.primary.main, fontWeight: 700 }
              },
              '& .MuiTabs-indicator': {
                height: 3, borderRadius: '3px 3px 0 0',
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
              }
            }}
          >
            <Tab label="DB Migration" icon={<IconDatabaseExport size={18} />} iconPosition="start" />
            <Tab label="Excel Migration" icon={<IconUpload size={18} />} iconPosition="start" />
            <Tab label={`Audit History${auditLogs.length ? ` (${auditLogs.length})` : ''}`} icon={<IconHistory size={18} />} iconPosition="start" />
          </Tabs>

          {/* Active Migration Status Widget in Header (Middle / Green Box Location) */}
          {(activeTab === 0 || activeTab === 1) && loading && (() => {
            const currentMigrated = (activeStats?.migratedRecords || 0) + (activeStats?.failedRecords || 0);
            const totalRecs = activeStats?.totalRecords || 0;
            const percent = totalRecs > 0 ? Math.min(100, Math.max(1, Math.round((currentMigrated / totalRecs) * 100))) : 0;
            const pendingRecs = Math.max(0, totalRecs - currentMigrated);

            return (
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.25,
                px: 1.75,
                py: 0.65,
                borderRadius: '50px',
                bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(226, 232, 240, 0.95)',
                boxShadow: isDark
                  ? '0 4px 20px -2px rgba(0, 0, 0, 0.6), 0 0 16px -2px rgba(59, 130, 246, 0.25)'
                  : '0 4px 20px -2px rgba(37, 99, 235, 0.1), 0 0 12px -2px rgba(37, 99, 235, 0.08)',
                flexShrink: 0,
                transition: 'all 0.3s ease'
              }}>
                {/* Pulsing Live Dot + Step Title Tag */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.2,
                  py: 0.35,
                  borderRadius: '20px',
                  bgcolor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 246, 255, 0.9)',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(191, 219, 254, 0.8)'
                }}>
                  <Box sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 10,
                    height: 10
                  }}>
                    <Box sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      bgcolor: '#3b82f6',
                      animation: 'pulseRipple 1.6s ease-out infinite',
                      '@keyframes pulseRipple': {
                        '0%': { transform: 'scale(0.8)', opacity: 1 },
                        '100%': { transform: 'scale(2.6)', opacity: 0 }
                      }
                    }} />
                    <Box sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: '#2563eb',
                      boxShadow: '0 0 6px #3b82f6'
                    }} />
                  </Box>
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    color: isDark ? '#93c5fd' : '#1d4ed8',
                    whiteSpace: 'nowrap'
                  }}>
                    {activeRunningStep?.title || 'Migrating...'}
                  </Typography>
                </Box>

                {/* Stopwatch Timer Pill */}
                <Stack direction="row" alignItems="center" spacing={0.6} sx={{
                  px: 1,
                  py: 0.35,
                  borderRadius: '20px',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(241, 245, 249, 0.85)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
                }}>
                  <IconClock size={13} color={isDark ? '#38bdf8' : '#0284c7'} />
                  <Typography sx={{
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    letterSpacing: '0.02em',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    whiteSpace: 'nowrap'
                  }}>
                    {formatDuration(globalElapsedSeconds)}
                  </Typography>
                </Stack>

                {/* Progress Details */}
                {totalRecs > 0 && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {/* Gradient % Badge */}
                    <Box sx={{
                      px: 0.9,
                      py: 0.2,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      letterSpacing: '0.01em',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
                      whiteSpace: 'nowrap'
                    }}>
                      {percent}%
                    </Box>

                    {/* Record counts */}
                    <Typography sx={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: isDark ? '#94a3b8' : '#64748b',
                      whiteSpace: 'nowrap'
                    }}>
                      <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{currentMigrated.toLocaleString()}</strong>
                      {' / '}{totalRecs.toLocaleString()}
                      {pendingRecs > 0 && (
                        <span style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.68rem', marginLeft: 4 }}>
                          ({pendingRecs.toLocaleString()} left)
                        </span>
                      )}
                    </Typography>

                    {/* Shimmering Animated Gradient Progress Bar */}
                    <Box sx={{
                      position: 'relative',
                      width: { xs: 60, sm: 80, md: 100 },
                      height: 6,
                      borderRadius: 3,
                      overflow: 'hidden',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'
                    }}>
                      <Box sx={{
                        height: '100%',
                        width: `${percent}%`,
                        borderRadius: 3,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)',
                        position: 'relative',
                        transition: 'width 0.35s ease',
                        boxShadow: '0 0 8px rgba(99, 102, 241, 0.45)',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0, left: 0, bottom: 0, right: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                          animation: 'shimmerBar 1.8s infinite',
                          '@keyframes shimmerBar': {
                            '0%': { transform: 'translateX(-100%)' },
                            '100%': { transform: 'translateX(100%)' }
                          }
                        }
                      }} />
                    </Box>
                  </Stack>
                )}
              </Box>
            );
          })()}

          {(activeTab === 0 || activeTab === 1) && !loading && lastCompletedInfo && (
            <Chip
              icon={<IconCheck size={14} style={{ marginLeft: 6 }} />}
              label={`Last: ${lastCompletedInfo.title} (${lastCompletedInfo.duration})`}
              size="small"
              sx={{
                height: 26,
                fontWeight: 600,
                fontSize: '0.72rem',
                bgcolor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)',
                color: isDark ? '#4ade80' : '#16a34a',
                border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(34,197,94,0.25)',
                borderRadius: '8px'
              }}
            />
          )}

          {/* Top Quick Module Switcher (Green Box Location) */}
          {(activeTab === 0 || activeTab === 1) && (
            <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ pb: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={subTab === 0}
                onClick={() => setSubTab(Math.max(0, subTab - 1))}
                startIcon={<IconChevronLeft size={16} />}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, py: 0.25, px: 1.25, fontSize: '0.75rem', borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' }}
              >
                Previous
              </Button>
              <Chip
                label={`${subTab + 1} / ${SUB_TABS.length}: ${SUB_TABS[subTab]?.label}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: '0.72rem', height: 26 }}
              />
              <Button
                size="small"
                variant="contained"
                disabled={subTab === SUB_TABS.length - 1}
                onClick={() => setSubTab(Math.min(SUB_TABS.length - 1, subTab + 1))}
                endIcon={<IconChevronRight size={16} />}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, py: 0.25, px: 1.25, fontSize: '0.75rem', boxShadow: 'none' }}
              >
                Next
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Main Content Area (Scrollable body) */}
      {(activeTab === 0 || activeTab === 1) && (
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          px: { xs: 1.5, sm: 2, md: 3 },
          pb: { xs: 1.5, sm: 2, md: 3 },
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Left Vertical Sidebar for Modules */}
          <Box sx={{ minWidth: { md: 160, lg: 180 }, flexShrink: 0, overflowY: 'auto', maxHeight: '100%' }}>
            <BOSPillTabs
              tabs={pillTabsData}
              value={subTab}
              onChange={setSubTab}
              orientation="responsive"
            />
          </Box>

          {/* Right Content Column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Scrollable Migration Cards Grid */}
            <Box sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              pr: { md: 1.5 },
              pb: 2,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', borderRadius: '10px' },
              '&::-webkit-scrollbar-thumb:hover': { background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }
            }}>
              {(() => {
                const activeSteps = SUB_TABS[subTab]?.steps || [];

                return (
                  <Stack spacing={3}>
                    {Array.from(new Set(activeSteps.map(s => s.category || 'General'))).map((category) => {
                      const categorySteps = activeSteps.filter(s => (s.category || 'General') === category && (activeTab === 1 ? s.hasUpload : true));
                      if (categorySteps.length === 0) return null;
                      return (
                        <Box key={category}>
                          {category !== 'General' && (
                            <Typography variant="h5" sx={{ mb: 1.5, fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b' }}>
                              {category}
                            </Typography>
                          )}
                          <Grid container spacing={3} alignItems="stretch">
                            {categorySteps.map((step) => (
                              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }} key={step.id} sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <MigrationCard
                                  step={step}
                                  isExcelTab={activeTab === 1}
                                  loading={Boolean(loadingSteps[step.id])}
                                  disabled={Boolean(loadingSteps[step.id]) || clearingId === step.id}
                                  isClearing={clearingId === step.id}
                                  onRun={runMigration}
                                  onFinish={(id) => setLoadingSteps(prev => ({ ...prev, [id]: false }))}
                                  onStop={stopMigration}
                                  onClear={setConfirmClear}
                                  onScope={setScopeOpen}
                                  onDownloadSample={handleDownloadSample}
                                  onUploadFile={handleUploadFile}
                                  onViewLog={handleViewLog}
                                  isDark={isDark}
                                  resultMessage={stepResults[step.id]}
                                  latestLog={findLatestLog(auditLogs, step)}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      );
                    })}
                  </Stack>
                );
              })()}
            </Box>


          </Box>
        </Box>
      )}


      {/* ── TAB 2: Audit History ────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: { xs: 1.5, sm: 2, md: 3 }, pb: 3 }}>


          {/* Table */}
          <Card sx={{
            borderRadius: '14px',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0',
            boxShadow: 'none',
            overflow: 'hidden',
            background: isDark ? 'rgba(15,23,42,0.7)' : '#fff'
          }}>
            {selectedLogIds.length > 0 && (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6366f1' }}>
                  {selectedLogIds.length} selected
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  startIcon={<IconTrash size={16} />}
                  onClick={() => setConfirmBulkDelete(true)}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Delete Selected
                </Button>
              </Box>
            )}
            <TableContainer sx={{
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: {
                xs: 'calc(100vh - 480px)',
                sm: 'calc(100vh - 450px)',
                md: 'calc(100vh - 420px)',
                lg: 'calc(100vh - 400px)'
              },
              minHeight: 220
            }}>
              <Table size={isMobile ? 'small' : 'medium'} stickyHeader sx={{ minWidth: isMobile ? 480 : 700 }}>

                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ ...thCell, pl: 1.5 }}>
                      <Checkbox
                        size="small"
                        indeterminate={selectedLogIds.length > 0 && selectedLogIds.length < paginatedLogs.length}
                        checked={paginatedLogs.length > 0 && selectedLogIds.length === paginatedLogs.length}
                        onChange={toggleSelectAll}
                        sx={{ color: isDark ? '#475569' : '#cbd5e1', '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: '#6366f1' }, p: 0 }}
                      />
                    </TableCell>
                    <TableCell sx={thCell}>Date / Time</TableCell>
                    <TableCell sx={thCell}>User</TableCell>
                    <TableCell sx={thCell}>Table</TableCell>
                    {!isMobile && <TableCell sx={{ ...thCell, textAlign: 'center' }}>Records</TableCell>}
                    {!isMobile && <TableCell sx={{ ...thCell, textAlign: 'center' }}>Duration</TableCell>}
                    <TableCell sx={{ ...thCell, textAlign: 'center' }}>Status</TableCell>
                    {!isTablet && <TableCell sx={thCell}>Message</TableCell>}
                    <TableCell sx={{ ...thCell, textAlign: 'center', pr: 1.5 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fetchingLogs && auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 8, border: 'none' }}>
                        <CircularProgress size={36} thickness={4} sx={{ color: '#6366f1', mb: 1.5, display: 'block', mx: 'auto' }} />
                        <Typography variant="body2" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600 }}>Loading history...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 10, border: 'none' }}>
                        <Avatar sx={{ bgcolor: isDark ? 'rgba(99,102,241,0.1)' : '#f1f5f9', color: isDark ? '#6366f1' : '#94a3b8', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                          <IconHistory size={28} />
                        </Avatar>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? '#475569' : '#94a3b8' }}>No migration logs yet</Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#334155' : '#cbd5e1' }}>Run a migration to see records here.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => {
                      const isSelected = selectedLogIds.includes(log.id);
                      const isSuccess = log.status === 'SUCCESS';
                      return (
                        <TableRow
                          key={log.id}
                          sx={{
                            bgcolor: isSelected
                              ? isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected
                                ? isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)'
                                : isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'
                            },
                            transition: 'background 0.15s'
                          }}
                        >
                          <TableCell padding="checkbox" sx={{ ...tdCell, pl: 1.5 }}>
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={() => toggleSelectLog(log.id)}
                              sx={{ color: isDark ? '#334155' : '#e2e8f0', '&.Mui-checked': { color: '#6366f1' }, p: 0 }}
                            />
                          </TableCell>

                          {/* Date */}
                          <TableCell sx={tdCell}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', display: 'block' }}>
                              {log.migratedAt ? format(new Date(log.migratedAt), 'dd MMM yyyy') : '—'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#94a3b8' }}>
                              {log.migratedAt ? format(new Date(log.migratedAt), 'hh:mm a') : ''}
                            </Typography>
                          </TableCell>

                          {/* User */}
                          <TableCell sx={tdCell}>
                            <Chip
                              label={log.migratedBy || 'System'}
                              size="small"
                              sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 700, height: 22, fontSize: '0.72rem', borderRadius: '6px' }}
                            />
                          </TableCell>

                          {/* Table */}
                          <TableCell sx={{ ...tdCell, maxWidth: { xs: 130, sm: 200 } }}>
                            <Tooltip title={log.tableName || ''} placement="top-start">
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace', fontWeight: 600,
                                  color: isDark ? '#cbd5e1' : '#334155',
                                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                                  px: 1, py: 0.3, borderRadius: '5px',
                                  display: 'block',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}
                              >
                                {log.tableName}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* Records */}
                          {!isMobile && (
                            <TableCell sx={{ ...tdCell, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: isDark ? '#f1f5f9' : '#0f172a' }}>
                                {log.recordsCount ?? '—'}
                              </Typography>
                            </TableCell>
                          )}

                          {/* Duration */}
                          {!isMobile && (
                            <TableCell sx={{ ...tdCell, textAlign: 'center' }}>
                              <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
                                {log.executionTimeMs != null ? `${log.executionTimeMs} ms` : '—'}
                              </Typography>
                            </TableCell>
                          )}

                          {/* Status */}
                          <TableCell sx={{ ...tdCell, textAlign: 'center' }}>
                            <Chip
                              label={log.status}
                              size="small"
                              sx={{
                                fontWeight: 800, fontSize: '0.7rem', borderRadius: '7px', height: 22,
                                bgcolor: isSuccess ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                color: isSuccess ? '#059669' : '#dc2626',
                                border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
                              }}
                            />
                          </TableCell>

                          {/* Message */}
                          {!isTablet && (
                            <TableCell sx={{ ...tdCell, maxWidth: 280 }}>
                              <Tooltip title={log.message || ''} placement="top-start">
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    color: isSuccess ? (isDark ? '#94a3b8' : '#64748b') : '#ef4444',
                                    fontWeight: isSuccess ? 500 : 600,
                                    lineHeight: 1.5
                                  }}
                                >
                                  {log.message || 'Executed successfully.'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                          )}

                          {/* Delete */}
                          <TableCell sx={{ ...tdCell, textAlign: 'center', pr: 1.5 }}>
                            <Tooltip title="Delete this log">
                              <Button
                                size="small"
                                onClick={() => setConfirmDeleteLog(log)}
                                sx={{ minWidth: 30, width: 30, height: 30, p: 0, borderRadius: '8px', color: isDark ? '#475569' : '#cbd5e1', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)', color: '#ef4444' } }}
                              >
                                <IconTrash size={15} />
                              </Button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }} />
            <TablePagination
              component="div"
              count={auditLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{
                fontSize: '0.78rem',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8' },
                '& .MuiTablePagination-select': { fontSize: '0.78rem' },
                '& .MuiIconButton-root': { color: isDark ? '#475569' : '#94a3b8' }
              }}
            />
          </Card>
        </Box>
      )}

      {/* ── Scope Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!scopeOpen} onClose={() => setScopeOpen(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '18px', background: isDark ? '#1e293b' : '#fff' } }}>
        {currentScope && (
          <>
            <DialogTitle sx={{ pb: 1, borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main, width: 40, height: 40, borderRadius: '12px' }}>
                  <IconInfoCircle size={22} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#0f172a'}>{currentScope.title}</Typography>
                  <Typography variant="caption" color={isDark ? '#64748b' : '#94a3b8'}>{currentScope.subtitle}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={1.5}>
                {currentScope.items.map((item, idx) => {
                  const tc = TAG_COLORS[item.tag] || TAG_COLORS.Audit;
                  return (
                    <Box key={idx} sx={{ p: 2, borderRadius: '12px', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f1f5f9', bgcolor: isDark ? 'rgba(15,23,42,0.5)' : '#fafafa' }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: isDark ? '#e2e8f0' : '#0f172a' }}>{item.table}</Typography>
                        <Chip label={item.tag} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: tc.bg, color: tc.color, borderRadius: '5px' }} />
                      </Stack>
                      <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', lineHeight: 1.6 }}>{item.desc}</Typography>
                    </Box>
                  );
                })}
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setScopeOpen(null)} variant="contained"
                sx={{ borderRadius: '10px', px: 3.5, fontWeight: 700, textTransform: 'none', bgcolor: '#6366f1', boxShadow: 'none', '&:hover': { bgcolor: '#4f46e5' } }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Clear All Confirmation ──────────────────────────────────────────────── */}
      <Dialog open={confirmClearAll} onClose={() => setConfirmClearAll(false)} PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconAlertTriangle size={24} /> Clear All Transactions
        </DialogTitle>
        <DialogContent>
          <Typography>All table records will be deleted. Do you want to delete?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmClearAll(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleClearAllTransactions} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700, boxShadow: 'none' }}>Yes</Button>
        </DialogActions>
      </Dialog>

      {/* ── Clear Confirmation ──────────────────────────────────────────────── */}
      <Dialog open={Boolean(confirmClear)} onClose={() => setConfirmClear(null)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 380 }, background: isDark ? '#1e293b' : '#fff' } }}>
        {confirmClear && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 40, height: 40 }}>
                  <IconAlertTriangle size={22} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>Clear {confirmClear.title}?</Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
                This will permanently remove all migrated records for <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{confirmClear.title}</strong> from the target tables. This cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button onClick={() => setConfirmClear(null)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
              <Button onClick={clearMigrationData} variant="contained" color="error" disabled={loading}
                sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
                {loading ? 'Clearing...' : 'Yes, Clear'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Single Log Delete Confirmation ─────────────────────────────────── */}
      <Dialog open={Boolean(confirmDeleteLog)} onClose={() => setConfirmDeleteLog(null)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 380 }, background: isDark ? '#1e293b' : '#fff' } }}>
        {confirmDeleteLog && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 40, height: 40 }}>
                  <IconTrash size={20} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>Delete log entry?</Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
                Remove the audit log for <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{confirmDeleteLog.tableName}</strong> recorded on{' '}
                {confirmDeleteLog.migratedAt ? new Date(confirmDeleteLog.migratedAt).toLocaleString() : ''}?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button onClick={() => setConfirmDeleteLog(null)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
              <Button onClick={() => deleteAuditLog(confirmDeleteLog.id)} variant="contained" color="error"
                sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── No Attachment Confirmation ─────────────────────────────────────── */}
      <Dialog open={Boolean(confirmNoAttachment)} onClose={() => setConfirmNoAttachment(null)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 380 }, background: isDark ? '#1e293b' : '#fff' } }}>
        {confirmNoAttachment && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: 'rgba(245,158,11,0.1)', color: '#f59e0b', width: 40, height: 40 }}>
                  <IconAlertTriangle size={22} />
                </Avatar>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>Missing Attachment Path</Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
                You have not provided an <strong>Old Attachment Path</strong>. Are you sure you want to migrate <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>Product Master</strong> without copying any attachments?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button onClick={() => setConfirmNoAttachment(null)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
              <Button onClick={() => {
                const args = confirmNoAttachment;
                setConfirmNoAttachment(null);
                runMigration(args.endpoint, args.successMessage, args.stepId, true);
              }} variant="contained" color="warning"
                sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
                Proceed Without Attachments
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Bulk Delete Confirmation ────────────────────────────────────────── */}
      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 380 }, background: isDark ? '#1e293b' : '#fff' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 40, height: 40 }}>
              <IconTrash size={20} />
            </Avatar>
            <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>
              Delete {selectedLogIds.length} log{selectedLogIds.length > 1 ? 's' : ''}?
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
            This will permanently remove <strong style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{selectedLogIds.length}</strong> selected audit log {selectedLogIds.length > 1 ? 'entries' : 'entry'}. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setConfirmBulkDelete(false)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={deleteSelectedLogs} variant="contained" color="error"
            sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Clear All Transactions Confirmation ───────────────────────────── */}
      <Dialog open={confirmClearAll} onClose={() => setConfirmClearAll(false)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 420 }, background: isDark ? '#1e293b' : '#fff' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 42, height: 42 }}>
              <IconAlertTriangle size={24} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>
                Clear All Transaction Data?
              </Typography>
              <Typography variant="caption" color={isDark ? '#94a3b8' : '#64748b'}>
                Wipe transactional and operational data
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
            This will wipe transactional data across modules. Protected core configurations (BOS Modules, Divisions, Super Admins) will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setConfirmClearAll(false)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleClearTransaction} variant="contained" color="error"
            disabled={loadingSteps.all}
            startIcon={loadingSteps.all ? <CircularProgress size={16} color="inherit" /> : <IconTrash size={16} />}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
            Clear Transactions
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Drop All Tables Confirmation ────────────────────────────────────── */}
      <Dialog open={confirmDropTables} onClose={() => setConfirmDropTables(false)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 440 }, background: isDark ? '#1e293b' : '#fff' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444', width: 42, height: 42 }}>
              <IconAlertTriangle size={24} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>
                Drop All Database Tables?
              </Typography>
              <Typography variant="caption" color="#ef4444" fontWeight={700}>
                DANGER: Highly Destructive Action
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
            WARNING: This will drop <strong>ALL database tables and foreign key constraints</strong> except core authentication and system tables (<code style={{ color: '#ef4444' }}>BOS_MODULES, BOS_PAGES, AD_DIVISION, AD_USER_CREDENTIAL</code>). This action cannot be undone!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setConfirmDropTables(false)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleDropTables} variant="contained" color="error"
            disabled={loadingSteps.all}
            startIcon={loadingSteps.all ? <CircularProgress size={16} color="inherit" /> : <IconTrash size={16} />}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
            Drop All Tables
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Create All Tables Confirmation ──────────────────────────────────── */}
      <Dialog open={confirmCreateTables} onClose={() => setConfirmCreateTables(false)}
        PaperProps={{ sx: { borderRadius: '18px', p: 0.5, minWidth: { xs: 300, sm: 420 }, background: isDark ? '#1e293b' : '#fff' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', width: 42, height: 42 }}>
              <IconDatabaseExport size={24} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>
                Recreate / Migrate Tables?
              </Typography>
              <Typography variant="caption" color={isDark ? '#94a3b8' : '#64748b'}>
                Execute Flyway migration scripts
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.7 }}>
            This will execute all versioned Flyway migration SQL scripts to recreate any missing tables, schemas, and default master definitions.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setConfirmCreateTables(false)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleCreateTables} variant="contained" color="success"
            disabled={loadingSteps.all}
            startIcon={loadingSteps.all ? <CircularProgress size={16} color="inherit" /> : <IconDatabaseExport size={16} />}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}>
            Create Tables
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ────────────────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled"
          sx={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {/* Data Table Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? '#0f172a' : '#fff',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
          }
        }}
      >
        <DialogTitle sx={{
          p: 2.5, pb: 2,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {logDialogData?.step?.title} Migration Data
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 700, p: 0.5, bgcolor: `${theme.palette.success.main}1A`, borderRadius: 1 }}>
              Success: {logDialogData?.data?.migratedCount || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.error.main, fontWeight: 700, p: 0.5, bgcolor: `${theme.palette.error.main}1A`, borderRadius: 1 }}>
              Failed: {logDialogData?.data?.failedCount || 0}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs
            value={logTab}
            onChange={(e, v) => setLogTab(v)}
            sx={{
              px: 2,
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 }
            }}
          >
            <Tab label="All Data" />
            <Tab label="Success" />
            <Tab label="Failed" />
          </Tabs>

          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={thCell}>Type Name</TableCell>
                  <TableCell sx={thCell}>Description</TableCell>
                  <TableCell sx={thCell}>Status</TableCell>
                  <TableCell sx={thCell}>Result</TableCell>
                  <TableCell sx={thCell}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logDialogData?.data?.details
                  ?.filter(row => {
                    if (logTab === 1) return row.migrationStatus === 'SUCCESS';
                    if (logTab === 2) return row.migrationStatus === 'FAILED';
                    return true;
                  })
                  .map((row, idx) => (
                    <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={tdCell}>
                        <Typography variant="body2" fontWeight={500} color={isDark ? '#e2e8f0' : '#1e293b'}>
                          {row.typeName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tdCell}>
                        <Typography variant="body2" color={isDark ? '#cbd5e1' : '#475569'}>
                          {row.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tdCell}>
                        <Typography variant="body2" color={isDark ? '#cbd5e1' : '#475569'}>
                          {row.status || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={tdCell}>
                        <Chip
                          label={row.migrationStatus}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: row.migrationStatus === 'SUCCESS' ? `${theme.palette.success.main}1A` : `${theme.palette.error.main}1A`,
                            color: row.migrationStatus === 'SUCCESS' ? theme.palette.success.main : theme.palette.error.main,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={tdCell}>
                        <Typography variant="body2" color={isDark ? '#cbd5e1' : '#475569'}>
                          {row.reason || '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                {(!logDialogData?.data?.details || logDialogData.data.details.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No data available</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }}>
          <Button onClick={() => setLogDialogOpen(false)} variant="outlined" size="small" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={browseDialogOpen} onClose={() => setBrowseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Browse Remote Directory</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => {
              const parts = browsePath.split('\\').filter(Boolean);
              if (parts.length <= 1) fetchDirectories('');
              else {
                parts.pop();
                fetchDirectories(parts.join('\\') + '\\');
              }
            }} disabled={!browsePath}>Up</Button>
            <Typography variant="body2" sx={{ ml: 1, flex: 1, wordBreak: 'break-all' }}>{browsePath || 'Root Drives'}</Typography>
          </Box>
          {browsing ? <LinearProgress /> : (
            <List dense sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 1 }}>
              {browseFolders.map(folder => (
                <ListItem key={folder} disablePadding>
                  <ListItemButton onClick={() => {
                    let nextPath = folder;
                    if (browsePath) {
                      nextPath = browsePath.endsWith('\\') ? browsePath + folder : browsePath + '\\' + folder;
                    }
                    fetchDirectories(nextPath);
                  }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><IconFolder size={20} /></ListItemIcon>
                    <ListItemText primary={folder} />
                  </ListItemButton>
                </ListItem>
              ))}
              {browseFolders.length === 0 && <ListItem><ListItemText primary="No folders found or access denied." /></ListItem>}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrowseDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            let finalPath = browsePath;
            if (finalPath && !finalPath.startsWith('\\\\')) {
              finalPath = `\\\\${fileIp}\\${finalPath.split('/').join('\\')}`;
            }
            setOldAttachmentPath(finalPath);
            setBrowseDialogOpen(false);
          }} variant="contained" disabled={!browsePath}>Select Current Path</Button>
        </DialogActions>
      </Dialog>

      {/* ── Multi-Tab Migration Dialog ─────────────────────────────────────── */}
      <Dialog
        open={multiTabDialogOpen}
        onClose={() => setMultiTabDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 0.5,
            background: isDark ? '#1e293b' : '#fff'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main, width: 40, height: 40 }}>
              <IconDatabaseExport size={22} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color={isDark ? '#f1f5f9' : '#1e293b'}>Migrate Multiple Tabs</Typography>
              <Typography variant="caption" color={isDark ? '#94a3b8' : '#64748b'}>Select modules to migrate sequentially</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => setSelectedSubTabs(SUB_TABS.map((_, i) => i))} sx={{ textTransform: 'none', fontWeight: 600 }}>Select All</Button>
            <Button size="small" color="inherit" onClick={() => setSelectedSubTabs([])} sx={{ textTransform: 'none', fontWeight: 600 }}>Clear</Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', py: 1 }}>
          <List dense disablePadding>
            {SUB_TABS.map((tab, idx) => {
              const isChecked = selectedSubTabs.includes(idx);
              const isTabRunning = tab.steps.some(s => loadingSteps[s.id]);
              return (
                <ListItem key={tab.label} disablePadding sx={{ borderRadius: '8px', mb: 0.5, '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' } }}>
                  <ListItemButton
                    onClick={() => {
                      setSelectedSubTabs(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
                    }}
                    sx={{ borderRadius: '8px', py: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Checkbox edge="start" checked={isChecked} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>{tab.label}</Typography>
                          {isTabRunning && <CircularProgress size={12} thickness={5} />}
                        </Stack>
                      }
                      secondary={`${tab.steps.length} migration tables`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
          <Button onClick={() => setMultiTabDialogOpen(false)} sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, px: 2.5, textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={runSelectedTabs}
            variant="contained"
            color="primary"
            disabled={selectedSubTabs.length === 0}
            startIcon={<IconPlayerPlay size={16} />}
            sx={{ borderRadius: '10px', px: 3, fontWeight: 800, textTransform: 'none', boxShadow: 'none' }}
          >
            Start Migration ({selectedSubTabs.length} Tabs)
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
