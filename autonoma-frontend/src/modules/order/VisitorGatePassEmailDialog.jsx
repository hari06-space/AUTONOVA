import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  IconButton,
  Stack,
  Typography,
  Button,
  TextField,
  Chip,
  Paper,
  CircularProgress,
  Avatar,
  InputAdornment,
  alpha
} from '@mui/material';
import {
  IconX,
  IconSend,
  IconMail,
  IconBuilding,
  IconFileText,
  IconShieldCheck,
  IconEye
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { useTheme } from '@mui/material/styles';
import { buildVisitorGatePassEmailHtml, triggerVisitorGatePassEmail } from './visitorGatePassUtils';

export default function VisitorGatePassEmailDialog({ open, onClose, row, company }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (row && open) {
      setToEmail(row.emailId || '');
      const compName = company?.companyName || 'Autonoma ERP';
      const passNo = row.gatePassNo || 'Gate Pass';
      setSubject(`Visitor Gate Pass - ${passNo} - ${compName}`);
    }
  }, [row, company, open]);

  if (!row || !company) return null;

  const handleSendEmail = async () => {
    if (!toEmail || !toEmail.trim()) {
      dispatch(openSnackbar({ open: true, message: 'Please enter a valid recipient email address', variant: 'alert', severity: 'warning' }));
      return;
    }

    setSending(true);
    const recipient = toEmail.trim();
    const emailSubject = subject.trim();

    try {
      const res = await triggerVisitorGatePassEmail(row, company, {
        to: recipient,
        subject: emailSubject,
        pdfBase64: null
      });

      dispatch(
        openSnackbar({
          open: true,
          message: res?.message || `Visitor Pass Email sent successfully to ${recipient}!`,
          variant: 'alert',
          severity: 'success'
        })
      );
      onClose();
    } catch (err) {
      console.error('Email send error:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: err?.response?.data?.message || err?.message || 'Failed to send visitor email',
          variant: 'alert',
          severity: 'error'
        })
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden'
        }
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          p: 2,
          px: 2.5,
          bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
          color: 'text.primary',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          width: '100%'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              color: 'primary.main',
              width: 42,
              height: 42
            }}
          >
            <IconMail size={22} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary" letterSpacing="-0.3px">
              Send Visitor Pass Email
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
              <Chip
                label="DIGITAL QR PASS"
                size="small"
                sx={{
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  height: 20
                }}
              />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Gate Pass: {row.gatePassNo || '-'}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: (t) => alpha(t.palette.text.primary, 0.06) }
          }}
        >
          <IconX />
        </IconButton>
      </DialogTitle>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        <Stack spacing={2.5}>
          {/* Sender & Recipient Meta Card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <Stack spacing={2}>
              {/* From Email Info Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  bgcolor: '#f1f5f9',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconBuilding size={20} color="#3b82f6" />
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      From (Company Mail)
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                      {company.emailId || company.companyName || 'Company Profile Email'}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  icon={<IconShieldCheck size={15} color="#16a34a" />}
                  label="Verified SMTP"
                  size="small"
                  sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.72rem' }}
                />
              </Box>

              {/* To Email Field */}
              <TextField
                fullWidth
                size="small"
                label="Recipient Email Address *"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="visitor@example.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconMail size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                  style: { fontWeight: 700, borderRadius: '8px' }
                }}
              />

              {/* Subject Field */}
              <TextField
                fullWidth
                size="small"
                label="Email Subject *"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconFileText size={18} color="#64748b" />
                    </InputAdornment>
                  ),
                  style: { fontWeight: 700, borderRadius: '8px' }
                }}
              />
            </Stack>
          </Paper>

          {/* Email Preview Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <IconEye size={18} color="#475569" />
              <Typography variant="subtitle2" fontWeight={800} color="#334155">
                Live Email Message Preview:
              </Typography>
            </Stack>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                maxHeight: 320,
                overflowY: 'auto',
                bgcolor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #cbd5e1'
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: buildVisitorGatePassEmailHtml(row, company) }} />
            </Paper>
          </Box>
        </Stack>
      </DialogContent>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700, px: 3 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendEmail}
          disabled={sending || !toEmail}
          startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
          sx={{
            px: 3,
            py: 1,
            fontWeight: 700,
            boxShadow: 'none'
          }}
        >
          {sending ? 'Sending Email...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
