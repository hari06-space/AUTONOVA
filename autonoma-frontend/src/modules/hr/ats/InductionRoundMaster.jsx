import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, MenuItem, Chip, InputAdornment, useTheme, Box } from '@mui/material';
import { IconRotate2, IconRefresh, IconPlus, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, BOSFormSection, btnNew, errorStyle, BOSStatusField, BOSTableToolbar, BOSStatusChip, matchDateRange } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

// ==============================|| INDUCTION ROUND MASTER ||============================== //

const INITIAL_STATE = {
  id: null,
  roundName: '',
  description: '',
  displayOrder: '',
  isActive: true
};

const VALIDATION_RULES = [
  { field: 'roundName', label: 'Round Name', required: true }
];

export default function InductionRoundMaster() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const perms = usePagePermissions(PAGE_CODES.ATS_INDUCTION_ROUND);

  const globalQuery = useSelector((state) => state.search.query) || '';
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  const columns = useMemo(() => [
    { id: 'index', label: 'Sl.No', minWidth: 60 },
    { id: 'roundName', label: 'Round Name', bold: true, color: 'primary.main', minWidth: 180 },
    { id: 'description', label: 'Description', minWidth: 280 },
    { id: 'displayOrder', label: 'Order', minWidth: 80 },
    {
      id: 'isActive',
      label: 'Status',
      minWidth: 110,
      render: (row) => (
        <BOSStatusChip status={row.isActive !== false ? 'Active' : 'Inactive'} showIcon />
      )
    },
    { id: 'createdBy', label: 'Created By', minWidth: 120 },
    { id: 'createdAt', label: 'Created Date', minWidth: 150 },
    { id: 'updatedBy', label: 'Updated By', minWidth: 120 },
    { id: 'updatedAt', label: 'Updated Date', minWidth: 150 }
  ], []);

  // Filter config
  useEffect(() => {
    const config = [
      {
        id: 'isActive',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'ACTIVE', label: 'ACTIVE' },
          { value: 'INACTIVE', label: 'INACTIVE' }
        ],
        defaultValue: 'ACTIVE',
        isStarred: true
      },
      {
        id: 'createdAt',
        label: 'CREATED DATE',
        type: 'dateRange',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    dispatch(setFilters({
      isActive: 'ACTIVE',
      createdAtStart: '',
      createdAtEnd: '',
      createdAtConsider: 'No'
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/induction-round');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch induction rounds:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      ...row,
      displayOrder: row.displayOrder ?? ''
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) clearErrors(name);
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    if ((formData.description || '').trim().length < 500) {
      setErrors(prev => ({
        ...prev,
        description: 'Description/SOP must be at least 500 characters long.'
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'Description/SOP must contain at least 500 characters.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    try {
      const payload = {
        roundName: formData.roundName.trim().toUpperCase(),
        description: formData.description,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder, 10) : null,
        isActive: formData.isActive !== false
      };

      if (formData.id) {
        await axios.put(`/api/hr/induction-round/${formData.id}`, payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Induction Round Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/hr/induction-round', payload);
        dispatch(openSnackbar({
          open: true,
          message: 'Induction Round Created Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save induction round';
      dispatch(openSnackbar({
        open: true,
        message: msg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error'
      }));
    }
  };

  const handleDelete = (row) => {
    setDeleteTarget(row);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/induction-round/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Induction Round Inactivated Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to inactivate', variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (!matchDateRange(row, globalFilters, 'createdAt')) return false;

        const statusFilter = (globalFilters?.isActive || 'ACTIVE').toUpperCase();
        if (statusFilter !== 'ALL') {
          const isActiveVal = statusFilter === 'ACTIVE';
          if (row.isActive !== isActiveVal) return false;
        }

        if (globalQuery) {
          const q = globalQuery.toLowerCase();
          const matchText = (
            (row.roundName || '') + ' ' +
            (row.description || '')
          ).toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .map((r, i) => ({
        ...r,
        index: i + 1,
        createdAt: r.createdAt || '-',
        updatedAt: r.updatedAt || '-'
      }));
  }, [rows, globalFilters, globalQuery]);

  const exportColumns = useMemo(() => [
    { id: 'roundName', header: 'Round Name', key: (row) => row.roundName || '-' },
    { id: 'description', header: 'Description', key: (row) => row.description || '-' },
    { id: 'displayOrder', header: 'Order', key: (row) => row.displayOrder !== undefined ? String(row.displayOrder) : '-' },
    { id: 'isActive', header: 'Status', key: (row) => (row.isActive !== false) ? 'Active' : 'Inactive' },
    { id: 'createdBy', header: 'Created By', key: (row) => row.createdBy || '-' },
    { id: 'createdAt', header: 'Created Date', key: (row) => row.createdAt || '-' },
    { id: 'updatedBy', header: 'Updated By', key: (row) => row.updatedBy || '-' },
    { id: 'updatedAt', header: 'Updated Date', key: (row) => row.updatedAt || '-' }
  ], []);

  return (
    <MainCard fullWidth
      icon={IconRotate2}
      title={"Induction Round Master"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New"
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Induction_Round_Master"
          hasExportPermission={perms.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onEditRow={handleOpenEdit}
        onDeleteRow={handleDelete}
        onDoubleClickRow={handleOpenEdit}
        hasWritePermission={perms.write}
        hasDeletePermission={perms.delete}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={formData.id ? 'Edit Induction Round' : 'Add Induction Round'}
        fullWidth
        maxWidth="sm"
        onSave={handleSave}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setErrors({});
        }}
        hasId={!!formData.id}
        onDelete={() => {
          setDeleteTarget(formData);
          setDeleteDialogOpen(true);
        }}
      >
        <BOSFormSection title="Round Details">
          <Stack spacing={2.5} sx={{ mt: 1.5 }}>
            <BOSTextField
              name="roundName"
              label="ROUND NAME"
              placeholder="e.g. SAFETY, IT, FINANCE..."
              value={formData.roundName}
              onChange={handleInputChange}
              required
              fullWidth
              error={!!errors.roundName}
              helperText={errors.roundName || 'Name will be auto-uppercased'}
              sx={errorStyle(!!errors.roundName)}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />

            <BOSTextField
              name="description"
              label="Description/SOP"
              multiline
              minRows={3}
              value={isListening && interimText ? (formData.description || '') + ' ' + interimText : formData.description || ''}
              onChange={handleInputChange}
              placeholder="Standard Operating Procedure... (or use mic 🎤)"
              InputLabelProps={{ shrink: true }}
              disabled={!perms.write}
              error={!!errors.description}
              helperText={errors.description}
              sx={[ { position: 'relative' }, errorStyle(!!errors.description) ]}
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

            <BOSTextField
              name="displayOrder"
              label="DISPLAY ORDER"
              type="number"
              placeholder="e.g. 1, 2, 3..."
              value={formData.displayOrder}
              onChange={handleInputChange}
              fullWidth
              helperText="Controls the order rounds appear in dropdowns"
              inputProps={{ min: 1 }}
            />

            <BOSStatusField
              isCreate={!formData.id}
              type="boolean"
              name="isActive"
              label="STATUS"
              value={formData.isActive}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, isActive: val === 'true' || val === true }));
              }}
              required
              error={!!errors.isActive}
              helperText={errors.isActive || 'Inactive rounds will not appear in dropdowns'}
              sx={errorStyle(!!errors.isActive)}
            />
          </Stack>
        </BOSFormSection>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Inactivate Induction Round"
        message="Are you sure you want to inactivate this induction round? It will no longer appear in dropdowns."
        itemName={deleteTarget?.roundName}
      />
    </MainCard>
  );
}
