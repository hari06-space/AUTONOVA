import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import {
  Grid,
  Typography,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  useTheme,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Paper
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import { IconReportMoney, IconAlertCircle, IconCalendarEvent, IconUsers } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';

const FinanceOutstandingReport = () => {
  const [outstandings, setOutstandings] = useState([]);
  const [summary, setSummary] = useState({ totalOutstanding: 0, overdueAmount: 0, dueToday: 0, totalParties: 0 });
  const [aging, setAging] = useState({ current: 0, days30: 0, days60: 0, days90: 0, daysOver90: 0 });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const dispatch = useDispatch();
  const filters = useSelector((state) => state.search?.filters || {});

  useEffect(() => {
    const config = [
      { id: 'asOnDate', label: 'As On Date', type: 'date', isStarred: true, defaultValue: new Date().toISOString().split('T')[0] },
      { id: 'partyId', label: 'Party ID / Name', type: 'text', isStarred: true },
      { id: 'billNo', label: 'Bill No', type: 'text', isStarred: true },
      { id: 'dueDate', label: 'Due Date (<=)', type: 'date', isStarred: true },
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'OUTSTANDING', label: 'Outstanding' },
          { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
          { value: 'PAID', label: 'Paid' },
          { value: 'OVERDUE', label: 'Overdue' }
        ],
        defaultValue: 'OUTSTANDING',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => { dispatch(setFilterConfig(null)); };
  }, [dispatch]);

  const [selectedBill, setSelectedBill] = useState(null);
  const [history, setHistory] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const fetchOutstandings = async () => {
    try {
      let url = `/api/finance/outstanding/report?page=${page}&size=${rowsPerPage}`;
      let sumUrl = `/api/finance/outstanding/report/summary?`;
      let agingUrl = `/api/finance/outstanding/report/aging?`;

      const queryParams = new URLSearchParams();
      if (filters.asOnDate) queryParams.append('asOnDate', filters.asOnDate);
      if (filters.dueDate) queryParams.append('dueDate', filters.dueDate);
      if (filters.partyId) queryParams.append('partyId', filters.partyId);
      if (filters.billNo) queryParams.append('billNo', filters.billNo);
      if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);

      if (queryParams.toString()) {
        url += `&${queryParams.toString()}`;
        sumUrl += queryParams.toString();
        agingUrl += queryParams.toString();
      }

      const [res, sumRes, agingRes] = await Promise.all([
        axios.get(url),
        axios.get(sumUrl),
        axios.get(agingUrl)
      ]);

      if (res.data) {
        setOutstandings(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      }
      if (sumRes.data) {
        setSummary(sumRes.data);
      }
      if (agingRes.data) {
        setAging(agingRes.data);
      }
    } catch (error) {
      console.error('Error fetching outstandings:', error);
    }
  };

  useEffect(() => {
    fetchOutstandings();
  }, [page, rowsPerPage, filters]);

  const theme = useTheme();

  const handleRowClick = async (bill) => {
    setSelectedBill(bill);
    setOpenModal(true);
    try {
      const res = await axios.get(`/api/finance/outstanding/${bill.id}/history`);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formatMoney = (amt) => (amt || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  const columns = useMemo(() => [
    { id: 'partyName', label: 'Party', minWidth: 200, bold: true },
    { id: 'partyBillNo', label: 'Bill No', minWidth: 120, render: (r) => r.partyBillNo || 'On Account' },
    { id: 'partyBillDate', label: 'Bill Date', minWidth: 120, type: 'date' },
    { id: 'dueDate', label: 'Due Date', minWidth: 120, type: 'date' },
    { id: 'billAmount', label: 'Bill Amount', minWidth: 130, type: 'number', align: 'right' },
    { id: 'settledAmount', label: 'Settled Amount', minWidth: 130, type: 'number', align: 'right', sx: { color: 'success.main' } },
    { id: 'balanceAmount', label: 'Balance', minWidth: 130, type: 'number', align: 'right', bold: true, sx: { color: 'error.main' } },
    { id: 'daysOutstanding', label: 'Days O/S', minWidth: 100, type: 'number', align: 'center' },
    {
      id: 'status', label: 'Status', minWidth: 120, align: 'center',
      render: (row) => (
        <Chip
          label={row.status}
          size="small"
          sx={{
            bgcolor: row.status === 'PAID' ? 'success.light' : row.status === 'OVERDUE' ? 'error.light' : row.status === 'PARTIALLY_PAID' ? 'warning.light' : 'primary.light',
            color: row.status === 'PAID' ? 'success.dark' : row.status === 'OVERDUE' ? 'error.dark' : row.status === 'PARTIALLY_PAID' ? 'warning.dark' : 'primary.dark',
            fontWeight: 'bold'
          }}
        />
      )
    }
  ], []);

  // Summary Card Helper Component
  const MetricCard = ({ title, value, icon, color, gradient }) => (
    <Card sx={{
      p: 2.5,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: gradient || theme.palette.background.paper,
      color: gradient ? '#fff' : theme.palette.text.primary,
      boxShadow: theme.shadows[3],
      borderRadius: 2,
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
    }}>
      <Box>
        <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 0.5 }}>{title}</Typography>
        <Typography variant="h3" color="inherit">{value}</Typography>
      </Box>
      <Box sx={{
        p: 1.5,
        borderRadius: '50%',
        bgcolor: gradient ? 'rgba(255,255,255,0.2)' : alpha(theme.palette[color].main, 0.1),
        color: gradient ? '#fff' : theme.palette[color].main,
        display: 'flex'
      }}>
        {icon}
      </Box>
    </Card>
  );

  return (
    <MainCard
      title="Finance Outstanding Report"
      content={false}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchOutstandings}
          exportData={outstandings}
          exportFilename="Finance_Outstanding"
          columns={columns}
        />
      }
    >
      {/* Sticky Filter Bar Removed */}

      <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="stretch" sx={{ width: '100%' }}>
          {/* Left Side: 50% for Metric Cards */}
          <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '50%' } }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
              <Grid item xs={6}>
                <MetricCard title="Total Outstanding" value={formatMoney(summary.totalOutstanding)} color="error" icon={<IconReportMoney size={28} />} />
              </Grid>
              <Grid item xs={6}>
                <MetricCard title="Overdue Amount" value={formatMoney(summary.overdueAmount)} color="error" gradient={`linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`} icon={<IconAlertCircle size={28} />} />
              </Grid>
              <Grid item xs={6}>
                <MetricCard title="Due Today" value={formatMoney(summary.dueToday)} color="warning" icon={<IconCalendarEvent size={28} />} />
              </Grid>
              <Grid item xs={6}>
                <MetricCard title="Total Parties" value={summary.totalParties} color="primary" icon={<IconUsers size={28} />} />
              </Grid>
            </Grid>
          </Grid>

          {/* Right Side: 50% for Aging Buckets */}
          <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '48%' } }}>
            <Card sx={{ p: 2, boxShadow: theme.shadows[1], borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Outstanding Aging</Typography>
              <Grid container spacing={2} sx={{ flexGrow: 1, alignItems: 'center', width: '100%' }}>
                {[
                  { label: 'Current', val: aging.current, color: 'success' },
                  { label: '1-30 Days', val: aging.days30, color: 'primary' },
                  { label: '31-60 Days', val: aging.days60, color: 'warning' },
                  { label: '61-90 Days', val: aging.days90, color: 'warning' },
                  { label: '90+ Days', val: aging.daysOver90, color: 'error' },
                ].map((b, i) => (
                  <Grid item xs={6} sm={4} lg={2.4} key={i}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette[b.color].main, 0.05),
                      border: '1px solid',
                      borderColor: alpha(theme.palette[b.color].main, 0.2),
                      textAlign: 'center',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, whiteSpace: 'nowrap' }}>{b.label}</Typography>
                      <Typography variant="subtitle2" sx={{ color: theme.palette[b.color].main, fontWeight: 'bold' }}>{formatMoney(b.val)}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <BOSDataTable
        columns={columns}
        rows={outstandings}
        page={page}
        size={rowsPerPage}
        totalRows={totalElements}
        onPageChange={setPage}
        onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
        onRowClick={handleRowClick}
      />

      {/* Settlement History Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Settlement History - {selectedBill?.partyBillNo || 'On Account'}</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Card variant="outlined" sx={{ mb: 2, p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={4}><Typography variant="subtitle2">Bill Amount:</Typography> {formatMoney(selectedBill.billAmount)}</Grid>
                <Grid item xs={4}><Typography variant="subtitle2">Settled:</Typography> {formatMoney(selectedBill.settledAmount)}</Grid>
                <Grid item xs={4}><Typography variant="subtitle2">Balance:</Typography> <Typography color="error" component="span">{formatMoney(selectedBill.balanceAmount)}</Typography></Grid>
                <Grid item xs={4}><Typography variant="subtitle2">Party:</Typography> {selectedBill.partyName}</Grid>
                <Grid item xs={4}><Typography variant="subtitle2">Status:</Typography> {selectedBill.status}</Grid>
              </Grid>
            </Card>
          )}

          <Typography variant="h6" gutterBottom>Transactions</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Voucher</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.transDate).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.transType}</TableCell>
                    <TableCell>{tx.vrNo}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>{tx.drAmt > 0 ? tx.drAmt : '-'}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>{tx.crAmt > 0 ? tx.crAmt : '-'}</TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No transactions linked to this bill.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default FinanceOutstandingReport;
