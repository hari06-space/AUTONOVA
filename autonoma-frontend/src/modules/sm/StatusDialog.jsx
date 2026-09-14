import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, MenuItem, Select, Stack, CircularProgress, Chip, TextField } from '@mui/material';
import { IconX, IconSettings, IconMail } from '@tabler/icons-react';
import { getDialogStyles, btnCancel, btnEdit } from 'ui-component/bos/BOSStyles';
import { useColorScheme } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

export default function StatusDialog({ open, handleClose, onSelect, selectedRow }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);

  const [status, setStatus] = useState('-Select-');
  const [ccEmails, setCcEmails] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (open) {
      if (selectedRow) {
        let currentStatus = selectedRow.status || '-Select-';
        if (currentStatus === 'AWAITING_REVIEW' || currentStatus === 'RECEIVED') {
          currentStatus = 'Open';
        } else if (currentStatus === 'HOLD') {
          currentStatus = 'Hold';
        } else if (currentStatus === 'LEDGER_REQUEST_MAIL') {
          currentStatus = 'Ledger Request Mail';
        } else if (currentStatus === 'LEDGER_REQUEST_MAIL_WITH_CC') {
          currentStatus = 'Ledger Request Mail with CC';
        } else if (currentStatus === 'ABANDONED') {
          currentStatus = 'Abandoned';
        } else if (currentStatus === 'NOT_RELEVANT') {
          currentStatus = 'Not Relevant';
        }
        setStatus(currentStatus);
        setCcEmails(selectedRow.emailCc || '');
      } else {
        setStatus('-Select-');
        setCcEmails('');
      }
    }
  }, [open, selectedRow]);

  useEffect(() => {
    if (open && selectedRow && (status === 'Ledger Request Mail' || status === 'Ledger Request Mail with CC')) {
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewData(null);
      axios.get(`/api/ocr/processing-requests/${selectedRow.id}/preview-reply?status=${status}`)
        .then(res => {
          setPreviewData(res.data);
        })
        .catch(err => {
          console.error('Failed to fetch preview:', err);
          setPreviewError('Failed to load email preview.');
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    } else {
      setPreviewData(null);
      setPreviewError(null);
    }
  }, [open, status, selectedRow]);

  const handleApply = async () => {
    if (status === '-Select-' || !status) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a status.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }

    if (selectedRow) {
      setSaving(true);
      try {
        await axios.put(`/api/ocr/processing-requests/${selectedRow.id}`, { 
          status,
          emailCc: status === 'Ledger Request Mail with CC' ? ccEmails : undefined
        });
        dispatch(openSnackbar({
          open: true,
          message: 'Status updated successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        }));
        if (onSelect) onSelect(status);
        handleClose();
      } catch (err) {
        console.error('Failed to update status:', err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update status.';
        dispatch(openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      } finally {
        setSaving(false);
      }
    } else {
      if (onSelect) onSelect(status);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: ds.paper }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>Select Status</Typography>
        <IconButton onClick={handleClose} size="small" sx={ds.closeBtn} disabled={saving}>
          <IconX size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4, pt: 3 }}>
        <Box sx={{ 
          border: '2px solid #3f51b5', 
          p: 3, 
          mb: 3, 
          borderRadius: '8px'
        }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ minWidth: 85, fontWeight: 600, color: '#3f51b5' }}>Status</Typography>
              <Select
                size="small"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ borderRadius: '4px' }}
                disabled={saving}
              >
                <MenuItem value="-Select-">-Select-</MenuItem>
                <MenuItem value="Open">Open</MenuItem>
                <MenuItem value="Hold">Hold</MenuItem>
                <MenuItem value="Ledger Request Mail with CC">Ledger Request Mail with CC</MenuItem>
                <MenuItem value="Ledger Request Mail">Ledger Request Mail</MenuItem>
                <MenuItem value="Abandoned">Abandoned</MenuItem>
                <MenuItem value="Not Relevant">Not Relevant</MenuItem>
              </Select>
            </Box>
            {status === 'Ledger Request Mail with CC' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1" sx={{ minWidth: 85, fontWeight: 600, color: '#3f51b5' }}>CC</Typography>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter CC email addresses (comma or semicolon separated)"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  disabled={saving}
                  sx={{ borderRadius: '4px' }}
                />
              </Box>
            )}
          </Stack>
        </Box>

        {/* Reply Mail Preview Block */}
        {(status === 'Ledger Request Mail' || status === 'Ledger Request Mail with CC') && (
          <Box sx={{ 
            border: '1px solid', 
            borderColor: isDark ? 'divider' : '#e0e0e0',
            borderRadius: '8px', 
            p: 3, 
            mb: 3, 
            bgcolor: isDark ? 'background.default' : '#f9f9f9',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            textAlign: 'left'
          }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: '#3f51b5', display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconMail size={18} /> Reply Mail Preview
            </Typography>
            
            {previewLoading ? (
              <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" color="text.secondary">Generating preview...</Typography>
              </Stack>
            ) : previewError ? (
              <Typography variant="body2" color="error" align="center" sx={{ py: 2 }}>{previewError}</Typography>
            ) : previewData ? (
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, color: 'text.secondary' }}>From:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{previewData.from}</Typography>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, color: 'text.secondary' }}>To:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{previewData.to}</Typography>
                </Box>
                {(status === 'Ledger Request Mail with CC' || previewData.cc) ? (
                  <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, color: 'text.secondary' }}>Cc:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{status === 'Ledger Request Mail with CC' ? ccEmails : (previewData.cc || '')}</Typography>
                  </Box>
                ) : null}
                <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, color: 'text.secondary' }}>Subject:</Typography>
                  <Typography variant="body2" fontWeight={600}>{previewData.subject}</Typography>
                </Box>
                <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', pb: 1, alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 60, color: 'text.secondary' }}>Attach:</Typography>
                  {previewData.attachments?.map((att, idx) => (
                    <Chip key={idx} label={att.name} size="small" color="primary" variant="outlined" sx={{ borderRadius: '4px' }} />
                  ))}
                </Box>
                
                <Box sx={{ 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: '4px', 
                  overflow: 'hidden', 
                  bgcolor: '#ffffff',
                  height: '250px'
                }}>
                  <iframe 
                    title="Reply Body Preview"
                    srcDoc={previewData.bodyHtml} 
                    style={{ width: '100%', height: '100%', border: 'none' }} 
                  />
                </Box>
              </Stack>
            ) : null}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleClose} 
            sx={btnCancel} 
            startIcon={<IconX size={18} />}
            disabled={saving}
          >
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApply}
            sx={btnEdit(theme)} 
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconSettings size={18} />}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
