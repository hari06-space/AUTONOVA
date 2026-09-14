import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  TextField,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import {
  IconClock,
  IconRefresh,
  IconDeviceFloppy,
  IconClipboardCheck,
  IconFileSpreadsheet,
  IconPlus,
  IconDownload,
  IconUpload,
  IconFileImport,
  IconEdit,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig, setFilters } from 'store/slices/search';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSDatePicker,
  BOSTimePicker,
  BOSAutocomplete,
  BOSEmployeeAutocomplete,
  BOSTextField,
  BOSExportButton,
  BOSStatusChip,
  BOSTableToolbar,
  BOSFormDialog,
  BOSFormSection,
  btnNew,
  btnSave,
  btnCancel,
  btnExport
} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const ATT_TYPE_OPTIONS = ['Present', 'Absent', 'SP', 'SL', 'EL', 'WO', 'Holiday'];

const sanitizeAttType = (val) => {
  if (!val) return 'Absent';
  const str = String(val).trim();
  if (ATT_TYPE_OPTIONS.includes(str)) {
    return str;
  }
  return 'Absent';
};

const REMARKS_OPTIONS = [
  'Forgot Punch Out',
  'Manual Correction',
  'Official Duty',
  'Late Approval'
];

const SOURCE_COLORS = {
  ESSL: 'primary',
  MANUAL: 'warning',
  OD: 'info'
};

const ATT_TYPE_COLORS = {
  Present: 'success',
  Absent: 'error',
  SP: 'warning',
  SL: 'info',
  EL: 'secondary',
  WO: 'default',
  Holiday: 'primary'
};

// ── Utility: Parse "HH:mm" to total minutes ────────────────────────────────
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

// ── Utility: Format LocalTime for display ───────────────────────────────────
const formatTime = (timeVal) => {
  if (!timeVal) return '';
  if (typeof timeVal === 'string') return timeVal.substring(0, 5);
  return timeVal;
};

// ── Client-side Calculation Engine (mirrors backend logic) ──────────────────
const calculateMetrics = (row, otMinStep = 30) => {
  const inTime = row.inTime;
  const outTime = row.outTime;

  // Determine ATT_TYPE
  if (!inTime && !outTime) {
    return { ...row, attType: row.attType || 'Absent', duration: 0, lom: 0, earlyOut: 0, earlyIn: 0, ot: 0 };
  }
  if (inTime && !outTime) {
    return { ...row, attType: 'SP', duration: 0, lom: 0, earlyOut: 0, earlyIn: 0, ot: 0 };
  }

  // Both present
  let inMinutes = parseTimeToMinutes(inTime);
  let outMinutes = parseTimeToMinutes(outTime);
  const shiftStartMin = parseTimeToMinutes(row.shiftStartTime);
  const shiftEndMin = parseTimeToMinutes(row.shiftEndTime);

  if (inMinutes == null || outMinutes == null) {
    return { ...row, attType: 'Present' };
  }

  // Handle Night Shift Crossover (outTime < inTime)
  if (outMinutes < inMinutes) {
    outMinutes += 1440; // 24 hours
  }

  // DURATION
  const duration = Math.max(0, outMinutes - inMinutes);

  // LOM (Loss of Minutes) = late arrival
  let lom = 0;
  if (shiftStartMin != null && inMinutes > shiftStartMin) {
    lom = inMinutes - shiftStartMin;
  }

  // EARLY_OUT = early departure
  let earlyOut = 0;
  if (shiftEndMin != null && outMinutes < shiftEndMin) {
    earlyOut = shiftEndMin - outMinutes;
  }

  // OT (Overtime) — only if otEligible === 'YES' and applying OT_MIN_MINUTES step interval
  let ot = 0;
  const isOtEligible = row.otEligible === 'YES' || row.otEligible === true;
  if (isOtEligible && shiftEndMin != null && outMinutes > shiftEndMin) {
    const extraMins = outMinutes - shiftEndMin;
    const step = otMinStep > 0 ? otMinStep : 30;
    if (extraMins >= step) {
      ot = Math.floor(extraMins / step) * step;
    }
  }

  return {
    ...row,
    attType: ['SL', 'EL', 'WO', 'Holiday'].includes(row.attType) ? row.attType : 'Present',
    duration,
    lom,
    earlyOut,
    earlyIn: 0,
    ot
  };
};

// ── Utility: Safe date string parsing (YYYY-MM-DD) ──────────────────────────
const safeFormatDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.substring(0, 10);
  if (val instanceof Date && !isNaN(val.getTime())) {
    const yyyy = val.getFullYear();
    const mm = String(val.getMonth() + 1).padStart(2, '0');
    const dd = String(val.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (val?.target?.value) return String(val.target.value).substring(0, 10);
  if (typeof val?.toISOString === 'function') return val.toISOString().substring(0, 10);
  return '';
};

// ── Utility: Get today as YYYY-MM-DD ────────────────────────────────────────
const getLocalDateString = () => {
  return safeFormatDateStr(new Date());
};

// ── Utility: Format Employee Option for Autocomplete ─────────────────────────
const getEmployeeOptionLabel = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  const empCode = opt.oldEmpCode || opt.empCode || '';
  const empName = opt.employeeName || opt.empName || '';
  let dept = '';
  if (typeof opt.department === 'string') {
    dept = opt.department;
  } else if (opt.department && typeof opt.department === 'object') {
    dept = opt.department.departmentName || opt.department.name || '';
  } else if (opt.departmentName) {
    dept = opt.departmentName;
  }
  const deptStr = dept ? ` (${dept})` : '';
  return `${empCode} - ${empName}${deptStr}`;
};

// ── Utility: Format Shift Option for Autocomplete ────────────────────────────
const getShiftOptionLabel = (opt) => {
  if (!opt) return '';
  if (typeof opt === 'string') return opt;
  const name = opt.shiftName || opt.name || 'Shift';
  const start = opt.startTime || '';
  const end = opt.endTime || '';
  const timeStr = start && end ? ` (${start} - ${end})` : '';
  return `${name}${timeStr}`;
};

import useAuth from 'hooks/useAuth';
import useLookups from 'hooks/useLookups';

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AttendanceEntry() {
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_ATTENDANCE_ENTRY);
  const { user } = useAuth();

  // ── Master Lookups for Global Filters ──────────────────────────────────────
  const lookups = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'DIVISIONS', 'CATEGORIES', 'EMPLOYEES']);
  const lookupDepartments = useMemo(() => lookups?.departments || [], [lookups?.departments]);
  const lookupDesignations = useMemo(() => lookups?.designations || [], [lookups?.designations]);
  const lookupDivisions = useMemo(() => lookups?.divisions || [], [lookups?.divisions]);
  const lookupCategories = useMemo(() => lookups?.categories || lookups?.types || [], [lookups?.categories, lookups?.types]);
  const lookupEmployees = useMemo(() => lookups?.employees || [], [lookups?.employees]);

  const lookupDepKey = lookupDepartments.length;
  const lookupDesKey = lookupDesignations.length;
  const lookupDivKey = lookupDivisions.length;
  const lookupCatKey = lookupCategories.length;
  const lookupEmpKey = lookupEmployees.length;

  // ── Global Search & Filters Redux Integration ─────────────────────────────
  const globalFilters = useSelector((state) => state.search?.filters) || {};
  const globalQuery = useSelector((state) => state.search?.rawQuery || state.search?.query || '');

  // ── State ───────────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [modifiedRows, setModifiedRows] = useState(new Set());

  // ── Date-Based User Access Control Thresholds ─────────────────────────────
  const todayStr = getLocalDateString();
  const minAllowedDate = useMemo(() => {
    // Manager or Add 1 / Admin -> Unlimited past date editing anytime!
    if (perms.manager || perms.additional1 || perms.isAdmin) {
      return null;
    }
    // Normal Employee with write permission -> Today only! (Cannot edit past dates)
    return todayStr;
  }, [perms.additional1, perms.isAdmin, perms.manager, todayStr]);

  const isDateReadOnly = useMemo(() => {
    if (!minAllowedDate) return false;
    return selectedDate < minAllowedDate;
  }, [selectedDate, minAllowedDate]);

  // Master options for Add Attendance Entry Modal
  const [employeeList, setEmployeeList] = useState([]);
  const [shiftList, setShiftList] = useState([]);
  const [otMinMinutes, setOtMinMinutes] = useState(30);

  // Filter employee dropdown options:
  // Managers, Add1, and Admins can see all employees. Normal users see ONLY themselves.
  const modalEmployeeOptions = useMemo(() => {
    const isElevatedUser = perms.manager || perms.additional1 || perms.isAdmin;
    if (isElevatedUser) {
      return employeeList;
    }
    // Normal User: filter employeeList for logged-in user
    const currentEmpId = user?.empId || user?.employeeId || user?.id;
    const currentEmpCode = user?.empCode || user?.userId || user?.userCode;

    if (!currentEmpId && !currentEmpCode) return employeeList;

    const matched = employeeList.filter((emp) => {
      if (currentEmpId && (String(emp.id) === String(currentEmpId) || String(emp.empId) === String(currentEmpId))) {
        return true;
      }
      if (currentEmpCode && (String(emp.empCode).toUpperCase() === String(currentEmpCode).toUpperCase())) {
        return true;
      }
      return false;
    });

    return matched.length > 0 ? matched : employeeList;
  }, [employeeList, perms.manager, perms.additional1, perms.isAdmin, user]);

  // Add Attendance Modal State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormSaving, setAddFormSaving] = useState(false);
  const [addFormData, setAddFormData] = useState({
    empId: null,
    employee: null,
    shiftId: null,
    shift: null,
    attendanceDate: getLocalDateString(),
    inTime: '',
    outTime: '',
    attType: 'Present',
    remarks: '',
    fromWhere: 'MANUAL'
  });

  // Edit Attendance Modal State (Double-Click Edit)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormSaving, setEditFormSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    empId: null,
    empCode: '',
    empName: '',
    department: '',
    shiftId: null,
    shift: null,
    attendanceDate: getLocalDateString(),
    inTime: '',
    outTime: '',
    attType: 'Present',
    remarks: '',
    fromWhere: 'MANUAL'
  });

  // ── Bulk Import & Re-Import Dialog State ────────────────────────────────
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importStats, setImportStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Mass Batch UI Editing State ─────────────────────────────────────────
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [massInTime, setMassInTime] = useState('09:00');
  const [massOutTime, setMassOutTime] = useState('18:00');
  const [massAttType, setMassAttType] = useState('Present');
  const [massRemarks, setMassRemarks] = useState('Mass Correction Entry');
  const [applyingMassUpdate, setApplyingMassUpdate] = useState(false);

  // ── Template Download Handler ─────────────────────────────────────────────
  const handleDownloadTemplate = useCallback(() => {
    try {
      const templateData = modalEmployeeOptions.map((emp) => ({
        'Employee Code': emp.oldEmpCode || emp.empCode || '',
        'Employee Name': emp.employeeName || '',
        'Attendance Date (YYYY-MM-DD)': selectedDate,
        'In Time (HH:mm)': '09:00',
        'Out Time (HH:mm)': '18:00',
        'Attendance Type': 'Present',
        'Remarks': 'Regular Punch'
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 18 }, { wch: 26 }, { wch: 24 },
        { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 30 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Template');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Attendance_Import_Template_${selectedDate}.xlsx`);

      dispatch(
        openSnackbar({
          open: true,
          message: 'Attendance template downloaded with pre-filled employee codes!',
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );
    } catch (err) {
      console.error('Error generating Excel template:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to download template: ' + err.message,
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    }
  }, [modalEmployeeOptions, selectedDate, dispatch]);

  // ── Open / Close Bulk Import Dialog ──────────────────────────────────────
  const handleOpenImportDialog = () => {
    setImportRows([]);
    setImportStats({ total: 0, valid: 0, invalid: 0 });
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    if (isUploading) return;
    setImportDialogOpen(false);
    setImportRows([]);
  };

  // ── Parse Excel / CSV File ────────────────────────────────────────────────
  const handleParseExcelFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Selected Excel file is empty.');
        }

        const empMapByCode = {};
        modalEmployeeOptions.forEach((emp) => {
          if (emp.oldEmpCode) {
            empMapByCode[String(emp.oldEmpCode).trim().toUpperCase()] = emp;
          }
          if (emp.empCode) {
            empMapByCode[String(emp.empCode).trim().toUpperCase()] = emp;
          }
        });

        let validCount = 0;
        let invalidCount = 0;

        const parsed = rawRows.map((row, index) => {
          const empCodeRaw = String(
            row['Employee Code'] || row['Emp Code'] || row['EMP_CODE'] || row['EmpCode'] || row['empCode'] || ''
          ).trim();
          const empNameRaw = String(row['Employee Name'] || row['Emp Name'] || row['EMP_NAME'] || '').trim();
          const attDateRaw = String(
            row['Attendance Date (YYYY-MM-DD)'] || row['Attendance Date'] || row['Date'] || selectedDate
          ).trim();
          const inTimeRaw = String(row['In Time (HH:mm)'] || row['In Time'] || row['InTime'] || '').trim();
          const outTimeRaw = String(row['Out Time (HH:mm)'] || row['Out Time'] || row['OutTime'] || '').trim();
          const attTypeRaw = String(row['Attendance Type'] || row['Type'] || row['Status'] || 'Present').trim();
          const remarksRaw = String(row['Remarks'] || row['Remark'] || 'Bulk Excel Import').trim();

          const matchedEmp = empMapByCode[empCodeRaw.toUpperCase()];
          const errors = [];

          if (!empCodeRaw) {
            errors.push('Missing Employee Code');
          } else if (!matchedEmp) {
            errors.push(`Employee "${empCodeRaw}" not found`);
          }

          const timeFormatRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
          if (inTimeRaw && !timeFormatRegex.test(inTimeRaw)) {
            errors.push('Invalid In Time (HH:mm expected)');
          }
          if (outTimeRaw && !timeFormatRegex.test(outTimeRaw)) {
            errors.push('Invalid Out Time (HH:mm expected)');
          }

          const isValid = errors.length === 0;
          if (isValid) validCount++;
          else invalidCount++;

          const shiftObj = matchedEmp?.shift || shiftList[0];
          const calculated = calculateMetrics({
            inTime: inTimeRaw,
            outTime: outTimeRaw,
            shiftStartTime: shiftObj?.startTime || '09:00',
            shiftEndTime: shiftObj?.endTime || '18:00',
            attType: attTypeRaw || 'Present',
            otEligible: matchedEmp?.otToggle || matchedEmp?.otEligible || 'NO'
          });

          return {
            _idx: index + 1,
            empId: matchedEmp ? matchedEmp.id : null,
            empCode: empCodeRaw,
            empName: matchedEmp ? matchedEmp.employeeName : empNameRaw || 'Unknown',
            attendanceDate: attDateRaw || selectedDate,
            shiftId: shiftObj ? shiftObj.id : null,
            inTime: inTimeRaw,
            outTime: outTimeRaw,
            attType: calculated.attType,
            duration: calculated.duration,
            lom: calculated.lom,
            earlyOut: calculated.earlyOut,
            ot: calculated.ot,
            remarks: remarksRaw,
            isValid,
            errors: errors.join(', ')
          };
        });

        setImportRows(parsed);
        setImportStats({ total: parsed.length, valid: validCount, invalid: invalidCount });

        dispatch(
          openSnackbar({
            open: true,
            message: `Excel file parsed successfully! ${validCount} valid records, ${invalidCount} warnings/errors.`,
            variant: 'alert',
            alert: { color: validCount > 0 ? 'success' : 'error' },
            close: false
          })
        );
      } catch (err) {
        console.error('Error parsing file:', err);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Error reading file: ' + err.message,
            variant: 'alert',
            alert: { color: 'error' },
            close: false
          })
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ── Submit Bulk Import / Re-Import ───────────────────────────────────────
  const handleBatchSubmitImport = async () => {
    const validRows = importRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'No valid records to import.',
          variant: 'alert',
          alert: { color: 'warning' },
          close: false
        })
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const payload = validRows.map((r) => ({
        empId: r.empId,
        empCode: r.empCode,
        shiftId: r.shiftId,
        attendanceDate: r.attendanceDate,
        inTime: r.inTime || null,
        outTime: r.outTime || null,
        attType: r.attType,
        remarks: r.remarks,
        fromWhere: 'MANUAL'
      }));

      setUploadProgress(50);
      await axios.post('/api/hr/attendance-daily-log/save-bulk', payload);

      setUploadProgress(100);
      dispatch(
        openSnackbar({
          open: true,
          message: `Bulk import completed! Saved/Updated ${validRows.length} attendance records.`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      handleCloseImportDialog();
      fetchAttendance();
    } catch (err) {
      console.error('Failed to submit bulk import:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Bulk import failed: ' + (err.response?.data?.message || err.message),
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ── Mass Batch Update Selected UI Rows ──────────────────────────────────
  const handleApplyMassUpdate = async () => {
    if (!rowSelectionModel || rowSelectionModel.length === 0) return;

    setApplyingMassUpdate(true);
    try {
      const selectedIdSet = new Set(rowSelectionModel.map(String));

      const updatedPayload = filteredRows
        .filter((r) => selectedIdSet.has(String(r.id ?? r._idx)))
        .map((r) => ({
          empId: r.empId,
          empCode: r.empCode,
          shiftId: r.shiftId,
          attendanceDate: selectedDate,
          inTime: massInTime || null,
          outTime: massOutTime || null,
          attType: massAttType,
          remarks: massRemarks || 'Mass Correction',
          fromWhere: 'MANUAL'
        }));

      await axios.post('/api/hr/attendance-daily-log/save-bulk', updatedPayload);

      dispatch(
        openSnackbar({
          open: true,
          message: `Mass update applied to ${updatedPayload.length} selected records!`,
          variant: 'alert',
          alert: { color: 'success' },
          close: false
        })
      );

      setRowSelectionModel([]);
      fetchAttendance();
    } catch (err) {
      console.error('Failed mass update:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Mass update failed: ' + (err.response?.data?.message || err.message),
          variant: 'alert',
          alert: { color: 'error' },
          close: false
        })
      );
    } finally {
      setApplyingMassUpdate(false);
    }
  };

  // ── Register Global Filter Configuration in Top Bar ───────────────────────
  useEffect(() => {
    dispatch(
      setFilterConfig([
        {
          id: 'attendanceDate',
          label: 'Attendance Date',
          type: 'date',
          defaultValue: selectedDate,
          isStarred: true
        },
        {
          id: 'unitName',
          label: 'Unit Name',
          type: 'select',
          options: [
            { value: 'ALL', label: 'ALL' },
            ...lookupDivisions.map((d) => ({
              value: d.divisionName || d.name || String(d.id),
              label: d.divisionName || d.name
            }))
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'category',
          label: 'Category',
          type: 'select',
          options: [
            { value: 'ALL', label: 'All' },
            ...lookupCategories.map((c) => ({
              value: c.categoryName || c.name || String(c.id),
              label: c.categoryName || c.name
            }))
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'department',
          label: 'Department',
          type: 'select',
          options: [
            { value: 'ALL', label: 'ALL' },
            ...lookupDepartments.map((d) => ({
              value: d.departmentName || d.name || String(d.id),
              label: d.departmentName || d.name
            }))
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'designation',
          label: 'Designation',
          type: 'select',
          options: [
            { value: 'ALL', label: 'ALL' },
            ...lookupDesignations.map((d) => ({
              value: d.designationName || d.name || String(d.id),
              label: d.designationName || d.name
            }))
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'empId',
          label: 'Employee Name',
          type: 'select',
          options: [
            { value: 'ALL', label: 'ALL' },
            ...lookupEmployees.map((e) => ({
              value: String(e.id || e.empCode),
              label: `${e.empCode ? e.empCode + ' - ' : ''}${e.employeeName || e.empName || ''}`
            }))
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'attType',
          label: 'Attendance Type',
          type: 'select',
          options: [
            { value: 'ALL', label: 'All Types' },
            { value: 'Present', label: 'Present' },
            { value: 'Absent', label: 'Absent' },
            { value: 'SP', label: 'Special Permission (SP)' },
            { value: 'SL', label: 'Sick Leave (SL)' },
            { value: 'EL', label: 'Earned Leave (EL)' },
            { value: 'WO', label: 'Weekly Off (WO)' },
            { value: 'Holiday', label: 'Holiday' }
          ],
          defaultValue: 'ALL',
          isStarred: true
        },
        {
          id: 'fromWhere',
          label: 'Source',
          type: 'select',
          options: [
            { value: 'ALL', label: 'All Sources' },
            { value: 'ESSL', label: 'ESSL (Biometric)' },
            { value: 'MANUAL', label: 'Manual' },
            { value: 'OD', label: 'Official Duty (OD)' }
          ],
          defaultValue: 'ALL',
          isStarred: true
        }
      ])
    );

    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, lookupDepKey, lookupDesKey, lookupDivKey, lookupCatKey, lookupEmpKey, selectedDate]);

  // Sync Top Global Filter Date with local state
  useEffect(() => {
    const gDate = globalFilters.attendanceDate || globalFilters.fromDate || globalFilters.date;
    if (gDate && gDate !== selectedDate) {
      setSelectedDate(gDate);
    }
  }, [globalFilters.attendanceDate, globalFilters.fromDate, globalFilters.date, selectedDate]);

  // Handle Date picker change from UI or Header
  const handleDateChange = useCallback((val) => {
    if (!val) return;
    const dateStr = safeFormatDateStr(val);
    if (!dateStr) return;
    setSelectedDate(dateStr);
    dispatch(setFilters({ attendanceDate: dateStr, fromDate: dateStr, toDate: dateStr }));
  }, [dispatch]);

  // ── Fetch Master Data (Employees, Active Shifts & OT Preferences) ─────────
  useEffect(() => {
    axios.get('/api/master/hr/employees')
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
        setEmployeeList(list);
      })
      .catch(() => setEmployeeList([]));

    axios.get('/api/hr/shift-master/active')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setShiftList(data);
      })
      .catch(() => {
        axios.get('/api/hr/shift-master')
          .then((res) => setShiftList(Array.isArray(res.data) ? res.data : []))
          .catch(() => setShiftList([]));
      });

    axios.get('/api/preferences/all')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const otPref = list.find((p) => p.prefName === 'OT_MIN_MINUTES');
        if (otPref && otPref.prefValue) {
          const val = parseInt(otPref.prefValue, 10);
          if (!isNaN(val) && val > 0) {
            setOtMinMinutes(val);
          }
        }
      })
      .catch(() => setOtMinMinutes(30));
  }, []);

  // ── Fetch attendance for selected date ──────────────────────────────────
  const fetchAttendance = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/attendance-daily-log/by-date', {
        params: { date: selectedDate }
      });
      const data = (response.data || []).map((row, idx) => ({
        ...row,
        _idx: idx + 1,
        attType: sanitizeAttType(row.attType),
        inTime: formatTime(row.inTime),
        outTime: formatTime(row.outTime),
        _original: {
          inTime: formatTime(row.inTime),
          outTime: formatTime(row.outTime)
        }
      }));
      setRows(data);
      setModifiedRows(new Set());
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to load attendance data',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, dispatch]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Helper to resolve allocated master shift for selected employee ─────────
  const resolveEmployeeShift = useCallback(
    async (emp) => {
      if (!emp || !shiftList || shiftList.length === 0) return null;

      // 1. Check existing row in currently loaded attendance table
      const existingRow = rows.find(
        (r) => (r.empId && String(r.empId) === String(emp.id)) || (r.empCode && r.empCode === emp.empCode)
      );

      let empShiftId = emp.shiftId || emp.operations?.shiftId || existingRow?.shiftId;
      let rawEmpShift = (
        emp.shiftName ||
        emp.operations?.shiftName ||
        existingRow?.shiftName ||
        existingRow?.shiftCode ||
        ''
      )
        .toString()
        .trim();

      // If rawEmpShift is empty or "Yes" (boolean flag), fallback to checking shift property if not "Yes"
      if (!rawEmpShift || rawEmpShift.toUpperCase() === 'YES') {
        if (emp.shift && emp.shift.toUpperCase() !== 'YES') {
          rawEmpShift = emp.shift.toString().trim();
        }
      }

      // 2. If no shift info available on emp object or existingRow, fetch full employee details
      if (!empShiftId && (!rawEmpShift || rawEmpShift.toUpperCase() === 'YES') && emp.id) {
        try {
          const empRes = await axios.get(`/api/master/hr/employees/${emp.id}`);
          const fullEmp = empRes.data;
          if (fullEmp) {
            empShiftId = fullEmp.shiftId || fullEmp.operations?.shiftId;
            const fullShiftName = (fullEmp.shiftName || fullEmp.operations?.shiftName || '').toString().trim();
            if (fullShiftName && fullShiftName.toUpperCase() !== 'YES') {
              rawEmpShift = fullShiftName;
            }
          }
        } catch (e) {
          console.warn('Could not fetch full employee details for shift matching:', e);
        }
      }

      // Match by Shift ID
      if (empShiftId) {
        const matchById = shiftList.find((s) => String(s.id) === String(empShiftId));
        if (matchById) return matchById;
      }

      const empShiftUpper = rawEmpShift.toUpperCase();

      if (empShiftUpper && empShiftUpper !== 'YES') {
        // Exact match by shiftName or shiftCode
        let match = shiftList.find(
          (s) =>
            (s.shiftName || '').toString().trim().toUpperCase() === empShiftUpper ||
            (s.shiftCode || '').toString().trim().toUpperCase() === empShiftUpper
        );
        if (match) return match;

        // Partial / includes match (e.g. "GENERAL" vs "GENERAL SHIFT")
        match = shiftList.find((s) => {
          const sName = (s.shiftName || '').toString().trim().toUpperCase();
          const sCode = (s.shiftCode || '').toString().trim().toUpperCase();
          return (
            (sName && (sName.includes(empShiftUpper) || empShiftUpper.includes(sName))) ||
            (sCode && (sCode.includes(empShiftUpper) || empShiftUpper.includes(sCode)))
          );
        });
        if (match) return match;
      }

      // Fallback: GENERAL shift or first active shift
      const generalShift = shiftList.find(
        (s) =>
          (s.shiftName || '').toUpperCase().includes('GENERAL') ||
          (s.shiftCode || '').toUpperCase().includes('GEN')
      );
      return generalShift || shiftList[0] || null;
    },
    [rows, shiftList]
  );

  const previewMetrics = useMemo(() => {
    if (!addFormData.shift || !addFormData.inTime || !addFormData.outTime) {
      return { duration: 0, lom: 0, earlyOut: 0, ot: 0 };
    }
    return calculateMetrics(
      {
        shiftStartTime: addFormData.shift.startTime,
        shiftEndTime: addFormData.shift.endTime,
        graceMinutes: addFormData.shift.graceMinutes || 0,
        inTime: addFormData.inTime,
        outTime: addFormData.outTime
      },
      otMinMinutes
    );
  }, [addFormData.shift, addFormData.inTime, addFormData.outTime, otMinMinutes]);

  const editPreviewMetrics = useMemo(() => {
    if (!editFormData.shift || !editFormData.inTime || !editFormData.outTime) {
      return { duration: 0, lom: 0, earlyOut: 0, ot: 0 };
    }
    return calculateMetrics(
      {
        shiftStartTime: editFormData.shift.startTime,
        shiftEndTime: editFormData.shift.endTime,
        graceMinutes: editFormData.shift.graceMinutes || 0,
        inTime: editFormData.inTime,
        outTime: editFormData.outTime
      },
      otMinMinutes
    );
  }, [editFormData.shift, editFormData.inTime, editFormData.outTime, otMinMinutes]);

  // ── Open / Close Add Dialog ──────────────────────────────────────────────
  const handleOpenAddDialog = useCallback(async () => {
    if (isDateReadOnly) {
      dispatch(
        openSnackbar({
          open: true,
          message: perms.manager || perms.additional1 || perms.isAdmin
            ? 'Manager / Admin access permits attendance entries anytime.'
            : 'Normal user access permits attendance entries for Today only.',
          variant: 'alert',
          alert: { color: 'warning' }
        })
      );
      return;
    }

    const isElevatedUser = perms.manager || perms.additional1 || perms.isAdmin;
    let initialEmp = null;
    let initialEmpId = null;
    let initialShift = null;
    let initialShiftId = null;
    let initialInTime = '';
    let initialOutTime = '';
    let initialOtEligible = 'NO';

    if (!isElevatedUser && modalEmployeeOptions.length > 0) {
      initialEmp = modalEmployeeOptions[0];
      initialEmpId = initialEmp.id;
      initialOtEligible = initialEmp.otToggle || initialEmp.otEligible || 'NO';
      const matchedShift = await resolveEmployeeShift(initialEmp);
      if (matchedShift) {
        initialShift = matchedShift;
        initialShiftId = matchedShift.id;
        initialInTime = matchedShift.startTime || '';
        initialOutTime = matchedShift.endTime || '';
      }
    }

    setAddFormData({
      empId: initialEmpId,
      employee: initialEmp,
      shiftId: initialShiftId,
      shift: initialShift,
      attendanceDate: selectedDate,
      inTime: initialInTime,
      outTime: initialOutTime,
      attType: 'Present',
      remarks: '',
      fromWhere: 'MANUAL',
      otEligible: initialOtEligible
    });
    setAddDialogOpen(true);
  }, [selectedDate, isDateReadOnly, perms.manager, perms.additional1, perms.isAdmin, modalEmployeeOptions, resolveEmployeeShift, dispatch]);

  const handleCloseAddDialog = useCallback(() => {
    setAddDialogOpen(false);
  }, []);

  // Save new manual entry
  const handleSaveNewEntry = async () => {
    if (!addFormData.empId) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select an employee.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }
    if (!addFormData.attendanceDate) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select an attendance date.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }
    if (addFormData.attendanceDate > todayStr) {
      dispatch(openSnackbar({
        open: true,
        message: 'Future attendance dates are not allowed.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }
    if (minAllowedDate && addFormData.attendanceDate < minAllowedDate) {
      dispatch(openSnackbar({
        open: true,
        message: perms.manager
          ? 'Manager access permits attendance entries up to 3 days in the past only.'
          : 'Normal user access permits attendance entries for Today only.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }
    if (addFormData.fromWhere === 'MANUAL' && (!addFormData.remarks || !addFormData.remarks.trim())) {
      dispatch(openSnackbar({
        open: true,
        message: 'Remarks are mandatory for manual entries. Please provide a reason.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    setAddFormSaving(true);
    try {
      const payload = {
        empId: addFormData.empId,
        shiftId: addFormData.shiftId || null,
        attendanceDate: addFormData.attendanceDate,
        inTime: addFormData.inTime || null,
        outTime: addFormData.outTime || null,
        attType: addFormData.attType || 'Present',
        remarks: addFormData.remarks || null,
        fromWhere: addFormData.fromWhere || 'MANUAL'
      };

      await axios.post('/api/hr/attendance-daily-log/save', payload);

      dispatch(openSnackbar({
        open: true,
        message: `Successfully saved attendance entry for ${addFormData.employee?.employeeName || addFormData.employee?.empCode || 'employee'}`,
        variant: 'alert',
        alert: { color: 'success' }
      }));

      setAddDialogOpen(false);
      fetchAttendance();
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to save attendance entry.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setAddFormSaving(false);
    }
  };

  // ── Handle Double Click Row Edit ──────────────────────────────────────────
  const handleOpenEditDialog = useCallback((row) => {
    if (!row) return;

    if (isDateReadOnly) {
      dispatch(
        openSnackbar({
          open: true,
          message: perms.manager || perms.additional1 || perms.isAdmin
            ? 'Manager / Admin access permits editing any entry.'
            : 'Normal employee access permits editing attendance for Today only. Past data cannot be edited.',
          variant: 'alert',
          alert: { color: 'warning' }
        })
      );
      return;
    }

    if (!perms.write) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'You do not have write permission to edit attendance records.',
          variant: 'alert',
          alert: { color: 'warning' }
        })
      );
      return;
    }

    const currentShift = shiftList.find((s) => String(s.id) === String(row.shiftId)) ||
      shiftList.find((s) => (s.shiftCode || '').toUpperCase() === (row.shiftCode || row.shiftName || '').toUpperCase()) || null;

    setEditFormData({
      id: row.id || null,
      empId: row.empId,
      empCode: row.empCode || '',
      empName: row.empName || '',
      department: row.department || '',
      shiftId: row.shiftId || (currentShift ? currentShift.id : null),
      shift: currentShift,
      attendanceDate: row.attendanceDate || selectedDate,
      inTime: row.inTime || '',
      outTime: row.outTime || '',
      attType: row.attType || 'Present',
      remarks: row.remarks || '',
      fromWhere: row.fromWhere || 'MANUAL'
    });

    setEditDialogOpen(true);
  }, [isDateReadOnly, perms.write, perms.manager, perms.additional1, perms.isAdmin, shiftList, selectedDate, dispatch]);

  const handleSaveEditDialog = async () => {
    if (isDateReadOnly) {
      dispatch(openSnackbar({ open: true, message: 'Editing is restricted for past dates for your user role.', variant: 'alert', alert: { color: 'error' } }));
      return;
    }
    if (editFormData.fromWhere === 'MANUAL' && (!editFormData.remarks || !editFormData.remarks.trim())) {
      dispatch(openSnackbar({ open: true, message: 'Remarks are mandatory for manual entries. Please provide a reason.', variant: 'alert', alert: { color: 'error' } }));
      return;
    }

    setEditFormSaving(true);
    try {
      const payload = {
        id: editFormData.id || null,
        empId: editFormData.empId,
        shiftId: editFormData.shiftId || null,
        attendanceDate: editFormData.attendanceDate || selectedDate,
        inTime: editFormData.inTime || null,
        outTime: editFormData.outTime || null,
        attType: editFormData.attType || 'Present',
        remarks: editFormData.remarks || null,
        fromWhere: editFormData.fromWhere || 'MANUAL'
      };

      await axios.post('/api/hr/attendance-daily-log/save', payload);

      dispatch(openSnackbar({
        open: true,
        message: `Successfully updated attendance entry for ${editFormData.empName || editFormData.empCode}`,
        variant: 'alert',
        alert: { color: 'success' }
      }));

      setEditDialogOpen(false);
      fetchAttendance();
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to update attendance entry.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setEditFormSaving(false);
    }
  };

  // ── Handle cell edit ────────────────────────────────────────────────────
  const handleCellEdit = useCallback((rowId, field, value) => {
    if (isDateReadOnly) {
      dispatch(openSnackbar({
        open: true,
        message: perms.manager
          ? 'Manager access permits modifying attendance up to 3 days in the past only.'
          : 'Normal user access permits modifying attendance for Today only.',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }
    setRows((prev) =>
      prev.map((row) => {
        if ((row.id ?? row._idx) !== rowId) return row;

        const updated = { ...row, [field]: value };

        // If in/out time was changed, recalculate metrics & mark as MANUAL
        if (field === 'inTime' || field === 'outTime') {
          const wasOriginalIn = row._original?.inTime;
          const wasOriginalOut = row._original?.outTime;
          const nowIn = field === 'inTime' ? value : row.inTime;
          const nowOut = field === 'outTime' ? value : row.outTime;

          if (nowIn !== wasOriginalIn || nowOut !== wasOriginalOut) {
            updated.fromWhere = 'MANUAL';
          }

          // Recalculate
          const recalculated = calculateMetrics(
            {
              ...updated,
              inTime: nowIn,
              outTime: nowOut
            },
            otMinMinutes
          );
          Object.assign(updated, recalculated);
        }

        return updated;
      })
    );

    setModifiedRows((prev) => new Set(prev).add(rowId));
  }, [otMinMinutes]);

  // ── Save single row ────────────────────────────────────────────────────
  const handleSaveRow = useCallback(async (row) => {
    // Validate mandatory remarks for MANUAL entries
    if (row.fromWhere === 'MANUAL' && (!row.remarks || !row.remarks.trim())) {
      dispatch(openSnackbar({
        open: true,
        message: 'Remarks are mandatory for manual entries. Please provide a reason.',
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    const rowKey = row.id ?? row._idx;
    setSavingRowId(rowKey);
    try {
      const payload = {
        id: row.id || null,
        empId: row.empId,
        shiftId: row.shiftId,
        attendanceDate: selectedDate,
        inTime: row.inTime || null,
        outTime: row.outTime || null,
        attType: row.attType || 'Absent',
        remarks: row.remarks || null,
        fromWhere: row.fromWhere || 'MANUAL'
      };

      const response = await axios.post('/api/hr/attendance-daily-log/save', payload);

      // Update the row with saved data
      setRows((prev) =>
        prev.map((r) => {
          if ((r.id ?? r._idx) !== rowKey) return r;
          return {
            ...r,
            ...response.data,
            _idx: r._idx,
            inTime: formatTime(response.data.inTime),
            outTime: formatTime(response.data.outTime),
            _original: {
              inTime: formatTime(response.data.inTime),
              outTime: formatTime(response.data.outTime)
            }
          };
        })
      );

      setModifiedRows((prev) => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });

      dispatch(openSnackbar({
        open: true,
        message: `Saved attendance for ${row.empName}`,
        variant: 'alert',
        alert: { color: 'success' }
      }));
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Failed to save',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSavingRowId(null);
    }
  }, [selectedDate, dispatch]);

  // ── Save all modified rows ──────────────────────────────────────────────
  const handleSaveAll = useCallback(async () => {
    const modifiedEntries = rows.filter((r) => modifiedRows.has(r.id ?? r._idx));
    if (modifiedEntries.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'No modified entries to save.',
        variant: 'alert',
        alert: { color: 'warning' }
      }));
      return;
    }

    // Validate remarks for all manual entries
    const invalid = modifiedEntries.filter(
      (r) => r.fromWhere === 'MANUAL' && (!r.remarks || !r.remarks.trim())
    );
    if (invalid.length > 0) {
      dispatch(openSnackbar({
        open: true,
        message: `${invalid.length} manual entries are missing remarks. Please fill in remarks before saving.`,
        variant: 'alert',
        alert: { color: 'error' }
      }));
      return;
    }

    setSaving(true);
    try {
      const payload = modifiedEntries.map((r) => ({
        id: r.id || null,
        empId: r.empId,
        shiftId: r.shiftId,
        attendanceDate: selectedDate,
        inTime: r.inTime || null,
        outTime: r.outTime || null,
        attType: r.attType || 'Absent',
        remarks: r.remarks || null,
        fromWhere: r.fromWhere || 'MANUAL'
      }));

      await axios.post('/api/hr/attendance-daily-log/save-bulk', payload);

      dispatch(openSnackbar({
        open: true,
        message: `Successfully saved ${modifiedEntries.length} entries.`,
        variant: 'alert',
        alert: { color: 'success' }
      }));

      // Refresh
      fetchAttendance();
    } catch (err) {
      dispatch(openSnackbar({
        open: true,
        message: err?.response?.data?.message || 'Bulk save failed',
        variant: 'alert',
        alert: { color: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  }, [rows, modifiedRows, selectedDate, dispatch, fetchAttendance]);

  // ── Column definitions ──────────────────────────────────────────────────
  const columns = useMemo(() => [
    {
      id: 'index',
      label: 'S.No',
      field: '_idx',
      headerName: 'S.No',
      width: 60,
      sortable: false,
      align: 'center',
      headerAlign: 'center'
    },
    {
      id: 'empCode',
      label: 'Emp Code',
      field: 'empCode',
      headerName: 'Emp Code',
      width: 100,
      sortable: true
    },
    {
      id: 'empName',
      label: 'Employee Name',
      field: 'empName',
      headerName: 'Employee Name',
      width: 180,
      sortable: true
    },
    {
      id: 'department',
      label: 'Department',
      field: 'department',
      headerName: 'Department',
      width: 130,
      sortable: true
    },
    {
      id: 'shiftName',
      label: 'Shift',
      field: 'shiftName',
      headerName: 'Shift',
      width: 100,
      sortable: true
    },
    {
      id: 'shiftStartTime',
      label: 'Shift Start',
      field: 'shiftStartTime',
      headerName: 'Shift Start',
      width: 90,
      align: 'center',
      headerAlign: 'center'
    },
    {
      id: 'shiftEndTime',
      label: 'Shift End',
      field: 'shiftEndTime',
      headerName: 'Shift End',
      width: 90,
      align: 'center',
      headerAlign: 'center'
    },
    {
      id: 'inTime',
      label: 'In Time',
      field: 'inTime',
      headerName: 'In Time',
      width: 120,
      editable: perms.write,
      align: 'center',
      headerAlign: 'center',
      renderEditCell: (params) => (
        <BOSTimePicker
          value={params.value || ''}
          onChange={(val) => {
            const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
            params.api.setEditCellValue({ id: params.id, field: params.field, value: timeVal });
          }}
          fullWidth
        />
      )
    },
    {
      id: 'outTime',
      label: 'Out Time',
      field: 'outTime',
      headerName: 'Out Time',
      width: 120,
      editable: perms.write,
      align: 'center',
      headerAlign: 'center',
      renderEditCell: (params) => (
        <BOSTimePicker
          value={params.value || ''}
          onChange={(val) => {
            const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
            params.api.setEditCellValue({ id: params.id, field: params.field, value: timeVal });
          }}
          fullWidth
        />
      )
    },
    {
      id: 'duration',
      label: 'Duration',
      field: 'duration',
      headerName: 'Duration',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: (value) => value != null ? `${value} min` : '0 min'
    },
    {
      id: 'lom',
      label: 'LOM',
      field: 'lom',
      headerName: 'LOM',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ color: params.value > 0 ? 'error.main' : 'text.secondary', fontWeight: params.value > 0 ? 600 : 400 }}
        >
          {params.value || 0}
        </Typography>
      )
    },
    {
      id: 'earlyOut',
      label: 'Early Out',
      field: 'earlyOut',
      headerName: 'Early Out',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ color: params.value > 0 ? 'warning.dark' : 'text.secondary', fontWeight: params.value > 0 ? 600 : 400 }}
        >
          {params.value || 0}
        </Typography>
      )
    },
    {
      id: 'ot',
      label: 'OT',
      field: 'ot',
      headerName: 'OT',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{ color: params.value > 0 ? 'success.main' : 'text.secondary', fontWeight: params.value > 0 ? 600 : 400 }}
        >
          {params.value || 0}
        </Typography>
      )
    },
    {
      id: 'attType',
      label: 'Att Type',
      field: 'attType',
      headerName: 'Att Type',
      width: 110,
      editable: perms.write,
      renderCell: (params) => (
        <BOSStatusChip
          label={sanitizeAttType(params.value)}
          color={ATT_TYPE_COLORS[sanitizeAttType(params.value)] || 'default'}
          size="small"
        />
      ),
      renderEditCell: (params) => (
        <TextField
          select
          size="small"
          variant="standard"
          value={params.value || 'Absent'}
          onChange={(e) => {
            params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value });
          }}
          sx={{ width: '100%' }}
        >
          {ATT_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>
      )
    },
    {
      id: 'remarks',
      label: 'Remarks',
      field: 'remarks',
      headerName: 'Remarks',
      width: 180,
      editable: perms.write,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params, rowObj) => {
        const val = (typeof params === 'object' && params !== null && 'value' in params) ? params.value : params;
        const row = (typeof params === 'object' && params !== null && params.row) ? params.row : (rowObj || {});
        const isMandatory = row.fromWhere === 'MANUAL' && (!val || !val.trim());
        return (
          <Typography
            variant="body2"
            sx={{
              color: isMandatory ? 'error.main' : 'text.primary',
              fontStyle: isMandatory ? 'italic' : 'normal',
              textAlign: 'center',
              width: '100%'
            }}
          >
            {val || (isMandatory ? '⚠ Required' : '')}
          </Typography>
        );
      },
      renderEditCell: (params) => (
        <TextField
          select
          size="small"
          variant="standard"
          value={params.value || ''}
          onChange={(e) => {
            params.api.setEditCellValue({ id: params.id, field: params.field, value: e.target.value });
          }}
          sx={{ width: '100%' }}
        >
          <MenuItem value="">
            <em>-- Select --</em>
          </MenuItem>
          {REMARKS_OPTIONS.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </TextField>
      )
    },
    {
      field: 'fromWhere',
      headerName: 'Source',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Chip
          label={params.value || 'MANUAL'}
          color={SOURCE_COLORS[params.value] || 'default'}
          size="small"
          variant="outlined"
        />
      )
    }
  ], []);

  // ── Process cell edit commit ────────────────────────────────────────────
  const processRowUpdate = useCallback((newRow, oldRow) => {
    const rowKey = newRow.id ?? newRow._idx;
    const changedFields = Object.keys(newRow).filter(
      (key) => !key.startsWith('_') && newRow[key] !== oldRow[key]
    );

    if (changedFields.length === 0) return newRow;

    changedFields.forEach((field) => {
      handleCellEdit(rowKey, field, newRow[field]);
    });

    return newRow;
  }, [handleCellEdit]);

  // ── Filtered Rows using Global Text Search & Global Filters ──────────────
  const filteredRows = useMemo(() => {
    const queryLower = globalQuery.toLowerCase().trim();
    const filterAttType = globalFilters.attType;
    const filterSource = globalFilters.fromWhere;
    const filterUnit = globalFilters.unitName || globalFilters.division;
    const filterCategory = globalFilters.category;
    const filterDept = globalFilters.department;
    const filterDesig = globalFilters.designation;
    const filterEmp = globalFilters.empId || globalFilters.employeeName;

    return rows.filter((row) => {
      // 1. Text Search Query filter
      if (queryLower) {
        const rowSearchText = [
          row.empCode,
          row.empName,
          row.department,
          row.designation,
          row.unitName,
          row.category,
          row.shiftName,
          row.attType,
          row.remarks,
          row.fromWhere,
          row.inTime,
          row.outTime
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!rowSearchText.includes(queryLower)) return false;
      }

      // 2. Unit / Division filter
      if (filterUnit && filterUnit !== 'ALL') {
        const u = (row.unitName || row.divisionName || row.division || '').toString().toLowerCase();
        if (!u.includes(filterUnit.toString().toLowerCase())) return false;
      }

      // 3. Category filter
      if (filterCategory && filterCategory !== 'ALL') {
        const c = (row.category || row.categoryName || '').toString().toLowerCase();
        if (!c.includes(filterCategory.toString().toLowerCase())) return false;
      }

      // 4. Department filter
      if (filterDept && filterDept !== 'ALL') {
        const d = (row.department || row.departmentName || '').toString().toLowerCase();
        if (!d.includes(filterDept.toString().toLowerCase())) return false;
      }

      // 5. Designation filter
      if (filterDesig && filterDesig !== 'ALL') {
        const des = (row.designation || row.designationName || '').toString().toLowerCase();
        if (!des.includes(filterDesig.toString().toLowerCase())) return false;
      }

      // 6. Employee filter
      if (filterEmp && filterEmp !== 'ALL') {
        const empMatch =
          String(row.empId) === String(filterEmp) ||
          String(row.empCode).toLowerCase() === String(filterEmp).toLowerCase() ||
          (row.empName && row.empName.toLowerCase().includes(String(filterEmp).toLowerCase()));
        if (!empMatch) return false;
      }

      // 7. Attendance Type filter
      if (filterAttType && filterAttType !== 'ALL') {
        if (row.attType !== filterAttType) return false;
      }

      // 8. Source filter
      if (filterSource && filterSource !== 'ALL') {
        if ((row.fromWhere || 'MANUAL') !== filterSource) return false;
      }

      return true;
    });
  }, [rows, globalQuery, globalFilters]);

  // ── Row styling ─────────────────────────────────────────────────────────
  const getRowClassName = useCallback((params) => {
    const attType = params.row?.attType;
    if (attType === 'Absent') return 'att-row-absent';
    if (attType === 'SP') return 'att-row-sp';
    if (attType === 'Present') return 'att-row-present';
    return '';
  }, []);

  // ── Export data ─────────────────────────────────────────────────────────
  const exportColumns = useMemo(() => [
    { field: 'empCode', headerName: 'Emp Code' },
    { field: 'empName', headerName: 'Employee Name' },
    { field: 'department', headerName: 'Department' },
    { field: 'shiftName', headerName: 'Shift' },
    { field: 'shiftStartTime', headerName: 'Shift Start' },
    { field: 'shiftEndTime', headerName: 'Shift End' },
    { field: 'inTime', headerName: 'In Time' },
    { field: 'outTime', headerName: 'Out Time' },
    { field: 'duration', headerName: 'Duration (min)' },
    { field: 'lom', headerName: 'LOM (min)' },
    { field: 'earlyOut', headerName: 'Early Out (min)' },
    { field: 'ot', headerName: 'OT (min)' },
    { field: 'attType', headerName: 'Att Type' },
    { field: 'remarks', headerName: 'Remarks' },
    { field: 'fromWhere', headerName: 'Source' }
  ], []);

  // ── Summary stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const present = filteredRows.filter((r) => r.attType === 'Present').length;
    const absent = filteredRows.filter((r) => r.attType === 'Absent').length;
    const sp = filteredRows.filter((r) => r.attType === 'SP').length;
    const onLeave = filteredRows.filter((r) => r.attType === 'SL' || r.attType === 'EL').length;
    return { total, present, absent, sp, onLeave };
  }, [filteredRows]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconClipboardCheck size={22} />
          <Typography variant="h4">Attendance Entry</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<IconDownload size={16} />}
            onClick={handleDownloadTemplate}
            sx={{
              ...btnExport,
              borderRadius: '20px',
              height: 38,
              px: 2,
              fontWeight: 700
            }}
          >
            Download Template
          </Button>
          {perms.write && (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<IconUpload size={16} />}
              onClick={handleOpenImportDialog}
              disabled={isDateReadOnly}
              sx={{
                ...btnSave,
                bgcolor: 'secondary.main',
                '&:hover': { bgcolor: 'secondary.dark', transform: 'translateY(-1px)', boxShadow: 4 },
                height: 38,
                borderRadius: '20px',
                px: 2,
                fontWeight: 700
              }}
            >
              Bulk Import / Re-Import
            </Button>
          )}
          <BOSTableToolbar
            onRefresh={fetchAttendance}
            onNew={perms.write ? handleOpenAddDialog : undefined}
            newLabel="+ Add"
            newTooltip="Add Manual Attendance Entry"
            hasWritePermission={perms.write && !isDateReadOnly}
            exportData={perms.export ? filteredRows : null}
            exportColumns={exportColumns}
            exportFilename={`Attendance_Entry_${selectedDate}`}
            hasExportPermission={perms.export}
          />
        </Stack>
      }
    >
      {/* Read-Only Date Lock Alert Banner */}
      {isDateReadOnly && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px', fontWeight: 600 }}>
          Read-Only View: Your user access level permits modifying attendance records up to {perms.manager ? '3 days in the past' : 'Today only'}. Attendance for {selectedDate} is locked for editing.
        </Alert>
      )}

      {/* Mass Batch UI Correction Bar (when rows are selected) */}
      {rowSelectionModel.length > 0 && perms.write && !isDateReadOnly && (
        <Paper
          elevation={2}
          sx={{
            p: 1.5,
            mb: 2,
            background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
            color: '#fff',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconEdit size={20} />
            <Typography variant="subtitle1" fontWeight={700} color="inherit">
              Mass Batch Correction ({rowSelectionModel.length} selected)
            </Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 'auto' }}>
            <TextField
              label="In Time"
              type="time"
              size="small"
              value={massInTime}
              onChange={(e) => setMassInTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#fff', borderRadius: 1, width: 120 }}
            />
            <TextField
              label="Out Time"
              type="time"
              size="small"
              value={massOutTime}
              onChange={(e) => setMassOutTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#fff', borderRadius: 1, width: 120 }}
            />
            <TextField
              select
              label="Att Type"
              size="small"
              value={massAttType}
              onChange={(e) => setMassAttType(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 1, width: 130 }}
            >
              {ATT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Remarks"
              size="small"
              value={massRemarks}
              onChange={(e) => setMassRemarks(e.target.value)}
              sx={{ bgcolor: '#fff', borderRadius: 1, width: 180 }}
            />

            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={applyingMassUpdate ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={16} />}
              onClick={handleApplyMassUpdate}
              disabled={applyingMassUpdate}
              sx={{ height: 40, fontWeight: 700 }}
            >
              {applyingMassUpdate ? 'Saving...' : 'Apply Mass Update'}
            </Button>
            <IconButton
              size="small"
              onClick={() => setRowSelectionModel([])}
              sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <IconX size={18} />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Summary Bar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Chip label={`Total: ${stats.total}`} variant="outlined" size="small" />
        <Chip label={`Present: ${stats.present}`} color="success" variant="outlined" size="small" />
        <Chip label={`Absent: ${stats.absent}`} color="error" variant="outlined" size="small" />
        <Chip label={`SP: ${stats.sp}`} color="warning" variant="outlined" size="small" />
        <Chip label={`Leave: ${stats.onLeave}`} color="info" variant="outlined" size="small" />
        {filteredRows.length !== rows.length && (
          <Chip label={`Filtered: ${filteredRows.length} / ${rows.length}`} color="primary" size="small" />
        )}
        {modifiedRows.size > 0 && (
          <Alert severity="info" sx={{ py: 0, px: 1 }} icon={false}>
            <Typography variant="caption">{modifiedRows.size} unsaved changes</Typography>
          </Alert>
        )}
      </Stack>

      {/* Data Table */}
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        loading={loading}
        getRowId={(row) => row.id ?? row._idx}
        processRowUpdate={processRowUpdate}
        getRowClassName={getRowClassName}
        density="compact"
        disableRowSelectionOnClick
        onDoubleClickRow={(row) => handleOpenEditDialog(row)}
        checkboxSelection={perms.write && !isDateReadOnly}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
        sx={{
          '& .att-row-absent': {
            backgroundColor: 'rgba(244, 67, 54, 0.04)',
            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
          },
          '& .att-row-sp': {
            backgroundColor: 'rgba(255, 152, 0, 0.04)',
            '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.08)' }
          },
          '& .att-row-present': {
            backgroundColor: 'rgba(76, 175, 80, 0.02)',
            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.06)' }
          },
          minHeight: 400
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 50 } }
        }}
        pageSizeOptions={[25, 50, 100]}
      />

      {/* Add Attendance Entry Modal Dialog */}
      <BOSFormDialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        title="Add Manual Attendance Entry"
        onSave={handleSaveNewEntry}
        saveButtonLabel="Save"
      >
        <BOSFormSection title="Employee & Shift Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSEmployeeAutocomplete
              label="Select Employee"
              options={modalEmployeeOptions}
              value={addFormData.employee}
              onChange={async (arg1, arg2) => {
                const val = arg2 !== undefined ? arg2 : arg1;
                if (!val) {
                  setAddFormData((prev) => ({
                    ...prev,
                    employee: null,
                    empId: null,
                    shift: null,
                    shiftId: null,
                    inTime: '',
                    outTime: ''
                  }));
                  return;
                }

                // 1. Set selected employee & OT eligibility in form state
                const empOt = val.otToggle || val.otEligible || 'NO';
                setAddFormData((prev) => ({
                  ...prev,
                  employee: val,
                  empId: val.id,
                  otEligible: empOt
                }));

                // 2. Resolve employee master shift
                const matchedShift = await resolveEmployeeShift(val);

                // 3. Update shift & timings from resolved shift
                setAddFormData((prev) => ({
                  ...prev,
                  shift: matchedShift,
                  shiftId: matchedShift ? matchedShift.id : null,
                  inTime: matchedShift?.startTime || '',
                  outTime: matchedShift?.endTime || ''
                }));
              }}
              size="small"
              required
            />

            <BOSDatePicker
              label="Attendance Date"
              value={addFormData.attendanceDate}
              minDate={minAllowedDate ? new Date(minAllowedDate) : undefined}
              maxDate={new Date()}
              onChange={(val) => {
                const dateStr = safeFormatDateStr(val);
                if (dateStr) {
                  setAddFormData((prev) => ({ ...prev, attendanceDate: dateStr }));
                }
              }}
              size="small"
              required
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSAutocomplete
              label="Shift"
              options={shiftList}
              getOptionLabel={getShiftOptionLabel}
              value={addFormData.shift}
              disabled={!addFormData.employee}
              onChange={(arg1, arg2) => {
                const val = arg2 !== undefined ? arg2 : arg1;
                setAddFormData((prev) => ({
                  ...prev,
                  shift: val,
                  shiftId: val ? val.id : null,
                  inTime: val?.startTime || '',
                  outTime: val?.endTime || ''
                }));
              }}
              size="small"
            />

            <TextField
              select
              label="Attendance Type"
              required
              size="small"
              value={addFormData.attType}
              onChange={(e) => setAddFormData((prev) => ({ ...prev, attType: e.target.value }))}
              fullWidth
            >
              {ATT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          </Box>
        </BOSFormSection>

        <BOSFormSection title="Attendance Timing & Calculations">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSTimePicker
              label="In Time"
              name="inTime"
              value={addFormData.inTime || ''}
              onChange={(val) => {
                const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
                setAddFormData((prev) => ({ ...prev, inTime: timeVal }));
              }}
              fullWidth
            />

            <BOSTimePicker
              label="Out Time"
              name="outTime"
              value={addFormData.outTime || ''}
              onChange={(val) => {
                const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
                setAddFormData((prev) => ({ ...prev, outTime: timeVal }));
              }}
              fullWidth
            />
          </Box>

          {/* Metric calculation preview badges */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`Duration: ${previewMetrics.duration || 0} min`} size="small" variant="outlined" />
            <Chip label={`LOM: ${previewMetrics.lom || 0} min`} size="small" color={previewMetrics.lom > 0 ? 'error' : 'default'} />
            <Chip label={`Early Out: ${previewMetrics.earlyOut || 0} min`} size="small" color={previewMetrics.earlyOut > 0 ? 'warning' : 'default'} />
            <Chip label={`OT: ${previewMetrics.ot || 0} min`} size="small" color={previewMetrics.ot > 0 ? 'success' : 'default'} />
          </Stack>

          <BOSTextField
            label="Remarks"
            value={addFormData.remarks}
            onChange={(e) => setAddFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="e.g. Forgot Punch Out, Manual Correction, Official Duty"
            multiline
            rows={2}
            required
            fullWidth
          />
        </BOSFormSection>
      </BOSFormDialog>

      {/* Edit Attendance Modal Dialog (Triggered on Double-Click) */}
      <BOSFormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={`Edit Attendance - ${editFormData.empCode} ${editFormData.empName}`}
        onSave={handleSaveEditDialog}
        saving={editFormSaving}
        isEdit={true}
        saveText="Update Entry"
        maxWidth="md"
      >
        <BOSFormSection title="Employee & Shift Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSTextField
              label="Employee Code"
              value={editFormData.empCode}
              disabled
              size="small"
            />
            <BOSTextField
              label="Employee Name"
              value={editFormData.empName}
              disabled
              size="small"
            />
            <BOSTextField
              label="Department"
              value={editFormData.department}
              disabled
              size="small"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSAutocomplete
              label="Shift"
              options={shiftList}
              getOptionLabel={getShiftOptionLabel}
              value={editFormData.shift}
              onChange={(arg1, arg2) => {
                const val = arg2 !== undefined ? arg2 : arg1;
                setEditFormData((prev) => ({
                  ...prev,
                  shift: val,
                  shiftId: val ? val.id : null,
                  inTime: prev.inTime || val?.startTime || '',
                  outTime: prev.outTime || val?.endTime || ''
                }));
              }}
              size="small"
            />

            <TextField
              select
              label="Attendance Type"
              required
              size="small"
              value={editFormData.attType}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, attType: e.target.value }))}
              fullWidth
            >
              {ATT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          </Box>
        </BOSFormSection>

        <BOSFormSection title="Attendance Timing & Calculations">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
            <BOSTimePicker
              label="In Time"
              name="inTime"
              value={editFormData.inTime || ''}
              onChange={(val) => {
                const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
                setEditFormData((prev) => ({ ...prev, inTime: timeVal }));
              }}
              fullWidth
            />

            <BOSTimePicker
              label="Out Time"
              name="outTime"
              value={editFormData.outTime || ''}
              onChange={(val) => {
                const timeVal = typeof val === 'string' ? val : val?.target?.value || val;
                setEditFormData((prev) => ({ ...prev, outTime: timeVal }));
              }}
              fullWidth
            />
          </Box>

          {/* Metric calculation preview badges */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1, flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`Duration: ${editPreviewMetrics.duration || 0} min`} size="small" variant="outlined" />
            <Chip label={`LOM: ${editPreviewMetrics.lom || 0} min`} size="small" color={editPreviewMetrics.lom > 0 ? 'error' : 'default'} />
            <Chip label={`Early Out: ${editPreviewMetrics.earlyOut || 0} min`} size="small" color={editPreviewMetrics.earlyOut > 0 ? 'warning' : 'default'} />
            <Chip label={`OT: ${editPreviewMetrics.ot || 0} min`} size="small" color={editPreviewMetrics.ot > 0 ? 'success' : 'default'} />
          </Stack>

          <BOSTextField
            label="Remarks *"
            value={editFormData.remarks}
            onChange={(e) => setEditFormData((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="e.g. Forgot Punch Out, Manual Correction, Official Duty"
            multiline
            rows={2}
            required
            fullWidth
          />
        </BOSFormSection>
      </BOSFormDialog>

      {/* Bulk Attendance Import & Mass Correction Modal Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconFileImport size={24} color="#1e88e5" />
            <Typography variant="h3">Bulk Attendance Import & Mass Correction</Typography>
          </Stack>
          <IconButton onClick={handleCloseImportDialog} disabled={isUploading}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Top Instructions & Drag/Drop Upload Area */}
          <Box
            sx={{
              p: 3,
              mb: 3,
              border: '2px dashed #1e88e5',
              borderRadius: 2,
              bgcolor: 'rgba(30, 136, 229, 0.03)',
              textAlign: 'center'
            }}
          >
            <IconUpload size={40} color="#1e88e5" style={{ marginBottom: 8 }} />
            <Typography variant="h4" gutterBottom>
              Upload Attendance Excel / CSV File (.xlsx, .xls, .csv)
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Upload 3,600+ daily attendance records or corrected files. Existing records for the same employee and date will be updated automatically (UPSERT).
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                component="label"
                color="primary"
                startIcon={<IconUpload size={18} />}
                disabled={isUploading}
                sx={{ ...btnSave, bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-1px)', boxShadow: 4 }, height: 40, px: 3 }}
              >
                Select Excel File
                <input
                  type="file"
                  hidden
                  accept=".xlsx, .xls, .csv"
                  onChange={handleParseExcelFile}
                />
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<IconDownload size={18} />}
                onClick={handleDownloadTemplate}
                sx={{ ...btnExport, borderRadius: '20px', height: 40, px: 3, fontWeight: 700 }}
              >
                Download Pre-Filled Template
              </Button>
            </Stack>
          </Box>

          {/* Progress bar during batch save */}
          {isUploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Uploading & batch saving attendance records...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Statistics summary chips */}
          {importRows.length > 0 && (
            <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
              <Chip label={`Total Parsed: ${importStats.total}`} variant="outlined" />
              <Chip label={`Valid Records: ${importStats.valid}`} color="success" />
              {importStats.invalid > 0 && (
                <Chip label={`Invalid / Warnings: ${importStats.invalid}`} color="error" />
              )}
            </Stack>
          )}

          {/* Parsed Rows Preview Grid */}
          {importRows.length > 0 && (
            <Box sx={{ height: 380, width: '100%' }}>
              <BOSDataTable
                rows={importRows}
                getRowId={(r) => r._idx}
                columns={[
                  { id: '_idx', label: '#', field: '_idx', headerName: '#', width: 60 },
                  {
                    id: 'isValid',
                    label: 'Status',
                    field: 'isValid',
                    headerName: 'Status',
                    width: 110,
                    renderCell: (params, row) =>
                      (params.value ?? row?.isValid) ? (
                        <Chip label="Valid" color="success" size="small" />
                      ) : (
                        <Chip label="Error" color="error" size="small" />
                      )
                  },
                  { id: 'empCode', label: 'Emp Code', field: 'empCode', headerName: 'Emp Code', width: 110 },
                  { id: 'empName', label: 'Employee Name', field: 'empName', headerName: 'Employee Name', width: 160 },
                  { id: 'attendanceDate', label: 'Date', field: 'attendanceDate', headerName: 'Date', width: 110 },
                  { id: 'inTime', label: 'In Time', field: 'inTime', headerName: 'In Time', width: 90 },
                  { id: 'outTime', label: 'Out Time', field: 'outTime', headerName: 'Out Time', width: 90 },
                  { id: 'attType', label: 'Type', field: 'attType', headerName: 'Type', width: 100 },
                  { id: 'duration', label: 'Duration', field: 'duration', headerName: 'Duration', width: 90 },
                  { id: 'lom', label: 'LOM', field: 'lom', headerName: 'LOM', width: 80 },
                  { id: 'earlyOut', label: 'Early Out', field: 'earlyOut', headerName: 'Early Out', width: 90 },
                  { id: 'ot', label: 'OT', field: 'ot', headerName: 'OT', width: 80 },
                  { id: 'remarks', label: 'Remarks', field: 'remarks', headerName: 'Remarks', width: 180 },
                  {
                    id: 'errors',
                    label: 'Validation Notes',
                    field: 'errors',
                    headerName: 'Validation Notes',
                    width: 220,
                    renderCell: (params, row) => {
                      const errList = params.value || row?.errors;
                      return errList && errList.length > 0 ? (
                        <Typography variant="caption" color="error">
                          {Array.isArray(errList) ? errList.join(', ') : String(errList)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="success.main">
                          Ready for UPSERT
                        </Typography>
                      );
                    }
                  }
                ]}
                density="compact"
                pageSizeOptions={[25, 50, 100]}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseImportDialog} color="inherit" disabled={isUploading} sx={btnCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleBatchSubmitImport}
            disabled={isUploading || importStats.valid === 0}
            startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={18} />}
            sx={{ ...btnSave, height: 40, px: 3 }}
          >
            {isUploading ? 'Saving Batch...' : `Submit Batch (${importStats.valid} records)`}
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}

