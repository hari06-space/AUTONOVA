import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  MenuItem,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconUserPlus, IconUsersGroup, IconClipboardList, IconUserCog, IconX } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';
import { BOSDataTable, BOSTextField, BOSAutocomplete, BOSDatePicker, btnCancel, BOSStatusChip, BOSFormDialog, BOSFormSection } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useLookups from 'hooks/useLookups';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { format } from 'date-fns';

const getEmployeeName = (idOrCodeOrName, employeesList = []) => {
  if (!idOrCodeOrName || idOrCodeOrName === '-') return '-';
  const parts = String(idOrCodeOrName).split(',').map(p => p.trim());
  const resolvedParts = parts.map(part => {
    const emp = employeesList.find(
      (e) =>
        String(e.id) === String(part) ||
        String(e.empCode) === String(part) ||
        String(e.employeeCode) === String(part) ||
        String(e.employeeName || '').toLowerCase() === String(part).toLowerCase() ||
        String(e.firstName || '').toLowerCase() === String(part).toLowerCase()
    );
    return emp ? (emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || part) : part;
  });
  return resolvedParts.join(', ');
};


export default function ChecklistAssignDialog({ open, onClose, checklistId, initialData }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const lookups = useLookups(['EMPLOYEES', 'DEPARTMENTS']);

  // Helper to extract employee status reliably
  const getEmpStatus = (emp) => {
    if (!emp) return '';
    if (typeof emp.status === 'object' && emp.status !== null) {
      return String(emp.status.name || emp.status.statusName || emp.status.statusCode || '').trim().toUpperCase();
    }
    const val = String(emp.status || emp.employeeStatus || emp.empStatus || '').trim().toUpperCase();
    if (val === '12') return 'ACTIVE';
    return val;
  };

  const isEmpActive = (emp) => {
    if (!emp) return false;
    if (emp.isActive === false) return false;
    const st = getEmpStatus(emp);
    if (!st) return true; // Default to active if status is not specified
    return st === 'ACTIVE' || st === '12';
  };

  // Helper to extract employee department ID and Name reliably
  const getEmpDeptId = (emp) => {
    return String(emp?.departmentId || emp?.department?.id || emp?.deptId || emp?.organization?.departmentId || emp?.organization?.department?.id || '');
  };

  const getEmpDeptName = (emp) => {
    const rawName = emp?.departmentName || emp?.department?.departmentName || emp?.department?.name || emp?.organization?.department?.departmentName || '';
    if (rawName) return String(rawName).trim().toUpperCase();
    const deptId = getEmpDeptId(emp);
    if (deptId) {
      const found = (lookups.departments || []).find(d => String(d.id) === deptId);
      if (found?.departmentName) return String(found.departmentName).trim().toUpperCase();
    }
    return '';
  };

  // Extract allowed department IDs and Names from checklist initialData
  const allowedDeptNames = new Set();
  const allowedDeptIds = new Set();

  if (initialData?.departments && Array.isArray(initialData.departments)) {
    initialData.departments.forEach(d => {
      const name = d.departmentName || d.department?.departmentName || d.name;
      if (name) allowedDeptNames.add(String(name).trim().toUpperCase());
      const dId = d.id || d.departmentId || d.department?.id;
      if (dId) allowedDeptIds.add(String(dId));
    });
  }

  if (initialData?.department && typeof initialData.department === 'string') {
    initialData.department.split(',').forEach(name => {
      if (name.trim()) allowedDeptNames.add(name.trim().toUpperCase());
    });
  }

  // Cross-reference lookup departments by name to collect all matching IDs
  (lookups.departments || []).forEach(d => {
    if (d.departmentName && allowedDeptNames.has(String(d.departmentName).trim().toUpperCase())) {
      allowedDeptIds.add(String(d.id));
    }
  });

  // Filter employees whose department matches one of the checklist's departments,
  // and who are active.
  let filteredEmployees = (lookups.employees || []).filter(emp => {
    // 1. Active status
    if (!isEmpActive(emp)) {
      return false;
    }
    // 2. Department matching by ID or Name if checklist specifies departments
    if (allowedDeptIds.size > 0 || allowedDeptNames.size > 0) {
      const empDId = getEmpDeptId(emp);
      const empDName = getEmpDeptName(emp);
      const matchesId = empDId && allowedDeptIds.has(empDId);
      const matchesName = empDName && allowedDeptNames.has(empDName);
      if (!matchesId && !matchesName) {
        return false;
      }
    }
    return true;
  });

  // Fallback: If department filter yielded 0 results, show all active employees
  if (filteredEmployees.length === 0) {
    filteredEmployees = (lookups.employees || []).filter(emp => isEmpActive(emp));
  }

  const employeeOptions = filteredEmployees.map(e => ({
    label: `${e.employeeName || (e.firstName ? `${e.firstName} ${e.lastName || ''}` : '') || e.name || 'Employee'} (${getEmpDeptName(e) || 'No Dept'})`,
    value: String(e.id),
    status: getEmpStatus(e) || 'ACTIVE'
  }));


  const getTodayString = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTomorrowString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateToDDMMYYYY = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const [holidays, setHolidays] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [formData, setFormData] = useState({
    assignTo: '',
    groupName: '',
    assignType: '',
    checklistDate: getTomorrowString(),
    id: null
  });

  const [dbGroupNames, setDbGroupNames] = useState([]);

  const existingGroupOptions = useMemo(() => {
    const map = new Map();
    dbGroupNames.forEach(g => {
      if (g && String(g).trim() && String(g).trim() !== '-') {
        const upper = String(g).trim().toUpperCase();
        map.set(upper, upper);
      }
    });
    assignments.forEach(a => {
      if (a.groupName && String(a.groupName).trim() && String(a.groupName).trim() !== '-') {
        const upper = String(a.groupName).trim().toUpperCase();
        map.set(upper, upper);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [dbGroupNames, assignments]);

  const [reassignInactiveOpen, setReassignInactiveOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [actionType, setActionType] = useState('REASSIGN'); // 'REASSIGN' or 'INACTIVE'
  const [newAssignee, setNewAssignee] = useState('');
  const [reassignRemarks, setReassignRemarks] = useState('');


  const findHoliday = (date) => {
    if (!date) return null;
    let dStr = '';
    try {
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return null;
        dStr = format(date, 'yyyy-MM-dd');
      } else if (typeof date === 'string') {
        dStr = date.split('T')[0];
      }
    } catch {
      return null;
    }

    for (const h of holidays) {
      if (h.isActive === false) continue;
      const rawStart = h.fromDate || h.holidayDate;
      const rawEnd = h.toDate || rawStart;
      if (rawStart && rawEnd) {
        const start = String(rawStart).slice(0, 10);
        const end = String(rawEnd).slice(0, 10);
        if (dStr >= start && dStr <= end) {
          return h;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (open) {
      axios.get('/api/master/hr/holidays')
        .then(res => {
          setHolidays(res.data || []);
        })
        .catch(err => {
          console.error("Failed to fetch holidays", err);
        });
    } else {
      setHolidays([]);
    }
  }, [open]);

  const handleDateChange = (e) => {
    const val = e.target.value;
    if (val) {
      const dateObj = new Date(val);

      // Enforce tomorrow or later for new assignments
      if (!formData.id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(dateObj);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate <= today) {
          dispatch(openSnackbar({
            open: true,
            message: 'New checklists must be assigned for tomorrow or later.',
            severity: 'error',
            variant: 'alert'
          }));
          setFormData(p => ({ ...p, checklistDate: getTomorrowString() }));
          return;
        }
      }

      const holiday = findHoliday(dateObj);
      if (holiday) {
        dispatch(openSnackbar({
          open: true,
          message: `Checklist cannot be assigned on ${formatDateToDDMMYYYY(dateObj)} because it is marked as a Company Holiday.`,
          severity: 'error',
          variant: 'alert'
        }));
        setFormData(p => ({ ...p, checklistDate: '' }));
        return;
      }
    }
    setFormData(p => ({ ...p, checklistDate: val }));
  };



  const formatAssignTypeLabel = (type) => {
    if (!type) return '';
    if (type === 'PRIMARY') return 'Primary';
    if (type === 'SECONDARY') return 'Secondary';
    if (type === 'TERTIARY') return 'Tertiary';
    if (type === 'NON_OWNER') return 'Non-Owner';
    return type;
  };

  const resolveEmpId = (val) => {
    if (!val) return '';
    const cleanVal = String(val).trim().toLowerCase();
    const emp = (lookups.employees || []).find(e => {
      if (String(e.id) === String(val)) return true;
      if (e.empCode && String(e.empCode).trim().toLowerCase() === cleanVal) return true;
      if (e.employeeCode && String(e.employeeCode).trim().toLowerCase() === cleanVal) return true;
      if (e.employeeName && String(e.employeeName).trim().toLowerCase() === cleanVal) return true;
      const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim().toLowerCase();
      if (fullName && fullName === cleanVal) return true;
      if (e.firstName && String(e.firstName).trim().toLowerCase() === cleanVal) return true;
      return false;
    });
    return emp ? String(emp.id) : String(val);
  };

  const isAssignmentActive = (a) => {
    if (!a) return false;
    if (a.isActive === false) return false;
    if (a.status) {
      const statusName = String(a.status.name || a.status).toUpperCase();
      if (statusName === 'INACTIVE' || statusName === 'CLOSED' || statusName === 'DELETED') {
        return false;
      }
    }
    return true;
  };

  // Get employee IDs already assigned to active role in the selected GROUP (or without group) for this checklist
  const blockedEmployeeNames = useMemo(() => {
    const currentGroup = (formData.groupName || '').trim().toUpperCase();
    return assignments
      .filter(a => {
        if (formData.id && a.id === formData.id) return false;
        if (!isAssignmentActive(a)) return false;
        const aGroup = (a.groupName && a.groupName !== '-' ? a.groupName : '').trim().toUpperCase();
        return aGroup === currentGroup;
      })
      .map(a => resolveEmpId(a.assignedTo))
      .filter(Boolean);
  }, [assignments, formData.id, formData.groupName, lookups.employees]);

  const visibleEmployeeOptions = useMemo(() => {
    return employeeOptions.filter(opt => {
      const optId = resolveEmpId(opt.value);
      return !blockedEmployeeNames.includes(optId) || opt.value === formData.assignTo;
    });
  }, [employeeOptions, blockedEmployeeNames, formData.assignTo, lookups.employees]);

  // Get assign types already assigned in the selected GROUP for this checklist
  const alreadyTakenTypes = useMemo(() => {
    const currentGroup = (formData.groupName || '').trim().toLowerCase();
    return assignments
      .filter(a => {
        if (formData.id && a.id === formData.id) return false;
        if (!isAssignmentActive(a)) return false;
        const aGroup = (a.groupName || '').trim().toLowerCase();
        return aGroup === currentGroup;
      })
      .map(a => a.assignType);
  }, [assignments, formData.id, formData.groupName]);

  const fetchGroupNames = async () => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.CHECKLIST}/assignment-groups`);
      setDbGroupNames(res.data || []);
    } catch (error) {
      console.warn('Failed to fetch group names', error);
    }
  };

  useEffect(() => {
    if (open && checklistId) {
      fetchAssignments();
      fetchGroupNames();
      setSelectedRowId(null);
      setPage(0);
    } else {
      setAssignments([]);
      setDbGroupNames([]);
      setFormData({ assignTo: '', groupName: '', assignType: '', checklistDate: getTomorrowString(), id: null });
      setSelectedRowId(null);
      setPage(0);
    }
  }, [open, checklistId]);

  const ALL_ASSIGN_TYPES = ['PRIMARY', 'SECONDARY', 'TERTIARY'];

  useEffect(() => {
    if (!formData.id && !formData.assignType) {
      setFormData(p => ({ ...p, assignType: 'PRIMARY' }));
    }
  }, [formData.id, formData.assignType]);

  useEffect(() => {
    if (open && initialData && !formData.id && assignments.length === 0 && !formData.assignTo) {
      const creatorCode = initialData.createdBy || initialData.createdUser;
      if (creatorCode) {
        const emp = (lookups.employees || []).find(e =>
          String(e.id) === String(creatorCode) ||
          String(e.empCode) === String(creatorCode) ||
          String(e.employeeCode) === String(creatorCode) ||
          String(e.employeeName).toLowerCase() === String(creatorCode).toLowerCase()
        );
        if (emp && visibleEmployeeOptions.some(opt => String(opt.value) === String(emp.id))) {
          setFormData(prev => {
            if (prev.assignTo === String(emp.id)) return prev;
            return { ...prev, assignTo: String(emp.id) };
          });
        }
      }
    }
  }, [open, initialData, assignments, lookups.employees, visibleEmployeeOptions, formData.id, formData.assignTo]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      fetchGroupNames();
      const res = await axios.get(`${API_PATHS.QMS.CHECKLIST}/assignments?size=100&checklistId=${checklistId}&toDate=3000-01-01&excludeCompleted=true&considerDate=All&assignType=All&taskType=Company`);
      const list = res.data.content || [];
      setAssignments(list);
      setFormData({ assignTo: '', groupName: '', assignType: '', checklistDate: getTomorrowString(), id: null });
    } catch (error) {
      console.error('Failed to fetch assignments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED') {
      dispatch(openSnackbar({ open: true, message: 'The checklist must be verified before it can be assigned.', severity: 'error', variant: 'alert' }));
      return;
    }

    if (!formData.assignTo || !formData.assignType || !formData.checklistDate) {
      dispatch(openSnackbar({ open: true, message: 'Please select Assign To, Assign Type, and Assign Date', severity: 'warning', variant: 'alert' }));
      return;
    }

    const checkDate = new Date(formData.checklistDate);
    if (isNaN(checkDate.getTime())) {
      dispatch(openSnackbar({ open: true, message: 'Invalid assignment date selected', severity: 'error', variant: 'alert' }));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    const isHoliday = (lookups.holidays || []).some(h => {
      const hDate = new Date(h.from_date || h.holiday_date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === checkDate.getTime();
    });

    if (isHoliday) {
      dispatch(openSnackbar({
        open: true,
        message: `Checklist cannot be assigned on ${formatDateToDDMMYYYY(checkDate)} because it is marked as a Company Holiday.`,
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    // Frontend per-group role & duplicate check
    const targetEmpId = resolveEmpId(formData.assignTo);
    const normalizeGroup = (g) => {
      const s = (g || '').trim().toUpperCase();
      return (!s || s === '-') ? '-' : s;
    };
    const targetGroup = normalizeGroup(formData.groupName);

    // 1. Same group cannot have 2 assignments with the same assignType (e.g. 2 Primary in Group A)
    const sameGroupHasRole = assignments.some(a => {
      if (formData.id && a.id === formData.id) return false;
      if (!isAssignmentActive(a)) return false;
      const aGroup = normalizeGroup(a.groupName);
      const sameType = String(a.assignType).toUpperCase() === String(formData.assignType).toUpperCase();
      return aGroup === targetGroup && sameType;
    });

    if (sameGroupHasRole && !formData.id) {
      dispatch(openSnackbar({
        open: true,
        message: `Group '${targetGroup}' already has a ${formatAssignTypeLabel(formData.assignType)} assignment!`,
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    // 2. Same person cannot be assigned to another group for the SAME assignType (e.g. Primary in Group 1 and Primary in Group 2)
    const targetType = String(formData.assignType).toUpperCase();
    const samePersonHasTypeInAnotherGroup = assignments.find(a => {
      if (formData.id && a.id === formData.id) return false;
      if (!isAssignmentActive(a)) return false;
      const samePerson = resolveEmpId(a.assignedTo) === targetEmpId;
      const sameType = String(a.assignType).toUpperCase() === targetType;
      const aGroup = normalizeGroup(a.groupName);
      const differentGroup = aGroup !== targetGroup;
      return samePerson && sameType && differentGroup;
    });

    if (samePersonHasTypeInAnotherGroup && !formData.id) {
      const empName = getEmployeeName(formData.assignTo, lookups.employees);
      const existingGroup = normalizeGroup(samePersonHasTypeInAnotherGroup.groupName);
      dispatch(openSnackbar({
        open: true,
        message: `${empName} is already assigned as ${formatAssignTypeLabel(formData.assignType)} in group '${existingGroup}'! A person cannot be assigned as ${formatAssignTypeLabel(formData.assignType)} in multiple groups.`,
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    // 3. Same group cannot have duplicate assignment for the same person & date
    const isDuplicate = assignments.some(a => {
      if (formData.id && a.id === formData.id) return false;
      if (!isAssignmentActive(a)) return false;
      const samePerson = resolveEmpId(a.assignedTo) === targetEmpId;
      const aGroup = normalizeGroup(a.groupName);
      const sameGroup = aGroup === targetGroup;
      const aDateStr = a.checklistDate ? a.checklistDate.split('T')[0] : '';
      const fDateStr = formData.checklistDate ? formData.checklistDate.split('T')[0] : '';
      const sameDate = aDateStr === fDateStr;
      return samePerson && sameGroup && sameDate;
    });

    if (isDuplicate && !formData.id) {
      dispatch(openSnackbar({
        open: true,
        message: 'Duplicate assignment for this person in the group!',
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    const canonicalGroupName = (formData.groupName || '').trim().toUpperCase();

    try {
      const res = await axios.post(`${API_PATHS.QMS.CHECKLIST}/assign`, {
        id: formData.id,
        checklistId: checklistId,
        assignedTo: formData.assignTo,
        groupName: canonicalGroupName,
        assignType: formData.assignType,
        checklistDate: formData.checklistDate,
        assignedBy: user?.name || user?.id || 'Admin'
      });

      if (res.data?.remarks === 'DUPLICATE_ASSIGNMENT') {
        dispatch(openSnackbar({
          open: true,
          message: 'Duplicate assignment for this group / person!',
          severity: 'error',
          variant: 'alert'
        }));
        return;
      }

      dispatch(openSnackbar({ open: true, message: formData.id ? 'Assignment updated!' : 'Task assigned!', severity: 'success', variant: 'alert' }));
      setFormData({ assignTo: '', groupName: '', assignType: '', checklistDate: getTomorrowString(), id: null });
      setSelectedRowId(null);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({
        open: true,
        message: 'Assignment failed',
        severity: 'error',
        variant: 'alert'
      }));
    }
  };

  const handleReassignInactiveSubmit = async () => {
    if (!activeAssignment || !reassignRemarks.trim()) return;

    try {
      if (actionType === 'REASSIGN') {
        if (!newAssignee) return;
        await axios.post('/api/qms/checklist/acknowledgement/create', {
          checklistId: checklistId || initialData?.id,
          oldAssigneeId: activeAssignment?.employeeId || activeAssignment?.oldAssigneeId || null,
          newAssigneeId: newAssignee,
          memberType: activeAssignment?.assignType || 'PRIMARY',
          reason: reassignRemarks
        });
        try {
          await axios.put(`/api/qms/checklist/assignment/${activeAssignment.id}/reassign`, {
            newAssignee: newAssignee,
            remarks: reassignRemarks
          });
        } catch (e) {
          console.warn('Legacy assignment reassign endpoint fallback:', e);
        }
        dispatch(openSnackbar({ open: true, message: 'Reassignment request initiated! Awaiting employee acknowledgement.', severity: 'success', variant: 'alert' }));
      } else {
        await axios.put(`/api/qms/checklist/assignment/${activeAssignment.id}/inactive`, {
          remarks: reassignRemarks
        });
        dispatch(openSnackbar({ open: true, message: 'Assignment marked as Inactive!', severity: 'success', variant: 'alert' }));
      }
      setReassignInactiveOpen(false);
      fetchAssignments();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Operation failed.', severity: 'error', variant: 'alert' }));
    }
  };

  const columns = [
    { id: 'seqNo', label: 'Seq No', minWidth: 80 },
    { id: 'checkingPoint', label: 'Checking Point', minWidth: 150 },
    { id: 'frequency', label: 'Frequency', minWidth: 100 },
    { id: 'department', label: 'Department', minWidth: 120 },
    { id: 'assignTo', label: 'Assign To', minWidth: 120 },
    { id: 'groupName', label: 'Group', minWidth: 100 },
    { id: 'assignType', label: 'Assign Type', minWidth: 100 },
    { id: 'assignDate', label: 'Assign Date', minWidth: 110 },
    { id: 'createdUser', label: 'Created By', minWidth: 120 },
    { id: 'createdDate', label: 'Created Date', minWidth: 140 },
    { id: 'status', label: 'Task Status', minWidth: 100 },
    { id: 'actions', label: 'Actions', minWidth: 160 }
  ];

  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '-';
      let hours = dt.getHours();
      const mins = String(dt.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
    } catch { return '-'; }
  };

  const rows = useMemo(() => {
    return assignments
      .map(a => {
        let isUpdated = false;
        if (a.updatedAt && a.createdAt) {
          const msDiff = Math.abs(new Date(a.updatedAt) - new Date(a.createdAt));
          if (msDiff > 60000 || (a.updatedBy && a.createdBy && a.updatedBy !== a.createdBy)) {
            isUpdated = true;
          }
        }

        let upUser = isUpdated ? (a.updatedUser || a.updatedBy || '-') : '-';
        if (upUser === 'Admin istrator' || upUser === 'Administrator') upUser = 'Admin';
        if (String(upUser).toLowerCase().includes('system')) upUser = '-';

        let upDate = isUpdated ? fmtDate(a.updatedDate || a.updatedAt) : '-';

        return {
          id: a.id,
          seqNo: a.checklist?.seqNo || '-',
          checkingPoint: a.checklist?.checkingPoint || '-',
          frequency: a.checklist?.frequency || '-',
          department: (a.checklist?.departments || []).map(d => d.departmentName).join(', ') || '-',
          assignTo: a.assignedToName || getEmployeeName(a.assignedTo, lookups.employees),
          groupName: a.groupName || '-',
          assignType: a.assignType,
          assignDate: (a.checklistDate || a.assignedDate) ? new Date(a.checklistDate || a.assignedDate).toLocaleDateString('en-GB') : '-',
          createdUser: a.createdUser || a.createdBy || a.assignedBy || '-',
          createdDate: fmtDate(a.createdDate || a.createdAt),
          updatedUser: upUser,
          updatedDate: upDate,
          status: a.status?.name || 'ACTIVE',
          actions: ''
        };
      })
      .sort((a, b) => {
        const gA = a.groupName !== '-' ? a.groupName.toLowerCase() : 'zzzz';
        const gB = b.groupName !== '-' ? b.groupName.toLowerCase() : 'zzzz';
        if (gA !== gB) return gA.localeCompare(gB);
        return (a.id || 0) - (b.id || 0);
      });
  }, [assignments, lookups.employees]);

  const handleEditAssignment = (row) => {
    const original = assignments.find(a => a.id === row.id);
    setSelectedRowId(row.id);
    setFormData({
      assignTo: resolveEmpId(original?.assignedTo || row.assignTo),
      groupName: (original?.groupName || (row.groupName !== '-' ? row.groupName : '') || '').toUpperCase(),
      assignType: original?.assignType || row.assignType || '',
      checklistDate: original?.checklistDate ? String(original.checklistDate).split('T')[0] : getTomorrowString(),
      id: row.id
    });
  };

  const handleReAssignClick = () => {
    const selectedRow = rows.find(r => r.id === selectedRowId);
    if (selectedRow) {
      handleEditAssignment(selectedRow);
      dispatch(openSnackbar({ open: true, message: `Loaded assignment for ${selectedRow.assignTo}. Update fields above.`, severity: 'info', variant: 'alert' }));
    }
  };

  const handleInActiveClick = () => {
    if (selectedRowId) {
      setSelectedAssignmentId(selectedRowId);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignmentId) return;
    try {
      await axios.delete(`${API_PATHS.QMS.CHECKLIST}/assignment/${selectedAssignmentId}`);
      dispatch(openSnackbar({ open: true, message: 'Assignment removed', severity: 'success', variant: 'alert' }));
      fetchAssignments();
      setDeleteDialogOpen(false);
      setSelectedAssignmentId(null);
      setSelectedRowId(null);
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({ open: true, message: 'Delete failed', severity: 'error', variant: 'alert' }));
    }
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      title={`Assign Checklist - ${initialData?.seqNo || ''}`}
      maxWidth="lg"
      hideFooter={true}
    >
      <Stack spacing={4}>
        <BOSFormSection
          icon={<IconClipboardList size={22} color={theme.palette.primary.main} />}
          title="Checklist Definition Details"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            <BOSTextField label="Checking Point" value={initialData?.checkingPoint || ''} disabled />
            <BOSTextField label="Department" value={(initialData?.departments || []).map((d) => d.departmentName).join(', ')} disabled />
            <BOSTextField label="Frequency" value={initialData?.frequency || ''} disabled />
          </Box>
        </BOSFormSection>

        <BOSFormSection
          icon={<IconUserPlus size={22} color={theme.palette.primary.main} />}
          title="Assignment Configuration"
        >
          {initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED' && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'error.light', borderRadius: 2, bgcolor: 'error.lighter' }}>
              <Typography color="error.main" fontWeight={600}>
                ⚠️ This checklist cannot be assigned yet because it is not Verified.
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, alignItems: 'end' }}>
            <BOSAutocomplete
              freeSolo
              label="Group"
              options={existingGroupOptions}
              value={formData.groupName || ''}
              onChange={(val) => {
                const stringVal = typeof val === 'object' && val !== null ? (val.value || val.label || '') : (val || '');
                setFormData(p => ({ ...p, groupName: (stringVal || '').toUpperCase() }));
              }}
              onInputChange={(e, newInputValue, reason) => {
                if (reason === 'reset') return;
                setFormData(p => ({ ...p, groupName: (newInputValue || '').toUpperCase() }));
              }}
              placeholder="Select or type Group"
              disabled={initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED'}
            />

            <BOSTextField
              select
              label={lookups.loading ? 'Loading employees…' : `Assign To (${visibleEmployeeOptions.length} available)`}
              value={formData.assignTo}
              onChange={(e) => setFormData(p => ({ ...p, assignTo: e.target.value }))}
              required
              disabled={lookups.loading || (initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED')}
              InputProps={lookups.loading ? { endAdornment: <CircularProgress size={16} sx={{ mr: 1 }} /> } : {}}
            >
              {lookups.loading ? (
                <MenuItem disabled><em>Loading…</em></MenuItem>
              ) : visibleEmployeeOptions.length === 0 ? (
                <MenuItem disabled>
                  <em>
                    {employeeOptions.length > 0
                      ? 'All active employees for this group/department are already assigned'
                      : 'No active employees found for the assigned department(s)'}
                  </em>
                </MenuItem>
              ) : (
                visibleEmployeeOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))
              )}
            </BOSTextField>

            <BOSTextField
              select
              label="Assign Type"
              value={formData.assignType}
              onChange={(e) => setFormData(p => ({ ...p, assignType: e.target.value }))}
              required
              disabled={initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED'}
            >
              {ALL_ASSIGN_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {formatAssignTypeLabel(type)}
                </MenuItem>
              ))}
            </BOSTextField>

            <BOSDatePicker
              name="checklistDate"
              label="Assign Date"
              value={formData.checklistDate}
              onChange={handleDateChange}
              required
              highlightHolidays={true}
              blockHolidays={true}
              disabled={initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED'}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
            {formData.id && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setFormData({ assignTo: '', groupName: '', assignType: '', checklistDate: getTomorrowString(), id: null });
                  setSelectedRowId(null);
                }}
                sx={{ height: 40, px: 2, borderRadius: '8px' }}
              >
                Cancel Edit
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconUserPlus size={18} />}
              onClick={handleAssign}
              disabled={initialData?.verifyStatus && String(initialData.verifyStatus).toUpperCase() !== 'VERIFIED'}
              sx={{ height: 40, px: 3, borderRadius: '8px', fontWeight: 600 }}
            >
              {formData.id ? 'Update Assignment' : 'Add Assignment'}
            </Button>
          </Box>
        </BOSFormSection>

        <BOSFormSection
          icon={<IconUsersGroup size={22} color={theme.palette.primary.main} />}
          title="Existing Assignments List"
        >
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <BOSDataTable
              id="qms-checklist-assign-dialog-table"
              columns={columns}
              rows={rows}
              loading={loading}
              page={page}
              size={size}
              onPageChange={setPage}
              onSizeChange={(newSize) => { setSize(newSize); setPage(0); }}
              onClickRow={(row) => setSelectedRowId(row.id)}
              onDoubleClickRow={(row) => {
                handleEditAssignment(row);
                dispatch(openSnackbar({
                  open: true,
                  message: `Editing assignment for ${row.assignTo}`,
                  severity: 'info',
                  variant: 'alert'
                }));
              }}
              selectedRowId={selectedRowId}
              showActions={false}
              disableSearchFilter={true}
              disableTableConfig={true}
              renderCell={(col, row) => {
                if (col.id === 'status') return <BOSStatusChip status={row.status} showIcon={true} width={100} />;
                if (col.id === 'assignTo') return getEmployeeName(row.assignTo, lookups.employees);
                if (col.id === 'assignType') {
                  const t = row.assignType;
                  if (!t) return '-';
                  return t.replace('_', '-').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
                }
                if (col.id === 'actions') {
                  return (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<IconUserCog size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        const original = assignments.find(a => a.id === row.id);
                        setActiveAssignment(original);
                        setNewAssignee('');
                        setReassignRemarks('');
                        setActionType('REASSIGN');
                        setReassignInactiveOpen(true);
                      }}
                      sx={{ borderRadius: '6px', textTransform: 'none', py: 0.5 }}
                    >
                      Reassign / Inactive
                    </Button>
                  );
                }
                if (col.id === 'checkingPoint' && row.checkingPoint && row.checkingPoint !== '-') {
                  return (
                    <Box
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRowId(row.id);
                        handleEditAssignment(row);
                      }}
                      sx={{ color: 'primary.main', textDecoration: 'none', cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.dark' } }}
                    >
                      {row.checkingPoint}
                    </Box>
                  );
                }
                return row[col.id];
              }}
            />
          </Box>
        </BOSFormSection>
      </Stack>

      {/* Reassign / Inactive Dialog */}
      <Dialog
        open={reassignInactiveOpen}
        onClose={() => setReassignInactiveOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="reassign-inactive-dialog-title"
      >
        <DialogTitle id="reassign-inactive-dialog-title" sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="span">Reassign / Mark Inactive</Typography>
          <IconButton aria-label="close" onClick={() => setReassignInactiveOpen(false)} sx={{ color: 'grey.500' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Show Current Assignment Details */}
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>CURRENT ASSIGNMENT DETAILS</Typography>
              <Typography variant="body1"><strong>Employee:</strong> {activeAssignment?.assignedToName || getEmployeeName(activeAssignment?.assignedTo, lookups.employees)}</Typography>
              <Typography variant="body1"><strong>Type:</strong> {activeAssignment?.assignType || '-'}</Typography>
              <Typography variant="body1"><strong>Date:</strong> {activeAssignment?.checklistDate ? new Date(activeAssignment.checklistDate).toLocaleDateString('en-GB') : '-'}</Typography>
            </Box>

            {/* Choose Action */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>Select Action</FormLabel>
              <RadioGroup
                row
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
              >
                <FormControlLabel value="REASSIGN" control={<Radio />} label="Reassign to New Employee" />
                <FormControlLabel value="INACTIVE" control={<Radio />} label="Mark Inactive" />
              </RadioGroup>
            </FormControl>

            {actionType === 'REASSIGN' ? (
              <Stack spacing={2}>
                <BOSTextField
                  select
                  label="New Assignee"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  required
                  fullWidth
                >
                  <MenuItem value="">-Select Employee-</MenuItem>
                  {visibleEmployeeOptions
                    .filter(opt => opt.value !== activeAssignment?.assignedTo)
                    .map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))
                  }
                </BOSTextField>

                <BOSTextField
                  label="Reassignment Reason"
                  value={reassignRemarks}
                  onChange={(e) => setReassignRemarks(e.target.value)}
                  required
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Explain why this checklist is being reassigned..."
                  error={!reassignRemarks.trim()}
                  helperText={!reassignRemarks.trim() ? "Reason is required to reassign." : ""}
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚠️ Marking this assignment as inactive will remove the employee from this checklist schedule.
                </Typography>
                <BOSTextField
                  label="Reason for Inactivation"
                  value={reassignRemarks}
                  onChange={(e) => setReassignRemarks(e.target.value)}
                  required
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Explain why this assignment is being made inactive..."
                  error={!reassignRemarks.trim()}
                  helperText={!reassignRemarks.trim() ? "Reason is required to make inactive." : ""}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReassignInactiveOpen(false)} variant="outlined" sx={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleReassignInactiveSubmit}
            variant="contained"
            color={actionType === 'REASSIGN' ? 'primary' : 'error'}
            disabled={!reassignRemarks.trim() || (actionType === 'REASSIGN' && !newAssignee)}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            {actionType === 'REASSIGN' ? 'Save Reassignment' : 'Mark Inactive'}
          </Button>
        </DialogActions>
      </Dialog>
    </BOSFormDialog>
  );
}

ChecklistAssignDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  checklistId: PropTypes.number,
  initialData: PropTypes.object
};
