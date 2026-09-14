import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Checkbox,
  Autocomplete,
  useTheme,
  Chip,
  Avatar,
  Tooltip,
  Paper,
  TextField,
  IconButton,
  Badge
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  IconPlus,
  IconEraser,
  IconCheck,
  IconFileDescription,
  IconCalendarEvent,
  IconUsers,
  IconListCheck,
  IconArrowLeft,
  IconChevronLeft,
  IconFileTypePdf
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { useMasterDataStore } from 'store/useMasterDataStore';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  BOSDatePicker,
  BOSTimePicker,
  BOSDataTable,
  BOSFileUpload,
  BOSToggleSwitch,
  btnSave,
  btnCancel,
  btnClear,
  BOSStatusChip,
  getPhotoUrl,
  errorStyle
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { useLookups } from 'hooks/useLookups';
import { API_PATHS } from 'utils/api-constants';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import AddContactDialog from '../../sm/AddContactDialog';
import AuditSchedulePDFDialog from './AuditSchedulePDFDialog';



const formatTime12 = (hour, minute) => {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3] || 'AM';
  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

const minutesToTimeParts = (totalMins) => {
  let h24 = Math.floor(totalMins / 60) % 24;
  let m = totalMins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return {
    hour: h12,
    minute: String(m).padStart(2, '0'),
    ampm
  };
};

const isPastTime = (timeOption, selectedDateStr) => {
  return false; // Bypassed for testing
};

const START_TIME_OPTIONS = [];
for (let h = 9; h <= 20; h++) {
  for (let m = 0; m < 60; m += 10) {
    if (h === 20 && m > 50) break;
    START_TIME_OPTIONS.push(formatTime12(h, m));
  }
}

const END_TIME_OPTIONS = [];
for (let h = 9; h <= 21; h++) {
  for (let m = 0; m < 60; m += 10) {
    if (h === 9 && m < 10) continue;
    if (h === 21 && m > 0) break;
    END_TIME_OPTIONS.push(formatTime12(h, m));
  }
}

const ensure12h = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h24 = parseInt(parts[0], 10);
    const m = parts[1].substring(0, 2);
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = (h24 % 12 || 12).toString().padStart(2, '0');
    return `${h12}:${m} ${ampm}`;
  }
  return timeStr;
};

const getAuditCategory = (auditTypeStr) => {
  if (!auditTypeStr) return 'DEFAULT';
  const type = auditTypeStr.toUpperCase();
  if (type.includes('CUSTOMER')) return 'CUSTOMER_AUDIT';
  if (type.includes('ISO')) return 'ISO_AUDIT';
  if (type.includes('SUPPLIER ASSESSMENT')) return 'SUPPLIER_ASSESSMENT';
  if (type.includes('SUPPLIER')) return 'SUPPLIER_AUDIT';
  if (type.includes('SUBCONTRACTOR')) return 'SUBCONTRACTOR_AUDIT';
  if (type.includes('PRODUCT')) return 'PRODUCT_AUDIT';
  if (type.includes('RECORD ROOM')) return 'RECORD_ROOM_AUDIT';
  if (type.includes('ERP')) return 'ERP_SCREEN_AUDIT';
  if (type.includes('PROCESS')) return 'PROCESS_AUDIT';
  return 'DEFAULT';
};

const hasAuditType = (typeListStr, selectedType) => {
  if (!typeListStr || !selectedType) return false;
  return typeListStr.split(',').some(t => t.trim().toLowerCase() === selectedType.trim().toLowerCase());
};

export default function AddAuditSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isReschedule = queryParams.get('isReschedule') === 'true';
  const isReadOnly = queryParams.get('readOnly') === 'true';
  const dispatch = useDispatch();
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isEditing = Boolean(id);
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_SCHEDULE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const handleGoBack = () => {
    if (location.state?.fromCalendar) {
      navigate('/apps/calendar');
    } else if (location.state?.fromDashboard) {
      navigate('/dashboard/user-task-queue');
    } else {
      navigate('/qms/audit/schedule');
    }
  };

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const getSystemTimeClamped = () => {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const minLimit = 9 * 60; // 9:00 AM
    const maxLimit = 21 * 60; // 9:00 PM

    if (totalMinutes < minLimit) {
      hours = 9;
      minutes = 0;
    } else if (totalMinutes > maxLimit) {
      hours = 21;
      minutes = 0;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getEndTimeDefault = (startTime12h) => {
    try {
      const parts = startTime12h.split(':');
      let h = parseInt(parts[0], 10);
      const mAndAmpm = parts[1].split(' ');
      const m = parseInt(mAndAmpm[0], 10);
      const ampm = mAndAmpm[1];
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;

      let endH = h + 1;
      let endM = m;

      const endMinutes = endH * 60 + endM;
      const minEnd = 9 * 60 + 10;
      const maxEnd = 21 * 60;

      if (endMinutes < minEnd) {
        endH = 9;
        endM = 10;
      } else if (endMinutes > maxEnd) {
        endH = 21;
        endM = 0;
      }

      const endAmpm = endH >= 12 ? 'PM' : 'AM';
      const displayEndHour = endH % 12 || 12;
      return `${displayEndHour.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')} ${endAmpm}`;
    } catch (e) {
      return '05:00 PM';
    }
  };

  const defaultStartTime = getSystemTimeClamped();

  const [formData, setFormData] = useState({
    scheduleNo: '',
    scheduleDate: getLocalDateString(),
    status: 'OPEN',
    auditType: '',
    auditArea: '',
    auditDate: getLocalDateString(),
    startTime: defaultStartTime,
    endTime: '05:00 PM',
    frequency: 'NONE',
    weekDays: '',
    repeatEveryValue: '',
    repeatEveryUnit: 'DAYS',
    department: '',
    auditee: '',
    auditeeType: '',
    auditor: '',
    auditorType: '',
    ncrApprovedBy: '',
    ncrApprovedByType: '',
    criteriaMinCount: 0,
    // Dynamic Fields
    customerName: '',
    contactName: '',
    externalName: '',
    externalEmailId: '',
    externalMobileNo: '',
    externalAuditorImage: '',
    emailToCustomer: '',
    fromEmailToCustomer: '',
    subcontractorName: '',
    supplierName: '',
    coOrdinator: '',
    processName: '',
    itemCode: '',
    auditAreaDetail: ''
  });

  const [scheduleHasAttendance, setScheduleHasAttendance] = useState(false);
  const [leaveEmployeeIds, setLeaveEmployeeIds] = useState([]);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [updateConfig, setUpdateConfig] = useState(false);

  const isClosed = formData.status?.toUpperCase() === 'CLOSED' || formData.status?.toUpperCase() === 'CLOSE' || formData.status?.toUpperCase() === 'WAITING_APPROVAL' || formData.status?.toUpperCase() === 'CANCELLED';
  const canWrite = perms.write && !isClosed && !isReadOnly;

  const getDynamicMinStartTime = () => {
    // If audit date is today, min start time is current time (clamped to 09:00 AM)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (formData.auditDate === todayStr) {
      const h = today.getHours();
      const m = today.getMinutes();
      const clampedH = Math.max(h, 9);
      const ampm = clampedH >= 12 ? 'PM' : 'AM';
      const h12 = (clampedH % 12 || 12).toString().padStart(2, '0');
      return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
    }
    return '09:00 AM';
  };

  const getDynamicMinEndTime = () => {
    // End time must be at least startTime + 10 minutes
    if (!formData.startTime) return '09:10 AM';
    try {
      const [timePart, ampm] = formData.startTime.split(' ');
      let [h, m] = timePart.split(':').map(Number);
      if (ampm === 'PM' && h !== 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      let totalMins = h * 60 + m + 10;
      const minEnd = 9 * 60 + 10; // 09:10 AM
      if (totalMins < minEnd) totalMins = minEnd;
      const endH = Math.floor(totalMins / 60);
      const endM = totalMins % 60;
      const endAmpm = endH >= 12 ? 'PM' : 'AM';
      const endH12 = (endH % 12 || 12).toString().padStart(2, '0');
      return `${endH12}:${String(endM).padStart(2, '0')} ${endAmpm}`;
    } catch (e) {
      return '09:10 AM';
    }
  };

  const [criteriaList, setCriteriaList] = useState([]);
  const [statusEditable, setStatusEditable] = useState(false);
  const category = getAuditCategory(formData.auditType);
  const {
    auditTypes = [],
    departments = [],
    auditCriterias: masterCriteria = [],
    employees = [],
    levels = [],
    designationLevels = [],
    designations = [],
    customers = [],
    contacts = [],
    auditAreas = [],
    process: processMaster = [],
    holidays = [],
    refetch: refetchLookups
  } = useLookups(['AUDIT_TYPE', 'DEPARTMENTS', 'AUDIT_CRITERIA', 'EMPLOYEES', 'LEVELS', 'DESIGNATION_LEVELS', 'DESIGNATIONS', 'CUSTOMERS', 'CONTACTS', 'AUDIT_AREA', 'PROCESS', 'HOLIDAYS']);

  const selectedTypeObj = useMemo(() => {
    return (auditTypes || []).find(t => t && String(t.auditType || '').trim().toLowerCase() === String(formData.auditType || '').trim().toLowerCase());
  }, [auditTypes, formData.auditType]);
  const isCriteriaOpen = String(selectedTypeObj?.criteriaType || '').trim().toLowerCase() === 'variable';



  // Build a Set of active holiday date strings (yyyy-MM-dd) for fast lookup
  const holidayDateSet = useMemo(() => {
    const set = new Set();
    (holidays || []).forEach(h => {
      if (h.isActive === false) return;
      if (h.holidayType === 'WEEKLY_OFF') return; // weekly offs are handled separately
      const raw = h.fromDate || h.holidayDate;
      if (raw) set.add(String(raw).slice(0, 10));
    });
    return set;
  }, [holidays]);

  // Build a Set of day-of-week names that are configured as weekly off (e.g. "SUNDAY")
  // Sourced dynamically from active WEEKLY_OFF type records in the holiday master
  const weeklyOffDays = useMemo(() => {
    const set = new Set();
    (holidays || []).forEach(h => {
      if (h.isActive === false) return;
      if (h.holidayType !== 'WEEKLY_OFF') return;
      if (h.holidayDay) set.add(h.holidayDay.toUpperCase());
    });
    return set;
  }, [holidays]);

  // Day-of-week names matching JavaScript's getDay() index
  const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Disable weekly off days and holidays in the Audit Date picker
  const shouldDisableAuditDate = useCallback((date) => {
    if (!date) return false;
    // Check dynamic weekly off days (from holiday master WEEKLY_OFF type)
    const dayName = DAY_NAMES[date.getDay()];
    if (weeklyOffDays.has(dayName)) return true;
    // Check specific holiday dates
    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return holidayDateSet.has(dateStr);
    } catch {
      return false;
    }
  }, [holidayDateSet, weeklyOffDays]);


  useEffect(() => {
    if (!formData.auditDate) {
      setLeaveEmployeeIds([]);
      return;
    }
    const fetchLeaves = async () => {
      try {
        const res = await axios.get('/api/hr/leave-entries/on-leave', {
          params: { date: formData.auditDate }
        });
        setLeaveEmployeeIds(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to fetch employees on leave:', err);
        setLeaveEmployeeIds([]);
      }
    };
    fetchLeaves();
  }, [formData.auditDate]);

  const finalLevels = levels.length > 0 ? levels : designationLevels;

  const [localContacts, setLocalContacts] = useState([]);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  useEffect(() => {
    if (contacts && contacts.length > 0) {
      setLocalContacts(contacts);
    }
  }, [contacts]);

  const refreshContacts = async () => {
    try {
      const res = await axios.get(API_PATHS.SM.CONTACTS);
      const data = res.data;
      setLocalContacts(Array.isArray(data) ? data : (data && Array.isArray(data.content) ? data.content : []));
    } catch (e) {
      console.error('Failed to refresh contacts list:', e);
    }
  };

  useRealtimeRefresh(() => {
    if (typeof refetchLookups === 'function') {
      refetchLookups(true).catch((err) => console.error('Failed to refetch lookups in realtime:', err));
    }
    refreshContacts();
    if (isEditing && id) {
      fetchSchedule();
    }
  });

  // Criteria Dialog state
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState([]);
  const [popupCriteria, setPopupCriteria] = useState([]);
  const [popupCriteriaLoading, setPopupCriteriaLoading] = useState(false);

  const openCriteriaSelection = async () => {
    setPopupCriteriaLoading(true);
    try {
      const res = await axios.get('/api/master/qms/audit-criteria/filter', {
        params: {
          auditType: formData.auditType || '',
          department: formData.department || ''
        }
      });
      setPopupCriteria(res.data || []);
    } catch (e) {
      console.error('Failed to fetch filtered criteria:', e);
      dispatch(openSnackbar({ open: true, message: 'Failed to load criteria.', severity: 'error', variant: 'alert' }));
      setPopupCriteria([]);
    } finally {
      setPopupCriteriaLoading(false);
    }
    setCriteriaDialogOpen(true);
  };

  // Custom Criteria Dialog state
  const [customCriteriaOpen, setCustomCriteriaOpen] = useState(false);
  const [customCriteriaForm, setCustomCriteriaForm] = useState({
    seqNo: '',
    clause: '',
    criteriaDetails: '',
    attachmentReq: 'NO',
    remarks: ''
  });
  const [customAttachments, setCustomAttachments] = useState([]);

  useEffect(() => {
    if (typeof refetchLookups === 'function') {
      refetchLookups(true).catch((err) => console.error('Failed to refetch lookups on mount:', err));
    }
    if (isEditing) {
      fetchSchedule();
    } else {
      generateScheduleNo();
    }
  }, [id, isEditing, refetchLookups]);

  const generateScheduleNo = async () => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_SCHEDULE}/next-no`);
      setFormData((prev) => ({ ...prev, scheduleNo: res.data }));
    } catch (error) {
      setFormData((prev) => ({ ...prev, scheduleNo: `SCH-${Math.floor(1000 + Math.random() * 9000)}` }));
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await axios.get(`${API_PATHS.QMS.AUDIT_SCHEDULE}/${id}`);
      const data = res.data;
      let extras = {};
      try {
        if (data.auditeeDetails) {
          extras = JSON.parse(data.auditeeDetails);
        }
      } catch (e) {
        console.error('Failed to parse auditeeDetails:', e);
      }
      setFormData({
        scheduleNo: data.scheduleNo || '',
        scheduleDate: data.scheduleDate ? data.scheduleDate.split('T')[0] : '',
        status: data.status || 'OPEN',
        auditType: data.auditType || '',
        auditArea: data.auditArea || '',
        auditDate: data.auditDate ? data.auditDate.split('T')[0] : '',
        startTime: ensure12h(data.startTime || '09:00 AM'),
        endTime: ensure12h(data.endTime || '05:00 PM'),
        department: data.department || '',
        auditee: data.auditee || '',
        auditeeType: data.auditeeType || '',
        auditor: data.auditor || '',
        auditorType: data.auditorType || '',
        ncrApprovedBy: data.ncrApprovedBy || '',
        ncrApprovedByType: data.ncrApprovedByType || '',
        criteriaMinCount: data.criteriaMinCount || 0,
        frequency: data.frequency || 'NONE',
        weekDays: data.weekDays || '',
        repeatEveryValue: data.repeatEveryValue !== null && data.repeatEveryValue !== undefined ? data.repeatEveryValue : '',
        repeatEveryUnit: data.repeatEveryUnit || 'DAYS',
        itemCode: data.itemCode || '',
        customerName: extras.customerName || '',
        contactName: extras.contactName || '',
        externalName: extras.externalName || '',
        externalEmailId: extras.externalEmailId || '',
        externalMobileNo: extras.externalMobileNo || '',
        externalAuditorImage: extras.externalAuditorImage || '',
        emailToCustomer: extras.emailToCustomer || '',
        fromEmailToCustomer: extras.fromEmailToCustomer || '',
        subcontractorName: extras.subcontractorName || '',
        supplierName: extras.supplierName || '',
        processName: extras.processName || '',
        coOrdinator: extras.coOrdinator || '',
        auditZone: extras.auditZone || '',
        auditAreaDetail: extras.auditAreaDetail || ''
      });
      setCriteriaList((data.criteriaList || []).map((c, index) => ({
        ...c,
        id: c.id || `existing-${index}-${Date.now()}`,
        attachmentReq: c.attachmentReq === true ? 'YES' : 'NO'
      })));
      setScheduleHasAttendance(Boolean(data.hasAttendance));
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  // Modernize legacy employee labels when employee lookups load
  useEffect(() => {
    if (employees.length > 0) {
      setFormData((prev) => {
        const updateField = (val) => {
          if (!val) return '';
          const valStr = String(val);
          const code = valStr.includes(' - ') ? valStr.split(' - ')[1] : valStr;
          const match = employees.find(emp =>
            String(emp?.oldEmpCode || emp?.empCode || emp?.employeeCode || emp?.id || '').toLowerCase() === String(code).toLowerCase() ||
            String(emp?.newEmpCode || '').toLowerCase() === String(code).toLowerCase() ||
            String(emp?.employeeName || '').toLowerCase() === String(code).toLowerCase()
          );
          if (match) {
            const fName = match.firstName || '';
            const lName = match.lastName || '';
            const empName = match.employeeName || '';
            let name = '';
            if (fName && lName) {
              name = `${fName} ${lName}`.trim();
            } else if (empName && lName && !empName.toLowerCase().includes(lName.toLowerCase())) {
              name = `${empName} ${lName}`.trim();
            } else if (empName) {
              name = empName;
            } else {
              name = `${fName} ${lName}`.trim();
            }
            return `${name} - ${match.oldEmpCode || match.empCode || match.employeeCode || match.id}`;
          }
          return val;
        };

        const updatedAuditee = updateField(prev.auditee);
        const updatedAuditor = updateField(prev.auditor);
        const updatedNcrApproved = updateField(prev.ncrApprovedBy);
        const updatedCoOrdinator = updateField(prev.coOrdinator);

        if (
          updatedAuditee !== prev.auditee ||
          updatedAuditor !== prev.auditor ||
          updatedNcrApproved !== prev.ncrApprovedBy ||
          updatedCoOrdinator !== prev.coOrdinator
        ) {
          return {
            ...prev,
            auditee: updatedAuditee,
            auditor: updatedAuditor,
            ncrApprovedBy: updatedNcrApproved,
            coOrdinator: updatedCoOrdinator
          };
        }
        return prev;
      });
    }
  }, [employees, formData.auditor, formData.auditee, formData.ncrApprovedBy, formData.coOrdinator]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'frequency') {
      setFormData((prev) => ({
        ...prev,
        frequency: value,
        weekDays: value === 'WEEKLY' ? '' : prev.weekDays,
        repeatEveryValue: value === 'CUSTOM' ? '' : prev.repeatEveryValue,
        repeatEveryUnit: value === 'CUSTOM' ? 'DAYS' : prev.repeatEveryUnit
      }));
    } else if (name === 'auditee' || name === 'auditor' || name === 'ncrApprovedBy') {
      const typeField = name === 'auditee' ? 'auditeeType' : (name === 'auditor' ? 'auditorType' : 'ncrApprovedByType');
      const abilityField = name === 'auditee' ? 'auditeeType' : (name === 'auditor' ? 'auditorType' : 'ncrApproverType');
      if (!value) {
        setFormData((prev) => ({ ...prev, [name]: '', [typeField]: '' }));
      } else {
        const code = value.includes(' - ') ? value.split(' - ')[1].trim() : value.trim();
        const emp = employees.find(e =>
          String(e?.oldEmpCode || e?.empCode || e?.employeeCode || e?.id || '').toLowerCase() === String(code).toLowerCase() ||
          String(e?.newEmpCode || '').toLowerCase() === String(code).toLowerCase()
        );

        // Prevent selecting ineligible employees
        const empDeptName = emp?.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp?.departmentId || emp?.department?.id))?.departmentName;
        const sameDept = empDeptName && formData.department && empDeptName.trim().toLowerCase() === formData.department.trim().toLowerCase();
        let eligible = true;
        if (emp) {
          if (emp.status !== 'Active') eligible = false;
          if (name === 'auditee') {
            if (emp.isAuditee !== 'YES' || !sameDept || !hasAuditType(emp.auditeeType, formData.auditType)) eligible = false;
          } else if (name === 'auditor') {
            if (emp.isAuditor !== 'YES' || sameDept || !hasAuditType(emp.auditorType, formData.auditType)) eligible = false;
          } else if (name === 'ncrApprovedBy') {
            if (emp.isNcrApprover !== 'YES' || sameDept || !hasAuditType(emp.ncrApproverType, formData.auditType)) eligible = false;
          }
        } else {
          eligible = false;
        }

        if (eligible) {
          setFormData((prev) => ({
            ...prev,
            [name]: value,
            [typeField]: emp ? (emp[abilityField] || '') : ''
          }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: '', [typeField]: '' }));
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSave = async () => {
    const category = getAuditCategory(formData.auditType);
    const rules = [
      { field: 'auditType', label: 'Audit Type', required: true },
      { field: 'auditDate', label: 'Audit Date', required: true },
      { field: 'department', label: 'Department', required: true },
      { field: 'auditee', label: 'Auditee', required: true },
      { field: 'auditor', label: 'Auditor', required: selectedTypeObj?.customerAuditArea !== 'YES' },
      { field: 'ncrApprovedBy', label: 'NC Approved By', required: true },
      { field: 'auditArea', label: 'Audit Area', required: true },
      { field: 'startTime', label: 'Start Time', required: true },
      { field: 'endTime', label: 'End Time', required: true },
      { field: 'frequency', label: 'Frequency', required: true }
    ];

    if (formData.frequency === 'WEEKLY') {
      rules.push({ field: 'weekDays', label: 'Week Days', required: true });
    }
    if (formData.frequency === 'CUSTOM') {
      rules.push({ field: 'repeatEveryValue', label: 'Repeat Every', required: true, type: 'number' });
      rules.push({ field: 'repeatEveryUnit', label: 'Schedule Unit', required: true });
    }

    if (category === 'CUSTOMER_AUDIT') {
      rules.push({ field: 'customerName', label: 'Customer Name', required: true });
      rules.push({ field: 'contactName', label: 'Contact Name', required: true });
      rules.push({ field: 'externalEmailId', label: 'External Email Id', required: true });
      rules.push({ field: 'externalMobileNo', label: 'External Mobile No', required: true });
      rules.push({ field: 'coOrdinator', label: 'Co-Ordinator', required: true });
      if (formData.emailToCustomer === 'YES') {
        rules.push({ field: 'fromEmailToCustomer', label: 'From Email to Customer', required: true });
      }
    } else {
      if (selectedTypeObj?.customerAuditArea === 'YES') {
        rules.push({ field: 'externalName', label: 'External Name', required: true });
        rules.push({ field: 'externalEmailId', label: 'External Email Id', required: true });
        rules.push({ field: 'externalMobileNo', label: 'External Mobile No', required: true });
        rules.push({ field: 'coOrdinator', label: 'Co-Ordinator', required: true });
      } else if (category === 'PRODUCT_AUDIT') {
        rules.push({ field: 'itemCode', label: 'Item Code', required: true });
      } else if (category === 'SUBCONTRACTOR_AUDIT') {
        rules.push({ field: 'subcontractorName', label: 'Subcontractor Name', required: true });
      } else if (category === 'SUPPLIER_AUDIT') {
        rules.push({ field: 'supplierName', label: 'Supplier Name', required: true });
      } else if (category === 'PROCESS_AUDIT') {
        rules.push({ field: 'processName', label: 'Process Name', required: true });
      }
    }

    if (!validate(formData, rules)) return;

    // Validate audit date is not a weekly off day or company holiday
    if (formData.auditDate) {
      const auditDateObj = new Date(formData.auditDate + 'T00:00:00');
      const dayName = DAY_NAMES[auditDateObj.getDay()];
      if (weeklyOffDays.has(dayName)) {
        dispatch(openSnackbar({ open: true, message: `Audit Date cannot be a Weekly Off day (${dayName.charAt(0) + dayName.slice(1).toLowerCase()}).`, severity: 'error', variant: 'alert' }));
        return;
      }
      // Validate audit date is not a company holiday
      if (holidayDateSet.has(formData.auditDate)) {
        dispatch(openSnackbar({ open: true, message: 'Audit Date cannot be a Company Holiday.', severity: 'error', variant: 'alert' }));
        return;
      }
    }

    // Validate if selected personnel are on leave on the auditDate
    if (formData.auditDate && leaveEmployeeIds.length > 0) {
      const checkPersonnelLeave = (fieldName, roleLabel) => {
        const val = formData[fieldName];
        if (!val) return null;
        const code = val.includes(' - ') ? val.split(' - ')[1].trim() : val.trim();
        const emp = employees.find(e =>
          String(e?.empCode || e?.employeeCode || e?.id || '').toLowerCase() === String(code).toLowerCase()
        );
        if (emp && leaveEmployeeIds.includes(emp.id)) {
          const empName = emp.employeeName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
          return `${roleLabel} (${empName}) is on leave on ${format(new Date(formData.auditDate + 'T00:00:00'), 'dd/MM/yyyy')}.`;
        }
        return null;
      };

      const auditeeError = checkPersonnelLeave('auditee', 'Auditee');
      if (auditeeError) {
        dispatch(openSnackbar({ open: true, message: auditeeError, severity: 'error', variant: 'alert' }));
        return;
      }

      const auditorError = checkPersonnelLeave('auditor', 'Auditor');
      if (auditorError) {
        dispatch(openSnackbar({ open: true, message: auditorError, severity: 'error', variant: 'alert' }));
        return;
      }

      const ncrError = checkPersonnelLeave('ncrApprovedBy', 'NC Approved By');
      if (ncrError) {
        dispatch(openSnackbar({ open: true, message: ncrError, severity: 'error', variant: 'alert' }));
        return;
      }

      const coordError = checkPersonnelLeave('coOrdinator', 'Co-Ordinator');
      if (coordError) {
        dispatch(openSnackbar({ open: true, message: coordError, severity: 'error', variant: 'alert' }));
        return;
      }
    }

    if (isPastTime(formData.startTime, formData.auditDate)) {
      dispatch(openSnackbar({
        open: true,
        message: 'Start Time cannot be in the past for today.',
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    const convertToMinutes = (time12h) => {
      const ensured = ensure12h(time12h);
      const [time, modifier] = ensured.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) hours = 0;
      if (modifier === 'PM') hours += 12;
      return hours * 60 + minutes;
    };

    const startMins = convertToMinutes(formData.startTime);
    const endMins = convertToMinutes(formData.endTime);

    // Validate allowed time window: 09:00 AM – 09:00 PM
    if (startMins < 9 * 60 || startMins > 21 * 60) {
      dispatch(openSnackbar({
        open: true,
        message: 'Start Time must be between 09:00 AM and 09:00 PM.',
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    if (endMins < 9 * 60 + 10 || endMins > 21 * 60) {
      dispatch(openSnackbar({
        open: true,
        message: 'End Time must be between 09:10 AM and 09:00 PM.',
        severity: 'error',
        variant: 'alert'
      }));
      return;
    }

    if (endMins <= startMins) {
      dispatch(openSnackbar({ open: true, message: 'End Time must be greater than Start Time.', severity: 'error', variant: 'alert' }));
      return;
    }

    if (endMins < startMins + 10) {
      dispatch(openSnackbar({ open: true, message: 'End Time must be at least 10 minutes after Start Time.', severity: 'error', variant: 'alert' }));
      return;
    }

    if (!isCriteriaOpen && criteriaList.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'At least one criteria must be added.', severity: 'error', variant: 'alert' }));
      return;
    }

    if (!isCriteriaOpen && formData.criteriaMinCount > (Array.isArray(criteriaList) ? criteriaList.length : 0)) {
      dispatch(openSnackbar({
        open: true,
        message: `Minimum ${formData.criteriaMinCount} criteria are required. Opening selection...`,
        severity: 'warning',
        variant: 'alert'
      }));
      openCriteriaSelection();
      return;
    }

    try {
      let finalExternalAuditorImage = '';
      if (formData.externalAuditorImage) {
        if (typeof formData.externalAuditorImage === 'string') {
          finalExternalAuditorImage = formData.externalAuditorImage;
        } else if (formData.externalAuditorImage instanceof File || formData.externalAuditorImage?.name) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', formData.externalAuditorImage);
          const res = await axios.post('/api/files/upload?module=AUDIT', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            skipGlobalAlert: true
          });
          finalExternalAuditorImage = res.data?.filePath || res.data?.path || (typeof res.data === 'string' ? res.data : '');
        } else if (typeof formData.externalAuditorImage === 'object') {
          finalExternalAuditorImage = formData.externalAuditorImage?.filePath || formData.externalAuditorImage?.path || formData.externalAuditorImage?.url || '';
        }
      }

      const extraDetails = {
        customerName: formData.customerName || '',
        contactName: formData.contactName || '',
        externalName: formData.externalName || '',
        externalEmailId: formData.externalEmailId || '',
        externalMobileNo: formData.externalMobileNo || '',
        externalAuditorImage: finalExternalAuditorImage || '',
        emailToCustomer: formData.emailToCustomer || '',
        fromEmailToCustomer: formData.fromEmailToCustomer || '',
        subcontractorName: formData.subcontractorName || '',
        supplierName: formData.supplierName || '',
        processName: formData.processName || '',
        coOrdinator: formData.coOrdinator || '',
        auditZone: formData.auditZone || '',
        auditAreaDetail: formData.auditAreaDetail || ''
      };

      const matchDept = (departments || []).find(d => d && d.departmentName === formData.department);
      const matchType = (auditTypes || []).find(t => t && t.auditType === formData.auditType);
      const matchArea = (auditAreas || []).find(a => a && a.description === formData.auditArea);

      const getCode = (str) => {
        if (!str) return '';
        const s = String(str).trim();
        return s.includes(' - ') ? s.split(' - ')[1].trim() : s;
      };

      const auditeeCode = getCode(formData.auditee);
      const matchAuditee = (employees || []).find(emp => emp && (emp.empCode === auditeeCode || emp.employeeCode === auditeeCode));

      const auditorCode = getCode(formData.auditor);
      const matchAuditor = (employees || []).find(emp => emp && (emp.empCode === auditorCode || emp.employeeCode === auditorCode));

      const approverCode = getCode(formData.ncrApprovedBy);
      const matchApprover = (employees || []).find(emp => emp && (emp.empCode === approverCode || emp.employeeCode === approverCode));

      const matchCustomer = (customers || []).find(c => c && c.customerName === formData.customerName);
      const matchProcess = (processMaster || []).find(p => p && p.processName === formData.processName);

      const coordCode = getCode(formData.coOrdinator);
      const matchCoord = (employees || []).find(emp => emp && (emp.empCode === coordCode || emp.employeeCode === coordCode));

      const payload = {
        ...formData,
        externalAuditorImage: finalExternalAuditorImage || '',
        startTime: ensure12h(formData.startTime),
        endTime: ensure12h(formData.endTime),
        departmentId: matchDept ? matchDept.id : null,
        auditTypeId: matchType ? matchType.id : null,
        auditAreaId: matchArea ? matchArea.id : null,
        auditeeId: matchAuditee ? matchAuditee.id : null,
        auditorId: matchAuditor ? matchAuditor.id : null,
        ncrApprovedById: matchApprover ? matchApprover.id : null,
        customerId: matchCustomer ? matchCustomer.id : null,
        processId: matchProcess ? matchProcess.id : null,
        coOrdinatorId: matchCoord ? matchCoord.id : null,
        repeatEveryValue: formData.frequency === 'CUSTOM' && formData.repeatEveryValue ? parseInt(formData.repeatEveryValue, 10) : null,
        repeatEveryUnit: formData.frequency === 'CUSTOM' ? formData.repeatEveryUnit : null,
        weekDays: formData.frequency === 'WEEKLY' ? formData.weekDays : null,
        updateConfig: Boolean(updateConfig),
        auditeeDetails: JSON.stringify(extraDetails),
        criteriaList: (criteriaList || []).map(c => {
          const item = {
            seqNo: c.seqNo ? String(c.seqNo) : '',
            clause: c.clause || '',
            criteriaDetails: c.criteriaDetails || '',
            attachmentReq: c.attachmentReq === 'YES' || c.attachmentReq === true,
            remarks: c.remarks || ''
          };
          if (c.id && !String(c.id).startsWith('master-') && !isNaN(Number(c.id))) {
            item.id = Number(c.id);
          }
          return item;
        })
      };

      if (isEditing) {
        const url = isReschedule
          ? `${API_PATHS.QMS.AUDIT_SCHEDULE}/${id}?isReschedule=true`
          : `${API_PATHS.QMS.AUDIT_SCHEDULE}/${id}`;
        await axios.put(url, payload, { skipGlobalAlert: true });
        dispatch(openSnackbar({ open: true, message: isReschedule ? 'Audit Schedule Rescheduled Successfully.' : 'Audit Schedule updated successfully!', severity: 'success', variant: 'alert' }));
      } else {
        await axios.post(API_PATHS.QMS.AUDIT_SCHEDULE, payload, { skipGlobalAlert: true });
        dispatch(openSnackbar({ open: true, message: 'Audit Schedule saved successfully.', variant: 'alert', severity: 'success' }));
      }
      window.dispatchEvent(new CustomEvent('bos-realtime-update', { detail: { entityName: 'ContactMaster' } }));
      handleGoBack();
    } catch (error) {
      let errorMsg = 'Error saving Audit Schedule.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        errorMsg = error.response.data.message || error.response.data.details || (typeof error.response.data === 'string' ? error.response.data : errorMsg);
      } else if (error.message) {
        errorMsg = error.message;
      }
      dispatch(openSnackbar({ open: true, message: errorMsg, severity: 'error', variant: 'alert' }));
    }
  };

  const handleClear = () => {
    if (isEditing) {
      fetchSchedule();
    } else {
      setFormData({
        scheduleNo: '',
        scheduleDate: getLocalDateString(),
        status: 'OPEN',
        auditType: '',
        auditArea: '',
        auditDate: getLocalDateString(),
        startTime: defaultStartTime,
        endTime: '05:00 PM',
        frequency: 'NONE',
        weekDays: '',
        repeatEveryValue: '',
        repeatEveryUnit: 'DAYS',
        department: '',
        auditee: '',
        auditeeType: '',
        auditor: '',
        auditorType: '',
        ncrApprovedBy: '',
        ncrApprovedByType: '',
        criteriaMinCount: 0,
        customerName: '',
        contactName: '',
        externalName: '',
        emailToCustomer: '',
        fromEmailToCustomer: '',
        subcontractorName: '',
        supplierName: '',
        coOrdinator: '',
        itemCode: '',
        processName: '',
        auditAreaDetail: ''
      });
      generateScheduleNo();
      setCriteriaList([]);
      generateScheduleNo();
    }
    clearErrors();
  };

  const handleRemoveCriteria = (index) => {
    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenCustomCriteria = () => {
    const nextSeq = criteriaList.length > 0
      ? Math.max(...criteriaList.map(c => parseInt(c.seqNo, 10) || 0)) + 1
      : 1;

    setCustomCriteriaForm({
      seqNo: nextSeq,
      clause: '',
      criteriaDetails: '',
      attachmentReq: 'NO',
      remarks: ''
    });
    setCustomAttachments([]);
    setCustomCriteriaOpen(true);
  };

  const handleSaveCustomCriteria = () => {
    if (!customCriteriaForm.seqNo || !customCriteriaForm.clause || !customCriteriaForm.criteriaDetails) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in all required fields (Seq No, Clause, Criteria Details).',
        severity: 'warning',
        variant: 'alert'
      }));
      return;
    }

    if (customCriteriaForm.attachmentReq === 'YES' && customAttachments.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: 'Attachment is mandatory when Attachment Req is YES.',
        severity: 'warning',
        variant: 'alert'
      }));
      return;
    }

    const newItem = {
      seqNo: parseInt(customCriteriaForm.seqNo, 10) || criteriaList.length + 1,
      clause: customCriteriaForm.clause,
      criteriaDetails: customCriteriaForm.criteriaDetails,
      attachmentReq: customCriteriaForm.attachmentReq || 'NO',
      remarks: customCriteriaForm.remarks || '',
      attachmentInfo: customAttachments.length > 0 ? JSON.stringify(customAttachments) : ''
    };

    setCriteriaList((prev) => [...prev, newItem]);
    setCustomCriteriaOpen(false);
  };

  const handleAddSelectedCriteria = () => {
    const selected = popupCriteria.filter((c) => selectedCriteriaIds.some(id => String(id) === String(c.id)));
    const newItems = selected.map((c, idx) => ({
      id: `master-${c.id}-${Date.now()}-${idx}`,
      seqNo: c.seqNo || criteriaList.length + idx + 1,
      clause: c.clause || '',
      criteriaDetails: c.criteriaText || '',
      attachmentReq: c.attachmentRequired ? 'YES' : 'NO',
      remarks: ''
    }));

    setCriteriaList((prev) => [...prev, ...newItems]);
    setSelectedCriteriaIds([]);
    setCriteriaDialogOpen(false);
  };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'ctrl+n': () => {
      if (canWrite) {
        if (isCriteriaOpen) {
          handleOpenCustomCriteria();
        } else {
          openCriteriaSelection();
        }
      }
    },
    'enter': (e) => { e.preventDefault(); handleSave(); },
    'escape': () => handleGoBack()
  });

  const availableCriteria = useMemo(() => {
    const result = (popupCriteria || []).filter(c => c).filter((c) => {
      const criteriaTextVal = c.criteriaText || c.criteria_text || '';
      const isAlreadyAdded = (Array.isArray(criteriaList) ? criteriaList : []).some((cl) => (cl.criteriaDetails || '').trim().toLowerCase() === criteriaTextVal.trim().toLowerCase());
      return !isAlreadyAdded && c.isActive !== false;
    });
    return result;
  }, [popupCriteria, criteriaList]);

  const mappedAuditAreas = useMemo(() => {
    const activeAreaDescriptions = new Set(
      (auditAreas || [])
        .filter(a => a && (a.isActive !== false && a.status?.toUpperCase() !== 'INACTIVE'))
        .map(a => a.description)
        .filter(Boolean)
    );

    const getActiveGlobalAreas = () => Array.from(activeAreaDescriptions);

    if (!formData.auditType || !auditTypes.length) {
      return getActiveGlobalAreas();
    }
    const selectedTypeObj = auditTypes.find(t => t && String(t.auditType || '').trim().toLowerCase() === String(formData.auditType || '').trim().toLowerCase());
    if (!selectedTypeObj || !selectedTypeObj.auditArea) {
      return getActiveGlobalAreas();
    }
    // Cross-reference with active master list so inactive areas are excluded
    const filtered = selectedTypeObj.auditArea.split(',').map(s => s.trim()).filter(s => s && activeAreaDescriptions.has(s));
    return filtered.length > 0 ? filtered : getActiveGlobalAreas();
  }, [formData.auditType, auditTypes, auditAreas]);

  const totalRequiredCount = useMemo(() => {
    const selectedTypes = (formData.auditType || '').split(',').filter((t) => t);
    return selectedTypes.reduce((acc, typeName) => {
      const match = (auditTypes || []).find(t => t?.auditType === typeName);
      return acc + (match?.criteriaMinCount || 0);
    }, 0);
  }, [formData.auditType, auditTypes]);

  useEffect(() => {
    if (totalRequiredCount > 0) {
      setFormData(prev => ({ ...prev, criteriaMinCount: totalRequiredCount }));
    }
  }, [totalRequiredCount]);

  return (
    <>
      <MainCard stretch={false}
        icon={IconCalendarEvent}
        title={"Audit Schedule Creation"}
        secondary={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {id && (
              <Button
                variant="contained"
                color="error"
                startIcon={<IconFileTypePdf size={18} />}
                onClick={() => setPdfDialogOpen(true)}
                sx={{
                  bgcolor: '#d32f2f',
                  '&:hover': { bgcolor: '#b71c1c' }
                }}
              >
                PDF
              </Button>
            )}
            <Button
              variant="contained"
              sx={btnCancel}
              startIcon={<IconArrowLeft size={18} />}
              onClick={handleGoBack}
            >
              Back
            </Button>
            {canWrite && (
              <BOSToggleSwitch
                name="updateConfig"
                value={updateConfig}
                onChange={(e) => {
                  const checked = e.target.value === true || e.target.value === 'true' || e.target.checked === true;
                  setUpdateConfig(checked);
                }}
                label="Update Config"
                checkedLabel="Yes"
                uncheckedLabel="No"
                checkedValue={true}
                uncheckedValue={false}
                sx={{ mr: 1 }}
              />
            )}
            {canWrite && (
              <Tooltip title={shortcutTooltip('Save Schedule', 'Ctrl + S')}>
                <Button variant="contained" sx={btnSave} onClick={handleSave} startIcon={<IconCheck size={20} />} >
                  Save
                </Button>
              </Tooltip>
            )}
          </Stack>
        }
      >
        <Stack spacing={3}>
          {/* Card 1: General Information */}
          <BOSFormSection icon={<IconFileDescription size={20} color={theme.palette.primary.main} />} title="General Information">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
              <BOSTextField label="Schedule No" value={formData.scheduleNo} inputProps={{ readOnly: true }} />
              <BOSDatePicker
                required
                label="Schedule Date"
                name="scheduleDate"
                value={formData.scheduleDate}
                error={!!errors.scheduleDate}
                helperText={errors.scheduleDate}
                disabled={true}
                sx={errorStyle(!!errors.scheduleDate)} />

              <Box>
                {isEditing ? (
                  <BOSTextField
                    select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={!canWrite}
                    fullWidth
                  >
                    <MenuItem value="OPEN">OPEN</MenuItem>
                    <MenuItem value="WAITING_APPROVAL">PENDING FOR APPROVAL</MenuItem>
                    <MenuItem value="CLOSED">CLOSED</MenuItem>
                    <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                  </BOSTextField>
                ) : (
                  <BOSTextField
                    label="Status"
                    name="status"
                    value={formData.status === 'WAITING_APPROVAL' ? 'PENDING FOR APPROVAL' : formData.status}
                    inputProps={{ readOnly: true }}
                    fullWidth
                  />
                )}
              </Box>

              <BOSTextField
                required
                type="number"
                label="Criteria Min Count"
                name="criteriaMinCount"
                value={formData.criteriaMinCount}
                onChange={handleChange}
                error={!!errors.criteriaMinCount}
                helperText={errors.criteriaMinCount}
                sx={[{ display: 'none' }, errorStyle(!!errors.criteriaMinCount)]}
              />
            </Box>
          </BOSFormSection>

          {/* Card 2: Audit Specifics */}
          <BOSFormSection icon={<IconCalendarEvent size={20} color={theme.palette.secondary.main} />} title="Audit Specifics">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
              <Autocomplete
                options={departments}
                getOptionLabel={(option) => option.departmentName || ''}
                value={departments.find((d) => d.departmentName === formData.department) || null}
                onChange={(event, newValue) => {
                  const newDeptName = newValue ? newValue.departmentName : '';
                  setFormData((prev) => {
                    let updatedAuditor = prev.auditor;
                    let updatedNcrApprovedBy = prev.ncrApprovedBy;

                    const checkDeptConflict = (empVal) => {
                      if (!empVal || !newDeptName) return empVal;
                      const code = empVal.includes(' - ') ? empVal.split(' - ')[1].trim() : empVal.trim();
                      const emp = employees.find(e =>
                        String(e?.oldEmpCode || e?.empCode || e?.employeeCode || e?.id || '').toLowerCase() === String(code).toLowerCase() ||
                        String(e?.newEmpCode || '').toLowerCase() === String(code).toLowerCase()
                      );
                      if (!emp) return '';
                      const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                      if (empDeptName?.trim().toLowerCase() === newDeptName.trim().toLowerCase()) return '';
                      return empVal;
                    };

                    updatedAuditor = checkDeptConflict(prev.auditor);
                    updatedNcrApprovedBy = checkDeptConflict(prev.ncrApprovedBy);

                    return {
                      ...prev,
                      department: newDeptName,
                      auditee: '',
                      auditor: updatedAuditor,
                      ncrApprovedBy: updatedNcrApprovedBy
                    };
                  });
                  setCriteriaList([]); // Reset criteria checklist
                }}
                disabled={!canWrite}
                renderInput={(params) => (
                  <BOSTextField
                    {...params}
                    required
                    label="Department"
                    error={!!errors.department}
                    helperText={errors.department}
                    sx={errorStyle(!!errors.department)} />
                )}
              />

              <Autocomplete
                options={auditTypes}
                getOptionLabel={(option) => option.auditType || ''}
                value={auditTypes.find((t) => t.auditType === formData.auditType) || null}
                onChange={(event, newValue) => {
                  const newAuditType = newValue ? newValue.auditType : '';
                  setFormData((prev) => {
                    let updatedAuditor = prev.auditor;
                    let updatedAuditee = prev.auditee;
                    let updatedNcrApprovedBy = prev.ncrApprovedBy;

                    const checkEligibility = (empVal, typeField, activeFlagField, role) => {
                      if (!empVal || !newAuditType) return '';
                      const code = empVal.includes(' - ') ? empVal.split(' - ')[1].trim() : empVal.trim();
                      const emp = employees.find(e =>
                        String(e?.oldEmpCode || e?.empCode || e?.employeeCode || e?.id || '').toLowerCase() === String(code).toLowerCase() ||
                        String(e?.newEmpCode || '').toLowerCase() === String(code).toLowerCase()
                      );
                      if (!emp) return '';
                      if (emp.status !== 'Active') return '';
                      if (emp[activeFlagField] !== 'YES') return '';
                      if (!hasAuditType(emp[typeField], newAuditType)) return '';
                      if (role === 'auditee') {
                        if (!prev.department) return '';
                        const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                        if (empDeptName?.trim().toLowerCase() !== prev.department?.trim().toLowerCase()) return '';
                      }
                      if (role === 'auditor' || role === 'ncrApprovedBy') {
                        const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                        if (prev.department && empDeptName?.trim().toLowerCase() === prev.department?.trim().toLowerCase()) return '';
                      }
                      return empVal;
                    };

                    updatedAuditor = checkEligibility(prev.auditor, 'auditorType', 'isAuditor', 'auditor');
                    updatedAuditee = checkEligibility(prev.auditee, 'auditeeType', 'isAuditee', 'auditee');
                    updatedNcrApprovedBy = checkEligibility(prev.ncrApprovedBy, 'ncrApproverType', 'isNcrApprover', 'ncrApprovedBy');

                    return {
                      ...prev,
                      auditType: newAuditType,
                      auditor: updatedAuditor,
                      auditee: updatedAuditee,
                      ncrApprovedBy: updatedNcrApprovedBy,
                      auditArea: '',
                      auditZone: '',
                      auditAreaDetail: ''
                    };
                  });
                  setCriteriaList([]); // Reset criteria checklist
                }}
                disabled={!canWrite}
                renderInput={(params) => (
                  <BOSTextField
                    {...params}
                    required
                    label="Audit Type"
                    error={!!errors.auditType}
                    helperText={errors.auditType}
                    sx={errorStyle(!!errors.auditType)} />
                )}
              />

              <BOSTextField
                select
                required
                label="Frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                error={!!errors.frequency}
                helperText={errors.frequency}
                disabled={!canWrite}
                sx={errorStyle(!!errors.frequency)} >
                {['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUAL', 'ANNUAL', 'CUSTOM'].map((f) => (
                  <MenuItem key={f} value={f}>{f}</MenuItem>
                ))}
              </BOSTextField>

              {formData.frequency === 'WEEKLY' && (
                <BOSTextField
                  select
                  required
                  label="Week Days"
                  name="weekDays"
                  value={formData.weekDays || ''}
                  onChange={handleChange}
                  error={!!errors.weekDays}
                  helperText={errors.weekDays}
                  disabled={!canWrite}
                  sx={errorStyle(!!errors.weekDays)} >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </BOSTextField>
              )}

              {formData.frequency === 'CUSTOM' && (
                <>
                  <BOSTextField
                    required
                    type="number"
                    label="Repeat Every"
                    name="repeatEveryValue"
                    value={formData.repeatEveryValue || ''}
                    onChange={handleChange}
                    error={!!errors.repeatEveryValue}
                    helperText={errors.repeatEveryValue}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.repeatEveryValue)} />
                  <BOSTextField
                    select
                    required
                    label="Schedule"
                    name="repeatEveryUnit"
                    value={formData.repeatEveryUnit || 'DAYS'}
                    onChange={handleChange}
                    error={!!errors.repeatEveryUnit}
                    helperText={errors.repeatEveryUnit}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.repeatEveryUnit)} >
                    {['DAYS', 'WEEKS', 'MONTHS', 'YEARS'].map((u) => (
                      <MenuItem key={u} value={u}>{u}</MenuItem>
                    ))}
                  </BOSTextField>
                </>
              )}
              <BOSTextField
                select
                required
                label="Audit Area"
                name="auditArea"
                value={formData.auditArea}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    auditArea: val,
                    auditZone: '',
                    auditAreaDetail: val
                  }));
                  if (errors.auditArea) {
                    setErrors(prev => ({ ...prev, auditArea: null }));
                  }
                }}
                error={!!errors.auditArea}
                helperText={errors.auditArea}
                disabled={!canWrite}
                sx={errorStyle(!!errors.auditArea)} >
                {mappedAuditAreas.map((areaName) => (
                  <MenuItem key={areaName} value={areaName}>{areaName}</MenuItem>
                ))}
              </BOSTextField>

              {/* Dynamic Field: Process Name for Process Audit */}
              {category === 'PROCESS_AUDIT' && (
                <Autocomplete
                  options={processMaster || []}
                  getOptionLabel={(option) => option?.processName || ''}
                  value={(processMaster || []).find((p) => p?.processName === formData.processName) || null}
                  onChange={(event, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      processName: newValue ? newValue.processName : ''
                    }));
                  }}
                  disabled={!canWrite}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      required
                      label="Process Name"
                      error={!!errors.processName}
                      helperText={errors.processName}
                      sx={errorStyle(!!errors.processName)} />
                  )}
                />
              )}

              {/* Dynamic Field: Item Code for Product Audit */}
              {category === 'PRODUCT_AUDIT' && (
                <BOSTextField
                  required
                  label="Item Code"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleChange}
                  error={!!errors.itemCode}
                  helperText={errors.itemCode}
                  disabled={!canWrite}
                  sx={errorStyle(!!errors.itemCode)} />
              )}

              {/* Dynamic Field: Supplier Name for Supplier Audit */}
              {category === 'SUPPLIER_AUDIT' && (
                <BOSTextField
                  required
                  label="Supplier Name"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  error={!!errors.supplierName}
                  helperText={errors.supplierName}
                  disabled={!canWrite}
                  sx={errorStyle(!!errors.supplierName)} />
              )}

              {/* Dynamic Field: Subcontractor Name for Subcontractor Audit */}
              {category === 'SUBCONTRACTOR_AUDIT' && (
                <BOSTextField
                  required
                  label="Subcontractor Name"
                  name="subcontractorName"
                  value={formData.subcontractorName}
                  onChange={handleChange}
                  error={!!errors.subcontractorName}
                  helperText={errors.subcontractorName}
                  disabled={!canWrite}
                  sx={errorStyle(!!errors.subcontractorName)} />
              )}

              {/* Customer Details: Rendered conditionally inside Audit Specifics section */}
              {category === 'CUSTOMER_AUDIT' && (
                <>
                  <Autocomplete
                    options={customers || []}
                    getOptionLabel={(option) => option?.customerName || ''}
                    value={(customers || []).find((c) => c?.customerName === formData.customerName) || null}
                    onChange={(event, newValue) => {
                      setFormData((prev) => ({
                        ...prev,
                        customerName: newValue ? newValue.customerName : '',
                        contactName: '',
                        externalName: '',
                        externalEmailId: '',
                        externalMobileNo: '',
                        fromEmailToCustomer: ''
                      }));
                      if (errors.customerName) setErrors(prev => ({ ...prev, customerName: null }));
                    }}
                    disabled={!canWrite}
                    renderInput={(params) => (
                      <BOSTextField
                        {...params}
                        required
                        label="Customer Name"
                        error={!!errors.customerName}
                        helperText={errors.customerName}
                        sx={errorStyle(!!errors.customerName)} />
                    )}
                  />

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Autocomplete
                      sx={{ flex: 1 }}
                      options={(localContacts || []).filter(c => c && ((!formData.customerName && c.status === 'Active') || (c.groupName && formData.customerName && c.groupName.trim().toLowerCase() === formData.customerName.trim().toLowerCase() && c.status === 'Active') || c.contactName === formData.contactName))}
                      getOptionLabel={(option) => option?.contactName || ''}
                      value={(localContacts || []).find(c => c?.contactName === formData.contactName) || null}
                      onChange={(event, newValue) => {
                        const email = newValue?.emailId || '';
                        const mobile = newValue?.mobileNo || newValue?.landlineNo || '';
                        const name = newValue?.contactName || '';
                        setFormData((prev) => ({
                          ...prev,
                          contactName: name,
                          externalName: name,
                          externalEmailId: email || (newValue ? '' : prev.externalEmailId),
                          externalMobileNo: mobile || (newValue ? '' : prev.externalMobileNo),
                          fromEmailToCustomer: email || prev.fromEmailToCustomer,
                          emailToCustomer: email ? 'YES' : prev.emailToCustomer
                        }));
                        if (errors.contactName) setErrors(prev => ({ ...prev, contactName: null }));
                        if (errors.externalEmailId) setErrors(prev => ({ ...prev, externalEmailId: null }));
                        if (errors.externalMobileNo) setErrors(prev => ({ ...prev, externalMobileNo: null }));
                      }}
                      disabled={!canWrite}
                      renderInput={(params) => (
                        <BOSTextField
                          {...params}
                          required
                          label="Contact Name"
                          error={!!errors.contactName}
                          helperText={errors.contactName}
                          sx={errorStyle(!!errors.contactName)} />
                      )}
                    />
                    {canWrite && (
                      <Tooltip title="Add New Contact">
                        <IconButton
                          color="primary"
                          onClick={() => setContactDialogOpen(true)}
                          sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px' }}
                        >
                          <IconPlus size={20} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <BOSTextField
                    select
                    label="Email To Customer"
                    name="emailToCustomer"
                    value={formData.emailToCustomer || 'YES'}
                    onChange={handleChange}
                    error={!!errors.emailToCustomer}
                    helperText={errors.emailToCustomer}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.emailToCustomer)} >
                    <MenuItem value="YES">YES</MenuItem>
                    <MenuItem value="NO">NO</MenuItem>
                  </BOSTextField>

                  {formData.emailToCustomer === 'YES' && (
                    <BOSTextField
                      required
                      label="From Email to Customer"
                      name="fromEmailToCustomer"
                      value={formData.fromEmailToCustomer}
                      onChange={handleChange}
                      error={!!errors.fromEmailToCustomer}
                      helperText={errors.fromEmailToCustomer}
                      disabled={!canWrite}
                      sx={errorStyle(!!errors.fromEmailToCustomer)} />
                  )}

                  <BOSTextField
                    required
                    label="External Email Id"
                    name="externalEmailId"
                    value={formData.externalEmailId}
                    onChange={handleChange}
                    error={!!errors.externalEmailId}
                    helperText={errors.externalEmailId}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.externalEmailId)} />

                  <BOSTextField
                    required
                    label="External Mobile No"
                    name="externalMobileNo"
                    value={formData.externalMobileNo}
                    onChange={handleChange}
                    error={!!errors.externalMobileNo}
                    helperText={errors.externalMobileNo}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.externalMobileNo)} />
                </>
              )}

              {/* Dynamic Fields for other External Audits (non-Customer) */}
              {selectedTypeObj?.customerAuditArea === 'YES' && category !== 'CUSTOMER_AUDIT' && (
                <>
                  <BOSTextField
                    required
                    label="External Name"
                    name="externalName"
                    value={formData.externalName}
                    onChange={handleChange}
                    error={!!errors.externalName}
                    helperText={errors.externalName}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.externalName)} />
                  <BOSTextField
                    required
                    label="External Email Id"
                    name="externalEmailId"
                    value={formData.externalEmailId}
                    onChange={handleChange}
                    error={!!errors.externalEmailId}
                    helperText={errors.externalEmailId}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.externalEmailId)} />
                  <BOSTextField
                    required
                    label="External Mobile No"
                    name="externalMobileNo"
                    value={formData.externalMobileNo}
                    onChange={handleChange}
                    error={!!errors.externalMobileNo}
                    helperText={errors.externalMobileNo}
                    disabled={!canWrite}
                    sx={errorStyle(!!errors.externalMobileNo)} />
                </>
              )}

              <BOSDatePicker
                required
                label="Audit Date"
                name="auditDate"
                value={formData.auditDate}
                onChange={handleChange}
                minDate={new Date()}
                blockHolidays={true}
                shouldDisableDate={shouldDisableAuditDate}
                error={!!errors.auditDate}
                helperText={errors.auditDate}
                disabled={!canWrite}
                sx={errorStyle(!!errors.auditDate)} />
              <BOSTimePicker
                required
                label="Start Time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                disabled={!canWrite}
                minTime={getDynamicMinStartTime()}
                maxTime="09:00 PM"
                error={!!errors.startTime}
                helperText={errors.startTime}
                sx={errorStyle(!!errors.startTime)} />
              <BOSTimePicker
                required
                label="End Time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                disabled={!canWrite}
                minTime={getDynamicMinEndTime()}
                maxTime="09:00 PM"
                error={!!errors.endTime}
                helperText={errors.endTime}
                sx={errorStyle(!!errors.endTime)} />

              {/* Dynamic Field: Co-Ordinator Select */}
              {(category === 'CUSTOMER_AUDIT' || selectedTypeObj?.customerAuditArea === 'YES') && (
                <BOSTextField
                  select
                  required
                  label="Co-Ordinator"
                  name="coOrdinator"
                  value={(() => {
                    const val = formData.coOrdinator;
                    if (!val) return '';
                    const valStr = String(val).trim().toLowerCase();
                    const valCode = valStr.includes(' - ') ? valStr.split(' - ')[1].trim() : '';
                    const valName = valStr.includes(' - ') ? valStr.split(' - ')[0].trim() : valStr;

                    // Compute options list to map
                    const coordOptions = (employees || []).filter(emp => emp).filter(emp => {
                      if (emp.status !== 'Active') return false;
                      const empIdVal = emp.id || emp.employeeId;
                      if (leaveEmployeeIds.includes(empIdVal)) return false;
                      if (!formData.department) return false;
                      const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                      return empDeptName?.trim().toLowerCase() === formData.department?.trim().toLowerCase();
                    }).map(emp => {
                      const fName = emp.firstName || '';
                      const lName = emp.lastName || '';
                      const empName = emp.employeeName || '';
                      let name = '';
                      if (fName && lName) {
                        name = `${fName} ${lName}`.trim();
                      } else if (empName && lName && !empName.toLowerCase().includes(lName.toLowerCase())) {
                        name = `${empName} ${lName}`.trim();
                      } else if (empName) {
                        name = empName;
                      } else {
                        name = `${fName} ${lName}`.trim();
                      }
                      return `${name} - ${emp.empCode || emp.employeeCode || emp.id}`;
                    });

                    const match = coordOptions.find(opt => {
                      const optStr = String(opt).trim().toLowerCase();
                      const optCode = optStr.includes(' - ') ? optStr.split(' - ')[1].trim() : '';
                      const optName = optStr.includes(' - ') ? optStr.split(' - ')[0].trim() : optStr;

                      if (valCode && optCode) return valCode === optCode;
                      return valName === optName;
                    });
                    return match || val;
                  })()}
                  onChange={handleChange}
                  error={!!errors.coOrdinator}
                  helperText={errors.coOrdinator}
                  disabled={!canWrite}
                  sx={errorStyle(!!errors.coOrdinator)} >

                  {(() => {
                    const coordOptions = (employees || []).filter(emp => emp).filter(emp => {
                      if (emp.status !== 'Active') return false;
                      const empIdVal = emp.id || emp.employeeId;
                      if (leaveEmployeeIds.includes(empIdVal)) return false;
                      if (!formData.department) return false;
                      const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                      return empDeptName?.trim().toLowerCase() === formData.department?.trim().toLowerCase();
                    }).map(emp => {
                      const fName = emp.firstName || '';
                      const lName = emp.lastName || '';
                      const empName = emp.employeeName || '';
                      let name = '';
                      if (fName && lName) {
                        name = `${fName} ${lName}`.trim();
                      } else if (empName && lName && !empName.toLowerCase().includes(lName.toLowerCase())) {
                        name = `${empName} ${lName}`.trim();
                      } else if (empName) {
                        name = empName;
                      } else {
                        name = `${fName} ${lName}`.trim();
                      }
                      return `${name} - ${emp.empCode || emp.employeeCode || emp.id}`;
                    });

                    const val = formData.coOrdinator;
                    if (val) {
                      const valStr = String(val).trim().toLowerCase();
                      const valCode = valStr.includes(' - ') ? valStr.split(' - ')[1].trim() : '';
                      const valName = valStr.includes(' - ') ? valStr.split(' - ')[0].trim() : valStr;

                      const hasMatch = coordOptions.some(opt => {
                        const optStr = String(opt).trim().toLowerCase();
                        const optCode = optStr.includes(' - ') ? optStr.split(' - ')[1].trim() : '';
                        const optName = optStr.includes(' - ') ? optStr.split(' - ')[0].trim() : optStr;

                        if (valCode && optCode) return valCode === optCode;
                        return valName === optName;
                      });

                      if (!hasMatch) {
                        coordOptions.push(val);
                      }
                    }

                    return coordOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt.includes(' - ') ? opt.split(' - ')[0].trim() : opt}</MenuItem>
                    ));
                  })()}
                </BOSTextField>
              )}
            </Box>
          </BOSFormSection>



          {/* Card 3: Personnel Information */}
          <BOSFormSection icon={<IconUsers size={20} color={theme.palette.warning.main} />} title="Personnel Information">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              {(() => {
                const selectedTypeObj = (auditTypes || []).find(t => t.auditType === formData.auditType);
                const isExternalAudit = selectedTypeObj?.customerAuditArea === 'YES';

                return [
                  { role: 'AUDITEE', field: 'auditee', typeField: 'auditeeType', label: 'Auditee' },
                  { role: 'AUDITOR', field: 'auditor', typeField: 'auditorType', label: 'Auditor' },
                  { role: 'NC APPROVED BY', field: 'ncrApprovedBy', typeField: 'ncrApprovedByType', label: 'NC Approved By' }
                ].map((person) => {
                  const isAuditorExt = person.role === 'AUDITOR' && isExternalAudit;

                  if (isAuditorExt) {
                    return (
                      <Card key={person.role} sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '16px',
                        boxShadow: 2,
                        bgcolor: isDark ? 'background.default' : '#fff',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'auto',
                        minHeight: 380
                      }}>
                        <Box sx={{ height: 60, bgcolor: isDark ? 'primary.dark' : 'primary.light', width: '100%', position: 'absolute', top: 0, left: 0, opacity: isDark ? 0.3 : 0.6 }} />
                        <CardContent sx={{ p: 3, pt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, flexGrow: 1 }}>
                          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={
                                canWrite && (
                                  <IconButton
                                    component="label"
                                    sx={{
                                      bgcolor: 'primary.main',
                                      color: '#fff',
                                      '&:hover': { bgcolor: 'primary.dark' },
                                      width: 32,
                                      height: 32,
                                      boxShadow: 2,
                                      bottom: 10,
                                      right: 10
                                    }}
                                  >
                                    <IconPlus size={18} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          setFormData(p => ({ ...p, externalAuditorImage: e.target.files[0] }));
                                        }
                                      }}
                                    />
                                  </IconButton>
                                )
                              }
                            >
                              {formData.externalAuditorImage ? (
                                <Avatar src={getPhotoUrl(formData.externalAuditorImage)} sx={{ width: 100, height: 100, mb: 1, borderRadius: '50%', border: '4px solid', borderColor: isDark ? 'background.default' : '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                              ) : (
                                <Avatar sx={{ width: 100, height: 100, mb: 1, borderRadius: '50%', bgcolor: isDark ? '#1c2128' : '#fff', border: '4px solid', borderColor: isDark ? 'background.default' : '#fff', color: 'primary.main', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}><IconUsers size={48} /></Avatar>
                              )}
                            </Badge>
                          </Box>
                          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, mb: 0.5, fontSize: '0.8rem' }}>AUDITOR (EXTERNAL)</Typography>
                          <Typography variant="h6" fontWeight={700} color="text.primary" noWrap sx={{ width: '100%', textAlign: 'center', mb: 0.5 }}>{formData.externalName || 'Not Provided'}</Typography>

                          <Stack spacing={0.5} alignItems="center" sx={{ mb: 2, width: '100%' }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Email: {formData.externalEmailId || '-'}</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Mobile: {formData.externalMobileNo || '-'}</Typography>
                          </Stack>

                          <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', px: 2.5, py: 0.5, borderRadius: '16px', mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>External</Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  }

                  const value = formData[person.field];
                  const name = value ? value.split(' - ')[0].trim() : '-';
                  const code = value ? (value.split(' - ')[1] || '').trim() || '-' : '-';

                  const seen = new Set();
                  const filteredEmployees = (employees || []).filter(emp => emp).filter(emp => {
                    if (emp.status !== 'Active') return false;

                    const empIdVal = emp.id || emp.employeeId;
                    if (leaveEmployeeIds.includes(empIdVal)) return false;

                    const empCode = emp.oldEmpCode || emp.empCode || emp.employeeCode || emp.id;
                    if (seen.has(empCode)) return false;
                    seen.add(empCode);

                    const empDeptName = emp.department?.departmentName || (departments || []).find(d => d && String(d.id) === String(emp.departmentId || emp.department?.id))?.departmentName;
                    const sameDept = empDeptName && formData.department && empDeptName.trim().toLowerCase() === formData.department.trim().toLowerCase();

                    if (person.field === 'auditor') {
                      return emp.isAuditor === 'YES' && hasAuditType(emp.auditorType, formData.auditType) && !sameDept;
                    }
                    if (person.field === 'auditee') {
                      if (!formData.department) return false;
                      return emp.isAuditee === 'YES' && sameDept && hasAuditType(emp.auditeeType, formData.auditType);
                    }
                    if (person.field === 'ncrApprovedBy') {
                      return emp.isNcrApprover === 'YES' && hasAuditType(emp.ncrApproverType, formData.auditType) && !sameDept;
                    }
                    return true;
                  });

                  const getEmpLabel = (emp) => {
                    if (!emp) return '';
                    const fName = emp.firstName || '';
                    const lName = emp.lastName || '';
                    const empName = emp.employeeName || '';

                    let name = '';
                    if (fName && lName) {
                      name = `${fName} ${lName}`.trim();
                    } else if (empName && lName && !empName.toLowerCase().includes(lName.toLowerCase())) {
                      name = `${empName} ${lName}`.trim();
                    } else if (empName) {
                      name = empName;
                    } else {
                      name = `${fName} ${lName}`.trim();
                    }
                    return `${name} - ${emp.oldEmpCode || emp.empCode || emp.employeeCode || emp.id}`;
                  };

                  const selectedEmp = (employees || []).find(emp => {
                    const label = getEmpLabel(emp);
                    if (label === value) return true;
                    if (value) {
                      const valStr = String(value);
                      if (valStr.includes(' - ')) {
                        const code = valStr.split(' - ')[1];
                        return String(emp?.oldEmpCode || emp?.empCode || emp?.employeeCode || emp?.id || '').toLowerCase() === String(code).toLowerCase() ||
                          String(emp?.newEmpCode || '').toLowerCase() === String(code).toLowerCase();
                      } else {
                        // Fallback name matching case-insensitively
                        const fName = emp.firstName || '';
                        const lName = emp.lastName || '';
                        const empName = emp.employeeName || '';
                        const names = [
                          empName.toLowerCase(),
                          `${fName} ${lName}`.trim().toLowerCase(),
                          `${empName} ${lName}`.trim().toLowerCase()
                        ].filter(Boolean);
                        return names.includes(valStr.trim().toLowerCase());
                      }
                    }
                    return false;
                  });

                  const empDeptName = selectedEmp ? ((departments || []).find(d => d && String(d.id) === String(selectedEmp.departmentId))?.departmentName || '-') : '-';

                  // Resolution for Level (using levels or designations lookup)
                  let empLevel = '-';
                  if (selectedEmp) {
                    const levelMatch = (finalLevels || []).find(l => l && String(l.rowId || l.id) === String(selectedEmp.empLevelId));
                    const desigMatch = (designations || []).find(d => d && String(d.id) === String(selectedEmp.designationId));
                    empLevel = levelMatch?.level || levelMatch?.levelName || desigMatch?.designationName || '-';
                  }

                  const employeeOptions = filteredEmployees.map(emp => getEmpLabel(emp));
                  if (value) {
                    const valStr = String(value).trim().toLowerCase();
                    const valCode = valStr.includes(' - ') ? valStr.split(' - ')[1].trim() : '';
                    const valName = valStr.includes(' - ') ? valStr.split(' - ')[0].trim() : valStr;

                    const hasMatch = employeeOptions.some(opt => {
                      const optStr = String(opt).trim().toLowerCase();
                      const optCode = optStr.includes(' - ') ? optStr.split(' - ')[1].trim() : '';
                      const optName = optStr.includes(' - ') ? optStr.split(' - ')[0].trim() : optStr;

                      if (valCode && optCode) return valCode === optCode;
                      return valName === optName;
                    });

                    if (!hasMatch) {
                      employeeOptions.push(value);
                    }
                  }
                  if (selectedEmp) {
                    const label = getEmpLabel(selectedEmp);
                    if (label) {
                      const labelStr = String(label).trim().toLowerCase();
                      const labelCode = labelStr.includes(' - ') ? labelStr.split(' - ')[1].trim() : '';
                      const labelName = labelStr.includes(' - ') ? labelStr.split(' - ')[0].trim() : labelStr;

                      const hasMatch = employeeOptions.some(opt => {
                        const optStr = String(opt).trim().toLowerCase();
                        const optCode = optStr.includes(' - ') ? optStr.split(' - ')[1].trim() : '';
                        const optName = optStr.includes(' - ') ? optStr.split(' - ')[0].trim() : optStr;

                        if (labelCode && optCode) return optCode === labelCode;
                        return optName === labelName;
                      });

                      if (!hasMatch) {
                        employeeOptions.push(label);
                      }
                    }
                  }

                  return (
                    <Card key={person.role} sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '16px',
                      boxShadow: 2,
                      bgcolor: isDark ? 'background.default' : '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      height: 'auto',
                      minHeight: 380
                    }}>
                      <Box sx={{ height: 60, bgcolor: isDark ? 'primary.dark' : 'primary.light', width: '100%', position: 'absolute', top: 0, left: 0, opacity: isDark ? 0.3 : 0.6 }} />
                      <CardContent sx={{ p: 3, pt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, flexGrow: 1 }}>
                        <Avatar
                          src={selectedEmp ? getPhotoUrl(selectedEmp.photoPath || selectedEmp.employeePhotoUpload) : null}
                          sx={{
                            width: 100, height: 100, borderRadius: '50%', bgcolor: isDark ? '#1c2128' : '#fff', border: '4px solid',
                            borderColor: isDark ? 'background.default' : '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            color: 'primary.main', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', mb: 2
                          }}
                        >
                          {!selectedEmp || !(selectedEmp.photoPath || selectedEmp.employeePhotoUpload) ? <IconUsers size={48} /> : null}
                        </Avatar>
                        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, mb: 0.5, fontSize: '0.8rem' }}>{person.role}</Typography>
                        <Typography variant="h6" fontWeight={700} color="text.primary" noWrap sx={{ width: '100%', textAlign: 'center', mb: 0.5 }}>{name !== '-' ? name : 'Not Selected'}</Typography>

                        {/* SOP: Display Dept and Level in Profile Card */}
                        <Stack spacing={0.5} alignItems="center" sx={{ mb: 2, width: '100%' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Dept: {empDeptName}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Level: {empLevel}</Typography>
                        </Stack>

                        <Box sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', px: 2.5, py: 0.5, borderRadius: '16px', mb: 3 }}>
                          <Typography variant="body2" color="text.secondary" fontWeight={600} noWrap>{selectedEmp ? (selectedEmp.oldEmpCode || selectedEmp.empCode || 'No Code') : (code !== '-' ? code : 'No Code')}</Typography>
                        </Box>
                        <Stack spacing={2} sx={{ width: '100%' }}>
                          <BOSTextField
                            select
                            required
                            label={`Select ${person.label}`}
                            name={person.field}
                            value={(() => {
                              const val = formData[person.field];
                              if (!val) return '';
                              const valStr = String(val).trim().toLowerCase();
                              const valCode = valStr.includes(' - ') ? valStr.split(' - ')[1].trim() : '';
                              const valName = valStr.includes(' - ') ? valStr.split(' - ')[0].trim() : valStr;

                              const match = employeeOptions.find(opt => {
                                const optStr = String(opt).trim().toLowerCase();
                                const optCode = optStr.includes(' - ') ? optStr.split(' - ')[1].trim() : '';
                                const optName = optStr.includes(' - ') ? optStr.split(' - ')[0].trim() : optStr;

                                if (valCode && optCode) return valCode === optCode;
                                return valName === optName;
                              });
                              return match || val;
                            })()}
                            onChange={handleChange}
                            error={!!errors[person.field]}
                            helperText={errors[person.field]}
                            disabled={!canWrite}
                            sx={errorStyle(!!errors[person.field])} >

                            {filteredEmployees.length === 0 ? (
                              <MenuItem disabled value="">
                                {person.field === 'auditee' ? "No eligible Auditee found." : (person.field === 'auditor' ? "No eligible Auditor found." : "No eligible NCR person found.")}
                              </MenuItem>
                            ) : (
                              employeeOptions.map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt.includes(' - ') ? opt.split(' - ')[0].trim() : opt}</MenuItem>
                              ))
                            )}
                          </BOSTextField>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </Box>
          </BOSFormSection>

          {/* Card 4: Audit Criteria Checklist */}
          {!isCriteriaOpen && (
            <BOSFormSection icon={<IconListCheck size={20} color={theme.palette.success.main} />} title="Audit Criteria">
              {canWrite && (
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box />
                  <Stack direction="row" spacing={1.5}>
                    <Tooltip title={shortcutTooltip(isCriteriaOpen ? 'Add' : 'Add Criteria', 'Ctrl + N')}>
                      <span>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            if (isCriteriaOpen) {
                              handleOpenCustomCriteria();
                            } else {
                              openCriteriaSelection();
                            }
                          }}
                          disabled={!perms.write}
                          startIcon={<IconPlus size={16} />}
                          sx={{ borderRadius: '8px' }}
                        >
                          {isCriteriaOpen ? 'Add' : 'Add Criteria'}
                        </Button>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
              <BOSDataTable
                columns={(category === 'SUPPLIER_ASSESSMENT') ? [
                  { id: 'clause', label: 'Clause', minWidth: 100, align: 'center' },
                  { id: 'criteriaDetails', label: 'Agenda', minWidth: 650, align: 'left' },
                  { id: 'attachmentReq', label: 'Att. Req', minWidth: 70, align: 'center' },
                  { id: 'remarks', label: 'Remarks', minWidth: 150, align: 'left' }
                ] : [
                  { id: 'index', label: '#', minWidth: 50, align: 'center' },
                  { id: 'seqNo', label: 'Seq No', minWidth: 80, align: 'center' },
                  { id: 'clause', label: 'Clause', minWidth: 100, align: 'center' },
                  { id: 'criteriaDetails', label: 'Criteria Details', minWidth: 650, align: 'left' },
                  { id: 'attachmentReq', label: 'Att. Req', minWidth: 70, align: 'center' },
                  { id: 'remarks', label: 'Remarks', minWidth: 150, align: 'left' }
                ]}
                rows={criteriaList}
                page={0}
                size={999}
                totalCount={criteriaList.length}
                disableSearchFilter={true}
                onPageChange={() => { }}
                onSizeChange={() => { }}
                onDeleteRow={canWrite ? (row) => handleRemoveCriteria(criteriaList.indexOf(row)) : undefined}
                showActions={canWrite}
                renderCell={(col, row, idx) => {
                  if (col.id === 'index') return idx + 1;
                  if (col.id === 'attachmentReq') return <BOSStatusChip status={row.attachmentReq === 'YES' ? 'YES' : 'NO'} showIcon={true} width={120} toneOverride={row.attachmentReq === 'YES' ? 'success' : 'danger'} />;
                  return row[col.id] || '-';
                }}
                sx={{ minHeight: '300px' }}
              />
            </BOSFormSection>
          )}
        </Stack>
      </MainCard>

      {/* Criteria Selection Dialog */}
      <BOSFormDialog
        open={criteriaDialogOpen}
        onClose={() => setCriteriaDialogOpen(false)}
        onSave={handleAddSelectedCriteria}
        onClear={() => setSelectedCriteriaIds([])}
        title="Select Audit Criteria"
        maxWidth="lg"
      >
        <Paper sx={{ p: 0, height: 500, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <BOSDataTable
            selectedRowId={selectedCriteriaIds}
            columns={(category === 'SUPPLIER_ASSESSMENT') ? [
              { id: 'select', label: '', minWidth: 50, align: 'center' },
              { id: 'clause', label: 'Clause', minWidth: 100, align: 'center' },
              { id: 'criteriaText', label: 'Agenda', minWidth: 650, align: 'left' },
              { id: 'attachmentRequired', label: 'Att. Req', minWidth: 70, align: 'center' }
            ] : [
              { id: 'select', label: '', minWidth: 50, align: 'center' },
              { id: 'seqNo', label: 'Seq No', minWidth: 80, align: 'center' },
              { id: 'clause', label: 'Clause', minWidth: 100, align: 'center' },
              { id: 'criteriaText', label: 'Criteria Details', minWidth: 650, align: 'left' },
              { id: 'attachmentRequired', label: 'Att. Req', minWidth: 70, align: 'center' }
            ]}
            rows={availableCriteria}
            page={0}
            size={999}
            disableSearchFilter={true}
            onPageChange={() => { }}
            onSizeChange={() => { }}
            showActions={false}
            onClickRow={(row) => {
              setSelectedCriteriaIds(prev =>
                prev.some(id => String(id) === String(row.id))
                  ? prev.filter(id => String(id) !== String(row.id))
                  : [...prev, row.id]
              );
            }}
            renderCell={(col, row) => {
              if (col.id === 'select') {
                return (
                  <Checkbox
                    size="small"
                    checked={selectedCriteriaIds.some(id => String(id) === String(row.id))}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedCriteriaIds(prev => {
                        const exists = prev.some(id => String(id) === String(row.id));
                        if (checked && !exists) {
                          return [...prev, row.id];
                        } else if (!checked && exists) {
                          return prev.filter(id => String(id) !== String(row.id));
                        }
                        return prev;
                      });
                    }}
                  />
                );
              }
              if (col.id === 'attachmentRequired') return <BOSStatusChip status={row.attachmentRequired ? 'YES' : 'NO'} showIcon={true} width={120} toneOverride={row.attachmentRequired ? 'success' : 'danger'} />;
              return row[col.id] || '-';
            }}
          />
        </Paper>
      </BOSFormDialog>

      {/* Custom Criteria Popup Dialog */}
      <BOSFormDialog
        open={customCriteriaOpen}
        onClose={() => setCustomCriteriaOpen(false)}
        onSave={handleSaveCustomCriteria}
        onClear={() => {
          setCustomCriteriaForm({ seqNo: criteriaList.length + 1, clause: '', criteriaDetails: '', attachmentReq: 'NO', remarks: '' });
          setCustomAttachments([]);
        }}
        title="Add Custom Criteria"
        maxWidth="sm"
      >
        <BOSFormSection icon={<IconPlus size={20} color={theme.palette.primary.main} />} title="Criteria Details">
          <BOSTextField
            required
            type="number"
            name="seqNo"
            label="Seq No"
            value={customCriteriaForm.seqNo}
            onChange={(e) => setCustomCriteriaForm(prev => ({ ...prev, seqNo: e.target.value }))}
          />
          <BOSTextField
            required
            name="clause"
            label="Clause"
            value={customCriteriaForm.clause}
            onChange={(e) => setCustomCriteriaForm(prev => ({ ...prev, clause: e.target.value }))}
          />
          <BOSTextField
            required
            multiline
            rows={3}
            name="criteriaDetails"
            label="Criteria Details"
            value={customCriteriaForm.criteriaDetails}
            onChange={(e) => setCustomCriteriaForm(prev => ({ ...prev, criteriaDetails: e.target.value }))}
          />
          <BOSTextField
            select
            name="attachmentReq"
            label="Attachment Req"
            value={customCriteriaForm.attachmentReq}
            onChange={(e) => setCustomCriteriaForm(prev => ({ ...prev, attachmentReq: e.target.value }))}
          >
            <MenuItem value="YES">YES</MenuItem>
            <MenuItem value="NO">NO</MenuItem>
          </BOSTextField>
          <BOSTextField
            name="remarks"
            label="Remarks"
            value={customCriteriaForm.remarks}
            onChange={(e) => setCustomCriteriaForm(prev => ({ ...prev, remarks: e.target.value }))}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Attachment {customCriteriaForm.attachmentReq === 'YES' && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <BOSFileUpload
              files={customAttachments}
              onChange={setCustomAttachments}
              module="QUALITY_MANAGEMENT_SYSTEMS_AUDIT_AUDIT_SCHEDULE"
              multiple={false}
              compact={true}
            />
          </Box>
        </BOSFormSection>
      </BOSFormDialog>
      <AddContactDialog
        open={contactDialogOpen}
        handleClose={() => {
          setContactDialogOpen(false);
          refreshContacts();
        }}
        initialGroupName={formData.customerName || formData.externalName || ''}
      />
      {/* Line Item Audit Schedule PDF Report Dialog */}
      <AuditSchedulePDFDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        row={{ ...formData, id, criteriaList: criteriaList }}
      />
    </>
  );
}
