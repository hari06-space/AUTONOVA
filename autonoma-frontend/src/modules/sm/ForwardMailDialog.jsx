import TextField from 'ui-component/CustomTextField';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, MenuItem, Select, Stack, CircularProgress } from '@mui/material';
import { IconX, IconMailForward } from '@tabler/icons-react';
import { getDialogStyles, btnCancel, btnEdit } from 'ui-component/bos/BOSStyles';
import { useColorScheme } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

export default function ForwardMailDialog({ open, handleClose, row }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);
  
  const [to, setTo] = useState('-Select-');
  const [cc, setCc] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTo('-Select-');
      setCc('');
      axios.get('/api/master/hr/employees/filter/active')
        .then(res => {
          const list = res.data || [];
          const seen = new Set();
          const unique = list.filter(emp => {
            const mail = (emp.officeMail || '').trim().toLowerCase();
            if (!mail) return false;
            if (seen.has(mail)) return false;
            seen.add(mail);
            return true;
          });
          setEmployees(unique);
        })
        .catch(err => console.error('Failed to load active employees:', err));
    }
  }, [open]);

  const handleForward = async () => {
    if (!row) return;
    if (to === '-Select-' || !to) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select an employee email to forward to.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/api/ocr/processing-requests/${row.id}/forward`, { to, cc });
      dispatch(openSnackbar({
        open: true,
        message: `Email successfully forwarded to ${to}`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));
      handleClose();
    } catch (err) {
      console.error('Failed to forward email:', err);
      const errMsg = err.response?.data?.message || 'Failed to forward email. Please check SMTP settings.';
      dispatch(openSnackbar({
        open: true,
        message: errMsg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: ds.paper }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>Send Mail</Typography>
        <IconButton onClick={handleClose} size="small" sx={ds.closeBtn} disabled={loading}>
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
              <Typography variant="body1" sx={{ minWidth: 60, fontWeight: 600, color: '#3f51b5' }}>To</Typography>
              <Select
                size="small"
                fullWidth
                value={to}
                onChange={(e) => setTo(e.target.value)}
                sx={{ borderRadius: '4px' }}
                disabled={loading}
              >
                <MenuItem value="-Select-">-Select-</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.officeMail}>
                    {emp.officeMail}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" sx={{ minWidth: 60, fontWeight: 600, color: '#3f51b5' }}>CC</Typography>
              <TextField
                size="small"
                fullWidth
                value={cc}
                onChange={(e) => setCc(e.target.value.replace(/;/g, ','))}
                placeholder="Separate multiple emails with commas"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '4px' } }}
                disabled={loading}
              />
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleClose} 
            sx={btnCancel} 
            startIcon={<IconX size={18} />}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleForward}
            sx={btnEdit(theme)} 
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <IconMailForward size={18} />}
            disabled={loading}
          >
            {loading ? 'Forwarding...' : 'Forward To'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
