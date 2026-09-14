import { useState, useEffect, useMemo } from 'react';
import { 
  Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, IconButton, Box, useTheme
} from '@mui/material';
import { IconSettings, IconPlus, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSDataTable, BOSExportButton, BOSTextField, BOSStatusField, getCommonDateFilters, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import axios from 'utils/axios';
import { useSelector, useDispatch } from 'react-redux';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'serviceCode', label: 'Service Code', minWidth: 120, bold: true },
  { id: 'serviceName', label: 'Service Name', minWidth: 250 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 }
];

export default function TypeOfService() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const globalQuery = useSelector((state) => state.search.query);
  const perms = usePagePermissions(PAGE_CODES.SM_TYPE_OF_SERVICE);

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    serviceCode: '',
    serviceName: '',
    description: '',
    status: 'Active'
  });

  const fetchRows = async () => {
    try {
      const res = await axios.get('/api/type-of-service');
      setRows(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const handleOpen = (row = null) => {
    setErrors({});
    if (row) {
      setEditId(row.id);
      setFormData({
        serviceCode: row.serviceCode,
        serviceName: row.serviceName,
        description: row.description || '',
        status: row.status
      });
    } else {
      setEditId(null);
      setFormData({
        serviceCode: '',
        serviceName: '',
        description: '',
        status: 'Active'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
  };

  const handleSubmit = async () => {
    setErrors({});
    if (!formData.serviceName?.trim()) {
      setErrors({ serviceName: 'Service Name should not be empty.' });
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill the mandatory field',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
      return;
    }
    try {
      if (editId) {
        await axios.put(`/api/type-of-service/${editId}`, formData);
      } else {
        await axios.post('/api/type-of-service', formData);
      }
      handleClose();
      fetchRows();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data || 'An error occurred while saving.';
      if (typeof errorMsg === 'string' && (errorMsg.toLowerCase().includes('duplicate') || errorMsg.toLowerCase().includes('already exists'))) {
        setErrors({ serviceName: 'Duplicate value! Please check.' });
      } else {
        dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
      }
    }
  };

  const handleDeleteClick = (row) => {
    setDeleteId(row.id);
    setDeleteName(row.serviceName);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/type-of-service/${deleteId}`);
      setDeleteOpen(false);
      setDeleteId(null);
      setDeleteName('');
      fetchRows();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const config = [{ id: 'serviceCode', label: 'Service Code', type: 'text', isStarred: true },
      { id: 'serviceName', label: 'Service Name', type: 'text', isStarred: true },
      ...getCommonDateFilters('createdDate', 'updatedDate')];
    dispatch(setFilterConfig(config));
    return () => dispatch(setFilterConfig(null));
  }, [dispatch]);

  const filteredRows = useMemo(() => {
    const q = (globalQuery || '').toLowerCase();
    const sourceRows = rows || [];
    if (!q) return sourceRows.map((r, i) => ({ ...r, index: i + 1 }));
    return sourceRows.filter(row =>
      (row.serviceCode && row.serviceCode.toString().toLowerCase().includes(q)) ||
      (row.serviceName && row.serviceName.toString().toLowerCase().includes(q))
    ).map((r, i) => ({ ...r, index: i + 1 }));
  }, [rows, globalQuery]);

  return (
    <MainCard fullWidth
      icon={IconSettings}
      title={"Type of Service"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          {perms.export && <BOSExportButton
            data={rows}
            filename="Type_Of_Service"
            
           screenColumns={columns} />}
          {perms.write && (
            <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => handleOpen()}>
              New Service Type
            </Button>
          )}
        </Stack>
      }
    >
      <BOSDataTable columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        totalCount={rows.length}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onEditRow={(row) => handleOpen(row)}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Edit Service Type' : 'New Service Type'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <BOSTextField
              disabled={!perms.write}
              label="Service Code"
              fullWidth
              value={formData.serviceCode}
              onChange={(e) => setFormData({ ...formData, serviceCode: e.target.value })}
            />
            <BOSTextField
              disabled={!perms.write}
              label="Service Name"
              fullWidth
              value={formData.serviceName}
              onChange={(e) => {
                setFormData({ ...formData, serviceName: e.target.value });
                if (errors.serviceName) setErrors((prev) => ({ ...prev, serviceName: '' }));
              }}
              error={!!errors.serviceName}
              helperText={errors.serviceName}
              sx={errorStyle(!!errors.serviceName)}
            />
            <BOSTextField
              name="description"
              label="Description/SOP"
              multiline
              minRows={3}
              value={isListening && interimText ? (formData.description || '') + ' ' + interimText : formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Standard Operating Procedure... (or use mic 🎤)"
              InputLabelProps={{ shrink: true }}
              disabled={!perms.write}
              sx={{ position: 'relative' }}
              InputProps={{
                endAdornment: perms.write && (
                  <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isListening && <VoiceWaveform />}
                      <IconButton
                        color={isListening ? 'error' : 'primary'}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleListening();
                        }}
                        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                        sx={{
                          animation: isListening ? 'micPulse 1.2s ease-in-out infinite' : 'none',
                          '@keyframes micPulse': {
                            '0%': { transform: 'scale(1)', opacity: 1 },
                            '50%': { transform: 'scale(1.2)', opacity: 0.55 },
                            '100%': { transform: 'scale(1)', opacity: 1 },
                          }
                        }}
                      >
                        {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                )
              }}
            />
            {isListening && (
              <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <IconMicrophone size={12} /> Listening… speak now
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: (formData.description || '').length < 500 ? 'error.main' : 'success.main',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {perms.write ? (
                  (formData.description || '').length < 500 ? (
                    <>
                      <IconAlertCircle size={14} /> Min. 500 characters required (Currently {(formData.description || '').length}/500)
                    </>
                  ) : (
                    <>
                      <IconInfoCircle size={14} style={{ color: theme.palette.success.main }} /> Met minimum length requirements ({(formData.description || '').length} characters)
                    </>
                  )
                ) : (
                  <>
                    <IconInfoCircle size={14} style={{ color: theme.palette.info.main }} /> Description length: {(formData.description || '').length} characters
                  </>
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {(isListening && interimText ? (formData.description || '') + ' ' + interimText : (formData.description || '')).trim().split(/\s+/).filter(Boolean).length} words | {(isListening && interimText ? (formData.description || '') + ' ' + interimText : (formData.description || '')).length} characters
              </Typography>
            </Box>
            <BOSStatusField
              isCreate={!editId}
              type="string-in-active-no-space"
              name="status"
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={!perms.write}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          {perms.write && (
            <Button variant="contained" onClick={handleSubmit}>
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog 
        open={deleteOpen} 
        onClose={() => setDeleteOpen(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Service Type" 
        message="Are you sure you want to delete this service type?" 
        itemName={deleteName} 
      />
    </MainCard>
  );
}
