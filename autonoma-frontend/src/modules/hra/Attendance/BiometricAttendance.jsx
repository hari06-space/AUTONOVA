import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Stack,
  Button,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Box,
  Chip,
  Paper,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Radio,
  Switch,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import {
  IconClock,
  IconRefresh,
  IconCloudDownload,
  IconChartBar,
  IconFileSpreadsheet,
  IconFileText,
  IconMapPin,
  IconPhoto
} from '@tabler/icons-react';
import axios from 'utils/axios';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig, setFilters } from 'store/slices/search';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSTextField,
  BOSFormSection,
  BOSAutocomplete,
  BOSDatePicker,
  BOSTimePicker,
  BOSStatusChip,
  BOSExportButton,
  getCommonDateFilters,
  matchCommonDateFilters,
  btnNew
, errorStyle} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useLookups } from 'hooks/useLookups';
import useConfig from 'hooks/useConfig';
import { formatDate } from 'utils/BOSTimeUtils';

const getLocalDateString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().substring(0, 10);
};

const INITIAL_STATE = {
  employeeId: '',
  attendanceDate: new Date().toISOString().substring(0, 10),
  punchIn: '',
  punchOut: '',
  status: 'PRESENT',
  remarks: '',
  shiftId: '',
  isActive: true
};


const VALIDATION_RULES = [
  { field: 'employeeId', label: 'Employee Name', required: true },
  { field: 'attendanceDate', label: 'Attendance Date', required: true },
  { field: 'status', label: 'Status', required: true }
];

// Status chip color mapping
const STATUS_COLORS = {
  PRESENT: { bg: '#e8f5e9', color: '#2e7d32', label: 'Present' },
  HALF_DAY: { bg: '#fff3e0', color: '#e65100', label: 'Half Day' },
  HD: { bg: '#fff3e0', color: '#e65100', label: 'Half Day' },
  ABSENT: { bg: '#ffebee', color: '#c62828', label: 'Absent' },
  WO: { bg: '#e0f7fa', color: '#006064', label: 'Week Off' },
  CL: { bg: '#e8f5e9', color: '#2e7d32', label: 'Casual Leave' },
  SL: { bg: '#fff3e0', color: '#e65100', label: 'Sick Leave' },
  HL: { bg: '#f3e5f5', color: '#7b1fa2', label: 'Holiday' },
  LOP: { bg: '#ffebee', color: '#c62828', label: 'Loss of Pay' },
  MIS: { bg: '#fffde7', color: '#f57f17', label: 'Missing Punch' },
  OD: { bg: '#e0f2f1', color: '#004d40', label: 'On Duty' },
  SP: { bg: '#ede7f6', color: '#5e35b1', label: 'Special Permission' }
};

// Source badge colors
const SOURCE_COLORS = {
  ESSL: { bg: '#e3f2fd', color: '#1565c0', label: 'eSSL' },
  MANUAL: { bg: '#f3e5f5', color: '#7b1fa2', label: 'Manual' }
};
/** Default gross salary when employee salary data is not available */
const DEFAULT_GROSS_SALARY = 0.0;

/** Standard monthly working days used for per-day salary calculations */
const MONTHLY_WORKING_DAYS = 30;

const getShiftDisplay = (row, shiftsList) => {
  const shift = row.shift || (shiftsList && shiftsList.find(s => s.id === row.shiftId || String(s.id) === String(row.shiftId)));
  if (shift) {
    return `${shift.shiftName} (${shift.startTime} - ${shift.endTime})`;
  }
  return row.shiftName || '-';
};

export default function BiometricAttendance() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const { dateFormat } = useConfig();

  const [dbMonths, setDbMonths] = useState([]);

  // Daily View State
  const [rows, setRows] = useState([]);

  // Canteen Logs State
  const [canteenRows, setCanteenRows] = useState([]);
  const [canteenLoading, setCanteenLoading] = useState(false);
  const [syncingCanteen, setSyncingCanteen] = useState(false);

  // Photo Viewer State
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Dashboard Cohorts State
  const [selectedCohortType, setSelectedCohortType] = useState('anomaly');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);

  // Delete & Restore State
  const [deletedLogs, setDeletedLogs] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const searchQuery = useSelector((state) => state.search?.query || '');
  const globalFilters = useSelector((state) => state.search?.filters) || {};
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currentYearStr = String(new Date().getFullYear());

  const processMonth = useMemo(() => {
    if (globalFilters.month) return globalFilters.month;
    const currentMonthUpper = currentMonthName.toUpperCase();
    return dbMonths.find(m => m.toUpperCase() === currentMonthUpper) || (dbMonths.length > 0 ? dbMonths[dbMonths.length - 1] : currentMonthName);
  }, [globalFilters.month, dbMonths, currentMonthName]);
  const processYear = globalFilters.year || currentYearStr;



  // Monthly Process State
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [monthlyProcessRows, setMonthlyProcessRows] = useState([]);
  const [monthlyProcessLoading, setMonthlyProcessLoading] = useState(false);

  // Sync Modal State
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncMode, setSyncMode] = useState('month'); // 'month' or 'date'
  const [syncFromDate, setSyncFromDate] = useState('');
  const [syncToDate, setSyncToDate] = useState('');
  const [syncMonth, setSyncMonth] = useState('');
  const [syncYear, setSyncYear] = useState('');

  useEffect(() => {
    const fetchDbMonths = async () => {
      try {
        const response = await axios.get('/api/master/hr/payroll/months?type=REGULAR');
        if (response.data && Array.isArray(response.data)) {
          setDbMonths(response.data.map(m => m.monthName));
        }
      } catch (error) {
        console.error('Failed to fetch months from master:', error);
      }
    };
    fetchDbMonths();
  }, []);

  // Shift Timing Details Modal State
  const [shiftTimingDialogOpen, setShiftTimingDialogOpen] = useState(false);

  const handleExportExcel = () => {
    const dataToExport = activeTab === 0 ? filteredDailyRows : monthlyProcessRows;
    if (dataToExport.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'No data available to export.', variant: 'alert', severity: 'warning' }));
      return;
    }

    import('xlsx').then((XLSX) => {
      let sheetData = [];
      let filename = '';

      if (activeTab === 0) {
        filename = `Daily_Attendance_${processMonth}_${processYear}.xlsx`;
        sheetData = dataToExport.map((row, idx) => ({
          '#': idx + 1,
          'Emp Id': row.empCode || '-',
          'Emp Name': row.employeeName || '-',
          'Date': row.attendanceDate ? formatDate(row.attendanceDate, dateFormat) : '',
          'Shift Name': row.shift?.shiftName || row.shiftName || '-',
          'In-Time': row.punchIn || '-',
          'Out-Time': row.punchOut || '-',
          'Late(Mins)': row.isLate && row.punchIn ? row.lateMins || 0 : 0,
          'Working Hrs': row.totalHoursWorked ? (parseFloat(row.totalHoursWorked) / 60).toFixed(2) : '0.00',
          'OT Hrs': row.overtimeHours ? (parseFloat(row.overtimeHours) / 60).toFixed(2) : '0.00',
          'Wage Type': 'Monthly',
          'OT Eligible': (row.employee?.otToggle || 'NO').toUpperCase(),
          'Attendance Status': row.status || '-',
          'Status': row.isActive !== false ? 'Active' : 'Inactive'
        }));
      } else {
        filename = `Monthly_Attendance_${processMonth}_${processYear}.xlsx`;
        const monthAbbr = processMonth.substring(0, 3);
        const daysInMonth = new Date(parseInt(processYear, 10), ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].findIndex(m => m.toUpperCase() === processMonth.toUpperCase()) + 1, 0).getDate();
 
        sheetData = dataToExport.map((row) => {
          const item = {
            '#': row.index,
            'Emp Id': row.empCode || '-',
            'Emp Name': row.empName || '-'
          };
          for (let day = 1; day <= daysInMonth; day++) {
            const dayKey = `${monthAbbr} ${day}`;
            item[dayKey] = row[dayKey] || '-';
          }
          item['Late(Mins)'] = row.lateMins || 0;
          item['Total Hrs'] = row.totalWoHrs ? (parseFloat(row.totalWoHrs) / 60).toFixed(2) : '0.00';
          item['OT Hrs'] = row.otHrs ? (parseFloat(row.otHrs) / 60).toFixed(2) : '0.00';
          item['No Of Absent'] = row.noOfAbsent || 0;
          item['Zero Wo Hrs'] = row.zeroWoHrs || 0;
          return item;
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, filename);
    });
  };

  const handleExportPdf = () => {
    const dataToExport = activeTab === 0 ? filteredDailyRows : monthlyProcessRows;
    if (dataToExport.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'No data available to export.', variant: 'alert', severity: 'warning' }));
      return;
    }

    import('html2pdf.js').then((html2pdfDefault) => {
      const html2pdf = html2pdfDefault.default || html2pdfDefault;
      let filename = activeTab === 0 
        ? `Daily_Attendance_${processMonth}_${processYear}.pdf`
        : `Monthly_Attendance_${processMonth}_${processYear}.pdf`;

      let htmlString = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="text-align: center; margin-bottom: 5px;">Autonova ERP - Attendance Report</h2>
          <h4 style="text-align: center; color: #666; margin-top: 0; margin-bottom: 25px;">
            ${activeTab === 0 ? 'Daily Logs' : 'Monthly Summary'} - ${processMonth} ${processYear}
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
      `;

      if (activeTab === 0) {
        htmlString += `
          <th style="border: 1px solid #ddd; padding: 6px;">#</th>
          <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Emp Id</th>
          <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Emp Name</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Date</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Shift</th>
          <th style="border: 1px solid #ddd; padding: 6px;">In-Time</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Out-Time</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Late Hrs</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Working Hrs</th>
          <th style="border: 1px solid #ddd; padding: 6px;">OT Hrs</th>
          <th style="border: 1px solid #ddd; padding: 6px;">Status</th>
        </tr>
      </thead>
      <tbody>
        `;
        dataToExport.forEach((row, idx) => {
          // Calculate/fetch late minutes
          let lateMinsVal = 0;
          if (row.isLate && row.punchIn) {
             try {
                 const clean = row.punchIn.replace(/[^0-9:]/g, '');
                 const parts = clean.split(':');
                 if (parts.length >= 2) {
                    let hrs = parseInt(parts[0], 10);
                    let mins = parseInt(parts[1], 10);
                    if (row.punchIn.toUpperCase().includes('PM') && hrs < 12) hrs += 12;
                    if (row.punchIn.toUpperCase().includes('AM') && hrs === 12) hrs = 0;
                    const totalMins = hrs * 60 + mins;
                    const shiftStartMins = 9 * 60; // 9:00 AM
                    if (totalMins > shiftStartMins) lateMinsVal = totalMins - shiftStartMins;
                 }
             } catch (err) {}
          }
          const lateHrsVal = Math.round(lateMinsVal / 60);

          htmlString += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #ddd; padding: 5px;">${row.empCode || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 5px; font-weight: bold;">${row.employeeName || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.attendanceDate ? formatDate(row.attendanceDate, dateFormat) : ''}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${getShiftDisplay(row, shifts)}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.punchIn || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.punchOut || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${lateHrsVal}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.totalHoursWorked ? Math.round(parseFloat(row.totalHoursWorked) / 60) : 0}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.overtimeHours ? Math.round(parseFloat(row.overtimeHours) / 60) : 0}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align: center;">${row.status || '-'}</td>
            </tr>
          `;
        });
      } else {
        const monthAbbr = processMonth.substring(0, 3);
        const daysInMonth = new Date(parseInt(processYear, 10), ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].findIndex(m => m.toUpperCase() === processMonth.toUpperCase()) + 1, 0).getDate();

        htmlString += `
          <th style="border: 1px solid #ddd; padding: 5px;">#</th>
          <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">Emp Id</th>
          <th style="border: 1px solid #ddd; padding: 5px; text-align: left;">Emp Name</th>
        `;
        for (let d = 1; d <= daysInMonth; d++) {
          htmlString += `<th style="border: 1px solid #ddd; padding: 2px; text-align: center; min-width: 15px;">${d}</th>`;
        }
        htmlString += `
          <th style="border: 1px solid #ddd; padding: 5px;">Late Hrs</th>
          <th style="border: 1px solid #ddd; padding: 5px;">Total Hrs</th>
          <th style="border: 1px solid #ddd; padding: 5px;">OT Hrs</th>
          <th style="border: 1px solid #ddd; padding: 5px;">Absent</th>
          <th style="border: 1px solid #ddd; padding: 5px;">Zero Hrs</th>
        </tr>
      </thead>
      <tbody>
        `;
        dataToExport.forEach((row) => {
          htmlString += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.index}</td>
              <td style="border: 1px solid #ddd; padding: 4px;">${row.empCode || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 4px; font-weight: bold;">${row.empName || '-'}</td>
          `;
          for (let d = 1; d <= daysInMonth; d++) {
            const val = row[`${monthAbbr} ${d}`] || '-';
            htmlString += `<td style="border: 1px solid #ddd; padding: 2px; text-align: center; font-size: 8px;">${val}</td>`;
          }
          htmlString += `
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.lateMins ? Math.round(parseFloat(row.lateMins) / 60) : 0}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.totalWoHrs ? Math.round(parseFloat(row.totalWoHrs) / 60) : 0}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.otHrs ? Math.round(parseFloat(row.otHrs) / 60) : 0}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.noOfAbsent || 0}</td>
              <td style="border: 1px solid #ddd; padding: 4px; text-align: center;">${row.zeroWoHrs || 0}</td>
            </tr>
          `;
        });
      }

      htmlString += `
            </tbody>
          </table>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: activeTab === 0 ? 'portrait' : 'landscape' }
      };

      html2pdf().set(opt).from(htmlString).save();
    });
  };



  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.HRA_BIOMETRIC_ATTENDANCE);

  // Lookups
  const { employees = [] } = useLookups(['EMPLOYEES']);
  const [shifts, setShifts] = useState([]);

  // Register search/filter config
  useEffect(() => {
    const monthOptions = dbMonths.length > 0
      ? dbMonths.map(m => ({ value: m, label: m }))
      : [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ].map(m => ({ value: m, label: m }));

    const currentMonthUpper = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const defaultMonth = dbMonths.find(m => m.toUpperCase() === currentMonthUpper) || (dbMonths.length > 0 ? dbMonths[dbMonths.length - 1] : new Date().toLocaleString('en-US', { month: 'long' }));

    const filterConfig = [
      {
        id: 'month',
        label: 'Month',
        type: 'select',
        options: monthOptions,
        defaultValue: defaultMonth,
        isStarred: true
      },
      {
        id: 'year',
        label: 'Year',
        type: 'select',
        options: Array.from({ length: 2100 - 1990 + 1 }, (_, i) => 1990 + i).map(year => ({
          value: String(year),
          label: String(year)
        })),
        defaultValue: String(new Date().getFullYear()),
        isStarred: true
      },
      {
        id: 'shiftId',
        label: 'Shift',
        type: 'select',
        options: [
          { value: 'All', label: 'ALL SHIFTS' },
          ...shifts.map(s => ({ value: String(s.id), label: s.shiftName?.toUpperCase() }))
        ],
        defaultValue: 'All',
        isStarred: true
      },
      {
        id: 'createdDate',
        label: 'Created Date',
        type: 'dateRange',
        defaultValueConsider: 'No',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(filterConfig));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, shifts, dbMonths]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await axios.get('/api/hr/shift-master/active');
        setShifts(response.data || []);
      } catch (error) {
        console.error('Failed to fetch active shifts:', error);
      }
    };
    fetchShifts();
  }, []);



  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/biometric-attendance', {
        params: {
          month: processMonth,
          year: processYear
        }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch biometric logs:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Biometric Attendance logs.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, processMonth, processYear]);

  // Run fetchRows once when mounted or when processMonth/processYear actually changes
  useEffect(() => {
    if (processMonth && processYear) {
      fetchRows();
    }
  }, [processMonth, processYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setIsReadOnly(false);
    setDialogOpen(true);
  };

  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleOpenEdit = (row) => {
    setErrors({});
    setIsReadOnly(row.esslInTime != null || row.esslOutTime != null);
    setFormData({
      id: row.id,
      employeeId: row.employeeId,
      attendanceDate: row.attendanceDate ? new Date(row.attendanceDate).toISOString().substring(0, 10) : '',
      punchIn: row.punchIn || '',
      punchOut: row.punchOut || '',
      status: row.status || 'PRESENT',
      remarks: row.remarks || '',
      shiftId: row.shiftId || '',
      isLate: row.isLate || false,
      isEarlyExit: row.isEarlyExit || false,
      isActive: row.isActive !== false
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) {
      return;
    }

    try {
      await axios.post('/api/hr/biometric-attendance', formData);
      dispatch(
        openSnackbar({
          open: true,
          message: `Biometric log ${formData.id ? 'updated' : 'saved'} successfully.`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save biometric log.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.employeeName || (row.employee?.employeeName) || 'N/A');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    if (!deleteTargetId) return;

    const logToDelete = rows.find((r) => r.id === deleteTargetId);

    try {
      await axios.delete(`/api/hr/biometric-attendance/${deleteTargetId}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Biometric Attendance log deleted successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      if (logToDelete) {
        setDeletedLogs((prev) => [logToDelete, ...prev]);
      }
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to delete biometric log.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleRestore = async (logItem) => {
    try {
      const restoreData = {
        employeeId: logItem.employeeId,
        attendanceDate: logItem.attendanceDate ? new Date(logItem.attendanceDate).toISOString().substring(0, 10) : '',
        punchIn: logItem.punchIn || '',
        punchOut: logItem.punchOut || '',
        status: logItem.status || 'PRESENT',
        remarks: logItem.remarks || 'Restored',
        shiftId: logItem.shiftId || '',
        isLate: logItem.isLate || false,
        isEarlyExit: logItem.isEarlyExit || false,
        isActive: logItem.isActive !== false
      };
      await axios.post('/api/hr/biometric-attendance', restoreData);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Biometric Attendance log restored successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDeletedLogs((prev) => prev.filter((item) => item.id !== logItem.id));
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to restore biometric log.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  const handleCalculate = async () => {
    setProcessing(true);
    try {
      const response = await axios.post('/api/hr/biometric-attendance/calculate', null, {
        params: {
          month: processMonth,
          year: parseInt(processYear, 10)
        }
      });
      dispatch(
        openSnackbar({
          open: true,
          message: `${response.data.message} (${response.data.processedRecords} records processed)`,
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to calculate attendance.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncEssl = async () => {
    if (syncMode === 'month' && (!syncMonth || !syncYear)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select both month and year to import.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }
    if (syncMode === 'date' && (!syncFromDate || !syncToDate)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select both from date and to date to import.',
          variant: 'alert',
          severity: 'warning'
        })
      );
      return;
    }

    setSyncing(true);
    let monthVal = syncMonth;
    let yearVal = parseInt(syncYear, 10);

    if (syncMode === 'date' && syncFromDate) {
      const dateObj = new Date(syncFromDate);
      if (!isNaN(dateObj.getTime())) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        monthVal = monthNames[dateObj.getMonth()];
        yearVal = dateObj.getFullYear();
      }
    }

    try {
      const response = await axios.post('/api/hr/biometric-attendance/sync-essl', null, {
        params: {
          month: monthVal,
          year: yearVal
        }
      });
      
      const statusData = response.data;
      let msg = `Biometric log synchronization completed successfully! (${statusData.processedRecords || 0} processed`;
      if (statusData.skippedRecords > 0) msg += `, ${statusData.skippedRecords} skipped`;
      if (statusData.unmatchedEmployeeCodes > 0) msg += `, ${statusData.unmatchedEmployeeCodes} unmatched emp codes`;
      msg += ')';

      dispatch(
        openSnackbar({
          open: true,
          message: msg,
          variant: 'alert',
          severity: 'success'
        })
      );
      setSyncModalOpen(false);

      if (monthVal && yearVal) {
        dispatch(setFilters({ month: monthVal, year: String(yearVal) }));
      }
      fetchRows();
      if (typeof fetchMonthlyProcess === 'function') {
        fetchMonthlyProcess();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to sync from eSSL.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSyncing(false);
    }
  };

  // Fetch monthly process summary from backend
  const fetchMonthlyProcess = useCallback(async () => {
    setMonthlyProcessLoading(true);
    try {
      const response = await axios.get('/api/hr/biometric-attendance/monthly-process', {
        params: {
          month: processMonth,
          year: parseInt(processYear, 10),
          _t: new Date().getTime()
        }
      });
      setMonthlyProcessRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch monthly process:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Monthly Process data.',
          variant: 'alert',
          severity: 'error'
        })
      );
      setMonthlyProcessRows([]);
    } finally {
      setMonthlyProcessLoading(false);
    }
  }, [dispatch, processMonth, processYear]);

  // Fetch canteen logs from backend
  const fetchCanteenRows = useCallback(async () => {
    setCanteenLoading(true);
    try {
      const response = await axios.get('/api/hr/biometric-attendance/canteen-logs');
      setCanteenRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch canteen logs:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load Canteen Logs.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setCanteenLoading(false);
    }
  }, [dispatch]);

  const handleSyncCanteen = async () => {
    setSyncingCanteen(true);
    try {
      const response = await axios.post('/api/hr/biometric-attendance/sync-canteen', null, {
        params: {
          month: processMonth,
          year: parseInt(processYear, 10)
        }
      });
      dispatch(
        openSnackbar({
          open: true,
          message: `${response.data.message || 'Canteen logs synced successfully.'} (${response.data.processedRecords || 0} processed)`,
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchCanteenRows();
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to sync canteen logs.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSyncingCanteen(false);
    }
  };

  const handleViewPhoto = async (rowId) => {
    setPhotoLoading(true);
    setPhotoDialogOpen(true);
    setPreviewPhoto(null);
    try {
      const response = await axios.get(`/api/hr/biometric-attendance/photo/${rowId}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setPreviewPhoto(url);
    } catch (error) {
      console.error('Failed to load check-in photo:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'No check-in photo available or failed to load.',
          variant: 'alert',
          severity: 'error'
        })
      );
      setPhotoDialogOpen(false);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleClosePhotoDialog = () => {
    setPhotoDialogOpen(false);
    if (previewPhoto) {
      URL.revokeObjectURL(previewPhoto);
      setPreviewPhoto(null);
    }
  };

  // Fetch monthly process data when tab switches to monthly view / dashboard or changes
  // Fetch monthly process data when tab switches to monthly view / dashboard or changes
  useEffect(() => {
    if (activeTab === 1 || activeTab === 3) {
      fetchMonthlyProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, processMonth, processYear]);

  // Fetch canteen logs when tab switches to canteen
  useEffect(() => {
    if (activeTab === 2) {
      fetchCanteenRows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleToggleActive = useCallback(async (row) => {
    try {
      const updatedData = {
        id: row.id,
        employeeId: row.employeeId,
        attendanceDate: row.attendanceDate ? new Date(row.attendanceDate).toISOString().substring(0, 10) : '',
        punchIn: row.punchIn || '',
        punchOut: row.punchOut || '',
        status: row.status || 'PRESENT',
        remarks: row.remarks || '',
        shiftId: row.shiftId || '',
        isLate: row.isLate || false,
        isEarlyExit: row.isEarlyExit || false,
        isActive: row.isActive === false
      };
      await axios.post('/api/hr/biometric-attendance', updatedData);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Status updated successfully.',
          variant: 'alert',
          severity: 'success'
        })
      );
      fetchRows();
      fetchMonthlyProcess();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to update status.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  }, [dispatch, fetchRows, fetchMonthlyProcess]);

  // Table Columns for Daily View
  const columns = useMemo(
    () => [
      {
        id: 'empCode',
        label: 'Emp Id',
        minWidth: 80,
        align: 'center',
        render: (row) => row.employee?.empCode || row.empCode || '-'
      },
      {
        id: 'employeeName',
        label: 'Emp Name',
        bold: true,
        minWidth: 160,
        align: 'left',
        render: (row) => row.employee?.employeeName || row.employeeName || '-'
      },
      {
        id: 'attendanceDate',
        label: 'Date',
        minWidth: 100,
        align: 'center',
        render: (row) => (row.attendanceDate ? formatDate(row.attendanceDate, dateFormat) : '')
      },
      {
        id: 'shiftName',
        label: 'Shift Name',
        minWidth: 110,
        align: 'center',
        render: (row) => getShiftDisplay(row, shifts)
      },
      { id: 'punchIn', label: 'In-Time', minWidth: 100, align: 'center' },
      { id: 'punchOut', label: 'Out-Time', minWidth: 100, align: 'center' },
      {
        id: 'lateMins',
        label: 'Late Hrs',
        minWidth: 80,
        align: 'center',
        format: (val, row) => {
          let lateMins = 0;
          if (row.isLate && row.punchIn) {
             try {
                 const clean = row.punchIn.replace(/[^0-9:]/g, '');
                 const parts = clean.split(':');
                 if (parts.length >= 2) {
                    let hrs = parseInt(parts[0], 10);
                    let mins = parseInt(parts[1], 10);
                    if (row.punchIn.toUpperCase().includes('PM') && hrs < 12) hrs += 12;
                    if (row.punchIn.toUpperCase().includes('AM') && hrs === 12) hrs = 0;
                    const totalMins = hrs * 60 + mins;
                    const shiftStartMins = 9 * 60; // 9:00 AM
                    if (totalMins > shiftStartMins) lateMins = totalMins - shiftStartMins;
                 }
             } catch (err) {}
          }
          return Math.round(lateMins / 60);
        },
        render: (row) => {
          let lateMins = 0;
          if (row.isLate && row.punchIn) {
             try {
                 const clean = row.punchIn.replace(/[^0-9:]/g, '');
                 const parts = clean.split(':');
                 if (parts.length >= 2) {
                    let hrs = parseInt(parts[0], 10);
                    let mins = parseInt(parts[1], 10);
                    if (row.punchIn.toUpperCase().includes('PM') && hrs < 12) hrs += 12;
                    if (row.punchIn.toUpperCase().includes('AM') && hrs === 12) hrs = 0;
                    const totalMins = hrs * 60 + mins;
                    const shiftStartMins = 9 * 60; // 9:00 AM
                    if (totalMins > shiftStartMins) lateMins = totalMins - shiftStartMins;
                 }
             } catch (err) {
                 console.debug(err);
             }
          }
          const lateHrs = Math.round(lateMins / 60);
          if (lateHrs === 0) {
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                0
              </Typography>
            );
          }
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
              {lateHrs}
            </Typography>
          );
        }
      },
      {
        id: 'totalHoursWorked',
        label: 'Working Hrs',
        minWidth: 110,
        align: 'center',
        format: (val) => (val != null ? Math.round(parseFloat(val) / 60).toString() : '0'),
        render: (row) => {
          const mins = row.totalHoursWorked;
          if (mins == null || mins === undefined) return '-';
          const hrs = Math.round(parseFloat(mins) / 60);
          const color = hrs >= 8 ? '#2e7d32' : hrs >= 4 ? '#e65100' : '#c62828';
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>
              {hrs}
            </Typography>
          );
        }
      },
      {
        id: 'overtimeHours',
        label: 'OT Hrs',
        minWidth: 80,
        align: 'center',
        format: (val, row) => {
          const isOtEligible = (row.employee?.otToggle || 'NO').toUpperCase() === 'YES';
          if (!isOtEligible) return '-';
          return val != null && parseFloat(val) > 0 ? Math.round(parseFloat(val) / 60).toString() : '0';
        },
        render: (row) => {
          const isOtEligible = (row.employee?.otToggle || 'NO').toUpperCase() === 'YES';
          if (!isOtEligible) {
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                -
              </Typography>
            );
          }
          const otMins = row.overtimeHours;
          if (otMins == null || parseFloat(otMins) <= 0) return <Typography variant="body2" sx={{ color: '#9e9e9e' }}>0</Typography>;
          const otHrs = Math.round(parseFloat(otMins) / 60);
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>
              +{otHrs}
            </Typography>
          );
        }
      },
      {
        id: 'wageType',
        label: 'Wage Type',
        minWidth: 90,
        align: 'center',
        render: (row) => row.wagesType || 'Monthly'
      },
      {
        id: 'otEligible',
        label: 'OT Eligible',
        minWidth: 90,
        align: 'center',
        format: (val, row) => ((row.employee?.otToggle || 'NO').toUpperCase() === 'YES' ? 'YES' : 'NO'),
        render: (row) => {
          const isYes = (row.employee?.otToggle || 'NO').toUpperCase() === 'YES';
          return (
            <Chip
              label={isYes ? 'YES' : 'NO'}
              size="small"
              sx={{
                backgroundColor: isYes ? '#e8f5e9' : '#ffebee',
                color: isYes ? '#2e7d32' : '#c62828',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
          );
        }
      },
      {
        id: 'status',
        label: 'Attendance Status',
        minWidth: 110,
        align: 'center',
        format: (val) => {
          const statusConfig = {
            PRESENT: 'Present',
            ABSENT: 'Absent',
            HALF_DAY: 'Half Day',
            WEEK_OFF: 'Week Off',
            HOLIDAY: 'Holiday',
            SP: 'Special Permission'
          };
          return statusConfig[val] || val || '-';
        },
        render: (row) => {
          const config = STATUS_COLORS[row.status] || { bg: '#eee', color: '#666', label: row.status };
          return (
            <Chip
              label={config.label}
              size="small"
              sx={{
                backgroundColor: config.bg,
                color: config.color,
                fontWeight: 600,
                fontSize: '0.75rem',
                minWidth: 80
              }}
            />
          );
        }
      },
      {
        id: 'isActive',
        label: 'Status',
        minWidth: 140,
        align: 'center',
        format: (val, row) => (row.isActive !== false ? 'Active' : 'Inactive'),
        render: (row) => (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              if (perms.write) handleToggleActive(row);
            }}
            sx={{ display: 'inline-block', cursor: perms.write ? 'pointer' : 'default' }}
          >
            <BOSStatusChip
              status={row.isActive !== false ? 'Active' : 'Inactive'}
              showIcon={false}
              width={120}
            />
          </Box>
        )
      }
    ],
    [handleToggleActive, perms.write]
  );

  // Filter local rows for Daily tab
  const dailyRows = useMemo(() => {
    return rows.map((r, i) => ({
      ...r,
      index: i + 1,
      empCode: r.employee?.empCode || 'N/A',
      employeeName: r.employee?.employeeName || 'N/A'
    }));
  }, [rows]);

  // Filter local rows for Monthly calculation view
  const monthlyRows = useMemo(() => {
    return dailyRows.filter((r) => {
      if (!r.attendanceDate) return false;
      const parts = r.attendanceDate.split('-');
      if (parts.length < 3) return false;
      const yName = parts[0];
      const mIdx = parseInt(parts[1], 10) - 1;
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const mName = months[mIdx];
      return mName.toUpperCase() === processMonth.toUpperCase() && yName === processYear;
    });
  }, [dailyRows, processMonth, processYear]);

  // Filter local rows for Daily tab
  const filteredDailyRows = useMemo(() => {
    let filtered = dailyRows;
    if (processMonth && processYear) {
      filtered = filtered.filter((r) => {
        if (!r.attendanceDate) return false;
        const parts = r.attendanceDate.split('-');
        if (parts.length < 3) return false;
        const rYear = parts[0];
        const mIdx = parseInt(parts[1], 10) - 1;
        const months = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const rMonth = months[mIdx];
        return rMonth.toUpperCase() === processMonth.toUpperCase() && rYear === processYear;
      });
    }

    filtered = filtered.filter((r) => matchCommonDateFilters(r, globalFilters, 'createdDate', null));

    const selectedShiftId = globalFilters?.shiftId || 'All';
    if (selectedShiftId !== 'All') {
      filtered = filtered.filter((r) => String(r.shiftId) === selectedShiftId);
    }

    // Apply dynamic global filters (Emp ID, Emp Name, Status)
    if (globalFilters) {
      // 1. Employee ID / Code Filter
      const empIdFilter = globalFilters.employeeId || globalFilters.empId || globalFilters.emp_id || globalFilters.employee_id || globalFilters.empCode || globalFilters.emp_code;
      if (empIdFilter && empIdFilter !== 'All') {
        filtered = filtered.filter((r) => 
          String(r.employeeId || '').toLowerCase() === String(empIdFilter).toLowerCase() ||
          String(r.employee?.id || '').toLowerCase() === String(empIdFilter).toLowerCase() ||
          String(r.empCode || '').toLowerCase().includes(String(empIdFilter).toLowerCase()) ||
          String(r.employee?.empCode || '').toLowerCase().includes(String(empIdFilter).toLowerCase())
        );
      }

      // 2. Employee Name Filter
      const empNameFilter = globalFilters.employeeName || globalFilters.empName || globalFilters.employee_name;
      if (empNameFilter && empNameFilter !== 'All') {
        const searchStr = String(empNameFilter).toLowerCase().trim();
        filtered = filtered.filter((r) => {
          const name1 = String(r.employeeName || '').toLowerCase();
          const name2 = String(r.employee?.employeeName || '').toLowerCase();
          return name1.includes(searchStr) || name2.includes(searchStr);
        });
      }

      // 3. Status Filter (active/inactive status or attendance status)
      const statusFilter = globalFilters.status;
      if (statusFilter !== undefined && statusFilter !== null && statusFilter !== 'All' && statusFilter !== '') {
        const statusStr = String(statusFilter).toLowerCase().trim();
        if (statusStr === 'true' || statusStr === 'false') {
          const boolVal = statusStr === 'true';
          filtered = filtered.filter((r) => r.isActive === boolVal || (boolVal && r.isActive === undefined));
        } else {
          filtered = filtered.filter((r) => String(r.status || '').toLowerCase() === statusStr);
        }
      }

      // 4. Dynamic/Generic Filters (handles any other filter added via Global Filters, e.g. punchIn, shiftName, etc.)
      Object.keys(globalFilters).forEach((key) => {
        const filterVal = globalFilters[key];
        if (filterVal === undefined || filterVal === null || filterVal === 'All' || filterVal === '') return;

        // Skip keys that are already handled explicitly or are system keys
        if (['month', 'year', 'shiftId', 'createdDate', 'employeeId', 'empId', 'emp_id', 'employee_id', 'empCode', 'emp_code', 'employeeName', 'empName', 'employee_name', 'status'].includes(key)) return;

        const searchStr = String(filterVal).toLowerCase().trim();
        filtered = filtered.filter((r) => {
          // Check directly on row
          if (r[key] !== undefined && r[key] !== null) {
            return String(r[key]).toLowerCase().includes(searchStr);
          }
          // Special fallback case for shiftName
          if (key === 'shiftName') {
            const shiftName = r.shift?.shiftName || r.shiftName || '';
            return String(shiftName).toLowerCase().includes(searchStr);
          }
          return true;
        });
      });
    }

    if (!searchQuery) return filtered;

    const q = searchQuery.toLowerCase().trim();
    return filtered.filter((r) => r.employeeName?.toLowerCase().includes(q) || r.empCode?.toLowerCase().includes(q));
  }, [dailyRows, searchQuery, processMonth, processYear, globalFilters]);

  const daysInMonth = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toUpperCase() === processMonth.toUpperCase());
    const yr = parseInt(processYear, 10);
    return new Date(yr, monthIndex + 1, 0).getDate();
  }, [processMonth, processYear]);

  const dailyStats = useMemo(() => {
    const activeEmps = employees.filter((e) => {
      const s = typeof e.status === 'object' && e.status !== null ? e.status.name : e.status;
      return String(s || '').toLowerCase() === 'active' && e.empCode && !(e.fromWhere === 'ATS' && !e.empCode);
    });
    const requiredEmployees = activeEmps.length || 2;
    let totalSalary = 0;
    filteredDailyRows.forEach((row) => {
      const emp = row.employee || employees.find((e) => e.id === row.employeeId);
      let gross = DEFAULT_GROSS_SALARY;
      if (emp) {
         if (emp.q27_expectedGrossSalary) gross = parseFloat(emp.q27_expectedGrossSalary) || gross;
         else if (emp.q25_prevGrossSalary) gross = parseFloat(emp.q25_prevGrossSalary) || gross;
      }
      let act = 0;
      if (row.status === 'PRESENT') act = gross / daysInMonth;
      else if (row.status === 'HALF_DAY') act = (gross / daysInMonth) / 2;

      // Add OT salary if eligible
      let otAct = 0;
      const isOtEligible = (row.employee?.otToggle || emp?.otToggle || 'NO').toUpperCase() === 'YES';
      if (isOtEligible && row.overtimeHours && parseFloat(row.overtimeHours) > 0) {
        const perHourRate = gross / (daysInMonth * 8);
        otAct = (parseFloat(row.overtimeHours) / 60) * perHourRate;
      }

      totalSalary += (act + otAct);
    });
    return { requiredEmployees, totalSalary };
  }, [filteredDailyRows, employees, daysInMonth]);

  // Generate dynamic monthly process columns based on selected month/year
  const monthlyProcessColumns = useMemo(() => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toUpperCase() === processMonth.toUpperCase());
    const yr = parseInt(processYear, 10);
    const daysInMonth = new Date(yr, monthIndex + 1, 0).getDate();
    const monthAbbr = processMonth.substring(0, 3);

    const cols = [
      { id: 'index', label: '#', minWidth: 50, align: 'center' },
      { id: 'empCode', label: 'Emp Id', minWidth: 80, align: 'center' },
      { id: 'empName', label: 'Emp Name', bold: true, minWidth: 160, align: 'left' }
    ];

    // Day-wise columns
    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${monthAbbr} ${day}`;
      cols.push({
        id: dayKey,
        label: `${monthAbbr} ${day}`,
        minWidth: 50,
        align: 'center',
        render: (row) => {
          const val = row[dayKey];
          const dayOfWeek = new Date(yr, monthIndex, day).getDay();
          const isSunday = dayOfWeek === 0;
          const isZero = !val || val === '0.0' || val === '0' || parseFloat(val) === 0;

          if (!val || val === '-' || (isSunday && isZero))
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                -
              </Typography>
            );
          
          const num = parseFloat(val);

          let bg = '#e8f5e9';
          let color = '#2e7d32';

          if (isNaN(num)) {
            const config = STATUS_COLORS[val] || { bg: '#eee', color: '#666' };
            bg = config.bg;
            color = config.color;
          } else if (isSunday) {
            bg = '#e3f2fd';
            color = '#1565c0';
          } else if (num === 0) {
            bg = '#ffebee';
            color = '#c62828';
          } else if (num < 480) {
            bg = '#fff3e0';
            color = '#e65100';
          }

          return (
            <Chip
              label={!isNaN(num) ? String(Math.round(num / 60)) : val}
              size="small"
              sx={{
                backgroundColor: bg,
                color: color,
                fontWeight: 600,
                fontSize: '0.7rem',
                minWidth: 40,
                height: 22
              }}
            />
          );
        }
      });
    }


    // Summary columns after the day columns
    cols.push(
      {
        id: 'lateMins',
        label: 'Late Hrs',
        minWidth: 80,
        align: 'center',
        format: (val) => (val ? Math.round(parseFloat(val) / 60).toString() : '0'),
        render: (row) => {
          const val = row.lateMins;
          if (!val || val === 0)
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                0
              </Typography>
            );
          const hrs = Math.round(parseFloat(val) / 60);
          if (hrs === 0) return <Typography variant="body2" sx={{ color: '#9e9e9e' }}>0</Typography>;
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
              {hrs}
            </Typography>
          );
        }
      },
      {
        id: 'totalWoHrs',
        label: 'Total Hrs',
        minWidth: 100,
        align: 'center',
        format: (val) => (val != null ? Math.round(parseFloat(val) / 60).toString() : '0'),
        render: (row) => {
          const mins = parseFloat(row.totalWoHrs || 0);
          const hrs = Math.round(mins / 60);
          const color = hrs >= 160 ? '#2e7d32' : hrs >= 80 ? '#e65100' : '#c62828';
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color }}>
              {hrs}
            </Typography>
          );
        }
      },
      {
        id: 'otHrs',
        label: 'OT Hrs',
        minWidth: 80,
        align: 'center',
        format: (val, row) => {
          const emp = employees.find((e) => e.id === row.employeeId || e.empCode === row.empCode);
          const isOtEligible = (row.employee?.otToggle || emp?.otToggle || 'NO').toUpperCase() === 'YES';
          if (!isOtEligible) return '-';
          return val != null ? Math.round(parseFloat(val) / 60).toString() : '0';
        },
        render: (row) => {
          const emp = employees.find((e) => e.id === row.employeeId || e.empCode === row.empCode);
          const isOtEligible = (row.employee?.otToggle || emp?.otToggle || 'NO').toUpperCase() === 'YES';
          if (!isOtEligible) {
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                -
              </Typography>
            );
          }
          const mins = parseFloat(row.otHrs || 0);
          if (mins <= 0)
            return (
              <Typography variant="body2" sx={{ color: '#9e9e9e' }}>
                0
              </Typography>
            );
          const hrs = Math.round(mins / 60);
          if (hrs === 0) return <Typography variant="body2" sx={{ color: '#9e9e9e' }}>0</Typography>;
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>
              +{hrs}
            </Typography>
          );
        }
      },
      {
        id: 'noOfAbsent',
        label: 'No Of Absent',
        minWidth: 90,
        align: 'center',
        format: (val) => (val || 0),
        render: (row) => {
          const val = row.noOfAbsent || 0;
          if (val === 0)
            return (
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                0
              </Typography>
            );
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#c62828' }}>
              {val}
            </Typography>
          );
        }
      },
      {
        id: 'zeroWoHrs',
        label: 'Zero Wo Hrs',
        minWidth: 90,
        align: 'center',
        format: (val) => (val || 0),
        render: (row) => {
          const val = row.zeroWoHrs || 0;
          if (val === 0)
            return (
              <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                0
              </Typography>
            );
          return (
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
              {val}
            </Typography>
          );
        }
      }
    );

    return cols;
  }, [processMonth, processYear]);

  // Summary stats for monthly process view (computed from monthlyProcessRows)
  const summaryProcessStats = useMemo(() => {
    const stats = { totalEmployees: 0, totalAbsent: 0, totalHours: 0, totalOT: 0, totalLate: 0, totalSalary: 0 };
    monthlyProcessRows.forEach((r) => {
      stats.totalEmployees++;
      if (r.noOfAbsent) stats.totalAbsent += parseInt(r.noOfAbsent, 10) || 0;
      if (r.totalWoHrs) stats.totalHours += parseFloat(r.totalWoHrs) || 0;
      if (r.otHrs) stats.totalOT += parseFloat(r.otHrs) || 0;
      if (r.lateMins) stats.totalLate += parseInt(r.lateMins, 10) || 0;
      if (r.estimatedSalary) stats.totalSalary += parseFloat(r.estimatedSalary) || 0;
    });
    return stats;
  }, [monthlyProcessRows]);

  const monthlyExportColumns = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toUpperCase() === processMonth.toUpperCase());
    const yr = parseInt(processYear, 10);
    const daysInMonth = new Date(yr, monthIndex + 1, 0).getDate();
    const monthAbbr = processMonth.substring(0, 3);

    const cols = [
      { header: '#', key: 'index' },
      { header: 'Emp Id', key: 'empCode' },
      { header: 'Emp Name', key: 'empName' }
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayKey = `${monthAbbr} ${day}`;
      cols.push({
        header: dayKey,
        key: (row) => {
          const val = row[dayKey];
          if (!val || val === '-') return '-';
          const num = parseFloat(val);
          if (!isNaN(num)) {
            return Math.round(num / 60);
          }
          return val;
        }
      });
    }

    cols.push(
      { header: 'Late Hrs', key: (row) => row.lateMins != null ? Math.round(parseFloat(row.lateMins) / 60) : 0 },
      { header: 'Total Hrs', key: (row) => row.totalWoHrs != null ? Math.round(parseFloat(row.totalWoHrs) / 60) : 0 },
      { header: 'OT Hrs', key: (row) => row.otHrs != null ? Math.round(parseFloat(row.otHrs) / 60) : 0 },
      { header: 'No Of Absent', key: 'noOfAbsent' },
      { header: 'Zero Wo Hrs', key: 'zeroWoHrs' }
    );

    return cols;
  }, [processMonth, processYear]);



  const dailyExportColumns = useMemo(() => [
    { header: 'Emp Id', key: 'empCode' },
    { header: 'Emp Name', key: 'employeeName' },
    { header: 'Date', key: (row) => row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString('en-GB') : '' },
    { header: 'Shift Name', key: (row) => getShiftDisplay(row, shifts) },
    { header: 'In-Time', key: 'punchIn' },
    { header: 'Out-Time', key: 'punchOut' },
    {
      header: 'Late Hrs',
      key: (row) => {
        let lateMins = 0;
        if (row.isLate && row.punchIn) {
           try {
               const clean = row.punchIn.replace(/[^0-9:]/g, '');
               const parts = clean.split(':');
               if (parts.length >= 2) {
                  let hrs = parseInt(parts[0], 10);
                  let mins = parseInt(parts[1], 10);
                  if (row.punchIn.toUpperCase().includes('PM') && hrs < 12) hrs += 12;
                  if (row.punchIn.toUpperCase().includes('AM') && hrs === 12) hrs = 0;
                  const totalMins = hrs * 60 + mins;
                  const shiftStartMins = 9 * 60; // 9:00 AM
                  if (totalMins > shiftStartMins) lateMins = totalMins - shiftStartMins;
               }
           } catch (err) {}
        }
        return Math.round(lateMins / 60);
      }
    },
    { header: 'Working Hrs', key: (row) => row.totalHoursWorked != null ? Math.round(parseFloat(row.totalHoursWorked) / 60) : 0 },
    { header: 'OT Hrs', key: (row) => row.overtimeHours != null ? Math.round(parseFloat(row.overtimeHours) / 60) : 0 },
    { header: 'Wage Type', key: (row) => row.wagesType || 'Monthly' },
    { header: 'OT Eligible', key: (row) => (row.employee?.otToggle || 'NO').toUpperCase() },
    { header: 'Attendance Status', key: 'status' },
    { header: 'Status', key: (row) => row.isActive !== false ? 'Active' : 'Inactive' }
  ], [shifts]);

  // Canteen Logs Columns
  const canteenColumns = useMemo(() => [
    {
      id: 'index',
      label: '#',
      minWidth: 50,
      align: 'center',
      render: (row, idx) => idx + 1
    },
    {
      id: 'empCode',
      label: 'Emp Id',
      minWidth: 100,
      align: 'center',
      render: (row) => row.employee?.empCode || '-'
    },
    {
      id: 'employeeName',
      label: 'Emp Name',
      bold: true,
      minWidth: 180,
      align: 'left',
      render: (row) => row.employee?.employeeName || '-'
    },
    {
      id: 'logDate',
      label: 'Log Date & Time',
      minWidth: 180,
      align: 'center',
      render: (row) => {
        if (!row.logDate) return '-';
        const dateObj = new Date(row.logDate);
        return `${dateObj.toLocaleDateString('en-GB')} ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
      }
    },
    {
      id: 'deviceName',
      label: 'Device Name',
      minWidth: 150,
      align: 'left',
      render: (row) => row.deviceName || 'Canteen Device'
    },
    {
      id: 'logTime',
      label: 'Meal Time',
      minWidth: 120,
      align: 'center',
      render: (row) => {
        if (row.logTime == null) return '-';
        const val = parseFloat(row.logTime);
        const hours = Math.floor(val);
        const minutes = Math.round((val - hours) * 60);
        const pad = (num) => String(num).padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 === 0 ? 12 : hours % 12;
        return `${pad(displayHours)}:${pad(minutes)} ${period}`;
      }
    }
  ], []);

  // Filtered Canteen Rows
  const filteredCanteenRows = useMemo(() => {
    let filtered = canteenRows;
    if (processMonth && processYear) {
      filtered = filtered.filter((r) => {
        if (!r.logDate) return false;
        const d = new Date(r.logDate);
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const rMonth = months[d.getMonth()];
        const rYear = d.getFullYear().toString();
        return rMonth === processMonth && rYear === processYear;
      });
    }
    if (!searchQuery) return filtered;
    const q = searchQuery.toLowerCase().trim();
    return filtered.filter((r) =>
      r.employee?.employeeName?.toLowerCase().includes(q) ||
      r.employee?.empCode?.toLowerCase().includes(q) ||
      r.deviceName?.toLowerCase().includes(q)
    );
  }, [canteenRows, searchQuery, processMonth, processYear]);

  // Dashboard Cohorts Data
  const cohortsData = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const selectedMonthIdx = monthNames.findIndex(m => m.toUpperCase() === processMonth.toUpperCase());
    const selectedYr = parseInt(processYear, 10);

    const totalEmployees = monthlyProcessRows;
    const perfectAttendance = monthlyProcessRows.filter(r => (parseInt(r.noOfAbsent) || 0) === 0);
    const absentCohort = monthlyProcessRows.filter(r => (parseInt(r.noOfAbsent) || 0) > 0);
    const singlePunchAnomalies = filteredDailyRows.filter(r => {
      const hasIn = r.punchIn && r.punchIn.trim().length > 0;
      const hasOut = r.punchOut && r.punchOut.trim().length > 0;
      return (hasIn && !hasOut) || (!hasIn && hasOut);
    });
    const newJoinees = monthlyProcessRows.filter(r => {
      if (!r.dateOfJoining || r.dateOfJoining === 'N/A') return false;
      try {
        const d = new Date(r.dateOfJoining);
        return d.getFullYear() === selectedYr && d.getMonth() === selectedMonthIdx;
      } catch (e) {
        return false;
      }
    });

    return {
      total: totalEmployees,
      perfect: perfectAttendance,
      absent: absentCohort,
      anomaly: singlePunchAnomalies,
      newJoinees: newJoinees
    };
  }, [monthlyProcessRows, filteredDailyRows, processMonth, processYear]);

  // Cohort Drilldown Columns
  const drillDownColumns = useMemo(() => {
    if (selectedCohortType === 'anomaly') {
      return [
        {
          id: 'attendanceDate',
          label: 'Date',
          minWidth: 100,
          align: 'center',
          render: (row) => (row.attendanceDate ? new Date(row.attendanceDate).toLocaleDateString('en-GB') : '')
        },
        {
          id: 'empCode',
          label: 'Emp Id',
          minWidth: 80,
          align: 'center',
          render: (row) => row.employee?.empCode || row.empCode || '-'
        },
        {
          id: 'employeeName',
          label: 'Emp Name',
          bold: true,
          minWidth: 160,
          align: 'left',
          render: (row) => row.employee?.employeeName || row.employeeName || '-'
        },
        { id: 'punchIn', label: 'In-Time', minWidth: 100, align: 'center' },
        { id: 'punchOut', label: 'Out-Time', minWidth: 100, align: 'center' },
      {
        id: 'shiftName',
        label: 'Shift Name',
        minWidth: 120,
        align: 'center',
        render: (row) => {
          const display = getShiftDisplay(row, shifts);
          return display !== '-' ? display : 'General Shift';
        }
      },
        {
          id: 'status',
          label: 'Status',
          minWidth: 110,
          align: 'center',
          render: (row) => (
            <Chip
              label="SINGLE PUNCH"
              size="small"
              sx={{ backgroundColor: '#fff3e0', color: '#e65100', fontWeight: 600, fontSize: '0.7rem' }}
            />
          )
        }
      ];
    }

    const cols = [
      { id: 'empCode', label: 'Emp Id', minWidth: 80, align: 'center' },
      { id: 'empName', label: 'Emp Name', bold: true, minWidth: 180, align: 'left' },
      { id: 'department', label: 'Department', minWidth: 150, align: 'left' },
      { id: 'designation', label: 'Designation', minWidth: 150, align: 'left' },
      {
        id: 'dateOfJoining',
        label: 'Date of Joining',
        minWidth: 120,
        align: 'center',
        render: (row) => row.dateOfJoining && row.dateOfJoining !== 'N/A' ? new Date(row.dateOfJoining).toLocaleDateString('en-GB') : '-'
      }
    ];

    if (selectedCohortType === 'absent') {
      cols.push({
        id: 'noOfAbsent',
        label: 'Absent Days',
        minWidth: 100,
        align: 'center',
        render: (row) => (
          <Typography sx={{ fontWeight: 600, color: '#c62828' }}>
            {row.noOfAbsent || 0}
          </Typography>
        )
      });
    } else {
      cols.push({
        id: 'totalWoHrs',
        label: 'Working Hours',
        minWidth: 120,
        align: 'center',
        render: (row) => {
          const val = parseFloat(row.totalWoHrs || 0);
          return (
            <Typography sx={{ fontWeight: 600, color: val > 0 ? '#2e7d32' : '#9e9e9e' }}>
              {val.toFixed(2)} hrs
            </Typography>
          );
        }
      });
    }

    return cols;
  }, [selectedCohortType, shifts]);

  return (
    <MainCard
      title={
        <Stack spacing={1.5}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            Biometric Attendance
          </Typography>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} indicatorColor="primary" textColor="primary">
            <Tab label="Daily" />
            <Tab label="Monthly" />
          </Tabs>
        </Stack>
      }
      secondary={
        <Stack spacing={1.5} alignItems="flex-end">
          <Stack direction="row" spacing={1.5} alignItems="center">
            {perms.write && (
              <>

                <Tooltip title="Sync (Biometric Sync)">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setSyncModalOpen(true)}
                    startIcon={<IconCloudDownload size={18} />}
                    sx={{ height: 38, px: 3, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                  >
                    Sync-up
                  </Button>
                </Tooltip>
              </>
            )}
            {(perms.export || true) && (
              <BOSExportButton
                data={activeTab === 0 ? filteredDailyRows : monthlyProcessRows}
                filename={activeTab === 0 ? `Daily_Attendance_${processMonth}_${processYear}` : `Monthly_Attendance_${processMonth}_${processYear}`}
                screenColumns={activeTab === 0 ? columns : monthlyProcessColumns}
              />
            )}
            {activeTab === 0 && deletedLogs.length > 0 && (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setRestoreDialogOpen(true)}
                sx={{ height: 38, px: 2, textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
              >
                Restore Deleted ({deletedLogs.length})
              </Button>
            )}
          </Stack>
          {activeTab === 0 && (
            <Tooltip title="Employees (Attendance Stats)">
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  minWidth: 120
                }}
              >
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Required Employee :
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {dailyStats.requiredEmployees}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Stack>
      }
    >
      {activeTab === 0 && (
        <Box sx={{ mt: 1 }}>
          <Stack spacing={3}>
            <BOSDataTable
              id="hra-biometric-attendance-daily-table"
              columns={columns}
              rows={filteredDailyRows}
              loading={loading}
              disableSearchFilter
              disableMaxRecords
              toggleColumnsTooltip="Columns (Filters)"
              maxRecordsTooltip="Limit (Filters)"
              rowsPerPageTooltip="Rows (Filters)"
              paginationTooltip="Page (Filters)"
              sx={{ height: 'calc(100vh - 310px)', minHeight: '450px' }}
            />
          </Stack>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 1 }}>
          <Stack spacing={3}>
            <BOSDataTable
              id={`hra-biometric-attendance-monthly-${processMonth}-${processYear}`}
              columns={monthlyProcessColumns}
              rows={monthlyProcessRows}
              loading={monthlyProcessLoading}
              disableTableConfig
              disableSearchFilter
              disableMaxRecords
              toggleColumnsTooltip="Columns (Filters)"
              maxRecordsTooltip="Limit (Filters)"
              rowsPerPageTooltip="Rows (Filters)"
              paginationTooltip="Page (Filters)"
              sx={{ height: 'calc(100vh - 310px)', minHeight: '450px' }}
            />
          </Stack>
        </Box>
      )}



      {/* Photo Viewer Dialog */}
      <BOSFormDialog
        open={photoDialogOpen}
        onClose={handleClosePhotoDialog}
        title="Employee Check-in Photo"
        hideFooter
        sx={{ '& .MuiDialog-paper': { width: '400px', maxWidth: '400px' } }}
        closeTooltip="Close"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          {photoLoading ? (
            <CircularProgress />
          ) : previewPhoto ? (
            <Box
              component="img"
              src={previewPhoto}
              alt="Biometric Check-in"
              sx={{
                width: '100%',
                maxHeight: '400px',
                borderRadius: '8px',
                objectFit: 'contain',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1
              }}
            />
          ) : (
            <Typography color="textSecondary">No image available</Typography>
          )}
        </Box>
      </BOSFormDialog>

      {/* Dialog for adding/editing daily biometric logs */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? (isReadOnly ? "View Biometric Attendance Log" : "Edit Biometric Attendance Log") : "Add Biometric Attendance Log"}
        onSave={isReadOnly ? undefined : handleSave}
        onClear={isReadOnly ? undefined : () => setFormData(INITIAL_STATE)}
        sx={{ '& .MuiDialog-paper': { width: '480px', maxWidth: '480px' } }}
        saveTooltip="Save (Attendance Processing)"
        clearTooltip="Clear (Attendance Processing)"
        closeTooltip="Close (Attendance Processing)"
        deleteTooltip="Delete (Attendance Processing)"
        hideFooter={isReadOnly}
      >
        <BOSFormSection title="Biometric Details" icon={<IconClock size={22} />}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Tooltip title="Employee (Attendance Processing)">
              <span>
                <BOSAutocomplete
                  label={
                    <>
                      Employee Name <span style={{ color: 'red' }}>*</span>
                    </>
                  }
                  options={employees}
                  getOptionLabel={(opt) => (opt ? `${opt.empCode} - ${opt.employeeName}` : '')}
                  value={formData.employeeId}
                  disabled={isReadOnly}
                  onChange={(val) => {
                    const empId = val && typeof val === 'object' ? val.id : val;
                    const empObj = employees.find((e) => e.id === empId);
                    let autoShiftId = '';
                    if (empObj && empObj.shift && shifts.length > 0) {
                      const matchedShift = shifts.find((s) => s.shiftCode?.toUpperCase() === empObj.shift.toUpperCase());
                      if (matchedShift) {
                        autoShiftId = matchedShift.id;
                      }
                    }
                    setFormData((prev) => ({
                      ...prev,
                      employeeId: empId || '',
                      shiftId: autoShiftId || prev.shiftId
                    }));
                    if (errors.employeeId) clearErrors('employeeId');
                  }}
                  placeholder="Select Employee"
                  error={!!errors.employeeId}
                  helperText={errors.employeeId}
                  sx={errorStyle(!!errors.employeeId)}
                />
              </span>
            </Tooltip>

            <Tooltip title="Date (Attendance Processing)">
              <span>
                <BOSDatePicker
                  label="Attendance Date"
                  required
                  name="attendanceDate"
                  disablePast={false}
                  value={formData.attendanceDate}
                  disabled={isReadOnly}
                  onChange={handleChange}
                  maxDate={new Date()}
                  error={!!errors.attendanceDate}
                  helperText={errors.attendanceDate}
                  sx={errorStyle(!!errors.attendanceDate)}
                />
              </span>
            </Tooltip>

            <Stack direction="row" spacing={1.5}>
              <Tooltip title="Punch-In (Attendance Processing)" sx={{ flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <BOSTimePicker label="Punch In" name="punchIn" value={formData.punchIn} disabled={isReadOnly} onChange={handleChange} />
                </Box>
              </Tooltip>
              <Tooltip title="Punch-Out (Attendance Processing)" sx={{ flex: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <BOSTimePicker label="Punch Out" name="punchOut" value={formData.punchOut} disabled={isReadOnly} onChange={handleChange} />
                </Box>
              </Tooltip>
            </Stack>

            <Tooltip title="Status (Attendance Processing)">
              <span>
                <BOSTextField
                  select
                  label="Attendance Status"
                  name="status"
                  value={formData.status}
                  disabled={isReadOnly}
                  onChange={handleChange}
                  error={!!errors.status}
                  helperText={errors.status}
                  sx={errorStyle(!!errors.status)}
                >
                  <MenuItem value="PRESENT">PRESENT</MenuItem>
                  <MenuItem value="HALF_DAY">HALF_DAY</MenuItem>
                  <MenuItem value="HD">HD</MenuItem>
                  <MenuItem value="ABSENT">ABSENT</MenuItem>
                  <MenuItem value="WO">WO</MenuItem>
                  <MenuItem value="CL">CL</MenuItem>
                  <MenuItem value="SL">SL</MenuItem>
                  <MenuItem value="HL">HL</MenuItem>
                  <MenuItem value="LOP">LOP</MenuItem>
                  <MenuItem value="MIS">MIS</MenuItem>
                  <MenuItem value="OD">OD</MenuItem>
                </BOSTextField>
              </span>
            </Tooltip>

            <Tooltip title="Shift (Attendance Processing)">
              <span>
                <BOSTextField
                  select
                  label="Shift"
                  name="shiftId"
                  value={formData.shiftId}
                  disabled={isReadOnly}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">Select Shift</MenuItem>
                  {shifts.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.shiftCode} - {s.shiftName}
                    </MenuItem>
                  ))}
                </BOSTextField>
              </span>
            </Tooltip>

            <Stack direction="row" spacing={3}>
              <Tooltip title="Late (Attendance Processing)">
                <span>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(formData.isLate)}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isLate: e.target.checked }))}
                        name="isLate"
                        color="primary"
                      />
                    }
                    label="Late Arrival"
                  />
                </span>
              </Tooltip>
              <Tooltip title="Early (Attendance Processing)">
                <span>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(formData.isEarlyExit)}
                        disabled={isReadOnly}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isEarlyExit: e.target.checked }))}
                        name="isEarlyExit"
                        color="primary"
                      />
                    }
                    label="Early Exit"
                  />
                </span>
              </Tooltip>
            </Stack>

            <Tooltip title="Remarks (Attendance Processing)">
              <span>
                <BOSTextField
                  label="Remarks"
                  name="remarks"
                  value={formData.remarks}
                  disabled={isReadOnly}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  placeholder="Biometric entry logs, warnings or exceptions..."
                />
              </span>
            </Tooltip>

            <FormControl component="fieldset" sx={{ mt: 1 }}>
              <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>STATUS</FormLabel>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    color="primary"
                    disabled={isReadOnly || !formData.id}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      color: (formData.isActive !== false) ? '#2e7d32' : '#c62828',
                      fontSize: '0.85rem'
                    }}
                  >
                    {(formData.isActive !== false) ? 'ACTIVE' : 'INACTIVE'}
                  </Typography>
                }
              />
            </FormControl>
          </Stack>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Biometric Attendance Log"
        message="Are you sure you want to delete this attendance record? You can restore it during this session."
        itemName={deleteTargetName}
      />

      <BOSFormDialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        title="Recently Deleted Logs"
        onSave={() => setRestoreDialogOpen(false)}
        onClear={() => setDeletedLogs([])}
        sx={{ '& .MuiDialog-paper': { width: '550px', maxWidth: '550px' } }}
        saveTooltip="Close (Attendance Processing)"
        clearTooltip="Clear (Attendance Processing)"
        closeTooltip="Close (Attendance Processing)"
      >
        <BOSFormSection title="Deleted Logs" icon={<IconClock size={22} />}>
          {deletedLogs.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
              No recently deleted records.
            </Typography>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 1, maxHeight: '300px', overflowY: 'auto' }}>
              {deletedLogs.map((logItem, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {logItem.employee?.employeeName || logItem.employeeName || '-'} ({logItem.employee?.empCode || logItem.empCode || '-'}
                      )
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Date: {logItem.attendanceDate ? new Date(logItem.attendanceDate).toLocaleDateString('en-GB') : '-'} | In:{' '}
                      {logItem.punchIn || '-'} | Out: {logItem.punchOut || '-'}
                    </Typography>
                  </Box>
                  <Tooltip title="Restore (Attendance Processing)">
                    <span>
                      <Button variant="contained" color="primary" size="small" onClick={() => handleRestore(logItem)}>
                        Restore
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              ))}
            </Stack>
          )}
        </BOSFormSection>
      </BOSFormDialog>

      {/* Essl Data Import with ERP Modal */}
      <BOSFormDialog
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        title="Import Attendance from eSSL"
        maxWidth="md"
        onSave={handleSyncEssl}
        saveLabel="Import"
        saveIcon={<IconCloudDownload size={20} />}
        saveButtonDisabled={syncing}
        closeTooltip="Close (Attendance Processing)"
        saveTooltip="Import (Attendance Processing)"
      >
        <Stack direction="row" spacing={4} sx={{ p: 2 }}>
          {/* Month Wise Section */}
          <Box sx={{ flex: 1, cursor: 'pointer', opacity: syncMode === 'month' ? 1 : 0.5 }} onClick={() => setSyncMode('month')}>
            <Tooltip title="Month-Wise (Attendance Processing)">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Radio checked={syncMode === 'month'} onChange={() => setSyncMode('month')} size="small" /> Month Wise
              </Typography>
            </Tooltip>
            <Stack spacing={2} sx={{ pointerEvents: syncMode === 'month' ? 'auto' : 'none' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ minWidth: 60 }}>Month</Typography>
                <Tooltip title="Month (Filters)">
                  <span>
                    <BOSAutocomplete
                      options={dbMonths.length > 0 ? dbMonths : [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December'
                      ]}
                      value={syncMonth}
                      onChange={(v) => setSyncMonth(v)}
                      placeholder="Month"
                    />
                  </span>
                </Tooltip>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ minWidth: 60 }}>Year</Typography>
                <Tooltip title="Year (Filters)">
                  <span>
                    <BOSAutocomplete
                      options={Array.from({ length: 2100 - 1990 + 1 }, (_, i) => String(1990 + i))}
                      value={syncYear}
                      onChange={(v) => setSyncYear(v)}
                      placeholder="Year"
                    />
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* Date Wise Section */}
          <Box sx={{ flex: 1, cursor: 'pointer', opacity: syncMode === 'date' ? 1 : 0.5 }} onClick={() => setSyncMode('date')}>
            <Tooltip title="Date-Wise (Attendance Processing)">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Radio checked={syncMode === 'date'} onChange={() => setSyncMode('date')} size="small" /> Date Wise
              </Typography>
            </Tooltip>
            <Stack spacing={2} sx={{ pointerEvents: syncMode === 'date' ? 'auto' : 'none' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ minWidth: 80 }}>From Date</Typography>
                <Tooltip title="From-Date (Filters)">
                  <span>
                    <BOSDatePicker value={syncFromDate} onChange={(e) => setSyncFromDate(e?.target?.value || '')} placeholder="Select Date" disablePast={false} maxDate={new Date()} />
                  </span>
                </Tooltip>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ minWidth: 80 }}>To Date</Typography>
                <Tooltip title="To-Date (Filters)">
                  <span>
                    <BOSDatePicker value={syncToDate} onChange={(e) => setSyncToDate(e?.target?.value || '')} placeholder="Select Date" disablePast={false} maxDate={new Date()} />
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </BOSFormDialog>

      <BOSFormDialog
        open={shiftTimingDialogOpen}
        onClose={() => setShiftTimingDialogOpen(false)}
        title="Shift Timing Details"
        hideFooter
        sx={{ '& .MuiDialog-paper': { width: '500px', maxWidth: '500px' } }}
        closeTooltip="Close (Attendance Processing)"
      >
        <Box sx={{ p: 1, height: 300 }}>
          <BOSDataTable
            id="hra-shift-timing-details-table"
            columns={[
              { id: 'index', label: '#', minWidth: 50, align: 'center', render: (row, idx) => idx + 1 },
              { id: 'shiftName', label: 'Shift Name', minWidth: 150, align: 'left', render: (row) => row.shiftName?.toUpperCase() },
              { id: 'startTime', label: 'Start Time', minWidth: 100, align: 'center' },
              { id: 'endTime', label: 'End Time', minWidth: 100, align: 'center' }
            ]}
            rows={shifts}
            showActions={false}
            disableSearchFilter
            disableTableConfig
            sx={{ height: 260 }}
          />
        </Box>
      </BOSFormDialog>
    </MainCard>
  );
}
