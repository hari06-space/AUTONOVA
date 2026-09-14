import { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Checkbox,
  Box,
  Typography,
  IconButton,
  MenuItem,
  useTheme,
  InputAdornment,
  Grid,
  Stack,
  Button
} from '@mui/material';
import {
  IconPaperclip,
  IconSettings,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlus,
  IconTrash
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField, BOSToggleSwitch } from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import { API_PATHS } from 'utils/api-constants';
import BOSQmsAttachmentUpload from 'ui-component/bos/BOSQmsAttachmentUpload';
import useLookups from 'hooks/useLookups';
import useBOSValidation from 'hooks/useBOSValidation';

// ==============================|| AUDIT CRITERIA - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'seqNo', label: 'Seq No', required: true, requiredMessage: 'Sequence No should be mandatory (Auto generated).' },
  { field: 'auditType', label: 'Audit Type', required: true, requiredMessage: 'At least one Audit Type should be selected.' },
  { field: 'criteriaText', label: 'Audit Criteria', required: true, requiredMessage: 'Audit Criteria field should not be empty.' },
  { field: 'departmentIds', label: 'Departments', required: true, requiredMessage: 'At least one Department should be selected.' }
];

const AddAuditCriteriaDialog = ({ open, handleClose, initialData, readOnly = false, nextSeq = '' }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const { errors, validate, clearErrors, setErrors } = useBOSValidation();
  const [formData, setFormData] = useState({
    seqNo: '',
    auditType: [],
    clause: '',
    criteriaText: '',
    departmentIds: [],
    attachmentRequired: 'NO',
    status: 'ACTIVE'
  });

  const { auditTypes = [], departments: deptLookups = [] } = useLookups(['AUDIT_TYPE', 'DEPARTMENTS']);
  const auditTypeOptions = useMemo(() => {
    return [...new Set(auditTypes.map(t => t.auditType).filter(Boolean))];
  }, [auditTypes]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onstart = () => {
      setIsListening(true);
    };

    recog.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const cleaned = transcript
          .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, '')
          .trim()
          .toUpperCase();
        setFormData((prev) => ({
          ...prev,
          criteriaText: prev.criteriaText ? `${prev.criteriaText} ${cleaned}` : cleaned
        }));
      }
      setIsListening(false);
    };

    recog.onerror = (event) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error('Speech recognition error in dialog', event.error);
      setIsListening(false);

      let errorMsg = 'Error during voice recognition. Please try again.';
      if (event.error === 'not-allowed') {
        errorMsg = 'Microphone permission denied. Please allow microphone access in your browser address bar/settings.';
      } else if (event.error === 'no-speech') {
        errorMsg = 'No speech detected. Please speak clearly into the microphone.';
      } else if (event.error === 'network') {
        errorMsg = 'Network error. Speech recognition requires an active internet connection.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone detected. Please connect a mic and try again.';
      }

      dispatch(
        openSnackbar({
          open: true,
          message: errorMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: event.error === 'no-speech' ? 'info' : 'error',
          close: false
        })
      );
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      recog.onstart = null;
      recog.onresult = null;
      recog.onerror = null;
      recog.onend = null;
      try { recog.abort(); } catch { }
      recognitionRef.current = null;
    };
  }, [dispatch]);

  const handleMicClick = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const recog = recognitionRef.current;
    if (isListening) {
      if (recog) recog.stop();
    } else {
      if (recog) {
        try { recog.start(); } catch (err) { console.warn('Mic start error:', err); }
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: 'Speech Recognition is not supported by your browser.',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'warning',
            close: false
          })
        );
      }
    }
  };

  useEffect(() => {
    setErrors({});
    setPendingFiles([]);
    setAllFiles([]);
    if (initialData) {
      setFormData({
        id: initialData.id,
        seqNo: initialData.seqNo || '',
        auditType: initialData.auditType ? initialData.auditType.split(', ') : [],
        clause: initialData.clause || '',
        criteriaText: initialData.criteriaText || '',
        departmentIds: initialData.departmentIds || [],
        attachmentRequired: (initialData.attachmentRequired === true || initialData.attachmentRequired === 'YES' || initialData.attachmentRequired === 'true') ? 'YES' : 'NO',
        mandatoryCriteria: initialData.mandatoryCriteria === 1 ? 1 : 0,
        isActive: initialData.isActive !== false
      });

      setIsEditing(false);
    } else {
      setFormData({
        seqNo: nextSeq,
        auditType: [],
        clause: '',
        criteriaText: '',
        departmentIds: [],
        attachmentRequired: 'NO',
        mandatoryCriteria: 0,
        isActive: true
      });
      setIsEditing(!readOnly);
    }
  }, [initialData, open, nextSeq, readOnly]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'auditType') {
      const selectedNames = typeof value === 'string' ? value.split(',') : value;
      setFormData((prev) => ({ ...prev, [name]: selectedNames }));
    } else if (name === 'criteriaText') {
      // SOP: Audit Criteria field should automatically convert to uppercase
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      clearErrors(name);
    }
  };

  const handleClear = () => {
    setFormData({
      seqNo: formData.seqNo,
      auditType: [],
      clause: '',
      criteriaText: '',
      departmentIds: [],
      attachmentRequired: 'NO',
      mandatoryCriteria: 0,
      isActive: true
    });
    setPendingFiles([]);
    clearErrors();
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_PATHS.QMS.AUDIT_CRITERIA}/${formData.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Audit Criteria deleted successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete audit criteria:', error);
    }
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    if (formData.attachmentRequired === 'YES' && allFiles.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'At least one attachment is required when Attachment Required is set to YES.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
      return;
    }

    try {
      const payload = { ...formData };
      delete payload.attachmentInfo;

      const submissionData = {
        ...formData,
        attachmentRequired: formData.attachmentRequired === 'YES',
        isActive: !!formData.isActive,
        auditType: Array.isArray(formData.auditType) ? formData.auditType.join(', ') : formData.auditType,
      };
      delete submissionData.createdUser;
      delete submissionData.updatedUser;

      let savedId = formData.id;
      if (formData.id !== undefined && formData.id !== null) {
        await axios.put(`${API_PATHS.QMS.AUDIT_CRITERIA}/${formData.id}`, submissionData);
      } else {
        const response = await axios.post(API_PATHS.QMS.AUDIT_CRITERIA, submissionData);
        savedId = response.data.id;
      }

      if (pendingFiles.length > 0 && savedId) {
        const uploadFormData = new FormData();
        pendingFiles.forEach(file => uploadFormData.append('files', file));
        await axios.post(`/api/master/qms/attachment/M1130/${savedId}`, uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { docType: 'AUDIT CRITERIA' }
        });
      }

      dispatch(
        openSnackbar({
          open: true,
          message: 'Audit Criteria saved successfully.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );

      handleClose(true);
    } catch (error) {
      console.error('Failed to save audit criteria:', error);
      let errorMsg = 'An error occurred while saving.';
      if (typeof error === 'string') {
        errorMsg = error;
      } else if (error.response?.data) {
        errorMsg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : errorMsg);
      } else if (error.message) {
        errorMsg = error.message;
      }

      if (typeof errorMsg === 'string') {
        if (errorMsg.toLowerCase().includes('seq no')) {
          setErrors({ seqNo: errorMsg });
        } else if (errorMsg.toLowerCase().includes('clause') || errorMsg.toLowerCase().includes('same')) {
          setErrors({ clause: errorMsg });
        }
      }

      dispatch(openSnackbar({
        open: true,
        message: typeof errorMsg === 'string' ? errorMsg : 'Duplicate value or error occurred.',
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  const sidebarContent = (
    <Stack spacing={4}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Attachments</Typography>
        <BOSQmsAttachmentUpload
          label="Upload"
          pageCode="M1130"
          refId={formData.id}
          disabled={isViewOnly}
          docType="AUDIT CRITERIA"
          multiple={true}
          onFilesChange={(uploadedOrPendingFiles) => {
            setAllFiles(uploadedOrPendingFiles || []);
            const localFiles = (uploadedOrPendingFiles || []).filter(f => f.isLocal);
            setPendingFiles(localFiles);
          }}
        />
      </Box>
    </Stack>
  );

  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose()}
      onSave={handleSave}
      onDelete={handleDelete}
      onClear={handleClear}
      onEditClick={() => setIsEditing(true)}
      title={initialData ? 'Edit Audit Criteria' : 'Audit Criteria'}
      isViewOnly={isViewOnly}
      hasId={formData.id !== undefined && formData.id !== null}
      maxWidth="lg"
      sidebar={sidebarContent}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Criteria Details">
          <BOSTextField
            name="seqNo"
            label="Seq No"
            value={formData.seqNo}
            inputProps={{ readOnly: true }}
            error={!!errors.seqNo}
            helperText={errors.seqNo}
            // SOP: Sequence No should be displayed in highlighted format.
            sx={[{
              '& .MuiOutlinedInput-root': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)',
                fontWeight: 'bold',
                color: 'primary.main'
              }
            }, errorStyle(!!errors.seqNo)]}
          />

          <Autocomplete
            multiple
            freeSolo
            disableCloseOnSelect
            options={auditTypeOptions.length > 0 ? ['SELECT ALL', ...auditTypeOptions] : []}
            getOptionLabel={(option) => option || ''}
            value={formData.auditType || []}
            onChange={(event, newValue) => {
              const hasSelectAll = newValue.includes('SELECT ALL');
              if (hasSelectAll) {
                if (formData.auditType.length === auditTypeOptions.length) {
                  handleChange({ target: { name: 'auditType', value: [] } });
                } else {
                  handleChange({ target: { name: 'auditType', value: auditTypeOptions } });
                }
              } else {
                handleChange({ target: { name: 'auditType', value: newValue } });
              }
            }}
            disabled={isViewOnly}
            renderInput={(params) => (
              <BOSTextField
                {...params}
                label="Audit Type"
                required
                error={!!errors.auditType}
                helperText={errors.auditType}
                sx={errorStyle(!!errors.auditType)}
              />
            )}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              const isSelectAllOption = option === 'SELECT ALL';
              const isSelected = isSelectAllOption
                ? (formData.auditType || []).length === auditTypeOptions.length
                : selected;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    size="small"
                    style={{ marginRight: 8 }}
                    checked={isSelected}
                    indeterminate={isSelectAllOption && (formData.auditType || []).length > 0 && (formData.auditType || []).length < auditTypeOptions.length}
                  />
                  {option}
                </li>
              );
            }}
            sx={{ '& .MuiAutocomplete-tag': { bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600, height: 24 } }}
          />

          <BOSTextField
            name="clause"
            label="Clause"
            value={formData.clause}
            onChange={handleChange}
            disabled={isViewOnly}
            error={!!errors.clause}
            helperText={errors.clause}
            sx={errorStyle(!!errors.clause)}
          />

          <BOSTextField
            name="criteriaText"
            label="Audit Criteria"
            multiline
            rows={4}
            value={formData.criteriaText}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            disableRichText={true}
            error={!!errors.criteriaText}
            helperText={errors.criteriaText}
            sx={[{ position: 'relative' }, errorStyle(!!errors.criteriaText)]}
            InputProps={{
              endAdornment: !isViewOnly && (
                <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {isListening && <VoiceWaveform />}
                    <IconButton
                      color={isListening ? 'error' : 'primary'}
                      onClick={(e) => handleMicClick(e)}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      sx={{
                        animation: isListening ? 'pulse 1.5s infinite' : 'none',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.2)' },
                          '100%': { transform: 'scale(1)' }
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

          <Autocomplete
            multiple
            disableCloseOnSelect
            options={deptLookups.length > 0 ? [{ isSelectAll: true, departmentName: 'SELECT ALL', id: 'ALL' }, ...deptLookups] : []}
            getOptionLabel={(option) => option.departmentName || ''}
            value={deptLookups.filter((d) => (formData.departmentIds || []).includes(d.id))}
            onChange={(event, newValue) => {
              const hasSelectAll = newValue.some(v => v.isSelectAll);
              if (hasSelectAll) {
                if (formData.departmentIds.length === deptLookups.length) {
                  handleChange({ target: { name: 'departmentIds', value: [] } });
                } else {
                  handleChange({ target: { name: 'departmentIds', value: deptLookups.map((d) => d.id) } });
                }
              } else {
                handleChange({ target: { name: 'departmentIds', value: newValue.map((v) => v.id) } });
              }
            }}
            disabled={isViewOnly}
            renderInput={(params) => (
              <BOSTextField
                {...params}
                label="Department"
                required
                error={!!errors.departmentIds}
                helperText={errors.departmentIds}
                sx={errorStyle(!!errors.departmentIds)}
              />
            )}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props;
              const isSelectAllOption = option.isSelectAll;
              const isSelected = isSelectAllOption
                ? (formData.departmentIds || []).length === deptLookups.length
                : selected;
              return (
                <li key={key} {...optionProps}>
                  <Checkbox
                    size="small"
                    style={{ marginRight: 8 }}
                    checked={isSelected}
                    indeterminate={isSelectAllOption && (formData.departmentIds || []).length > 0 && (formData.departmentIds || []).length < deptLookups.length}
                  />
                  {option.departmentName}
                </li>
              );
            }}
            sx={{ '& .MuiAutocomplete-tag': { bgcolor: 'primary.light', color: 'primary.main', fontWeight: 600, height: 24 } }}
          />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <BOSTextField select name="attachmentRequired" label="Attachment required" value={formData.attachmentRequired} onChange={handleChange} disabled={isViewOnly} sx={{ maxWidth: 200 }}>
              <MenuItem value="YES">YES</MenuItem>
              <MenuItem value="NO">NO</MenuItem>
            </BOSTextField>

            <BOSTextField select name="mandatoryCriteria" label="Mandatory Criteria" value={formData.mandatoryCriteria} onChange={handleChange} disabled={isViewOnly} disableToggle={true} sx={{ maxWidth: 200 }}>
              <MenuItem value={1}>YES</MenuItem>
              <MenuItem value={0}>NO</MenuItem>
            </BOSTextField>
          </Box>

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
      </Box>
    </BOSFormDialog>
  );
};

AddAuditCriteriaDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool,
  nextSeq: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default AddAuditCriteriaDialog;
