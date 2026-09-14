import { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Stack,
  Grid,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  MenuItem,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  IconSearch,
  IconRefresh,
  IconPrinter,
  IconPlus,
  IconX,
  IconUser,
  IconMail
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSTextField, BOSDatePicker, BOSStatusChip } from 'ui-component/bos';

// Color utilities
// Color utilities are handled by BOSStatusChip

export default function CustomerSatisfactionPanel() {
  const dispatch = useDispatch();

  // Filters State
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [considerDate, setConsiderDate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [stats, setStats] = useState({
    totalFeedback: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    closed: 0,
    averageScore: 0.0,
    satisfactionIndex: 0.0
  });
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [responses, setResponses] = useState([]);
  const [responsesLoading, setResponsesLoading] = useState(false);

  // FIFO Run Modal State
  const [fifoOpen, setFifoOpen] = useState(false);
  const [fifoCycle, setFifoCycle] = useState(new Date().toISOString().slice(0, 7)); // yyyy-MM
  const [fifoLoading, setFifoLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        fromDate,
        toDate,
        considerDate,
        status: statusFilter,
        search: searchQuery || null
      };

      const summaryRes = await axios.get('/api/customer-satisfaction/customer-feedback/summary', { params });
      setStats(summaryRes.data || {});

      const mappingsRes = await axios.get('/api/customer-satisfaction/customer-feedback/mappings', { params });
      setMappings(mappingsRes.data || []);
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error loading customer feedback data.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fromDate, toDate, considerDate, statusFilter, searchQuery]);

  const handleOpenDetail = async (record) => {
    setSelectedRecord(record);
    setDetailOpen(true);
    setResponsesLoading(true);
    try {
      const res = await axios.get(`/api/customer-satisfaction/customer-feedback/responses?mappingId=${record.id}`);
      setResponses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setResponsesLoading(false);
    }
  };

  const handleRunFifo = async () => {
    setFifoLoading(true);
    try {
      const res = await axios.post(`/api/customer-satisfaction/customer-feedback/trigger-auto-assign?cycle=${fifoCycle}`);
      dispatch(
        openSnackbar({
          open: true,
          message: `FIFO assignment completed. Assigned ${res.data.assignedCount || 0} customers (Capped at 500).`,
          variant: 'alert',
          severity: 'success'
        })
      );
      setFifoOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Error triggering FIFO assignment.',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setFifoLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-satisfaction-report').innerHTML;
    const printWindow = window.open('', '_blank');
    const style = `
      <style>
        body { font-family: 'Segoe UI', Roboto, sans-serif; padding: 25px; color: #333; }
        h2 { border-bottom: 2px solid #00796b; padding-bottom: 10px; color: #004d40; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background-color: #f5f5f5; font-weight: bold; }
      </style>
    `;
    printWindow.document.write('<html><head><title>Customer Feedback Report</title>' + style + '</head><body>' + printContent + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Stack spacing={3}>
      {/* Top Actions & Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Customer Satisfaction Feedback Module
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<IconPlus size={18} />}
          onClick={() => setFifoOpen(true)}
        >
          Run FIFO Auto-Assignment
        </Button>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        {[
          { label: 'Feedback Completed', value: stats.completed, color: '#4caf50' },
          { label: 'Feedback Pending', value: stats.pending, color: '#ef6c00' },
          { label: 'Feedback Overdue', value: stats.overdue, color: '#f44336' },
          { label: 'Satisfaction Index', value: `${stats.averageScore?.toFixed(1) || '0'}%`, color: '#00796b' }
        ].map((kpi, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderLeft: `5px solid ${kpi.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ py: 2, px: 3 }}>
                <Typography variant="subtitle2" color="textSecondary" sx={{ fontWeight: 'bold' }}>{kpi.label}</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: kpi.color, mt: 0.5 }}>{kpi.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Advanced Filters */}
      <Card variant="outlined" sx={{ p: 2.5, borderRadius: '8px', bgcolor: 'background.paper' }}>
        <Grid container spacing={2.5} alignItems="center">
          <Grid item xs={12} sm={3}>
            <BOSDatePicker
              name="fromDate"
              label="From Date (Mail)"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              highlightHolidays={false}
              blockHolidays={false}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <BOSDatePicker
              name="toDate"
              label="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              highlightHolidays={false}
              blockHolidays={false}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={considerDate}
                  onChange={(e) => setConsiderDate(e.target.checked)}
                  color="primary"
                />
              }
              label="Consider Date"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <BOSTextField
              select
              fullWidth
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Overdue">Overdue</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </BOSTextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <BOSTextField
              fullWidth
              size="small"
              placeholder="Search Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={16} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Audit Grid */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer Code</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Send Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Feedback Submit Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Satisfaction Score</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
            ) : mappings.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No customer mappings found.</TableCell></TableRow>
            ) : (
              mappings.map((row) => {
                const scoreValue = Math.round(parseFloat(row.averageScore || '0'));
                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{row.customerCode}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>
                      <BOSStatusChip status={row.status} showIcon={true} width={120} />
                    </TableCell>
                    <TableCell>{row.sendDate ? new Date(row.sendDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{row.submitDate ? new Date(row.submitDate).toLocaleString() : '-'}</TableCell>
                    <TableCell align="center">
                      {row.status === "Completed" ? (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: '#e8f5e9',
                            border: '2px solid #2e7d32',
                            color: '#2e7d32',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          {scoreValue}%
                        </Box>
                      ) : (
                        <Typography sx={{ color: 'text.secondary' }}>-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" onClick={() => handleOpenDetail(row)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Details Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', py: 2 }}>
          <Typography variant="h4" sx={{ color: 'primary.dark', fontWeight: 800 }}>
            Customer Survey Detail Report
          </Typography>
          <IconButton onClick={() => setDetailOpen(false)} size="small">
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box id="printable-satisfaction-report">
            <h2>Satisfaction Survey Report (Customer Profile)</h2>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                <Typography variant="body2"><strong>Customer Code:</strong> {selectedRecord?.customerCode}</Typography>
                <Typography variant="body2"><strong>Customer Name:</strong> {selectedRecord?.customerName}</Typography>
                <Typography variant="body2"><strong>Feedback Cycle:</strong> {selectedRecord?.feedbackCycle}</Typography>
              </Box>
              <Box>
                <Typography variant="body2"><strong>Total Score:</strong> {selectedRecord?.totalScore}</Typography>
                <Typography variant="body2"><strong>Average Index:</strong> {selectedRecord?.averageScore}%</Typography>
                <Typography variant="body2"><strong>Submission Status:</strong> {selectedRecord?.status}</Typography>
              </Box>
            </Box>
            <Divider />

            <Table sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Satisfaction Questions</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Comments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responsesLoading ? (
                  <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : (
                  responses.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{r.questionCriteria}</TableCell>
                      <TableCell>{r.rating}</TableCell>
                      <TableCell align="center">{r.score}</TableCell>
                      <TableCell>{r.comments || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {selectedRecord?.generalComments && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>General Remarks / Comments</Typography>
                <Typography variant="body2" sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: '4px' }}>
                  {selectedRecord.generalComments}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" startIcon={<IconPrinter size={16} />} onClick={handlePrint}>Print / Export PDF</Button>
          <Button variant="contained" onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Run FIFO dialog */}
      <Dialog open={fifoOpen} onClose={() => setFifoOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ bgcolor: 'primary.light', py: 2 }}>
          <Typography variant="h4" sx={{ color: 'primary.dark', fontWeight: 800 }}>Trigger FIFO Assignment</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <BOSTextField
            fullWidth
            label="Feedback Cycle (yyyy-MM)"
            value={fifoCycle}
            onChange={(e) => setFifoCycle(e.target.value)}
            sx={{ mt: 1.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setFifoOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={fifoLoading}
            onClick={handleRunFifo}
          >
            {fifoLoading ? <CircularProgress size={16} color="inherit" /> : 'Run Trigger'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
