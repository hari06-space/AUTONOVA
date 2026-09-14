import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'utils/axios';
import { useTheme } from '@mui/material/styles';
import useAuth from 'hooks/useAuth';

// MUI & Icons
import { Box, Typography, Stack, Tooltip, IconButton, MenuItem, Button, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Radio, FormControlLabel, Switch, Rating } from '@mui/material';
import {
  IconRefresh, IconPlayerPlay, IconCheck, IconClipboardCheck, IconInfoCircle, IconCloudUpload, IconTrash, IconX, IconEye,
  IconStar, IconStarFilled, IconPaperclip
} from '@tabler/icons-react';
import useBOSFilters from 'hooks/useBOSFilters';
import { useState as useReactState } from 'react';

const toLocalDateStr = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Custom Star Rating component using Tabler Icons
const CustomRating = ({ value, onChange, disabled, onHoverChange }) => {
  const [hoverVal, setHoverVal] = useReactState(null);
  const displayVal = hoverVal !== null ? hoverVal : value;

  return (
    <Stack direction="row" spacing={0.5} justifyContent="center" onMouseLeave={() => {
      if (!disabled) {
        setHoverVal(null);
        if (onHoverChange) onHoverChange(-1);
      }
    }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayVal;
        return (
          <IconButton
            key={star}
            size="small"
            disabled={disabled}
            onClick={() => onChange && onChange(star)}
            onMouseEnter={() => {
              if (!disabled) {
                setHoverVal(star);
                if (onHoverChange) onHoverChange(star);
              }
            }}
            sx={{
              p: 0.25,
              color: isFilled ? '#FFB300' : 'text.disabled',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'transform 0.1s ease-in-out',
              '&:hover': {
                transform: disabled ? 'none' : 'scale(1.2)',
                bgcolor: 'transparent'
              },
              '&.Mui-disabled': {
                color: isFilled ? '#FFB300' : 'action.disabled'
              }
            }}
          >
            {isFilled ? <IconStarFilled size={20} /> : <IconStar size={20} />}
          </IconButton>
        );
      })}
    </Stack>
  );
};

// BOS Components
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSFormDialog, BOSFormSection, BOSFileUpload, btnCancel, btnSave, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import BOSMovableDialog from 'ui-component/bos/BOSMovableDialog';
import BOSFilePreview from 'ui-component/bos/BOSFilePreview';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { Navigate } from 'react-router-dom';

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

const getAssignmentTimeStatus = (a) => {
  if (a.currentStatus === 'COMPLETED') {
    return 'COMPLETED';
  }
  if (!a.inductionDate) return 'UPCOMING';

  const scheduledDate = new Date(a.inductionDate);
  scheduledDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (scheduledDate < today) {
    return 'OVERDUE';
  } else {
    return 'UPCOMING';
  }
};

// ==============================|| INDUCTION TRAINING (TRAINER PAGE) ||============================== //

const columns = [
  { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
  { id: 'empCode', label: 'Emp Code', bold: true, minWidth: 100 },
  { id: 'empName', label: 'Employee Name', minWidth: 180 },
  { id: 'inductionDate', label: 'Induction Date', minWidth: 140 },
  { id: 'inductionRound', label: 'Induction Round', minWidth: 140 },
  {
    id: 'averageRating',
    label: 'Rating',
    minWidth: 100,
    align: 'center',
    render: (row) => (
      <Box sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: '3px solid #FFC107',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        color: 'text.primary',
        bgcolor: '#FFFDE7',
        mx: 'auto'
      }}>
        {row.averageRating ? Math.round(row.averageRating) : '0'}
      </Box>
    )
  },
  {
    id: 'inductionStatus',
    label: 'Status',
    minWidth: 130,
    align: 'center',
    render: (row) => (
      <BOSStatusChip
        status={row.inductionStatus}
        showIcon
        width={130}
      />
    )
  }
];

export default function InductionTraining() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [trainingDetails, setTrainingDetails] = useState([]);
  const [initialDetails, setInitialDetails] = useState([]);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [selectedCriteriaDetail, setSelectedCriteriaDetail] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [commentErrors, setCommentErrors] = useState({}); // detailId -> true if comment missing
  const [previewFile, setPreviewFile] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [hoverMap, setHoverMap] = useState({});

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};
  const perms = usePagePermissions(PAGE_CODES.ATS_INDUCTION_TRAINING);
  const bosFilters = useBOSFilters(perms);

  const completedCount = useMemo(() => trainingDetails.filter(d => d.trainerStatus === 'COMPLETED').length, [trainingDetails]);
  const totalCount = useMemo(() => trainingDetails.length, [trainingDetails]);

  useEffect(() => {
    setPage(0);
  }, [globalFilters.type]);

  // Dispatch starred filter configuration matching Status and Training Date
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const config = [];
    if (perms.additional1) {
      config.push({ 
        id: 'type', 
        label: 'Scope', 
        type: 'select', 
        options: bosFilters.getFilterOptions(), 
        defaultValue: 'Mine', 
        isStarred: true 
      });
    }
    config.push(
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'PENDING', label: 'PENDING' },
          { value: 'COMPLETED', label: 'COMPLETED' }
        ],
        defaultValue: 'PENDING',
        isStarred: true
      },
      {
        id: 'trainingDate',
        label: 'Training Date',
        type: 'date',
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    );
    dispatch(setFilterConfig(config));
    const currentPath = window.location.pathname;
    return () => {
      if (window.location.pathname !== currentPath) {
        dispatch(setFilterConfig(null));
      }
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  const fetchRows = useCallback(async () => {
    if (!perms.enabled) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get('/api/hr/induction-training');
      
      // Group by codeInMaster (resolved old employee code) to avoid duplicate rows for the same employee
      const grouped = {};
      (data || []).forEach(item => {
        const code = item.codeInMaster || item.empCode;
        if (!grouped[code]) {
          grouped[code] = {
            id: code,
            empCode: code,
            empName: item.empName,
            department: item.department,
            designation: item.designation,
            assignments: []
          };
        }
        // Avoid duplicate assignment entries
        if (!grouped[code].assignments.some(a => a.id === item.id)) {
          grouped[code].assignments.push(item);
        }
      });
      
      setRows(Object.values(grouped));
    } catch (error) {
      console.error('Failed to fetch training assignments:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, perms.enabled]);

  useEffect(() => {
    if (!perms.loading) {
      fetchRows();
    }
  }, [fetchRows, perms.loading]);

  // Open training dialog
  const handleStartTraining = useCallback(async (row) => {
    console.log('[InductionTraining] handleStartTraining called with row:', JSON.stringify(row));
    setSelectedAssignment(row);
    setLoading(true);
    try {
      const activeTrainingDate = globalFilters.trainingDate;
      const filteredAssignments = row.assignments.filter(a => {
        if (!activeTrainingDate) return true;
        if (!a.inductionDate) return false;
        const aDateStr = toLocalDateStr(a.inductionDate);
        return aDateStr === activeTrainingDate;
      });

      if (filteredAssignments.length === 0) {
        dispatch(openSnackbar({ open: true, message: 'No assignments found matching the selected training date', variant: 'alert', severity: 'warning' }));
        setLoading(false);
        return;
      }

      // 1. Fetch details for all assignments first to check if they are already initialized
      const checkDetailsPromises = filteredAssignments.map(async (a) => {
        try {
          const res = await axios.get(`/api/hr/induction-training/${a.id}/details`);
          return { assignmentId: a.id, details: res.data || [] };
        } catch (e) {
          return { assignmentId: a.id, details: [] };
        }
      });
      const checkDetailsResults = await Promise.all(checkDetailsPromises);
      const detailsMap = checkDetailsResults.reduce((acc, curr) => {
        acc[curr.assignmentId] = curr.details;
        return acc;
      }, {});

      // 2. Start training for any PENDING, WAITING_FOR_PROCESS or RESCHEDULE assignments that this trainer is authorized for
      // but ONLY if they don't have any training details loaded yet.
      const startPromises = filteredAssignments
        .filter(a => a.currentStatus === 'WAITING_FOR_PROCESS' || a.currentStatus === 'RESCHEDULE' || a.currentStatus === 'PENDING')
        .filter(a => user?.userLevel === 5 || a.trainerEmpCode === user?.empCode)
        .filter(a => !detailsMap[a.id] || detailsMap[a.id].length === 0)
        .map(async (a) => {
          try {
            await axios.post(`/api/hr/induction-training/${a.id}/start`);
            // Load details again for this initialized assignment
            const res = await axios.get(`/api/hr/induction-training/${a.id}/details`);
            detailsMap[a.id] = res.data || [];
          } catch (err) {
            const errMsg = err.response?.data?.message || err.response?.data || err.message || '';
            const errStr = typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg);
            if (errStr.includes('TRAINING STARTED') || errStr.includes('Training can only be started')) {
              console.warn(`Training already started for assignment ${a.id}:`, errStr);
              return; // Ignore and proceed
            }
            throw err;
          }
        });
      
      if (startPromises.length > 0) {
        await Promise.all(startPromises);
        dispatch(openSnackbar({ 
          open: true, 
          message: 'Training sessions initialized!', 
          variant: 'alert', 
          alert: { variant: 'filled' }, 
          severity: 'success' 
        }));
      }

      // Flatten all training detail records cleanly without duplicates
      const allDetails = filteredAssignments.flatMap(a => detailsMap[a.id] || []);

      // Synchronize/merge details sharing the same inductionMasterId (source of truth synchronization on load)
      const masterIdToMerged = {};
      allDetails.forEach(d => {
        if (!d.inductionMasterId) return;
        const mid = d.inductionMasterId;
        if (!masterIdToMerged[mid]) {
          masterIdToMerged[mid] = {
            trainerStatus: 'PENDING',
            skillRating: null,
            trainerComments: '',
            attachmentPath: ''
          };
        }
        const current = masterIdToMerged[mid];
        if (d.trainerStatus === 'COMPLETED') {
          current.trainerStatus = 'COMPLETED';
        }
        if (d.skillRating && (!current.skillRating || d.skillRating > current.skillRating)) {
          current.skillRating = d.skillRating;
        }
        if (d.trainerComments && d.trainerComments.length > current.trainerComments.length) {
          current.trainerComments = d.trainerComments;
        }
        if (d.attachmentPath && d.attachmentPath.length > current.attachmentPath.length) {
          current.attachmentPath = d.attachmentPath;
        }
      });

      const synchronizedDetails = allDetails.map(d => {
        if (!d.inductionMasterId) return d;
        const merged = masterIdToMerged[d.inductionMasterId];
        return {
          ...d,
          trainerStatus: d.trainerStatus === 'COMPLETED' ? 'COMPLETED' : merged.trainerStatus,
          skillRating: d.skillRating || merged.skillRating,
          trainerComments: d.trainerComments || merged.trainerComments,
          attachmentPath: d.attachmentPath || merged.attachmentPath
        };
      });

      setTrainingDetails(synchronizedDetails);
      setInitialDetails(JSON.parse(JSON.stringify(synchronizedDetails)));
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to start training/load details:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load training details', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, user, globalFilters]);

  // Update a detail item locally, updating all entries that share the same criteria
  const updateDetail = (detailId, field, value) => {
    const targetDetail = trainingDetails.find(d => d.id === detailId);
    if (!targetDetail) return;

    setTrainingDetails(prev =>
      prev.map(d => {
        if (d.id === detailId || (d.inductionMasterId && d.inductionMasterId === targetDetail.inductionMasterId)) {
          return { ...d, [field]: value };
        }
        return d;
      })
    );
  };

  const handleOpenAttachmentDialog = (detail) => {
    setActiveDetailId(detail.id);
    const files = detail.attachmentPath
      ? detail.attachmentPath.split(',').filter(Boolean).map(path => ({
          id: path,
          serverFileName: path,
          fileName: path.split('/').pop(),
          isServer: true
        }))
      : [];
    setAttachmentFiles(files);
    setAttachmentDialogOpen(true);
  };

  const handleSaveAttachments = () => {
    const pathStr = attachmentFiles
      .map(f => f.serverFileName || f)
      .filter(Boolean)
      .join(',');
    updateDetail(activeDetailId, 'attachmentPath', pathStr);
    setAttachmentDialogOpen(false);
  };

  const attachmentDialogActions = (
    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ width: '100%' }}>
      <Button variant="contained" sx={btnCancel} onClick={() => setAttachmentDialogOpen(false)}>
        Close
      </Button>
      <Button variant="contained" sx={btnSave} onClick={handleSaveAttachments}>
        Save
      </Button>
    </Stack>
  );

  // Validate that every authorized detail row has a comment.
  // Returns true if valid, false if any are missing.
  const validateComments = (authorized) => {
    const errors = {};
    authorized.forEach(d => {
      if (!d.trainerComments || !d.trainerComments.trim()) {
        errors[d.id] = true;
      }
    });
    setCommentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save progress
  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      const authorizedDetails = trainingDetails.filter(d => {
        const assignment = selectedAssignment?.assignments?.find(a => String(a.id) === String(d.assignmentId));
        return user?.userLevel === 5 || (assignment && assignment.trainerEmpCode === user?.empCode);
      });

      // Comments are mandatory for every row
      if (!validateComments(authorizedDetails)) {
        dispatch(openSnackbar({
          open: true,
          message: 'Comments are required for all criteria rows!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        setSaving(false);
        return;
      }

      // Find modified details by comparing trainingDetails with initialDetails
      const modifiedDetails = trainingDetails.filter(d => {
        const initial = initialDetails.find(i => i.id === d.id);
        if (!initial) return true; // new item
        return (
          initial.trainerStatus !== d.trainerStatus ||
          initial.skillRating !== d.skillRating ||
          initial.trainerComments !== d.trainerComments ||
          initial.attachmentPath !== d.attachmentPath
        );
      });

      if (modifiedDetails.length === 0) {
        dispatch(openSnackbar({ open: true, message: 'No changes to save.', variant: 'alert', alert: { variant: 'filled' }, severity: 'info' }));
        return;
      }

      // Group modified details by assignmentId for proper batch updates
      const grouped = {};
      modifiedDetails.forEach(d => {
        if (!grouped[d.assignmentId]) {
          grouped[d.assignmentId] = [];
        }
        grouped[d.assignmentId].push(d);
      });

      // Save progress for each assignment group
      const savePromises = Object.keys(grouped).map(assignmentId => 
        axios.put(`/api/hr/induction-training/${assignmentId}/details`, grouped[assignmentId])
      );
      await Promise.all(savePromises);

      // Re-fetch all details from the backend to rehydrate the UI state and prevent resets
      const detailsPromises = selectedAssignment.assignments.map(a => axios.get(`/api/hr/induction-training/${a.id}/details`));
      const detailsResponses = await Promise.all(detailsPromises);
      const allDetails = detailsResponses.flatMap(res => res.data || []);

      // Synchronize/merge details sharing the same inductionMasterId
      const masterIdToMerged = {};
      allDetails.forEach(d => {
        if (!d.inductionMasterId) return;
        const mid = d.inductionMasterId;
        if (!masterIdToMerged[mid]) {
          masterIdToMerged[mid] = {
            trainerStatus: 'PENDING',
            skillRating: null,
            trainerComments: '',
            attachmentPath: ''
          };
        }
        const current = masterIdToMerged[mid];
        if (d.trainerStatus === 'COMPLETED') {
          current.trainerStatus = 'COMPLETED';
        }
        if (d.skillRating && (!current.skillRating || d.skillRating > current.skillRating)) {
          current.skillRating = d.skillRating;
        }
        if (d.trainerComments && d.trainerComments.length > current.trainerComments.length) {
          current.trainerComments = d.trainerComments;
        }
        if (d.attachmentPath && d.attachmentPath.length > current.attachmentPath.length) {
          current.attachmentPath = d.attachmentPath;
        }
      });

      const synchronizedDetails = allDetails.map(d => {
        if (!d.inductionMasterId) return d;
        const merged = masterIdToMerged[d.inductionMasterId];
        return {
          ...d,
          trainerStatus: d.trainerStatus === 'COMPLETED' ? 'COMPLETED' : merged.trainerStatus,
          skillRating: d.skillRating || merged.skillRating,
          trainerComments: d.trainerComments || merged.trainerComments,
          attachmentPath: d.attachmentPath || merged.attachmentPath
        };
      });

      setTrainingDetails(synchronizedDetails);
      setInitialDetails(JSON.parse(JSON.stringify(synchronizedDetails)));

      // Also update selectedAssignment assignments status since some might have completed
      const { data } = await axios.get('/api/hr/induction-training');
      const updatedEmpRow = (data || []).find(r => (r.codeInMaster || r.empCode) === selectedAssignment.empCode);
      if (updatedEmpRow) {
        setSelectedAssignment(prev => ({
          ...prev,
          assignments: updatedEmpRow.assignments || prev.assignments
        }));
      }

      dispatch(openSnackbar({ open: true, message: 'Progress saved successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
      fetchRows();
    } catch (error) {
      console.error('Save error details:', error);
      const msg = error.response?.data || 'Failed to save';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'alert', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  // Complete training
  const handleCompleteTraining = async () => {
    setSaving(true);
    try {
      // Filter details that this user is authorized to edit
      const authorizedDetails = trainingDetails.filter(d => {
        const assignment = selectedAssignment?.assignments?.find(a => String(a.id) === String(d.assignmentId));
        return user?.userLevel === 5 || (assignment && assignment.trainerEmpCode === user?.empCode);
      });

      // Comments are mandatory for every row
      if (!validateComments(authorizedDetails)) {
        dispatch(openSnackbar({
          open: true,
          message: 'Comments are required for all criteria rows before completing!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        setSaving(false);
        return;
      }

      // 1. Validation before saving:
      // If any item is marked COMPLETED, check that a skill rating has been selected.
      const incompleteItems = authorizedDetails.filter(d => d.trainerStatus === 'COMPLETED' && (!d.skillRating || d.skillRating < 1));
      if (incompleteItems.length > 0) {
        dispatch(openSnackbar({
          open: true,
          message: 'Skill Matrix rating is mandatory for completed criteria items!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning'
        }));
        setSaving(false);
        return;
      }

      // Enforce validation that mandatory attachments must be uploaded if status is COMPLETED and attachmentRequired is YES
      const missingAttachments = authorizedDetails.filter(d => d.trainerStatus === 'COMPLETED' && d.attachmentRequired === 'YES' && (!d.attachmentPath || !d.attachmentPath.trim()));
      if (missingAttachments.length > 0) {
        dispatch(openSnackbar({
          open: true,
          message: 'Attachment is mandatory for completed criteria items marked as attachment required!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error'
        }));
        setSaving(false);
        return;
      }

      // Group details by assignmentId for proper batch updates
      const grouped = {};
      trainingDetails.forEach(d => {
        if (!grouped[d.assignmentId]) {
          grouped[d.assignmentId] = [];
        }
        grouped[d.assignmentId].push(d);
      });

      // Save progress for each assignment group
      const savePromises = Object.keys(grouped).map(assignmentId => 
        axios.put(`/api/hr/induction-training/${assignmentId}/details`, grouped[assignmentId])
      );
      await Promise.all(savePromises);

      // Now complete authorized assignments
      const completePromises = [];
      const authorizedAssignmentIds = [...new Set(authorizedDetails.map(d => d.assignmentId))];
      let allValidToFinalize = true;

      authorizedAssignmentIds.forEach(assignmentId => {
        const details = trainingDetails.filter(d => d.assignmentId === assignmentId);
        const allCompleted = details.every(d => d.trainerStatus === 'COMPLETED');
        const allRated = details.every(d => d.skillRating !== null && d.skillRating >= 1);
        
        if (!allCompleted || !allRated) {
          allValidToFinalize = false;
        }

        const assignment = selectedAssignment.assignments.find(a => String(a.id) === String(assignmentId));
        if (assignment && !['COMPLETED', 'TRAINING GIVEN'].includes(assignment.currentStatus) && allCompleted && allRated) {
          completePromises.push(axios.post(`/api/hr/induction-training/${assignmentId}/complete`));
        }
      });

      if (completePromises.length > 0) {
        await Promise.all(completePromises);
        dispatch(openSnackbar({ open: true, message: 'Training completed successfully for finished rounds!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
        setDialogOpen(false);
        fetchRows();
      } else if (allValidToFinalize) {
        dispatch(openSnackbar({ open: true, message: 'Training details and comments updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success' }));
        setDialogOpen(false);
        fetchRows();
      } else {
        dispatch(openSnackbar({ open: true, message: 'Progress saved, but not all criteria are completed and rated to finalize training.', variant: 'alert', severity: 'warning' }));
      }
    } catch (error) {
      console.error('Complete error details:', error);
      const msg = error.response?.data || 'Failed to complete training';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'alert', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  // Filter trainingDetails to show only unique criteria items in UI
  const uniqueTrainingDetails = useMemo(() => {
    const seenMasterIds = new Set();
    const unique = [];
    trainingDetails.forEach(d => {
      const assignment = selectedAssignment?.assignments?.find(a => String(a.id) === String(d.assignmentId));
      const isAuthorized = user?.userLevel === 5 || (assignment && assignment.trainerEmpCode === user?.empCode);
      if (!isAuthorized) return;

      if (d.inductionMasterId) {
        if (!seenMasterIds.has(d.inductionMasterId)) {
          seenMasterIds.add(d.inductionMasterId);
          unique.push(d);
        }
      } else {
        unique.push(d);
      }
    });
    return unique;
  }, [trainingDetails, selectedAssignment, user]);
  const formatDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return '-';
    try {
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

  const resolvedRows = useMemo(() => {
    let filtered = rows;
    
    const activeType = globalFilters.type || 'Mine';
    filtered = filtered.filter(r => 
      r.assignments.some(a => 
        bosFilters.matchScope(activeType, null, a.trainerEmpCode)
      )
    );

    const trainingDateVal = globalFilters.trainingDate;
    if (trainingDateVal) {
      filtered = filtered.filter(r => 
        r.assignments.some(a => {
          if (!a.inductionDate) return false;
          const aDateStr = toLocalDateStr(a.inductionDate);
          return aDateStr === trainingDateVal;
        })
      );
    }

    const mapped = filtered.map(r => {
      const filteredAssignments = r.assignments.filter(a => {
        if (!trainingDateVal) return true;
        if (!a.inductionDate) return false;
        const aDateStr = toLocalDateStr(a.inductionDate);
        return aDateStr === trainingDateVal;
      });

      const completedCount = filteredAssignments.filter(a => ['TRAINING GIVEN', 'COMPLETED'].includes(a.currentStatus)).length;
      const totalCount = filteredAssignments.length;

      const ratedAssignments = filteredAssignments.filter(a => a.averageRating !== null && a.averageRating !== undefined && a.averageRating > 0);
      const rawAverage = ratedAssignments.length > 0
        ? ratedAssignments.reduce((sum, a) => sum + a.averageRating, 0) / ratedAssignments.length
        : 0;
      const averageRating = Math.round(rawAverage);

      const uniqueDates = Array.from(new Set(filteredAssignments.map(a => a.inductionDate ? formatDateDDMMYYYY(a.inductionDate) : '-')));
      const inductionDateStr = uniqueDates.filter(d => d !== '-').join(', ') || '-';
      
      const roundsStr = filteredAssignments.map(a => a.inductionRound).join(', ');
      const isCompleted = totalCount > 0 && filteredAssignments.every(a => ['TRAINING GIVEN', 'COMPLETED'].includes(a.currentStatus));
      const overallStatus = isCompleted ? 'COMPLETED' : 'PENDING';

      return {
        ...r,
        id: r.empCode,
        inductionDate: inductionDateStr,
        inductionRound: roundsStr,
        completedCount,
        totalCount,
        averageRating,
        isCompleted,
        currentStatus: `${completedCount}/${totalCount}`,
        inductionStatus: overallStatus
      };
    });

    const statusVal = (globalFilters.status || 'ALL').toUpperCase();
    let finalFiltered = mapped;
    if (statusVal !== 'ALL') {
      finalFiltered = mapped.filter(r => r.inductionStatus === statusVal);
    }
    if (globalQuery) {
      const s = globalQuery.toLowerCase();
      finalFiltered = finalFiltered.filter(r =>
        (r.empCode || '').toLowerCase().includes(s) ||
        (r.empName || '').toLowerCase().includes(s) ||
        (r.department || '').toLowerCase().includes(s)
      );
    }

    return finalFiltered.map((r, i) => ({
      ...r,
      index: i + 1
    }));
  }, [rows, globalFilters.status, globalFilters.trainingDate, globalFilters.type, globalQuery, bosFilters]);

  const exportColumns = useMemo(() => [
    { id: 'empCode', header: 'Emp Code', key: (row) => row.empCode || '-' },
    { id: 'empName', header: 'Employee Name', key: (row) => row.empName || '-' },
    { id: 'inductionDate', header: 'Induction Date', key: (row) => formatDateDDMMYYYY(row.inductionDate) },
    { id: 'inductionRound', header: 'Induction Round', key: (row) => row.inductionRound || '-' },
    { id: 'averageRating', header: 'Rating', key: (row) => row.averageRating ? String(Math.round(row.averageRating)) : '0' },
    { id: 'inductionStatus', header: 'Status', key: (row) => row.inductionStatus || 'Pending' }
  ], []);

  if (perms.loading) {
    return null;
  }

  return (
    <MainCard fullWidth
      icon={IconClipboardCheck}
      title={"Induction Training"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Induction_Training"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        id="induction-training-table"
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        page={page}
        size={size}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleStartTraining}
        actionColumn={{
          render: (row) => (
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleStartTraining(row)}
              sx={{
                bgcolor: 'primary.main',
                color: 'common.white',
                '&:hover': { bgcolor: 'primary.dark' },
                borderRadius: '8px',
                p: 0.75
              }}
            >
              <IconPlayerPlay size={18} />
            </IconButton>
          )
        }}
      />

      {/* Training Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Induction Process"
        fullWidth
        maxWidth="xl"
        onSave={null}
        isViewOnly={!perms.write}
        saveLabel="Save"
        saveLoading={saving}
        secondaryActions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              sx={btnCancel}
              onClick={() => setDialogOpen(false)}
              startIcon={<IconX size={18} />}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteTraining}
              disabled={saving || completedCount < totalCount}
              startIcon={<IconCheck size={18} />}
              sx={{ fontWeight: 700, borderRadius: '8px', textTransform: 'none' }}
            >
              Complete
            </Button>
          </Stack>
        }
      >
        {selectedAssignment && (
          <>
            {/* Summary Header */}
            <BOSFormSection title="Employee Information">
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
                gap: 3, 
                bgcolor: 'action.hover', 
                p: 2, 
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'divider',
                mb: 1
              }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Employee</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {selectedAssignment.empCode} — {selectedAssignment.empName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Department</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {selectedAssignment.department || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Completed Status</Typography>
                  <Chip 
                    label={`${completedCount} / ${totalCount} Items Completed`} 
                    color={completedCount === totalCount ? "success" : "warning"}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: '6px' }}
                  />
                </Box>
              </Box>
            </BOSFormSection>

            {/* Training Items Table */}
            <BOSFormSection title="Induction Training Process">
               <TableContainer component={Paper} variant="outlined" sx={{ 
                 borderRadius: '10px', 
                 maxHeight: 'calc(100vh - 380px)', 
                 minHeight: '250px',
                 overflowY: 'auto',
                 position: 'relative'
               }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 60, bgcolor: 'background.paper', zIndex: 10 }}>SI.No</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, minWidth: 200, bgcolor: 'background.paper', zIndex: 10 }}>Induction Details</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 80, bgcolor: 'background.paper', zIndex: 10 }}>Answer</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 80, bgcolor: 'background.paper', zIndex: 10 }}>Round</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 220, bgcolor: 'background.paper', zIndex: 10 }}>Trainer Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 340, bgcolor: 'background.paper', zIndex: 10 }}>Skill Matrix</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, minWidth: 150, bgcolor: 'background.paper', zIndex: 10 }}>Comments</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 100, bgcolor: 'background.paper', zIndex: 10 }}>Attachment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uniqueTrainingDetails.map((detail, idx) => (
                      <TableRow key={detail.id || idx} sx={{
                        bgcolor: detail.trainerStatus === 'COMPLETED' ? 'success.lighter' : 'inherit',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}>
                        <TableCell align="center">{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {detail.inductionDetails || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip 
                            title={
                              <Box sx={{ p: 0.5, maxWidth: 300 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.4, color: 'common.white' }}>
                                  {detail.answer || "No expected answer provided"}
                                </Typography>
                              </Box>
                            } 
                            arrow 
                            placement="top"
                          >
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => {
                                setSelectedAnswer(detail.answer);
                                setSelectedCriteriaDetail(detail.inductionDetails);
                                setAnswerModalOpen(true);
                              }}
                            >
                              <IconInfoCircle size={18} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{detail.inductionRound || '-'}</TableCell>
                        <TableCell align="center">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={detail.trainerStatus === 'COMPLETED'}
                                onChange={(e) => {
                                  const nextVal = e.target.checked ? 'COMPLETED' : 'PENDING';
                                  updateDetail(detail.id, 'trainerStatus', nextVal);
                                }}
                                disabled={!perms.write}
                                color="primary"
                                size="small"
                              />
                            }
                            label={detail.trainerStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {(() => {
                            const activeVal = hoverMap[detail.id] !== undefined && hoverMap[detail.id] !== -1 
                              ? hoverMap[detail.id] 
                              : (detail.skillRating || 0);

                            const getLabelText = (val) => {
                              if (val === 5) return 'Expert';
                              if (val === 3 || val === 4) return 'Advanced';
                              if (val === 1 || val === 2) return 'Basic';
                              return 'Not Rated';
                            };

                            return (
                              <Stack direction="column" spacing={0.5} alignItems="center" sx={{ width: 140, mx: 'auto' }}>
                                <CustomRating
                                  value={detail.skillRating || 0}
                                  onChange={(newValue) => {
                                    updateDetail(detail.id, 'skillRating', newValue);
                                  }}
                                  onHoverChange={(newHover) => {
                                    setHoverMap(prev => ({ ...prev, [detail.id]: newHover }));
                                  }}
                                  disabled={!perms.write}
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontWeight: 700, 
                                    color: activeVal === 5 
                                      ? 'success.main' 
                                      : (activeVal >= 3 ? 'primary.main' : (activeVal > 0 ? 'warning.main' : 'text.disabled')),
                                    fontSize: '0.7rem',
                                    height: 14
                                  }}
                                >
                                  {getLabelText(activeVal)}
                                </Typography>
                              </Stack>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            multiline
                            maxRows={3}
                            value={detail.trainerComments || ''}
                            onChange={(e) => {
                              updateDetail(detail.id, 'trainerComments', e.target.value);
                              // Clear the error for this row as soon as the user types
                              if (e.target.value.trim()) {
                                setCommentErrors(prev => { const n = { ...prev }; delete n[detail.id]; return n; });
                              }
                            }}
                            disabled={!perms.write}
                            placeholder="Comments... (required)"
                            fullWidth
                            required
                            error={!!commentErrors[detail.id]}
                            helperText={commentErrors[detail.id] ? 'Comment is required' : ''}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Manage Attachments">
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                              <IconButton 
                                size="small" 
                                color={detail.attachmentPath ? "success" : (detail.criteriaAttachment ? "primary" : "default")}
                                onClick={() => handleOpenAttachmentDialog(detail)}
                              >
                                <IconPaperclip size={18} />
                              </IconButton>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                    {trainingDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No criteria items loaded.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </BOSFormSection>
          </>
        )}
      </BOSFormDialog>

      {/* Attachment Dialog */}
      <BOSMovableDialog
        open={attachmentDialogOpen}
        onClose={() => setAttachmentDialogOpen(false)}
        title="Manage Attachments"
        defaultWidth={850}
        defaultHeight={550}
        actions={attachmentDialogActions}
      >
        <Box sx={{ display: 'flex', gap: 3, p: 1, height: '100%' }}>
          {/* Left Pane: Reference Documents */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', pr: 2 }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Reference Documents
            </Typography>
            {(() => {
              const activeDetail = trainingDetails.find(d => d.id === activeDetailId);
              const refFiles = activeDetail && activeDetail.criteriaAttachment
                ? activeDetail.criteriaAttachment.split(',').filter(Boolean).map(path => {
                    const parts = path.split('/');
                    return {
                      fileName: parts[parts.length - 1],
                      serverFileName: path,
                      isServer: true
                    };
                  })
                : [];

              if (refFiles.length === 0) {
                return (
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '8px', p: 3, bgcolor: 'action.hover' }}>
                    <Typography color="text.secondary" variant="body2">
                      No reference documents uploaded.
                    </Typography>
                  </Box>
                );
              }

              return (
                <Stack spacing={1.5} sx={{ overflowY: 'auto', flex: 1 }}>
                  {refFiles.map((file, i) => (
                    <Box 
                      key={i} 
                      sx={{ 
                        p: 1.5, 
                        border: '1px solid', 
                        borderColor: 'divider', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        noWrap 
                        sx={{ 
                          maxWidth: '75%', 
                          cursor: 'pointer', 
                          color: 'primary.main',
                          textDecoration: 'underline',
                          fontWeight: 600
                        }}
                        onClick={() => {
                          setPreviewFile(file);
                          setPreviewFiles(refFiles);
                          setPreviewOpen(true);
                        }}
                      >
                        {file.fileName}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {
                          setPreviewFile(file);
                          setPreviewFiles(refFiles);
                          setPreviewOpen(true);
                        }}
                      >
                        <IconEye size={18} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              );
            })()}
          </Box>

          {/* Right Pane: Upload Verification Documents */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', pl: 1 }}>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Verification Documents
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <BOSFileUpload
                multiple={true}
                files={attachmentFiles}
                disabled={!perms.write}
                hideDropzoneOnUpload={true}
                onChange={(newFiles) => {
                  setAttachmentFiles(newFiles);
                }}
                onPreview={(file) => {
                  const path = file.serverFileName || file.filePath || file;
                  window.open(`${axios.defaults.baseURL}/api/files/download?path=${encodeURIComponent(path)}`, '_blank');
                }}
              />
            </Box>
          </Box>
        </Box>
      </BOSMovableDialog>

      {/* Answer Details Dialog */}
      <BOSFormDialog
        open={answerModalOpen}
        onClose={() => setAnswerModalOpen(false)}
        title="Answer Details"
      >
        {selectedCriteriaDetail && (
            <Box sx={{ mb: 2.5, p: 2, bgcolor: 'grey.50', borderRadius: '8px', borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                CRITERIA / QUESTION
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'pre-line' }}>
                {selectedCriteriaDetail}
              </Typography>
            </Box>
          )}
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              EXPECTED ANSWER / GUIDELINES
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.primary', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {selectedAnswer || 'No expected answer provided.'}
            </Typography>
          </Box>
      </BOSFormDialog>
      {previewOpen && previewFile && (
        <BOSFilePreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewFile(null);
            setPreviewFiles([]);
          }}
          file={previewFile}
          allFiles={previewFiles}
          onNavigate={(nextFile) => setPreviewFile(nextFile)}
        />
      )}
    </MainCard>
  );
}
