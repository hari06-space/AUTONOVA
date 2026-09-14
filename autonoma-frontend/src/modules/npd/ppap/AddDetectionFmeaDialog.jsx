import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme, FormControlLabel, Switch, Box } from '@mui/material';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField, BOSToggleSwitch } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| NPD DETECTION FMEA - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'detection', label: 'Detection', required: true, maxLength: 100 },
  { field: 'criteria', label: 'Criteria', required: true, maxLength: 200 },
  { field: 'detectionMethod', label: 'Detection Method', required: true, maxLength: 200 },
  { field: 'rank', label: 'Rank', required: true }
];

const INITIAL_STATE = { detection: '', criteria: '', detectionMethod: '', aAvail: false, bAvail: false, cAvail: false, rank: '', status: true };

const AddDetectionFmeaDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        detection: initialData.detection || '',
        criteria: initialData.criteria || '',
        detectionMethod: initialData.detectionMethod || '',
        aAvail: initialData.aAvail !== undefined ? initialData.aAvail : false,
        bAvail: initialData.bAvail !== undefined ? initialData.bAvail : false,
        cAvail: initialData.cAvail !== undefined ? initialData.cAvail : false,
        rank: initialData.rank !== null && initialData.rank !== undefined ? initialData.rank : '',
        status: initialData.status !== undefined ? initialData.status : true,
        createdBy: initialData.createdBy
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: (name === 'status' || name === 'aAvail' || name === 'bAvail' || name === 'cAvail') ? checked : value
    }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        ...formData,
        rank: formData.rank === '' ? null : parseInt(formData.rank, 10),
        createdBy: formData.id ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: formData.id ? (user?.id || 'Admin') : null
      };

      if (formData.id) {
        await axios.put(`${API_PATHS.NPD.DETECTION_FMEA}/${formData.id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Detection FMEA updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.DETECTION_FMEA, payload);
        dispatch(openSnackbar({ open: true, message: 'Detection FMEA created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save detection FMEA:', error);
      const errorMsg = error.message || 'Failed to save detection FMEA.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.DETECTION_FMEA}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Detection FMEA deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete detection FMEA:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete detection FMEA.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit Detection FMEA' : 'New Detection FMEA'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="id"
            label="ID"
            value={formData.id || 'Auto Generated'}
            disabled
            InputProps={{ readOnly: true }}
          />

          <BOSTextField
            name="detection"
            label="Detection"
            value={formData.detection}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.detection}
            helperText={errors.detection}
            sx={errorStyle(!!errors.detection)}
          />

          <BOSTextField
            name="criteria"
            label="Criteria"
            value={formData.criteria}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={200}
            error={!!errors.criteria}
            helperText={errors.criteria}
            sx={errorStyle(!!errors.criteria)}
          />

          <BOSTextField
            name="detectionMethod"
            label="Detection Method"
            value={formData.detectionMethod}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={200}
            error={!!errors.detectionMethod}
            helperText={errors.detectionMethod}
            sx={errorStyle(!!errors.detectionMethod)}
          />

          <BOSTextField
            name="rank"
            label="Rank"
            type="number"
            value={formData.rank}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            error={!!errors.rank}
            helperText={errors.rank}
            sx={errorStyle(!!errors.rank)}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, mt: 2, mb: 2 }}>
            <BOSToggleSwitch
              name="aAvail"
              value={!!formData.aAvail}
              onChange={(e) => setFormData(prev => ({ ...prev, aAvail: e.target.value }))}
              checkedValue={true}
              uncheckedValue={false}
              checkedLabel="YES"
              uncheckedLabel="NO"
              disabled={isViewOnly}
              label="A Available"
            />
            <BOSToggleSwitch
              name="bAvail"
              value={!!formData.bAvail}
              onChange={(e) => setFormData(prev => ({ ...prev, bAvail: e.target.value }))}
              checkedValue={true}
              uncheckedValue={false}
              checkedLabel="YES"
              uncheckedLabel="NO"
              disabled={isViewOnly}
              label="B Available"
            />
            <BOSToggleSwitch
              name="cAvail"
              value={!!formData.cAvail}
              onChange={(e) => setFormData(prev => ({ ...prev, cAvail: e.target.value }))}
              checkedValue={true}
              uncheckedValue={false}
              checkedLabel="YES"
              uncheckedLabel="NO"
              disabled={isViewOnly}
              label="C Available"
            />
          </Box>

          <BOSStatusField
            isCreate={!initialData}
            type="boolean"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            disabled={isViewOnly || !initialData}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Detection FMEA"
        message="Are you sure you want to delete this Detection FMEA? This action cannot be undone."
        itemName={formData.detection}
      />
    </>
  );
};

AddDetectionFmeaDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddDetectionFmeaDialog;
