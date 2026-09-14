import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';
import { useTheme } from '@mui/material';

// ==============================|| HSN CODE - ADD/EDIT DIALOG ||============================== //

const VALIDATION_RULES = [
  { field: 'hsnCode', label: 'HSN Code', required: true, maxLength: 10 },
  { field: 'description', label: 'Description/SOP' },
  { field: 'cgstPer', label: 'CGST %', type: 'number', min: 0, max: 100 },
  { field: 'sgstPer', label: 'SGST %', type: 'number', min: 0, max: 100 },
  { field: 'igstPer', label: 'IGST %', type: 'number', min: 0, max: 100 }
];

const INITIAL_STATE = {
  hsnCode: '',
  description: '',
  cgstPer: '',
  sgstPer: '',
  igstPer: '',
  status: 1
};

const AddHsnCodeMasterDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const theme = useTheme();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const API_URL = '/api/admin/hsn-codes';

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        hsnCode: initialData.hsnCode || '',
        description: initialData.description || '',
        cgstPer: initialData.cgstPer ?? '',
        sgstPer: initialData.sgstPer ?? '',
        igstPer: initialData.igstPer ?? '',
        status: initialData.status ?? 1,
        createdBy: initialData.createdBy,
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
    if (name === 'cgstPer') {
      setFormData((prev) => ({ ...prev, cgstPer: value, sgstPer: value }));
    } else if (name === 'sgstPer') {
      setFormData((prev) => ({ ...prev, sgstPer: value, cgstPer: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    try {
      const payload = {
        hsnCode: formData.hsnCode,
        description: formData.description,
        cgstPer: formData.cgstPer !== '' ? Number(formData.cgstPer) : null,
        sgstPer: formData.sgstPer !== '' ? Number(formData.sgstPer) : null,
        igstPer: formData.igstPer !== '' ? Number(formData.igstPer) : null,
        status: formData.status,
        createdBy: initialData ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin',
        createdAt: formData.createdAt
      };

      if (initialData) {
        await axios.put(`${API_URL}/${formData.hsnCode}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'HSN Code updated successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post(API_URL, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'HSN Code created successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save HSN Code:', error);
      const errorMsg = error.response?.data?.message || error.response?.data || 'Failed to save HSN Code.';
      dispatch(
        openSnackbar({
          open: true,
          message: typeof errorMsg === 'string' ? errorMsg : 'Error occurred',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_URL}/${formData.hsnCode}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'HSN Code deleted!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete HSN Code:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete HSN Code.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
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
        title={initialData ? 'Edit HSN Code' : 'New HSN Code'}
        isViewOnly={isViewOnly}
        hasId={!!initialData}
        maxWidth="sm"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="hsnCode"
            label="HSN Code"
            value={formData.hsnCode}
            onChange={handleChange}
            disabled={isViewOnly || !!initialData}
            required
            maxLength={10}
            error={!!errors.hsnCode}
            helperText={errors.hsnCode || (!!initialData && 'HSN Code cannot be changed')}
            sx={errorStyle(!!errors.hsnCode)}
          />

          <BOSTextField
            name="description"
            label="Description/SOP"
            multiline
            minRows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Standard Operating Procedure... (or use mic 🎤)"
            disabled={isViewOnly}
            error={!!errors.description}
            helperText={errors.description}
            sx={errorStyle(!!errors.description)}
          />

          <BOSTextField
            name="cgstPer"
            label="CGST %"
            type="number"
            value={formData.cgstPer}
            onChange={handleChange}
            disabled={isViewOnly}
            error={!!errors.cgstPer}
            helperText={errors.cgstPer}
            sx={errorStyle(!!errors.cgstPer)}
          />

          <BOSTextField
            name="sgstPer"
            label="SGST %"
            type="number"
            value={formData.sgstPer}
            onChange={handleChange}
            disabled={isViewOnly}
            error={!!errors.sgstPer}
            helperText={errors.sgstPer}
            sx={errorStyle(!!errors.sgstPer)}
          />

          <BOSTextField
            name="igstPer"
            label="IGST %"
            type="number"
            value={formData.igstPer}
            onChange={handleChange}
            disabled={isViewOnly}
            error={!!errors.igstPer}
            helperText={errors.igstPer}
            sx={errorStyle(!!errors.igstPer)}
          />

          <BOSStatusField
            isCreate={!initialData}
            type="number"
            name="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            disabled={isViewOnly}
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete HSN Code"
        message="Are you sure you want to delete this HSN Code? This action cannot be undone."
        itemName={formData.hsnCode}
      />
    </>
  );
};

AddHsnCodeMasterDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddHsnCodeMasterDialog;
