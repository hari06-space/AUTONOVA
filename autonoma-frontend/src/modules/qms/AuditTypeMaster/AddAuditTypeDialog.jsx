import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, InputAdornment, IconButton, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconSettings, IconMicrophone, IconMicrophoneOff, IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import axios from 'utils/axios';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import useMasterDataStore from 'store/useMasterDataStore';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import { API_PATHS } from 'utils/api-constants';

import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import useBOSSpeechRecognition from 'hooks/useBOSSpeechRecognition';

// ==============================|| AUDIT TYPE - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'auditType', label: 'Audit Type', required: true, requiredMessage: 'Please Enter Audit Type...' },
  { field: 'description', label: 'Description/SOP', required: true, requiredMessage: 'Please Enter Audit Description/SOP...' },
  { field: 'criteriaType', label: 'Audit Criteria Type', required: true, requiredMessage: 'Please Select Audit Criteria Type...' }
];

const AddAuditTypeDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();

  const [formData, setFormData] = useState({
    auditType: '',
    standard: '',
    description: '',
    criteriaMinCount: 0,
    customerAuditArea: 'NO',
    auditArea: '',
    criteriaType: 'Fixed',
    isActive: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [auditAreas, setAuditAreas] = useState([]);

  const { isListening, interimText, toggleListening } = useBOSSpeechRecognition({
    onResult: (finalText) => {
      setFormData(prev => ({
        ...prev,
        description: (prev.description ? prev.description + ' ' : '') + finalText
      }));
    }
  });

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await axios.get(API_PATHS.QMS.AUDIT_AREA);
        setAuditAreas((res.data || []).filter(a => a && a.isActive));
      } catch (error) {
        console.error('Failed to fetch areas:', error);
        setAuditAreas([]);
      }
    };
    if (open) fetchAreas();
  }, [open]);

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData({
        id: initialData.id,
        auditType: initialData.auditType || '',
        standard: initialData.standard || '',
        description: initialData.description || '',
        criteriaMinCount: initialData.criteriaMinCount || 0,
        customerAuditArea: String(initialData.customerAuditArea || '').trim().toUpperCase() === 'YES' ? 'YES' : 'NO',
        auditArea: initialData.auditArea || '',
        criteriaType: (initialData.criteriaType && initialData.criteriaType.trim()) ? initialData.criteriaType : 'Fixed',
        isActive: initialData.isActive !== false
      });
      setIsEditing(false);
    } else {
      setFormData({
        auditType: '',
        standard: '',
        description: '',
        criteriaMinCount: 0,
        customerAuditArea: 'NO',
        auditArea: '',
        criteriaType: 'Fixed',
        isActive: true
      });
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // SOP: Converted to uppercase automatically for auditType
    const finalValue = name === 'auditType' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      clearErrors(name);
    }
    if (name === 'criteriaType' && value === 'Variable') {
      clearErrors('criteriaMinCount');
    }
  };

  const handleClear = () => {
    setFormData({
      auditType: '',
      standard: '',
      description: '',
      criteriaMinCount: 0,
      customerAuditArea: 'NO',
      auditArea: '',
      criteriaType: 'Fixed',
      isActive: true
    });
    clearErrors();
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_TYPE}/${formData.id}`);
      useMasterDataStore.getState().invalidate(['AUDIT_TYPE']);
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete audit type:', error);
    }
  };

  const handleSave = async () => {
    const rules = [...VALIDATION_RULES];
    if (formData.criteriaType !== 'Variable') {
      rules.push({
        field: 'criteriaMinCount',
        label: 'Criteria Minimum Count',
        required: true,
        validate: (val) => Number(val) <= 0 ? 'Please Enter Audit Criteria Minimum Count...' : null
      });
    }
    if (!validate(formData, rules)) return;

    try {
      const payload = {
        ...formData,
        auditArea: Array.isArray(formData.auditArea) ? formData.auditArea.join(', ') : formData.auditArea
      };
      delete payload.createdUser;
      delete payload.updatedUser;

      if (formData.id) {
        await axios.put(`${API_PATHS.QMS.AUDIT_TYPE}/${formData.id}`, payload, { skipGlobalAlert: true });
      } else {
        await axios.post(API_PATHS.QMS.AUDIT_TYPE, payload, { skipGlobalAlert: true });
      }
      useMasterDataStore.getState().invalidate(['AUDIT_TYPE']);
      handleClose(true);
    } catch (error) {
      console.error('Failed to save audit type:', error);
      let errorMsg = 'An error occurred while saving.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      if (errorMsg.includes('auditType') || errorMsg.toLowerCase().includes('duplicate value on field audittype')) {
        setErrors({ auditType: 'Duplicate Audit Type! Please check.' });
      } else if (errorMsg.includes('description') || errorMsg.toLowerCase().includes('duplicate value on field description')) {
        setErrors({ description: 'Duplicate Description! Please check.' });
      }

      dispatch(openSnackbar({
        open: true,
        message: errorMsg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose()}
      onSave={handleSave}
      onDelete={handleDelete}
      onClear={handleClear}
      onEditClick={() => setIsEditing(true)}
      title={initialData ? 'Edit Audit Type' : 'New Audit Type'}
      isViewOnly={isViewOnly}
      hasId={!!formData.id}
      maxWidth="md"
    >
      <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Type Details">
        <BOSTextField
          name="auditType"
          label="Audit Type"
          value={formData.auditType}
          onChange={handleChange}
          // SOP: During edit operation, Audit Type field should become Read Only
          disabled={isViewOnly || !!formData.id}
          required
          error={!!errors.auditType}
          helperText={errors.auditType}
          sx={errorStyle(!!errors.auditType)}
        />

        <BOSTextField
          name="standard"
          label="Standard"
          value={formData.standard}
          onChange={handleChange}
          disabled={isViewOnly}
        />

        <BOSTextField
          name="description"
          label="Description/SOP"
          multiline
          minRows={3}
          value={isListening && interimText ? (formData.description || '') + ' ' + interimText : formData.description || ''}
          onChange={handleChange}
          placeholder="Standard Operating Procedure... (or use mic 🎤)"
          InputLabelProps={{ shrink: true }}
          disabled={isViewOnly}
          disableRichText={true}
          required
          error={!!errors.description}
          helperText={errors.description}
          sx={{ position: 'relative', ...errorStyle(!!errors.description) }}
          InputProps={{
            endAdornment: !isViewOnly && (
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

        <BOSTextField
          select
          required
          name="criteriaType"
          label="Audit Criteria Type"
          value={formData.criteriaType}
          onChange={handleChange}
          disabled={isViewOnly}
          disableRichText={true}
          error={!!errors.criteriaType}
          helperText={errors.criteriaType}
          sx={errorStyle(!!errors.criteriaType)}
        >
          <MenuItem value="Fixed">Fixed</MenuItem>
          <MenuItem value="Variable">Open</MenuItem>
        </BOSTextField>

        <BOSTextField
          name="criteriaMinCount"
          label="Criteria Minimum Count"
          type="number"
          value={formData.criteriaMinCount}
          onChange={handleChange}
          disabled={isViewOnly}
          required={formData.criteriaType !== 'Variable'}
          error={!!errors.criteriaMinCount}
          helperText={errors.criteriaMinCount}
          sx={errorStyle(!!errors.criteriaMinCount)}
        />

        <BOSTextField
          select
          name="customerAuditArea"
          label="External Audit"
          value={formData.customerAuditArea}
          onChange={handleChange}
          disabled={isViewOnly}
        >
          <MenuItem value="YES">YES</MenuItem>
          <MenuItem value="NO">NO</MenuItem>
        </BOSTextField>

        <Autocomplete
          options={auditAreas}
          getOptionLabel={(option) => option.description || ''}
          value={auditAreas.find((a) => a.description === formData.auditArea) || null}
          onChange={(event, newValue) => {
            setFormData({ ...formData, auditArea: newValue ? newValue.description : '' });
          }}
          disabled={isViewOnly}
          renderInput={(params) => (
            <BOSTextField {...params} label="Audit Area" />
          )}
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <li key={key} {...optionProps}>
                {option.description}
              </li>
            );
          }}
          sx={{
            '& .MuiAutocomplete-tag': {
              bgcolor: 'primary.light',
              color: 'primary.main',
              fontWeight: 600,
              height: 24
            }
          }}
        />

        <BOSStatusField
          isCreate={!formData.id}
          type="boolean"
          name="isActive"
          label="Status"
          value={formData.isActive}
          onChange={handleChange}
          disabled={isViewOnly}
        />
      </BOSFormSection>
      
    </BOSFormDialog>
  );
};

AddAuditTypeDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddAuditTypeDialog;
