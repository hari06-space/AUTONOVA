import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField, BOSAutocomplete, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { API_PATHS } from 'utils/api-constants';
import useAuth from 'hooks/useAuth';

// ==============================|| PRODUCT ITEM GROUP - ADD/EDIT DIALOG (BOS SOP COMPLIANT) ||============================== //

const VALIDATION_RULES = [
  { field: 'groupName', label: 'Product Item Group', required: true, maxLength: 100 }
];

const INITIAL_STATE = { groupName: '', description: '', aqlId: null, status: 1 };

const AddItemGroupDialog = ({ open, handleClose, initialData, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [aqlOptions, setAqlOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchAqlOptions = async () => {
      try {
        const response = await axios.get('/api/qmc/aql', { params: { size: 1000 } });
        const list = response.data?.content || [];
        const activeAql = list.filter((item) => item.status === 1 || item.status === 'ACTIVE' || item.status === true);
        setAqlOptions(
          activeAql.map((aql) => ({
            value: aql.id,
            label: `${aql.aqlCode} - ${aql.aqlName} (Level: ${aql.inspectionLevel}, AQL: ${aql.aqlValue})`,
            aqlCode: aql.aqlCode,
            aqlName: aql.aqlName
          }))
        );
      } catch (err) {
        console.error('Failed to fetch AQL Master list:', err);
      }
    };
    fetchAqlOptions();
  }, []);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        originalGroupName: initialData.groupName,
        groupName: initialData.groupName || '',
        description: initialData.description || '',
        aqlId: initialData.aqlId || null,
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
        ...formData,
        aqlId: formData.aqlId || null,
        createdBy: formData.originalGroupName ? formData.createdBy : (user?.id || 'Admin'),
        updatedBy: formData.originalGroupName ? (user?.id || 'Admin') : null
      };

      if (formData.originalGroupName) {
        await axios.put(`${API_PATHS.NPD.ITEM_GROUP}/${formData.originalGroupName}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Item Group updated successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      } else {
        await axios.post(API_PATHS.NPD.ITEM_GROUP, payload);
        dispatch(openSnackbar({ open: true, message: 'Item Group created successfully!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save item group:', error);
      const errorMsg = error.message || 'Failed to save item group.';
      dispatch(openSnackbar({ open: true, message: errorMsg, variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.NPD.ITEM_GROUP}/${formData.originalGroupName}`);
      dispatch(openSnackbar({ open: true, message: 'Item Group deleted!', variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete item group:', error);
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
        title={initialData ? 'Edit Item Group' : 'New Item Group'}
        isViewOnly={isViewOnly}
        hasId={!!formData.originalGroupName}
        maxWidth="md"
        hideCollapse
      >
        <BOSFormSection>
          <BOSTextField
            name="groupName"
            label="Product Item Group"
            value={formData.groupName}
            onChange={handleChange}
            disabled={isViewOnly}
            required
            maxLength={100}
            error={!!errors.groupName}
            helperText={errors.groupName}
            sx={errorStyle(!!errors.groupName)}
          />

          <BOSAutocomplete
            name="aqlId"
            label="AQL Master"
            placeholder="Select AQL Configuration"
            options={aqlOptions}
            value={formData.aqlId}
            onChange={(val) => {
              const id = val && typeof val === 'object' ? val.value : val;
              setFormData((prev) => ({ ...prev, aqlId: id || null }));
            }}
            disabled={isViewOnly}
          />

          <BOSTextField
            name="description"
            label="Group Description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            disabled={isViewOnly}
            maxLength={500}
            error={!!errors.description}
            helperText={errors.description}
            sx={errorStyle(!!errors.description)}
          />

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
        title="Delete Item Group"
        message="Are you sure you want to delete this item group? This action cannot be undone."
        itemName={formData.groupName}
      />
    </>
  );
};

AddItemGroupDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};

export default AddItemGroupDialog;
