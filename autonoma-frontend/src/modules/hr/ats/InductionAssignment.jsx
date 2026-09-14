import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'utils/axios';
import { useTheme } from '@mui/material/styles';

// MUI & Icons
import {
  Box, Typography, Stack, Tooltip, IconButton, MenuItem, Button, Chip, Divider, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper
} from '@mui/material';
import {
  IconRefresh, IconPlus, IconCalendarEvent, IconEdit, IconUserPlus, IconCloudUpload, IconTrash
} from '@tabler/icons-react';

// BOS Components
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSFormSection, BOSTextField, btnNew, errorStyle, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSDatePicker, BOSTimePicker, BOSStatusChip } from 'ui-component/bos';
import { openSnackbar } from 'store/slices/snackbar';
import { useLookups } from 'hooks/useLookups';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, resetFilters, setQuery } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { Navigate } from 'react-router-dom';

const getCurrentTimeStr = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// ==============================|| INDUCTION ASSIGNMENT MANAGEMENT ||============================== //




const getCurrentDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalDateStr = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${minutes} ${ampm}`;
};

const INITIAL_STATE = {
  empCode: '',
  empName: '',
  department: '',
  designation: '',
  levels: [
    {
      id: null,
      screeningLevel: 'Level 1',
      inductionRound: '',
      inductionDate: new Date().toISOString().split('T')[0],
      inductionTime: '09:00 AM',
      trainerName: '',
      trainerEmpCode: '',
      currentStatus: 'PENDING',
      isActive: true,
      remarks: ''
    }
  ]
};

const FALLBACK_ROUND_OPTIONS = ['HR', 'QMS', 'DEPARTMENT', 'MANAGEMENT'];
const LEVEL_OPTIONS = ['Level 1', 'Level 2', 'Level 3', 'Level 4'];
const STATUS_OPTIONS = ['PENDING', 'TRAINING GIVEN', 'COMPLETED'];

const TIME_OPTIONS = [
  { value: '08:00', label: '08:00 AM' },
  { value: '08:30', label: '08:30 AM' },
  { value: '09:00', label: '09:00 AM' },
  { value: '09:30', label: '09:30 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '01:00 PM' },
  { value: '13:30', label: '01:30 PM' },
  { value: '14:00', label: '02:00 PM' },
  { value: '14:30', label: '02:30 PM' },
  { value: '15:00', label: '03:00 PM' },
  { value: '15:30', label: '03:30 PM' },
  { value: '16:00', label: '04:00 PM' },
  { value: '16:30', label: '04:30 PM' },
  { value: '17:00', label: '05:00 PM' },
  { value: '17:30', label: '05:30 PM' },
  { value: '18:00', label: '06:00 PM' },
  { value: '18:30', label: '06:30 PM' },
  { value: '19:00', label: '07:00 PM' },
  { value: '19:30', label: '07:30 PM' },
  { value: '20:00', label: '08:00 PM' }
];

const VALIDATION_RULES = [
  { field: 'empCode', label: 'Employee', required: true },
  { field: 'inductionRound', label: 'Induction Round', required: true },
  { field: 'screeningLevel', label: 'Screening Level', required: true },
  { field: 'inductionDate', label: 'Induction Date', required: true },
  { field: 'inductionTime', label: 'Induction Time', required: true },
  { field: 'trainerName', label: 'Trainer Name', required: true }
];

const normalizeScreeningLevel = (level) => {
  if (!level) return '';
  const trimmed = level.trim();
  if (trimmed === '-' || trimmed === '') return '';

  const matchL = trimmed.match(/^L(\d+)$/i);
  if (matchL) {
    return `Level ${matchL[1]}`;
  }

  const matchLevel = trimmed.match(/^Level\s*(\d+)$/i);
  if (matchLevel) {
    return `Level ${matchLevel[1]}`;
  }

  const matchNum = trimmed.match(/^(\d+)$/);
  if (matchNum) {
    return `Level ${matchNum[1]}`;
  }

  return trimmed;
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (trimmed === '-' || trimmed === '') return '';
  if (/(am|pm)/i.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    const timePart = parts[0];
    const ampm = parts[1].toUpperCase();
    const tParts = timePart.split(':');
    if (tParts.length >= 2) {
      return `${tParts[0].padStart(2, '0')}:${tParts[1]} ${ampm}`;
    }
    return trimmed;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  }
  return trimmed;
};

const normalizeInductionTime = (time) => {
  return formatTime12h(time);
};

const add30Minutes = (timeStr) => {
  const normalized = normalizeInductionTime(timeStr);
  const match = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return normalized;

  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  minutes += 30;
  if (minutes >= 60) {
    minutes -= 60;
    hours += 1;
  }
  if (hours >= 24) {
    hours -= 24;
  }

  let outAmPm = 'AM';
  let outHours = hours;
  if (hours >= 12) {
    outAmPm = 'PM';
    if (hours > 12) outHours = hours - 12;
  } else if (hours === 0) {
    outHours = 12;
  }

  const hStr = String(outHours).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  return `${hStr}:${mStr} ${outAmPm}`;
};

const parseInductionDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  let hours = 9;
  let minutes = 0;

  if (timeStr) {
    const trimmed = timeStr.trim();
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      hours = parseInt(match12[1], 10);
      minutes = parseInt(match12[2], 10);
      const ampm = match12[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    } else {
      const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
      if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
      }
    }
  }

  return new Date(year, month, day, hours, minutes, 0, 0);
};

const InductionAssignment = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roundOptions, setRoundOptions] = useState(FALLBACK_ROUND_OPTIONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const [history, setHistory] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [levelRequirementBannerOpen, setLevelRequirementBannerOpen] = useState(false);
  const [isReassignMode, setIsReassignMode] = useState(false);

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters);
  const perms = usePagePermissions(PAGE_CODES.ATS_INDUCTION_PENDING);

  const { departments = [], designationLevels = [] } = useLookups(['DEPARTMENTS', 'DESIGNATION_LEVELS']);

  const levelObj = useMemo(() => {
    if (!formData?.empLevelId || !designationLevels) return null;
    return designationLevels.find(l => String(l.rowId || l.id) === String(formData.empLevelId));
  }, [formData?.empLevelId, designationLevels]);

  const levelName = levelObj ? (levelObj.level || levelObj.levelName || '-') : '-';
  const screenLevelLimit = levelObj ? (levelObj.screeningLevel || '-') : '-';

  const completedLevelsCount = useMemo(() => {
    return history.filter(h => h.currentStatus === 'COMPLETED').length;
  }, [history]);

  const uniqueScheduledOrCompletedLevels = useMemo(() => {
    const set = new Set();
    history.forEach(h => {
      if (h.currentStatus === 'COMPLETED' || h.isActive !== false) {
        const lvlName = normalizeScreeningLevel(h.screeningLevel);
        if (lvlName) set.add(lvlName);
      }
    });
    return set;
  }, [history]);

  const totalLevelsCount = useMemo(() => {
    const set = new Set(uniqueScheduledOrCompletedLevels);
    (formData.levels || []).forEach(l => {
      const lvlName = normalizeScreeningLevel(l.screeningLevel);
      if (lvlName) set.add(lvlName);
    });
    return set.size;
  }, [uniqueScheduledOrCompletedLevels, formData.levels]);

  const isAllLevelsCompleted = useMemo(() => {
    if (!screenLevelLimit || screenLevelLimit === '-') return false;
    const limit = parseInt(screenLevelLimit, 10);
    return completedLevelsCount >= limit;
  }, [completedLevelsCount, screenLevelLimit]);

  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return `${parts[0]}/${parts[1]}/${parts[2]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
    } catch (e) {
      return dateStr;
    }
  };

  const sortedLevels = useMemo(() => {
    if (!designationLevels || designationLevels.length === 0) return [];
    const getLevelNumber = (lvlStr) => {
      if (!lvlStr) return 0;
      const digits = lvlStr.match(/\d+/);
      return digits ? parseInt(digits[0], 10) : 0;
    };
    return [...designationLevels]
      .filter(l => l.isActive !== false)
      .sort((a, b) => getLevelNumber(a.level) - getLevelNumber(b.level));
  }, [designationLevels]);

  const topTwoLevelObjs = useMemo(() => {
    if (sortedLevels.length < 2) return sortedLevels;
    return sortedLevels.slice(-2);
  }, [sortedLevels]);

  const topTwoLevelIds = useMemo(() => {
    return topTwoLevelObjs.map(l => String(l.rowId || l.id));
  }, [topTwoLevelObjs]);

  const topTwoLevelNames = useMemo(() => {
    return topTwoLevelObjs.map(l => (l.level || l.levelName || '').trim().toUpperCase());
  }, [topTwoLevelObjs]);

  const isReassignmentOrReschedule = useCallback((level) => {
    if (!level.id) return false;
    const original = history.find(h => h.id === level.id);
    if (!original) return false;

    // If the screening level itself is changed, it is a new level assignment rather than rescheduling/reassigning the same level
    if (normalizeScreeningLevel(original.screeningLevel) !== normalizeScreeningLevel(level.screeningLevel)) {
      return false;
    }

    const trainerChanged = original.trainerEmpCode !== level.trainerEmpCode;
    const dateChanged = original.inductionDate !== level.inductionDate;
    const timeChanged = normalizeInductionTime(original.inductionTime) !== normalizeInductionTime(level.inductionTime);

    return trainerChanged || dateChanged || timeChanged;
  }, [history]);

  const getSaveButtonLabel = () => {
    if (!formData.levels || formData.levels.length === 0) return 'Save';
    const firstLevel = formData.levels[0];
    if (!firstLevel.id) return 'Save';
    const original = history.find(h => h.id === firstLevel.id);
    if (!original) return 'Save';

    if (isReassignMode || original.trainerEmpCode !== firstLevel.trainerEmpCode) {
      return 'Reassign';
    }
    const dateChanged = original.inductionDate !== firstLevel.inductionDate;
    const timeChanged = normalizeInductionTime(original.inductionTime) !== normalizeInductionTime(firstLevel.inductionTime);
    if (dateChanged || timeChanged) {
      return 'Reschedule';
    }
    return 'Save';
  };



  // Dispatch starred filter configuration matching Status and Search By
  useEffect(() => {
    const config = [{
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'ALL', label: 'ALL' },
        { value: 'PENDING', label: 'PENDING' },
        { value: 'TRAINING GIVEN', label: 'TRAINING GIVEN' },
        { value: 'COMPLETED', label: 'COMPLETED' }
      ],
      defaultValue: 'PENDING',
      isStarred: true
    },
    {
      id: 'searchBy',
      label: 'Search By',
      type: 'select',
      options: [
        { value: 'empCode', label: 'Employee Code' },
        { value: 'empName', label: 'Employee Name' },
        { value: 'department', label: 'Department' },
        { value: 'currentStatus', label: 'Current Status' },
        { value: 'inductionRound', label: 'Induction Round' }
      ],
      defaultValue: 'empCode',
      isStarred: true
    },
    {
      id: 'createdDate',
      label: 'Created Date',
      type: 'dateRange',
      isStarred: true
    }];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
      dispatch(setQuery(''));
    };
  }, [dispatch]);

  const handleAssign = useCallback(async (row) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/hr/induction-assignment/employee/${row.empCode}`);
      const normalizedHistory = (data || [])
        .map(h => ({
          ...h,
          screeningLevel: normalizeScreeningLevel(h.screeningLevel),
          inductionTime: normalizeInductionTime(h.inductionTime)
        }))
        .sort((a, b) => {
          const aNum = parseInt(a.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
          const bNum = parseInt(b.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
          return aNum - bNum;
        });
      setHistory(normalizedHistory);
      const cleanData = { ...INITIAL_STATE };

      Object.keys(cleanData).forEach(key => {
        if (row[key] !== undefined && row[key] !== null) {
          cleanData[key] = row[key];
        }
      });

      // Special handling for dates
      const todayStr = getCurrentDateString();
      let defaultDate = todayStr;
      if (row.inductionDate && row.inductionDate !== '-') {
        const localRowDate = toLocalDateStr(row.inductionDate);
        if (localRowDate >= todayStr) {
          defaultDate = localRowDate;
        }
      }

      // Add gradeCode/Level info for summary header
      cleanData.gradeCode = row.gradeCode || row.grade?.gradeCode || '-';
      cleanData.empName = row.empName || row.employeeName || '';
      cleanData.empCode = row.empCode || '';
      cleanData.oldEmpCode = row.oldEmpCode || '';
      cleanData.department = typeof row.department === 'object' ? row.department?.departmentName : (row.department || '');
      cleanData.designation = typeof row.designation === 'object' ? row.designation?.designationName : (row.designation || '');

      cleanData.empLevelId = row.empLevelId || '';

      const activeOrCompletedCount = normalizedHistory
        .filter(h => h.currentStatus === 'COMPLETED' || h.isActive !== false)
        .reduce((set, h) => {
          const lvl = normalizeScreeningLevel(h.screeningLevel);
          if (lvl) set.add(lvl);
          return set;
        }, new Set()).size;

      const isResolved = row.isVirtual || row.currentStatus === 'COMPLETED' || row.currentStatus === 'REJECTED';
      cleanData.levels = [
        {
          id: isResolved ? null : row.id,
          screeningLevel: isResolved ? `Level ${activeOrCompletedCount + 1}` : normalizeScreeningLevel(row.screeningLevel),
          inductionRound: isResolved ? '' : (row.inductionRound && row.inductionRound !== '-' ? row.inductionRound : ''),
          inductionDate: isResolved ? todayStr : defaultDate,
          inductionTime: isResolved ? '09:00 AM' : (row.inductionTime && row.inductionTime !== '-' ? normalizeInductionTime(row.inductionTime) : '09:00 AM'),
          trainerName: isResolved ? '' : (row.trainerName && row.trainerName !== '-' ? row.trainerName : ''),
          trainerEmpCode: isResolved ? '' : (row.trainerEmpCode && row.trainerEmpCode !== '-' ? row.trainerEmpCode : ''),
          currentStatus: isResolved ? 'PENDING' : (row.currentStatus || 'PENDING'),
          isActive: isResolved ? true : (row.isActive !== false),
          remarks: isResolved ? '' : (row.remarks || '')
        }
      ];

      setFormData(cleanData);
      setErrors({});
      setIsReassignMode(false);
      setDialogOpen(true);
    } catch (err) {
      console.error('History fetch error:', err);
      const todayStr = getCurrentDateString();
      let defaultDate = todayStr;
      if (row.inductionDate && row.inductionDate !== '-') {
        const localRowDate = toLocalDateStr(row.inductionDate);
        if (localRowDate >= todayStr) {
          defaultDate = localRowDate;
        }
      }
      const isResolved = row.isVirtual || row.currentStatus === 'COMPLETED' || row.currentStatus === 'REJECTED';
      setFormData({
        empCode: row.empCode,
        empName: row.empName || row.employeeName,
        department: row.department,
        designation: row.designation,
        oldEmpCode: row.oldEmpCode,
        empLevelId: row.empLevelId || '',
        levels: [
          {
            id: isResolved ? null : row.id,
            screeningLevel: isResolved ? 'Level 1' : normalizeScreeningLevel(row.screeningLevel),
            inductionRound: isResolved ? '' : (row.inductionRound && row.inductionRound !== '-' ? row.inductionRound : ''),
            inductionDate: isResolved ? todayStr : defaultDate,
            inductionTime: isResolved ? '09:00 AM' : (row.inductionTime && row.inductionTime !== '-' ? normalizeInductionTime(row.inductionTime) : '09:00 AM'),
            trainerName: isResolved ? '' : (row.trainerName && row.trainerName !== '-' ? row.trainerName : ''),
            trainerEmpCode: isResolved ? '' : (row.trainerEmpCode && row.trainerEmpCode !== '-' ? row.trainerEmpCode : ''),
            currentStatus: isResolved ? 'PENDING' : (row.currentStatus || 'PENDING'),
            isActive: isResolved ? true : (row.isActive !== false),
            remarks: isResolved ? '' : (row.remarks || '')
          }
        ]
      });
      setIsReassignMode(false);
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  }, [setErrors]);

  const columns = useMemo(() => [
    { id: 'index', label: 'No', minWidth: 50, render: (row, idx, page, size) => (page * size) + idx + 1 },
    { id: 'empCode', label: 'EmpCode', bold: true, minWidth: 100, render: (row) => row.empCode || '-' },
    { id: 'empName', label: 'Employee Name', minWidth: 180 },
    { id: 'department', label: 'Department', minWidth: 150 },
    { id: 'designation', label: 'Designation', minWidth: 150 },
    {
      id: 'inductionStatus',
      label: 'Induction Status',
      minWidth: 130,
      render: (row) => {
        const isComp = String(row.inductionStatus || '').toUpperCase().trim() === 'COMPLETED';
        return <BOSStatusChip status={isComp ? 'COMPLETED' : 'PENDING'} showIcon width={130} />;
      }
    },
    { id: 'updatedUser', label: 'Updated By', minWidth: 120, render: (row) => row.updatedUser || row.updatedBy || '-' },
    {
      id: 'updatedDate',
      label: 'Updated Date',
      minWidth: 150,
      render: (row) => formatDateTime(row.updatedAt || row.updatedDate || row.createdDate || row.createdAt)
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <Tooltip title={row.isVirtual ? "Assign Now" : "Edit Assignment"}>
            <span>
              <IconButton
                onClick={() => handleAssign(row)}
                size="small"
                color={row.isVirtual ? "primary" : "secondary"}
                disabled={!perms.write}
              >
                {row.isVirtual ? <IconUserPlus size={18} /> : <IconEdit size={18} />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )
    }
  ], [handleAssign, perms.write, perms.delete]);

  const currentLevelOptions = useMemo(() => {
    const optionsSet = new Set(LEVEL_OPTIONS);
    if (formData && formData.levels) {
      formData.levels.forEach(level => {
        const norm = normalizeScreeningLevel(level.screeningLevel);
        if (norm) {
          optionsSet.add(norm);
        }
      });
    }
    if (history) {
      history.forEach(h => {
        const norm = normalizeScreeningLevel(h.screeningLevel);
        if (norm) {
          optionsSet.add(norm);
        }
      });
    }
    return Array.from(optionsSet).sort((a, b) => {
      const aNum = parseInt(a.replace(/^\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.replace(/^\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });
  }, [formData, history]);

  const fetchRows = useCallback(async () => {
    if (!perms.enabled) {
      setRows([]);
      setEmployees([]);
      return;
    }
    setLoading(true);
    try {
      const [assignRes, empRes] = await Promise.all([
        axios.get('/api/hr/induction-assignment'),
        axios.get('/api/master/hr/employees/filter/active')
      ]);

      const assignments = assignRes.data;
      const allActiveEmployees = empRes.data;

      const finalRows = [];
      allActiveEmployees.forEach(emp => {
        const empCodeToMatch = emp.empCode;
        const empAssignments = (assignments || []).filter(a => a.empCode === empCodeToMatch || (a.codeInMaster && a.codeInMaster === empCodeToMatch));
        const empDeptRaw = emp && typeof emp.department === 'object' ? emp.department?.departmentName : emp.department;
        const empDept = empDeptRaw ? empDeptRaw.toUpperCase() : '';
        const empDesig = emp && typeof emp.designation === 'object' ? emp.designation?.designationName : emp.designation;

        const displayEmpCode = emp.empCode || '-';

        if (empAssignments.length === 0) {
          const creator = emp.createdUser || emp.createdBy;
          const updater = emp.updatedUser || emp.updatedBy;
          const lastUpdater = updater || creator || '-';

          finalRows.push({
            ...emp,
            empCode: emp.empCode,
            id: `virtual-${emp.empCode}`,
            employeeId: emp.id,
            empName: emp.employeeName,
            department: empDept,
            designation: empDesig,
            isVirtual: true,
            currentStatus: 'PENDING',
            inductionRound: '-',
            screeningLevel: '-',
            inductionStatus: emp.inductionStatus || 'PENDING',
            dbInductionStatus: null,
            dbCurrentStatus: 'PENDING',
            updatedUser: lastUpdater,
            updatedBy: lastUpdater
          });
        } else {
          // Sort assignments by screening level descending, then by ID descending
          const sorted = [...empAssignments].sort((a, b) => {
            const aNum = parseInt(a.screeningLevel?.replace(/^\D+/g, ''), 10) || 0;
            const bNum = parseInt(b.screeningLevel?.replace(/^\D+/g, ''), 10) || 0;
            if (aNum !== bNum) return bNum - aNum;
            return (b.id || 0) - (a.id || 0);
          });

          // Prioritize ACTIVE status assignments
          const activeAssign = sorted.find(a => a.isActive !== false) || sorted[0];

          const lastUpdater = activeAssign ? (activeAssign.updatedBy || activeAssign.createdBy || activeAssign.updatedUser || activeAssign.createdUser || '-') : '-';

          finalRows.push({
            ...emp,
            ...activeAssign,
            empCode: emp.empCode,
            id: activeAssign.id,
            employeeId: emp.id,
            empName: emp.employeeName,
            department: (empDept || activeAssign.department || '').toUpperCase(),
            designation: empDesig || activeAssign.designation,
            screeningLevel: normalizeScreeningLevel(activeAssign.screeningLevel),
            inductionTime: normalizeInductionTime(activeAssign.inductionTime),
            isVirtual: false,
            isActive: activeAssign ? activeAssign.isActive !== false : true,
            inductionStatus: emp.inductionStatus || 'PENDING',
            dbInductionStatus: activeAssign ? (activeAssign.inductionStatus || null) : null,
            dbCurrentStatus: activeAssign ? (activeAssign.currentStatus || 'PENDING') : 'PENDING',
            updatedUser: lastUpdater,
            updatedBy: lastUpdater
          });
        }
      });

      setRows(finalRows);
      setEmployees(allActiveEmployees);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [perms.enabled]);

  useEffect(() => {
    if (!perms.loading) {
      fetchRows();
    }
  }, [fetchRows, perms.loading]);

  // Fetch dynamic round options from master table
  useEffect(() => {
    const fetchRounds = async () => {
      try {
        const { data } = await axios.get('/api/hr/induction-round/active');
        if (data && data.length > 0) {
          setRoundOptions(data.map(r => r.roundName));
        }
      } catch (err) {
        console.error('Failed to fetch induction rounds, using defaults:', err);
      }
    };
    fetchRounds();
  }, []);

  const [deleteHistoryOpen, setDeleteHistoryOpen] = useState(false);
  const [historyItemToDelete, setHistoryItemToDelete] = useState(null);

  const handleCardReschedule = (levelNum) => {
    const lvlName = `Level ${levelNum}`;
    const levelHistory = history.filter(h => normalizeScreeningLevel(h.screeningLevel) === lvlName);
    const activeItem = levelHistory.find(h => {
      const isRescheduled = history.some(other =>
        other.id !== h.id &&
        normalizeScreeningLevel(other.screeningLevel) === normalizeScreeningLevel(h.screeningLevel) &&
        other.isActive !== false &&
        (other.id > h.id || new Date(other.inductionDate) > new Date(h.inductionDate))
      );
      const recordActive = h.isActive !== false;
      return recordActive && !isRescheduled;
    });

    if (activeItem) {
      setFormData(prev => ({
        ...prev,
        levels: [
          {
            id: activeItem.id,
            screeningLevel: normalizeScreeningLevel(activeItem.screeningLevel),
            inductionRound: activeItem.inductionRound || '',
            inductionDate: activeItem.inductionDate ? toLocalDateStr(activeItem.inductionDate) : getCurrentDateString(),
            inductionTime: activeItem.inductionTime ? normalizeInductionTime(activeItem.inductionTime) : '09:00 AM',
            trainerName: activeItem.trainerName || '',
            trainerEmpCode: activeItem.trainerEmpCode || '',
            currentStatus: activeItem.currentStatus || 'PENDING',
            isActive: activeItem.isActive !== false,
            remarks: activeItem.remarks || ''
          }
        ]
      }));
      setIsReassignMode(true);
      setDialogOpen(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const nextState = { ...prev, [name]: value };
      if (name === 'inductionDate') {
        const today = getCurrentDateString();
        if (value === today) {
          nextState.inductionTime = getCurrentTimeString();
        }
      }
      return nextState;
    });
    if (errors[name]) clearErrors(name);
  };

  const handleLevelInputChange = (index, fieldName, value) => {
    setFormData(prev => {
      let updatedLevels = [...prev.levels];
      updatedLevels[index] = { ...updatedLevels[index], [fieldName]: value };

      // Auto-propagate date/time offsets for subsequent levels from level 1 (index 0)
      if (index === 0) {
        if (fieldName === 'inductionDate') {
          for (let i = 1; i < updatedLevels.length; i++) {
            updatedLevels[i].inductionDate = value;
          }
        } else if (fieldName === 'inductionTime') {
          for (let i = 1; i < updatedLevels.length; i++) {
            updatedLevels[i].inductionTime = add30Minutes(updatedLevels[i - 1].inductionTime);
          }
        }
      }

      if (fieldName === 'inductionRound') {
        updatedLevels[index].trainerEmpCode = '';
        updatedLevels[index].trainerName = '';
      }

      if (fieldName === 'screeningLevel' && value) {
        const normValue = normalizeScreeningLevel(value);
        const duplicateInForm = updatedLevels.some((l, idx) => idx !== index && normalizeScreeningLevel(l.screeningLevel) === normValue);
        const duplicateInHistory = history.some(h =>
          normalizeScreeningLevel(h.screeningLevel) === normValue &&
          h.currentStatus !== 'REJECTED' &&
          h.isActive !== false
        );

        if (duplicateInForm || duplicateInHistory) {
          updatedLevels[index] = { ...updatedLevels[index], screeningLevel: '' };
          dispatch(openSnackbar({
            open: true,
            message: `${normValue} is already assigned or in history.`,
            variant: 'alert',
            severity: 'warning'
          }));
          return { ...prev, levels: updatedLevels };
        }
        updatedLevels[index] = {
          ...updatedLevels[index],
          currentStatus: 'PENDING'
        };
      }
      return { ...prev, levels: updatedLevels };
    });

    const errorKey = `level_${index}_${fieldName}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const handleAddLevel = () => {
    const uniqueScheduledOrCompletedLevels = new Set();
    history.forEach(h => {
      if (h.currentStatus === 'COMPLETED' || h.isActive !== false) {
        const lvlName = normalizeScreeningLevel(h.screeningLevel);
        if (lvlName) uniqueScheduledOrCompletedLevels.add(lvlName);
      }
    });

    const levelsInUse = new Set(uniqueScheduledOrCompletedLevels);
    (formData.levels || []).forEach(l => {
      const lvlName = normalizeScreeningLevel(l.screeningLevel);
      if (lvlName) levelsInUse.add(lvlName);
    });

    let nextLevelNum = 1;
    while (levelsInUse.has(`Level ${nextLevelNum}`)) {
      nextLevelNum++;
    }

    setFormData(prev => {
      const prevLevel = prev.levels[prev.levels.length - 1];
      const newDate = prevLevel ? prevLevel.inductionDate : new Date().toISOString().split('T')[0];
      const newTime = prevLevel ? add30Minutes(prevLevel.inductionTime) : '09:00 AM';

      return {
        ...prev,
        levels: [
          ...prev.levels,
          {
            id: null,
            screeningLevel: `Level ${nextLevelNum}`,
            inductionRound: '',
            inductionDate: newDate,
            inductionTime: newTime,
            trainerName: '',
            trainerEmpCode: '',
            currentStatus: 'PENDING',
            isActive: true,
            remarks: ''
          }
        ]
      };
    });
  };

  const handleRemoveLevel = (index) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteHistoryItem = async (item) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/hr/induction-assignment/${item.id}/check-references`);
      if (data && data.isUsed) {
        dispatch(openSnackbar({
          open: true,
          message: 'Cannot delete this induction assignment because it is already used in training records.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        return;
      }
      setHistoryItemToDelete(item);
      setDeleteHistoryOpen(true);
    } catch (err) {
      console.error('Check references error:', err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to verify references for induction assignment',
        variant: 'alert',
        severity: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteHistoryItem = async () => {
    if (!historyItemToDelete) return;
    try {
      await axios.delete(`/api/hr/induction-assignment/${historyItemToDelete.id}`);
      dispatch(openSnackbar({ open: true, message: 'Induction record deleted successfully', variant: 'alert', severity: 'success' }));

      const { data } = await axios.get(`/api/hr/induction-assignment/employee/${formData.empCode}`);
      const normalizedHistory = (data || [])
        .map(h => ({
          ...h,
          screeningLevel: normalizeScreeningLevel(h.screeningLevel),
          inductionTime: normalizeInductionTime(h.inductionTime)
        }))
        .sort((a, b) => {
          const aNum = parseInt(a.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
          const bNum = parseInt(b.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
          return aNum - bNum;
        });
      setHistory(normalizedHistory);

      setFormData(prev => {
        const updatedLevels = (prev.levels || []).map(level => {
          if (level.id === historyItemToDelete.id) {
            return {
              ...level,
              id: null
            };
          }
          return level;
        });
        return { ...prev, levels: updatedLevels };
      });

      fetchRows();
    } catch (err) {
      console.error('Delete error:', err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Failed to delete record';
      let displayMsg = 'Failed to delete record';
      if (typeof errMsg === 'string' && (
        errMsg.toLowerCase().includes('conflict') ||
        errMsg.toLowerCase().includes('reference') ||
        errMsg.toLowerCase().includes('constraint') ||
        errMsg.toLowerCase().includes('training')
      )) {
        displayMsg = 'Cannot delete this induction assignment because it is already used in training records.';
      } else if (typeof errMsg === 'string') {
        displayMsg = errMsg;
      }
      dispatch(openSnackbar({
        open: true,
        message: displayMsg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    } finally {
      setDeleteHistoryOpen(false);
      setHistoryItemToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.empCode) {
      dispatch(openSnackbar({ open: true, message: 'Employee Code is mandatory', variant: 'alert', severity: 'error' }));
      return;
    }

    let validationFailed = false;
    const newErrors = {};

    formData.levels.forEach((level, index) => {
      if (!level.screeningLevel || level.screeningLevel === '-') {
        newErrors[`level_${index}_screeningLevel`] = 'Screening Level is required';
        validationFailed = true;
      }
      if (!level.inductionRound || level.inductionRound === '-') {
        newErrors[`level_${index}_inductionRound`] = 'Round is required';
        validationFailed = true;
      }
      // Removed restriction blocking MANAGEMENT round for non-top-two-level trainees
      if (!level.inductionDate) {
        newErrors[`level_${index}_inductionDate`] = 'Induction Date is required';
        validationFailed = true;
      }
      if (!level.inductionTime) {
        newErrors[`level_${index}_inductionTime`] = 'Induction Time is required';
        validationFailed = true;
      }
      if (level.inductionDate && level.inductionTime) {
        const schedDateTime = parseInductionDateTime(level.inductionDate, level.inductionTime);
        if (schedDateTime && schedDateTime < new Date()) {
          newErrors[`level_${index}_inductionTime`] = 'Induction Date/Time cannot be in the past';
          validationFailed = true;
        }
      }
      if (index > 0 && level.inductionDate && level.inductionTime) {
        const prevLevel = formData.levels[index - 1];
        if (prevLevel.inductionDate && prevLevel.inductionTime) {
          const prevDateTime = parseInductionDateTime(prevLevel.inductionDate, prevLevel.inductionTime);
          const currentDateTime = parseInductionDateTime(level.inductionDate, level.inductionTime);
          if (prevDateTime && currentDateTime) {
            const diffMinutes = (currentDateTime - prevDateTime) / (1000 * 60);
            if (diffMinutes < 30) {
              newErrors[`level_${index}_inductionTime`] = `Time must be at least 30 minutes after ${prevLevel.screeningLevel} (${prevLevel.inductionTime})`;
              validationFailed = true;
            }
          }
        }
      }
      if (!level.trainerName) {
        newErrors[`level_${index}_trainerName`] = 'Trainer Name is required';
        validationFailed = true;
      }
    });

    if (validationFailed) {
      setErrors(newErrors);
      dispatch(openSnackbar({ open: true, message: 'Please fill the mandatory field', variant: 'alert', severity: 'error' }));
      return;
    }

    // Map all dynamic levels to payloads
    const payloads = formData.levels.map(level => {
      const pay = {
        empCode: formData.empCode,
        empName: formData.empName,
        oldEmpCode: formData.oldEmpCode,
        department: formData.department,
        designation: formData.designation,
        inductionRound: level.inductionRound,
        screeningLevel: normalizeScreeningLevel(level.screeningLevel),
        inductionDate: level.inductionDate,
        inductionTime: normalizeInductionTime(level.inductionTime),
        trainerName: level.trainerName,
        trainerEmpCode: level.trainerEmpCode || '',
        currentStatus: level.currentStatus,
        isActive: level.isActive !== false,
        remarks: level.remarks
      };
      if (level.id) {
        pay.id = level.id;
      }
      return pay;
    });

    // Sort payloads sequentially by screeningLevel
    payloads.sort((a, b) => {
      const aNum = parseInt(a.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
      const bNum = parseInt(b.screeningLevel.replace(/^\D+/g, ''), 10) || 0;
      return aNum - bNum;
    });

    try {
      if (payloads.length === 1 && payloads[0].id) {
        await axios.put(`/api/hr/induction-assignment/${payloads[0].id}`, payloads[0]);
      } else {
        // Bulk save/POST
        await axios.post('/api/hr/induction-assignment', payloads);
      }
      dispatch(openSnackbar({ open: true, message: 'Assignment saved successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Save error details:', error);
      const message = typeof error === 'string'
        ? error
        : (error.response?.data?.message || error.response?.data || error.message || error.error || 'Failed to save');

      dispatch(openSnackbar({
        open: true,
        message: message,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  const resolvedRows = useMemo(() => {
    const statusVal = globalFilters.status || 'ALL';
    const term = globalQuery ? globalQuery.trim().toLowerCase().replace(/\s+/g, ' ') : '';

    // 1. Filter by status
    let filtered = rows.filter(row => {
      if (!matchCommonDateFilters(row, globalFilters, 'createdDate', null)) return false;

      if (statusVal === 'ALL') {
        if (!term) {
          const indStatus = String(row.inductionStatus || '').toUpperCase().trim();
          if (indStatus === 'COMPLETED') return false;
        }
        return true;
      }

      const indStatus = String(row.inductionStatus || '').toUpperCase().trim();
      const currStatus = String(row.currentStatus || '').toUpperCase().trim();
      const dbCurrStatus = String(row.dbCurrentStatus || '').toUpperCase().trim();

      if (statusVal === 'PENDING') return indStatus === 'PENDING';
      if (statusVal === 'COMPLETED') return indStatus === 'COMPLETED';
      if (statusVal === 'RESCHEDULE' || statusVal === 'RESCHEDULED') return currStatus === 'RESCHEDULE' || currStatus === 'RESCHEDULED' || dbCurrStatus === 'RESCHEDULE' || dbCurrStatus === 'RESCHEDULED';
      if (statusVal === 'TRAINING GIVEN') return currStatus === 'TRAINING GIVEN' || dbCurrStatus === 'TRAINING GIVEN';
      return true;
    });

    // 2. Strict search scoring (Exact > StartsWith > Word-Prefix only — no contains fallback)
    if (term) {
      const getFieldScore = (fieldValue) => {
        if (!fieldValue) return 0;
        const val = String(fieldValue).toLowerCase().trim().replace(/\s+/g, ' ');
        if (val === term) return 1;
        if (val.startsWith(term)) return 2;
        const words = val.split(' ');
        for (let wi = 0; wi < words.length; wi++) {
          if (words[wi].startsWith(term)) return 3;
        }
        return 0;
      };

      const getRowScore = (row) => {
        const fields = [
          row.empCode, row.empName, row.department, row.designation,
          row.updatedUser || row.updatedBy,
          row.currentStatus, row.dbCurrentStatus,
          row.inductionStatus, row.dbInductionStatus
        ];
        let best = 0;
        for (let fi = 0; fi < fields.length; fi++) {
          const s = getFieldScore(fields[fi]);
          if (s > 0 && (best === 0 || s < best)) best = s;
        }
        return best;
      };

      const scored = filtered
        .map(row => ({ row, score: getRowScore(row) }))
        .filter(x => x.score > 0);
      scored.sort((a, b) => a.score - b.score);
      filtered = scored.map(x => x.row);
    }

    return filtered.map((r, i) => ({
      ...r,
      index: i + 1,
      createdUser: r.createdUser || r.createdBy || '-',
      updatedUser: r.updatedUser || r.updatedBy || '-',
      createdDate: (r.createdDate || r.createdAt) ? new Date(r.createdDate || r.createdAt).toLocaleString('en-GB') : '-',
      updatedDate: (r.updatedDate || r.updatedAt) ? new Date(r.updatedDate || r.updatedAt).toLocaleString('en-GB') : '-'
    }));
  }, [rows, globalFilters, globalQuery]);

  const renderProgressionStepper = () => {
    const maxLevels = parseInt(screenLevelLimit, 10) || 3;
    const steps = [];

    for (let i = 1; i <= maxLevels; i++) {
      const lvlName = `Level ${i}`;
      const levelHistory = history.filter(h => normalizeScreeningLevel(h.screeningLevel) === lvlName);
      const completedItem = levelHistory.find(h => h.currentStatus === 'COMPLETED');
      const rejectedItem = levelHistory.find(h => h.currentStatus === 'REJECTED');
      const activeItem = levelHistory.find(h => {
        const isRescheduled = history.some(other =>
          other.id !== h.id &&
          normalizeScreeningLevel(other.screeningLevel) === normalizeScreeningLevel(h.screeningLevel) &&
          other.isActive !== false &&
          (other.id > h.id || new Date(other.inductionDate) > new Date(h.inductionDate))
        );
        const recordActive = h.isActive !== false;
        return recordActive && !isRescheduled;
      });
      const isCurrentForm = formData.levels && formData.levels.some(l => normalizeScreeningLevel(l.screeningLevel) === lvlName);

      let stepStatus = 'LOCKED';
      let trainerName = '';

      if (completedItem) {
        stepStatus = 'COMPLETED';
        trainerName = completedItem.trainerName;
      } else if (rejectedItem) {
        stepStatus = 'REJECTED';
        trainerName = rejectedItem.trainerName;
      } else if (activeItem) {
        stepStatus = 'ACTIVE';
        trainerName = activeItem.trainerName;
      } else if (isCurrentForm) {
        stepStatus = 'CURRENT';
        trainerName = formData.levels[0].trainerName;
      } else {
        const allPrevCompleted = Array.from({ length: i - 1 }, (_, idx) => `Level ${idx + 1}`)
          .every(prevLvlName => history.some(h => normalizeScreeningLevel(h.screeningLevel) === prevLvlName && h.currentStatus === 'COMPLETED'));

        if (allPrevCompleted) {
          stepStatus = 'READY';
        } else {
          stepStatus = 'LOCKED';
        }
      }

      steps.push({ levelNum: i, lvlName, status: stepStatus, trainerName });
    }

    return (
      <Box sx={{ mb: 1.25 }}>
        <Typography variant="h5" sx={{ mb: 0.75, color: 'primary.main', fontWeight: 600 }}>Induction Progression Status</Typography>
        <Stack direction="row" spacing={1} sx={{ width: '100%', overflowX: 'auto', pb: 0.75 }}>
          {steps.map((step) => {
            let bgcolor = 'grey.100';
            let bordercolor = 'grey.300';
            let color = 'text.secondary';
            let label = 'Locked';

            if (step.status === 'COMPLETED') {
              bgcolor = 'success.lighter';
              bordercolor = 'success.main';
              color = 'success.dark';
              label = 'Completed';
            } else if (step.status === 'REJECTED') {
              bgcolor = 'error.lighter';
              bordercolor = 'error.main';
              color = 'error.dark';
              label = 'Rejected';
            } else if (step.status === 'ACTIVE') {
              bgcolor = 'warning.lighter';
              bordercolor = 'warning.main';
              color = 'warning.dark';
              label = 'Active Training';
            } else if (step.status === 'CURRENT') {
              bgcolor = 'primary.lighter';
              bordercolor = 'primary.main';
              color = 'primary.dark';
              label = 'Assigning Now';
            } else if (step.status === 'READY') {
              bgcolor = 'info.lighter';
              bordercolor = 'info.main';
              color = 'info.dark';
              label = 'Ready to Assign';
            }

            return (
              <Box
                key={step.levelNum}
                sx={{
                  flex: 1,
                  minWidth: '160px',
                  p: 2,
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: bordercolor,
                  bgcolor: bgcolor,
                  color: color,
                  textAlign: 'center',
                  boxShadow: step.status === 'CURRENT' ? '0 4px 12px rgba(33, 150, 243, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>Level {step.levelNum}</Typography>
                <Chip
                  label={label}
                  size="small"
                  sx={{
                    bgcolor: bordercolor,
                    color: step.status === 'LOCKED' ? 'text.secondary' : 'common.white',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mb: 1
                  }}
                />
                {step.trainerName && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
                    Trainer: {step.trainerName}
                  </Typography>
                )}
                {(step.status === 'ACTIVE' || step.status === 'CURRENT') && (
                  <Box sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => handleCardReschedule(step.levelNum)}
                      sx={{
                        fontSize: '0.75rem',
                        py: 0.35,
                        px: 1.2,
                        textTransform: 'none',
                        borderRadius: '6px'
                      }}
                    >
                      Reassign
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  };

  const exportColumns = useMemo(() => [
    { id: 'empCode', header: 'EmpCode', key: (row) => row.empCode || '-' },
    { id: 'empName', header: 'Employee Name', key: (row) => row.empName || '-' },
    { id: 'department', header: 'Department', key: (row) => row.department || '-' },
    { id: 'designation', header: 'Designation', key: (row) => row.designation || '-' },
    { id: 'inductionStatus', header: 'Induction Status', key: (row) => row.inductionStatus || 'Pending' },
    { id: 'updatedUser', header: 'Updated By', key: (row) => row.updatedUser || row.updatedBy || '-' },
    { id: 'updatedDate', header: 'Updated Date', key: (row) => formatDateTime(row.updatedAt || row.updatedDate || row.createdDate || row.createdAt) }
  ], []);

  if (perms.loading) {
    return null;
  }

  return (
    <MainCard fullWidth
      title="Employee Induction Summary"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Induction_Summary"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        id="induction-assignment-table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onDoubleClickRow={perms.write ? handleAssign : undefined}
        onEditRow={perms.write ? handleAssign : undefined}
        disableSearchFilter={true}
        showActions={false}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setIsReassignMode(false);
        }}
        title={formData.id ? 'Update Induction Process' : 'Assign Induction Process'}
        fullWidth
        maxWidth="md"
        onSave={perms.write && !isAllLevelsCompleted ? handleSave : null}
        saveButtonLabel={getSaveButtonLabel()}
        saveIcon={getSaveButtonLabel() === 'Reassign' ? <IconUserPlus size={20} /> : (getSaveButtonLabel() === 'Reschedule' ? <IconCalendarEvent size={20} /> : null)}
        onClear={perms.write ? () => {
          setFormData(prev => ({
            ...prev,
            levels: [
              {
                id: null,
                screeningLevel: 'Level 1',
                inductionRound: '',
                inductionDate: new Date().toISOString().split('T')[0],
                inductionTime: '09:00 AM',
                trainerName: '',
                trainerEmpCode: '',
                currentStatus: 'PENDING',
                isActive: true,
                remarks: ''
              }
            ]
          }));
          setErrors({});
          setIsReassignMode(false);
        } : null}
      >
        {/* Summary Header */}
        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 2, mb: 0.75, display: 'flex', flexWrap: 'wrap', gap: 4, border: '1px solid', borderColor: 'divider' }}>
          <Box><Typography variant="caption" color="textSecondary">DEPARTMENT</Typography><Typography variant="subtitle1" fontWeight={700}>{formData.department || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">POSITION</Typography><Typography variant="subtitle1" fontWeight={700}>{formData.designation || '-'}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">LEVEL</Typography><Typography variant="subtitle1" fontWeight={700}>{levelName}</Typography></Box>
          <Box><Typography variant="caption" color="textSecondary">SCREEN LEVEL</Typography><Typography variant="subtitle1" fontWeight={700}>{screenLevelLimit}</Typography></Box>
        </Box>

        {/* Minimum levels requirement notice */}
        {(() => {
          const empLevelCode = levelName.trim().toUpperCase();
          const limit = (screenLevelLimit && screenLevelLimit !== '-') ? parseInt(screenLevelLimit, 10) : (empLevelCode === 'L6' || empLevelCode === 'L7' ? 3 : 2);
          const message = `This employee is at ${empLevelCode}. A minimum of ${limit} induction rounds are required to be conducted for this employee.`;
          const isHigherLevel = limit >= 3;
          if (!empLevelCode || empLevelCode === '-') return null;
          return (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, p: 1.5, borderRadius: 1.5, bgcolor: isHigherLevel ? 'warning.lighter' : 'info.lighter', border: '1px solid', borderColor: isHigherLevel ? 'warning.light' : 'info.light' }}>
              <Box sx={{ color: isHigherLevel ? 'warning.dark' : 'info.dark', mt: 0.2, flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </Box>
              <Typography variant="body2" sx={{ color: isHigherLevel ? 'warning.dark' : 'info.dark', fontWeight: 500 }}>
                {message}
              </Typography>
            </Box>
          );
        })()}

        {renderProgressionStepper()}

        {isAllLevelsCompleted ? (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', borderRadius: 2, border: '1px solid', borderColor: 'success.main', mb: 3 }}>
            <Typography variant="h4" color="success.dark" fontWeight={700} sx={{ mb: 1 }}>Induction Fully Completed</Typography>
            <Typography variant="body1" color="success.dark">All configured screening levels ({screenLevelLimit}) have been successfully completed for this employee.</Typography>
          </Box>
        ) : (
          <BOSFormSection title="Assign Induction Process">
            {(formData.levels || []).map((level, index) => (
              <Box key={index} sx={{ mb: index < formData.levels.length - 1 ? 1.5 : 0 }}>
                {index > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', my: 1.25 }}>
                    <Divider sx={{ flexGrow: 1 }} />
                    {formData.levels.length > 1 && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveLevel(index)}
                        disabled={!perms.write}
                        sx={{ ml: 2 }}
                      >
                        Remove Level
                      </Button>
                    )}
                  </Box>
                ) : (
                  formData.levels.length > 1 && (
                    <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveLevel(index)}
                        disabled={!perms.write}
                      >
                        Remove Level
                      </Button>
                    </Stack>
                  )
                )}
                <Box sx={{ display: 'flex', gap: 2.5, width: '100%', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <BOSTextField
                      select
                      name="screeningLevel"
                      label="SCREENING LEVEL"
                      value={normalizeScreeningLevel(level.screeningLevel)}
                      onChange={(e) => handleLevelInputChange(index, 'screeningLevel', e.target.value)}
                      required
                      disabled={!perms.write || !!level.id}
                      error={!!errors[`level_${index}_screeningLevel`]}
                      helperText={errors[`level_${index}_screeningLevel`]}
                      sx={errorStyle(!!errors[`level_${index}_screeningLevel`])}
                    >

                      {currentLevelOptions.map(l => (
                        <MenuItem key={l} value={l}>{l}</MenuItem>
                      ))}
                    </BOSTextField>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <BOSTextField
                      select
                      name="inductionRound"
                      label="ROUND"
                      value={level.inductionRound}
                      onChange={(e) => handleLevelInputChange(index, 'inductionRound', e.target.value)}
                      required
                      disabled={!perms.write || (!!level.id && !isReassignMode)}
                      error={!!errors[`level_${index}_inductionRound`]}
                      helperText={errors[`level_${index}_inductionRound`]}
                      sx={errorStyle(!!errors[`level_${index}_inductionRound`])}
                    >

                      {roundOptions
                        .map(r => (
                          <MenuItem key={r} value={r}>{r}</MenuItem>
                        ))}
                    </BOSTextField>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2.5, width: '100%', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <BOSDatePicker
                      name="inductionDate"
                      label="INDUCTION DATE"
                      value={level.inductionDate}
                      onChange={(e) => handleLevelInputChange(index, 'inductionDate', e.target.value)}
                      required
                      disabled={!perms.write}
                      disablePast={true}
                      minDate={new Date()}
                      error={!!errors[`level_${index}_inductionDate`]}
                      helperText={errors[`level_${index}_inductionDate`]}
                      sx={errorStyle(!!errors[`level_${index}_inductionDate`])}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <BOSTimePicker
                      name="inductionTime"
                      label="INDUCTION TIME"
                      value={normalizeInductionTime(level.inductionTime)}
                      onChange={(e) => handleLevelInputChange(index, 'inductionTime', e.target.value)}
                      required
                      disabled={!perms.write}
                      error={!!errors[`level_${index}_inductionTime`]}
                      helperText={errors[`level_${index}_inductionTime`]}
                      sx={errorStyle(!!errors[`level_${index}_inductionTime`])}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2.5, width: '100%', mb: 1, alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <BOSTextField
                      select
                      name="trainerEmpCode"
                      label="INDUCTION PERSON"
                      value={level.trainerEmpCode || ''}
                      onChange={(e) => {
                        const selectedEmp = employees.find(emp => emp.empCode === e.target.value);
                        handleLevelInputChange(index, 'trainerEmpCode', e.target.value);
                        handleLevelInputChange(index, 'trainerName', selectedEmp ? selectedEmp.employeeName : '');
                      }}
                      required
                      disabled={!perms.write || (!!level.id && !isReassignMode)}
                      error={!!errors[`level_${index}_trainerName`]}
                      helperText={errors[`level_${index}_trainerName`]}
                      sx={errorStyle(!!errors[`level_${index}_trainerName`])}
                    >

                      {(() => {
                        const rejectedTrainerCodes = history
                          .filter(h =>
                            normalizeScreeningLevel(h.screeningLevel) === normalizeScreeningLevel(level.screeningLevel) &&
                            h.currentStatus === 'REJECTED'
                          )
                          .map(h => h.trainerEmpCode)
                          .filter(Boolean);
                        return employees
                          .filter(emp => {
                            if (emp.isInductionEligible && String(emp.isInductionEligible).toUpperCase() === 'NO') return false;
                            if (emp.status && emp.status !== 'Active' && emp.status !== 'ACTIVE' && emp.isActive === false) return false;
                            if (rejectedTrainerCodes.includes(emp.empCode)) return false;
                            if (emp.empCode === formData.empCode) return false;

                            const empDept = typeof emp.department === 'object' ? emp.department?.departmentName : emp.department;
                            const round = level.inductionRound;

                            if (round === 'HR') {
                              const deptUpper = (empDept || '').toUpperCase();
                              const hrKeywords = ['HR', 'H.R.', 'HUMAN RESOURCE', 'PEOPLE OPERATIONS', 'PERSONNEL', 'HUMAN CAPITAL', 'HRA'];
                              return hrKeywords.some(keyword => deptUpper.includes(keyword));
                            }
                            if (round === 'QMS') {
                              const deptUpper = (empDept || '').toUpperCase();
                              const qmsKeywords = ['QMS', 'QUALITY', 'Q.M.S.', 'QM', 'Q.M.', 'QA'];
                              return qmsKeywords.some(keyword => deptUpper.includes(keyword));
                            }
                            if (round === 'DEPARTMENT') {
                              return !formData.department || empDept?.toLowerCase() === formData.department?.toLowerCase();
                            }
                            if (round === 'MANAGEMENT') {
                              return topTwoLevelIds.length === 0 || topTwoLevelIds.includes(String(emp.empLevelId));
                            }
                            return true;
                          })
                          .map(emp => {
                            const empDeptStr = typeof emp.department === 'object' ? emp.department?.departmentName : emp.department;
                            return (
                              <MenuItem key={emp.id || emp.empCode} value={emp.empCode}>
                                {emp.employeeName || emp.empName} ({emp.empCode}){empDeptStr ? ` - ${empDeptStr}` : ''}
                              </MenuItem>
                            );
                          });
                      })()}
                    </BOSTextField>
                  </Box>
                </Box>
              </Box>
            ))}
            {perms.write && totalLevelsCount < (parseInt(screenLevelLimit, 10) || 4) && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddLevel}
                >
                  Add Level
                </Button>
              </Box>
            )}
          </BOSFormSection>
        )}

        {/* History Table */}
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="h5" sx={{ mb: 0.75, color: 'primary.main', fontWeight: 600 }}>Induction History</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', maxHeight: '300px', overflowY: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell align="center" sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Screening Level</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Round</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Induction by</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Induction Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Rescheduled</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>CREATED USER</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                      No history found
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((h, i) => {
                    const isRescheduled = history.some(other =>
                      other.id !== h.id &&
                      normalizeScreeningLevel(other.screeningLevel) === normalizeScreeningLevel(h.screeningLevel) &&
                      other.isActive !== false &&
                      (other.id > h.id || new Date(other.inductionDate) > new Date(h.inductionDate))
                    );
                    let recordStatus = (h.isActive !== false && !isRescheduled) ? 'Active' : 'In Active';
                    let statusColor = recordStatus === 'Active' ? 'success' : 'default';
                    return (
                      <TableRow key={`${h.id || 'row'}_${i}`} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell align="center">{i + 1}</TableCell>
                        <TableCell>{h.screeningLevel || '-'}</TableCell>
                        <TableCell>{h.inductionRound || '-'}</TableCell>
                        <TableCell>{h.inductionDate ? `${formatDateDDMMYYYY(h.inductionDate)} ${formatTime12h(h.inductionTime)}` : '-'}</TableCell>
                        <TableCell>{h.trainerName || '-'}</TableCell>
                        <TableCell>
                          <BOSStatusChip status={h.currentStatus || 'PENDING'} showIcon width={130} />
                        </TableCell>
                        <TableCell>{isRescheduled ? 'YES' : 'NO'}</TableCell>
                        <TableCell>{(h.createdUser || h.createdBy) || '-'}</TableCell>
                        <TableCell>
                          <BOSStatusChip status={recordStatus} showIcon width={120} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          try {
            await axios.delete(`/api/hr/induction-assignment/${deleteTarget.id}`);
            dispatch(openSnackbar({ open: true, message: 'Induction assignment deleted successfully', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            fetchRows();
          } catch (error) {
            const msg = error.response?.data?.message || error.response?.data || 'Failed to delete assignment';
            dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error' }));
          }
        }}
        title="Delete Induction Assignment"
        message={`Are you sure you want to delete the induction assignment for ${deleteTarget?.empName || deleteTarget?.empCode || 'this employee'}? This will mark the record as inactive.`}
        itemName={deleteTarget?.empName || deleteTarget?.empCode}
      />

      <ConfirmDeleteDialog
        open={deleteHistoryOpen}
        onClose={() => setDeleteHistoryOpen(false)}
        onConfirm={confirmDeleteHistoryItem}
        title="Delete Induction Assignment"
        message="Are you sure you want to delete this induction assignment?"
        itemName={historyItemToDelete ? `${historyItemToDelete.screeningLevel} - ${historyItemToDelete.inductionRound}` : ''}
      />
    </MainCard>
  );
};

export default InductionAssignment;
