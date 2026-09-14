import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, Button, IconButton, MenuItem, Select, Stack, CircularProgress } from '@mui/material';
import { IconX, IconSettings } from '@tabler/icons-react';
import { getDialogStyles, btnCancel, btnEdit } from 'ui-component/bos/BOSStyles';
import { useColorScheme } from '@mui/material/styles';
import { useTheme } from '@mui/material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';

export default function CategoryDialog({ open, handleClose, onSelect, selectedRow }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ds = getDialogStyles(theme, isDark);

  const [category, setCategory] = useState('-Select-');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (selectedRow) {
        // If selectedRow has a mapped category or intent, initialize properly
        const rawCat = selectedRow.category || selectedRow.intent || '-Select-';
        let initialCat = '-Select-';
        if (['Order', 'Enquiry', 'Ledger', 'Others'].includes(rawCat)) {
          initialCat = rawCat;
        } else if (rawCat === 'GENERAL_INQUIRY') {
          initialCat = 'Others';
        } else if (rawCat === 'QUOTATION_REQUEST') {
          initialCat = 'Enquiry';
        } else if (rawCat === 'INVOICE_REQUEST') {
          initialCat = 'Order';
        } else if (rawCat === 'LEDGER') {
          initialCat = 'Ledger';
        } else if (rawCat === 'UNCLASSIFIED') {
          initialCat = 'Others';
        }
        setCategory(initialCat);
      } else {
        setCategory('-Select-');
      }
    }
  }, [open, selectedRow]);

  const handleApply = async () => {
    if (category === '-Select-' || !category) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select a category.',
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
        await axios.put(`/api/ocr/processing-requests/${selectedRow.id}`, { category });
        dispatch(openSnackbar({
          open: true,
          message: 'Category updated successfully!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        }));
        if (onSelect) onSelect(category);
        handleClose();
      } catch (err) {
        console.error('Failed to update category:', err);
        dispatch(openSnackbar({
          open: true,
          message: 'Failed to update category.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        }));
      } finally {
        setSaving(false);
      }
    } else {
      if (onSelect) onSelect(category);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: ds.paper }}>
      <DialogTitle sx={ds.titleBar} component="div">
        <Typography variant="h5" component="span" sx={ds.titleText}>Select Category</Typography>
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
              <Typography variant="body1" sx={{ minWidth: 85, fontWeight: 600, color: '#3f51b5' }}>Category</Typography>
              <Select
                size="small"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{ borderRadius: '4px' }}
                disabled={saving}
              >
                <MenuItem value="-Select-">-Select-</MenuItem>
                <MenuItem value="Order">Order</MenuItem>
                <MenuItem value="Enquiry">Enquiry</MenuItem>
                <MenuItem value="Ledger">Ledger</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
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
