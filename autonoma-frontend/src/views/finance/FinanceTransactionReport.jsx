import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import {
  Grid, Typography, Card, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Box, useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import { IconReceipt2, IconArrowDownLeft, IconArrowUpRight, IconCalculator } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';

const FinanceTransactionReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalTransactions: 0, totalDebit: 0, totalCredit: 0, netAmount: 0 });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.search?.filters || {});
  
  useEffect(() => {
    const config = [
      { id: 'fromDate', label: 'From Date', type: 'date', isStarred: true },
      { id: 'toDate', label: 'To Date', type: 'date', isStarred: true, defaultValue: new Date().toISOString().split('T')[0] },
      {
        id: 'transType',
        label: 'Transaction Type',
        type: 'select',
        options: [
          { value: 'ALL', label: 'All' },
          { value: 'CUSTOMER_INVOICE', label: 'Customer Invoice' },
          { value: 'SUPPLIER_INVOICE', label: 'Supplier Invoice' },
          { value: 'CUSTOMER_RECEIPT', label: 'Customer Receipt' },
          { value: 'SUPPLIER_PAYMENT', label: 'Supplier Payment' },
          { value: 'JOURNAL', label: 'Journal' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      },
      { id: 'vrNo', label: 'Voucher No', type: 'text', isStarred: true },
      { id: 'partyBillNo', label: 'Bill No', type: 'text', isStarred: true }
    ];
    dispatch(setFilterConfig(config));
    return () => { dispatch(setFilterConfig(null)); };
  }, [dispatch]);

  const [selectedTx, setSelectedTx] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const fetchTransactions = async () => {
    try {
      let url = `/api/finance/transaction/report?page=${page}&size=${rowsPerPage}`;
      let sumUrl = `/api/finance/transaction/report/summary?`;
      
      const queryParams = new URLSearchParams();
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.transType && filters.transType !== 'ALL') queryParams.append('transType', filters.transType);
      if (filters.vrNo) queryParams.append('vrNo', filters.vrNo);
      if (filters.partyBillNo) queryParams.append('partyBillNo', filters.partyBillNo);

      if (queryParams.toString()) {
        url += `&${queryParams.toString()}`;
        sumUrl += queryParams.toString();
      }

      const [res, sumRes] = await Promise.all([
        axios.get(url),
        axios.get(sumUrl)
      ]);

      if (res.data) {
        setTransactions(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
      }
      if (sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, rowsPerPage, filters]);

  const theme = useTheme();

  const handleRowClick = (tx) => {
    setSelectedTx(tx);
    setOpenModal(true);
  };

  const formatMoney = (amt) => (amt || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  const columns = useMemo(() => [
    { id: 'transDate', label: 'Date', minWidth: 100, type: 'date' },
    { id: 'transType', label: 'Type', minWidth: 150 },
    { id: 'vrNo', label: 'Voucher No', minWidth: 130, bold: true },
    { id: 'partyBillNo', label: 'Party Bill No', minWidth: 120, render: r => r.partyBillNo || 'N/A' },
    { id: 'drAmt', label: 'Debit (DR)', minWidth: 130, type: 'number', align: 'right', sx: { color: 'error.main' } },
    { id: 'crAmt', label: 'Credit (CR)', minWidth: 130, type: 'number', align: 'right', sx: { color: 'success.main' } },
    { id: 'transMode', label: 'Mode', minWidth: 100, render: r => r.transMode || 'N/A' },
    { id: 'dueDate', label: 'Due Date', minWidth: 100, type: 'date', render: r => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'N/A' }
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
      title="Finance Transaction Report"
      content={false}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchTransactions}
          exportData={transactions}
          exportFilename="Finance_Transaction"
          columns={columns}
        />
      }
    >
      {/* Sticky Filter Bar Removed */}

      <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title="Total Transactions" value={summary.totalTransactions} color="primary" icon={<IconReceipt2 size={28} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title="Total Debit (DR)" value={formatMoney(summary.totalDebit)} color="error" gradient={`linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`} icon={<IconArrowUpRight size={28} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title="Total Credit (CR)" value={formatMoney(summary.totalCredit)} color="success" gradient={`linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`} icon={<IconArrowDownLeft size={28} />} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title="Net Amount (DR - CR)" value={formatMoney(summary.netAmount)} color="warning" icon={<IconCalculator size={28} />} />
          </Grid>
        </Grid>
      </Box>

      <BOSDataTable
        columns={columns}
        rows={transactions}
        page={page}
        size={rowsPerPage}
        totalRows={totalElements}
        onPageChange={setPage}
        onSizeChange={(s) => { setRowsPerPage(s); setPage(0); }}
        onRowClick={handleRowClick}
      />

      {/* Drill-down Drawer / Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transaction Details</DialogTitle>
        <DialogContent>
          {selectedTx && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}><Typography variant="subtitle2">Date:</Typography> {new Date(selectedTx.transDate).toLocaleDateString()}</Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Type:</Typography> {selectedTx.transType}</Grid>
              
              <Grid item xs={6}><Typography variant="subtitle2">Voucher No:</Typography> {selectedTx.vrNo}</Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Voucher Name:</Typography> {selectedTx.vrName}</Grid>

              <Grid item xs={12}><Divider /></Grid>

              <Grid item xs={6}><Typography variant="subtitle2">Party ID:</Typography> {selectedTx.partyId}</Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Party Bill No:</Typography> {selectedTx.partyBillNo}</Grid>

              <Grid item xs={12}><Divider /></Grid>

              <Grid item xs={6}><Typography variant="subtitle2">Debit (DR):</Typography> <span style={{color: 'red'}}>{selectedTx.drAmt}</span></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Credit (CR):</Typography> <span style={{color: 'green'}}>{selectedTx.crAmt}</span></Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Taxable Amt:</Typography> {selectedTx.taxableAmt}</Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Bill Amt:</Typography> {selectedTx.billAmt}</Grid>

              <Grid item xs={12}><Divider /></Grid>

              <Grid item xs={6}><Typography variant="subtitle2">Mode:</Typography> {selectedTx.transMode}</Grid>
              <Grid item xs={6}><Typography variant="subtitle2">Cheque No:</Typography> {selectedTx.chequeNo}</Grid>

              <Grid item xs={12}><Typography variant="subtitle2">Narration:</Typography> {selectedTx.narration}</Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
};

export default FinanceTransactionReport;
