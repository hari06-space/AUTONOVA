import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Autocomplete, TextField as MuiTextField } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField , errorStyle} from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| PRODUCT OEM MASTER - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'oemShortName', label: 'OEM Short Name', required: true, maxLength: 100 },
  { field: 'originCountry', label: 'Origin Country', required: true }
];

const INITIAL_STATE = {
  oemShortName: '',
  oemPrefix: '',
  oemDescription: '',
  originCountry: '',
  statusYear: '',
  status: 1
};

const AddOemDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('/api/admin/countries');
        const activeCountries = (response.data || []).filter(c => c.status?.toUpperCase() === 'ACTIVE');
        setCountries(activeCountries);
      } catch (error) {
        console.error('Failed to load countries:', error);
      }
    };
    if (open) {
      fetchCountries();
    }
  }, [open]);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        originalOemShortName: initialData.oemShortName,
        oemShortName: initialData.oemShortName || '',
        oemPrefix: initialData.oemPrefix || '',
        oemDescription: initialData.oemDescription || '',
        originCountry: initialData.originCountry || '',
        statusYear: initialData.statusYear || '',
        status: initialData.status !== undefined ? initialData.status : 1,
        createdBy: initialData.createdBy
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
        originalOemShortName: formData.originalOemShortName,
        oemShortName: formData.oemShortName,
        oemPrefix: formData.oemPrefix,
        oemDescription: formData.oemDescription,
        originCountry: formData.originCountry,
        statusYear: formData.statusYear,
        status: formData.status,
        createdBy: formData.originalOemShortName ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: formData.originalOemShortName ? (user?.id || 'Admin') : null
      };

      if (formData.originalOemShortName) {
        await axios.put(`${API_PATHS.NPD.ITEM_OEM}/${formData.originalOemShortName}`, payload);
        dispatch(openSnackbar({ open: true, message: 'OEM details updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.ITEM_OEM, payload);
        dispatch(openSnackbar({ open: true, message: 'OEM details created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save OEM details:', error);
      const errorMsg = error.message || 'Failed to save OEM details.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_OEM}/${formData.originalOemShortName}`);
      dispatch(openSnackbar({ open: true, message: 'OEM details deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete OEM:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
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
        title={initialData ? 'Edit OEM details' : 'New OEM details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.originalOemShortName}
        maxWidth="md"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="oemShortName"
            label="OEM Short Name"
            value={formData.oemShortName}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.oemShortName}
            helperText={errors.oemShortName}
           sx={errorStyle(!!errors.oemShortName)} />

          <BOSTextField
            name="oemPrefix"
            label="OEM Prefix"
            value={formData.oemPrefix}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={50}
            error={!!errors.oemPrefix}
            helperText={errors.oemPrefix}
           sx={errorStyle(!!errors.oemPrefix)} />

          <BOSTextField
            name="oemDescription"
            label="OEM Description"
            value={formData.oemDescription}
            onChange={handleChange}
            disabled={isViewOnly}
            multiline
            rows={2}
            error={!!errors.oemDescription}
            helperText={errors.oemDescription}
           sx={errorStyle(!!errors.oemDescription)} />

          <Autocomplete
            value={formData.originCountry || null}
            onChange={(event, newValue) => {
              setFormData((prev) => ({
                ...prev,
                originCountry: newValue || ''
              }));
            }}
            disabled={isViewOnly}
            options={countries.map((c) => c.country)}
            freeSolo={false}
            renderInput={(params) => (
              <MuiTextField
                {...params}
                label="Origin Country"
                variant="outlined"
                size="small"
                required
                error={!!errors.originCountry}
                helperText={errors.originCountry}
                sx={{ mt: 1, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            )}
            isOptionEqualToValue={(option, value) => option === value}
            noOptionsText="No countries found"
          />

          <BOSTextField
            name="statusYear"
            label="Status/Year"
            value={formData.statusYear}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={100}
            error={!!errors.statusYear}
            helperText={errors.statusYear}
           sx={errorStyle(!!errors.statusYear)} />

          <BOSStatusField
            isCreate={!initialData}
            type="number"
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
        title="Delete OEM Details"
        message="Are you sure you want to delete this OEM? This action cannot be undone."
        itemName={formData.oemShortName}
      />
    </>
  );
};

AddOemDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddOemDialog;
