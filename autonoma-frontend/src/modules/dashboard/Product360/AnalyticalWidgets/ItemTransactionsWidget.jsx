import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  Paper,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  InputAdornment,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconSearch,
  IconRefresh,
  IconFileSpreadsheet,
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconArrowsExchange,
  IconCalendar,
  IconFilter
} from '@tabler/icons-react';
import axios from 'utils/axios';

export default function ItemTransactionsWidget({ productId, divisionId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Filters State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('STOCK');
  const [searchQuery, setSearchQuery] = useState('');

  // Table State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchTransactions = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      let url = `/api/product-360/transactions?productId=${productId}`;
      if (divisionId) url += `&divisionId=${divisionId}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;
      if (category) url += `&transCategory=${category}`;

      const res = await axios.get(url);
      if (res.data && Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    } catch (err) {
      console.warn('Failed to load item transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, divisionId, fromDate, toDate, category]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side quick search filter
  const filteredRows = transactions.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (row.transNo && row.transNo.toLowerCase().includes(q)) ||
      (row.refNo && row.refNo.toLowerCase().includes(q)) ||
      (row.transType && row.transType.toLowerCase().includes(q)) ||
      (row.batchNo && row.batchNo.toLowerCase().includes(q)) ||
      (row.vendorName && row.vendorName.toLowerCase().includes(q)) ||
      (row.remarks && row.remarks.toLowerCase().includes(q))
    );
  });

  const getCategoryChip = (cat) => {
    const c = (cat || 'STOCK').toUpperCase();
    if (c === 'STOCK') {
      return (
        <Chip
          label="STOCK"
          size="small"
          sx={{ bgcolor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9', color: '#2e7d32', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
        />
      );
    }
    if (c === 'REJECTION') {
      return (
        <Chip
          label="REJECTION"
          size="small"
          sx={{ bgcolor: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee', color: '#d32f2f', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
        />
      );
    }
    if (c === 'SCRAP') {
      return (
        <Chip
          label="SCRAP"
          size="small"
          sx={{ bgcolor: isDark ? 'rgba(237, 108, 2, 0.2)' : '#fff3e0', color: '#ed6c02', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
        />
      );
    }
    return (
      <Chip
        label={c}
        size="small"
        sx={{ bgcolor: isDark ? 'rgba(2, 136, 209, 0.2)' : '#e1f5fe', color: '#0288d1', fontWeight: 800, fontSize: '0.65rem', height: 20 }}
      />
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Toolbar: Date Range + Category Filter + Search ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.2,
          mb: 1.5,
          p: 1.2,
          borderRadius: '8px',
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.2 }}>
          {/* From Date */}
          <TextField
            size="small"
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.75rem' } }}
          />

          {/* To Date */}
          <TextField
            size="small"
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 140, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.75rem' } }}
          />

          {/* Category Filter */}
          <FormControl size="small" sx={{ width: 130 }}>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ height: 34, fontSize: '0.75rem' }}
            >
              <MenuItem value="STOCK" sx={{ fontSize: '0.75rem' }}>Stock</MenuItem>
              <MenuItem value="REJECTION" sx={{ fontSize: '0.75rem' }}>Rejection</MenuItem>
              <MenuItem value="SCRAP" sx={{ fontSize: '0.75rem' }}>Scrap</MenuItem>
              <MenuItem value="REWORK" sx={{ fontSize: '0.75rem' }}>Rework</MenuItem>
            </Select>
          </FormControl>

          {/* Quick Clear Filter */}
          {(fromDate || category !== 'STOCK') && (
            <Button
              size="small"
              onClick={() => { setFromDate(''); setCategory('STOCK'); }}
              sx={{ height: 34, fontSize: '0.72rem', textTransform: 'none' }}
            >
              Clear Filters
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search Trans No, Ref, Batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={14} style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              )
            }}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { height: 34, fontSize: '0.75rem' } }}
          />

          {/* Refresh */}
          <Tooltip title="Refresh Transactions">
            <IconButton size="small" onClick={fetchTransactions} disabled={loading} sx={{ height: 34, width: 34 }}>
              {loading ? <CircularProgress size={14} /> : <IconRefresh size={16} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Table Container ── */}
      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px', maxHeight: 380 }}>
        <Table size="small" stickyHeader className="p360-table">
          <TableHead>
            <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }}>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Trans No</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Transaction Type</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Ref Doc No</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Opening Stock</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Qty In</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Qty Out</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Balance</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Unit Price</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Batch / Lot</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Division</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Vendor / Source</TableCell>
              <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Loading traceability ledger...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.78rem' }}>
                  No item transaction records found for the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {row.createdDateFormatted || row.transDateFormatted || row.transDate || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                    {row.transNo || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem' }}>
                    {getCategoryChip(row.transCategory)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {row.transType || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', fontWeight: 600, color: '#0288d1', whiteSpace: 'nowrap' }}>
                    {row.refNo || '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#ed6c02' }}>
                    {row.openingQty != null ? Number(row.openingQty).toLocaleString('en-IN') : '0'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.74rem', fontWeight: 700, color: row.qtyIn > 0 ? '#2e7d32' : 'inherit' }}>
                    {row.qtyIn > 0 ? `+${Number(row.qtyIn).toLocaleString('en-IN')}` : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.74rem', fontWeight: 700, color: row.qtyOut > 0 ? '#e53935' : 'inherit' }}>
                    {row.qtyOut > 0 ? `-${Number(row.qtyOut).toLocaleString('en-IN')}` : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#1565c0' }}>
                    {row.balanceQty != null ? Number(row.balanceQty).toLocaleString('en-IN') : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.74rem', fontWeight: 600 }}>
                    {row.price ? `₹ ${Number(row.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                    {row.batchNo || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                    {row.divisionName || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.vendorName || '-'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.remarks || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ borderTop: `1px solid ${theme.palette.divider}`, fontSize: '0.75rem' }}
      />
    </Box>
  );
}
