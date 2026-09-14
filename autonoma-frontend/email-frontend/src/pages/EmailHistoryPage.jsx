import { useEffect, useState } from 'react';
import { processingService } from '../api/services';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Box, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Typography, Paper
} from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

const statusColor = (s) => ({
  COMPLETED: 'success', FAILED: 'error', AWAITING_REVIEW: 'warning',
  SKIPPED: 'default', RECEIVED: 'info', OCR_IN_PROGRESS: 'info',
  CLASSIFYING: 'info', EXTRACTING: 'info', RESOLVING_PARTS: 'info',
}[s] || 'default');

export default function EmailHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    processingService.getAll()
      .then(res => setRequests(res.data || []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const openDetail = async (req) => {
    setSelectedReq(req);
    setDetailOpen(true);
    try {
      const [d, l] = await Promise.all([processingService.getById(req.id), processingService.getLogs(req.id)]);
      setSelectedReq(d.data);
      setLogs(l.data || []);
    } catch { setLogs([]); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box className="page-header" sx={{ flexShrink: 0, mb: 3 }}>
        <h1 className="page-header__title">Email Processing History</h1>
        <p className="page-header__subtitle">Track all incoming emails and processing pipeline status</p>
      </Box>

      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ '& th': { bgcolor: 'rgba(108,99,255,0.05)', fontWeight: 700 } }}>
                  <TableCell>Subject</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>Intent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell align="right">Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer', '& td': { borderColor: 'rgba(255,255,255,0.05)' } }} onClick={() => openDetail(r)}>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.emailSubject || '(No Subject)'}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{r.emailFrom}</TableCell>
                    <TableCell><Chip label={r.intent?.replace('_', ' ')} size="small" variant="outlined" sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }} /></TableCell>
                    <TableCell><Chip label={r.status?.replace(/_/g, ' ')} size="small" color={statusColor(r.status)} sx={{ fontSize: '0.7rem' }} /></TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                      {r.emailReceivedAt ? new Date(r.emailReceivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell align="right"><VisibilityRoundedIcon sx={{ color: '#6C63FF', fontSize: 20 }} /></TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No emails processed yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth
              PaperProps={{ sx: { bgcolor: '#161D30', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Email Detail</DialogTitle>
        <DialogContent>
          {selectedReq && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2, p: 2 }}>
                <div><Typography variant="caption" color="text.secondary">Subject</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReq.emailSubject}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">From</Typography>
                  <Typography variant="body2">{selectedReq.emailFrom}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Intent</Typography>
                  <Typography variant="body2">{selectedReq.intent}</Typography></div>
                <div><Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={selectedReq.status?.replace(/_/g, ' ')} size="small" color={statusColor(selectedReq.status)} /></div>
              </Box>
              {selectedReq.errorMessage && (
                <Box sx={{ bgcolor: 'rgba(255,92,108,0.08)', border: '1px solid rgba(255,92,108,0.2)', borderRadius: 2, p: 2 }}>
                  <Typography variant="body2" color="error">{selectedReq.errorMessage}</Typography>
                </Box>
              )}
              <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 700 }}>Processing Logs</Typography>
              {logs.map((log, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1, px: 2, py: 1 }}>
                  <Chip label={log.status} size="small" color={log.status === 'SUCCESS' ? 'success' : 'error'} sx={{ fontSize: '0.7rem', minWidth: 70 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120 }}>{log.step}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{log.details}</Typography>
                  <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleTimeString('en-IN')}</Typography>
                </Box>
              ))}
              {logs.length === 0 && <Typography variant="body2" color="text.secondary">No logs available</Typography>}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDetailOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
