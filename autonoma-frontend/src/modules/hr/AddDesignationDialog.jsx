import React, { useState, useEffect } from 'react';
import { MenuItem, Box, Stack, Typography, Paper, useTheme } from '@mui/material';
import { IconBriefcase, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle } from 'ui-component/bos';
import useBOSForm from 'hooks/useBOSForm';
import useMasterDataStore from 'store/useMasterDataStore';

// ==============================|| DESIGNATION - PROFESSIONAL TEMPLATE ||============================== //

export default function AddDesignationDialog({ open, handleClose, initialData, readOnly = false }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [levels, setLevels] = useState([]);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    designationCode: '',
    designationName: '',
    experience: '',
    appearInCompetency: 'YES',
    displaySlNo: '',
    qualification: '',
    jobDescription: '',
    subCategoryLevel: '',
    budgetedPositions: '',
    orgSeqNo: ''
  });

  const fetchLevels = async () => {
    try {
      const response = await axios.get('/api/master/hr/designation-levels');
      setLevels(response.data || []);
    } catch (e) {
      console.error('Failed to fetch levels:', e);
    }
  };

  useEffect(() => {
    if (open) {
      fetchLevels();
      if (initialData) {
        setFormData({
          ...initialData,
          displaySlNo: initialData.displaySlNo || '',
          budgetedPositions: initialData.budgetedPositions || '',
          orgSeqNo: initialData.orgSeqNo || ''
        });
        setIsEditing(false);
      } else {
        resetForm();
        setIsEditing(!readOnly);
        fetchNextCode();
      }
    }
  }, [open, initialData, setFormData, resetForm, readOnly]);

  const fetchNextCode = async () => {
    try {
      const [codeRes, slRes] = await Promise.all([
        axios.get('/api/master/hr/designations/next-code'),
        axios.get('/api/master/hr/designations/next-sl-no')
      ]);
      setFormData(prev => ({ ...prev, designationCode: codeRes.data, displaySlNo: slRes.data }));
    } catch (e) {
      setFormData(prev => ({ ...prev, designationCode: 'AUTO', displaySlNo: '0' }));
    }
  };

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'designationName', label: 'Designation Name' },
      { field: 'subCategoryLevel', label: 'Level' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    try {
      if (initialData?.id) {
        await axios.put(`/api/master/hr/designations/${initialData.id}`, formData);
      } else {
        await axios.post('/api/master/hr/designations', formData);
      }
      dispatch(openSnackbar({ open: true, message: `Designation ${initialData ? 'updated' : 'saved'} successfully!`, severity: 'success', variant: 'alert' }));
      useMasterDataStore.getState().invalidate(['DESIGNATIONS']);
      handleClose(true);
    } catch (error) {
      const msg = typeof error === 'string' ? error : (error?.message || 'Failed to save designation');
      dispatch(openSnackbar({ 
        open: true, 
        message: typeof msg === 'string' ? msg : 'Failed to save designation', 
        severity: 'error', 
        variant: 'alert' 
      }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose(false)}
      onSave={handleSave}
      onClear={isEditing ? resetForm : null}
      onEditClick={() => setIsEditing(true)}
      isViewOnly={isViewOnly}
      title={initialData ? 'Edit Designation' : 'Add New Designation'}
      maxWidth="md"
    >
      <Stack spacing={3}>
        <BOSFormSection icon={<IconBriefcase size={22} color={theme.palette.primary.main} />} title="Primary Information">
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            <BOSTextField label="Designation Code" value={formData.designationCode} InputProps={{ readOnly: true }} sx={{ bgcolor: 'grey.50' }} />
            <BOSTextField
              required
              label="Designation Name"
              name="designationName"
              value={formData.designationName}
              onChange={handleFormChange}
              disabled={isViewOnly}
              error={errors.designationName}
              sx={errorStyle(errors.designationName)}
            />
            <BOSTextField
              select
              required
              label="Level"
              name="subCategoryLevel"
              value={formData.subCategoryLevel}
              onChange={handleFormChange}
              disabled={isViewOnly}
              error={errors.subCategoryLevel}
              sx={errorStyle(errors.subCategoryLevel)}
            >
              {levels.map(l => <MenuItem key={l.rowId || l.id} value={l.level}>{l.level}</MenuItem>)}
            </BOSTextField>
          </Box>
        </BOSFormSection>

        <BOSFormSection icon={<IconInfoCircle size={22} color={theme.palette.secondary.main} />} title="Operational Details">
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            <BOSTextField label="Experience" name="experience" value={formData.experience} onChange={handleFormChange} disabled={isViewOnly} placeholder="e.g. 2-5 Years" />
            <BOSTextField select label="Competency Tracking" name="appearInCompetency" value={formData.appearInCompetency} onChange={handleFormChange} disabled={isViewOnly}>
              <MenuItem value="YES">YES</MenuItem>
              <MenuItem value="NO">NO</MenuItem>
            </BOSTextField>
            <BOSTextField type="number" label="Org Sequence" name="orgSeqNo" value={formData.orgSeqNo} onChange={handleFormChange} disabled={isViewOnly} />
            <BOSTextField label="Min Qualification" name="qualification" value={formData.qualification} onChange={handleFormChange} disabled={isViewOnly} />
            <BOSTextField type="number" label="Budgeted Vacancies" name="budgetedPositions" value={formData.budgetedPositions} onChange={handleFormChange} disabled={isViewOnly} />
          </Box>
          <Box sx={{ mt: 3 }}>
            <BOSTextField multiline rows={4} label="Role Summary (JD)" name="jobDescription" value={formData.jobDescription} onChange={handleFormChange} disabled={isViewOnly} fullWidth />
          </Box>
        </BOSFormSection>
      </Stack>
    </BOSFormDialog>
  );
}
