import { useEffect, useState } from 'react';
import { invoiceService } from '../api/services';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Box, Paper
} from '@mui/material';

const statusColor = (s) => ({ SENT: 'success', PAID: 'success', DRAFT: 'default', PARTIALLY_PAID: 'warning', OVERDUE: 'error', CANCELLED: 'error' }[s] || 'default');

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoiceService.getAll()
      .then(res => setInvoices(res.data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Invoices</h1>
        <p className="page-header__subtitle">View all generated invoices and payment status</p>
      </Box>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'rgba(108,99,255,0.05)', fontWeight: 700 } }}>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#6C63FF' }}>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.customer?.name || '-'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{inv.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip label={inv.status} size="small" color={statusColor(inv.status)} sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No invoices generated yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
