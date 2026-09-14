import TextField from 'ui-component/CustomTextField';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import { useTheme } from '@mui/material/styles';
import useAuth from 'hooks/useAuth';

// MUI & Icons
import { Box, Typography, Stack, Tooltip, IconButton, MenuItem, Button, Chip, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import {
  IconRefresh,
  IconCheck,
  IconUserCheck
} from '@tabler/icons-react';

// BOS Components
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSDataTable,
  BOSFormDialog,
  BOSFormSection,
  BOSTextField,
  errorStyle,
  BOSTableToolbar,
  BOSStatusChip
} from 'ui-component/bos';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import useBOSFilters from 'hooks/useBOSFilters';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { Navigate, useNavigate } from 'react-router-dom';

// ==============================|| INDUCTION TRAINEE (EMPLOYEE PAGE) ||============================== //

const TRAINEE_STATUS_OPTIONS = [
  { value: 'UNDERSTOOD', label: 'UNDERSTOOD', color: 'success' },
  { value: 'NEED MORE TRAINING', label: 'NEED MORE TRAINING', color: 'error' }
];

const columns = [
  { id: 'index', label: 'Sl.No', minWidth: 60 },
  { id: 'inductionDate', label: 'Induction Date', minWidth: 120 },
  { id: 'inductionRound', label: 'Induction Round', minWidth: 130 },
  { id: 'trainerName', label: 'Trainer', minWidth: 150 },
  { id: 'department', label: 'Department', minWidth: 150 },
  {
    id: 'averageRating',
    label: 'Rating',
    minWidth: 80,
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
    id: 'currentStatus',
    label: 'Current Status',
    minWidth: 140,
    render: (row) => <BOSStatusChip status={row.currentStatus || 'PENDING'} showIcon width={140} />
  }
];

export default function InductionTrainee() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.ATS_INDUCTION_TRAINEE);
  const bosFilters = useBOSFilters(perms);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { user } = useAuth();

  const [feedbackCompleted, setFeedbackCompleted] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // If visited with ?token= (from induction feedback email), load and open review dialog directly
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      const loadFromToken = async () => {
        setLoading(true);
        setSelectedAssignment(null);
        setTrainingDetails([]);
        setCommentErrors({});
        try {
          const { data } = await axios.get(`/api/public/induction-feedback?token=${token}`, {
            skipGlobalAlert: true
          });
          if (data.assignment) {
            setSelectedAssignment(data.assignment);
            const initializedDetails = (data.details || []).map(d => ({
              ...d,
              traineeStatus: d.traineeStatus || '',
              traineeComments: d.traineeComments || ''
            }));
            setTrainingDetails(initializedDetails);
            setDialogOpen(true);
          }
        } catch (err) {
          const msg = err.response?.data || 'Invalid or expired feedback link.';
          setTokenError(typeof msg === 'string' ? msg : 'Invalid or expired feedback link.');
          dispatch(openSnackbar({
            open: true,
            message: typeof msg === 'string' ? msg : 'Invalid or expired feedback link.',
            variant: 'alert',
            severity: 'error'
          }));
        } finally {
          setLoading(false);
        }
      };
      loadFromToken();
    }
  }, [searchParams, dispatch]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [trainingDetails, setTrainingDetails] = useState([]);
  const [saving, setSaving] = useState(false);
  const [commentErrors, setCommentErrors] = useState({});
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const globalQuery = useSelector((state) => state.search.query);
  const globalFilters = useSelector((state) => state.search.filters) || {};

  // Dispatch filter config
  useEffect(() => {
    if (perms.loading || !bosFilters.myTeamLoaded) return;
    const config = [
      { id: 'type', label: 'Scope', type: 'select', options: bosFilters.getFilterOptions(), defaultValue: perms.additional1 ? 'Company' : 'Mine', isStarred: true }
    ];
    dispatch(setFilterConfig(config));
    const currentPath = window.location.pathname;
    return () => {
      if (window.location.pathname !== currentPath) {
        dispatch(setFilterConfig(null));
      }
    };
  }, [dispatch, perms.loading, bosFilters.myTeamLoaded, bosFilters.isVerticalHead, perms.additional1]);

  const fetchRows = useCallback(async () => {
    const token = searchParams.get('token');
    if (token) {
      return;
    }
    if (!perms.enabled) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.get('/api/hr/induction-trainee');
      setRows(data || []);
    } catch (error) {
      console.error('Failed to fetch trainee records:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, perms.enabled, searchParams]);

  useEffect(() => {
    if (!perms.loading) {
      fetchRows();
    }
  }, [fetchRows, perms.loading]);

  // Open trainee review dialog
  const handleUpdateTraining = useCallback(async (row) => {
    setSelectedAssignment(row);
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/hr/induction-trainee/${row.id}/details`);
      setTrainingDetails(data || []);
      setDialogOpen(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to load training details', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // Update a detail item locally
  const updateDetail = (detailId, field, value) => {
    setTrainingDetails(prev =>
      prev.map(d => d.id === detailId ? { ...d, [field]: value } : d)
    );
  };

  // Submit responses
  const handleSubmit = async () => {
    if (saving) return;
    let hasError = false;
    const errors = {};
    for (const detail of trainingDetails) {
      if (!detail.traineeStatus) {
        hasError = true;
      }
      if (!detail.traineeComments || !detail.traineeComments.trim()) {
        errors[detail.id] = true;
        hasError = true;
      }
    }
    setCommentErrors(errors);
    if (hasError) {
      dispatch(openSnackbar({ open: true, message: 'Please select trainee status and enter comments for all items.', variant: 'alert', severity: 'error' }));
      return;
    }

    setSaving(true);
    try {
      const token = searchParams.get('token');
      let result;
      if (token) {
        result = await axios.post('/api/public/induction-feedback/submit', {
          token,
          responses: trainingDetails
        });
      } else {
        result = await axios.put(`/api/hr/induction-trainee/${selectedAssignment.id}/respond`, trainingDetails);
      }
      const newStatus = result.data?.currentStatus;

      if (newStatus === 'COMPLETED') {
        dispatch(openSnackbar({
          open: true,
          message: 'Induction round completed successfully! 🎉',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else if (newStatus === 'PENDING') {
        dispatch(openSnackbar({
          open: true,
          message: 'Training marked for re-training. The trainer will be notified.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning'
        }));
      }

      setDialogOpen(false);
      if (token) {
        setFeedbackCompleted(true);
      } else {
        fetchRows();
      }
    } catch (error) {
      const msg = error.response?.data || 'Failed to submit responses';
      dispatch(openSnackbar({ open: true, message: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'alert', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  };

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

  // Filter rows
  const resolvedRows = useMemo(() => {
    let filtered = rows;

    const activeType = globalFilters.type || (perms.additional1 ? 'Company' : 'Mine');
    filtered = filtered.filter(r => 
      bosFilters.matchScope(activeType, null, r.empCode) ||
      (r.codeInMaster && bosFilters.matchScope(activeType, null, r.codeInMaster)) ||
      (r.oldEmpCode && bosFilters.matchScope(activeType, null, r.oldEmpCode))
    );

    if (globalQuery) {
      const s = globalQuery.toLowerCase();
      filtered = filtered.filter(r =>
        (r.inductionRound || '').toLowerCase().includes(s) ||
        (r.trainerName || '').toLowerCase().includes(s) ||
        (r.department || '').toLowerCase().includes(s)
      );
    }
    return filtered.map((r, i) => ({
      ...r,
      index: i + 1,
      inductionDate: r.inductionDate ? formatDateDDMMYYYY(r.inductionDate) : '-'
    }));
  }, [rows, globalFilters.type, globalQuery, bosFilters]);

  const exportColumns = useMemo(() => [
    { id: 'inductionDate', header: 'Induction Date', key: (row) => row.inductionDate || '-' },
    { id: 'inductionRound', header: 'Induction Round', key: (row) => row.inductionRound || '-' },
    { id: 'trainerName', header: 'Trainer', key: (row) => row.trainerName || '-' },
    { id: 'department', header: 'Department', key: (row) => row.department || '-' },
    { id: 'averageRating', header: 'Rating', key: (row) => row.averageRating ? String(Math.round(row.averageRating)) : '0' },
    { id: 'currentStatus', header: 'Current Status', key: (row) => row.currentStatus || 'PENDING' }
  ], []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedAssignment(null);
    setTrainingDetails([]);
    setCommentErrors({});
    const token = searchParams.get('token');
    if (token) {
      setTokenError('Feedback form closed. You can refresh the page to open it again.');
    }
  };

  if (perms.loading) {
    return null;
  }

  if (feedbackCompleted) {
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0a0e17',
        color: '#fff',
        p: 3
      }}>
        <Paper sx={{
          p: 5,
          textAlign: 'center',
          maxWidth: 500,
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          bgcolor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(16px)'
        }}>
          <Box sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: '50%',
            bgcolor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            mb: 3
          }}>
            <Typography sx={{ fontSize: '3rem' }}>🎉</Typography>
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, color: '#4caf50' }}>
            Thank You!
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.6 }}>
            Your induction training feedback has been successfully submitted and recorded. The feedback link has been deactivated.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (tokenError) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
        p: 3
      }}>
        <Paper sx={{
          p: 5,
          textAlign: 'center',
          maxWidth: 500,
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          bgcolor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(16px)'
        }}>
          <Box sx={{
            display: 'inline-flex',
            p: 2,
            borderRadius: '50%',
            bgcolor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            mb: 3
          }}>
            <Typography sx={{ fontSize: '3rem' }}>⚠️</Typography>
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, color: '#f44336' }}>
            Link Deactivated
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, lineHeight: 1.6 }}>
            {tokenError}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <MainCard fullWidth
      icon={IconUserCheck}
      title={"Induction Trainee"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Induction_Trainee"
          hasExportPermission={perms.export}
          columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        page={page}
        size={size}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={handleUpdateTraining}
        actionColumn={{
          render: (row) => (
            <Button
              size="small"
              variant="contained"
              color="info"
              startIcon={<IconCheck size={16} />}
              onClick={() => handleUpdateTraining(row)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
            >
              Update Training
            </Button>
          )
        }}
      />

      {/* Trainee Review Dialog */}
      <BOSFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        title="Induction Review — Trainee Response"
        fullWidth
        maxWidth="xl"
        onSave={perms.write ? handleSubmit : null}
        isViewOnly={!perms.write}
        saveLabel="Save"
        saveButtonDisabled={saving}
      >
        {selectedAssignment && (
          <>
            {/* Summary Header */}
            <BOSFormSection title="Training Information">
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: selectedAssignment.averageRating ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr' }, 
                gap: 3, 
                bgcolor: 'action.hover', 
                p: 2, 
                borderRadius: '8px',
                border: '1px solid',
                borderColor: 'divider',
                mb: 1
              }}>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Trainer</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {selectedAssignment.trainerName || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Department</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {selectedAssignment.department || '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Date</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {selectedAssignment.inductionDate || '-'}
                  </Typography>
                </Box>
                {selectedAssignment.averageRating && (
                  <Box>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>Trainer Rating</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {Math.round(selectedAssignment.averageRating)} / 5
                    </Typography>
                  </Box>
                )}
              </Box>
            </BOSFormSection>

            {/* Training Items Table */}
            <BOSFormSection title="Induction Details — Your Response">
              <form autoComplete="off" style={{ width: '100%' }} onSubmit={(e) => e.preventDefault()}>
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
                      <TableCell align="center" sx={{ fontWeight: 700, width: 50, bgcolor: 'background.paper', zIndex: 10 }}>#</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, minWidth: 200, bgcolor: 'background.paper', zIndex: 10 }}>Induction Details</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, minWidth: 120, bgcolor: 'background.paper', zIndex: 10 }}>Round</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 120, bgcolor: 'background.paper', zIndex: 10 }}>Trainer Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, minWidth: 130, bgcolor: 'background.paper', zIndex: 10 }}>Trainer Rating</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, minWidth: 180, bgcolor: 'background.paper', zIndex: 10 }}>Trainer Feedback</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, width: 140, bgcolor: 'background.paper', zIndex: 10 }}>Trainee Status <span style={{ color: 'red' }}>*</span></TableCell>
                      <TableCell align="left" sx={{ fontWeight: 700, minWidth: 220, bgcolor: 'background.paper', zIndex: 10 }}>Trainee Comments <span style={{ color: 'red' }}>*</span></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainingDetails.map((detail, idx) => {
                      const getRatingLabel = (rating) => {
                         if (rating === 4 || rating === 3) return 'ADVANCE LEVEL';
                         if (rating === 2 || rating === 1) return 'BASIC LEVEL';
                         if (rating === 5) return 'EXPERT';
                         return '-';
                      };
                      return (
                        <TableRow key={detail.id} sx={{
                          bgcolor: detail.traineeStatus === 'UNDERSTOOD' ? 'success.lighter' :
                                   detail.traineeStatus === 'NEED MORE TRAINING' ? 'error.lighter' : 'inherit',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}>
                          <TableCell align="center">{idx + 1}</TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {detail.inductionDetails || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="left">{detail.inductionRound || '-'}</TableCell>
                          <TableCell align="center">
                            <BOSStatusChip status={detail.trainerStatus || 'PENDING'} showIcon width={120} />
                          </TableCell>
                          <TableCell align="center">
                            <BOSStatusChip status={getRatingLabel(detail.skillRating)} width={120} />
                          </TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                              {detail.trainerComments || '-'}
                            </Typography>
                          </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            <Tooltip title="Understood" placement="top" arrow>
                              <IconButton
                                size="medium"
                                color={detail.traineeStatus === 'UNDERSTOOD' ? 'success' : 'default'}
                                onClick={() => updateDetail(detail.id, 'traineeStatus', 'UNDERSTOOD')}
                                disabled={!perms.write}
                                sx={{
                                  border: detail.traineeStatus === 'UNDERSTOOD' ? '2px solid #2e7d32' : '1px solid #ccc',
                                  bgcolor: detail.traineeStatus === 'UNDERSTOOD' ? '#e8f5e9' : 'transparent',
                                  '&:hover': { bgcolor: '#c8e6c9' }
                                }}
                              >
                                👍
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Need more training" placement="top" arrow>
                              <IconButton
                                size="medium"
                                color={detail.traineeStatus === 'NEED MORE TRAINING' ? 'error' : 'default'}
                                onClick={() => updateDetail(detail.id, 'traineeStatus', 'NEED MORE TRAINING')}
                                disabled={!perms.write}
                                sx={{
                                  border: detail.traineeStatus === 'NEED MORE TRAINING' ? '2px solid #d32f2f' : '1px solid #ccc',
                                  bgcolor: detail.traineeStatus === 'NEED MORE TRAINING' ? '#ffebee' : 'transparent',
                                  '&:hover': { bgcolor: '#ffcdd2' }
                                }}
                              >
                                👎
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell align="left">
                          <TextField
                            id={`traineeComments-${detail.id}`}
                            name={`traineeComments-${detail.id}`}
                            autoComplete="new-password"
                            inputProps={{ autoComplete: 'new-password' }}
                            size="small"
                            multiline
                            maxRows={3}
                            value={detail.traineeComments || ''}
                            onChange={(e) => {
                              updateDetail(detail.id, 'traineeComments', e.target.value);
                              if (e.target.value.trim()) {
                                setCommentErrors(prev => {
                                  const next = { ...prev };
                                  delete next[detail.id];
                                  return next;
                                });
                              }
                            }}
                            disabled={!perms.write}
                            placeholder="Your comments..."
                            fullWidth
                            required
                            error={!!commentErrors[detail.id]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                    {trainingDetails.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No training details found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </form>
          </BOSFormSection>
          </>
        )}
      </BOSFormDialog>
    </MainCard>
  );
}
