import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Switch,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  alpha,
  CircularProgress,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { BOSTextField, BOSStatusChip } from 'ui-component/bos';
import axios from 'utils/axios';
import { openSnackbar } from 'store/slices/snackbar';
import { useDispatch } from 'react-redux';
import {
  IconDatabase,
  IconPlugConnected,
  IconSend,
  IconDownload,
  IconArrowUp,
  IconArrowDown,
  IconPlayerPlay,
  IconRefresh,
  IconClock,
  IconFileText,
  IconChevronRight,
  IconChevronLeft,
  IconCode,
  IconTable,
  IconEye,
  IconTrash,
  IconGripVertical
} from '@tabler/icons-react';

// ─── Helpers ─────────────────────────────────────────────────────
function intervalLabel(sec) {
  if (!sec || sec <= 0) return '';
  const m = Math.floor(sec / 60),
    s = sec % 60;
  if (m === 0) return `Every ${s}s`;
  return s === 0 ? `Every ${m}m` : `Every ${m}m ${s}s`;
}

// ─── Compact Scheduler Row ────────────────────────────────────────
const SchedulerRow = memo(function SchedulerRow({ label, enabled, interval, lastRun, onEnabledChange, onIntervalChange }) {
  return (
    <Paper variant="outlined" sx={{ px: 2, py: 1, borderRadius: 1, bgcolor: enabled ? 'primary.50' : 'background.paper' }}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Switch size="small" checked={!!enabled} onChange={(e) => onEnabledChange(e.target.checked)} color="warning" />
          <Typography variant="caption" fontWeight={700} color={enabled ? 'warning.dark' : 'text.disabled'}>
            {label} {enabled ? 'ON' : 'OFF'}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconClock size={14} />
          <BOSTextField
            type="number"
            size="small"
            value={interval || 60}
            onChange={(e) => onIntervalChange(parseInt(e.target.value) || 60)}
            disabled={!enabled}
            sx={{ width: 80, '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: 12 } }}
          />
          <Typography variant="caption" color="text.secondary">
            sec
          </Typography>
        </Stack>
        {enabled && <Chip label={intervalLabel(interval)} size="small" color="warning" variant="outlined" sx={{ fontSize: 10 }} />}
        {lastRun && (
          <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
            Last run: {new Date(lastRun).toLocaleTimeString()}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
});

// ─── Column Selector ──────────────────────────────────────────────
const ColumnSelector = memo(function ColumnSelector({ available, selected, onChange }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');

  const unselected = available.filter((c) => !selected.includes(c));
  const filteredUnselected = unselected.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (col) => {
    onChange([...selected, col]);
  };

  const handleRemove = (col) => {
    onChange(selected.filter(c => c !== col));
  };

  const handleSelectAll = () => {
    onChange([...selected, ...unselected]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(selected);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onChange(items);
  };

  return (
    <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5, p: 1.5, bgcolor: 'background.paper' }}>
      <Grid container spacing={2} sx={{ width: '100%' }}>
        {/* Available Columns section */}
        <Grid item xs={12} sx={{ width: { xs: '100%', md: '48%' } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Available Columns ({unselected.length})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {unselected.length > 0 && (
              <Button size="small" variant="text" onClick={handleSelectAll} sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: 11 }}>
                Select All
              </Button>
            )}
          </Stack>

          {/* Search input */}
          <BOSTextField
            size="small"
            placeholder="Search columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 1, '& input': { py: 0.5, fontSize: 11 } }}
          />

          {/* Chips container */}
          <Box sx={{
            width: '100%',
            height: 140,
            overflowY: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            alignContent: 'flex-start',
            bgcolor: 'grey.50'
          }}>
            {filteredUnselected.length === 0 ? (
              <Typography variant="caption" color="text.disabled" sx={{ m: 'auto', fontStyle: 'italic' }}>
                {unselected.length === 0 ? '✓ All columns selected' : 'No matches found'}
              </Typography>
            ) : (
              filteredUnselected.map((col) => (
                <Chip
                  key={col}
                  label={col}
                  size="small"
                  onClick={() => handleAdd(col)}
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontSize: 10,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'primary.50' }
                  }}
                />
              ))
            )}
          </Box>
        </Grid>

        {/* Selected Columns section */}
        <Grid item xs={6} sx={{ width: { xs: '100%', md: '46%' } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              Selected ({selected.length})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {selected.length > 0 && (
              <Button size="small" variant="text" color="error" onClick={handleClearAll} sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: 11 }}>
                Clear All
              </Button>
            )}
          </Stack>

          {/* Scrollable vertical list */}
          <Box sx={{
            height: 178,
            overflowY: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>
            {selected.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.disabled">
                  ← Click columns to add
                </Typography>
              </Box>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="selectedColumnsList" direction="vertical">
                  {(provided) => (
                    <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ minHeight: '100%', pb: 1 }}>
                      {selected.map((col, idx) => (
                        <Draggable key={col} draggableId={col} index={idx}>
                          {(provided, snapshot) => (
                            <Stack
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{
                                px: 1,
                                py: 0.5,
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                '&:last-child': { borderBottom: 0 },
                                bgcolor: snapshot.isDragging ? 'primary.50' : 'transparent',
                                '&:hover': { bgcolor: snapshot.isDragging ? 'primary.50' : 'action.hover' },
                                ...(snapshot.isDragging && {
                                  boxShadow: 2,
                                  border: `1px solid ${theme.palette.primary.main}`,
                                  borderRadius: 1,
                                  zIndex: 10
                                })
                              }}
                            >
                              <Box
                                {...provided.dragHandleProps}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'grab',
                                  color: 'text.disabled',
                                  '&:hover': { color: 'text.secondary' }
                                }}
                              >
                                <IconGripVertical size={14} />
                              </Box>
                              <Chip
                                label={idx + 1}
                                size="small"
                                sx={{ minWidth: 18, height: 16, fontSize: 9, bgcolor: 'action.selected' }}
                              />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: 10, flexGrow: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {col}
                              </Typography>

                              {/* Controls */}
                              <Stack direction="row" spacing={0.25}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemove(col)}
                                  sx={{ p: 0.25 }}
                                >
                                  <IconTrash size={12} />
                                </IconButton>
                              </Stack>
                            </Stack>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
});

// ─── Data Preview Table ───────────────────────────────────────────
const DataPreviewTable = memo(function DataPreviewTable({ data, title }) {
  const theme = useTheme();
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <IconTable size={14} color={theme.palette.primary.main} />
        <Typography variant="caption" fontWeight={700} color="primary.main">
          {title} — {data.length} record(s)
        </Typography>
      </Stack>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
          maxHeight: 220,
          borderRadius: 1,
          '& .MuiTableCell-head': { bgcolor: 'primary.main', color: '#fff', fontSize: 11, fontWeight: 700, py: 0.75, whiteSpace: 'nowrap' }
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {keys.map((k) => (
                <TableCell key={k}>{k}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                {keys.map((k) => (
                  <TableCell key={k} sx={{ fontSize: 11, py: 0.5, whiteSpace: 'nowrap' }}>
                    {row[k] != null ? String(row[k]) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

// ─── Log Table ────────────────────────────────────────────────────
const LogTable = memo(function LogTable({ logs }) {
  return (
    <Box sx={{ maxHeight: 220, overflow: 'auto' }}>
      {logs.length === 0 ? (
        <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', p: 1, display: 'block' }}>
          No activity recorded yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  fontSize: 10,
                  fontWeight: 700,
                  py: 0.5,
                  color: 'text.secondary',
                  borderBottom: '2px solid',
                  borderColor: 'divider'
                }
              }}
            >
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Message</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, idx) => (
              <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ fontSize: 10, fontFamily: 'monospace', color: 'text.disabled', whiteSpace: 'nowrap' }}>
                  {log.time}
                </TableCell>
                <TableCell sx={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{log.action}</TableCell>
                <TableCell sx={{ fontSize: 11 }}>
                  <Chip
                    label={log.source || 'MANUAL'}
                    size="small"
                    color={log.source === 'AUTO' ? 'warning' : 'default'}
                    variant="outlined"
                    sx={{ fontSize: 9, height: 16 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.status}
                    color={log.status === 'SUCCESS' ? 'success' : 'error'}
                    size="small"
                    variant="filled"
                    sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell sx={{ fontSize: 11, color: 'text.secondary' }}>{log.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
});

// ─── Main Component ───────────────────────────────────────────────
export default function MachineIntegrationTab({ machineId, machineCode }) {
  const dispatch = useDispatch();
  const theme = useTheme();

  const [config, setConfig] = useState({
    dbType: 'MS SQL Server',
    dbHost: '',
    dbPort: '1433',
    databaseName: '',
    dbUsername: '',
    dbPassword: '',
    productionTableName: '',
    readColumns: '',
    sendSqlQuery: '',
    writeMode: 'TABLE',
    targetDestination: '',
    scheduleEnabled: false,
    scheduleIntervalSeconds: 60,
    lastRunDate: null,
    readScheduleEnabled: false,
    readScheduleIntervalSeconds: 60,
    readLastRunDate: null,
    readSqlQuery: ''
  });

  const [availableColumns, setAvailableColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [readData, setReadData] = useState([]);
  const [sendData, setSendData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [connStatus, setConnStatus] = useState(null);

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [targetColumns, setTargetColumns] = useState([]);
  const [loadingTargetColumns, setLoadingTargetColumns] = useState(false);

  // --- Specific Loading States for Progress & Optimization ---
  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [readingData, setReadingData] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const anyLoading = testingConnection || loadingColumns || readingData || runningJob || savingConfig;

  // Track lastRunDates for auto-log detection
  const prevLastRunDate = useRef(null);
  const prevReadLastRunDate = useRef(null);
  const pollTimerRef = useRef(null);

  // Query generation helper
  const generateQuery = useCallback((cols, table) => {
    if (cols.length > 0 && table) {
      return `SELECT ${cols.join(', ')}\nFROM ${table}\nORDER BY 1 DESC`;
    } else if (table) {
      return `SELECT *\nFROM ${table}\nORDER BY 1 DESC`;
    }
    return '-- Select a table first';
  }, []);

  const addLog = useCallback(
    (action, status, message, source = 'MANUAL') => {
      setLogs((prev) => [{ time: new Date().toLocaleString(), action, machineCode, status, message, source }, ...prev].slice(0, 100));
    },
    [machineCode]
  );

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/machine-integration/${machineId}/config`);
      if (data) {
        setConfig((p) => ({ ...p, ...data }));
        prevLastRunDate.current = data.lastRunDate;
        prevReadLastRunDate.current = data.readLastRunDate;
        if (data.readColumns) {
          setSelectedColumns(
            data.readColumns
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
          );
        }
      }
    } catch {
      /* no config yet */
    }
  }, [machineId]);

  const handleLoadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const { data } = await axios.get(`/api/machine-integration/${machineId}/tables`);
      if (data.success) {
        setTables(data.tables);
      }
    } catch (e) {
      console.error('Failed to load tables:', e);
    } finally {
      setLoadingTables(false);
    }
  }, [machineId]);

  // --- Optimized Event Handlers to Prevent Unnecessary Renders ---
  const handleConfigChange = useCallback(
    (field) => (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleReadScheduleEnabledChange = useCallback((v) => {
    setConfig((prev) => ({ ...prev, readScheduleEnabled: v }));
  }, []);

  const handleReadScheduleIntervalChange = useCallback((v) => {
    setConfig((prev) => ({ ...prev, readScheduleIntervalSeconds: v }));
  }, []);

  const handleScheduleEnabledChange = useCallback((v) => {
    setConfig((prev) => ({ ...prev, scheduleEnabled: v }));
  }, []);

  const handleScheduleIntervalChange = useCallback((v) => {
    setConfig((prev) => ({ ...prev, scheduleIntervalSeconds: v }));
  }, []);

  const handleColumnChange = useCallback((cols) => {
    setSelectedColumns(cols);
    const newQuery = generateQuery(cols, config.productionTableName);
    setConfig((prev) => ({ ...prev, readSqlQuery: newQuery }));
  }, [config.productionTableName, generateQuery]);

  useEffect(() => {
    if (machineId) {
      fetchConfig().then(() => {
        handleLoadTables();
      });
    }
  }, [machineId, fetchConfig, handleLoadTables]);

  useEffect(() => {
    if (machineId && config.productionTableName) {
      setLoadingColumns(true);
      axios.get(`/api/machine-integration/${machineId}/columns?tableName=${config.productionTableName}`)
        .then(({ data }) => {
          if (data.success) {
            setAvailableColumns(data.columns);
            setColumnsLoaded(true);
            setSelectedColumns((prev) => {
              if (prev.length === 0) {
                const newQuery = generateQuery(data.columns, config.productionTableName);
                setConfig((c) => ({ ...c, readSqlQuery: newQuery }));
                return data.columns;
              }
              return prev;
            });
          } else {
            setAvailableColumns([]);
            setColumnsLoaded(false);
          }
        })
        .catch(() => {
          setAvailableColumns([]);
          setColumnsLoaded(false);
        })
        .finally(() => setLoadingColumns(false));
    } else {
      setAvailableColumns([]);
      setColumnsLoaded(false);
    }
  }, [machineId, config.productionTableName, generateQuery]);

  useEffect(() => {
    if (machineId && config.writeMode === 'TABLE' && config.targetDestination) {
      setLoadingTargetColumns(true);
      axios.get(`/api/machine-integration/${machineId}/columns?tableName=${config.targetDestination}`)
        .then(({ data }) => {
          if (data.success) {
            setTargetColumns(data.columns);
          } else {
            setTargetColumns([]);
          }
        })
        .catch(() => setTargetColumns([]))
        .finally(() => setLoadingTargetColumns(false));
    } else {
      setTargetColumns([]);
    }
  }, [machineId, config.writeMode, config.targetDestination]);

  // ─── Scheduler polling: detect when backend auto-ran jobs
  useEffect(() => {
    const isScheduled = config.scheduleEnabled || config.readScheduleEnabled;
    if (!machineId || !isScheduled) {
      clearInterval(pollTimerRef.current);
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/machine-integration/${machineId}/config`);
        if (!data) return;

        // Detect SEND auto-run
        const newLastRun = data.lastRunDate ? new Date(data.lastRunDate).getTime() : null;
        const prevRun = prevLastRunDate.current ? new Date(prevLastRunDate.current).getTime() : null;
        if (newLastRun && newLastRun !== prevRun) {
          const msg = data.lastRunMessage || `Auto job ran at ${new Date(data.lastRunDate).toLocaleTimeString()}`;
          addLog('AUTO_SEND', 'SUCCESS', msg, 'AUTO');
          prevLastRunDate.current = data.lastRunDate;
          setConfig((c) => ({ ...c, lastRunDate: data.lastRunDate, lastRunMessage: data.lastRunMessage }));
        }

        // Detect READ auto-run
        const newReadLastRun = data.readLastRunDate ? new Date(data.readLastRunDate).getTime() : null;
        const prevReadRun = prevReadLastRunDate.current ? new Date(prevReadLastRunDate.current).getTime() : null;
        if (newReadLastRun && newReadLastRun !== prevReadRun) {
          const msg = data.readLastRunMessage || `Auto read ran at ${new Date(data.readLastRunDate).toLocaleTimeString()}`;
          addLog('AUTO_READ', 'SUCCESS', msg, 'AUTO');
          prevReadLastRunDate.current = data.readLastRunDate;
          setConfig((c) => ({ ...c, readLastRunDate: data.readLastRunDate, readLastRunMessage: data.readLastRunMessage }));
        }
      } catch {
        /* ignore poll errors */
      }
    }, 5000);

    return () => clearInterval(pollTimerRef.current);
  }, [config.scheduleEnabled, config.readScheduleEnabled, machineId, addLog]);

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await axios.post(`/api/machine-integration/${machineId}/config`, {
        machineIdRef: machineId,
        ...config,
        customReadQueryEnabled: true,
        readColumns: selectedColumns.join(',')
      });
      return true;
    } catch {
      dispatch(
        openSnackbar({ open: true, message: 'Failed to save configuration', variant: 'alert', alert: { color: 'error' }, close: true })
      );
      return false;
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnStatus(null);
    if (!(await saveConfig())) {
      setTestingConnection(false);
      return;
    }
    try {
      const { data } = await axios.post(`/api/machine-integration/${machineId}/test-connection`);
      setConnStatus(data.success ? 'ok' : 'fail');
      addLog('TEST_CONNECTION', data.success ? 'SUCCESS' : 'FAILED', data.message || (data.success ? 'Connected' : 'Failed'));
      if (data.success) {
        dispatch(
          openSnackbar({ open: true, message: 'Connected Successfully', variant: 'alert', alert: { color: 'success' }, close: true })
        );
        handleLoadTables();
      }
    } catch (e) {
      setConnStatus('fail');
      addLog('TEST_CONNECTION', 'FAILED', e.message);
    } finally {
      setTestingConnection(false);
    }
  };



  const handleReadData = async () => {
    if (!(await saveConfig())) return;
    setReadingData(true);
    try {
      const { data } = await axios.get(`/api/machine-integration/${machineId}/read`);
      if (data.success) {
        setReadData(data.data);
        addLog('READ', 'SUCCESS', `${data.data.length} record(s) retrieved`);
      }
    } catch (e) {
      addLog('READ', 'FAILED', e.response?.data?.message || e.message);
    } finally {
      setReadingData(false);
    }
  };

  const handlePreviewSendData = async () => {
    if (!(await saveConfig())) return;
    setReadingData(true);
    try {
      const { data } = await axios.get(`/api/machine-integration/${machineId}/preview-send`);
      if (data.success) {
        setSendData(data.data);
        addLog('PREVIEW_SEND', 'SUCCESS', `Retrieved ${data.data.length} row(s) from local DB for send preview`);
      }
    } catch (e) {
      addLog('PREVIEW_SEND', 'FAILED', e.response?.data?.message || e.message);
    } finally {
      setReadingData(false);
    }
  };

  const handleRunJob = async () => {
    if (!(await saveConfig())) return;
    setRunningJob(true);
    try {
      const { data } = await axios.post(`/api/machine-integration/${machineId}/run-job`);
      if (data.success) {
        addLog('SEND_JOB', 'SUCCESS', data.message);
        dispatch(openSnackbar({ open: true, message: data.message, variant: 'alert', alert: { color: 'success' }, close: true }));
        try {
          const previewRes = await axios.get(`/api/machine-integration/${machineId}/preview-send`);
          if (previewRes.data?.success) {
            setSendData(previewRes.data.data);
          }
        } catch {
          /* ignore preview error post-run */
        }
      }
    } catch (e) {
      addLog('SEND_JOB', 'FAILED', e.response?.data?.message || e.message);
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Job failed',
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
    } finally {
      setRunningJob(false);
    }
  };

  const handleResetHistory = async () => {
    if (!window.confirm('Are you sure you want to reset sync history? Next run will read and send all data again.')) return;
    try {
      const { data } = await axios.post(`/api/machine-integration/${machineId}/reset-history`);
      if (data.success) {
        addLog('RESET_HISTORY', 'SUCCESS', 'Sync history reset successfully.');
        dispatch(
          openSnackbar({ open: true, message: data.message, variant: 'alert', alert: { color: 'success' }, close: true })
        );
      }
    } catch (e) {
      dispatch(
        openSnackbar({
          open: true,
          message: e.response?.data?.message || 'Failed to reset sync history',
          variant: 'alert',
          alert: { color: 'error' },
          close: true
        })
      );
    }
  };

  if (!machineId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="textSecondary">Please save the machine first to configure integration.</Typography>
      </Box>
    );
  }

  return (
    <Box  >
      <Grid container spacing={2}>
        {/* ═══════════════════════════════════════════════════
            SECTION 1 — Machine DB Connection
        ═══════════════════════════════════════════════════ */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <IconPlugConnected size={16} color={theme.palette.primary.main} />
              <Typography variant="subtitle2" fontWeight={700}>
                Machine Database Connection
              </Typography>
            </Stack>
            <Grid container spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
              <Grid item xs={6} md={2}>
                <BOSTextField
                  label="DB Type"
                  select
                  value={config.dbType || 'MS SQL Server'}
                  size="small"
                  onChange={handleConfigChange('dbType')}
                  fullWidth
                >
                  <MenuItem value="MS SQL Server">MS SQL Server</MenuItem>
                  <MenuItem value="MySQL">MySQL</MenuItem>
                  <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
                  <MenuItem value="Oracle">Oracle</MenuItem>
                </BOSTextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <BOSTextField label="Host / IP" value={config.dbHost} size="small" onChange={handleConfigChange('dbHost')} />
              </Grid>
              <Grid item xs={4} md={1}>
                <BOSTextField label="Port" value={config.dbPort} size="small" onChange={handleConfigChange('dbPort')} />
              </Grid>
              <Grid item xs={8} md={2}>
                <BOSTextField label="Database" value={config.databaseName} size="small" onChange={handleConfigChange('databaseName')} />
              </Grid>
              <Grid item xs={6} md={1.5}>
                <BOSTextField label="Username" value={config.dbUsername} size="small" onChange={handleConfigChange('dbUsername')} />
              </Grid>
              <Grid item xs={6} md={1.5}>
                <BOSTextField
                  label="Password"
                  type="password"
                  value={config.dbPassword}
                  size="small"
                  onChange={handleConfigChange('dbPassword')}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <BOSTextField
                  label="Log File Folder Path"
                  value={config.fileLogPath || ''}
                  size="small"
                  onChange={handleConfigChange('fileLogPath')}
                  placeholder="e.g. D:\Logs"
                />
              </Grid>

              <Grid item xs={12} sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 0.5 }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  onClick={handleTestConnection}
                  disabled={anyLoading}
                  startIcon={testingConnection ? <CircularProgress size={14} color="inherit" /> : <IconDatabase size={14} />}
                >
                  {testingConnection ? 'Connecting...' : 'Test & Save'}
                </Button>
                {connStatus === 'ok' && <BOSStatusChip status="Active" label="● Connected" />}
                {connStatus === 'fail' && <BOSStatusChip status="Inactive" label="● Connection Failed" />}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — Read Configuration
        ═══════════════════════════════════════════════════ */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            {/* ── Section Header ── */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <IconDownload size={16} color={theme.palette.secondary.main} />
              <Typography variant="subtitle2" fontWeight={700}>
                Read Configuration
              </Typography>
              <Typography variant="caption" color="textSecondary">
                (from Machine DB)
              </Typography>
            </Stack>

            <Grid container spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
              <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '43%' } }}>
                <Autocomplete
                  fullWidth
                  freeSolo
                  options={tables}
                  loading={loadingTables}
                  value={config.productionTableName || ''}
                  onChange={(event, newValue) => {
                    const tbl = newValue || '';
                    if (tbl !== config.productionTableName) {
                      setSelectedColumns([]);
                      setAvailableColumns([]);
                      setColumnsLoaded(false);
                      const newQuery = generateQuery([], tbl);
                      setConfig(prev => ({ ...prev, productionTableName: tbl, readSqlQuery: newQuery }));
                    }
                  }}
                  onInputChange={(event, newInputValue) => {
                    const tbl = newInputValue || '';
                    if (tbl !== config.productionTableName) {
                      setSelectedColumns([]);
                      setAvailableColumns([]);
                      setColumnsLoaded(false);
                      const newQuery = generateQuery([], tbl);
                      setConfig(prev => ({ ...prev, productionTableName: tbl, readSqlQuery: newQuery }));
                    }
                  }}
                  renderInput={(params) => (
                    <BOSTextField
                      {...params}
                      label="Readable Table Name"
                      placeholder="e.g. MACHINE_PROD"
                      fullWidth
                    />
                  )}
                />
              </Grid>

              {/* ── Row 3: Auto Read Scheduler ── */}
              <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '55%' } }}>
                <SchedulerRow
                  label="Auto Read"
                  enabled={config.readScheduleEnabled}
                  interval={config.readScheduleIntervalSeconds}
                  lastRun={config.readLastRunDate}
                  onEnabledChange={handleReadScheduleEnabledChange}
                  onIntervalChange={handleReadScheduleIntervalChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 2, width: '100%' }}>

              {/* ── Row 2: Column Selector (left) + SQL Query (right) ── */}
              <Grid item xs={12} md={6} sx={{ mt: 2, width: { xs: '100%', md: '45%' } }}>
                {!columnsLoaded ? (
                  <Box
                    sx={{
                      height: 212,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 1.5,
                      color: 'text.disabled'
                    }}
                  >
                    {loadingColumns ? (
                      <>
                        <CircularProgress size={24} color="inherit" />
                        <Typography variant="caption">Loading columns...</Typography>
                      </>
                    ) : (
                      <>
                        <IconDownload size={24} opacity={0.3} />
                        <Typography variant="caption">Select a valid table to load columns</Typography>
                      </>
                    )}
                  </Box>
                ) : (
                  <ColumnSelector available={availableColumns} selected={selectedColumns} onChange={handleColumnChange} />
                )}
              </Grid>

              <Grid item xs={12} md={6} sx={{ mt: 2, width: { xs: '100%', md: '50%' } }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5, width: '100%' }}>
                  <IconCode size={13} color={theme.palette.text.secondary} />
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>
                    SQL SELECT Query (runs on Machine DB)
                  </Typography>
                </Stack>
                <BOSTextField
                  multiline
                  rows={8}
                  size="small"
                  fullWidth
                  value={config.readSqlQuery || ''}
                  onChange={handleConfigChange('readSqlQuery')}
                  placeholder="SELECT * FROM ****** WHERE ******* = '**'"
                  sx={{
                    '& textarea': {
                      fontFamily: 'monospace',
                      fontSize: 11,
                      lineHeight: 1.4,
                      color: 'primary.main'
                    }
                  }}
                />

                {/* ── Row 4: Read Now button ── */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    size="small"
                    onClick={handleReadData}
                    disabled={anyLoading}
                    startIcon={readingData ? <CircularProgress size={14} color="inherit" /> : <IconDownload size={14} />}
                  >
                    {readingData ? 'Reading...' : 'Read Now from Machine DB'}
                  </Button>
                </Grid>
              </Grid>





              {/* Data Preview */}
              {readData.length > 0 && (
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <DataPreviewTable data={readData} title="Read Data" />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — Send Configuration
        ═══════════════════════════════════════════════════ */}
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <IconSend size={16} color={theme.palette.warning.main} />
              <Typography variant="subtitle2" fontWeight={700}>
                Send Configuration
              </Typography>
              <Typography variant="caption" color="textSecondary">
                (Our DB → Machine)
              </Typography>
            </Stack>

            <Grid container spacing={1.5} sx={{ width: '100%' }}>
              {/* Write Mode + Target in one row */}
              <Grid item xs={12} sx={{ width: { xs: '100%', md: '50%' } }}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Grid container spacing={1.5} alignItems="center" sx={{ width: '100%' }}>

                    <Typography variant="caption" color="textSecondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                      Write Output To
                    </Typography>

                    <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '45%' } }}>
                      <RadioGroup row value={config.writeMode || 'TABLE'} onChange={handleConfigChange('writeMode')}>
                        <FormControlLabel
                          value="TABLE"
                          control={<Radio size="small" />}
                          label={<Typography variant="caption">Mach. DB Table</Typography>}
                          sx={{ mr: 1 }}
                        />
                        <FormControlLabel
                          value="FILE"
                          control={<Radio size="small" />}
                          label={<Typography variant="caption">JSON File</Typography>}
                        />
                      </RadioGroup>
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '48%' } }}>
                      {config.writeMode === 'FILE' ? (
                        <BOSTextField
                          size="small"
                          fullWidth
                          label="File Path (on server)"
                          value={config.targetDestination || ''}
                          onChange={handleConfigChange('targetDestination')}
                          placeholder="D:\\Output\\machine.json"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconFileText size={13} />
                              </InputAdornment>
                            )
                          }}
                        />
                      ) : (
                        <Autocomplete
                          freeSolo
                          options={tables}
                          loading={loadingTables}
                          value={config.targetDestination || ''}
                          onChange={(event, newValue) => {
                            setConfig(prev => ({ ...prev, targetDestination: newValue || '' }));
                          }}
                          onInputChange={(event, newInputValue) => {
                            setConfig(prev => ({ ...prev, targetDestination: newInputValue || '' }));
                          }}
                          renderInput={(params) => (
                            <BOSTextField
                              {...params}
                              label="Target Table Name"
                              placeholder="e.g. UOM_MASTER"
                              size="small"
                              fullWidth
                              InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <IconTable size={13} />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                )
                              }}
                            />
                          )}
                        />
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Auto Send Scheduler */}
              <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' } }}>
                <SchedulerRow
                  label="Auto Send"
                  enabled={config.scheduleEnabled}
                  interval={config.scheduleIntervalSeconds}
                  lastRun={config.lastRunDate}
                  onEnabledChange={handleScheduleEnabledChange}
                  onIntervalChange={handleScheduleIntervalChange}
                />

                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      size="small"
                      onClick={saveConfig}
                      disabled={anyLoading}
                      startIcon={savingConfig ? <CircularProgress size={14} color="inherit" /> : null}
                    >
                      {savingConfig ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      fullWidth
                      size="small"
                      onClick={handlePreviewSendData}
                      disabled={anyLoading}
                      startIcon={readingData ? <CircularProgress size={14} color="inherit" /> : <IconEye size={14} />}
                    >
                      {readingData ? 'Loading...' : 'Preview '}
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      size="small"
                      onClick={handleRunJob}
                      disabled={anyLoading}
                      startIcon={runningJob ? <CircularProgress size={13} color="inherit" /> : <IconPlayerPlay size={13} />}
                    >
                      {runningJob ? 'Running...' : 'Run  Now'}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>

              <Grid item xs={12} sx={{ width: { xs: '100%', md: '50%' }, mt: 0.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <IconTable size={14} color={theme.palette.text.secondary} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    Target Table Structure ({config.targetDestination})
                  </Typography>
                  {loadingTargetColumns && <CircularProgress size={10} />}
                </Stack>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 1, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1, bgcolor: 'grey.50' }}>
                  {targetColumns.map((col, idx) => (
                    <Chip
                      key={col}
                      label={`${idx + 1}. ${col}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ fontSize: 9, height: 20, fontFamily: 'monospace', bgcolor: 'background.paper' }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* SQL Query */}
              <Grid item xs={12} sx={{ width: { xs: '100%', md: '45%' } }}>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5, width: '100%' }}>
                  <IconCode size={13} color={theme.palette.text.secondary} />
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>
                    SQL SELECT Query (runs on Our DB)
                  </Typography>
                </Stack>
                <BOSTextField
                  multiline
                  rows={10}
                  size="small"
                  fullWidth
                  value={config.sendSqlQuery || ''}
                  onChange={handleConfigChange('sendSqlQuery')}
                  placeholder="SELECT * FROM XXXXXXXX WHERE XXXXX = XX"
                  sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 12 } }}
                />
              </Grid>



              {/* Send Data Preview (last run result) */}
              {sendData.length > 0 && (
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <DataPreviewTable data={sendData} title="Last Sent Data" />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid >

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — Integration Log
        ═══════════════════════════════════════════════════ */}
        < Grid item xs={12} sx={{ width: '100%' }
        }>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <IconClock size={16} color={theme.palette.text.secondary} />
              <Typography variant="subtitle2" fontWeight={700}>
                Integration Log
              </Typography>
              {logs.length > 0 && <Chip label={logs.length} size="small" color="primary" sx={{ fontSize: 10, height: 18 }} />}
              <Box sx={{ ml: 'auto' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {(config.scheduleEnabled || config.readScheduleEnabled) && (
                    <Chip
                      icon={<IconClock size={11} />}
                      label="Auto Polling Active"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 20 }}
                    />
                  )}
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleResetHistory}
                    startIcon={<IconRefresh size={12} />}
                    sx={{ height: 20, fontSize: 10, py: 0 }}
                  >
                    Reset Sync History
                  </Button>
                </Stack>
              </Box>
            </Stack>
            <LogTable logs={logs} />
          </Paper>
        </Grid >
      </Grid >
    </Box >
  );
}
