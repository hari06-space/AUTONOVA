import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme } from '@mui/material';
import { IconClipboardCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField , errorStyle} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| UOM - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'uomCode', label: 'UOM Code', required: true, maxLength: 50 },
  { field: 'status', label: 'Status', required: true }
];

const INITIAL_STATE = {
  uomCode: '',
  uomDescription: '',
  status: 'ACTIVE'
};

const AddUomDialog = ({ open, handleClose, initialData, readOnly = false }) => {
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
        originalUomCode: initialData.uomCode,
        uomCode: initialData.uomCode || '',
        uomDescription: initialData.uomDescription || '',
        status: initialData.status || 'ACTIVE',
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        createdAt: initialData.createdAt
      });
      setIsEditing(false);
    } else {
      setFormData(INITIAL_STATE);
      setIsEditing(!readOnly);
    }
  }, [initialData, open, readOnly, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        uomCode: formData.uomCode,
        uomDescription: formData.uomDescription,
        status: formData.status,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        createdAt: formData.createdAt
      };

      if (formData.originalUomCode) {
        await axios.put(`${API_PATHS.ADMIN.UOM}/${formData.originalUomCode}`, payload);
        dispatch(openSnackbar({ open: true, message: 'UOM updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.ADMIN.UOM, payload);
        dispatch(openSnackbar({ open: true, message: 'UOM created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save UOM:', error);
      const errorMsg = error.response?.data || 'Failed to save UOM.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.ADMIN.UOM}/${formData.originalUomCode}`);
      dispatch(openSnackbar({ open: true, message: 'UOM deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete UOM:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete UOM.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit UOM details' : 'New UOM details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.originalUomCode}
        maxWidth="md"
      >
        <BOSFormSection>
          <BOSTextField
            name="uomCode"
            label="UOM Name"
            value={formData.uomCode}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={50}
            error={!!errors.uomCode}
            helperText={errors.uomCode}
           sx={errorStyle(!!errors.uomCode)} />

          <BOSTextField
            name="uomDescription"
            label="UOM Description"
            value={formData.uomDescription}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={255}
          />

          <BOSStatusField
            isCreate={!initialData}
            type="string-upper"
            name="status"
            label="Status"
            value={formData.status}
            onChange={handleChange}
            disabled={isViewOnly || !formData.originalUomCode}
            required
          />
        </BOSFormSection>
        
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete UOM details"
        message="Are you sure you want to delete this UOM? This action cannot be undone."
        itemName={formData.uomCode}
      />
    </>
  );
};

AddUomDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddUomDialog;
