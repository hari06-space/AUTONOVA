import { useEffect, useState } from 'react';
import { quotationService } from '../api/services';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Box, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Typography, Paper
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

const statusColor = (s) => ({ SENT: 'success', DRAFT: 'default', ACCEPTED: 'success', REJECTED: 'error', EXPIRED: 'warning', REVISED: 'info' }[s] || 'default');

export default function QuotationHistoryPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    quotationService.getAll()
      .then(res => setQuotations(res.data || []))
      .catch(() => setQuotations([]))
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = async (id, quoteNum) => {
    try {
      const res = await quotationService.downloadPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quoteNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) { console.error('PDF download failed', e); }
  };

  const openDetail = async (id) => {
    try {
      const res = await quotationService.getById(id);
      setSelected(res.data);
      setDetailOpen(true);
    } catch { /* ignore */ }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Quotation History</h1>
        <p className="page-header__subtitle">View all generated quotations, download PDFs, and track status</p>
      </Box>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'rgba(108,99,255,0.05)', fontWeight: 700 } }}>
                  <TableCell>Quote #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Valid Until</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotations.map(q => (
                  <TableRow key={q.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)' } }}>
                    <TableCell sx={{ fontWeight: 600, color: '#6C63FF' }}>{q.quotationNumber}</TableCell>
                    <TableCell>{q.customerName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {q.quotationDate ? new Date(q.quotationDate).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{q.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <Chip label={q.status} size="small" color={statusColor(q.status)} sx={{ fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details"><IconButton size="small" onClick={() => openDetail(q.id)} sx={{ color: '#6C63FF' }}>
                        <VisibilityRoundedIcon fontSize="small" />
                      </IconButton></Tooltip>
                      <Tooltip title="Download PDF"><IconButton size="small" onClick={() => downloadPdf(q.id, q.quotationNumber)} sx={{ color: '#00D9A6' }}>
                        <DownloadRoundedIcon fontSize="small" />
                      </IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {quotations.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No quotations yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
              PaperProps={{ sx: { bgcolor: '#161D30', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Quotation: {selected?.quotationNumber}</DialogTitle>
        <DialogContent>
          {selected && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2 }}>
                <div><Typography variant="caption" color="text.secondary">Customer</Typography>
                  <Typography variant="body2" fontWeight={600}>{selected.customerName}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{selected.customerEmail}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#00D9A6' }}>
                    ₹{selected.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Typography></div>
                <div><Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={selected.status} size="small" color={statusColor(selected.status)} /></div>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mt: 1 }}>Line Items</Typography>
              <TableContainer sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell>Part Code</TableCell><TableCell>Part Name</TableCell>
                    <TableCell align="right">Qty</TableCell><TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {(selected.lines || []).map((l, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.partCode}</TableCell>
                        <TableCell>{l.partName}</TableCell>
                        <TableCell align="right">{l.quantity}</TableCell>
                        <TableCell align="right">₹{l.unitPrice?.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{l.lineTotal?.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<DownloadRoundedIcon />}
                  onClick={() => downloadPdf(selected?.id, selected?.quotationNumber)}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
