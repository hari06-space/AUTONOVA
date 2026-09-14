import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton, MenuItem, Switch, FormControl, FormLabel, FormControlLabel, Chip, InputAdornment, useTheme, Box } from '@mui/material';
import { IconShieldCheck, IconRefresh, IconPlus, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable, BOSFormDialog, BOSTextField, errorStyle, BOSStatusField, BOSTableToolbar, BOSStatusChip, btnCancel } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import { setFilterConfig, setFilters } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

// ==============================|| VERIFICATION CRITERIA MASTER ||============================== //

const INITIAL_STATE = {
  id: null,
  type: '',
  description: '',
  isActive: true
};

const TYPE_OPTIONS = [
  'TECHNICAL',
  'TARGET',
  'BEHAVIOUR',
  'FINAL CONCLUSION'
];

const VALIDATION_RULES = [
  { field: 'type', label: 'Type', required: true },
  { field: 'description', label: 'Description', required: true }
];

export default function VerificationCriteria() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const globalQuery = useSelector((state) => state.search.query) || '';
  const globalFilters = useSelector((state) => state.search.filters) || {};

  const perms = usePagePermissions(PAGE_CODES.ATS_VERIFICATION);

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
    { id: 'type', label: 'Type', bold: true, color: 'primary.main', minWidth: 150 },
    { id: 'description', label: 'Description', bold: true, minWidth: 300 },
    {
      id: 'isActive',
      label: 'Status',
      minWidth: 100,
      render: (row) => {
        const active = row.isActive !== false;
        return <BOSStatusChip status={active ? 'Active' : 'Inactive'} showIcon={true} width={100} />;
      }
    },
    { id: 'createdUser', label: 'CREATED USER', minWidth: 120 },
    {
      id: 'createdAt',
      label: 'CREATED DATE',
      minWidth: 180,
      render: (row) => row.createdAt
    },
    { id: 'updatedUser', label: 'UPDATED USER', minWidth: 120 },
    {
      id: 'updatedAt',
      label: 'UPDATED DATE',
      minWidth: 180,
      render: (row) => row.updatedAt
    }
  ], []);

  // Dispatch starred filter configuration matching Status
  useEffect(() => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
      createdAtStart: today
    }));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/verification-criteria');
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch verification criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load data', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Real-time synchronization
  useEffect(() => {
    const handleRealtimeUpdate = (e) => {
      const eventData = e.detail;
      if (eventData && eventData.entityName === 'VerificationCriteriaController') {
        fetchRows();
      }
    };
    window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
    };
  }, [fetchRows]);

  const handleOpenAdd = () => {
    setFormData(INITIAL_STATE);
    setErrors({});
    setDialogOpen(true);
  };

  const handleOpenEdit = (row) => {
    setFormData({
      ...row
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

    if ((formData.description || '').trim().length < 50) {
      setErrors(prev => ({
        ...prev,
        description: 'Description/SOP must be at least 50 characters long.'
      }));
      dispatch(openSnackbar({
        open: true,
        message: 'Description/SOP must contain at least 50 characters.',
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    try {
      const payload = {
        ...formData
      };

      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.createdUser;
      delete payload.updatedUser;
      delete payload.index;

      if (formData.id) {
        await axios.put(`/api/hr/verification-criteria/${formData.id}`, payload, { skipGlobalAlert: true });
        dispatch(openSnackbar({
          open: true,
          message: 'Verification Criteria Updated Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      } else {
        await axios.post('/api/hr/verification-criteria', payload, { skipGlobalAlert: true });
        dispatch(openSnackbar({
          open: true,
          message: 'Verification Criteria Saved Successfully',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success'
        }));
      }
      setDialogOpen(false);
      fetchRows();
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error.response?.data?.message || error.response?.data || 'Failed to save verification criteria');
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
      await axios.delete(`/api/hr/verification-criteria/${deleteTarget.id}`);
      dispatch(openSnackbar({ open: true, message: 'Verification Criteria Deleted Successfully', variant: 'alert', severity: 'success' }));
      setDeleteDialogOpen(false);
      fetchRows();
    } catch (error) {
      console.error('Failed to delete verification criteria:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete', variant: 'alert', severity: 'error' }));
    }
  };

  const resolvedRows = useMemo(() => {
    return rows
      .filter((row) => {
        const statusFilter = globalFilters.isActive || 'ALL';
        if (statusFilter !== 'ALL') {
          const isActiveVal = statusFilter === 'ACTIVE';
          if (row.isActive !== isActiveVal) return false;
        }

        if (globalQuery) {
          const q = globalQuery.toLowerCase();
          const matchText = (
            (row.type || '') + ' ' +
            (row.description || '')
          ).toLowerCase();
          if (!matchText.includes(q)) return false;
        }

        return true;
      })
      .map((r, i) => {
        const hasBeenUpdated = (() => {
          if (!r.updatedAt || !r.createdAt) return false;
          const createdTime = new Date(r.createdAt).getTime();
          const updatedTime = new Date(r.updatedAt).getTime();
          return Math.abs(updatedTime - createdTime) > 1000;
        })();

        return {
          ...r,
          index: i + 1,
          createdUser: r.createdUser || r.createdBy || '-',
          updatedUser: hasBeenUpdated ? (r.updatedUser || r.updatedBy || '-') : '-',
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
          updatedAt: hasBeenUpdated ? new Date(r.updatedAt).toLocaleString() : '-'
        };
      });
  }, [rows, globalQuery, globalFilters]);

  const exportColumns = useMemo(() => [
    { id: 'type', header: 'Type', key: (row) => row.type || '-' },
    { id: 'description', header: 'Description', key: (row) => row.description || '-' },
    { id: 'isActive', header: 'Status', key: (row) => row.isActive !== false ? 'Active' : 'Inactive' },
    { id: 'createdUser', header: 'Created By', key: (row) => row.createdUser || row.createdBy || '-' },
    { id: 'createdAt', header: 'Created Date', key: (row) => row.createdAt || '-' },
    { id: 'updatedUser', header: 'Updated By', key: (row) => row.updatedUser || row.updatedBy || '-' },
    { id: 'updatedAt', header: 'Updated Date', key: (row) => row.updatedAt || '-' }
  ], []);

  return (
    <MainCard fullWidth
      icon={IconShieldCheck}
      title={"Applicant Verification Criteria"}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New"
          hasWritePermission={perms.write}
          exportData={resolvedRows}
          exportColumns={exportColumns}
          exportFilename="Verification_Criteria"
          hasExportPermission={perms.export}

          columns={columns} />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={resolvedRows}
        loading={loading}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={handleDelete}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
      />

      <BOSFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Verification Criteria"
        fullWidth
        maxWidth="sm"
        onSave={handleSave}
        onClear={() => {
          setFormData(INITIAL_STATE);
          setErrors({});
        }}
        secondaryActions={
          <Tooltip title="Cancel (Space + C)">
            <Button
              variant="contained"
              onClick={() => setDialogOpen(false)}
              sx={btnCancel}
            >
              Cancel
            </Button>
          </Tooltip>
        }
        hasId={!!formData.id}
        onDelete={() => {
          setDeleteTarget(formData);
          setDeleteDialogOpen(true);
        }}
      >
        <Stack spacing={2.5} sx={{ mt: 1.5 }}>
          <BOSTextField
            select
            name="type"
            label="TYPE"
            value={formData.type}
            onChange={handleInputChange}
            required
            helperText={errors.type || "Select verification type"}
            error={!!errors.type}
            sx={errorStyle(!!errors.type)}
          >

            {TYPE_OPTIONS.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </BOSTextField>

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
            sx={{ position: 'relative', ...errorStyle(!!errors.description) }}
            error={!!errors.description}
            helperText={errors.description || ""}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: -1, mb: 1, px: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: (formData.description || '').length < 50 ? 'error.main' : 'success.main',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {perms.write ? (
                (formData.description || '').length < 50 ? (
                  <>
                    <IconAlertCircle size={14} /> Min. 50 characters required (Currently {(formData.description || '').length}/50)
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
          </Box>

          <FormControl component="fieldset" disabled={!formData.id} sx={{ mt: 1 }}>
            <FormLabel component="legend" sx={{ fontSize: '0.75rem', mb: 0.5, color: 'text.secondary' }}>Status</FormLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label={formData.isActive !== false ? 'Active' : 'Inactive'}
            />
          </FormControl>
        </Stack>

      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Verification Criteria"
        message="Are you sure you want to completely remove this verification criteria?"
        itemName={deleteTarget?.type}
      />
    </MainCard>
  );
}