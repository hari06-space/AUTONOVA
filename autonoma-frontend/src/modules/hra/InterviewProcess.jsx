import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Typography, Button, Stack, MenuItem, Box, Chip, Tooltip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Popover, CircularProgress, InputAdornment, Collapse, TextField, useTheme } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import axios from 'utils/axios';
import { IconCalendar, IconDeviceFloppy, IconX, IconPlus, IconSearch, IconInfoCircle, IconUpload, IconTrash, IconExternalLink, IconFileText, IconEye, IconEyeOff, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSTableToolbar, BOSExportButton,
  BOSStatusChip, BOSFileUpload, BOSFilePreview, BOSRowActions,
  INTERVIEW_STATUS, isInterviewPending, isInterviewFinished, btnSave
} from 'ui-component/bos';
import { errorStyle } from 'ui-component/bos/BOSStyles';
import { matchDateRange } from 'ui-component/bos/BOSUtils';
import { checkInterviewCriteriaConfigured, validateInterviewCompletionRatio } from './components/EvaluationDetailShared';
import { useLookups } from 'hooks/useLookups';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { setFilterConfig, resetFilters, setFilters, setQuery } from 'store/slices/search';
import { autoUploadFile, getUserImageUrl, getFileViewUrl } from 'utils/upload-helper';
import { BOSPfpAvatar } from 'ui-component/bos';

import { formatDate } from 'utils/BOSTimeUtils';

const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const BUSINESS_HOURS_LIST = ['10', '11', '12', '13', '14', '15', '16', '17'];

const getFirstNameOnly = (fullName) => {
  if (!fullName) return '';
  const tokens = fullName.trim().split(/\s+/);
  if (tokens.length <= 2) {
    return fullName;
  }
  return tokens.slice(0, 2).join(' ');
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─── REACTION FEEDBACK SELECTOR ────────────────────────────────────────────
const REACTIONS = [
  {
    key: 'outstanding',
    val: 1.0,
    label: 'Outstanding',
    // U+1F929 Star-Struck
    animatedEmoji: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.webp',
    colors: {
      ring: '#10b981',
      bg: '#ecfdf5',
      bgDark: 'rgba(16, 185, 129, 0.15)',
      glow: 'rgba(16,185,129,0.25)',
      dot: '#34d399'
    }
  },
  {
    key: 'average',
    val: 0.5,
    label: 'Average',
    // U+1F642 Slightly Smiling Face
    animatedEmoji: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f642/512.webp',
    colors: {
      ring: '#f59e0b',
      bg: '#fffbeb',
      bgDark: 'rgba(245, 158, 11, 0.15)',
      glow: 'rgba(245,158,11,0.25)',
      dot: '#fbbf24'
    }
  },
  {
    key: 'needs_improvement',
    val: 0.0,
    label: 'Needs Improvement',
    // U+1F635 X-Eyes (dizzy face)
    animatedEmoji: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f635/512.webp',
    colors: {
      ring: '#f43f5e',
      bg: '#fff1f2',
      bgDark: 'rgba(244, 63, 94, 0.15)',
      glow: 'rgba(244,63,94,0.25)',
      dot: '#fb7185'
    }
  }
];

// Inject keyframes once globally
const REACTION_STYLE_ID = '__reaction_feedback_keyframes__';
if (typeof document !== 'undefined' && !document.getElementById(REACTION_STYLE_ID)) {
  const styleEl = document.createElement('style');
  styleEl.id = REACTION_STYLE_ID;
  styleEl.textContent = `
    @keyframes reactionPop {
      0%   { transform: scale(0.6) rotate(-8deg); }
      45%  { transform: scale(1.35) rotate(6deg); }
      70%  { transform: scale(0.95) rotate(-2deg); }
      100% { transform: scale(1.1) rotate(0deg); }
    }
    @keyframes particleBurst {
      0%   { transform: rotate(var(--pb-angle)) translate(0,0) scale(1); opacity: 1; }
      100% { transform: rotate(var(--pb-angle)) translate(22px,0) scale(0); opacity: 0; }
    }
  `;
  document.head.appendChild(styleEl);
}

function ReactionButton({ reaction, selected, bursting, onClick }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = reaction.colors;
  return (
    <Tooltip title={reaction.label} arrow placement="top">
      <Box
        onClick={onClick}
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: '14px',
          cursor: 'pointer',
          border: selected ? 'none' : `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
          bgcolor: selected ? (isDark ? c.bgDark : c.bg) : (isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
          outline: selected ? `2px solid ${c.ring}` : 'none',
          outlineOffset: selected ? '1px' : 0,
          boxShadow: selected ? `0 6px 18px ${c.glow}` : 'none',
          transform: selected ? 'scale(1.06)' : 'scale(1)',
          transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            borderColor: selected ? 'transparent' : (isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8'),
            transform: selected ? 'scale(1.06)' : 'translateY(-2px) scale(1.02)',
            boxShadow: selected ? `0 6px 18px ${c.glow}` : (isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)')
          }
        }}
      >
        {/* Particle burst */}
        {bursting && Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: c.dot,
              animation: 'particleBurst 0.6s ease-out forwards',
              '--pb-angle': `${i * 45}deg`
            }}
          />
        ))}

        {/* Emoji */}
        <Box
          sx={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            animation: selected ? 'reactionPop 0.5s cubic-bezier(.34,1.56,.64,1)' : 'none'
          }}
        >
          <img src={reaction.animatedEmoji} alt={reaction.label} width={28} height={28} />
        </Box>
      </Box>
    </Tooltip>
  );
}

function SegmentedFeedbackSelector({ value, onChange, error = false }) {
  const hasValue = value !== undefined && value !== null && value !== '' && !isNaN(parseFloat(value));
  const currentValue = hasValue ? parseFloat(value) : null;
  const [burstKey, setBurstKey] = useState(null);

  const handleSelect = (reaction) => {
    const alreadySelected = currentValue !== null && Math.abs(currentValue - reaction.val) < 0.01;
    if (alreadySelected) {
      onChange('');          // deselect
    } else {
      onChange(reaction.val);
      setBurstKey(reaction.key);
      window.setTimeout(() => setBurstKey(null), 650);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
      justifyContent="center"
      sx={{
        width: '100%',
        p: error ? '6px' : '4px',
        border: error ? '1px dashed #ef4444' : 'none',
        borderRadius: error ? '20px' : 0,
        bgcolor: error ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
        transition: 'all 0.25s ease'
      }}
    >
      {REACTIONS.map((r) => (
        <ReactionButton
          key={r.key}
          reaction={r}
          selected={currentValue !== null && Math.abs(currentValue - r.val) < 0.01}
          bursting={burstKey === r.key}
          onClick={() => handleSelect(r)}
        />
      ))}
    </Stack>
  );
}

function getInterviewStartDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  try {
    let cleanDateStr = String(dateStr).trim();
    if (cleanDateStr.includes(' ')) {
      cleanDateStr = cleanDateStr.split(' ')[0];
    }

    let year, month, day;
    if (cleanDateStr.includes('/')) {
      const parts = cleanDateStr.split('/');
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
    } else if (cleanDateStr.includes('-')) {
      const parts = cleanDateStr.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      return null;
    }

    let cleanTimeStr = String(timeStr).trim().toUpperCase();
    if (cleanTimeStr.includes('.')) {
      cleanTimeStr = cleanTimeStr.split('.')[0];
    }

    let hours = 0, minutes = 0, seconds = 0;
    const isPM = cleanTimeStr.includes('PM');
    const isAM = cleanTimeStr.includes('AM');

    if (isAM || isPM) {
      const timePart = cleanTimeStr.replace(/(AM|PM)/g, '').trim();
      const parts = timePart.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1] || '0', 10);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    } else {
      const parts = cleanTimeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1] || '0', 10);
      seconds = parseInt(parts[2] || '0', 10);
    }

    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

export default function InterviewProcess() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.HRA_INTERVIEW_PROCESS);
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const dashboardFilter = searchParams.get('dashboardFilter');

  // Redux Search Filters
  const globalFilters = useSelector((state) => state.search.filters);
  const globalQuery = useSelector((state) => state.search.query);

  // Data State
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Lookups
  const { departments = [], designations = [], employees = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'EMPLOYEES']);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    id: null,
    screeningLevel: '',
    round: '',
    interviewDate: '',
    interviewPerson: '',
    interviewStatus: 'PENDING',
    interviewResult: 'PENDING',
    status: 'ACTIVE',
    expSalary: '',
    suggestedSalary: '',
    comments: '',
    attachmentRequired: 'Not Required',
    attachmentPath: '',
    candidateName: '',
    candidateCode: '',
    departmentName: '',
    designationName: '',
    candidatePhoto: ''
  });
  const [errors, setErrors] = useState({});
  const [pfpLightboxOpen, setPfpLightboxOpen] = useState(false);

  // Additional Evaluation States
  const [criteriaList, setCriteriaList] = useState([]);
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [uploadingGeneralFile, setUploadingGeneralFile] = useState(false);
  const [uploadingRowFile, setUploadingRowFile] = useState(null);
  const [answerPopoverAnchor, setAnswerPopoverAnchor] = useState(null);
  const [answerPopoverText, setAnswerPopoverText] = useState('');
  const [criteriaExpanded, setCriteriaExpanded] = useState(true);
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Load interviews
  const fetchInterviews = useCallback(async (force = false, detail = null, isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const { data } = await axios.get('/api/hra/applicants/all-interviews');
      setRows(data || []);
    } catch (e) {
      console.error('Failed to load interview list', e);
      if (!isSilent) {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Failed to load scheduled interviews.',
            variant: 'alert',
            severity: 'error'
          })
        );
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [dispatch]);

  // Search Filter Registration
  useEffect(() => {
    const config = [
      {
        id: 'interviewStatus',
        label: 'Interview Status',
        type: 'multiselect',
        options: [
          { value: 'PENDING', label: 'PENDING' },
          { value: 'SELECTED', label: 'SELECTED' },
          { value: 'REJECTED', label: 'REJECTED' },
          { value: 'ON HOLD', label: 'ON HOLD' },
          { value: 'WAITING FOR PROGRESS', label: 'WAITING FOR PROGRESS' },
          { value: 'CANCELLED', label: 'CANCELLED' }
        ],
        defaultValue: ['PENDING', 'WAITING FOR PROGRESS'],
        isStarred: true
      },
      {
        id: 'interviewDate',
        label: 'Interview Date',
        type: 'dateRange',
        isStarred: true
      },
      {
        id: 'searchBy',
        label: 'Search By',
        type: 'select',
        options: [
          { value: 'candidateCode', label: 'Applicant Id' },
          { value: 'candidateName', label: 'Applicant Name' },
          { value: 'department', label: 'Department' },
          { value: 'positionLookFor', label: 'Designation' }
        ],
        defaultValue: 'candidateCode',
        isStarred: true
      }
    ];

    dispatch(setFilterConfig(config));

    // Initialize defaults
    dispatch(
      setFilters({
        interviewStatus: ['PENDING', 'WAITING FOR PROGRESS'],
        interviewDateStart: '',
        interviewDateEnd: '',
        searchBy: 'candidateCode',
        interviewDateConsider: 'No'
      })
    );

    return () => {
      dispatch(setFilterConfig(null));
      dispatch(resetFilters());
      dispatch(setQuery(''));
    };
  }, [dispatch]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  // Real-Time Enterprise Data Synchronization
  useRealtimeRefresh(fetchInterviews);

  // ─── Real-Time 10-Minute Threshold Auto-Refresh Mechanism ─────────────────
  const thresholdTimerRef = useRef(null);

  useEffect(() => {
    if (thresholdTimerRef.current) {
      clearTimeout(thresholdTimerRef.current);
      thresholdTimerRef.current = null;
    }

    if (!rows || rows.length === 0) return;

    const now = Date.now();
    let minMsUntilThreshold = Infinity;

    rows.forEach((row) => {
      // Only check active pending interviews
      const statusStr = (row.interviewStatus?.name || row.interviewStatus || '').toString().toUpperCase().trim();
      const isActive = row.status !== 'Inactive' && row.status !== 'INACTIVE';
      if (statusStr !== 'PENDING' || !isActive) return;

      const startDateTime = getInterviewStartDateTime(row.interviewDate, row.startTime);
      if (!startDateTime) return;

      // Threshold is 10 minutes before interview start time
      const thresholdTime = startDateTime.getTime() - 10 * 60 * 1000;
      const msUntil = thresholdTime - now;

      if (msUntil <= 0 && msUntil > -60000) {
        minMsUntilThreshold = Math.min(minMsUntilThreshold, 1000);
      } else if (msUntil > 0 && msUntil < minMsUntilThreshold) {
        minMsUntilThreshold = msUntil;
      }
    });

    if (minMsUntilThreshold !== Infinity && minMsUntilThreshold > 0) {
      thresholdTimerRef.current = setTimeout(() => {
        fetchInterviews();
      }, minMsUntilThreshold + 1000);
    }

    return () => {
      if (thresholdTimerRef.current) {
        clearTimeout(thresholdTimerRef.current);
        thresholdTimerRef.current = null;
      }
    };
  }, [rows, fetchInterviews]);

  // Open Edit Dialog
  const handleOpenEdit = async (row) => {
    // Guard: cancelled or rejected applicants cannot be evaluated
    const overallStatus = (row.atsOverallStatus || '').toUpperCase().trim();
    if (['CANCELLED', 'REJECTED'].includes(overallStatus)) {
      dispatch(
        openSnackbar({
          open: true,
          message: `This candidate has been ${overallStatus.toLowerCase()} and cannot be evaluated.`,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
      return;
    }

    // Check if interview is cancelled
    const currentStatus = (row.interviewStatus?.name || row.interviewStatus || '').toString().toUpperCase();
    if (currentStatus === 'CANCELLED' || (row.status || '').toUpperCase() === 'CANCELLED') {
      dispatch(
        openSnackbar({
          open: true,
          message: 'This interview round has been cancelled and cannot be evaluated.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        })
      );
      return;
    }

    // Check if interview is already evaluated
    if (isInterviewFinished(currentStatus)) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'This interview round has already been evaluated and completed.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'info'
        })
      );
      return;
    }
    // Check interviewer authorization (Interviewer ID === Logged-in user's Employee ID)
    if (user) {
      const isAdmin = (user.userId || '').toUpperCase() === 'SUPER BOSS' || (user.userId || '').toUpperCase() === 'ADMIN';
      if (!isAdmin) {
        const currentEmpId = Number(user.empId || user.employeeId || user.emp_id || user.id);
        const rowInterviewerId = Number(row.interviewerId);
        const isAssigned = currentEmpId && rowInterviewerId && currentEmpId === rowInterviewerId;
        if (!isAssigned) {
          dispatch(
            openSnackbar({
              open: true,
              message: 'You are not the assigned interviewer for this applicant.',
              variant: 'alert',
              alert: { variant: 'filled' },
              severity: 'error'
            })
          );
          return;
        }
      }
    }

    if (currentStatus !== 'WAITING FOR PROGRESS' && currentStatus !== 'WAITING FOR PROCESS') {
      const isLevel1 = String(row.screeningLevel || '').trim() === '1';
      if (isLevel1) {
        const startDateTime = getInterviewStartDateTime(row.interviewDate, row.startTime);
        let timeMessage = 'You can evaluate this applicant 10 minutes before their assigned time.';
        if (startDateTime) {
          const allowedDateTime = new Date(startDateTime.getTime() - 10 * 60 * 1000);
          const formatTime = (d) => {
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
          };
          const allowedStr = formatTime(allowedDateTime);
          const startStr = formatTime(startDateTime);
          timeMessage = `Available to open at ${allowedStr} — 10 minutes before the scheduled start time of ${startStr}.`;
        }
        dispatch(
          openSnackbar({
            open: true,
            message: timeMessage,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning'
          })
        );
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'This applicant can able to evaluate in the order, please complete the before rounds.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning'
          })
        );
      }
      return;
    }
    setEditData({
      id: row.id,
      screeningLevel: row.screeningLevel || '',
      round: row.round || '',
      interviewDate: row.interviewDate || '',
      interviewPerson: row.interviewPerson || '',
      interviewStatus: row.interviewStatus || 'PENDING',
      interviewResult: row.interviewResult || 'PENDING',
      status: row.status || 'ACTIVE',
      expSalary: row.expSalary || '',
      suggestedSalary: row.suggestedSalary || '',
      comments: row.comments || '',
      attachmentRequired: row.attachmentRequired || 'Not Required',
      attachmentPath: row.attachmentPath || '',
      candidateName: row.candidateName || '',
      candidateCode: row.candidateCode || '',
      applicantDate: row.applicantDate || '',
      appliedDate: row.applicantDate || '',
      departmentName: row.department?.departmentName || '',
      designationName: row.designationName || '',
      levelName: row.levelName || row.level || 'N/A',
      candidatePhoto: row.candidatePhoto || ''
    });
    setErrors({});
    setShowValidationErrors(false);
    setCriteriaList([]);
    setCriteriaExpanded(true);
    setDetailsExpanded(true);
    setDialogOpen(true);

    // Fetch criteria
    setLoadingCriteria(true);
    try {
      const { data } = await axios.get(`/api/hra/applicants/interviews/${row.id}/criteria`);
      let savedFeedback = [];
      if (row.feedbackJson) {
        try {
          savedFeedback = JSON.parse(row.feedbackJson);
        } catch (e) {
          console.error('Failed to parse feedbackJson', e);
        }
      }
      
      const list = data.map((item) => {
        const saved = savedFeedback.find((sf) => sf.criteriaId === item.id);
        return {
          criteriaId: item.id,
          criteriaDetails: item.criteriaDetails,
          answer: item.answer,
          feedback: saved ? saved.feedback : '',
          attachmentPath: saved ? saved.attachmentPath : '',
          attachmentRequired: item.attachmentRequired || 'NO',
          interviewAttachment: item.interviewAttachment || '',
          score: (saved && saved.score !== undefined && saved.score !== null) ? saved.score : null,
          isMasterCriteria: true // mark as master criteria to differentiate from manually added ones
        };
      });

      // Append saved custom feedback items
      savedFeedback.forEach((sf) => {
        const exists = list.some((item) => item.criteriaId === sf.criteriaId);
        if (!exists) {
          list.push({
            criteriaId: sf.criteriaId,
            criteriaDetails: sf.criteriaDetails,
            answer: sf.answer || '',
            feedback: sf.feedback || '',
            attachmentPath: sf.attachmentPath || '',
            attachmentRequired: sf.attachmentRequired || 'NO',
            interviewAttachment: sf.interviewAttachment || '',
            isCustom: true,
            score: (sf.score !== undefined && sf.score !== null) ? sf.score : null
          });
        }
      });
      setCriteriaList(list);
    } catch (e) {
      console.error('Failed to load criteria', e);
    } finally {
      setLoadingCriteria(false);
    }
  };

  const handleAddCustomCriteria = () => {
    setCriteriaList((prev) => [
      ...prev,
      {
        criteriaId: 'custom-' + Date.now(),
        criteriaDetails: '',
        answer: '',
        feedback: '',
        attachmentPath: '',
        isCustom: true,
        score: null
      }
    ]);
  };

    // Save Edit Details
  const handleSave = async () => {
    const criteriaConfigCheck = checkInterviewCriteriaConfigured(criteriaList);
    if (!criteriaConfigCheck.valid) {
      dispatch(
        openSnackbar({
          open: true,
          message: criteriaConfigCheck.message,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      return;
    }

    const errs = {};
    if (!editData.expSalary) {
      errs.expSalary = 'Expected salary is required';
    } else if (Number(editData.expSalary) <= 0 || isNaN(Number(editData.expSalary))) {
      errs.expSalary = 'Expected salary must be greater than 0';
    }
    if (!editData.suggestedSalary) {
      errs.suggestedSalary = 'Suggested salary is required';
    } else if (Number(editData.suggestedSalary) <= 0 || isNaN(Number(editData.suggestedSalary))) {
      errs.suggestedSalary = 'Suggested salary must be greater than 0';
    }
    if (![INTERVIEW_STATUS.SELECTED, INTERVIEW_STATUS.REJECTED, INTERVIEW_STATUS.HOLD].includes((editData.interviewStatus?.name || editData.interviewStatus || '').toString().toUpperCase())) {
      errs.interviewStatus = 'Interview status is required';
    }
    if (!editData.comments || !editData.comments.trim()) {
      errs.comments = 'Summary feedback is required';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please fill the mandatory field',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      // Auto-scroll to first invalid form input field in Section 2
      setTimeout(() => {
        const firstErrKey = Object.keys(errs)[0];
        const inputEl = document.getElementsByName(firstErrKey)[0] || document.querySelector(`[name="${firstErrKey}"]`);
        if (inputEl) {
          inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          inputEl.focus();
        }
      }, 100);
      return;
    }

    // Check if feedback selection is missing for any criterion
    // Since some criteria may be left unasked, we check if they have a score or not.
    // However, if they DO have a score, they must pass Needs Improvement validation.
    let improvementFeedbackMissing = false;
    for (const item of criteriaList) {
      if (item.score !== null && item.score !== undefined && item.score !== '') {
        if (parseFloat(item.score) === 0 && (!item.feedback || !item.feedback.trim())) {
          improvementFeedbackMissing = true;
        }
      }
    }

    if (improvementFeedbackMissing) {
      setShowValidationErrors(true);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Improvement feedback is required for all "Needs Improvement" criteria.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      // Scroll to the first criteria row with missing improvement feedback
      setTimeout(() => {
        const firstErrIdx = criteriaList.findIndex(item => item.score !== null && item.score !== undefined && item.score !== '' && parseFloat(item.score) === 0 && (!item.feedback || !item.feedback.trim()));
        if (firstErrIdx !== -1) {
          const el = document.getElementById(`criteria-row-${firstErrIdx}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    // Check if criteria items require attachment, but ONLY if the interviewer has graded/scored them
    let attachmentMissing = false;
    for (const item of criteriaList) {
      const isGraded = item.score !== null && item.score !== undefined && item.score !== '';
      if (isGraded && item.attachmentRequired === 'YES' && !item.attachmentPath) {
        attachmentMissing = true;
      }
    }

    if (attachmentMissing) {
      setShowValidationErrors(true);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Attachment is mandatory for graded required criteria items.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      // Scroll to the first criteria row with missing attachment
      setTimeout(() => {
        const firstErrIdx = criteriaList.findIndex(item => {
          const isGraded = item.score !== null && item.score !== undefined && item.score !== '';
          return isGraded && item.attachmentRequired === 'YES' && !item.attachmentPath;
        });
        if (firstErrIdx !== -1) {
          const el = document.getElementById(`criteria-row-${firstErrIdx}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    const ratioCheck = validateInterviewCompletionRatio(criteriaList);
    if (!ratioCheck.valid) {
      dispatch(
        openSnackbar({
          open: true,
          message: ratioCheck.message,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      // Scroll to the criteria table section
      setTimeout(() => {
        const el = document.getElementById('evaluation-criteria-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        interviewStatus: editData.interviewStatus,
        interviewResult: editData.interviewResult,
        expSalary: editData.expSalary,
        suggestedSalary: editData.suggestedSalary,
        comments: editData.comments,
        attachmentRequired: editData.attachmentRequired,
        attachmentPath: editData.attachmentPath,
        feedbackJson: JSON.stringify(criteriaList)
      };

      await axios.put(`/api/hra/applicants/interviews/${editData.id}`, payload);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Evaluation saved successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      setDialogOpen(false);
      fetchInterviews();
    } catch (e) {
      console.error('Failed to save evaluation', e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to save candidate evaluation.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/hra/applicants/interviews/${deleteTarget.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Interview deleted successfully!',
          variant: 'alert',
          severity: 'success'
        })
      );
      if (selectedRow?.id === deleteTarget.id) {
        setSelectedRow(null);
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchInterviews();
    } catch (e) {
      console.error('Failed to delete interview', e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete interview.',
          variant: 'alert',
          severity: 'error'
        })
      );
    }
  };

  // Filter rows dynamically using global filters and query
  const resolvedRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row) => {
        if (!row) return false;

        if (dashboardFilter) {
          const rowStatus = String(row.interviewStatus?.name || row.interviewStatus || 'PENDING').toUpperCase();
          const rowOverallStatus = String(row.overallStatus?.name || row.overallStatus || 'PENDING').toUpperCase();
          const pStatus = (rowOverallStatus === 'PENDING' ? 'PENDING' : rowOverallStatus !== 'PENDING' && rowStatus === 'PENDING' ? 'WAITING FOR PROCESS' : rowStatus);
          const iDate = row.interviewDate ? new Date(row.interviewDate) : null;
          const isPast = iDate ? iDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0) : false;
          
          if (dashboardFilter === 'interviewProcessOverdue') {
            if (!(isPast && (pStatus === 'PENDING' || pStatus === 'WAITING FOR PROCESS' || pStatus === 'WAITING FOR PROGRESS'))) return false;
          } else if (dashboardFilter === 'interviewProcessWaiting') {
            if (!(!isPast && (pStatus === 'WAITING FOR PROCESS' || pStatus === 'WAITING FOR PROGRESS'))) return false;
          } else if (dashboardFilter === 'interviewProcessPending') {
            if (!(!isPast && pStatus === 'PENDING')) return false;
          }
        }

        // 1. Date range filter
        if (!matchDateRange(row, globalFilters, 'interviewDate')) return false;

        // 2. Status filter (multiselect — array of selected statuses)
        if (globalFilters && globalFilters.interviewStatus) {
          const getStatusStr = (s) => {
            if (!s) return '';
            if (typeof s === 'object') return String(s.value || s.label || s.name || '').toUpperCase().trim();
            return String(s).toUpperCase().trim();
          };
          const rawSelected = globalFilters.interviewStatus;
          const selectedStatuses = Array.isArray(rawSelected)
            ? rawSelected.map(getStatusStr).filter(Boolean)
            : (rawSelected ? [getStatusStr(rawSelected)] : []);

          if (selectedStatuses.length > 0) {
            const rawSt = typeof row.interviewStatus === 'object' ? (row.interviewStatus?.name || row.interviewStatus?.label || '') : row.interviewStatus;
            const rowStatus = String(rawSt || 'PENDING').toUpperCase().trim();
            const matches = selectedStatuses.some(sel => 
              sel === rowStatus || 
              (sel === 'WAITING FOR PROGRESS' && (rowStatus === 'WAITING FOR PROCESS' || rowStatus === 'WAITING FOR PROGRESS' || rowStatus === 'PENDING')) ||
              (sel === 'PENDING' && (rowStatus === 'PENDING' || rowStatus === 'WAITING FOR PROGRESS' || rowStatus === 'WAITING FOR PROCESS'))
            );
            if (!matches) return false;
          }
        }

        // 3. Search text query filter
        const searchByVal = globalFilters?.searchBy || 'candidateCode';
        const term = globalQuery ? String(globalQuery).trim().toLowerCase() : '';
        if (term) {
          let cellValue = '';
          if (searchByVal === 'department') {
            let deptVal = row.department;
            if (deptVal && typeof deptVal === 'object') {
              cellValue = deptVal.departmentName || '';
            } else {
              const dept = departments.find((d) => d.id.toString() === String(deptVal) || d.departmentName === deptVal);
              cellValue = dept ? dept.departmentName : deptVal || '';
            }
          } else if (searchByVal === 'positionLookFor') {
            let desigVal = row.positionLookFor || row.designationName;
            if (desigVal && typeof desigVal === 'object') {
              cellValue = desigVal.designationName || '';
            } else {
              const desig = designations.find((d) => d.id.toString() === String(desigVal) || d.designationName === desigVal);
              cellValue = desig ? desig.designationName : desigVal || '';
            }
          } else {
            cellValue = row[searchByVal] || row.candidateCode || row.candidateName || '';
          }
          if (!cellValue.toString().toLowerCase().includes(term)) return false;
        }

        return true;
      })
      .map((r, i) => ({
        ...r,
        index: i + 1
      }));
  }, [rows, globalFilters, globalQuery, departments, designations, dashboardFilter]);
  const paginatedRows = useMemo(() => {
    return resolvedRows.slice(page * size, page * size + size);
  }, [resolvedRows, page, size]);
  // Table Columns
  const tableColumns = useMemo(
    () => [
      { id: 'index', label: 'Sl No', minWidth: 60 },
      { id: 'candidateCode', label: 'Applicant Id', minWidth: 120, bold: true, color: 'primary.main' },
      { id: 'candidateName', label: 'Applicant Name', minWidth: 150 },
      {
        id: 'department',
        label: 'Department',
        minWidth: 150,
        render: (row) => {
          let deptVal = row.department;
          if (deptVal && typeof deptVal === 'object') {
            return deptVal.departmentName || '-';
          }
          const dept = departments.find((d) => d.id.toString() === String(deptVal) || d.departmentName === deptVal);
          return dept ? dept.departmentName : deptVal || '-';
        }
      },
      {
        id: 'positionLookFor',
        label: 'Designation',
        minWidth: 150,
        render: (row) => {
          let desigVal = row.positionLookFor || row.designationName;
          if (desigVal && typeof desigVal === 'object') {
            return desigVal.designationName || '-';
          }
          const desig = designations.find((d) => d.id.toString() === String(desigVal) || d.designationName === desigVal);
          return desig ? desig.designationName : desigVal || '-';
        }
      },
      { id: 'round', label: 'Interview Round', minWidth: 120 },
      { id: 'screeningLevel', label: 'Screening Level', minWidth: 120 },
      { id: 'interviewDate', label: 'Interview Date', minWidth: 120 },
      {
        id: 'startTime',
        label: 'Interview Time',
        minWidth: 120,
        render: (row) => row.startTime || '-'
      },
      {
        id: 'interviewStatus',
        label: 'Interview Status',
        minWidth: 130,
        render: (row) => {
          const status = String(row.interviewStatus?.name || row.interviewStatus || INTERVIEW_STATUS.PENDING);
          return <BOSStatusChip status={status} isInterview={true} showIcon width={150} />;
        }
      },
      { id: 'createdBy', label: 'CREATED BY', minWidth: 120 },
      {
        id: 'createdDate',
        label: 'CREATED DATE',
        minWidth: 150,
        render: (row) => (row.createdDate ? new Date(row.createdDate).toLocaleDateString('en-GB') : '-')
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 100,
        render: (row) => {
          const status = (row.interviewStatus?.name || row.interviewStatus || '').toString().toUpperCase();
          const isCompleted = isInterviewFinished(status);
          const actions = [
            perms.write && {
              label: 'Evaluate',
              icon: <IconFileText size={16} />,
              onClick: () => handleOpenEdit(row),
              color: 'primary',
              tooltip: shortcutTooltip('Evaluate Candidate'),
              disabled: isCompleted || status === 'CANCELLED' || (row.status || '').toUpperCase() === 'CANCELLED' || ['CANCELLED', 'REJECTED'].includes((row.atsOverallStatus || '').toUpperCase().trim())
            },
            perms.delete && {
              label: 'Delete',
              icon: <IconTrash size={16} />,
              onClick: () => handleDelete(row),
              color: 'error',
              tooltip: 'Delete Interview'
            }
          ].filter(Boolean);
          return <BOSRowActions actions={actions} maxInline={2} />;
        }
      }
    ],
    [departments, designations, perms.write, perms.delete]
  );

  const exportColumns = useMemo(() => [
    { id: 'candidateCode', header: 'Applicant Id', key: (row) => row.candidateCode || row.empCode || '-' },
    { id: 'candidateName', header: 'Applicant Name', key: (row) => row.candidateName || row.employeeName || row.firstName || '-' },
    {
      id: 'department',
      header: 'Department',
      key: (row) => {
        let deptVal = row.department;
        if (deptVal && typeof deptVal === 'object') return deptVal.departmentName || '-';
        const dept = departments.find((d) => d.id.toString() === String(deptVal) || d.departmentName === deptVal);
        return dept ? dept.departmentName : deptVal || '-';
      }
    },
    {
      id: 'positionLookFor',
      header: 'Designation',
      key: (row) => {
        let desigVal = row.positionLookFor || row.designationName;
        if (desigVal && typeof desigVal === 'object') return desigVal.designationName || '-';
        const desig = designations.find((d) => d.id.toString() === String(desigVal) || d.designationName === desigVal);
        return desig ? desig.designationName : desigVal || '-';
      }
    },
    { id: 'round', header: 'Interview Round', key: (row) => row.round || '-' },
    { id: 'screeningLevel', header: 'Screening Level', key: (row) => row.screeningLevel !== undefined && row.screeningLevel !== null ? String(row.screeningLevel) : '-' },
    { id: 'interviewDate', header: 'Interview Date', key: (row) => formatDate(row.interviewDate) },
    { id: 'startTime', header: 'Interview Time', key: (row) => row.startTime || '-' },
    {
      id: 'interviewStatus',
      header: 'Interview Status',
      key: (row) => {
        const s = String(row.interviewStatus?.name || row.interviewStatus || 'PENDING');
        if (s.toUpperCase() === 'COMPLETED') return 'Completed';
        if (s.toUpperCase() === 'PENDING') return 'Pending';
        if (s.toUpperCase() === 'IN_PROGRESS' || s.toUpperCase() === 'IN PROGRESS') return 'In Progress';
        if (s.toUpperCase() === 'CANCELLED') return 'Cancelled';
        if (s.toUpperCase() === 'REJECTED') return 'Rejected';
        if (s.toUpperCase() === 'PASSED' || s.toUpperCase() === 'PASS') return 'Passed';
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      }
    },
    { id: 'createdBy', header: 'CREATED BY', key: (row) => (typeof row.createdBy === 'object' && row.createdBy ? (row.createdBy.username || row.createdBy.userId || '-') : (row.createdBy || row.created_by || row.createdUser || '-')) },
    { id: 'createdDate', header: 'CREATED DATE', key: (row) => (row.createdDate ? formatDate(row.createdDate) : (row.createdAt ? formatDate(row.createdAt) : '-')) }
  ], [departments, designations]);

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconCalendar size={22} style={{ color: '#2196f3' }} />
          <Typography variant="h3">Interview Process</Typography>
        </Stack>
      }
      secondary={
        <BOSTableToolbar
          onRefresh={fetchInterviews}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Interview_Process"
          hasExportPermission={perms.export}
          columns={tableColumns}
          hasWritePermission={false}
          extraActions={[
            selectedRow && perms.write && {
              label: 'Evaluate',
              shortcutKey: 'evaluate',
              icon: <IconFileText size={18} />,
              onClick: () => handleOpenEdit(selectedRow),
              color: 'primary',
              variant: 'contained'
            }
          ].filter(Boolean)}
        />
      }
    >

      <BOSDataTable
        columns={tableColumns}
        rows={paginatedRows}
        totalCount={resolvedRows.length}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => {
          setSize(s);
          setPage(0);
        }}
        onDoubleClickRow={perms.write ? handleOpenEdit : null}
        onClickRow={(row) => setSelectedRow(row)}
        selectedRowId={selectedRow?.id}
        showActions={false}
      />

      {/* Evaluation Process Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Candidate Interview Evaluation"
        fullWidth={true}
        maxWidth={false}
        onSave={handleSave}
        hideFooter={true}
        sx={{ '& .MuiDialog-paper': { width: '70vw', maxWidth: '70vw' } }}
      >
        {/* ───── Candidate Details Bar ───── */}
        <Box
          sx={{
            bgcolor: isDark ? '#1e293b' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            px: 3,
            py: 2.5
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 3
            }}
          >
            {/* Left: Avatar + Name + Round */}
            <Stack direction="row" spacing={2} alignItems="center">
              <BOSPfpAvatar
                photoPath={editData.candidatePhoto}
                name={editData.candidateName ? getFirstNameOnly(editData.candidateName) : 'Candidate'}
                size={48}
                previewSize={150}
                onClick={() => editData.candidatePhoto && setPfpLightboxOpen(true)}
              />

              {/* ── Profile Picture Lightbox (Portal) ── */}
              {pfpLightboxOpen && editData.candidatePhoto && createPortal(
                <Box
                  onClick={() => setPfpLightboxOpen(false)}
                  sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    bgcolor: 'rgba(0,0,0,0.75)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backdropFilter: 'blur(6px)'
                  }}
                >
                  <Box
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      position: 'relative',
                      maxWidth: '70vw',
                      maxHeight: '70vh',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                      cursor: 'default'
                    }}
                  >
                    <img
                      src={editData.candidatePhoto.includes('/') ? getFileViewUrl(editData.candidatePhoto) : getUserImageUrl(editData.candidatePhoto)}
                      alt={editData.candidateName ? getFirstNameOnly(editData.candidateName) : ''}
                      style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '70vh',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  </Box>
                </Box>,
                document.body
              )}
              <Stack spacing={0.3}>
                <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                  Candidate
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.2 }}>
                  {editData.candidateName ? getFirstNameOnly(editData.candidateName) : 'N/A'}
                </Typography>
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.3 }}>
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Round
                  </Typography>
                  <Chip
                    label={editData.round || 'N/A'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      bgcolor: '#eef2ff',
                      color: '#4f46e5',
                      borderRadius: '6px',
                      fontSize: '11px',
                      height: 20,
                      px: 0.5
                    }}
                  />
                </Stack>
              </Stack>
            </Stack>

            {/* Center: Details */}
            <Stack direction="row" spacing={5} alignItems="flex-start">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    # ID
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                  {editData.candidateCode || 'N/A'}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Department
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                  {editData.departmentName || 'N/A'}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Designation
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                  {editData.designationName || 'N/A'}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography sx={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>
                    Level
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', mt: 0.3 }}>
                  {editData.levelName || editData.level || 'N/A'}
                </Typography>
              </Stack>
            </Stack>

            {/* Right: Status Badge */}
            <Chip
              icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 2s infinite' }} />}
              label="In Progress"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: '#f0fdf4',
                color: '#15803d',
                borderRadius: '20px',
                px: 1.5,
                py: 1.5,
                fontSize: '12px'
              }}
            />
          </Box>
        </Box>

        {/* ───── Main Content Area ───── */}
        <Box sx={{ p: 2.5, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
          <Stack spacing={2}>
            {!loadingCriteria && criteriaList.length === 0 && (
              <Box sx={{
                p: 2,
                borderRadius: '8px',
                bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                color: isDark ? '#fca5a5' : '#b91c1c'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  There are no interview criteria configured for this candidate's department and designation level. Please configure Interview Criteria Master before proceeding.
                </Typography>
              </Box>
            )}

            {/* ═══ Section 1: Evaluation Criteria & Feedback ═══ */}
            {(loadingCriteria || criteriaList.length > 0) && (
            <Box sx={{
              borderRadius: '16px',
              bgcolor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              overflow: 'hidden'
            }}>
              {/* Section Header */}
              <Box
                id="evaluation-criteria-section"
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.5,
                  bgcolor: isDark ? '#182235' : '#f8fafc',
                  borderBottom: criteriaExpanded ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setCriteriaExpanded(!criteriaExpanded)}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    1
                  </Box>
                  <Stack spacing={0}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 1.3 }}>
                      Evaluation Criteria & Feedback
                      <Typography component="span" sx={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400, ml: 1 }}>
                        ({criteriaList.length} question{criteriaList.length !== 1 ? 's' : ''} · score each response and leave feedback)
                      </Typography>
                    </Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center" onClick={(e) => e.stopPropagation()}>
                  {((editData.round || '').toUpperCase().trim().includes('MANAGEMENT') ||
                    (editData.round || '').toUpperCase().trim().includes('SPECIAL')) && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<IconPlus size={14} />}
                      onClick={handleAddCustomCriteria}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        bgcolor: '#0284c7',
                        fontSize: '12px',
                        px: 1.5,
                        py: 0.8,
                        '&:hover': { bgcolor: '#0369a1' }
                      }}
                    >
                      Add Question
                    </Button>
                  )}
                  <IconButton size="small" onClick={() => setCriteriaExpanded(!criteriaExpanded)}>
                    {criteriaExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                  </IconButton>
                </Stack>
              </Box>

              {/* Section Body */}
              {criteriaExpanded && (
                <Box sx={{ overflowX: 'auto' }}>
                  {loadingCriteria ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress />
                      <Typography sx={{ ml: 2, alignSelf: 'center' }}>Loading Interview Criteria...</Typography>
                    </Box>
                  ) : criteriaList.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', m: 2, border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      <Typography color="textSecondary">No active criteria found matching this applicant's Department and Designation Level.</Typography>
                    </Box>
                  ) : (
                    <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#0284c7' }}>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '5%', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '28%', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>Criteria</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '12%', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>Att. Required</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '12%', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>Answers</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '22%', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>Feedback</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#fff', width: '21%', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2 }}>Attachment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {criteriaList.map((row, index) => (
                          <TableRow key={row.criteriaId} id={`criteria-row-${index}`} sx={{ '&:last-child td': { borderBottom: 0 }, '& td': { verticalAlign: 'middle', py: 2, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9'}` } }}>
                            {/* # / Delete */}
                            <TableCell sx={{ px: 2 }}>
                              {row.isCustom ? (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setCriteriaList((prev) => prev.filter((_, i) => i !== index));
                                  }}
                                >
                                  <IconTrash size={16} />
                                </IconButton>
                              ) : (
                                <Typography sx={{ color: '#94a3b8', fontSize: '13px' }}>{index + 1}</Typography>
                              )}
                            </TableCell>

                            {/* Criteria */}
                            <TableCell sx={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              px: 2
                            }}>
                              {row.isCustom ? (
                                <BOSTextField
                                  size="small"
                                  fullWidth
                                  placeholder="Enter custom question/criteria..."
                                  value={row.criteriaDetails}
                                  onChange={(e) => {
                                    const updated = [...criteriaList];
                                    updated[index].criteriaDetails = e.target.value;
                                    setCriteriaList(updated);
                                  }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>
                                  {row.criteriaDetails}
                                </Typography>
                              )}
                            </TableCell>

                            {/* Attachment Required Badge */}
                            <TableCell align="center" sx={{ px: 2 }}>
                              <Chip
                                label={row.attachmentRequired === 'YES' ? 'Yes' : 'No'}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  height: 22,
                                  borderRadius: '11px',
                                  ...(row.attachmentRequired === 'YES'
                                    ? { bgcolor: '#fffbeb', color: '#d97706' }
                                    : { bgcolor: '#f1f5f9', color: '#94a3b8' }
                                  )
                                }}
                              />
                            </TableCell>

                            {/* Answers */}
                            <TableCell align="center" sx={{ px: 2 }}>
                              {row.isCustom ? (
                                <BOSTextField
                                  size="small"
                                  fullWidth
                                  placeholder="Preferred Answer"
                                  value={row.answer}
                                  onChange={(e) => {
                                    const updated = [...criteriaList];
                                    updated[index].answer = e.target.value;
                                    setCriteriaList(updated);
                                  }}
                                />
                              ) : (
                                <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                  <Tooltip 
                                    title={
                                      <Box sx={{ p: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5, color: isDark ? '#f8fafc' : '#334155' }}>
                                          Expected Answer / Guidelines
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: isDark ? '#cbd5e1' : '#475569', whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                                          {row.answer || 'No guideline answer specified.'}
                                        </Typography>
                                      </Box>
                                    }
                                    arrow
                                    placement="top"
                                    componentsProps={{
                                      tooltip: {
                                        sx: {
                                          bgcolor: isDark ? 'dark.900' : 'background.paper',
                                          color: isDark ? '#f8fafc' : '#334155',
                                          boxShadow: isDark ? '0px 8px 30px rgba(0,0,0,0.5)' : '0px 8px 30px rgba(0,0,0,0.12)',
                                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                                          maxWidth: 320,
                                          borderRadius: '8px'
                                        }
                                      },
                                      arrow: {
                                        sx: {
                                          color: isDark ? 'dark.900' : 'background.paper',
                                          '&::before': {
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<IconEye size={14} />}
                                      sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: isDark ? '#94a3b8' : '#64748b',
                                        borderColor: isDark ? '#334155' : '#e2e8f0',
                                        px: 1.5,
                                        py: 0.5,
                                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: '#cbd5e1' }
                                      }}
                                    >
                                      View
                                    </Button>
                                  </Tooltip>
                                  {row.interviewAttachment && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setPreviewFile({
                                          fileName: row.interviewAttachment.split('/').pop(),
                                          serverFileName: row.interviewAttachment
                                        });
                                        setPreviewOpen(true);
                                      }}
                                      sx={{
                                        color: '#10b981',
                                        p: 0.5,
                                        '&:hover': { bgcolor: '#ecfdf5' }
                                      }}
                                      title="View Reference Document / Template"
                                    >
                                      <IconFileText size={18} />
                                    </IconButton>
                                  )}
                                </Stack>
                              )}
                            </TableCell>

                            {/* Feedback (Emoji Reactions) */}
                            <TableCell align="center" sx={{ px: 2, verticalAlign: 'top' }}>
                              <SegmentedFeedbackSelector
                                value={row.score}
                                error={showValidationErrors && (row.score === null || row.score === undefined || row.score === '')}
                                onChange={(val) => {
                                  const updated = [...criteriaList];
                                  updated[index].score = val;
                                  // Clear feedback text when switching away from Needs Improvement
                                  if (parseFloat(val) !== 0) {
                                    updated[index].feedback = '';
                                  }
                                  setCriteriaList(updated);
                                }}
                              />
                              <Collapse in={parseFloat(row.score) === 0} timeout={300} unmountOnExit>
                                <Box sx={{ mt: 1.5 }}>
                                  <TextField
                                    size="small"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={4}
                                    label="What needs improvement?"
                                    variant="outlined"
                                    value={row.feedback || ''}
                                    onChange={(e) => {
                                      const updated = [...criteriaList];
                                      updated[index].feedback = e.target.value;
                                      setCriteriaList(updated);
                                    }}
                                    error={showValidationErrors && parseFloat(row.score) === 0 && (!row.feedback || !row.feedback.trim())}
                                    helperText={showValidationErrors && parseFloat(row.score) === 0 && (!row.feedback || !row.feedback.trim()) ? 'Improvement feedback is required' : ''}
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: '10px',
                                        fontSize: '13px',
                                        bgcolor: isDark ? 'rgba(244, 63, 94, 0.06)' : 'rgba(244, 63, 94, 0.03)',
                                        '& .MuiOutlinedInput-notchedOutline': {
                                          borderColor: isDark ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.2)'
                                        },
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                          borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.35)'
                                        },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                          borderColor: '#f43f5e'
                                        }
                                      },
                                      '& .MuiInputLabel-root': {
                                        fontSize: '13px',
                                        color: isDark ? '#fb7185' : '#e11d48',
                                        '&.Mui-focused': { color: '#f43f5e' }
                                      }
                                    }}
                                  />
                                </Box>
                              </Collapse>
                            </TableCell>

                            {/* Attachment Upload */}
                            <TableCell sx={{ px: 2 }}>
                              <BOSFileUpload
                                files={row.attachmentPath ? [{ fileName: row.attachmentPath.split('/').pop(), serverFileName: row.attachmentPath }] : []}
                                onChange={(filesList) => {
                                  const updated = [...criteriaList];
                                  updated[index].attachmentPath = filesList.length > 0 ? filesList[0].serverFileName : '';
                                  setCriteriaList(updated);
                                }}
                                multiple={false}
                                compact={true}
                                error={row.attachmentRequired === 'YES' && (row.score !== null && row.score !== undefined && row.score !== '') && !row.attachmentPath && showValidationErrors}
                                colorScheme={row.attachmentRequired === 'YES' ? 'orange' : 'green'}
                                label="Upload File"
                                helperText="Drag & Drop or Click (Max 25MB)"
                                module="MASTER_HR_ATS_APPLICATION_TRACKING_SYSTEM"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Box>
              )}
            </Box>
            )}

            {/* ═══ Section 2: Evaluation Details ═══ */}
            <Box sx={{
              borderRadius: '16px',
              bgcolor: isDark ? '#1e293b' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              overflow: 'hidden'
            }}>
              {/* Section Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.5,
                  bgcolor: isDark ? '#182235' : '#f8fafc',
                  borderBottom: detailsExpanded ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setDetailsExpanded(!detailsExpanded)}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#0284c7',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem'
                  }}>
                    2
                  </Box>
                  <Stack spacing={0}>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b' }}>
                      Evaluation Details
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#94a3b8' }}>
                      Salary expectations, interview status & summary
                    </Typography>
                  </Stack>
                </Stack>
                <IconButton size="small">
                  {detailsExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </IconButton>
              </Box>

              {/* Section Body */}
              {detailsExpanded && (
                <Box sx={{ p: 2.5, width: '100%' }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr',
                        md: '1fr 1fr 1fr 2fr'
                      },
                      gap: 2,
                      width: '100%',
                      alignItems: 'start'
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <BOSTextField
                        size="small"
                        required
                        type="number"
                        name="expSalary"
                        label="Expected Salary (Net)"
                        placeholder="e.g. 50000"
                        value={editData.expSalary}
                        onChange={(e) => setEditData((prev) => ({ ...prev, expSalary: e.target.value }))}
                        error={!!errors.expSalary}
                        helperText={errors.expSalary}
                        sx={errorStyle(!!errors.expSalary)}
                        disabled={criteriaList.length === 0}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          inputProps: { min: 0 }
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <BOSTextField
                        size="small"
                        required
                        type="number"
                        name="suggestedSalary"
                        label="Suggested Salary (Net)"
                        placeholder="e.g. 45000"
                        value={editData.suggestedSalary}
                        onChange={(e) => setEditData((prev) => ({ ...prev, suggestedSalary: e.target.value }))}
                        error={!!errors.suggestedSalary}
                        helperText={errors.suggestedSalary}
                        sx={errorStyle(!!errors.suggestedSalary)}
                        disabled={criteriaList.length === 0}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          inputProps: { min: 0 }
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <BOSTextField
                        select
                        required
                        size="small"
                        name="interviewStatus"
                        label="Interview Status"
                        value={['HOLD', 'REJECTED', 'SELECTED'].includes(editData.interviewStatus) ? editData.interviewStatus : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditData((prev) => ({
                            ...prev,
                            interviewStatus: val,
                            interviewResult: val === INTERVIEW_STATUS.SELECTED ? 'PASS' : (val === INTERVIEW_STATUS.REJECTED ? 'FAIL' : val)
                          }));
                        }}
                        error={!!errors.interviewStatus}
                        helperText={errors.interviewStatus}
                        sx={errorStyle(!!errors.interviewStatus)}
                        disabled={criteriaList.length === 0}
                        InputProps={{
                          endAdornment: ['HOLD', 'REJECTED', 'SELECTED'].includes(editData.interviewStatus) ? (
                            <InputAdornment position="end" sx={{ position: 'absolute', right: 28 }}>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditData((prev) => ({
                                    ...prev,
                                    interviewStatus: 'WAITING FOR PROCESS',
                                    interviewResult: 'PENDING'
                                  }));
                                }}
                                sx={{ color: 'text.secondary', p: 0.25 }}
                              >
                                <IconX size={16} />
                              </IconButton>
                            </InputAdornment>
                          ) : null
                        }}
                      >
                        <MenuItem value="HOLD">HOLD</MenuItem>
                        <MenuItem value="REJECTED">REJECTED</MenuItem>
                        <MenuItem value="SELECTED">SELECTED</MenuItem>
                      </BOSTextField>
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <BOSTextField
                        required
                        fullWidth
                        size="small"
                        name="comments"
                        label="Feedback"
                        placeholder="Provide summary comments..."
                        value={editData.comments}
                        onChange={(e) => setEditData((prev) => ({ ...prev, comments: e.target.value }))}
                        error={!!errors.comments}
                        helperText={errors.comments}
                        sx={errorStyle(!!errors.comments)}
                        disabled={loadingCriteria || criteriaList.length === 0}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {/* ═══ Footer: Save Button ═══ */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 0.5 }}>
              <Tooltip title={shortcutTooltip('Save')}>
                <span>
                  <Button
                    data-shortcut="save"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
                    onClick={handleSave}
                    disabled={saving || loadingCriteria || criteriaList.length === 0}
                    sx={{ ...btnSave, px: 3, py: 1.2, height: 40 }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </span>
              </Tooltip>
            </Box>

          </Stack>
        </Box>
      </BOSFormDialog>



      <BOSFilePreview
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewFile(null);
        }}
        file={previewFile}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Interview Schedule"
        message="Are you sure you want to completely remove this interview schedule?"
        itemName={deleteTarget ? `${deleteTarget.round} Round for ${deleteTarget.candidateName}` : ''}
      />
    </MainCard>
  );
}