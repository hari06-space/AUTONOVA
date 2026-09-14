import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  Stack,
  Tooltip,
  Alert,
  Checkbox,
  CircularProgress
} from '@mui/material';
import {
  IconPlus,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconFilter,
  IconChecklist,
  IconAlertCircle
} from '@tabler/icons-react';
import MainCard from '../../../ui-component/cards/MainCard';
import OtMasterDialog from './OtMasterDialog';
import BOSEmployeeAutocomplete from '../../../ui-component/bos/BOSEmployeeAutocomplete';
import axios from 'axios';

const OtMasterList = () => {
  const [tabValue, setTabValue] = useState(0); // 0 = Register, 1 = Verification Queue
  const [loading, setLoading] = useState(false);
  const [otRecords, setOtRecords] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedPendingIds, setSelectedPendingIds] = useState([]);

  // Date Range Filters (Rule 33)
  const [fromDate, setFromDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [considerDate, setConsiderDate] = useState(true);
  const [filterEmployeeId, setFilterEmployeeId] = useState(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (considerDate) {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }
      if (filterEmployeeId) {
        params.employeeId = filterEmployeeId;
      }

      const res = await axios.get('/api/hra/ot-master/list', { params });
      if (Array.isArray(res.data)) {
        setOtRecords(res.data);
      }

      // Fetch Pending Verifications
      const verRes = await axios.get('/api/hra/ot-master/pending-verifications');
      if (Array.isArray(verRes.data)) {
        setPendingVerifications(verRes.data);
      }
    } catch (err) {
      console.error('Error loading OT records:', err);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, considerDate, filterEmployeeId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleVerify = async (otId, action, rejectReason = '') => {
    try {
      await axios.post('/api/hra/ot-master/verify', { otId, action, rejectReason });
      fetchRecords();
    } catch (err) {
      console.error('Error verifying OT record:', err);
    }
  };

  const handleBatchVerify = async (action) => {
    if (selectedPendingIds.length === 0) return;
    try {
      await axios.post('/api/hra/ot-master/verify', { ids: selectedPendingIds, action });
      setSelectedPendingIds([]);
      fetchRecords();
    } catch (err) {
      console.error('Error batch verifying OT records:', err);
    }
  };

  const renderStatusChip = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('VERIFIED')) {
      return <Chip label="VERIFIED" color="success" size="small" sx={{ fontWeight: 700 }} />;
    } else if (s.includes('REJECTED')) {
      return <Chip label="REJECTED" color="error" size="small" sx={{ fontWeight: 700 }} />;
    } else {
      return <Chip label="PENDING TO VERIFY" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  const minutesToHHMM = (mins) => {
    if (!mins) return '00:00';
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  return (
    <MainCard
      pageCode="HA1130"
      title="Overtime (OT) Master"
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            startIcon={<IconRefresh size={16} />}
            onClick={fetchRecords}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconPlus size={16} />}
            onClick={() => {
              setSelectedRecord(null);
              setDialogOpen(true);
            }}
            size="small"
          >
            Add OT Entry
          </Button>
        </Stack>
      }
    >
      <Box sx={{ width: '100%' }}>
        {/* Top Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
            <Tab icon={<IconClock size={18} />} iconPosition="start" label="OT Register & Entry" />
            <Tab
              icon={<IconChecklist size={18} />}
              iconPosition="start"
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>OT Verification Queue</span>
                  {pendingVerifications.length > 0 && (
                    <Chip label={pendingVerifications.length} color="warning" size="small" sx={{ height: 20, fontSize: 11 }} />
                  )}
                </Stack>
              }
            />
          </Tabs>
        </Box>

        {/* TAB 0: OT REGISTER & ENTRY */}
        {tabValue === 0 && (
          <Box>
            {/* Filter Bar (Rule 33 & Rule 37) */}
            <Card sx={{ p: 2, mb: 2.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <BOSEmployeeAutocomplete
                    label="Filter by Employee"
                    value={filterEmployeeId}
                    onChange={(emp) => setFilterEmployeeId(emp ? emp.id || emp.employeeId : null)}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="From Date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    disabled={!considerDate}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="To Date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    disabled={!considerDate}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControlLabel
                    control={<Switch checked={considerDate} onChange={(e) => setConsiderDate(e.target.checked)} color="primary" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Consider Date Filter: {considerDate ? 'Yes' : 'No'}
                      </Typography>
                    }
                  />
                </Grid>
                <Grid item xs={6} sm={2} sx={{ textAlign: 'right' }}>
                  <Button variant="contained" color="secondary" startIcon={<IconFilter size={16} />} onClick={fetchRecords} fullWidth>
                    Apply Filter
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* OT Data Table */}
            <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>OT Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration (HH:MM)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Minutes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : otRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">No Overtime (OT) records found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    otRecords.map((row, index) => (
                      <TableRow key={row.id || index} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{row.employeeName || '-'}</TableCell>
                        <TableCell>{row.employeeCode || '-'}</TableCell>
                        <TableCell>{row.otDate ? new Date(row.otDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{minutesToHHMM(row.durationMinutes)}</TableCell>
                        <TableCell>{row.durationMinutes || 0} mins</TableCell>
                        <TableCell>{renderStatusChip(row.verificationStatus || row.statusName)}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.remarks || '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setSelectedRecord(row);
                              setDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TAB 1: OT VERIFICATION QUEUE (HOD VIEW) */}
        {tabValue === 1 && (
          <Box>
            {pendingVerifications.length > 0 && (
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<IconCheck size={16} />}
                  disabled={selectedPendingIds.length === 0}
                  onClick={() => handleBatchVerify('APPROVE')}
                >
                  Approve Selected ({selectedPendingIds.length})
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<IconX size={16} />}
                  disabled={selectedPendingIds.length === 0}
                  onClick={() => handleBatchVerify('REJECT')}
                >
                  Reject Selected ({selectedPendingIds.length})
                </Button>
              </Stack>
            )}

            <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedPendingIds.length > 0 && selectedPendingIds.length < pendingVerifications.length
                        }
                        checked={
                          pendingVerifications.length > 0 && selectedPendingIds.length === pendingVerifications.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPendingIds(pendingVerifications.map((item) => item.id));
                          } else {
                            setSelectedPendingIds([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>OT Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hours (HH:MM)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Minutes</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      HOD Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingVerifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No pending OT verifications in your queue.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingVerifications.map((row) => {
                      const isChecked = selectedPendingIds.includes(row.id);
                      return (
                        <TableRow key={row.id} hover selected={isChecked}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPendingIds((p) => [...p, row.id]);
                                } else {
                                  setSelectedPendingIds((p) => p.filter((id) => id !== row.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{row.employeeName || '-'}</TableCell>
                          <TableCell>{row.employeeCode || '-'}</TableCell>
                          <TableCell>{row.otDate ? new Date(row.otDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{minutesToHHMM(row.durationMinutes)}</TableCell>
                          <TableCell>{row.durationMinutes || 0} mins</TableCell>
                          <TableCell>{row.remarks || '-'}</TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<IconCheck size={14} />}
                                onClick={() => handleVerify(row.id, 'APPROVE')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<IconX size={14} />}
                                onClick={() => handleVerify(row.id, 'REJECT')}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>

      {/* Entry/Edit Dialog */}
      <OtMasterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initialData={selectedRecord}
        onSaveSuccess={() => fetchRecords()}
      />
    </MainCard>
  );
};

export default OtMasterList;
