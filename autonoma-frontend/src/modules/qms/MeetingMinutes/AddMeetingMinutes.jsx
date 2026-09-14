import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  MenuItem,
  Stack,
  Box,
  Typography,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Grid,
  useTheme,
  CircularProgress,
  Tooltip,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  TablePagination,
  Card,
  CardContent,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Fade
} from '@mui/material';
import { BOSFormSection, BOSTextField, BOSFormDialog, BOSAutocomplete, BOSAnalogTimePicker, btnSave, btnCancel, btnClear, BOSDataTable, BOSDatePicker, errorStyle, BOSStatusChip, BOSFileUpload } from 'ui-component/bos';
import {
  IconPlus,
  IconTrash,
  IconSettings,
  IconUsers,
  IconMessageDots,
  IconDeviceFloppy,
  IconArrowLeft,
  IconEraser,
  IconFileText,
  IconDeviceFloppy as IconSave,
  IconEdit,
  IconMicrophone,
  IconMicrophoneOff,
  IconClock,
  IconPaperclip,
  IconPlayerPause,
  IconPlayerPlay,
  IconMaximize,
  IconMinimize,
  IconLayoutGrid,
  IconTable,
  IconX,
  IconUser,
  IconUserCheck,
  IconCalendarEvent,
  IconAlertCircle,
  IconInfoCircle,
  IconFileTypePdf
} from '@tabler/icons-react';
import { parseFileString } from 'ui-component/bos/BOSUtils';
import MainCard from 'ui-component/cards/MainCard';
import MomPDFDialog from './MomPDFDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import { useLookups } from 'hooks/useLookups';
import useMasterDataStore from 'store/useMasterDataStore';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import { API_PATHS } from 'utils/api-constants';
import MaterialSelectionDialog from './MaterialSelectionDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { startUniversalCall } from 'utils/universalCallManager';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';

// Format: MM/CCRM/2026-2027/001
const TODAY = new Date().toISOString().split('T')[0];
const DEFAULT_DISCUSSED_POINT = 'Minutes of Meeting (MOM) should be clear, concise, and context-rich so that anyone (even someone new or reviewing it after a long time) can understand the key decisions, discussions, and next steps without needing extra explanation.';

const isSunday = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr).getDay() === 0;
};

const isWeekendOrHoliday = (dateObj, holidaysList) => {
  const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return true;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${dayOfMonth}`;

  return (holidaysList || []).some(h => {
    if (h.isActive === false) return false;
    const rawStart = h.fromDate || h.holidayDate;
    const rawEnd = h.toDate || rawStart;
    if (rawStart && rawEnd) {
      const start = String(rawStart).slice(0, 10);
      const end = String(rawEnd).slice(0, 10);
      return formattedDate >= start && formattedDate <= end;
    }
    return false;
  });
};

const getSeventhWorkingDate = (holidaysList) => {
  let date = new Date();
  let workingDaysCount = 0;
  while (workingDaysCount < 7) {
    date.setDate(date.getDate() + 1);
    if (!isWeekendOrHoliday(date, holidaysList)) {
      workingDaysCount++;
    }
  }
  return date.toISOString().split('T')[0];
};

const formatTo24hString = (time) => {
  if (!time) return '';
  if (Array.isArray(time)) {
    const [h, m] = time;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (typeof time === 'string') {
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
  }
  return time;
};

const to24h = (time12h) => {
  if (!time12h) return '';
  if (!time12h.toUpperCase().includes('AM') && !time12h.toUpperCase().includes('PM')) {
    return formatTo24hString(time12h);
  }
  const [time, modifier] = time12h.trim().split(' ');
  let [hours, minutes] = time.split(':');
  let h = parseInt(hours, 10);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${minutes}`;
};

const to12h = (timeVal) => {
  if (!timeVal) return '';
  const time24h = formatTo24hString(timeVal);
  if (!time24h) return '';
  const parts = time24h.split(':');
  const h24 = parseInt(parts[0], 10);
  const h12 = h24 % 12 || 12;
  const modifier = h24 >= 12 ? 'PM' : 'AM';
  return `${String(h12).padStart(2, '0')}:${parts[1].substring(0, 2)} ${modifier}`;
};

const getHoursMinutes = (timeVal) => {
  if (!timeVal) return [0, 0];
  if (Array.isArray(timeVal)) {
    return [parseInt(timeVal[0], 10), parseInt(timeVal[1], 10)];
  }
  const parts = String(timeVal).split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0];
};

const getCurrent24hTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const calculateAttendanceStatus = (inTime, outTime, startTime, endTime) => {
  if (!inTime || inTime.trim() === '') return 'ABSENT';

  const start24 = formatTo24hString(startTime) || '09:00';
  const end24 = formatTo24hString(endTime) || '10:00';

  if (outTime && outTime.trim() !== '') {
    if (outTime < end24) {
      return 'EARLY_OUT';
    }
  }

  if (inTime < start24) {
    return 'EARLY_IN';
  } else if (inTime > start24) {
    return 'LATE';
  }
  return 'PRESENT';
};

const getStatusLabelAndTone = (status) => {
  const norm = String(status || '').toUpperCase();
  if (norm === 'EARLY_IN') return { label: 'Early In', tone: 'info' };
  if (norm === 'EARLY_OUT') return { label: 'Early Out', tone: 'warning' };
  if (norm === 'LATE') return { label: 'Late', tone: 'warning' };
  if (norm === 'ABSENT') return { label: 'Absent', tone: 'danger' };
  return { label: 'Present', tone: 'success' };
};

const sortAttendanceList = (list, hostId) => {
  if (!list) return [];
  const hostIdStr = hostId ? String(hostId) : null;
  return [...list].sort((a, b) => {
    const aIsHost = a.employee && hostIdStr && String(a.employee.id) === hostIdStr;
    const bIsHost = b.employee && hostIdStr && String(b.employee.id) === hostIdStr;
    if (aIsHost && !bIsHost) return -1;
    if (!aIsHost && bIsHost) return 1;
    return 0;
  });
};

const INITIAL_FORM = {
  momNo: 'AUTO-GENERATE',
  momDate: TODAY,
  schedule: null,
  agenda: '',
  chairedBy: null,
  startTime: '09:00',
  endTime: '10:00',
  attendanceList: [],
  details: []
};

const getUserId = (user) => {
  if (!user) return null;
  if (typeof user === 'object') {
    return user.id || user.ID || user.employeeId || user.empId || user.userId || user.value || null;
  }
  return user;
};

export default function AddMeetingMinutes() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editId = id || searchParams.get('id');
  const isEdit = Boolean(editId);

  const { meetingSchedules = [], employees = [], holidays = [], refetch } = useLookups(['MEETING_SCHEDULES_ACTIVE', 'EMPLOYEES', 'HOLIDAYS']);
  const perms = usePagePermissions(PAGE_CODES.QMS_MEETING_MOM);
  const { errors, validate, clearErrors, handleInputChange } = useBOSValidation();
  const { user } = useAuth();
  const [formErrors, setFormErrors] = useState({});
  const [dialogErrors, setDialogErrors] = useState({});
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [fetchingAttendance, setFetchingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [materialDialog, setMaterialDialog] = useState({ open: false, rowIdx: null, type: 'RM' });
  const [pausedRows, setPausedRows] = useState({});
  const [isDiscussionMaximized, setIsDiscussionMaximized] = useState(false);
  const [discussionViewMode, setDiscussionViewMode] = useState('card');
  const [detailPage, setDetailPage] = useState(0);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [activeSchedules, setActiveSchedules] = useState([]);

  const loadActiveSchedules = useCallback(async () => {
    try {
      const res = await axios.get(API_PATHS.QMS.MEETING_SCHEDULES_ACTIVE);
      const list = Array.isArray(res.data) ? res.data : (res.data?.meetingSchedules || res.data?.content || []);
      setActiveSchedules(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load active schedules:', err);
    }
  }, []);
  const handleOpenGroupCall = () => {
    const meetingTypeStr = typeof form.schedule?.meetingType === 'object'
      ? (form.schedule?.meetingType?.typeName || form.schedule?.meetingType?.name || 'DRM')
      : (form.schedule?.meetingType || form.meetingType || 'Meeting');

    // Gather all attendees: attendanceList + chairedBy if available
    const allCandidates = [...(form.attendanceList || [])];
    const chair = form.schedule?.chairedBy || form.chairedBy;
    if (chair) {
      const chairId = typeof chair === 'object' ? (chair.id || chair.empId) : null;
      const chairName = typeof chair === 'object' ? chair.employeeName : String(chair);
      const alreadyInList = allCandidates.some((a) => {
        const aId = a.employee?.id || a.id;
        const aName = a.employee?.employeeName || a.employeeName;
        return (aId && chairId && String(aId) === String(chairId)) || (aName && chairName && aName.toLowerCase() === chairName.toLowerCase());
      });
      if (!alreadyInList) {
        allCandidates.push({
          employee: typeof chair === 'object' ? chair : { employeeName: String(chair) },
          attendanceStatus: 'PRESENT'
        });
      }
    }

    startUniversalCall({
      callType: 'GROUP_MEETING',
      title: `Live Group Conference • ${form.schedule?.scheduleNo || form.meetingScheduleNo || 'QMS'}`,
      subtitle: `${meetingTypeStr} • ${allCandidates.length} Members`,
      schedule: form.schedule,
      participants: allCandidates,
      onSyncAttendance: (connectedIds) => {
        setForm((prev) => {
          const now24 = getCurrent24hTime();
          const updatedList = (prev.attendanceList || []).map((att) => {
            const empId = att.employee?.id ? String(att.employee.id) : null;
            if (empId && connectedIds.includes(empId)) {
              return {
                ...att,
                inTime: att.inTime || now24,
                attendanceStatus: 'PRESENT'
              };
            }
            return att;
          });
          return { ...prev, attendanceList: updatedList };
        });
        dispatch(
          openSnackbar({
            open: true,
            message: 'Attendance automatically synced for live video call members!',
            severity: 'success',
            variant: 'alert'
          })
        );
      }
    });
  };

  const handleOpenIndividualCall = (att) => {
    if (!att || !att.employee) return;
    const emp = att.employee;
    const targetUserId = emp.empCode || emp.id || emp.userId || emp.userName;

    startUniversalCall({
      targetUser: {
        ...emp,
        userId: targetUserId,
        id: emp.id,
        empId: emp.id,
        empCode: emp.empCode || emp.employeeCode || emp.oldEmpCode,
        employeeCode: emp.empCode || emp.employeeCode || emp.oldEmpCode,
        userName: emp.userName || emp.userId || emp.empCode,
        employeeName: emp.employeeName || 'Attendee',
        departmentName: emp.department?.departmentName || '',
        designationName: emp.designation?.designationName || 'Participant',
        imgName: emp.profileUpload || emp.image
      },
      callType: 'DIRECT',
      title: `Direct Video Call • ${emp.employeeName || 'Attendee'}`,
      subtitle: `${emp.designation?.designationName || 'Participant'} • ${emp.department?.departmentName || 'Employee'}`
    });
  };

  const [detailDialog, setDetailDialog] = useState({
    open: false,
    rowIdx: null,
    form: {
      meetNo: '',
      amendMeetNo: '',
      discussedPoint: '',
      type: '',
      materialList: '',
      processType: 'INFO',
      assignedBy: null,
      assignedTo: null,
      targetDate: '',
      reviewDate: '',
      attachmentRequired: 'NO',
      status: 'CLOSED',
      isAmended: false
    }
  });

  // Separate Escape key handler for Maximized View vs Child Dialogs
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' || e.key === 'escape') {
        // 1. If child detail dialog or material dialog is open, do NOT close maximized view
        if (detailDialog?.open || materialDialog?.open) {
          return;
        }
        // 2. If maximized view is open and no child dialog is active, close maximized view step
        if (isDiscussionMaximized) {
          e.preventDefault();
          e.stopPropagation();
          setIsDiscussionMaximized(false);
        }
      }
    };
    window.addEventListener('keydown', handleEscapeKey, true);
    return () => window.removeEventListener('keydown', handleEscapeKey, true);
  }, [isDiscussionMaximized, detailDialog?.open, materialDialog?.open]);

  const togglePauseClock = useCallback((key, att) => {
    setPausedRows((prev) => {
      const isNowPaused = !prev[key];
      if (!isNowPaused) {
        const current24 = getCurrent24hTime();
        setForm((prevForm) => {
          const list = [...prevForm.attendanceList];
          const targetIdx = list.findIndex((a, idx) => (a.employee?.id || idx) === key);
          if (targetIdx !== -1) {
            list[targetIdx] = {
              ...list[targetIdx],
              outTime: current24,
              attendanceStatus: calculateAttendanceStatus(
                list[targetIdx].inTime,
                current24,
                prevForm.schedule?.startTime,
                prevForm.schedule?.endTime
              )
            };
          }
          return { ...prevForm, attendanceList: list };
        });
      }
      return { ...prev, [key]: isNowPaused };
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setForm((prevForm) => {
        if (!prevForm.attendanceList || prevForm.attendanceList.length === 0) return prevForm;
        const current24 = getCurrent24hTime();
        let changed = false;

        const newAttendanceList = prevForm.attendanceList.map((att, idx) => {
          const key = att.employee?.id || idx;
          if (pausedRows[key]) return att;
          if (!att.inTime || att.attendanceStatus === 'ABSENT') return att;

          if (att.outTime !== current24) {
            changed = true;
            const calculatedStatus = calculateAttendanceStatus(
              att.inTime,
              current24,
              prevForm.schedule?.startTime,
              prevForm.schedule?.endTime
            );
            return {
              ...att,
              outTime: current24,
              attendanceStatus: calculatedStatus
            };
          }
          return att;
        });

        return changed ? { ...prevForm, attendanceList: newAttendanceList } : prevForm;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pausedRows]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onstart = () => {
      setIsListening(true);
    };

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const cleaned = transcript
          .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, '')
          .trim()
          .toUpperCase();
        setDetailDialog((prev) => {
          if (!prev.form) return prev;
          const currentPoint = prev.form.discussedPoint || '';
          return {
            ...prev,
            form: {
              ...prev.form,
              discussedPoint: currentPoint ? `${currentPoint} ${cleaned}` : cleaned
            }
          };
        });
      }
      setIsListening(false);
    };

    recog.onerror = (event) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error('Speech recognition error in MOM dialog', event.error);
      setIsListening(false);

      let errorMsg = 'Error during voice recognition. Please try again.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied. Please allow microphone access in your browser address bar/settings.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error. Speech recognition requires an active internet connection.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone detected. Please connect a mic and try again.';
      }

      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: event.error === 'no-speech' ? 'info' : 'error',
          close: false
        })
      );
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      recog.onstart = null;
      recog.onresult = null;
      recog.onerror = null;
      recog.onend = null;
      try { recog.abort(); } catch (_) { }
      recognitionRef.current = null;
    };
  }, [dispatch]);

  const handleMicClick = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const recog = recognitionRef.current;
    if (isListening) {
      if (recog) recog.stop();
    } else {
      if (recog) {
        try { recog.start(); } catch (err) { console.warn('Mic start error:', err); }
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Speech Recognition is not supported by your browser.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning',
            close: false
          })
        );
      }
    }
  };

  const loggedInId = user ? (user.empId || user.id || user.employeeId || user.userId) : null;
  const isHost = user && form.schedule && (
    (form.schedule.hostBy && String(loggedInId) === String(form.schedule.hostBy.id)) ||
    (form.schedule.secondaryHost && String(loggedInId) === String(form.schedule.secondaryHost.id)) ||
    (form.schedule.tertiaryHost && String(loggedInId) === String(form.schedule.tertiaryHost.id))
  );
  const canSave = (perms.write || isHost) && form.status?.toUpperCase() !== 'CLOSED';
  const canEditOutTime = !!isHost;

  const meetingUsers = form.attendanceList
    .filter((a) => a.attendanceStatus !== 'ABSENT')
    .map((a) => a.employee || a)
    .filter((emp) => emp && emp.id);

  useEffect(() => {
    if (detailDialog.open && detailDialog.form) {
      const hasAttachment = Boolean(
        (detailDialog.form.files && detailDialog.form.files.length > 0) ||
        (detailDialog.form.attachments && (Array.isArray(detailDialog.form.attachments) ? detailDialog.form.attachments.length > 0 : String(detailDialog.form.attachments).trim().length > 0)) ||
        Boolean(detailDialog.form.attachmentInfo) ||
        detailDialog.form.attachmentRequired === 'YES'
      );
      const minLen = hasAttachment ? 50 : 150;
      const len = detailDialog.form.discussedPoint ? detailDialog.form.discussedPoint.length : 0;
      if (len < minLen) {
        setDialogErrors((prev) => {
          const msg = `Discussed Point must be at least ${minLen} characters (current: ${len}).`;
          if (prev.discussedPoint === msg) return prev;
          return { ...prev, discussedPoint: msg };
        });
      } else {
        setDialogErrors((prev) => {
          if (!prev.discussedPoint) return prev;
          const copy = { ...prev };
          delete copy.discussedPoint;
          return copy;
        });
      }
    } else {
      setDialogErrors({});
    }
  }, [detailDialog.open, detailDialog.form?.discussedPoint, detailDialog.form?.attachmentRequired, detailDialog.form?.files, detailDialog.form?.attachments, detailDialog.form?.attachmentInfo]);

  const usersWithInTime = useMemo(() => {
    const attendees = (form.attendanceList || [])
      .filter((a) => a.inTime && a.inTime.trim() !== '' && a.attendanceStatus !== 'ABSENT')
      .map((a) => a.employee || a)
      .filter((emp) => emp && (emp.id || emp.employeeId));

    // Include Chaired Person if available
    const chaired = form.schedule?.chairedBy || form.chairedBy;
    if (chaired) {
      const chairedObj = typeof chaired === 'object' ? chaired : (employees || []).find(e => String(e.id) === String(chaired));
      if (chairedObj && (chairedObj.id || chairedObj.employeeId)) {
        const chairedId = String(chairedObj.id || chairedObj.employeeId);
        if (!attendees.some(a => String(a.id || a.employeeId) === chairedId)) {
          attendees.unshift(chairedObj);
        }
      }
    }

    return attendees;
  }, [form.attendanceList, form.schedule?.chairedBy, form.chairedBy, employees]);

  const assignedToOptions = useMemo(() => {
    const list = [...usersWithInTime];
    const currentVal = detailDialog.form?.assignedTo;
    const currentId = getUserId(currentVal);
    if (currentVal && currentId && !list.some(u => String(getUserId(u)) === String(currentId))) {
      list.push(currentVal);
    }
    const otherId = getUserId(detailDialog.form?.assignedBy);
    return list.filter(u => !otherId || String(getUserId(u)) !== String(otherId));
  }, [usersWithInTime, detailDialog.form?.assignedTo, detailDialog.form?.assignedBy]);

  const assignedByOptions = useMemo(() => {
    const list = [...usersWithInTime];
    const currentVal = detailDialog.form?.assignedBy;
    const currentId = getUserId(currentVal);
    if (currentVal && currentId && !list.some(u => String(getUserId(u)) === String(currentId))) {
      list.push(currentVal);
    }
    const otherId = getUserId(detailDialog.form?.assignedTo);
    return list.filter(u => !otherId || String(getUserId(u)) !== String(otherId));
  }, [usersWithInTime, detailDialog.form?.assignedBy, detailDialog.form?.assignedTo]);

  const allAvailableUsers = useMemo(() => {
    const attendees = form.attendanceList
      .map((a) => a.employee || a)
      .filter((emp) => emp && emp.id);
    const attendeeIds = new Set(attendees.map((a) => a.id));
    const others = (employees || []).filter((emp) => emp && emp.id && !attendeeIds.has(emp.id));
    return [...attendees, ...others];
  }, [form.attendanceList, employees]);

  const effectiveSchedules = useMemo(() => {
    if (activeSchedules && activeSchedules.length > 0) return activeSchedules;
    if (meetingSchedules && meetingSchedules.length > 0) return meetingSchedules;
    return [];
  }, [activeSchedules, meetingSchedules]);

  const scheduleOptions = useMemo(() => {
    const rawList = editId && form.schedule
      ? [form.schedule, ...(effectiveSchedules || []).filter((s) => s.id !== form.schedule.id)]
      : (effectiveSchedules || []);
    return Array.from(new Map(rawList.filter(s => s && s.id).map((s) => [s.id, s])).values());
  }, [editId, form.schedule, effectiveSchedules]);

  const handleOpenDetailDialog = (idx) => {
    setDialogErrors({});
    if (idx === null) {
      const currentMomNo = form.momNo && form.momNo !== 'AUTO-GENERATE' ? form.momNo : 'MM/MOM/2026-2027/001';
      const seqNumber = String((form.details ? form.details.length : 0) + 1).padStart(3, '0');
      const generatedMeetNo = `${currentMomNo}/${seqNumber}`;

      const newEmptyForm = {
        _tempId: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        meetNo: generatedMeetNo,
        minNo: generatedMeetNo,
        amendMeetNo: '',
        discussedPoint: '',
        type: '',
        materialList: '',
        processType: 'INFO',
        assignedBy: null,
        assignedTo: null,
        targetDate: '',
        reviewDate: '',
        attachmentRequired: 'NO',
        status: 'CLOSED',
        isAmended: false
      };

      if (discussionViewMode === 'card') {
        setForm((p) => ({
          ...p,
          details: [newEmptyForm, ...(p.details || [])]
        }));
        return;
      }

      setDetailDialog({
        open: true,
        rowIdx: null,
        form: newEmptyForm
      });
    } else {
      const det = form.details[idx];
      setDetailDialog({
        open: true,
        rowIdx: idx,
        form: {
          meetNo: det.meetNo || '',
          amendMeetNo: det.amendMeetNo || '',
          discussedPoint: det.discussedPoint || '',
          type: det.type || '',
          materialList: det.materialList || '',
          processType: det.processType || 'INFO',
          assignedBy: det.assignedBy || null,
          assignedTo: det.assignedTo || null,
          targetDate: det.targetDate || '',
          reviewDate: det.reviewDate || '',
          attachmentRequired: det.attachmentRequired || 'NO',
          status: det.status || 'CLOSED',
          isAmended: det.isAmended || false
        }
      });
    }
  };

  const handleSaveDetailDialog = () => {
    const { rowIdx, form: dialogForm } = detailDialog;

    const hasAttachment = Boolean(
      (dialogForm.files && dialogForm.files.length > 0) ||
      (dialogForm.attachments && (Array.isArray(dialogForm.attachments) ? dialogForm.attachments.length > 0 : String(dialogForm.attachments).trim().length > 0)) ||
      Boolean(dialogForm.attachmentInfo) ||
      dialogForm.attachmentRequired === 'YES'
    );
    const minLen = hasAttachment ? 50 : 150;
    if (dialogForm.discussedPoint.length < minLen) {
      setDialogErrors((prev) => ({
        ...prev,
        discussedPoint: `Discussed Point must be at least ${minLen} characters (current: ${dialogForm.discussedPoint.length}).`
      }));
      return;
    }

    if (dialogForm.processType === 'ACTION') {
      if (!dialogForm.assignedTo || !dialogForm.assignedBy) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Both "Assigned To" (the person doing the work) and "Assigned By" (the manager delegating) are required for ACTION points.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
      const assignedToId = getUserId(dialogForm.assignedTo);
      const assignedById = getUserId(dialogForm.assignedBy);
      if (assignedToId && assignedById && String(assignedToId) === String(assignedById)) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Assigned To and Assigned By cannot be the same person.',
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }
      if (!dialogForm.targetDate) {
        dispatch(openSnackbar({ open: true, message: 'Target Date is required.', variant: 'alert', severity: 'error' }));
        return;
      }
      if (dialogForm.targetDate < TODAY) {
        dispatch(openSnackbar({ open: true, message: 'Target Date cannot be in the past.', variant: 'alert', severity: 'error' }));
        return;
      }

      if (dialogForm.reviewDate) {
        if (dialogForm.reviewDate < TODAY) {
          dispatch(openSnackbar({ open: true, message: 'Review Date cannot be in the past.', variant: 'alert', severity: 'error' }));
          return;
        }
        if (dialogForm.reviewDate > dialogForm.targetDate) {
          dispatch(openSnackbar({ open: true, message: 'Review Date must be between the Current Date and the Target Date.', variant: 'alert', severity: 'error' }));
          return;
        }
      }
    }

    if (rowIdx === null) {
      const newDetails = [{ ...dialogForm }, ...form.details];
      setForm((p) => ({
        ...p,
        details: syncMeetNumbers(p.momNo, newDetails)
      }));
    } else {
      const newDetails = [...form.details];
      newDetails[rowIdx] = { ...newDetails[rowIdx], ...dialogForm };
      setForm((p) => ({
        ...p,
        details: syncMeetNumbers(p.momNo, newDetails)
      }));
    }
    setDetailDialog({
      open: false,
      rowIdx: null,
      form: {
        meetNo: '',
        amendMeetNo: '',
        discussedPoint: '',
        type: '',
        materialList: '',
        processType: 'INFO',
        assignedBy: null,
        assignedTo: null,
        targetDate: '',
        reviewDate: '',
        attachmentRequired: 'NO',
        status: 'CLOSED',
        isAmended: false
      }
    });
  };

  useKeyboardShortcuts(
    {
      'ctrl+s': (e) => {
        if (e) e.preventDefault();
        handleSave();
      },
      'ctrl+backspace': (e) => {
        if (e) e.preventDefault();
        setForm(INITIAL_FORM);
      },
      escape: (e) => {
        if (e) e.preventDefault();
        navigate('/qms/minutesofmeeting');
      }
    },
    true
  );

  const syncMeetNumbers = useCallback((momNo, details) => {
    const mapped = details.map((idx_d) => {
      const meetNo = idx_d.minNo || idx_d.meetNo || '';
      return {
        ...idx_d,
        minNo: meetNo,
        meetNo,
        amendMeetNo: idx_d.isAmended ? (meetNo ? `${meetNo}/A01` : '') : ''
      };
    });
    return mapped.sort((a, b) => {
      const minA = a.minNo || a.meetNo || '';
      const minB = b.minNo || b.meetNo || '';
      if (minA && minB) {
        return minB.localeCompare(minA, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (!minA && !minB) {
        return (b.id || 0) - (a.id || 0);
      }
      return minA ? -1 : 1;
    });
  }, []);

  const handleSaveIndividualAttendance = async (att) => {
    if (att.attendanceStatus === 'ABSENT') return;
    if (!att.outTime || !att.outTime.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter out time before saving.', variant: 'alert', severity: 'warning' }));
      return;
    }
    try {
      if (editId && att.id) {
        const outTimePayload = [{
          employeeId: att.employee?.id,
          attendanceId: att.id,
          outTime: att.outTime
        }];
        await axios.put(`${API_PATHS.QMS.MOMS}/${editId}/attendance-out-times`, outTimePayload);
        dispatch(openSnackbar({ open: true, message: 'Attendance out time saved successfully', variant: 'alert', severity: 'success' }));
      } else {
        dispatch(openSnackbar({ open: true, message: 'Please save the overall meeting minutes first before individual saves.', variant: 'alert', severity: 'info' }));
      }
    } catch (e) {
      dispatch(openSnackbar({ open: true, message: e.response?.data?.message || 'Failed to save individual out time', variant: 'alert', severity: 'error' }));
    }
  };

  const fetchMom = useCallback(async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_PATHS.QMS.MOMS}/${editId}`);
      if (data.momNo && data.momNo.endsWith('/AUTO') && data.schedule?.scheduleNo) {
        const scheduleParts = data.schedule.scheduleNo.split('/');
        const scheduleSeq = scheduleParts.length > 0 ? scheduleParts[scheduleParts.length - 1] : 'AUTO';
        data.momNo = data.momNo.replace(/\/AUTO$/, `/${scheduleSeq}`);
      }
      if (data.momDate) data.momDate = data.momDate.split('T')[0];
      // If data.attendanceList is empty, fetch user attendance from QMS_MEETING_USER_ATTENDANCE for this schedule
      if (!data.attendanceList || data.attendanceList.length === 0) {
        if (data.schedule?.id) {
          try {
            const { data: attendanceRecords } = await axios.get(`${API_PATHS.QMS.MEETING_ATTENDANCE}/schedule/${data.schedule.id}`);
            if (attendanceRecords && attendanceRecords.length > 0) {
              data.attendanceList = attendanceRecords.map((r) => {
                const inTime = r.inTime ? formatTo24hString(r.inTime) : '';
                const outTime = r.outTime ? formatTo24hString(r.outTime) : '';
                const calculatedStatus = r.status || calculateAttendanceStatus(inTime, outTime, data.schedule?.startTime, data.schedule?.endTime);
                return {
                  employee: r.employee,
                  inTime,
                  outTime: outTime || '',
                  attendanceStatus: calculatedStatus
                };
              });
            } else if (data.schedule?.participants) {
              let listToMap = [...(data.schedule.participants || [])];
              if (data.schedule.hostBy && !listToMap.some((p) => p.employee && String(p.employee.id) === String(data.schedule.hostBy.id))) {
                if (!data.schedule.chairedBy || String(data.schedule.hostBy.id) !== String(data.schedule.chairedBy.id)) {
                  listToMap.push({ employee: data.schedule.hostBy });
                }
              }
              data.attendanceList = listToMap.map((p) => {
                const isHost = data.schedule.hostBy && String(p.employee?.id) === String(data.schedule.hostBy.id);
                const inTime = isHost ? (formatTo24hString(data.schedule.startTime) || getCurrent24hTime()) : '';
                const calculatedStatus = calculateAttendanceStatus(inTime, '', data.schedule.startTime, data.schedule.endTime);
                return {
                  employee: p.employee,
                  inTime,
                  outTime: '',
                  attendanceStatus: calculatedStatus
                };
              });
            }
          } catch (attErr) {
            console.warn('Failed to fetch schedule attendance in edit MOM mode:', attErr);
          }
        }
      }

      if (data.attendanceList && data.attendanceList.length > 0) {
        let list = data.attendanceList;
        const initialPaused = {};
        list.forEach((att, idx) => {
          const key = att.employee?.id || idx;
          if (att.outTime && att.outTime.trim()) {
            initialPaused[key] = true;
          }
        });
        setPausedRows(initialPaused);

        if (data.schedule?.chairedBy) {
          const chairedIdStr = String(data.schedule.chairedBy.id);
          const filteredList = list.filter((att) => !att.employee || String(att.employee.id) !== chairedIdStr);
          if (filteredList.length > 0) {
            list = filteredList;
          }
        }
        const hostId = data.schedule?.hostBy?.id;
        data.attendanceList = sortAttendanceList(
          list.map((att) => {
            const outTime24 = formatTo24hString(att.outTime);
            const inTime24 = formatTo24hString(att.inTime);
            const calculatedStatus = calculateAttendanceStatus(
              inTime24,
              outTime24,
              data.schedule?.startTime,
              data.schedule?.endTime
            );
            return {
              ...att,
              inTime: inTime24,
              outTime: outTime24 || '',
              attendanceStatus: calculatedStatus
            };
          }),
          hostId
        );
      }
      if (data.details) {
        data.details = data.details.map((d) => {
          let parsedFiles = [];
          const rawAttach = d.files || d.attachments || d.attachmentInfo;
          if (Array.isArray(rawAttach) && rawAttach.length > 0) {
            parsedFiles = rawAttach.map((att) => {
              if (typeof att === 'string') {
                return { fileName: att.split('/').pop().split('\\').pop(), serverFileName: att };
              }
              return att;
            });
          } else if (typeof rawAttach === 'string' && rawAttach.trim().length > 0 && rawAttach !== '[]' && rawAttach !== 'null') {
            try {
              const parsed = JSON.parse(rawAttach);
              if (Array.isArray(parsed)) {
                parsedFiles = parsed.map((att) => {
                  if (typeof att === 'string') {
                    return { fileName: att.split('/').pop().split('\\').pop(), serverFileName: att };
                  }
                  return att;
                });
              }
            } catch {
              parsedFiles = parseFileString(rawAttach);
            }
          }

          return {
            ...d,
            files: parsedFiles,
            attachments: parsedFiles,
            isAmended: d.revNo > 0,
            targetDate: d.targetDate ? d.targetDate.split('T')[0] : '',
            reviewDate: d.reviewDate ? d.reviewDate.split('T')[0] : ''
          };
        });
        data.details = syncMeetNumbers(data.momNo, data.details);
      }
      setForm(data);
    } catch (error) {
      console.error('Failed to fetch MOM:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load MOM details', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [editId, dispatch, syncMeetNumbers]);

  useEffect(() => {
    // Warm up/refetch lookups on mount.
    loadActiveSchedules();
    const { fetchLookups } = useMasterDataStore.getState();
    fetchLookups(['MEETING_SCHEDULES_ACTIVE', 'HOLIDAYS'], true).catch(e => console.error("Failed to refetch schedules/holidays:", e));
    fetchLookups(['EMPLOYEES'], false).catch(e => console.error("Failed to load employees:", e));

    if (editId) {
      fetchMom();
    } else {
      setForm(INITIAL_FORM);
    }
    clearErrors();
  }, [editId, fetchMom, clearErrors, loadActiveSchedules]);

  useEffect(() => {
    if (form.schedule?.id && meetingSchedules.length > 0) {
      const fullSch = meetingSchedules.find((s) => s.id === form.schedule.id);
      if (fullSch) {
        const hostEmployee = fullSch.hostBy;
        const hostIdStr = hostEmployee ? String(hostEmployee.id) : null;
        const chairedEmployee = fullSch.chairedBy;
        const chairedIdStr = chairedEmployee ? String(chairedEmployee.id) : null;

        let attendanceUpdated = false;
        let updatedAttendanceList = [...(form.attendanceList || [])];

        if (hostEmployee && hostIdStr && !updatedAttendanceList.some(att => att.employee && String(att.employee.id) === hostIdStr)) {
          if (!chairedIdStr || hostIdStr !== chairedIdStr) {
            updatedAttendanceList.push({
              employee: hostEmployee,
              inTime: formatTo24hString(fullSch.startTime) || getCurrent24hTime(),
              outTime: '',
              attendanceStatus: 'PRESENT'
            });
            attendanceUpdated = true;
          }
        }

        if (chairedIdStr && updatedAttendanceList.some(att => att.employee && String(att.employee.id) === chairedIdStr)) {
          updatedAttendanceList = updatedAttendanceList.filter(att => !att.employee || String(att.employee.id) !== chairedIdStr);
          attendanceUpdated = true;
        }

        if (!form.schedule._isFull || attendanceUpdated) {
          const mappedList = updatedAttendanceList.map(att => {
            const calculatedStatus = calculateAttendanceStatus(
              att.inTime,
              att.outTime,
              fullSch.startTime,
              fullSch.endTime
            );
            return {
              ...att,
              attendanceStatus: calculatedStatus
            };
          });

          setForm((prev) => ({
            ...prev,
            schedule: {
              ...prev.schedule,
              ...fullSch,
              _isFull: true
            },
            attendanceList: sortAttendanceList(mappedList, fullSch.hostBy?.id)
          }));
        }
      }
    }
  }, [form.schedule, form.attendanceList, meetingSchedules]);

  const handleScheduleChange = async (val) => {
    if (!val) return;

    setFetchingAttendance(true);
    const typePrefix = val.meetingType?.meetingPrefix || 'MEET';
    const year = new Date().getFullYear();
    const yearRange = `${year}-${year + 1}`;

    const scheduleParts = val.scheduleNo ? val.scheduleNo.split('/') : [];
    const scheduleSeq = scheduleParts.length > 0 ? scheduleParts[scheduleParts.length - 1] : 'AUTO';
    const dynamicMomNo = `MM/${typePrefix}/${yearRange}/${scheduleSeq}`;

    let listToMap = [...(val.participants || [])];
    if (val.chairedBy) {
      listToMap = listToMap.filter((p) => p.employee && String(p.employee.id) !== String(val.chairedBy.id));
    }
    if (val.hostBy && !listToMap.some((p) => p.employee && String(p.employee.id) === String(val.hostBy.id))) {
      if (!val.chairedBy || String(val.hostBy.id) !== String(val.chairedBy.id)) {
        listToMap.push({ employee: val.hostBy });
      }
    }

    try {
      const { data: attendanceRecords } = await axios.get(`${API_PATHS.QMS.MEETING_ATTENDANCE}/schedule/${val.id}`);

      const participants = listToMap.map((p) => {
        const record = attendanceRecords.find((r) => r.employee && String(r.employee.id) === String(p.employee?.id));
        const isHost = val.hostBy && String(p.employee?.id) === String(val.hostBy.id);

        let inTime = '';
        let outTime = '';

        if (record) {
          inTime = record.inTime ? formatTo24hString(record.inTime) : (isHost ? (formatTo24hString(val.startTime) || getCurrent24hTime()) : '');
          outTime = formatTo24hString(record.outTime) || '';
        } else {
          inTime = isHost ? (formatTo24hString(val.startTime) || getCurrent24hTime()) : '';
          outTime = '';
        }

        const calculatedStatus = calculateAttendanceStatus(inTime, outTime, val.startTime, val.endTime);

        return {
          ...record,
          id: undefined, // Strip the database ID to prevent detached entity error!
          employee: p.employee,
          inTime,
          outTime,
          attendanceStatus: calculatedStatus
        };
      });

      setForm((p) => ({
        ...p,
        momNo: dynamicMomNo,
        schedule: val,
        agenda: val.meetingType?.meetingAgenda || 'No agenda defined for this schedule.',
        chairedBy: val.chairedBy || val.hostBy,
        startTime: val.startTime || '09:00',
        endTime: val.endTime || '10:00',
        attendanceList: sortAttendanceList(participants, val.hostBy?.id),
        details: syncMeetNumbers(dynamicMomNo, p.details)
      }));
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load actual attendance records', variant: 'alert', severity: 'warning' }));

      const fallbackParticipants = listToMap.map((p) => {
        const isHost = val.hostBy && String(p.employee?.id) === String(val.hostBy.id);
        const inTime = isHost ? (formatTo24hString(val.startTime) || getCurrent24hTime()) : '';
        const calculatedStatus = calculateAttendanceStatus(inTime, '', val.startTime, val.endTime);
        return {
          employee: p.employee,
          inTime,
          outTime: '',
          attendanceStatus: calculatedStatus
        };
      });

      setForm((p) => ({
        ...p,
        momNo: dynamicMomNo,
        schedule: val,
        agenda: val.meetingType?.meetingAgenda || 'No agenda defined for this schedule.',
        chairedBy: val.chairedBy || val.hostBy,
        startTime: val.startTime || '09:00',
        endTime: val.endTime || '10:00',
        attendanceList: sortAttendanceList(fallbackParticipants, val.hostBy?.id),
        details: syncMeetNumbers(dynamicMomNo, p.details)
      }));
    } finally {
      setFetchingAttendance(false);
    }
  };

  const removeDetailRow = (index) => {
    if (form.details.length === 1) return;
    const newDetails = [...form.details];
    newDetails.splice(index, 1);
    setForm((p) => ({
      ...p,
      details: syncMeetNumbers(p.momNo, newDetails)
    }));
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...form.details];
    newDetails[index][field] = value;
    setForm((p) => ({ ...p, details: newDetails }));
  };

  const handleSelectMaterial = (item) => {
    const { rowIdx } = materialDialog;
    if (rowIdx === 'dialog') {
      setDetailDialog((prev) => ({
        ...prev,
        form: {
          ...prev.form,
          materialList: item?.partNo ? `${item.partNo} - ${item.partName}` : ''
        }
      }));
    } else if (rowIdx !== null && rowIdx !== undefined) {
      handleDetailChange(rowIdx, 'materialList', item?.partNo ? `${item.partNo} - ${item.partName}` : '');
    }
    setMaterialDialog({ open: false, rowIdx: null, type: 'RM' });
  };

  const toggleAmendment = (index) => {
    const newDetails = [...form.details];
    newDetails[index].isAmended = !newDetails[index].isAmended;
    setForm((p) => ({
      ...p,
      details: syncMeetNumbers(p.momNo, newDetails)
    }));
  };

  const handleSave = async () => {
    if (saving) return;

    const rules = [
      { field: 'schedule', label: 'Meeting Schedule', required: true }
    ];

    const hostAtt = form.attendanceList.find((att) => att.employee && form.schedule?.hostBy && String(att.employee.id) === String(form.schedule.hostBy.id));
    const hostOutTimeEmpty = !hostAtt || !hostAtt.outTime || !hostAtt.outTime.trim();
    const otherOutTimeFilled = form.attendanceList.some(
      (att) => (!att.employee || !form.schedule?.hostBy || String(att.employee.id) !== String(form.schedule.hostBy.id)) && att.attendanceStatus !== 'ABSENT' && att.outTime && att.outTime.trim()
    );

    if (hostOutTimeEmpty && otherOutTimeFilled) {
      dispatch(
        openSnackbar({
          open: true,
          message: "Please enter the host's outTime first before proceeding",
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    const missingOutTime = form.attendanceList.some((att) => att.attendanceStatus !== 'ABSENT' && (!att.outTime || !att.outTime.trim()));
    if (missingOutTime) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'It is mandatory to enter the out time before saving',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    const invalidOutTime = form.attendanceList.some((att) => {
      if (att.attendanceStatus === 'ABSENT' || !att.inTime || !att.outTime) return false;
      const in24 = formatTo24hString(att.inTime);
      const out24 = formatTo24hString(att.outTime);
      if (!in24 || !out24) return false;
      return out24 < in24;
    });
    if (invalidOutTime) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Out time cannot be before in time for any attendee',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    let newErrors = {};
    if (!form.schedule) newErrors.schedule = true;
    if (!form.agenda) newErrors.agenda = true;
    if (!form.chairedBy) newErrors.chairedBy = true;

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      dispatch(openSnackbar({ open: true, message: 'Please fill out all mandatory fields.', variant: 'alert', severity: 'error' }));
      return;
    }
    setFormErrors({});

    if (!form.details || form.details.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'At least one discussion point is required.',
          variant: 'alert',
          severity: 'error'
        })
      );
      return;
    }

    for (let i = 0; i < form.details.length; i++) {
      const d = form.details[i];
      const hasAtt = Boolean(
        (d.files && d.files.length > 0) ||
        (d.attachments && (Array.isArray(d.attachments) ? d.attachments.length > 0 : String(d.attachments).trim().length > 0)) ||
        Boolean(d.attachmentInfo) ||
        d.attachmentRequired === 'YES'
      );
      const minLen = hasAtt ? 50 : 150;
      if (!d.discussedPoint || d.discussedPoint.length < minLen) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Point ${i + 1}: Discussed Point must be at least ${minLen} characters (current: ${(d.discussedPoint || '').length}).`,
            variant: 'alert',
            severity: 'error'
          })
        );
        return;
      }

      if (d.processType === 'ACTION') {
        if (!d.targetDate) {
          dispatch(openSnackbar({ open: true, message: `Row ${i + 1}: Target Date is required for ACTION points.`, variant: 'alert', severity: 'error' }));
          return;
        }
        if (d.targetDate < TODAY) {
          dispatch(openSnackbar({ open: true, message: `Row ${i + 1}: Target Date cannot be in the past.`, variant: 'alert', severity: 'error' }));
          return;
        }

        if (d.reviewDate) {
          if (d.reviewDate < TODAY) {
            dispatch(openSnackbar({ open: true, message: `Row ${i + 1}: Review Date cannot be in the past.`, variant: 'alert', severity: 'error' }));
            return;
          }
          if (d.reviewDate > d.targetDate) {
            dispatch(openSnackbar({ open: true, message: `Row ${i + 1}: Review Date must be between the Current Date and the Target Date.`, variant: 'alert', severity: 'error' }));
            return;
          }
        }
      }
    }

    if (validate(form, rules)) {
      setSaving(true);
      try {
        const currentUser = user?.employeeName || user?.userName || user?.name || 'System';
        const payload = {
          ...form,
          createdUser: editId ? form.createdUser || form.createdBy : currentUser,
          updatedUser: editId ? currentUser : null,
          attendanceList: (form.attendanceList || []).map((att) => ({
            ...att,
            inTime: att.inTime && att.inTime.trim() !== '' ? att.inTime : null,
            outTime: att.outTime && att.outTime.trim() !== '' ? att.outTime : null,
          })),
          details: form.details.map((d) => {
            const cleanAttachments = (d.attachments && Array.isArray(d.attachments))
              ? d.attachments.map((att) => {
                if (typeof att === 'object' && att !== null) {
                  const isNumericId = att.id && !isNaN(Number(att.id)) && !String(att.id).includes('_');
                  const serverPath = att.serverFileName || att.path || att.filePath || att.name;
                  return {
                    ...att,
                    id: isNumericId ? Number(att.id) : null,
                    path: serverPath,
                    fileName: att.fileName || att.name || (serverPath ? String(serverPath).split('/').pop() : '')
                  };
                }
                return att;
              })
              : d.attachments;

            return {
              ...d,
              attachments: cleanAttachments,
              targetDate: d.targetDate || null,
              reviewDate: d.reviewDate || null,
              createdUser: d.id ? d.createdUser || d.createdBy : currentUser,
              updatedUser: d.id ? currentUser : null
            };
          })
        };

        if (editId) {
          await axios.put(`${API_PATHS.QMS.MOMS}/${editId}`, payload);
          dispatch(
            openSnackbar({ open: true, message: 'Meeting Minutes updated Successfully...', variant: 'alert', severity: 'success' })
          );
        } else {
          await axios.post(API_PATHS.QMS.MOMS, payload);
          dispatch(openSnackbar({ open: true, message: 'Meeting Minutes saved Successfully..', variant: 'alert', severity: 'success' }));
        }
        navigate('/qms/minutesofmeeting');
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to save MOM';
        dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', severity: 'error' }));
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Professional Table Header Style
  const headerSx = {
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    fontWeight: 800,
    fontSize: '0.75rem',
    py: 1.25,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid',
    borderColor: 'divider',
    borderRight: '1px solid',
    borderRightColor: 'divider',
    whiteSpace: 'nowrap'
  };

  const getHostType = () => {
    if (!form.schedule) return '';
    const loggedInId = user ? (user.empId || user.id || user.employeeId || user.userId) : null;
    let currentHost = form.schedule.hostBy;
    let typeStr = "PRIMARY";

    if (user && form.schedule.secondaryHost && String(loggedInId) === String(form.schedule.secondaryHost.id)) {
      currentHost = form.schedule.secondaryHost;
      typeStr = "SECONDARY";
    } else if (user && form.schedule.tertiaryHost && String(loggedInId) === String(form.schedule.tertiaryHost.id)) {
      currentHost = form.schedule.tertiaryHost;
      typeStr = "TERTIARY";
    } else if (user && form.schedule.hostBy && String(loggedInId) === String(form.schedule.hostBy.id)) {
      currentHost = form.schedule.hostBy;
      typeStr = "PRIMARY";
    }

    if (!currentHost) return '';
    return `${currentHost.employeeName || 'Unknown'} (${typeStr})`;
  };

  const handleCardChange = (idx, field, value) => {
    setForm((prev) => {
      const newDetails = [...prev.details];
      if (!newDetails[idx]) return prev;

      const updatedRow = {
        ...newDetails[idx],
        [field]: value
      };

      if (field === 'processType') {
        updatedRow.status = value === 'INFO' ? 'CLOSED' : 'OPEN';
        if (value === 'INFO') {
          updatedRow.assignedTo = null;
          updatedRow.assignedBy = null;
          updatedRow.targetDate = '';
          updatedRow.reviewDate = '';
        }
      }
      if (field === 'type' && (value !== 'RM' && value !== 'PRODUCT')) {
        updatedRow.materialList = '';
      }

      newDetails[idx] = updatedRow;
      return {
        ...prev,
        details: newDetails
      };
    });
  };

  const renderDiscussionCards = (detailsList) => {
    const isDark = theme.palette.mode === 'dark';

    if (!detailsList || detailsList.length === 0) {
      return (
        <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: 'divider', m: 2 }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
            No discussion & action points added. Click the "+ Add Point" button to add.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {detailsList.map((det, idx) => {
          const displayIdx = detailsList.length - idx;
          const processTypeUpper = (det.processType || 'INFO').toUpperCase();
          const isAction = processTypeUpper === 'ACTION';

          const accentColor = isAction ? '#d32f2f' : '#0288d1';
          const lightBg = isAction ? '#fff5f5' : '#f0f9ff';
          const borderTone = isAction ? '#ffcdd2' : '#b3e5fc';

          const hasAttachment = Boolean(
            (det.files && det.files.length > 0) ||
            (det.attachments && (Array.isArray(det.attachments) ? det.attachments.length > 0 : String(det.attachments).trim().length > 0)) ||
            Boolean(det.attachmentInfo) ||
            det.attachmentRequired === 'YES'
          );
          const minLen = hasAttachment ? 50 : 150;
          const currentLen = (det.discussedPoint || '').length;
          const lenError = currentLen < minLen ? `Discussed Point must be at least ${minLen} characters (current: ${currentLen}).` : null;

          const cardKey = det._tempId || det.id || det.minNo || det.meetNo || `card-${idx}`;

          return (
            <Card
              key={cardKey}
              elevation={0}
              sx={{
                width: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: isDark ? 'divider' : 'grey.200',
                borderLeft: `5px solid ${accentColor}`,
                bgcolor: 'background.paper',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                transition: 'all 0.25s ease-in-out',
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.09)'
                }
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                {/* Card Header Row */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.5}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: lightBg,
                        color: accentColor,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: `1px solid ${borderTone}`
                      }}
                    >
                      #{displayIdx}
                    </Avatar>
                    <Chip
                      label={det.minNo || det.meetNo || 'MOM Point'}
                      size="small"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        bgcolor: 'grey.100',
                        color: 'text.primary',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        height: 24
                      }}
                    />
                    <Chip
                      label={processTypeUpper}
                      size="small"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        bgcolor: lightBg,
                        color: accentColor,
                        border: `1px solid ${borderTone}`,
                        height: 24
                      }}
                    />
                    {det.type && (
                      <Chip
                        label={det.type}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: '0.7rem', fontWeight: 700, height: 22 }}
                      />
                    )}
                  </Stack>

                  {perms.write && !isEdit && (
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Delete Point" arrow>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeDetailRow(idx)}
                          disabled={form.details.length === 1}
                          sx={{ bgcolor: 'error.lighter', p: 0.5 }}
                        >
                          <IconTrash size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )}
                </Stack>

                {/* Editable Discussed Point Text Field */}
                <BOSTextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Discussed Point *"
                  value={det.discussedPoint || ''}
                  onChange={(e) => handleCardChange(idx, 'discussedPoint', e.target.value.toUpperCase())}
                  disabled={!perms.write || isEdit}
                  InputProps={{ readOnly: isEdit }}
                  error={!isEdit && !!lenError}
                  placeholder={DEFAULT_DISCUSSED_POINT}
                  helperText={
                    !isEdit && (
                      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          color={lenError ? 'error.main' : 'success.main'}
                          sx={{ fontWeight: 'bold' }}
                        >
                          {lenError ? `⚠️ ${lenError}` : `✅ Valid length (${currentLen} characters)`}
                        </Typography>
                      </Stack>
                    )
                  }
                  sx={{ mb: 2 }}
                />

                {/* Inline Form Controls Row */}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={3} md={2}>
                    <BOSTextField
                      select
                      fullWidth
                      label="Type"
                      value={det.type || ''}
                      onChange={(e) => handleCardChange(idx, 'type', e.target.value)}
                      disabled={!perms.write || isEdit}
                      size="small"
                    >
                      <MenuItem value=""><em>Select Type</em></MenuItem>
                      <MenuItem value="RM">RM</MenuItem>
                      <MenuItem value="PRODUCT">PRODUCT</MenuItem>
                    </BOSTextField>
                  </Grid>

                  {(det.type === 'RM' || det.type === 'PRODUCT') && (
                    <Grid item xs={12} sm={3} md={2.5}>
                      <BOSTextField
                        fullWidth
                        size="small"
                        label="Material List"
                        value={det.materialList || ''}
                        placeholder="Select Material..."
                        onClick={() => perms.write && !isEdit && setMaterialDialog({ open: true, rowIdx: idx, type: det.type || 'RM' })}
                        InputProps={{
                          readOnly: true,
                          sx: { cursor: (perms.write && !isEdit) ? 'pointer' : 'default' }
                        }}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={3} md={2}>
                    <BOSTextField
                      select
                      fullWidth
                      size="small"
                      label="Process"
                      value={det.processType || 'INFO'}
                      onChange={(e) => handleCardChange(idx, 'processType', e.target.value)}
                      disabled={!perms.write || isEdit}
                    >
                      <MenuItem value="INFO">INFO</MenuItem>
                      <MenuItem value="ACTION">ACTION</MenuItem>
                    </BOSTextField>
                  </Grid>

                  {/* Uploaded Documents Section - Right next to Process in the same row */}
                  <Grid item xs={12} sm={12} md={(det.type === 'RM' || det.type === 'PRODUCT') ? 5.5 : 8}>
                    <BOSFileUpload
                      files={
                        (det.files && det.files.length > 0)
                          ? det.files
                          : (det.attachments && (Array.isArray(det.attachments) ? det.attachments.length > 0 : String(det.attachments).trim().length > 0))
                            ? (Array.isArray(det.attachments) ? det.attachments : parseFileString(det.attachments))
                            : (det.attachmentInfo ? parseFileString(det.attachmentInfo) : [])
                      }
                      onChange={(uploadedFiles) => {
                        if (isEdit) return;
                        handleCardChange(idx, 'files', uploadedFiles);
                        const paths = uploadedFiles.map((f) => f.serverFileName || f.path || f.filePath || f.name).join(',');
                        handleCardChange(idx, 'attachments', uploadedFiles);
                        handleCardChange(idx, 'attachmentInfo', paths);
                        if (uploadedFiles.length > 0) {
                          handleCardChange(idx, 'attachmentRequired', 'YES');
                        }
                      }}
                      module="QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING"
                      label="Upload Files"
                      multiple={true}
                      compact={true}
                      inlineList={true}
                      disabled={!perms.write || isEdit}
                      hideDropzone={isEdit}
                    />
                  </Grid>
                </Grid>

                {/* Metadata Form Controls for Action Points */}
                {isAction && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: lightBg,
                      border: `1px solid ${borderTone}`
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <BOSAutocomplete
                          fullWidth
                          size="small"
                          options={usersWithInTime.filter(u => !det.assignedBy || String(getUserId(u)) !== String(getUserId(det.assignedBy)))}
                          getOptionLabel={(option) => option.employeeName || ''}
                          isOptionEqualToValue={(option, val) => getUserId(option) === getUserId(val)}
                          value={det.assignedTo || null}
                          onChange={(val) => handleCardChange(idx, 'assignedTo', val)}
                          label="Assigned To"
                          placeholder="Select person assigned..."
                          disabled={!perms.write || isEdit}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <BOSAutocomplete
                          fullWidth
                          size="small"
                          options={usersWithInTime.filter(u => !det.assignedTo || String(getUserId(u)) !== String(getUserId(det.assignedTo)))}
                          getOptionLabel={(option) => option.employeeName || ''}
                          isOptionEqualToValue={(option, val) => getUserId(option) === getUserId(val)}
                          value={det.assignedBy || null}
                          onChange={(val) => handleCardChange(idx, 'assignedBy', val)}
                          label="Assigned By"
                          placeholder="Select person who assigned..."
                          disabled={!perms.write || isEdit}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <BOSDatePicker
                          name={`targetDate-${idx}`}
                          label="Target Date"
                          value={det.targetDate || ''}
                          onChange={(e) => handleCardChange(idx, 'targetDate', e.target.value)}
                          minDate={new Date()}
                          disabled={!perms.write || isEdit}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <BOSDatePicker
                          name={`reviewDate-${idx}`}
                          label="Review Date"
                          value={det.reviewDate || ''}
                          onChange={(e) => handleCardChange(idx, 'reviewDate', e.target.value)}
                          disabled={!perms.write || isEdit || !det.targetDate}
                          minDate={new Date()}
                          maxDate={det.targetDate ? new Date(det.targetDate) : undefined}
                        />
                      </Grid>

                      <Grid item xs={12} sm={4} md={3}>
                        <BOSTextField
                          select
                          fullWidth
                          size="small"
                          label="Attachment Required"
                          value={det.attachmentRequired || 'NO'}
                          onChange={(e) => handleCardChange(idx, 'attachmentRequired', e.target.value)}
                          disabled={!perms.write || isEdit}
                        >
                          <MenuItem value="NO">NO</MenuItem>
                          <MenuItem value="YES">YES</MenuItem>
                        </BOSTextField>
                      </Grid>

                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  return (
    <MainCard
      stretch={false}
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 1, bgcolor: 'secondary.light', borderRadius: 2, display: 'flex' }}>
            <IconFileText size={22} color={theme.palette.secondary.dark} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>
            {editId ? `Edit MOM - ${form.momNo}` : 'New Meeting Minutes'}
          </Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1.5}>
          <Tooltip title={shortcutTooltip('Back', 'Esc')}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate('/qms/minutesofmeeting')}
              sx={btnCancel}
            >
              Back
            </Button>
          </Tooltip>
          {editId && (
            <Tooltip title="PDF Report">
              <IconButton
                onClick={() => setPdfDialogOpen(true)}
                sx={{
                  color: '#d32f2f',
                  bgcolor: '#ffebee',
                  '&:hover': { bgcolor: '#ffcdd2', color: '#b71c1c' }
                }}
              >
                <IconFileTypePdf size={20} />
              </IconButton>
            </Tooltip>
          )}
          {canSave && (
            <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                onClick={handleSave}
                disabled={saving}
                sx={btnSave}
              >
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
              </Button>
            </Tooltip>
          )}
        </Stack>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ROW 1: MINUTES OF MEETING DETAILS */}
        <BOSFormSection
          title="Minutes of Meeting Details"
          icon={<IconSettings size={20} />}
          contentSx={{ p: 2 }}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              <BOSTextField
                fullWidth
                label="Meeting Minutes No"
                value={form.momNo}
                onChange={(e) => {
                  const newNo = e.target.value.toUpperCase();
                  setForm({ ...form, momNo: newNo, details: syncMeetNumbers(newNo, form.details) });
                }}
                disabled={!perms.write}
                sx={{
                  bgcolor: 'secondary.lighter',
                  '& .MuiInputBase-input': { fontWeight: 800, color: 'secondary.dark' }
                }}
              />
              <BOSDatePicker
                fullWidth
                label="Meeting Minutes Date"
                name="momDate"
                value={form.momDate}
                onChange={(e) => setForm({ ...form, momDate: e.target.value })}
                disabled={true}
                sx={{ bgcolor: 'secondary.lighter' }}
              />
              <Autocomplete
                fullWidth
                options={scheduleOptions}
                getOptionLabel={(o) => o?.scheduleNo || ''}
                isOptionEqualToValue={(o, v) => o?.id === v?.id}
                value={form.schedule}
                onOpen={() => {
                  loadActiveSchedules();
                }}
                onChange={(e, nv) => handleScheduleChange(nv)}
                disabled={!!editId}
                renderOption={(props, option) => <li {...props} key={option.id}>{option.scheduleNo}</li>}
                renderInput={(params) => (
                  <BOSTextField
                    {...params}
                    label="Meeting Schedule No"
                    placeholder="Select Schedule"
                    required
                    error={!!formErrors.schedule}
                    sx={[{ '& .MuiInputBase-root': { py: 0.8 } }, errorStyle(!!formErrors.schedule)]}
                  />
                )}
              />
              <BOSTextField
                fullWidth
                label="Meeting Date"
                value={form.schedule?.meetingDate || ''}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 500, color: 'text.secondary' } }}
              />
              <BOSTextField
                fullWidth
                label="Meeting Title"
                value={form.schedule?.subject || ''}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 500, color: 'text.secondary' } }}
              />
              <BOSTextField
                fullWidth
                label="Meeting Type"
                value={form.schedule?.meetingType?.meetingName || ''}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 500, color: 'text.secondary' } }}
              />
              <Autocomplete
                fullWidth
                options={employees}
                getOptionLabel={(o) => o?.employeeName || ''}
                isOptionEqualToValue={(o, v) => o?.id === v?.id}
                value={form.chairedBy}
                onChange={(e, nv) => setForm((p) => ({ ...p, chairedBy: nv }))}
                disabled={true}
                renderInput={(params) => (
                  <BOSTextField
                    {...params}
                    label="Chaired By"
                    placeholder="Select Chaired By"
                    required
                    error={!!formErrors.chairedBy}
                    sx={[{ '& .MuiInputBase-root': { py: 0.8 } }, errorStyle(!!formErrors.chairedBy)]}
                  />
                )}
              />
              <BOSTextField
                fullWidth
                label="Department"
                value={form.schedule?.departments?.map(d => d.department?.departmentName || 'N/A').join(', ') || ''}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 500, color: 'text.secondary' } }}
              />
              <BOSTextField
                fullWidth
                label="Venue"
                value={form.schedule?.venue || 'N/A'}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 500, color: 'text.secondary' } }}
              />
              <BOSAnalogTimePicker
                fullWidth
                label="Meeting Start Time"
                value={to12h(form.startTime)}
                onChange={(e) => setForm({ ...form, startTime: to24h(e.target.value) })}
                disabled={true}
                disableFutureValidation
                selectedDate={form.momDate}
                hideClockIcon
                format24h={false}
              />
              <BOSAnalogTimePicker
                fullWidth
                label="Meeting End Time"
                value={to12h(form.endTime)}
                onChange={(e) => setForm({ ...form, endTime: to24h(e.target.value) })}
                disabled={true}
                disableFutureValidation
                selectedDate={form.momDate}
                minTime={to12h(form.startTime)}
                minTimeMessage="End time must be after start time."
                hideClockIcon
                format24h={false}
              />
              <BOSTextField
                fullWidth
                label="Host Type"
                value={getHostType()}
                disabled
                sx={{ bgcolor: 'grey.50', '& .MuiInputBase-input': { fontWeight: 700, color: 'primary.main' } }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <BOSTextField
                fullWidth
                multiline
                rows={1}
                label="Creation Description SOP"
                value={form.schedule?.meetingType?.meetingDescription || ''}
                disabled
                sx={{
                  bgcolor: 'grey.50',
                  '& .ql-editor': {
                    height: '60px !important',
                    minHeight: '60px !important',
                    pt: '6px !important',
                    pb: '6px !important'
                  },
                  '& .ql-container': {
                    minHeight: '60px !important',
                    height: '60px !important'
                  }
                }}
              />
              <BOSTextField
                fullWidth
                label="Scheduled Agenda"
                value={form.agenda || 'No agenda defined for this schedule.'}
                multiline
                rows={1}
                disabled
                sx={{
                  bgcolor: 'grey.50',
                  '& .ql-editor': {
                    height: '60px !important',
                    minHeight: '60px !important',
                    pt: '6px !important',
                    pb: '6px !important'
                  },
                  '& .ql-container': {
                    minHeight: '60px !important',
                    height: '60px !important'
                  }
                }}
              />
            </Box>
          </Stack>
        </BOSFormSection>

        {/* ROW 2: ATTENDANCE DETAILS */}
        <BOSFormSection
          title="Attendance Details"
          icon={<IconUsers size={20} />}
          action={null}
          contentSx={{ p: 2 }}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}
        >
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ mt: 0, height: 220, maxHeight: 220, borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell align="center" sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 50 }}>
                    Si No
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 90 }}>
                    Emp ID
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 120 }}>
                    Dept
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 150 }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 120 }}>
                    Designation
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 140, px: '4px' }}
                  >
                    In Time
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 140, px: '4px' }}
                  >
                    Out Time
                  </TableCell>
                  <TableCell
                    sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 110 }}
                  >
                    Status
                  </TableCell>
                  {!isEdit && (
                    <TableCell
                      sx={{ bgcolor: 'primary.dark', fontWeight: 800, color: '#ffffff', py: 1, fontSize: '0.65rem', width: 50 }}
                    ></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {fetchingAttendance ? (
                  <TableRow>
                    <TableCell
                      colSpan={isEdit ? 8 : 9}
                      align="center"
                      sx={{ py: 3 }}
                    >
                      <CircularProgress size={24} sx={{ mr: 1, verticalAlign: 'middle' }} />
                      <Box component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>
                        Loading attendance...
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : form.attendanceList.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isEdit ? 8 : 9}
                      align="center"
                      sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic', fontSize: '0.8rem' }}
                    >
                      Select a schedule to load attendance
                    </TableCell>
                  </TableRow>
                ) : (
                  sortAttendanceList(form.attendanceList, form.chairedBy?.id).map((att, idx) => (
                    <TableRow key={att.employee?.id || idx} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {idx + 1}
                      </TableCell>
                      {(() => {
                        const empId = att.employee?.id || att.employeeId;
                        const matchedEmp = empId && (employees || []).find((e) => String(e.id) === String(empId));

                        const empCodeVal =
                          att.employee?.oldEmpCode ||
                          att.employee?.oldCode ||
                          matchedEmp?.oldEmpCode ||
                          matchedEmp?.oldCode ||
                          att.oldEmpCode ||
                          att.employee?.empCode ||
                          att.employee?.employeeCode ||
                          matchedEmp?.empCode ||
                          matchedEmp?.employeeCode ||
                          att.employee?.employeeId ||
                          '-';

                        const deptVal =
                          att.employee?.departmentName ||
                          att.employee?.department?.deptName ||
                          att.employee?.department?.departmentName ||
                          matchedEmp?.departmentName ||
                          matchedEmp?.department?.deptName ||
                          matchedEmp?.department?.departmentName ||
                          att.departmentName ||
                          att.department ||
                          att.deptName ||
                          '-';

                        return (
                          <>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{empCodeVal}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{deptVal}</TableCell>
                          </>
                        );
                      })()}
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {form.chairedBy && String(att.employee?.id) === String(form.chairedBy.id) && (
                            <Chip
                              label="Host"
                              size="small"
                              color="primary"
                              sx={{
                                height: 16,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                px: 0.5,
                                '& .MuiChip-label': { px: 0.5 }
                              }}
                            />
                          )}
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {att.employee?.employeeName || '-'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{att.employee?.designation?.designationName || '-'}</TableCell>
                      <TableCell sx={{ px: '4px' }}>
                        <BOSTextField
                          type="text"
                          size="small"
                          value={att.attendanceStatus === 'ABSENT' ? '' : to12h(att.inTime)}
                          disabled
                          placeholder=""
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              height: '38px !important',
                              borderRadius: '12px !important',
                              backgroundColor: 'grey.50 !important',
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '0.72rem !important',
                              fontWeight: '600 !important',
                              textAlign: 'center !important',
                              paddingLeft: '4px !important',
                              paddingRight: '4px !important',
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ px: '4px' }}>
                        {(() => {
                          const key = att.employee?.id || idx;
                          const isPaused = Boolean(pausedRows[key]);
                          const isDisabled = !canSave || !att.inTime || att.attendanceStatus === 'ABSENT';

                          return (
                            <BOSAnalogTimePicker
                              value={att.attendanceStatus === 'ABSENT' ? '' : to12h(att.outTime)}
                              onChange={(e) => {
                                setPausedRows((prev) => ({ ...prev, [key]: true }));
                                const list = [...form.attendanceList];
                                const outTimeVal = to24h(e.target.value);
                                list[idx].outTime = outTimeVal;

                                const calculatedStatus = calculateAttendanceStatus(
                                  list[idx].inTime,
                                  outTimeVal,
                                  form.schedule?.startTime,
                                  form.schedule?.endTime
                                );
                                list[idx].attendanceStatus = calculatedStatus;

                                setForm({ ...form, attendanceList: list });
                              }}
                              disabled={isDisabled || isEdit}
                              disableFutureValidation
                              minTime={to12h(att.inTime)}
                              minTimeMessage="Out time cannot be before in time."
                              placeholder=""
                              isLiveClock={true}
                              isPaused={isPaused}
                              onTogglePause={(!isDisabled && !isEdit) ? () => togglePauseClock(key, att) : undefined}
                              format24h={false}
                              sx={{
                                '& .MuiInputBase-input': {
                                  fontSize: '0.72rem !important',
                                  textAlign: 'center !important',
                                  paddingLeft: '4px !important',
                                  paddingRight: '4px !important',
                                }
                              }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const { label, tone } = getStatusLabelAndTone(att.attendanceStatus);
                          return <BOSStatusChip status={label} toneOverride={tone} showIcon={true} width={120} />;
                        })()}
                      </TableCell>
                      {!isEdit && (
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                            <Tooltip title={`Focus / Video Call with ${att.employee?.employeeName || 'Attendee'}`}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenIndividualCall(att)}
                                sx={{
                                  color: 'primary.main',
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.12)',
                                  p: 0.5,
                                  borderRadius: '8px',
                                  border: '1px solid rgba(33, 150, 243, 0.3)',
                                  '&:hover': { bgcolor: 'primary.main', color: '#fff' }
                                }}
                              >
                                <VideocamTwoToneIcon sx={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>

                            {canSave && (
                              <IconButton
                                size="large"
                                color="success"
                                onClick={() => handleSaveIndividualAttendance(att)}
                                sx={{ bgcolor: 'success.lighter', '&:hover': { bgcolor: 'success.main', color: 'white' }, p: 1 }}
                              >
                                <IconSave size={18} />
                              </IconButton>
                            )}
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </BOSFormSection>

        {/* BOTTOM: DISCUSSION POINTS */}
        <Box>
          <BOSFormSection
            title="Discussion & Action Points"
            icon={<IconMessageDots size={20} />}
            contentSx={{ p: 0 }}
            action={
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  value={discussionViewMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setDiscussionViewMode(newMode)}
                  size="small"
                  sx={{ height: 28 }}
                >
                  <ToggleButton value="card" aria-label="Card View">
                    <Tooltip title="Card View" arrow>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconLayoutGrid size={15} />
                        <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>Cards</Typography>
                      </Stack>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="table" aria-label="Table View">
                    <Tooltip title="Table View" arrow>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <IconTable size={15} />
                        <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>Table</Typography>
                      </Stack>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                {perms.write && !isEdit && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconPlus size={16} />}
                    onClick={() => handleOpenDetailDialog(null)}
                    sx={{ ...btnSave, px: 1.5, py: 0.5, fontSize: '0.75rem', height: 28 }}
                  >
                    Add Point
                  </Button>
                )}

                <Tooltip title="Maximize Panel" placement="top" arrow>
                  <IconButton
                    size="small"
                    onClick={() => setIsDiscussionMaximized(true)}
                    sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }}
                  >
                    <IconMaximize size={18} />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          >
            {discussionViewMode === 'card' ? (
              <Box sx={{ width: '100%', p: 1 }}>
                {renderDiscussionCards(form.details)}
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ border: 'none', borderRadius: 2, overflowX: 'auto', overflowY: 'auto', maxHeight: 600 }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    minWidth: 1850,
                    tableLayout: 'fixed',
                    '& td, & th': { borderRight: '1px solid', borderColor: 'divider', verticalAlign: 'middle' }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      {/* Action Left (Add/Edit) */}
                      <TableCell sx={{ ...headerSx, width: '3.5%', textAlign: 'center', zIndex: 12, left: 0, position: 'sticky', p: 0.5 }}>
                        {perms.write && !isEdit && (
                          <Tooltip title="Add New Row" placement="top" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDetailDialog(null)}
                              sx={{ bgcolor: 'background.paper', color: 'primary.dark', '&:hover': { bgcolor: 'primary.lighter', color: 'primary.dark' } }}
                            >
                              <IconPlus size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                      {/* Sticky Sl No Header */}
                      <TableCell sx={{ ...headerSx, width: '3.5%', textAlign: 'center', p: 0.5 }}>SL NO</TableCell>
                      <TableCell sx={{ ...headerSx, width: '13%', textAlign: 'center', p: 0.5 }}>MIN NO</TableCell>
                      <TableCell sx={{ ...headerSx, width: '33%', textAlign: 'center' }}>DISCUSSED POINT</TableCell>
                      <TableCell sx={{ ...headerSx, width: '6%', textAlign: 'center', p: 0.5 }}>TYPE</TableCell>
                      <TableCell sx={{ ...headerSx, width: '6%', textAlign: 'center', p: 0.5 }}>PROCESS</TableCell>
                      <TableCell sx={{ ...headerSx, width: '11%', textAlign: 'center', p: 0.5 }}>ASSIGNED TO</TableCell>
                      <TableCell sx={{ ...headerSx, width: '11%', textAlign: 'center', p: 0.5 }}>ASSIGNED BY</TableCell>
                      <TableCell sx={{ ...headerSx, width: '6.5%', textAlign: 'center', p: 0.5 }}>TARGET DATE</TableCell>
                      <TableCell sx={{ ...headerSx, width: '6.5%', textAlign: 'center', p: 0.5 }}>REVIEW DATE</TableCell>
                      <TableCell sx={{ ...headerSx, width: '5.5%', textAlign: 'center', p: 0.5 }}>ATTACHMENT REQ</TableCell>
                      <TableCell
                        sx={{
                          ...headerSx,
                          width: '4.5%',
                          textAlign: 'center',
                          zIndex: 12,
                          right: 0,
                          position: 'sticky',
                          borderRight: 'none',
                          p: 0.5
                        }}
                      >
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {form.details.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={12}
                          align="center"
                          sx={{ py: 6, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.75rem' }}
                        >
                          No discussion & action points added. Click the '+' button in the header to add.
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.details.map((det, idx) => (
                        <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' }, '&:hover': { bgcolor: 'primary.lighter' } }}>
                          {/* Action Left: Edit Icon */}
                          <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 10, textAlign: 'center', p: 0.5 }}>
                            {perms.write ? (
                              <Tooltip title="Edit Row" placement="top" arrow>
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() => handleOpenDetailDialog(idx)}
                                  sx={{ bgcolor: 'secondary.lighter', '&:hover': { bgcolor: 'secondary.main', color: 'white' }, p: 0.3 }}
                                >
                                  <IconEdit size={14} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </TableCell>

                          {/* Sticky Sl No Body */}
                          <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 800, p: 0.5 }}>
                            {form.details.length - idx}
                          </TableCell>

                          {/* References */}
                          <TableCell
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'text.secondary',
                              px: 0.5,
                              py: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={det.meetNo || ''}
                          >
                            {det.meetNo || '-'}
                          </TableCell>

                          {/* Discussed Point (Truncated, Clickable) */}
                          <TableCell
                            onClick={() => perms.write && handleOpenDetailDialog(idx)}
                            sx={{
                              p: 1,
                              maxWidth: '300px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: perms.write ? 'pointer' : 'default',
                              '&:hover': perms.write ? { bgcolor: 'action.hover' } : {}
                            }}
                          >
                            <Tooltip title={det.discussedPoint || (perms.write ? 'Click to Edit' : '')} placement="top" arrow>
                              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: det.discussedPoint ? 'text.primary' : 'text.disabled',
                                    fontStyle: det.discussedPoint ? 'normal' : 'italic',
                                    fontWeight: 500,
                                    pr: 1,
                                    width: '100%',
                                    display: 'block'
                                  }}
                                >
                                  {det.discussedPoint || 'Click to enter discussed point...'}
                                </Typography>
                              </Stack>
                            </Tooltip>
                          </TableCell>

                          {/* Details */}
                          <TableCell
                            align="center"
                            sx={{ p: 0.5 }}
                            title={det.type || ''}
                          >
                            {det.type ? (
                              <Chip
                                label={det.type}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  height: '18px',
                                  borderRadius: '4px',
                                  '& .MuiChip-label': {
                                    px: 1,
                                    py: 0
                                  }
                                }}
                              />
                            ) : '-'}
                          </TableCell>

                          {/* Responsibility */}
                          <TableCell align="center" sx={{ p: 0.5 }}>
                            <Chip
                              label={det.processType || 'INFO'}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: det.processType === 'ACTION' ? 'secondary.lighter' : 'primary.lighter',
                                color: det.processType === 'ACTION' ? 'secondary.dark' : 'primary.dark',
                                border: '1px solid',
                                borderColor: det.processType === 'ACTION' ? 'secondary.main' : 'primary.main',
                                height: '18px',
                                '& .MuiChip-label': {
                                  px: 1,
                                  py: 0
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={det.assignedTo?.employeeName || ''}
                          >
                            {det.assignedTo?.employeeName || '-'}
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={det.assignedBy?.employeeName || ''}
                          >
                            {det.assignedBy?.employeeName || '-'}
                          </TableCell>

                          {/* Timeline */}
                          <TableCell
                            sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {det.targetDate ? det.targetDate.split('-').reverse().join('/') : '-'}
                          </TableCell>
                          <TableCell
                            sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {det.reviewDate ? det.reviewDate.split('-').reverse().join('/') : '-'}
                          </TableCell>

                          {/* Closure */}
                          <TableCell
                            align="center"
                            sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {det.attachmentRequired || 'NO'}
                          </TableCell>

                          {/* Sticky Actions Body */}
                          <TableCell
                            sx={{
                              position: 'sticky',
                              right: 0,
                              bgcolor: 'inherit',
                              zIndex: 10,
                              borderRight: 'none',
                              textAlign: 'center',
                              p: 0.5
                            }}
                          >
                            {perms.write ? (
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title={isEdit ? "View Row" : "Edit Row"}>
                                  <IconButton
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleOpenDetailDialog(idx)}
                                    sx={{ bgcolor: 'secondary.lighter', '&:hover': { bgcolor: 'secondary.main', color: 'white' }, p: 0.3 }}
                                  >
                                    <IconEdit size={14} />
                                  </IconButton>
                                </Tooltip>
                                {!isEdit && (
                                  <Tooltip title="Delete Row">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeDetailRow(idx)}
                                      disabled={form.details.length === 1}
                                      sx={{ bgcolor: 'error.lighter', p: 0.3 }}
                                    >
                                      <IconTrash size={14} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </BOSFormSection>
        </Box>

        {/* MAXIMIZED POPUP DIALOG FOR DISCUSSION & ACTION POINTS */}
        <Dialog
          open={isDiscussionMaximized}
          onClose={(e, reason) => {
            if (reason === 'escapeKeyDown') return;
            setIsDiscussionMaximized(false);
          }}
          disableEscapeKeyDown
          fullWidth
          maxWidth="xl"
          sx={{ zIndex: 1200 }}
          PaperProps={{
            sx: {
              height: '92vh',
              maxHeight: '92vh',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column'
            }
          }}
        >
          <DialogTitle
            sx={{
              p: 2,
              px: 3,
              bgcolor: 'primary.lighter',
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconMessageDots size={22} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                Discussion & Action Points
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <ToggleButtonGroup
                value={discussionViewMode}
                exclusive
                onChange={(e, newMode) => newMode && setDiscussionViewMode(newMode)}
                size="small"
                sx={{ height: 28 }}
              >
                <ToggleButton value="card" aria-label="Card View">
                  <Tooltip title="Card View" arrow>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconLayoutGrid size={15} />
                      <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>Cards</Typography>
                    </Stack>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="table" aria-label="Table View">
                  <Tooltip title="Table View" arrow>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconTable size={15} />
                      <Typography variant="caption" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline' } }}>Table</Typography>
                    </Stack>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>

              {perms.write && !isEdit && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={() => handleOpenDetailDialog(null)}
                  sx={{ ...btnSave, px: 1.5, py: 0.5, fontSize: '0.75rem', height: 28 }}
                >
                  Add Point
                </Button>
              )}

              <Tooltip title="Minimize" placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={() => setIsDiscussionMaximized(false)}
                  sx={{ color: 'text.secondary', bgcolor: 'background.paper', '&:hover': { bgcolor: 'primary.lighter', color: 'primary.main' } }}
                >
                  <IconMinimize size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close" placement="top" arrow>
                <IconButton
                  size="small"
                  onClick={() => setIsDiscussionMaximized(false)}
                  sx={{ color: 'text.secondary', bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.lighter', color: 'error.main' } }}
                >
                  <IconX size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
            {discussionViewMode === 'card' ? (
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                {renderDiscussionCards(form.details)}
              </Box>
            ) : (
              <>
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: 'none', borderRadius: 0, flexGrow: 1, overflowX: 'auto', overflowY: 'auto' }}
                >
                  <Table
                    stickyHeader
                    size="small"
                    sx={{
                      minWidth: 1850,
                      tableLayout: 'fixed',
                      '& td, & th': { borderRight: '1px solid', borderColor: 'divider', verticalAlign: 'middle' }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        {/* Action Left (Add/Edit) */}
                        <TableCell sx={{ ...headerSx, width: '3.5%', textAlign: 'center', zIndex: 12, left: 0, position: 'sticky', p: 0.5 }}>
                          {perms.write && !isEdit && (
                            <Tooltip title="Add New Row" placement="top" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDetailDialog(null)}
                                sx={{ bgcolor: 'background.paper', color: 'primary.dark', '&:hover': { bgcolor: 'primary.lighter', color: 'primary.dark' } }}
                              >
                                <IconPlus size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                        {/* Sticky Sl No Header */}
                        <TableCell sx={{ ...headerSx, width: '3.5%', textAlign: 'center', p: 0.5 }}>SL NO</TableCell>
                        <TableCell sx={{ ...headerSx, width: '13%', textAlign: 'center', p: 0.5 }}>MIN NO</TableCell>
                        <TableCell sx={{ ...headerSx, width: '33%', textAlign: 'center' }}>DISCUSSED POINT</TableCell>
                        <TableCell sx={{ ...headerSx, width: '6%', textAlign: 'center', p: 0.5 }}>TYPE</TableCell>
                        <TableCell sx={{ ...headerSx, width: '6%', textAlign: 'center', p: 0.5 }}>PROCESS</TableCell>
                        <TableCell sx={{ ...headerSx, width: '11%', textAlign: 'center', p: 0.5 }}>ASSIGNED TO</TableCell>
                        <TableCell sx={{ ...headerSx, width: '11%', textAlign: 'center', p: 0.5 }}>ASSIGNED BY</TableCell>
                        <TableCell sx={{ ...headerSx, width: '6.5%', textAlign: 'center', p: 0.5 }}>TARGET DATE</TableCell>
                        <TableCell sx={{ ...headerSx, width: '6.5%', textAlign: 'center', p: 0.5 }}>REVIEW DATE</TableCell>
                        <TableCell sx={{ ...headerSx, width: '5.5%', textAlign: 'center', p: 0.5 }}>ATTACHMENT REQ</TableCell>
                        <TableCell
                          sx={{
                            ...headerSx,
                            width: '4.5%',
                            textAlign: 'center',
                            zIndex: 12,
                            right: 0,
                            position: 'sticky',
                            borderRight: 'none',
                            p: 0.5
                          }}
                        >
                          ACTIONS
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.details.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={12}
                            align="center"
                            sx={{ py: 6, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.75rem' }}
                          >
                            No discussion & action points added. Click the '+' button in the header to add.
                          </TableCell>
                        </TableRow>
                      ) : (
                        form.details
                          .slice(detailPage * detailRowsPerPage, detailPage * detailRowsPerPage + detailRowsPerPage)
                          .map((det, pageRelativeIdx) => {
                            const idx = detailPage * detailRowsPerPage + pageRelativeIdx;
                            return (
                              <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'grey.50' }, '&:hover': { bgcolor: 'primary.lighter' } }}>
                                {/* Action Left: Edit Icon */}
                                <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'inherit', zIndex: 10, textAlign: 'center', p: 0.5 }}>
                                  {perms.write ? (
                                    <Tooltip title="Edit Row" placement="top" arrow>
                                      <IconButton
                                        size="small"
                                        color="secondary"
                                        onClick={() => handleOpenDetailDialog(idx)}
                                        sx={{ bgcolor: 'secondary.lighter', '&:hover': { bgcolor: 'secondary.main', color: 'white' }, p: 0.3 }}
                                      >
                                        <IconEdit size={14} />
                                      </IconButton>
                                    </Tooltip>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>

                                {/* Sticky Sl No Body */}
                                <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 800, p: 0.5 }}>
                                  {form.details.length - idx}
                                </TableCell>

                                {/* References */}
                                <TableCell
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    color: 'text.secondary',
                                    px: 0.5,
                                    py: 1,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                  title={det.meetNo || ''}
                                >
                                  {det.meetNo || '-'}
                                </TableCell>

                                {/* Discussed Point (Truncated, Clickable) */}
                                <TableCell
                                  onClick={() => perms.write && handleOpenDetailDialog(idx)}
                                  sx={{
                                    p: 1,
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: perms.write ? 'pointer' : 'default',
                                    '&:hover': perms.write ? { bgcolor: 'action.hover' } : {}
                                  }}
                                >
                                  <Tooltip title={det.discussedPoint || (perms.write ? 'Click to Edit' : '')} placement="top" arrow>
                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.75rem',
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          color: det.discussedPoint ? 'text.primary' : 'text.disabled',
                                          fontStyle: det.discussedPoint ? 'normal' : 'italic',
                                          fontWeight: 500,
                                          pr: 1,
                                          width: '100%',
                                          display: 'block'
                                        }}
                                      >
                                        {det.discussedPoint || 'Click to enter discussed point...'}
                                      </Typography>
                                    </Stack>
                                  </Tooltip>
                                </TableCell>

                                {/* Details */}
                                <TableCell
                                  align="center"
                                  sx={{ p: 0.5 }}
                                  title={det.type || ''}
                                >
                                  {det.type ? (
                                    <Chip
                                      label={det.type}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      sx={{
                                        fontSize: '0.65rem',
                                        fontWeight: 800,
                                        height: '18px',
                                        borderRadius: '4px',
                                        '& .MuiChip-label': {
                                          px: 1,
                                          py: 0
                                        }
                                      }}
                                    />
                                  ) : '-'}
                                </TableCell>

                                {/* Responsibility */}
                                <TableCell align="center" sx={{ p: 0.5 }}>
                                  <Chip
                                    label={det.processType || 'INFO'}
                                    size="small"
                                    sx={{
                                      fontSize: '0.65rem',
                                      fontWeight: 800,
                                      bgcolor: det.processType === 'ACTION' ? 'secondary.lighter' : 'primary.lighter',
                                      color: det.processType === 'ACTION' ? 'secondary.dark' : 'primary.dark',
                                      border: '1px solid',
                                      borderColor: det.processType === 'ACTION' ? 'secondary.main' : 'primary.main',
                                      height: '18px',
                                      '& .MuiChip-label': {
                                        px: 1,
                                        py: 0
                                      }
                                    }}
                                  />
                                </TableCell>
                                <TableCell
                                  sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={det.assignedTo?.employeeName || ''}
                                >
                                  {det.assignedTo?.employeeName || '-'}
                                </TableCell>
                                <TableCell
                                  sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  title={det.assignedBy?.employeeName || ''}
                                >
                                  {det.assignedBy?.employeeName || '-'}
                                </TableCell>

                                {/* Timeline */}
                                <TableCell
                                  sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                  {det.targetDate ? det.targetDate.split('-').reverse().join('/') : '-'}
                                </TableCell>
                                <TableCell
                                  sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                  {det.reviewDate ? det.reviewDate.split('-').reverse().join('/') : '-'}
                                </TableCell>

                                {/* Closure */}
                                <TableCell
                                  align="center"
                                  sx={{ fontSize: '0.75rem', px: 0.5, py: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                  {det.attachmentRequired || 'NO'}
                                </TableCell>

                                {/* Sticky Actions Body */}
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    right: 0,
                                    bgcolor: 'inherit',
                                    zIndex: 10,
                                    borderRight: 'none',
                                    textAlign: 'center',
                                    p: 0.5
                                  }}
                                >
                                  {perms.write ? (
                                    <Stack direction="row" spacing={0.5} justifyContent="center">
                                      <Tooltip title={isEdit ? "View Row" : "Edit Row"}>
                                        <IconButton
                                          size="small"
                                          color="secondary"
                                          onClick={() => handleOpenDetailDialog(idx)}
                                          sx={{ bgcolor: 'secondary.lighter', '&:hover': { bgcolor: 'secondary.main', color: 'white' }, p: 0.3 }}
                                        >
                                          <IconEdit size={14} />
                                        </IconButton>
                                      </Tooltip>
                                      {!isEdit && (
                                        <Tooltip title="Delete Row">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeDetailRow(idx)}
                                            disabled={form.details.length === 1}
                                            sx={{ bgcolor: 'error.lighter', p: 0.3 }}
                                          >
                                            <IconTrash size={14} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Stack>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', px: 2 }}>
                  <TablePagination
                    component="div"
                    count={form.details.length}
                    page={detailPage}
                    onPageChange={(e, newPage) => setDetailPage(newPage)}
                    rowsPerPage={detailRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setDetailRowsPerPage(parseInt(e.target.value, 10));
                      setDetailPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 20, 50]}
                  />
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Box>

      <MaterialSelectionDialog
        open={materialDialog.open}
        type={materialDialog.type}
        onClose={() => setMaterialDialog({ open: false, rowIdx: null, type: 'RM' })}
        onSelect={handleSelectMaterial}
      />

      {/* Detail Add/Edit Dialog */}
      <BOSFormDialog
        open={detailDialog.open}
        onClose={() => {
          setDialogErrors({});
          setDetailDialog({
            open: false,
            rowIdx: null,
            form: {
              meetNo: '',
              amendMeetNo: '',
              discussedPoint: '',
              type: '',
              materialList: '',
              processType: 'INFO',
              assignedBy: null,
              assignedTo: null,
              targetDate: '',
              reviewDate: '',
              attachmentRequired: 'NO',
              status: 'CLOSED',
              isAmended: false
            }
          });
        }}

        onSave={isEdit ? undefined : handleSaveDetailDialog}
        title={isEdit ? 'View Discussion & Action Point' : (detailDialog.rowIdx === null ? 'Add Discussion & Action Point' : 'Edit Discussion & Action Point')}
        maxWidth="md"
      >
        {detailDialog.form && (
          <Stack spacing={3} sx={{ mt: 1 }}>


            {/* Discussed Point */}
            <BOSTextField
              fullWidth
              multiline
              rows={4}
              label="Discussed Point *"
              value={detailDialog.form.discussedPoint}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setDetailDialog((prev) => ({
                  ...prev,
                  form: { ...prev.form, discussedPoint: val }
                }));
              }}
              disabled={!perms.write || isEdit}
              InputProps={{
                readOnly: isEdit,
                endAdornment: !isEdit && (
                  <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isListening && <VoiceWaveform />}
                      <IconButton
                        color={isListening ? 'error' : 'primary'}
                        onClick={(e) => handleMicClick(e)}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        sx={{
                          animation: isListening ? 'pulse 1.5s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.2)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }}
                      >
                        {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                )
              }}
              error={!isEdit && !!dialogErrors.discussedPoint}
              placeholder={DEFAULT_DISCUSSED_POINT}
              required
              sx={{
                position: 'relative',
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary',
                  opacity: 0.7,
                  whiteSpace: 'normal'
                }
              }}
              helperText={
                !isEdit && (
                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      color={dialogErrors.discussedPoint ? 'error.main' : 'success.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {dialogErrors.discussedPoint ? (
                        `⚠️ ${dialogErrors.discussedPoint}`
                      ) : (
                        `✅ Valid length (${detailDialog.form.discussedPoint.length} characters)`
                      )}
                    </Typography>
                  </Stack>
                )
              }
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, minmax(0, 1fr))' },
                gap: 2.5,
                alignItems: 'start',
                width: '100%'
              }}
            >
              {/* Type */}
              <BOSTextField
                select
                fullWidth
                label="Type"
                value={detailDialog.form.type || ''}
                disabled={!perms.write || isEdit}
                sx={{
                  gridColumn: {
                    xs: 'span 1',
                    sm: (detailDialog.form.type === 'RM' || detailDialog.form.type === 'PRODUCT') ? 'span 1' : 'span 2'
                  }
                }}
                onChange={(e) => {
                  const newType = e.target.value;
                  setDetailDialog((prev) => ({
                    ...prev,
                    form: {
                      ...prev.form,
                      type: newType,
                      materialList: (newType === 'RM' || newType === 'PRODUCT') ? prev.form.materialList : ''
                    }
                  }));
                }}
              >
                <MenuItem value=""><em>Select</em></MenuItem>
                <MenuItem value="RM">RM</MenuItem>
                <MenuItem value="PRODUCT">PRODUCT</MenuItem>
              </BOSTextField>

              {/* Material List */}
              {(detailDialog.form.type === 'RM' || detailDialog.form.type === 'PRODUCT') && (
                <BOSTextField
                  fullWidth
                  label="Material List"
                  value={detailDialog.form.materialList}
                  placeholder="Click to select material..."
                  onClick={() => perms.write && !isEdit && setMaterialDialog({ open: true, rowIdx: 'dialog', type: detailDialog.form.type || 'RM' })}
                  InputProps={{
                    readOnly: true,
                    sx: { cursor: (perms.write && !isEdit) ? 'pointer' : 'default' }
                  }}
                />
              )}

              {/* Process */}
              <BOSTextField
                select
                fullWidth
                label="Process"
                value={detailDialog.form.processType}
                disabled={!perms.write || isEdit}
                onChange={(e) => {
                  const val = e.target.value;
                  setDetailDialog((prev) => ({
                    ...prev,
                    form: {
                      ...prev.form,
                      processType: val,
                      status: val === 'INFO' ? 'CLOSED' : 'OPEN',
                      assignedTo: val === 'INFO' ? null : prev.form.assignedTo,
                      assignedBy: val === 'INFO' ? null : prev.form.assignedBy,
                      targetDate: val === 'INFO' ? '' : prev.form.targetDate,
                      reviewDate: val === 'INFO' ? '' : prev.form.reviewDate,
                      attachmentRequired: val === 'INFO' ? 'NO' : prev.form.attachmentRequired
                    }
                  }));
                }}
              >
                <MenuItem value="INFO">INFO</MenuItem>
                <MenuItem value="ACTION">ACTION</MenuItem>
              </BOSTextField>

              {/* Attachment Required */}
              <BOSTextField
                select
                fullWidth
                label="Attachment Req"
                value={detailDialog.form.attachmentRequired}
                onChange={(e) =>
                  setDetailDialog((prev) => ({
                    ...prev,
                    form: { ...prev.form, attachmentRequired: e.target.value }
                  }))
                }
                disabled={!perms.write || isEdit || detailDialog.form.processType === 'INFO'}
              >
                <MenuItem value="YES">YES</MenuItem>
                <MenuItem value="NO">NO</MenuItem>
              </BOSTextField>

              {/* Assigned To – the person who will PERFORM / complete the action */}
              {detailDialog.form.processType === 'ACTION' && (
                <BOSAutocomplete
                  options={assignedToOptions}
                  getOptionLabel={(option) => option.employeeName || ''}
                  isOptionEqualToValue={(option, val) => getUserId(option) === getUserId(val)}
                  value={detailDialog.form.assignedTo}
                  disabled={!perms.write || isEdit}
                  onChange={(val) =>
                    setDetailDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, assignedTo: val }
                    }))
                  }
                  label="Assigned To"
                  placeholder="Select person responsible for action"
                />
              )}

              {/* Assigned By – the person who DELEGATED / raised the action */}
              {detailDialog.form.processType === 'ACTION' && (
                <BOSAutocomplete
                  options={assignedByOptions}
                  getOptionLabel={(option) => option.employeeName || ''}
                  isOptionEqualToValue={(option, val) => getUserId(option) === getUserId(val)}
                  value={detailDialog.form.assignedBy}
                  disabled={!perms.write || isEdit}
                  onChange={(val) =>
                    setDetailDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, assignedBy: val }
                    }))
                  }
                  label="Assigned By"
                  placeholder="Select person who assigned the action"
                />
              )}

              {/* Target Date */}
              {detailDialog.form.processType === 'ACTION' && (
                <BOSDatePicker
                  name="targetDate"
                  label="Target Date"
                  value={detailDialog.form.targetDate}
                  disabled={!perms.write || isEdit}
                  onChange={(e) =>
                    setDetailDialog((prev) => {
                      const newTargetDate = e.target.value;
                      let newReviewDate = prev.form.reviewDate;
                      if (newReviewDate && (newReviewDate > newTargetDate || newReviewDate < TODAY)) {
                        newReviewDate = '';
                      }
                      return {
                        ...prev,
                        form: {
                          ...prev.form,
                          targetDate: newTargetDate,
                          reviewDate: newReviewDate
                        }
                      };
                    })
                  }
                  minDate={new Date()}
                  error={
                    !isEdit && detailDialog.form.targetDate && detailDialog.form.targetDate < TODAY
                  }
                  helperText={
                    !isEdit && detailDialog.form.targetDate && detailDialog.form.targetDate < TODAY
                      ? 'Past Date!'
                      : ''
                  }
                />
              )}

              {/* Review Date */}
              {detailDialog.form.processType === 'ACTION' && (
                <BOSDatePicker
                  name="reviewDate"
                  label="Review Date"
                  value={detailDialog.form.reviewDate}
                  disabled={!perms.write || isEdit || !detailDialog.form.targetDate}
                  onChange={(e) =>
                    setDetailDialog((prev) => ({
                      ...prev,
                      form: { ...prev.form, reviewDate: e.target.value }
                    }))
                  }
                  minDate={new Date()}
                  maxDate={detailDialog.form.targetDate ? new Date(detailDialog.form.targetDate) : undefined}
                  error={
                    !isEdit && ((detailDialog.form.reviewDate && detailDialog.form.reviewDate < TODAY) ||
                      (detailDialog.form.reviewDate && detailDialog.form.targetDate && detailDialog.form.reviewDate > detailDialog.form.targetDate))
                  }
                  helperText={
                    !isEdit && (detailDialog.form.reviewDate && detailDialog.form.reviewDate < TODAY
                      ? 'Past Date!'
                      : detailDialog.form.reviewDate && detailDialog.form.targetDate && detailDialog.form.reviewDate > detailDialog.form.targetDate
                        ? 'After Target Date!'
                        : '')
                  }
                />
              )}

              {/* Uploaded Documents Section - Placed at the bottom */}
              <Box sx={{ mt: 0.5, gridColumn: { xs: 'span 1', sm: 'span 4' } }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontSize: '0.78rem' }}>
                  <IconPaperclip size={15} color={theme.palette.primary.main} /> Uploaded Documents
                </Typography>
                <BOSFileUpload
                  files={detailDialog.form.files || (detailDialog.form.attachments ? (Array.isArray(detailDialog.form.attachments) ? detailDialog.form.attachments : parseFileString(detailDialog.form.attachments)) : [])}
                  onChange={(uploadedFiles) => {
                    if (isEdit) return;
                    const paths = uploadedFiles.map((f) => f.serverFileName || f.path || f.filePath || f.name).join(',');
                    setDetailDialog((prev) => ({
                      ...prev,
                      form: {
                        ...prev.form,
                        files: uploadedFiles,
                        attachments: uploadedFiles,
                        attachmentInfo: paths,
                        attachmentRequired: uploadedFiles.length > 0 ? 'YES' : prev.form.attachmentRequired
                      }
                    }));
                  }}
                  module="QUALITY_MANAGEMENT_SYSTEMS_MEETING_MINUTES_OF_MEETING"
                  label="Upload Files"
                  multiple={true}
                  compact={true}
                  inlineList={true}
                  disabled={!perms.write || isEdit}
                  hideDropzone={isEdit}
                />
              </Box>

            </Box>
          </Stack>
        )}
      </BOSFormDialog>

      {/* Static Action Buttons at Bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, pr: 8 }}>
        <Stack direction="row" spacing={1.5}>
          <Tooltip title={shortcutTooltip('Back', 'Esc')}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate('/qms/minutesofmeeting')}
              sx={btnCancel}
            >
              Back
            </Button>
          </Tooltip>
          {canSave && (
            <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />}
                onClick={handleSave}
                disabled={saving}
                sx={btnSave}
              >
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Save')}
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Box>
      <MomPDFDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        momId={editId}
        row={form}
      />
    </MainCard>
  );
}
