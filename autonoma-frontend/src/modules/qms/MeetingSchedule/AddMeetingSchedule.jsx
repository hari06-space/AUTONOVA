import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  MenuItem,
  Stack,
  Box,
  Typography,
  Autocomplete,
  Divider,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Tooltip,
  CircularProgress,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import {
  BOSTextField,
  BOSFormSection,
  BOSPersonnelCard,
  BOSDatePicker,
  BOSTimePicker,
  BOSFormDialog,
  getPhotoUrl,
  btnSave,
  btnCancel,
  btnClear,
  BOSStatusChip,
  BOSToggleSwitch,
  errorStyle
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useConfig from 'hooks/useConfig';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import ReactQuillDemo from 'ui-component/third-party/ReactQuill';
import { IconSettings, IconCalendarEvent, IconUsers, IconArrowLeft, IconEraser, IconDeviceFloppy, IconBarcode, IconCircleCheck, IconMicrophone, IconX, IconPlus, IconChevronDown, IconCrown, IconUserPlus, IconUserCheck } from '@tabler/icons-react';

const FREQUENCIES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'BI-ANNUAL', 'ANNUAL'];
const ALL_TIME_OPTIONS = Array.from({ length: 96 }).map((_, i) => {
  const hour24 = Math.floor(i / 4);
  const m = ((i % 4) * 15).toString().padStart(2, '0');
  const hour12 = (hour24 % 12 || 12).toString().padStart(2, '0');
  return { label: `${hour12}:${m}`, hour24, minutes: parseInt(m, 10) };
});

const HALF_HOUR_TIME_OPTIONS = ALL_TIME_OPTIONS.filter((t) => {
  const isAfterOrEqual9AM = t.hour24 >= 9;
  const isBeforeOrEqual830PM = t.hour24 < 20 || (t.hour24 === 20 && t.minutes === 30);
  const isHalfHour = t.minutes === 0 || t.minutes === 30;
  return isAfterOrEqual9AM && isBeforeOrEqual830PM && isHalfHour;
}).map((t) => t.label);



const parseTimeToMinutes = (timeInput) => {
  if (!timeInput) return null;
  if (timeInput instanceof Date) {
    return timeInput.getHours() * 60 + timeInput.getMinutes();
  }
  if (typeof timeInput !== 'string') return null;

  const clean = timeInput.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm) {
    if (h < 1 || h > 12 || m < 0 || m > 59) return null;
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
  } else {
    if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  }
  return h * 60 + m;
};

const formatMinutesToTime = (totalMins, use24h) => {
  if (totalMins === null || totalMins === undefined) return '';
  let h24 = Math.floor(totalMins / 60) % 24;
  let m = totalMins % 60;

  if (use24h) {
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } else {
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  }
};

const to24h = (timeStr) => {
  if (!timeStr) return null;
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return null;
  return formatMinutesToTime(mins, true);
};

const to12h = (time24h, use24h = false) => {
  if (!time24h) return null;
  const mins = parseTimeToMinutes(time24h);
  if (mins === null) return null;
  return formatMinutesToTime(mins, use24h);
};

const addMinutesToTimeStr = (timeStr, minutesToAdd, use24h = false) => {
  if (!timeStr) return '';
  const mins = parseTimeToMinutes(timeStr);
  if (mins === null) return '';
  return formatMinutesToTime(mins + minutesToAdd, use24h);
};

const getMinEndTime = (startTime, intervalTime, use24h = false) => {
  const baseTime = intervalTime || startTime;
  if (!baseTime) return '';
  return addMinutesToTimeStr(baseTime, 10, use24h);
};

const getMinStartTime = (meetingDate, use24h = false) => {
  if (!meetingDate) return '';
  const today = new Date();
  const selectedDate = new Date(meetingDate);
  if (selectedDate.toDateString() === today.toDateString()) {
    let hours = today.getHours();
    let minutes = today.getMinutes();
    const mins = hours * 60 + minutes;
    return formatMinutesToTime(mins + 10, use24h);
  }
  return '';
};

const getWordCount = (htmlText) => {
  if (!htmlText) return 0;
  const cleanText = htmlText.replace(/<[^>]*>/g, ' ').trim();
  return cleanText ? cleanText.split(/\s+/).length : 0;
};

const getCharCount = (htmlText) => {
  if (!htmlText) return 0;
  const cleanText = htmlText.replace(/<[^>]*>/g, '');
  return cleanText.length;
};

const isEmployeeActive = (emp) => {
  if (!emp) return false;
  if (!emp.status) return false;
  const statusStr = typeof emp.status === 'string' ? emp.status : (emp.status.name || emp.status.statusCode || emp.status.statusName || '');
  return String(statusStr).toUpperCase() === 'ACTIVE';
};

// Reusable Avatar with Hover Zoom / Large Preview Tooltip
const EmployeeAvatarWithPreview = ({
  photoUpload,
  name,
  code,
  dept,
  designation,
  size = 44,
  variant = 'rounded',
  isDark = false,
  sx = {}
}) => {
  const photoUrl = getPhotoUrl(photoUpload);

  const avatarElement = (
    <Avatar
      src={photoUrl}
      variant={variant}
      sx={{
        width: size,
        height: size,
        borderRadius: variant === 'rounded' ? '8px' : '50%',
        cursor: photoUrl ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1.5px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#e0f2fe',
        color: isDark ? '#93c5fd' : '#0284c7',
        fontSize: size <= 26 ? '0.7rem' : '0.85rem',
        fontWeight: 700,
        flexShrink: 0,
        '&:hover': photoUrl ? {
          transform: 'scale(1.12)',
          boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.6)' : '0 4px 14px rgba(37,99,235,0.25)',
          borderColor: 'primary.main'
        } : {},
        ...sx
      }}
    >
      {name ? name.charAt(0).toUpperCase() : <IconUsers size={Math.round(size * 0.55)} />}
    </Avatar>
  );

  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={150}
      leaveDelay={100}
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: isDark ? '#0f172a' : '#ffffff',
            color: isDark ? '#f8fafc' : '#0f172a',
            p: 1.5,
            borderRadius: '12px',
            boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.7)' : '0 12px 32px rgba(15,23,42,0.18)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0',
            maxWidth: 240
          }
        },
        arrow: {
          sx: {
            color: isDark ? '#0f172a' : '#ffffff'
          }
        }
      }}
      title={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {photoUrl ? (
            <Box
              component="img"
              src={photoUrl}
              alt={name || 'Employee Photo'}
              sx={{
                width: 140,
                height: 155,
                objectFit: 'cover',
                borderRadius: '8px',
                mb: 1,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
          ) : (
            <Avatar
              variant="rounded"
              sx={{
                width: 110,
                height: 110,
                fontSize: '2.5rem',
                fontWeight: 700,
                bgcolor: 'primary.main',
                color: '#fff',
                mb: 1,
                borderRadius: '8px'
              }}
            >
              {name ? name.charAt(0).toUpperCase() : <IconUsers size={44} />}
            </Avatar>
          )}
          {name && (
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2, color: isDark ? '#f8fafc' : '#0f172a', mt: 0.3 }}>
              {name}
            </Typography>
          )}
          {code && (
            <Typography variant="caption" sx={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', display: 'block', mt: 0.2 }}>
              {code}
            </Typography>
          )}
          {dept && (
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 600, display: 'block', mt: 0.2 }}>
              {dept}
            </Typography>
          )}
          {designation && (
            <Typography variant="caption" sx={{ fontSize: '0.68rem', color: isDark ? '#cbd5e1' : '#64748b', display: 'block', mt: 0.1 }}>
              {designation}
            </Typography>
          )}
        </Box>
      }
    >
      {avatarElement}
    </Tooltip>
  );
};

const INITIAL_FORM = {
  scheduleNo: 'AUTO',
  meetingDate: new Date().toISOString().split('T')[0],
  status: 'OPEN',
  meetingType: null,
  description: '',
  agenda: '',
  subject: '',
  startTime: '',
  endTime: '',
  intervalTime: '',
  frequency: 'NONE',
  departments: [],
  chairedBy: null,
  hostBy: null,
  secondaryHost: null,
  tertiaryHost: null,
  participants: [],
  weekdays: ''
};

export default function AddMeetingSchedule({ open, onClose, onSave, item, readOnly = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const amendId = searchParams.get('amendId');
  const isPage = !open;

  const initialFormStateRef = useRef(null);

  const isFormModified = () => {
    if (!amendId || !initialFormStateRef.current) return true;
    const init = initialFormStateRef.current;

    if (form.meetingDate !== init.meetingDate) return true;
    if (form.startTime !== init.startTime) return true;
    if (form.endTime !== init.endTime) return true;
    if (form.intervalTime !== init.intervalTime) return true;
    if (form.frequency !== init.frequency) return true;
    if (form.weekdays !== init.weekdays) return true;
    if (form.description !== init.comments) return true;
    if (form.subject !== init.subject) return true;
    if (form.agenda !== init.agenda) return true;

    if ((form.meetingType?.id ?? null) !== (init.meetingType?.id ?? null)) return true;
    if ((form.chairedBy?.id || null) !== (init.chairedBy?.id || null)) return true;
    if ((form.hostBy?.id || null) !== (init.hostBy?.id || null)) return true;
    if ((form.secondaryHost?.id || null) !== (init.secondaryHost?.id || null)) return true;
    if ((form.tertiaryHost?.id || null) !== (init.tertiaryHost?.id || null)) return true;

    const currentDepts = (form.departments || []).map(d => d.id).sort().join(',');
    if (currentDepts !== init.departments) return true;

    const currentParticipants = (form.participants || []).map(p => `${p.id}:${p.secondaryEmployee?.id || ''}:${p.tertiaryEmployee?.id || ''}`).sort().join(',');
    if (currentParticipants !== init.participants) return true;

    return false;
  };

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { errors, validate, clearErrors, handleInputChange, setErrors } = useBOSValidation();
  const { user } = useAuth();
  const perms = usePagePermissions(PAGE_CODES?.QMS_MEETING_SCHEDULE || 'QM1310');
  const userLevel = user?.userLevel ?? user?.level ?? 0;
  const hasAdd1Permission = Boolean(perms?.additional1 || perms?.add1 || userLevel >= 5);

  const { timeFormat } = useConfig();
  const use24h = timeFormat !== 'H12';
  const isEdit = !!item || !!id;
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updateConfig, setUpdateConfig] = useState(false);

  const hasConfig = Boolean(form.configId || form.parentScheduleId || (form.id && form.frequency && form.frequency !== 'NONE'));
  const showConfigToggle = hasConfig && hasAdd1Permission;

  const statusUpper = String(
    (typeof form.status === 'object' ? form.status?.name : form.status) || form.statusObj?.name || ''
  ).toUpperCase().trim();

  const isClosedStatus = ['CLOSED', 'AUTO CLOSED', 'AUTO_CLOSED', 'COMPLETED', 'VERIFIED', 'CANCELLED'].includes(statusUpper) || form.status === 3 || form.status === 4;
  const isReadOnlyMode = readOnly || (isClosedStatus && !amendId);

  const participantsInputRef = useRef(null);
  const initialParticipantsRef = useRef([]);
  const initialChairedByRef = useRef(null);
  const initialHostByRef = useRef(null);
  const lastProcessedMeetingTypeIdRef = useRef(null);

  const [meetingTypeDepartments, setMeetingTypeDepartments] = useState([]);

  const handleVoiceInput = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      dispatch(openSnackbar({ open: true, message: 'Speech recognition is not supported in this browser.', variant: 'alert', severity: 'warning' }));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    dispatch(openSnackbar({ open: true, message: 'Listening... Speak now.', variant: 'alert', severity: 'info' }));

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setForm(prev => ({
        ...prev,
        [field]: prev[field] ? `${prev[field]} ${speechToText}` : speechToText
      }));
      dispatch(openSnackbar({ open: true, message: 'Voice input captured.', variant: 'alert', severity: 'success' }));
    };

    recognition.onerror = (event) => {
      console.error(event.error);
      dispatch(openSnackbar({ open: true, message: `Voice input failed: ${event.error}`, variant: 'alert', severity: 'error' }));
    };

    recognition.start();
  };

  // Direct lookup fetch — more reliable than useLookups
  const [meetings, setMeetings] = useState([]);
  const [activeDepartments, setActiveDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [levels, setLevels] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [eligibleChairpersons, setEligibleChairpersons] = useState([]);
  const [eligibleHosts, setEligibleHosts] = useState([]);
  const [eligibleParticipants, setEligibleParticipants] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [expandedAlternates, setExpandedAlternates] = useState({});

  const sortMeetingsDesc = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const idA = Number(a.id || a.ID || 0);
      const idB = Number(b.id || b.ID || 0);
      if (idB !== idA) return idB - idA;
      const nameA = (a.meetingName || a.label || '').toUpperCase();
      const nameB = (b.meetingName || b.label || '').toUpperCase();
      return nameB.localeCompare(nameA);
    });
  };

  useEffect(() => {
    if (open || isPage) {
      // Fetch departments directly to ensure they are always populated
      axios.get('/api/master/hr/departments')
        .then(r => {
          const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
          if (list.length > 0) setActiveDepartments(list);
        })
        .catch(() => { });

      axios.get('/api/lookups/bulk?types=MEETINGS,DEPARTMENTS,EMPLOYEES,LEVELS,DESIGNATIONS')
        .then((res) => {
          const d = res.data || {};
          console.log('[MeetingSchedule] Bulk lookup response keys:', Object.keys(d));
          console.log('[MeetingSchedule] meetings:', (d.meetings || []).length, 'departments:', (d.departments || []).length, 'employees:', (d.employees || []).length);
          setMeetings(sortMeetingsDesc(Array.isArray(d.meetings) ? d.meetings : []));
          if (Array.isArray(d.departments) && d.departments.length > 0) {
            setActiveDepartments(d.departments);
          }
          setEmployees(Array.isArray(d.employees) ? d.employees : []);
          setLevels(Array.isArray(d.levels) ? d.levels : []);
          setDesignations(Array.isArray(d.designations) ? d.designations : []);
        })
        .catch((err) => {
          console.error('[MeetingSchedule] Bulk lookup failed, using fallback:', err.message);
          // Fallback: fetch individually
          axios.get(API_PATHS.QMS.MEETINGS).then(r => {
            const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
            console.log('[MeetingSchedule] Fallback meetings:', list.length);
            setMeetings(sortMeetingsDesc(list));
          }).catch(() => { });
          axios.get('/api/master/hr/departments').then(r => {
            const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
            console.log('[MeetingSchedule] Fallback departments:', list.length);
            setActiveDepartments(list);
          }).catch(() => { });
          axios.get('/api/master/hr/employees').then(r => {
            const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
            console.log('[MeetingSchedule] Fallback employees:', list.length);
            setEmployees(list);
          }).catch(() => { });
          axios.get('/api/master/hr/levels').then(r => {
            const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
            console.log('[MeetingSchedule] Fallback levels:', list.length);
            setLevels(list);
          }).catch(() => { });
          axios.get('/api/master/hr/designations').then(r => {
            const list = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.content) ? r.data.content : []);
            console.log('[MeetingSchedule] Fallback designations:', list.length);
            setDesignations(list);
          }).catch(() => { });
        });
    }
  }, [open, isPage]);

  // Clear handler to reset form but keep current user populated
  const handleClear = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      createdUser: user?.employeeName || user?.userName || user?.name || 'System'
    });
    clearErrors();
  }, [user, clearErrors]);

  const getFilteredTimeOptions = useCallback(() => {
    if (!form.startTime) return HALF_HOUR_TIME_OPTIONS;
    const startIndex = HALF_HOUR_TIME_OPTIONS.indexOf(form.startTime);
    if (startIndex === -1) return HALF_HOUR_TIME_OPTIONS;
    return HALF_HOUR_TIME_OPTIONS.slice(startIndex + 1);
  }, [form.startTime]);

  // Auto-clear end time and interval time if they violate chronological constraints
  useEffect(() => {
    setForm(prev => {
      let updated = false;
      const nextForm = { ...prev };

      const startMins = parseTimeToMinutes(nextForm.startTime);
      if (startMins !== null) {
        // 1. If intervalTime is set but violates the 10 min constraint, clear it
        if (nextForm.intervalTime) {
          const intervalMins = parseTimeToMinutes(nextForm.intervalTime);
          if (intervalMins !== null && intervalMins < startMins + 10) {
            nextForm.intervalTime = '';
            updated = true;
          }
        }

        // 2. If endTime is set, validate it violates the 10 min constraint
        if (nextForm.endTime) {
          const endMins = parseTimeToMinutes(nextForm.endTime);
          const baseMins = nextForm.intervalTime ? parseTimeToMinutes(nextForm.intervalTime) : startMins;
          if (endMins !== null && baseMins !== null && endMins < baseMins + 10) {
            nextForm.endTime = '';
            updated = true;
          }
        }
      } else {
        // If startTime is cleared, clear intervalTime and endTime too
        if (nextForm.intervalTime) {
          nextForm.intervalTime = '';
          updated = true;
        }
        if (nextForm.endTime) {
          nextForm.endTime = '';
          updated = true;
        }
      }

      return updated ? nextForm : prev;
    });
  }, [form.startTime, form.intervalTime]);

  useEffect(() => {
    if (isPage) {
      const targetId = id || amendId;
      if (targetId) {
        setLoading(true);
        axios.get(`${API_PATHS.QMS.MEETING_SCHEDULES}/${targetId}`)
          .then((res) => {
            const data = res.data;
            const origStatusStr = typeof data.status === 'object' ? data.status?.name : data.status;
            const origStatusUpper = String(origStatusStr || data.statusObj?.name || '').toUpperCase().trim();

            if (amendId && origStatusUpper === 'CLOSED') {
              dispatch(openSnackbar({
                open: true,
                message: 'Manually closed meeting schedules cannot be amended.',
                variant: 'alert',
                severity: 'error'
              }));
              navigate('/qms/meeting-schedule');
              setLoading(false);
              return;
            }

            const loadedParticipants = (data.participants || []).map(p => ({
              ...(p.employee || {}),
              secondaryEmployee: p.secondaryEmployee || null,
              tertiaryEmployee: p.tertiaryEmployee || null
            }));
            initialParticipantsRef.current = loadedParticipants;
            initialChairedByRef.current = data.chairedBy;
            initialHostByRef.current = data.hostBy;

            setForm({
              ...data,
              id: amendId ? undefined : data.id,
              scheduleNo: amendId ? 'AUTO' : data.scheduleNo,
              revSourceScheduleNo: amendId ? data.scheduleNo : data.revSourceScheduleNo,
              revNo: amendId ? (data.revNo || 0) + 1 : data.revNo,
              status: amendId ? 'OPEN' : data.status,
              statusObj: amendId ? { name: 'OPEN' } : data.statusObj,
              description: data.comments || '',
              startTime: to12h(data.startTime, use24h),
              endTime: to12h(data.endTime, use24h),
              intervalTime: to12h(data.intervalTime, use24h),
              departments: (data.departments || []).map(d => d.department),
              participants: loadedParticipants,
              secondaryHost: data.secondaryHost || null,
              tertiaryHost: data.tertiaryHost || null
            });

            if (amendId) {
              initialFormStateRef.current = {
                meetingDate: data.meetingDate,
                startTime: to12h(data.startTime, use24h),
                endTime: to12h(data.endTime, use24h),
                intervalTime: to12h(data.intervalTime, use24h),
                frequency: data.frequency,
                weekdays: data.weekdays,
                comments: data.comments || '',
                subject: data.subject,
                agenda: data.agenda,
                meetingType: data.meetingType ? { id: data.meetingType.id } : null,
                departments: (data.departments || []).map(d => d.department.id).sort().join(','),
                chairedBy: data.chairedBy ? { id: data.chairedBy.id } : null,
                hostBy: data.hostBy ? { id: data.hostBy.id } : null,
                secondaryHost: data.secondaryHost ? { id: data.secondaryHost.id } : null,
                tertiaryHost: data.tertiaryHost ? { id: data.tertiaryHost.id } : null,
                participants: loadedParticipants.map(e => `${e.id}:${e.secondaryEmployee?.id || ''}:${e.tertiaryEmployee?.id || ''}`).sort().join(',')
              };
            }

            clearErrors();
            setSubmitting(false);
          })
          .catch((err) => {
            console.error('[AddMeetingSchedule] Failed to fetch schedule by ID:', err);
            dispatch(openSnackbar({ open: true, message: 'Failed to load schedule details.', variant: 'alert', severity: 'error' }));
          })
          .finally(() => setLoading(false));
      } else {
        initialParticipantsRef.current = [];
        initialChairedByRef.current = null;
        initialHostByRef.current = null;
        setForm({
          ...INITIAL_FORM,
          createdUser: user?.employeeName || user?.userName || user?.name || 'System'
        });
        clearErrors();
        setSubmitting(false);
      }
    } else if (open) {
      if (item) {
        const loadedParticipants = (item.participants || []).map(p => ({
          ...(p.employee || {}),
          secondaryEmployee: p.secondaryEmployee || null,
          tertiaryEmployee: p.tertiaryEmployee || null
        }));
        initialParticipantsRef.current = loadedParticipants;
        initialChairedByRef.current = item.chairedBy;
        initialHostByRef.current = item.hostBy;
        setForm({
          ...item,
          description: item.comments || '',
          startTime: to12h(item.startTime, use24h),
          endTime: to12h(item.endTime, use24h),
          intervalTime: to12h(item.intervalTime, use24h),
          departments: (item.departments || []).map(d => d.department),
          participants: loadedParticipants
        });
      } else {
        initialParticipantsRef.current = [];
        initialChairedByRef.current = null;
        initialHostByRef.current = null;
        setForm({
          ...INITIAL_FORM,
          createdUser: user?.employeeName || user?.userName || user?.name || 'System'
        });
      }
      clearErrors();
      setSubmitting(false);
    }
  }, [isPage, id, amendId, open, item, user, clearErrors, use24h, dispatch]);

  const h = (e) => handleInputChange(e, setForm);

  // Auto-populate based on Meeting Type
  useEffect(() => {
    if (form.meetingType) {
      setForm(p => ({
        ...p,
        subject: p.subject || form.meetingType.meetingName || form.meetingType.subject || '',
        description: p.description || form.meetingType.meetingDescription || '',
        agenda: p.agenda || form.meetingType.meetingAgenda || ''
      }));
    }
  }, [form.meetingType]);

  const deptIdsStr = (form.departments || []).map(d => d.id).join(',');
  useEffect(() => {
    if (form.meetingType?.id != null && form.meetingType?.id !== '') {
      setLoadingEligible(true);

      const deptParams = deptIdsStr ? `&departmentIds=${deptIdsStr}` : '';

      Promise.all([
        axios.get(`/api/qms/meeting-schedules/eligible-employees?meetingTypeId=${form.meetingType.id}&role=CHAIRED`),
        axios.get(`/api/qms/meeting-schedules/eligible-employees?meetingTypeId=${form.meetingType.id}&role=HOST${deptParams}`),
        axios.get(`/api/qms/meeting-schedules/eligible-employees?meetingTypeId=${form.meetingType.id}&role=PARTICIPANT${deptParams}`)
      ])
        .then(([resChaired, resHost, resParticipant]) => {
          const listChaired = Array.isArray(resChaired.data) ? resChaired.data : [];
          const listHost = Array.isArray(resHost.data) ? resHost.data : [];
          const listParticipant = Array.isArray(resParticipant.data) ? resParticipant.data : [];

          setEligibleChairpersons(listChaired);
          setEligibleHosts(listHost);
          setEligibleParticipants(listParticipant);

          const allEmployees = [...listChaired, ...listHost, ...listParticipant];
          const uniqueDeptIds = [...new Set(allEmployees.map(e => String(e.departmentId || e.department?.id)))].filter(id => id && id !== 'undefined');
          const relevantDepartments = activeDepartments.filter(d => uniqueDeptIds.includes(String(d.id)));
          setMeetingTypeDepartments(relevantDepartments.length > 0 ? relevantDepartments : activeDepartments);

          setForm(p => {
            const nextForm = { ...p };

            if (lastProcessedMeetingTypeIdRef.current !== form.meetingType.id && !amendId && !item && !id) {
              nextForm.departments = [];
              nextForm.chairedBy = null;
              nextForm.hostBy = null;
              nextForm.participants = [];
              lastProcessedMeetingTypeIdRef.current = form.meetingType.id;
            } else {
              const chairedIds = listChaired.map(e => String(e.id));
              const hostIds = listHost.map(e => String(e.id));
              const participantIds = listParticipant.map(e => String(e.id));

              if (p.chairedBy && !chairedIds.includes(String(p.chairedBy.id))) {
                const isInitialChaired = initialChairedByRef.current && String(p.chairedBy.id) === String(initialChairedByRef.current.id);
                if (!isInitialChaired) nextForm.chairedBy = null;
              }
              if (p.hostBy && !hostIds.includes(String(p.hostBy.id))) {
                const isInitialHost = initialHostByRef.current && String(p.hostBy.id) === String(initialHostByRef.current.id);
                if (!isInitialHost) nextForm.hostBy = null;
              }
              if (p.participants && p.participants.length > 0) {
                const initialIds = (initialParticipantsRef.current || []).map(emp => String(emp.id));
                nextForm.participants = p.participants.filter(pt =>
                  participantIds.includes(String(pt.id)) || initialIds.includes(String(pt.id))
                );
              }
              lastProcessedMeetingTypeIdRef.current = form.meetingType.id;
            }
            return nextForm;
          });
        })
        .catch((err) => {
          console.error('[AddMeetingSchedule] Failed to fetch eligible employees:', err);
        })
        .finally(() => setLoadingEligible(false));
    } else {
      setEligibleChairpersons([]);
      setEligibleHosts([]);
      setEligibleParticipants([]);
      setMeetingTypeDepartments(activeDepartments);
    }
  }, [form.meetingType?.id, deptIdsStr, activeDepartments, amendId, item, id]);

  // Automatically clear secondary / tertiary host if they are removed from participants
  useEffect(() => {
    setForm(p => {
      let updated = false;
      const nextForm = { ...p };
      const participantIds = (nextForm.participants || []).map(emp => String(emp.id));

      if (nextForm.secondaryHost && !participantIds.includes(String(nextForm.secondaryHost.id))) {
        nextForm.secondaryHost = null;
        updated = true;
      }
      if (nextForm.tertiaryHost && !participantIds.includes(String(nextForm.tertiaryHost.id))) {
        nextForm.tertiaryHost = null;
        updated = true;
      }

      return updated ? nextForm : p;
    });
  }, [form.participants]);

  // Automatically clear selected host if their department is unselected
  useEffect(() => {
    if (form.hostBy) {
      const selectedDeptIds = (form.departments || []).map(d => String(d.id));
      const hostDeptId = String(form.hostBy.departmentId || form.hostBy.department?.id);
      if ((form.departments || []).length === 0 || (hostDeptId && !selectedDeptIds.includes(hostDeptId))) {
        setForm(p => ({ ...p, hostBy: null }));
      }
    }
  }, [form.departments, form.hostBy]);

  useEffect(() => {
    if (form.frequency === 'WEEKLY' && form.meetingDate) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const [y, m, d] = form.meetingDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayName = days[dateObj.getDay()];

      setForm(p => ({ ...p, weekdays: dayName }));
    }
  }, [form.frequency, form.meetingDate]);

  // Automatically clear selected participants if their department is removed
  useEffect(() => {
    const selectedDeptIds = (form.departments || []).map(d => String(d.id));

    setForm(prev => {
      let updated = false;
      const nextForm = { ...prev };
      const cleared = [];

      const validParticipants = (nextForm.participants || []).filter(p => {
        const deptId = p.departmentId || p.department?.id;
        return !deptId || selectedDeptIds.includes(String(deptId));
      });
      const removedCount = (nextForm.participants || []).length - validParticipants.length;
      if (removedCount > 0) {
        cleared.push(`${removedCount} participant${removedCount > 1 ? 's' : ''}`);
        nextForm.participants = validParticipants;
        updated = true;
      }

      // Notify the user if anything was automatically cleared
      if (cleared.length > 0) {
        setTimeout(() => {
          dispatch(openSnackbar({
            open: true,
            message: `Department removed — auto-cleared: ${cleared.join(', ')}.`,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning'
          }));
        }, 0);
      }

      return updated ? nextForm : prev;
    });
  }, [form.departments]);

  // Clear secondary or tertiary host if they are removed from participants
  useEffect(() => {
    setForm(prev => {
      let updated = false;
      const nextForm = { ...prev };

      if (nextForm.secondaryHost && !nextForm.participants.some(p => String(p.id) === String(nextForm.secondaryHost.id))) {
        nextForm.secondaryHost = null;
        updated = true;
      }

      if (nextForm.tertiaryHost && !nextForm.participants.some(p => String(p.id) === String(nextForm.tertiaryHost.id))) {
        nextForm.tertiaryHost = null;
        updated = true;
      }

      return updated ? nextForm : prev;
    });
  }, [form.participants]);

  const handleSave = async () => {
    if (submitting) return;

    const isSecondaryMandatory = form.frequency !== 'NONE' && (form.participants || []).length >= 2;
    const isTertiaryMandatory = form.frequency !== 'NONE' && (form.participants || []).length >= 3;

    const rules = [
      { field: 'meetingDate', label: 'Schedule Date', required: true },
      { field: 'meetingType', label: 'Meeting Type', required: true },
      { field: 'subject', label: 'Subject', required: true },
      { field: 'startTime', label: 'Schedule Time', required: true },
      { field: 'endTime', label: 'End Time', required: true },
      { field: 'frequency', label: 'Frequency', required: true },
      { field: 'departments', label: 'Departments', required: true, type: 'array' },
      { field: 'chairedBy', label: 'Chairperson', required: true },
      { field: 'hostBy', label: 'Host', required: true },
      { field: 'secondaryHost', label: 'Secondary Host', required: isSecondaryMandatory },
      { field: 'tertiaryHost', label: 'Tertiary Host', required: isTertiaryMandatory },
      { field: 'participants', label: 'Participants', required: true, type: 'array' },
      { field: 'weekdays', label: 'Weekdays', required: form.frequency === 'WEEKLY' }
    ];

    if (validate(form, rules)) {
      if (amendId && !isFormModified()) {
        dispatch(openSnackbar({
          open: true,
          message: 'No changes detected. Amendment can only be saved if there are modifications.',
          variant: 'alert',
          severity: 'warning'
        }));
        return;
      }
      if (form.chairedBy && form.hostBy && String(form.chairedBy.id) === String(form.hostBy.id)) {
        dispatch(openSnackbar({ open: true, message: 'Same employee cannot be both Chaired By and Host.', variant: 'alert', severity: 'error' }));
        return;
      }
      if (form.chairedBy && form.participants.some(p => String(p.id) === String(form.chairedBy.id))) {
        dispatch(openSnackbar({ open: true, message: 'Chaired By employee cannot be a Participant.', variant: 'alert', severity: 'error' }));
        return;
      }
      if (form.hostBy && form.participants.some(p => String(p.id) === String(form.hostBy.id))) {
        dispatch(openSnackbar({ open: true, message: 'Host employee cannot be a Participant.', variant: 'alert', severity: 'error' }));
        return;
      }
      const participantIds = form.participants.map(p => String(p.id));
      const hasDuplicateParticipants = participantIds.some((id, idx) => participantIds.indexOf(id) !== idx);
      if (hasDuplicateParticipants) {
        dispatch(openSnackbar({ open: true, message: 'Duplicate Participant entries are not allowed.', variant: 'alert', severity: 'error' }));
        return;
      }

      let hasCustomErrors = false;
      const customErrors = {};

      const today = new Date();
      const isToday = new Date(form.meetingDate).toDateString() === today.toDateString();

      if (form.startTime) {
        const startMins = parseTimeToMinutes(form.startTime);
        if (isToday && !isEdit && !amendId) {
          const currentMins = today.getHours() * 60 + today.getMinutes();
          // Provide a 5-minute grace period so users don't get blocked if they spend a few minutes filling out the form
          if (startMins < currentMins + 5) {
            customErrors.startTime = 'Start Time must be at least 10 minutes later than the current time.';
            hasCustomErrors = true;
          }
        }

        if (form.intervalTime) {
          const intervalMins = parseTimeToMinutes(form.intervalTime);
          if (intervalMins < startMins + 10) {
            customErrors.intervalTime = 'Interval Time must be at least 10 minutes later than Start Time.';
            hasCustomErrors = true;
          }
        }

        if (form.endTime) {
          const baseMins = form.intervalTime ? parseTimeToMinutes(form.intervalTime) : startMins;
          const endMins = parseTimeToMinutes(form.endTime);
          if (endMins < baseMins + 10) {
            customErrors.endTime = form.intervalTime
              ? 'End Time must be at least 10 minutes later than Interval Time.'
              : 'End Time must be at least 10 minutes later than Start Time.';
            hasCustomErrors = true;
          }
        }
      }

      if (hasCustomErrors) {
        setErrors(prev => ({ ...prev, ...customErrors }));
        dispatch(openSnackbar({ open: true, message: 'Please fix the time validation errors.', variant: 'alert', severity: 'error' }));
        return;
      }

      setSubmitting(true);
      try {
        const cleanPayload = {
          id: form.id,
          scheduleNo: form.scheduleNo,
          revSourceScheduleNo: form.revSourceScheduleNo,
          revNo: form.revNo,
          parentScheduleId: form.parentScheduleId,
          configId: form.configId,
          autoSchedule: form.autoSchedule,
          meetingDate: form.meetingDate,
          startTime: to24h(form.startTime),
          endTime: to24h(form.endTime),
          intervalTime: to24h(form.intervalTime),
          frequency: form.frequency,
          weekdays: form.weekdays,
          weekdayMappings: form.weekdayMappings || [],
          comments: form.description,
          subject: form.subject,
          agenda: form.agenda,
          status: form.status,
          meetingType: form.meetingType,
          departments: form.departments.map(d => ({ department: d })),
          chairedBy: form.chairedBy,
          hostBy: form.hostBy,
          secondaryHost: form.secondaryHost,
          tertiaryHost: form.tertiaryHost,
          participants: form.participants.map(e => ({
            employee: e?.id ? { id: e.id } : e,
            secondaryEmployee: e.secondaryEmployee?.id ? { id: e.secondaryEmployee.id } : null,
            tertiaryEmployee: e.tertiaryEmployee?.id ? { id: e.tertiaryEmployee.id } : null
          })),
          isActive: form.isActive !== undefined ? form.isActive : true,
          updateConfig: Boolean(updateConfig)
        };


        const saveId = form.id || id;
        if (saveId) {
          await axios.put(`${API_PATHS.QMS.MEETING_SCHEDULES}/${saveId}`, cleanPayload);
          dispatch(openSnackbar({ open: true, message: 'Meeting schedule updated successfully.', variant: 'alert', severity: 'success' }));
        } else {
          await axios.post(API_PATHS.QMS.MEETING_SCHEDULES, cleanPayload);
          dispatch(openSnackbar({ open: true, message: 'Meeting schedule saved successfully.', variant: 'alert', severity: 'success' }));
        }
        if (isPage) {
          navigate('/qms/meeting-schedule');
        } else {
          if (onSave) onSave();
          if (onClose) onClose();
        }
      } catch (error) {
        setSubmitting(false);
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save schedule due to connection or validation issues.';
        dispatch(openSnackbar({ open: true, message: `Failed to save schedule: ${errorMsg}`, variant: 'alert', severity: 'error' }));
      }
    }
  };

  const handleBack = () => {
    if (isPage) {
      navigate('/qms/meeting-schedule');
    } else if (onClose) {
      onClose();
    }
  };

  // Keyboard Shortcuts — placed after handleSave/handleClear so refs are defined
  // (hook uses a ref internally, so handlers are always up-to-date)
  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'ctrl+backspace': handleClear,
    'escape': handleBack
  }, isPage || open);

  // Exclude all employees who are already assigned to any role or alternate in the meeting schedule
  const getAvailableAlternates = (currentParticipantId, slotType) => {
    const basePool = (eligibleParticipants && eligibleParticipants.length > 0)
      ? eligibleParticipants
      : (employees || []);

    const excludedIds = new Set();

    // 1. Chaired By & Hosts
    if (form.chairedBy?.id) excludedIds.add(String(form.chairedBy.id));
    if (form.hostBy?.id) excludedIds.add(String(form.hostBy.id));
    if (form.secondaryHost?.id) excludedIds.add(String(form.secondaryHost.id));
    if (form.tertiaryHost?.id) excludedIds.add(String(form.tertiaryHost.id));

    // 2. All Primary participants in the meeting
    (form.participants || []).forEach(p => {
      if (p?.id) excludedIds.add(String(p.id));
    });

    // 3. All Secondary and Tertiary mapped participants across ALL cards
    (form.participants || []).forEach(p => {
      const pId = String(p.id);

      // Check secondary
      if (p.secondaryEmployee?.id) {
        // If checking options for THIS card's secondary, allow its own currently selected secondary
        const isCurrentSlot = (pId === String(currentParticipantId) && slotType === 'secondary');
        if (!isCurrentSlot) {
          excludedIds.add(String(p.secondaryEmployee.id));
        }
      }

      // Check tertiary
      if (p.tertiaryEmployee?.id) {
        // If checking options for THIS card's tertiary, allow its own currently selected tertiary
        const isCurrentSlot = (pId === String(currentParticipantId) && slotType === 'tertiary');
        if (!isCurrentSlot) {
          excludedIds.add(String(p.tertiaryEmployee.id));
        }
      }
    });

    return basePool.filter(emp => {
      if (!isEmployeeActive(emp)) return false;
      const empDeptId = String(emp.departmentId || emp.department?.id);
      const isDeptSelected = (form.departments || []).length === 0 || form.departments.some(d => String(d.id) === empDeptId);
      if (!isDeptSelected) return false;

      const empIdStr = String(emp.id);
      if (excludedIds.has(empIdStr)) return false;
      return true;
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const renderFormContent = () => (
    <Stack spacing={2}>
      {statusUpper === 'CANCELLED' ? (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2, fontWeight: 700, mb: 1 }}>
          This Meeting Schedule is CANCELLED (Read-Only Mode).
          {form.cancelReason && (
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, color: '#fff' }}>
              Reason for Cancellation: {form.cancelReason}
            </Typography>
          )}
        </Alert>
      ) : (isClosedStatus && !amendId && (
        <Alert severity="warning" variant="filled" sx={{ borderRadius: 2, fontWeight: 700, mb: 1 }}>
          This Meeting Schedule is {statusUpper || 'CLOSED'} (Read-Only Mode). No changes can be saved.
        </Alert>
      ))}
      {/* HEADER INFO */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2
        }}
      >
        {/* Card 1: Schedule No */}
        <Card
          sx={{
            p: 1.5,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'primary.light',
            bgcolor: isDark ? 'rgba(30, 136, 229, 0.05)' : 'rgba(30, 136, 229, 0.03)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(30, 136, 229, 0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isDark ? '0 8px 24px rgba(30, 136, 229, 0.2)' : '0 8px 24px rgba(30, 136, 229, 0.12)',
              borderColor: 'primary.main',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: isDark ? 'primary.dark' : 'primary.light',
                color: isDark ? '#fff' : 'primary.main',
                boxShadow: '0 2px 8px rgba(30, 136, 229, 0.15)'
              }}
            >
              <IconBarcode size={20} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block',
                  mb: 0.5
                }}
              >
                Schedule No
              </Typography>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: isDark ? 'primary.light' : 'primary.main',
                }}
              >
                {form.scheduleNo}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Card 2: Date */}
        <Card
          sx={{
            p: 1.5,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'secondary.light',
            bgcolor: isDark ? 'rgba(103, 58, 183, 0.05)' : 'rgba(103, 58, 183, 0.03)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(103, 58, 183, 0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isDark ? '0 8px 24px rgba(103, 58, 183, 0.2)' : '0 8px 24px rgba(103, 58, 183, 0.12)',
              borderColor: 'secondary.main',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: isDark ? 'secondary.dark' : 'secondary.light',
                color: isDark ? '#fff' : 'secondary.main',
                boxShadow: '0 2px 8px rgba(103, 58, 183, 0.15)'
              }}
            >
              <IconCalendarEvent size={20} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block',
                  mb: 0.5
                }}
              >
                Schedule Date
              </Typography>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: isDark ? 'secondary.light' : 'secondary.main',
                }}
              >
                {(() => { const rawDate = form.meetingDate || new Date().toISOString().split('T')[0]; if (!rawDate) return '-'; const parts = rawDate.split('T')[0].split('-'); if (parts.length !== 3) return rawDate; return `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`; })()}
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Card 3: Status */}
        <Card
          sx={{
            p: 1.5,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'success.light',
            bgcolor: isDark ? 'rgba(0, 200, 83, 0.05)' : 'rgba(0, 200, 83, 0.03)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0, 200, 83, 0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isDark ? '0 8px 24px rgba(0, 200, 83, 0.2)' : '0 8px 24px rgba(0, 200, 83, 0.12)',
              borderColor: 'success.main',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: isDark ? 'success.dark' : 'success.light',
                color: isDark ? '#fff' : 'success.main',
                boxShadow: '0 2px 8px rgba(0, 200, 83, 0.15)'
              }}
            >
              <IconCircleCheck size={20} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block',
                  mb: 0.5
                }}
              >
                Schedule Status
              </Typography>
              <BOSStatusChip status={form.status} width={100} showIcon />
            </Box>
          </Stack>
        </Card>

        {/* Card 4: Created User */}
        <Card
          sx={{
            p: 1.5,
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'warning.light',
            bgcolor: isDark ? 'rgba(255, 193, 7, 0.05)' : 'rgba(255, 193, 7, 0.03)',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 12px rgba(255, 193, 7, 0.05)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isDark ? '0 8px 24px rgba(255, 193, 7, 0.2)' : '0 8px 24px rgba(255, 193, 7, 0.12)',
              borderColor: 'warning.main',
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: isDark ? 'warning.dark' : 'warning.light',
                color: isDark ? '#fff' : 'warning.main',
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.15)'
              }}
            >
              <IconUsers size={20} />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  display: 'block',
                  mb: 0.5
                }}
              >
                Created User
              </Typography>
              <Typography
                variant="h5"
                noWrap
                sx={{
                  fontWeight: 800,
                  color: isDark ? 'warning.light' : 'warning.main',
                }}
              >
                {form.createdUser || form.createdBy || user?.employeeName || user?.userName || user?.name || 'System'}
              </Typography>
            </Box>
          </Stack>
        </Card>
      </Box>

      {/* MEETING DETAILS SECTION */}
      <BOSFormSection title="Schedule Configuration" icon={<IconSettings size={22} />}>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Autocomplete
              disabled={isReadOnlyMode}
              options={meetings}
              noOptionsText="No Meeting Types assigned."
              getOptionLabel={(option) => option.meetingName || ''}
              value={form.meetingType}
              onChange={(e, val) => {
                if (!val || (form.meetingType && val.id !== form.meetingType.id)) {
                  setForm(p => ({
                    ...INITIAL_FORM,
                    scheduleNo: p.scheduleNo,
                    status: p.status,
                    meetingType: val,
                    subject: val?.meetingName || val?.subject || '',
                    description: val?.meetingDescription || '',
                    agenda: val?.meetingAgenda || ''
                  }));
                } else {
                  setForm(p => ({
                    ...p,
                    meetingType: val,
                    subject: val?.meetingName || val?.subject || '',
                    description: val?.meetingDescription || '',
                    agenda: val?.meetingAgenda || ''
                  }));
                }
                if (errors.meetingType) clearErrors('meetingType');
                if (errors.subject && val) clearErrors('subject');
              }}
              renderInput={(params) => (
                <BOSTextField {...params} label="Meeting Type" required error={!!errors.meetingType} helperText={errors.meetingType} fullWidth sx={errorStyle(!!errors.meetingType)} />
              )}
            />
            <BOSTextField label="Subject" name="subject" value={form.subject || ''} onChange={h} required error={!!errors.subject} fullWidth sx={errorStyle(!!errors.subject)} disabled={isReadOnlyMode} />
          </Box>

          <BOSTextField label="Agenda" name="agenda" placeholder="Enter agenda..." value={form.agenda || ''} onChange={h} multiline minRows={3} disableRichText={true} fullWidth disabled={isReadOnlyMode} />

          <BOSTextField
            label="Description/SOP"
            name="description"
            placeholder="Enter description..."
            value={form.description || ''}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            multiline
            minRows={4}
            disableRichText={true}
            fullWidth
            disabled={isReadOnlyMode}
          />
        </Stack>
      </BOSFormSection>

      {/* SCHEDULING SECTION */}
      <BOSFormSection title="Date & Time" icon={<IconCalendarEvent size={22} />}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <BOSDatePicker
              required
              label="Meeting Date"
              name="meetingDate"
              value={form.meetingDate}
              onChange={h}
              minDate={new Date()}
              error={!!errors.meetingDate}
              helperText={errors.meetingDate}
              sx={errorStyle(!!errors.meetingDate)}
              disabled={isReadOnlyMode}
            />
            <BOSTextField select label="Frequency" name="frequency" value={form.frequency} onChange={h} required error={!!errors.frequency} helperText={errors.frequency} fullWidth sx={errorStyle(!!errors.frequency)} disabled={isReadOnlyMode} >
              {FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </BOSTextField>
          </Box>

          {form.frequency === 'WEEKLY' && (
            <BOSTextField
              label="Weekday (Derived from Date)"
              name="weekdays"
              value={form.weekdays || ''}
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: 'grey.50' }}
              fullWidth
              helperText="Automatically derived from the meeting date"
            />
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <BOSTimePicker
              required
              label="Start Time"
              name="startTime"
              value={form.startTime || ''}
              onChange={h}
              selectedDate={form.meetingDate}
              minTime={isEdit ? '' : getMinStartTime(form.meetingDate, use24h)}
              minTimeMessage="Start Time must be at least 10 minutes later than the current time."
              futureMinutes={10}
              error={!!errors.startTime}
              helperText={errors.startTime}
              fullWidth
              sx={errorStyle(!!errors.startTime)}
              disabled={isReadOnlyMode}
            />
            <BOSTimePicker
              label="Interval Time"
              name="intervalTime"
              value={form.intervalTime || ''}
              onChange={h}
              selectedDate={form.meetingDate}
              minTime={addMinutesToTimeStr(form.startTime, 10, use24h)}
              minTimeMessage="Interval Time must be at least 10 minutes later than Start Time."
              error={!!errors.intervalTime}
              helperText={errors.intervalTime}
              disabled={isReadOnlyMode || !form.startTime}
              fullWidth
              sx={errorStyle(!!errors.intervalTime)}
            />
            <BOSTimePicker
              required
              label="End Time"
              name="endTime"
              value={form.endTime || ''}
              onChange={h}
              selectedDate={form.meetingDate}
              minTime={getMinEndTime(form.startTime, form.intervalTime, use24h)}
              minTimeMessage={form.intervalTime ? "End Time must be at least 10 minutes later than Interval Time." : "End Time must be at least 10 minutes later than Start Time."}
              error={!!errors.endTime}
              helperText={errors.endTime}
              disabled={isReadOnlyMode || !form.startTime}
              fullWidth
              sx={errorStyle(!!errors.endTime)}
            />
          </Box>
        </Box>
      </BOSFormSection>

      {/* PERSONNEL SECTION */}
      <BOSFormSection title="Participants & Host" icon={<IconUsers size={22} />}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {/* 1. DEPARTMENTS SELECTION */}
          <Autocomplete
            multiple
            disableCloseOnSelect
            disabled={isReadOnlyMode}
            options={[{ id: 'select-all', departmentName: 'Select All' }, ...activeDepartments]}
            getOptionLabel={(option) => option.departmentName || ''}
            value={form.departments}
            onChange={(e, newValue, reason, details) => {
              const currentOptions = activeDepartments;
              let finalValues = [];

              if (details?.option?.id === 'select-all') {
                if (form.departments.length === currentOptions.length) {
                  finalValues = [];
                } else {
                  finalValues = currentOptions;
                }
              } else {
                finalValues = newValue.filter(v => v.id !== 'select-all');
              }

              setForm(p => ({ ...p, departments: finalValues }));

              if (errors.departments) clearErrors('departments');
            }}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              if (option.id === 'select-all') {
                const currentOptions = activeDepartments;
                const isAllSelected = form.departments.length === currentOptions.length && currentOptions.length > 0;
                return (
                  <MenuItem key={key} {...optionProps}>
                    <Checkbox checked={isAllSelected} />
                    <Typography fontWeight="bold">Select All</Typography>
                  </MenuItem>
                );
              }
              return (
                <MenuItem key={key} {...optionProps}>
                  <Checkbox checked={selected} />
                  {option.departmentName}
                </MenuItem>
              );
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.departmentName}
                    color="primary"
                    variant="filled"
                    size="small"
                    {...tagProps}
                  />
                );
              })
            }
            renderInput={(params) => <BOSTextField {...params} label="Departments" required error={!!errors.departments} fullWidth sx={errorStyle(!!errors.departments)} />}
          />

          <Divider sx={{ my: 0.5 }} />

          {/* 2. PARTICIPANTS SELECTION */}
          <Autocomplete
            multiple
            disableCloseOnSelect
            disabled={isReadOnlyMode}
            options={(form.meetingType ? eligibleParticipants : []).filter(emp => {
              if (!isEmployeeActive(emp)) return false;
              const empDeptId = String(emp.departmentId || emp.department?.id);
              const isDeptSelected = form.departments.length === 0 || form.departments.some(d => String(d.id) === empDeptId);
              if (!isDeptSelected) return false;
              if (form.chairedBy && String(emp.id) === String(form.chairedBy.id)) return false;
              if (form.hostBy && String(emp.id) === String(form.hostBy.id)) return false;
              if (form.secondaryHost && String(emp.id) === String(form.secondaryHost.id)) return false;
              if (form.tertiaryHost && String(emp.id) === String(form.tertiaryHost.id)) return false;
              if (form.participants.some(p => String(p.id) === String(emp.id))) return false;
              if (form.participants.some(p => String(p.secondaryEmployee?.id) === String(emp.id) || String(p.tertiaryEmployee?.id) === String(emp.id))) return false;
              return true;
            })}
            loading={loadingEligible}
            noOptionsText={!form.meetingType ? "Please select Meeting Type first." : (loadingEligible ? "Loading..." : "No eligible employees found.")}
            getOptionLabel={(option) => option ? `${option.employeeName} (${option.oldEmpCode || option.empCode})` : ''}
            filterOptions={(options, { inputValue }) => {
              const val = inputValue.toLowerCase();
              return options.filter(emp =>
                (emp.employeeName || '').toLowerCase().includes(val) ||
                (emp.oldEmpCode || emp.empCode || '').toLowerCase().includes(val) ||
                (activeDepartments.find(d => String(d.id) === String(emp.departmentId))?.departmentName || '').toLowerCase().includes(val) ||
                (designations.find(d => String(d.id) === String(emp.designationId))?.designationName || '').toLowerCase().includes(val)
              );
            }}
            value={form.participants}
            onChange={(e, val) => {
              setForm(p => {
                const updated = val.map(newEmp => {
                  const existing = (p.participants || []).find(item => String(item.id) === String(newEmp.id));
                  return {
                    ...newEmp,
                    secondaryEmployee: existing?.secondaryEmployee || null,
                    tertiaryEmployee: existing?.tertiaryEmployee || null
                  };
                });
                return { ...p, participants: updated };
              });
              if (errors.participants) clearErrors('participants');
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <MenuItem key={key} {...optionProps} sx={{ gap: 1.5 }}>
                  <Avatar
                    src={getPhotoUrl(option.employeePhotoUpload)}
                    sx={{ width: 30, height: 30, bgcolor: 'primary.light', fontSize: '0.8rem' }}
                  >
                    {option.employeeName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.employeeName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.oldEmpCode || option.empCode}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            }}
            renderInput={(params) => (
              <BOSTextField
                {...params}
                inputRef={participantsInputRef}
                label="Participants"
                required
                error={!!errors.participants}
                fullWidth
                sx={errorStyle(!!errors.participants)}
              />
            )}
          />

          {/* PARTICIPANTS PREVIEW GALLERY */}
          <Box sx={{ mt: 0.5, width: '100%' }}>
            <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconUsers size={18} /> SELECTED PARTICIPANTS ({form.participants.length})
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
              {form.participants.map((emp, idx) => {
                const hasAlternates = Boolean(emp.secondaryEmployee || emp.tertiaryEmployee);
                const isAlternateOpen = expandedAlternates[emp.id] !== undefined ? expandedAlternates[emp.id] : hasAlternates;

                return (
                  <Card key={emp.id || idx} sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 1.5,
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider',
                    bgcolor: isDark ? 'background.default' : '#fff',
                    position: 'relative',
                    height: '100%',
                    transition: 'all 0.2s ease',
                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(15,23,42,0.03)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 16px rgba(37,99,235,0.08)'
                    }
                  }}>
                    {!isReadOnlyMode && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setForm(p => ({
                            ...p,
                            participants: p.participants.filter(item => item.id !== emp.id)
                          }));
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          color: 'text.secondary',
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <IconX size={14} />
                      </IconButton>
                    )}

                    {/* # Index Chip */}
                    <Chip
                      label={`#${idx + 1}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 32,
                        height: 18,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        borderRadius: '4px'
                      }}
                    />

                    {/* Alternate Toggle Icon Button (Next to # Index Chip) */}
                    <Tooltip title={isAlternateOpen ? "Hide Alternates" : (hasAlternates ? "Manage Alternates (Active)" : "Add Secondary & Tertiary Backup Delegates")}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setExpandedAlternates(prev => ({
                            ...prev,
                            [emp.id]: !isAlternateOpen
                          }));
                        }}
                        sx={{
                          position: 'absolute',
                          top: 6,
                          right: 68,
                          width: 22,
                          height: 22,
                          borderRadius: '6px',
                          bgcolor: hasAlternates
                            ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe')
                            : (isAlternateOpen ? (isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9') : 'transparent'),
                          color: hasAlternates
                            ? (isDark ? '#38bdf8' : '#0284c7')
                            : (isAlternateOpen ? 'primary.main' : 'text.secondary'),
                          border: '1px solid',
                          borderColor: hasAlternates
                            ? (isDark ? '#0284c7' : '#38bdf8')
                            : (isAlternateOpen ? 'primary.light' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)')),
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#e0f2fe',
                            color: '#0284c7',
                            borderColor: '#0284c7'
                          }
                        }}
                      >
                        {hasAlternates ? (
                          <IconUserCheck size={14} />
                        ) : (
                          <IconUserPlus size={14} />
                        )}
                      </IconButton>
                    </Tooltip>

                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%', pr: 12, pt: 0.5, mb: isAlternateOpen ? 0.8 : 0 }}>
                      <EmployeeAvatarWithPreview
                        photoUpload={emp.employeePhotoUpload}
                        name={emp.employeeName}
                        code={emp.oldEmpCode || emp.empCode}
                        dept={emp.department?.departmentName || activeDepartments.find(d => String(d.id) === String(emp.departmentId))?.departmentName}
                        designation={designations.find(d => String(d.id) === String(emp.designationId))?.designationName}
                        size={44}
                        variant="rounded"
                        isDark={isDark}
                      />
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                          {emp.employeeName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.72rem', lineHeight: 1.2 }}>
                          {emp.oldEmpCode || emp.empCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '0.72rem', lineHeight: 1.2 }}>
                          {emp.department?.departmentName || activeDepartments.find(d => String(d.id) === String(emp.departmentId))?.departmentName || '-'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Alternates (Secondary & Tertiary Backup) Section - Only Shown When Toggled Open */}
                    {isAlternateOpen && (
                      <Box
                        sx={{
                          width: '100%',
                          mt: 'auto',
                          pt: 0.8,
                          borderTop: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.8
                        }}
                      >
                        {/* Secondary Participant (2nd) */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.8,
                            p: 0.5,
                            px: 0.8,
                            borderRadius: '8px',
                            bgcolor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd',
                            minHeight: 34
                          }}
                        >
                          <Chip
                            label="2nd"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              bgcolor: '#0284c7',
                              color: '#fff',
                              borderRadius: '5px',
                              px: 0.2
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {emp.secondaryEmployee ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                  <EmployeeAvatarWithPreview
                                    photoUpload={emp.secondaryEmployee.employeePhotoUpload}
                                    name={emp.secondaryEmployee.employeeName}
                                    code={emp.secondaryEmployee.oldEmpCode || emp.secondaryEmployee.empCode}
                                    dept={emp.secondaryEmployee.department?.departmentName || activeDepartments.find(d => String(d.id) === String(emp.secondaryEmployee.departmentId))?.departmentName}
                                    designation={designations.find(d => String(d.id) === String(emp.secondaryEmployee.designationId))?.designationName}
                                    size={24}
                                    variant="circular"
                                    isDark={isDark}
                                  />
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography variant="caption" noWrap sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem', lineHeight: 1.15, color: 'text.primary' }}>
                                      {emp.secondaryEmployee.employeeName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem', display: 'block', lineHeight: 1.1 }}>
                                      {emp.secondaryEmployee.oldEmpCode || emp.secondaryEmployee.empCode}
                                    </Typography>
                                  </Box>
                                </Stack>
                                {!isReadOnlyMode && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setForm(p => ({
                                        ...p,
                                        participants: p.participants.map(item =>
                                          String(item.id) === String(emp.id) ? { ...item, secondaryEmployee: null, tertiaryEmployee: null } : item
                                        )
                                      }));
                                    }}
                                    sx={{ p: 0.3, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                  >
                                    <IconX size={13} />
                                  </IconButton>
                                )}
                              </Box>
                            ) : (
                              <Autocomplete
                                size="small"
                                disabled={isReadOnlyMode}
                                options={getAvailableAlternates(emp.id, 'secondary')}
                                getOptionLabel={option => (option ? `${option.employeeName} (${option.oldEmpCode || option.empCode})` : '')}
                                value={null}
                                onChange={(e, val) => {
                                  setForm(p => ({
                                    ...p,
                                    participants: p.participants.map(item =>
                                      String(item.id) === String(emp.id)
                                        ? { ...item, secondaryEmployee: val || null, tertiaryEmployee: val ? item.tertiaryEmployee : null }
                                        : item
                                    )
                                  }));
                                }}
                                renderOption={(props, option) => {
                                  const { key, ...optionProps } = props;
                                  return (
                                    <MenuItem key={key} {...optionProps} sx={{ gap: 1, py: 0.5 }}>
                                      <Avatar
                                        src={getPhotoUrl(option.employeePhotoUpload)}
                                        sx={{ width: 22, height: 22, fontSize: '0.7rem' }}
                                      >
                                        {option.employeeName?.charAt(0)}
                                      </Avatar>
                                      <Box sx={{ minWidth: 0 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                                          {option.employeeName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', lineHeight: 1.1 }}>
                                          {option.oldEmpCode || option.empCode}
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  );
                                }}
                                renderInput={params => (
                                  <BOSTextField
                                    {...params}
                                    placeholder="+ Assign Secondary"
                                    size="small"
                                    fullWidth
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        fontSize: '0.75rem',
                                        minHeight: 26,
                                        height: 26,
                                        p: '0 4px !important',
                                        bgcolor: 'transparent',
                                        '& fieldset': { border: 'none' },
                                        '&:hover fieldset': { border: 'none' },
                                        '&.Mui-focused fieldset': { border: 'none' }
                                      },
                                      '& .MuiInputBase-input': {
                                        p: '0 !important',
                                        fontSize: '0.75rem'
                                      }
                                    }}
                                  />
                                )}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Tertiary Participant (3rd) - Only Shown When Secondary is Assigned */}
                        {emp.secondaryEmployee && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.8,
                              p: 0.5,
                              px: 0.8,
                              borderRadius: '8px',
                              bgcolor: isDark ? 'rgba(168, 85, 247, 0.08)' : '#faf5ff',
                              border: '1px solid',
                              borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : '#e9d5ff',
                              minHeight: 34
                            }}
                          >
                            <Chip
                              label="3rd"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                bgcolor: '#7c3aed',
                                color: '#fff',
                                borderRadius: '5px',
                                px: 0.2
                              }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              {emp.tertiaryEmployee ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                                    <EmployeeAvatarWithPreview
                                      photoUpload={emp.tertiaryEmployee.employeePhotoUpload}
                                      name={emp.tertiaryEmployee.employeeName}
                                      code={emp.tertiaryEmployee.oldEmpCode || emp.tertiaryEmployee.empCode}
                                      dept={emp.tertiaryEmployee.department?.departmentName || activeDepartments.find(d => String(d.id) === String(emp.tertiaryEmployee.departmentId))?.departmentName}
                                      designation={designations.find(d => String(d.id) === String(emp.tertiaryEmployee.designationId))?.designationName}
                                      size={24}
                                      variant="circular"
                                      isDark={isDark}
                                    />
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography variant="caption" noWrap sx={{ fontWeight: 700, display: 'block', fontSize: '0.75rem', lineHeight: 1.15, color: 'text.primary' }}>
                                        {emp.tertiaryEmployee.employeeName}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.68rem', display: 'block', lineHeight: 1.1 }}>
                                        {emp.tertiaryEmployee.oldEmpCode || emp.tertiaryEmployee.empCode}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  {!isReadOnlyMode && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setForm(p => ({
                                          ...p,
                                          participants: p.participants.map(item =>
                                            String(item.id) === String(emp.id) ? { ...item, tertiaryEmployee: null } : item
                                          )
                                        }));
                                      }}
                                      sx={{ p: 0.3, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                    >
                                      <IconX size={13} />
                                    </IconButton>
                                  )}
                                </Box>
                              ) : (
                                <Autocomplete
                                  size="small"
                                  disabled={isReadOnlyMode}
                                  options={getAvailableAlternates(emp.id, 'tertiary')}
                                  getOptionLabel={option => (option ? `${option.employeeName} (${option.oldEmpCode || option.empCode})` : '')}
                                  value={null}
                                  onChange={(e, val) => {
                                    setForm(p => ({
                                      ...p,
                                      participants: p.participants.map(item =>
                                        String(item.id) === String(emp.id) ? { ...item, tertiaryEmployee: val || null } : item
                                      )
                                    }));
                                  }}
                                  renderOption={(props, option) => {
                                    const { key, ...optionProps } = props;
                                    return (
                                      <MenuItem key={key} {...optionProps} sx={{ gap: 1, py: 0.5 }}>
                                        <Avatar
                                          src={getPhotoUrl(option.employeePhotoUpload)}
                                          sx={{ width: 22, height: 22, fontSize: '0.7rem' }}
                                        >
                                          {option.employeeName?.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
                                            {option.employeeName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', lineHeight: 1.1 }}>
                                            {option.oldEmpCode || option.empCode}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    );
                                  }}
                                  renderInput={params => (
                                    <BOSTextField
                                      {...params}
                                      placeholder="+ Assign Tertiary"
                                      size="small"
                                      fullWidth
                                      sx={{
                                        '& .MuiOutlinedInput-root': {
                                          fontSize: '0.75rem',
                                          minHeight: 26,
                                          height: 26,
                                          p: '0 4px !important',
                                          bgcolor: 'transparent',
                                          '& fieldset': { border: 'none' },
                                          '&:hover fieldset': { border: 'none' },
                                          '&.Mui-focused fieldset': { border: 'none' }
                                        },
                                        '& .MuiInputBase-input': {
                                          p: '0 !important',
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                    />
                                  )}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Card>
                );
              })}
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* 3. CHAIRED BY, HOST, SECONDARY HOST, TERTIARY HOST CARDS IN A SINGLE ROW */}
          <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconUsers size={18} /> CHAIRED BY & HOSTS
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, minmax(0, 1fr))' }, gap: 2, mt: 0.5 }}>
            {[
              { role: 'CHAIRED BY', field: 'chairedBy', label: 'Chaired By', required: true, poolType: 'chaired' },
              { role: 'HOST', field: 'hostBy', label: 'Host', required: true, poolType: 'host' },
              {
                role: 'SECONDARY HOST',
                field: 'secondaryHost',
                label: 'Secondary Host',
                required: form.frequency !== 'NONE' && (form.participants || []).length >= 2,
                poolType: 'participants'
              },
              {
                role: 'TERTIARY HOST',
                field: 'tertiaryHost',
                label: 'Tertiary Host',
                required: form.frequency !== 'NONE' && (form.participants || []).length >= 3,
                poolType: 'participants'
              }
            ].map((person) => {
              const selectedEmp = form[person.field];
              let pool = [];
              if (person.poolType === 'chaired') {
                pool = form.meetingType ? eligibleChairpersons : [];
              } else if (person.poolType === 'host') {
                pool = form.meetingType ? eligibleHosts : [];
              } else if (person.poolType === 'participants') {
                pool = form.participants || [];
              }

              const filteredEmployees = pool.filter(emp => {
                if (!isEmployeeActive(emp)) return false;

                // Host strictly requires a department to be selected first
                if (person.field === 'hostBy') {
                  if ((form.departments || []).length === 0) return false;
                  const empDeptId = String(emp.departmentId || emp.department?.id);
                  const isDeptSelected = form.departments.some(d => String(d.id) === empDeptId);
                  if (!isDeptSelected) return false;
                }

                if (person.field !== 'chairedBy' && form.chairedBy && String(emp.id) === String(form.chairedBy.id)) return false;
                if (person.field !== 'hostBy' && form.hostBy && String(emp.id) === String(form.hostBy.id)) return false;
                if (person.field !== 'secondaryHost' && form.secondaryHost && String(emp.id) === String(form.secondaryHost.id)) return false;
                if (person.field !== 'tertiaryHost' && form.tertiaryHost && String(emp.id) === String(form.tertiaryHost.id)) return false;
                if ((person.field === 'chairedBy' || person.field === 'hostBy') && form.participants && form.participants.some(p => String(p.id) === String(emp.id) || String(p.secondaryEmployee?.id) === String(emp.id) || String(p.tertiaryEmployee?.id) === String(emp.id))) return false;

                return true;
              });

              let name = '-';
              let code = '-';
              let empDeptName = '-';
              let empLevel = '-';

              if (selectedEmp) {
                name = selectedEmp.employeeName || '-';
                code = selectedEmp.oldEmpCode || selectedEmp.empCode || selectedEmp.id || '-';
                empDeptName = selectedEmp.department?.departmentName || (activeDepartments || []).find(d => String(d.id) === String(selectedEmp.departmentId))?.departmentName || '-';
                empLevel = selectedEmp.designation?.designationName || selectedEmp.designation?.level?.levelName || (designations || []).find(d => String(d.id) === String(selectedEmp.designationId))?.designationName || (levels || []).find(l => String(l.id) === String(selectedEmp.levelId))?.levelName || '-';
              }

              return (
                <Card
                  key={person.role}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: selectedEmp ? 'primary.main' : (isDark ? 'rgba(255,255,255,0.12)' : '#e3e8ef'),
                    borderRadius: '12px',
                    bgcolor: isDark ? 'background.paper' : '#ffffff',
                    transition: 'all 0.25s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: selectedEmp
                      ? (isDark ? '0 4px 20px rgba(0,0,0,0.35)' : '0 4px 16px rgba(25, 118, 210, 0.08)')
                      : 'none',
                    '&:hover': {
                      boxShadow: isDark ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(0,0,0,0.06)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  {/* Card Header: Role Badge & Code */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      bgcolor: selectedEmp
                        ? (isDark ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.06)')
                        : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                      borderBottom: '1px solid',
                      borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          letterSpacing: 0.8,
                          color: person.required ? 'primary.main' : 'text.secondary'
                        }}
                      >
                        {person.role}
                      </Typography>
                      {person.required && (
                        <Typography component="span" color="error.main" sx={{ fontWeight: 800, fontSize: '0.85rem', lineHeight: 1 }}>
                          *
                        </Typography>
                      )}
                    </Stack>
                    <Chip
                      label={selectedEmp ? (code !== '-' ? code : 'Selected') : 'Unassigned'}
                      size="small"
                      color={selectedEmp ? 'primary' : 'default'}
                      variant={selectedEmp ? 'filled' : 'outlined'}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        px: 0.5
                      }}
                    />
                  </Box>

                  <CardContent sx={{ p: 1.75, pb: '14px !important', display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                    {/* Dropdown Input */}
                    <Box sx={{ width: '100%' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        disabled={isReadOnlyMode}
                        options={filteredEmployees}
                        loading={loadingEligible}
                        noOptionsText={
                          !form.meetingType
                            ? "Select meeting type first"
                            : person.field === 'hostBy' && (form.departments || []).length === 0
                              ? "Select department first"
                              : person.poolType === 'participants'
                                ? ((form.participants || []).length === 0 ? "Select participants first" : "No eligible participants available")
                                : (loadingEligible ? "Loading..." : "No eligible employees found")
                        }
                        getOptionLabel={(option) => option ? `${option.employeeName} (${option.oldEmpCode || option.empCode})` : ''}
                        filterOptions={(options, { inputValue }) => {
                          const val = inputValue.toLowerCase();
                          return options.filter(emp =>
                            (emp.employeeName || '').toLowerCase().includes(val) ||
                            (emp.oldEmpCode || emp.empCode || '').toLowerCase().includes(val) ||
                            (activeDepartments.find(d => String(d.id) === String(emp.departmentId))?.departmentName || '').toLowerCase().includes(val) ||
                            (designations.find(d => String(d.id) === String(emp.designationId))?.designationName || '').toLowerCase().includes(val)
                          );
                        }}
                        value={selectedEmp || null}
                        isOptionEqualToValue={(option, val) => String(option?.id) === String(val?.id)}
                        onChange={(e, val) => {
                          if (val) {
                            if (person.field === 'chairedBy' || person.field === 'hostBy') {
                              if (form.participants.some(p => String(p.id) === String(val.id))) {
                                dispatch(openSnackbar({ open: true, message: `${person.label} is already selected as a Participant.`, variant: 'alert', severity: 'warning' }));
                                return;
                              }
                            }
                            const otherRoles = ['chairedBy', 'hostBy', 'secondaryHost', 'tertiaryHost'].filter(r => r !== person.field);
                            for (const r of otherRoles) {
                              if (form[r] && String(form[r].id) === String(val.id)) {
                                dispatch(openSnackbar({ open: true, message: `Same employee cannot be assigned to multiple host roles.`, variant: 'alert', severity: 'warning' }));
                                return;
                              }
                            }
                          }
                          setForm(p => {
                            const nextForm = { ...p, [person.field]: val };
                            if (val && (person.field === 'chairedBy' || person.field === 'hostBy')) {
                              nextForm.participants = (p.participants || []).filter(item => String(item.id) !== String(val.id));
                            }
                            return nextForm;
                          });
                          if (errors[person.field]) clearErrors(person.field);
                        }}
                        renderOption={(props, option) => {
                          const { key, ...optionProps } = props;
                          return (
                            <MenuItem key={key} {...optionProps} sx={{ gap: 1.5 }}>
                              <Avatar
                                src={getPhotoUrl(option.employeePhotoUpload)}
                                sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.8rem' }}
                              >
                                {option.employeeName?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.employeeName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {option.oldEmpCode || option.empCode}
                                </Typography>
                              </Box>
                            </MenuItem>
                          );
                        }}
                        renderInput={(params) => (
                          <BOSTextField
                            {...params}
                            placeholder={
                              !form.meetingType
                                ? "Select meeting type first"
                                : person.field === 'hostBy' && (form.departments || []).length === 0
                                  ? "Select department first"
                                  : `Select ${person.label}`
                            }
                            error={!!errors[person.field]}
                            fullWidth
                            sx={errorStyle(!!errors[person.field])}
                          />
                        )}
                      />
                    </Box>

                    {/* Profile Card Body */}
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: '10px',
                        bgcolor: selectedEmp
                          ? (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc')
                          : (isDark ? 'rgba(255,255,255,0.01)' : '#fafafa'),
                        border: selectedEmp ? '1px solid' : '1px dashed',
                        borderColor: selectedEmp
                          ? (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')
                          : (isDark ? 'rgba(255,255,255,0.08)' : '#cbd5e1'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        minHeight: 80
                      }}
                    >
                      <EmployeeAvatarWithPreview
                        photoUpload={selectedEmp?.employeePhotoUpload}
                        name={selectedEmp ? (selectedEmp.employeeName || name) : null}
                        code={selectedEmp ? (selectedEmp.oldEmpCode || selectedEmp.empCode || code) : null}
                        dept={selectedEmp ? empDeptName : null}
                        designation={selectedEmp ? empLevel : null}
                        size={48}
                        variant="circular"
                        isDark={isDark}
                      />

                      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: selectedEmp ? 700 : 500,
                            color: selectedEmp ? 'text.primary' : 'text.disabled',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {name !== '-' ? name : 'Not Selected'}
                        </Typography>

                        {selectedEmp ? (
                          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
                              Dept: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{empDeptName}</Box>
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.72rem' }}>
                              Designation: <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>{empLevel}</Box>
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.72rem' }}>
                            Assign {person.label.toLowerCase()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Stack>
      </BOSFormSection>


    </Stack>
  );

  if (isPage) {
    return (
      <MainCard
        fullWidth
        title={
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
            <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
              <IconCalendarEvent size={22} color={isDark ? '#fff' : '#1e88e5'} />
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>
              {id ? `Edit Schedule - ${form.scheduleNo}` : (amendId ? `Amendment for Schedule - ${form.revSourceScheduleNo}` : 'Create Meeting Schedule')}
            </Typography>
          </Stack>
        }
        secondary={
          <Stack direction="row" alignItems="center" spacing={2}>
            {showConfigToggle && (
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<IconArrowLeft size={16} />}
              onClick={handleBack}
              sx={btnCancel}
            >
              Back
            </Button>
          </Stack>
        }
      >
        {renderFormContent()}

        {/* Page Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {showConfigToggle && (
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
            <Button
              variant="outlined"
              color="error"
              startIcon={<IconArrowLeft size={18} />}
              onClick={handleBack}
              sx={btnCancel}
            >
              Back
            </Button>
            {!isReadOnlyMode && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<IconDeviceFloppy size={18} />}
                  onClick={handleSave}
                  disabled={submitting}
                  sx={btnSave}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </MainCard>
    );
  }

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title={item ? `Edit Schedule - ${form.scheduleNo}` : (amendId ? `Amendment for Schedule - ${form.revSourceScheduleNo}` : 'Meeting Schedule')}
      maxWidth="lg"
      hideFooter={isReadOnlyMode}
      contentSx={{
        p: '16px !important',
        overflowY: 'auto !important'
      }}
      sx={{
        '& .MuiPaper-root': {
          maxWidth: '1000px',
          '& > div[class*="MuiBox-root"]': {
            '&:last-of-type': {
              py: '8px !important',
              px: '20px !important'
            }
          }
        }
      }}
    >
      {renderFormContent()}
    </BOSFormDialog>
  );
}
