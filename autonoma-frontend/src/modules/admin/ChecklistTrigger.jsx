import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Alert,
  Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconPlayerPlay,
  IconClipboardCheck,
  IconRefresh,
  IconAlertCircle,
  IconCircleCheck,
  IconClock
} from '@tabler/icons-react';

// project imports
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { tableContainerSx, tableHeadCellSx } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  // timeStr is LocalTime serialized as "HH:mm:ss" or "HH:mm:ss.nnnnnnnnn"
  try {
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parts[1];
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${m} ${ampm}`;
    }
  } catch {
    // fallthrough
  }
  return timeStr;
};

// ─────────────────────────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────────────────────────

const StatusChip = ({ status }) => {
  const isSuccess = status === 'SUCCESS';
  return (
    <Chip
      icon={isSuccess ? <IconCircleCheck size={14} /> : <IconAlertCircle size={14} />}
      label={status}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.72rem',
        bgcolor: isSuccess ? 'success.light' : 'error.light',
        color: isSuccess ? 'success.dark' : 'error.dark',
        border: '1px solid',
        borderColor: isSuccess ? 'success.main' : 'error.main',
        '& .MuiChip-icon': { color: 'inherit' }
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const ChecklistTrigger = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.AD_PROCESS_TRIGGER);

  const [triggering, setTriggering] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const [lastResult, setLastResult] = useState(null); // result of most recent trigger

  // ── Load trigger logs ──────────────────────────────────────────────────────
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await axios.get('/api/admin/checklist-manual-trigger/logs');
      setLogs(response.data || []);
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to load trigger logs.',
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
    } finally {
      setLoadingLogs(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ── Handle trigger button click ────────────────────────────────────────────
  const handleTrigger = async () => {
    if (!perms.write) return;
    setTriggering(true);
    setLastResult(null);
    try {
      const response = await axios.post('/api/admin/checklist-manual-trigger/trigger');
      const result = response.data;
      setLastResult(result);
      dispatch(
        openSnackbar({
          open: true,
          message:
            result.status === 'SUCCESS'
              ? `Checklist generation completed successfully. ${result.checklistCount} checklist(s) generated.`
              : `Trigger failed: ${result.failureReason || 'Unknown error'}`,
          variant: 'alert',
          alert: { color: result.status === 'SUCCESS' ? 'success' : 'error' },
          close: true
        })
      );
      // Refresh logs after trigger
      await loadLogs();
    } catch (err) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to trigger checklist generation. Please try again.',
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
    } finally {
      setTriggering(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <MainCard
      title="Trigger"
      secondary={
        <Tooltip title="Refresh Logs">
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={loadingLogs ? <CircularProgress size={14} /> : <IconRefresh size={16} />}
              onClick={loadLogs}
              disabled={loadingLogs || triggering}
              sx={{ minWidth: 110, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      }
    >
      {/* ── Checklist Trigger Panel ───────────────────────────────────────── */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          mb: 3
        }}
      >
        <CardHeader
          avatar={
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconClipboardCheck size={22} color={theme.palette.primary.main} />
            </Box>
          }
          title={
            <Typography variant="h5" fontWeight={700}>
              Checklist
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              Manually invoke the daily checklist generation job
            </Typography>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            {/* Info banner */}
            <Alert
              severity="info"
              icon={<IconClock size={18} />}
              sx={{ borderRadius: 1.5 }}
            >
              <Typography variant="body2">
                <strong>Scheduled Job:</strong> The system automatically generates checklist
                executions every day at <strong>4:00 AM IST</strong>. Use this button only when
                the scheduler has failed, the server was restarted, or a generation was missed.
                Duplicate records will <strong>not</strong> be created.
              </Typography>
            </Alert>

            {/* Last trigger result inline feedback */}
            {lastResult && (
              <Alert
                severity={lastResult.status === 'SUCCESS' ? 'success' : 'error'}
                sx={{ borderRadius: 1.5 }}
              >
                <Typography variant="body2">
                  {lastResult.status === 'SUCCESS' ? (
                    <>
                      Trigger completed successfully —{' '}
                      <strong>{lastResult.checklistCount}</strong> checklist(s) generated on{' '}
                      <strong>{formatDate(lastResult.triggerDate)}</strong> at{' '}
                      <strong>{formatTime(lastResult.triggerTime)}</strong>.
                    </>
                  ) : (
                    <>
                      Trigger failed: <strong>{lastResult.failureReason}</strong>
                    </>
                  )}
                </Typography>
              </Alert>
            )}

            {/* Trigger button */}
            <Box>
              <Tooltip
                title={
                  !perms.write
                    ? 'You do not have permission to trigger this action.'
                    : 'Click to manually run the checklist generation job'
                }
              >
                <span>
                  <Button
                    id="btn-checklist-manual-trigger"
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={
                      triggering ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <IconPlayerPlay size={20} />
                      )
                    }
                    onClick={handleTrigger}
                    disabled={!perms.write || triggering}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 4,
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: theme.shadows[3],
                      '&:hover': {
                        boxShadow: theme.shadows[6],
                        transform: 'translateY(-1px)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                  >
                    {triggering ? 'Triggering…' : 'Trigger'}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Execution Log History ─────────────────────────────────────────── */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
        Execution Log
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing the last 50 manual trigger executions.
      </Typography>

      <TableContainer component={Paper} sx={tableContainerSx}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCellSx}>#</TableCell>
              <TableCell sx={tableHeadCellSx}>Triggered By</TableCell>
              <TableCell sx={tableHeadCellSx}>Date</TableCell>
              <TableCell sx={tableHeadCellSx}>Time</TableCell>
              <TableCell sx={tableHeadCellSx} align="center">
                Status
              </TableCell>
              <TableCell sx={tableHeadCellSx} align="right">
                Checklists Generated
              </TableCell>
              <TableCell sx={tableHeadCellSx}>Failure Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingLogs ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Stack alignItems="center" spacing={1}>
                    <IconClipboardCheck size={36} color={theme.palette.text.disabled} />
                    <Typography variant="body2" color="text.secondary">
                      No trigger logs found. Use the Trigger button above to generate the first
                      log entry.
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 0 },
                    bgcolor:
                      index === 0 && lastResult && log.id === lastResult.id
                        ? 'action.selected'
                        : 'inherit'
                  }}
                >
                  <TableCell sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {log.triggeredBy || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="body2">{formatDate(log.triggerDate)}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="body2">{formatTime(log.triggerTime)}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }} align="center">
                    <StatusChip status={log.status} />
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }} align="right">
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={log.checklistCount > 0 ? 'primary.main' : 'text.secondary'}
                    >
                      {log.checklistCount}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1.5 }}>
                    {log.failureReason ? (
                      <Tooltip title={log.failureReason}>
                        <Typography
                          variant="body2"
                          color="error.main"
                          sx={{
                            maxWidth: 250,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                          }}
                        >
                          {log.failureReason}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  );
};

export default ChecklistTrigger;
