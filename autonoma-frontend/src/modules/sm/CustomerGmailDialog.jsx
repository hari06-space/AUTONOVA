import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, MenuItem, Select, Stack, CircularProgress } from '@mui/material';
import { IconX, IconUser } from '@tabler/icons-react';
import { getDialogStyles, btnCancel, btnEdit } from 'ui-component/bos/BOSStyles';
import { useColorScheme } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

const getSenderDomain = (email) => {
  if (!email) return '';
  const idx = email.lastIndexOf('@');
  return idx !== -1 ? email.slice(idx).toLowerCase().trim() : '';
};

const getCleanDomain = (domainOrEmail) => {
  if (!domainOrEmail) return '';
  let str = domainOrEmail.toLowerCase().trim();
  const idx = str.lastIndexOf('@');
  if (idx !== -1) {
    str = str.slice(idx + 1);
  }
  if (str.startsWith('@')) {
    str = str.slice(1);
  }
  return str.trim();
};

const matchDomain = (email, customerDomain) => {
  const cleanEmailDomain = getCleanDomain(email);
  const cleanCustDomain = getCleanDomain(customerDomain);
  return cleanEmailDomain && cleanCustDomain && cleanEmailDomain === cleanCustDomain;
};

export default function CustomerGmailDialog({ open, handleClose, onSelect, selectedRow, emailFrom }) {
  const senderEmail = emailFrom || selectedRow?.from || selectedRow?.emailFrom || '';
  const senderDomain = senderEmail ? getSenderDomain(senderEmail) : '';
  const theme = useTheme();
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);

  const [customer, setCustomer] = useState('-Select-');
  const [gmailCustomers, setGmailCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCustomer('-Select-');
      setLoading(true);
      axios.get('/api/sm/customers')
        .then(res => {
          const list = res.data || [];
          
          // 1. Check if selectedRow already has an assigned customer code
          let preSelectedValue = '-Select-';
          if (selectedRow?.customerCode && selectedRow.customerCode !== '-') {
            const matched = list.find(cust => cust.customerCode === selectedRow.customerCode);
            if (matched) {
              preSelectedValue = `${matched.customerCode} / ${matched.customerName}`;
            }
          }

          if (preSelectedValue !== '-Select-') {
            setCustomer(preSelectedValue);
          } else {
            // 2. Fall back to domain matching if no customer is currently assigned
            let filtered = [];
            if (senderEmail) {
              filtered = list.filter(cust => matchDomain(senderEmail, cust.domainName));
            }
            
            const cleanSenderDomain = getCleanDomain(senderEmail);
            const isPublic = cleanSenderDomain === 'gmail.com' || cleanSenderDomain === 'yahoo.com';
            
            if (filtered.length === 1 && !isPublic) {
              const singleCust = filtered[0];
              const displayValue = `${singleCust.customerCode} / ${singleCust.customerName}`;
              setCustomer(displayValue);
              
              if (selectedRow) {
                setSaving(true);
                axios.put(`/api/ocr/processing-requests/${selectedRow.id}`, { customerName: displayValue })
                  .then(() => {
                    dispatch(openSnackbar({
                      open: true,
                      message: `Auto-selected and updated customer: ${singleCust.customerName}`,
                      variant: 'alert',
                      alert: { variant: 'filled' },
                      severity: 'success',
                      close: false
                    }));
                    if (onSelect) onSelect(displayValue);
                    handleClose();
                  })
                  .catch(err => {
                    console.error('Failed to auto-update customer:', err);
                    dispatch(openSnackbar({
                      open: true,
                      message: 'Failed to auto-update customer.',
                      variant: 'alert',
                      alert: { variant: 'filled' },
                      severity: 'error',
                      close: false
                    }));
                  })
                  .finally(() => setSaving(false));
              } else {
                if (onSelect) onSelect(displayValue);
                handleClose();
              }
              return;
            }
          }

          // Only include customers with gmail.com, yahoo.com, or empty/personal domains
          const publicCustomers = list.filter(cust => {
            const domain = getCleanDomain(cust.domainName);
            return domain === 'gmail.com' || domain === 'yahoo.com' || !domain;
          });
          setGmailCustomers(publicCustomers);
        })
        .catch(err => {
          console.error('Failed to fetch customers:', err);
          dispatch(openSnackbar({
            open: true,
            message: 'Failed to load customers from Customer Master.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'error',
            close: false
          }));
        })
        .finally(() => setLoading(false));
    }
  }, [open, dispatch, senderEmail, selectedRow]);

  const handleApply = async () => {
    if (customer === '-Select-' || !customer) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a customer.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'warning',
        close: false
      }));
      return;
    }

    if (selectedRow) {
      // We are on the overview page: perform direct database update
      setSaving(true);
      try {
        await axios.put(`/api/ocr/processing-requests/${selectedRow.id}`, { customerName: customer });
        dispatch(openSnackbar({
          open: true,
          message: 'Customer updated successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        }));
        if (onSelect) onSelect(customer);
        handleClose();
      } catch (err) {
        console.error('Failed to update customer:', err);
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to update customer.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      } finally {
        setSaving(false);
      }
    } else {
      // We are inside the new/edit popup: pass selection back to parent component
      if (onSelect) onSelect(customer);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: ds.paper }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>
          {senderDomain ? `Select Customer for ${senderDomain}` : 'Select Customer'}
        </Typography>
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
              <Typography variant="body1" sx={{ minWidth: 85, fontWeight: 600, color: '#3f51b5' }}>Customer</Typography>
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                <Select
                  size="small"
                  fullWidth
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  sx={{ borderRadius: '4px' }}
                  disabled={saving}
                >
                  <MenuItem value="-Select-">-Select-</MenuItem>
                  {gmailCustomers.map((cust) => {
                    const displayValue = `${cust.customerCode} / ${cust.customerName}`;
                    return (
                      <MenuItem key={cust.id} value={displayValue}>
                        {cust.customerCode} - {cust.customerName} {cust.domainName && getCleanDomain(cust.domainName) !== 'gmail.com' ? `(${cust.domainName})` : ''}
                      </MenuItem>
                    );
                  })}
                </Select>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleClose} 
            sx={btnCancel} 
            startIcon={<IconX size={18} />}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleApply}
            sx={btnEdit(theme)} 
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconUser size={18} />}
            disabled={saving || loading}
          >
            {saving ? 'Saving...' : 'Select'}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
