import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Autocomplete, TextField as MuiTextField } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| PRODUCT CAPACITY - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'uom', label: 'UOM', required: true },
  { field: 'capacityVal', label: 'Capacity', required: true },
  { field: 'modelNo', label: 'Model Name', required: true }
];

const INITIAL_STATE = {
  uom: '',
  capacityVal: '',
  modelNo: ''
};

const AddCapacityDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [models, setModels] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch models dynamically
  useEffect(() => {
    if (open) {
      axios.get(API_PATHS.NPD.ITEM_MODEL)
        .then((res) => {
          // List only ACTIVE models for selection, or all if none
          const activeModels = res.data.filter(m => m.status === 'ACTIVE');
          setModels(activeModels.length > 0 ? activeModels : res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch Models:', err);
        });
    }
  }, [open]);

  // Fetch UOMs dynamically from UOM Master
  useEffect(() => {
    if (open) {
      axios.get(API_PATHS.ADMIN.UOM)
        .then((res) => {
          // List only ACTIVE UOM codes
          const activeUoms = Array.from(
            new Set(
              res.data
                .filter((u) => u.status === 'ACTIVE')
                .map((u) => u.uomCode)
            )
          );
          setUoms(activeUoms);
        })
        .catch((err) => {
          console.error('Failed to fetch UOMs:', err);
        });
    }
  }, [open]);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        originalModelNo: initialData.model?.modelNo,
        originalUom: initialData.uom,
        originalCapacityVal: initialData.capacityVal,
        uom: initialData.uom || '',
        capacityVal: initialData.capacityVal !== undefined ? initialData.capacityVal : '',
        modelNo: initialData.model?.modelNo || '',
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
        model: { modelNo: formData.modelNo },
        uom: formData.uom,
        capacityVal: parseFloat(formData.capacityVal),
        createdBy: formData.originalModelNo ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: user?.id || 'Admin',
        createdAt: formData.createdAt
      };

      if (formData.originalModelNo && formData.originalUom && formData.originalCapacityVal) {
        await axios.put(`${API_PATHS.NPD.ITEM_CAPACITY}/${formData.originalModelNo}/${formData.originalUom}/${formData.originalCapacityVal}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Capacity updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.ITEM_CAPACITY, payload);
        dispatch(openSnackbar({ open: true, message: 'Capacity created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save Capacity:', error);
      const errorMsg = error.message || 'Failed to save Capacity.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_CAPACITY}/${formData.originalModelNo}/${formData.originalUom}/${formData.originalCapacityVal}`);
      dispatch(openSnackbar({ open: true, message: 'Capacity deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete capacity:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete capacity.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit Capacity details' : 'New Capacity details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.originalModelNo && !!formData.originalUom && !!formData.originalCapacityVal}
        maxWidth="md"
        hideCollapse
      >
        <BOSFormSection>
          <Autocomplete
            value={formData.uom || null}
            onChange={(event, newValue) => {
              setFormData((prev) => ({
                ...prev,
                uom: newValue || ''
              }));
            }}
            disabled={isViewOnly}
            options={uoms}
            freeSolo={false}
            renderInput={(params) => (
              <MuiTextField
                {...params}
                label="UOM"
                variant="outlined"
                size="small"
                required
                error={!!errors.uom}
                helperText={errors.uom}
                sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
            isOptionEqualToValue={(option, value) => option === value}
            noOptionsText="No UOMs found"
          />

          <BOSTextField
            name="capacityVal"
            label="Capacity"
            type="number"
            value={formData.capacityVal}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            inputProps={{ step: '0.01' }}
            error={!!errors.capacityVal}
            helperText={errors.capacityVal}
            sx={errorStyle(!!errors.capacityVal)} />

          <Autocomplete
            value={models.find(m => m.modelNo === formData.modelNo) || null}
            onChange={(event, newValue) => {
              setFormData((prev) => ({
                ...prev,
                modelNo: newValue ? newValue.modelNo : ''
              }));
            }}
            disabled={isViewOnly}
            options={models}
            getOptionLabel={(option) => option.modelNo || ''}
            freeSolo={false}
            renderInput={(params) => (
              <MuiTextField
                {...params}
                label="Model Name"
                variant="outlined"
                size="small"
                required
                error={!!errors.modelId}
                helperText={errors.modelId}
                sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
            isOptionEqualToValue={(option, value) => option.modelNo === value.modelNo}
            noOptionsText="No models found"
          />
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Capacity details"
        message="Are you sure you want to delete this Capacity? This action cannot be undone."
        itemName={formData.capacityVal ? `${formData.capacityVal} ${formData.uom}` : 'Capacity'}
      />
    </>
  );
};

AddCapacityDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddCapacityDialog;
