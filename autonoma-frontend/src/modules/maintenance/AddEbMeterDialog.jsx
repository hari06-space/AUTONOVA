import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Box, Switch, FormControl, FormLabel, FormControlLabel } from '@mui/material';
import { IconClipboardCheck } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, BOSStatusField, errorStyle, BOSToggleSwitch } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';

const VALIDATION_RULES = [
  { field: 'consumerName', label: 'Consumer Name', required: true, maxLength: 200 },
  { field: 'meterType', label: 'Meter Type', required: true },
  { field: 'meterNo', label: 'Meter No', required: true, maxLength: 100 },
  { field: 'multiplicationFactor', label: 'Multiplication Factor(MF)', required: true },
  { field: 'maximumDemand', label: 'Maximum demand(K/W)', required: true },
  { field: 'sanctionedLoad', label: 'Sanctioned Load', required: true },
  { field: 'unitPrice', label: 'Unit Price', required: true },
  { field: 'additionalDetails', label: 'Additional Details', required: true }
];

const INITIAL_STATE = {
  consumerName: '',
  consumerNo: '0',
  meterType: '',
  meterNo: '',
  purchaseDate: '',
  startUnitKwh: '0.0000',
  startUnitKvah: '0',
  maximumDemand: '0.00',
  multiplicationFactor: '0.00',
  sanctionedLoad: '0.00',
  unitPrice: '0.00',
  status: 'ACTIVE',
  additionalDetails: ''
};

export default function AddEbMeterDialog({ open, handleClose, initialData, readOnly = false }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        id: initialData.id,
        consumerName: initialData.consumerName || '',
        consumerNo: initialData.consumerNo || '0',
        meterType: initialData.meterType || '',
        meterNo: initialData.meterNo || '',
        purchaseDate: initialData.purchaseDate || '',
        startUnitKwh: initialData.startUnitKwh ? Number(initialData.startUnitKwh).toFixed(4) : '0.0000',
        startUnitKvah: initialData.startUnitKvah ? Number(initialData.startUnitKvah).toFixed(4) : '0',
        maximumDemand: initialData.maximumDemand ? Number(initialData.maximumDemand).toFixed(2) : '0.00',
        multiplicationFactor: initialData.multiplicationFactor ? Number(initialData.multiplicationFactor).toFixed(2) : '0.00',
        sanctionedLoad: initialData.sanctionedLoad ? Number(initialData.sanctionedLoad).toFixed(2) : '0.00',
        unitPrice: initialData.unitPrice ? Number(initialData.unitPrice).toFixed(2) : '0.00',
        status: initialData.status || 'ACTIVE',
        additionalDetails: initialData.additionalDetails || '',
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

  const handleKeyDown = (fieldName, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const FIELD_ORDER = [
        'consumerName',
        'consumerNo',
        'meterType',
        'meterNo',
        'multiplicationFactor',
        'maximumDemand',
        'sanctionedLoad',
        'unitPrice',
        'startUnitKwh',
        'startUnitKvah',
        'purchaseDate',
        'additionalDetails'
      ];
      const idx = FIELD_ORDER.indexOf(fieldName);
      if (idx !== -1 && idx + 1 < FIELD_ORDER.length) {
        const nextField = FIELD_ORDER[idx + 1];
        const nextEl = document.getElementById(`meter-field-${nextField}`);
        if (nextEl) nextEl.focus();
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (['maximumDemand', 'multiplicationFactor', 'sanctionedLoad', 'unitPrice'].includes(name)) {
      const num = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: num.toFixed(2) }));
    } else if (['startUnitKwh', 'startUnitKvah'].includes(name)) {
      const num = parseFloat(value) || 0;
      const precision = name === 'startUnitKwh' ? 4 : 4; // Format both nicely, but startUnitKvah keeps 0 if empty
      setFormData((prev) => ({ ...prev, [name]: num.toFixed(precision) }));
    }
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    const showWarning = (message) => {
      dispatch(
        openSnackbar({
          open: true,
          message,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
    };

    const isValid = validate(formData, VALIDATION_RULES);

    if (!formData.consumerName || formData.consumerName.trim() === '') {
      showWarning('Consumer Name is required.');
      return;
    }
    if (!formData.meterType || formData.meterType === '') {
      showWarning('Meter Type is required.');
      return;
    }
    if (!formData.meterNo || formData.meterNo.trim() === '') {
      showWarning('Meter No is required.');
      return;
    }
    if (formData.multiplicationFactor === '' || parseFloat(formData.multiplicationFactor) <= 0 || isNaN(parseFloat(formData.multiplicationFactor))) {
      showWarning('Multiplication Factor must be greater than 0.');
      return;
    }
    if (formData.maximumDemand === '' || parseFloat(formData.maximumDemand) <= 0 || isNaN(parseFloat(formData.maximumDemand))) {
      showWarning('Maximum Demand must be greater than 0.');
      return;
    }
    if (formData.sanctionedLoad === '' || parseFloat(formData.sanctionedLoad) <= 0 || isNaN(parseFloat(formData.sanctionedLoad))) {
      showWarning('Sanctioned Load must be greater than 0.');
      return;
    }
    if (formData.unitPrice === '' || parseFloat(formData.unitPrice) <= 0 || isNaN(parseFloat(formData.unitPrice))) {
      showWarning('Unit Price must be greater than 0.');
      return;
    }
    if (!formData.additionalDetails || formData.additionalDetails.trim() === '') {
      showWarning('Additional Details is required.');
      return;
    }

    if (!isValid) return;

    try {
      const payload = {
        id: formData.id,
        consumerName: formData.consumerName,
        consumerNo: formData.consumerNo,
        meterType: formData.meterType,
        meterNo: formData.meterNo,
        purchaseDate: formData.purchaseDate || null,
        startUnitKwh: parseFloat(formData.startUnitKwh) || 0,
        startUnitKvah: parseFloat(formData.startUnitKvah) || 0,
        maximumDemand: parseFloat(formData.maximumDemand) || 0,
        multiplicationFactor: parseFloat(formData.multiplicationFactor) || 0,
        sanctionedLoad: parseFloat(formData.sanctionedLoad) || 0,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        status: formData.status,
        additionalDetails: formData.additionalDetails
      };

      if (formData.id) {
        await axios.put(`/api/master/qms/eb-meter/${formData.id}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'EB Meter updated successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post('/api/master/qms/eb-meter', payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'EB Meter created successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save EB Meter:', error);
      const errorMsg = error.response?.data || 'Failed to save EB Meter.';
      dispatch(
        openSnackbar({
          open: true,
          message: typeof errorMsg === 'string' ? errorMsg : 'Failed to save EB Meter.',
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
      await axios.delete(`/api/master/qms/eb-meter/${formData.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'EB Meter deleted!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete EB Meter:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete EB Meter.',
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
        title={initialData ? 'Edit EB Meter Details' : 'EB Meter Details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <BOSFormSection icon={<IconClipboardCheck size={20} color={theme.palette.primary.main} />} title="EB Meter Details">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
            <BOSTextField
              name="consumerName"
              label="Consumer Name"
              value={formData.consumerName}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              maxLength={200}
              error={!!errors.consumerName}
              helperText={errors.consumerName}
              inputProps={{ id: 'meter-field-consumerName' }}
              onKeyDown={(e) => handleKeyDown('consumerName', e)}
              sx={errorStyle(!!errors.consumerName)} />

            <BOSTextField
              name="consumerNo"
              label="Consumer No"
              value={formData.consumerNo}
              onChange={handleChange}
              disabled={isViewOnly}
              maxLength={50}
              inputProps={{ id: 'meter-field-consumerNo' }}
              onKeyDown={(e) => handleKeyDown('consumerNo', e)}
            />

            <BOSTextField
              select
              name="meterType"
              label="Meter Type"
              value={formData.meterType}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.meterType}
              helperText={errors.meterType}
              inputProps={{ id: 'meter-field-meterType' }}
              onKeyDown={(e) => handleKeyDown('meterType', e)}
              sx={errorStyle(!!errors.meterType)} >

              <MenuItem value="EB">EB</MenuItem>
              <MenuItem value="SOLAR">SOLAR</MenuItem>
            </BOSTextField>

            <BOSTextField
              name="meterNo"
              label="Meter No"
              value={formData.meterNo}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              maxLength={100}
              error={!!errors.meterNo}
              helperText={errors.meterNo}
              inputProps={{ id: 'meter-field-meterNo' }}
              onKeyDown={(e) => handleKeyDown('meterNo', e)}
              sx={errorStyle(!!errors.meterNo)} />

            <BOSTextField
              name="multiplicationFactor"
              label="Multiplication Factor(MF)"
              value={formData.multiplicationFactor}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              required
              error={!!errors.multiplicationFactor}
              helperText={errors.multiplicationFactor}
              inputProps={{ id: 'meter-field-multiplicationFactor' }}
              onKeyDown={(e) => handleKeyDown('multiplicationFactor', e)}
              sx={errorStyle(!!errors.multiplicationFactor)} />

            <BOSTextField
              name="maximumDemand"
              label="Maximum demand(K/W)"
              value={formData.maximumDemand}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              required
              error={!!errors.maximumDemand}
              helperText={errors.maximumDemand}
              inputProps={{ id: 'meter-field-maximumDemand' }}
              onKeyDown={(e) => handleKeyDown('maximumDemand', e)}
              sx={errorStyle(!!errors.maximumDemand)} />

            <BOSTextField
              name="sanctionedLoad"
              label="Sanctioned Load"
              value={formData.sanctionedLoad}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              required
              error={!!errors.sanctionedLoad}
              helperText={errors.sanctionedLoad}
              inputProps={{ id: 'meter-field-sanctionedLoad' }}
              onKeyDown={(e) => handleKeyDown('sanctionedLoad', e)}
              sx={errorStyle(!!errors.sanctionedLoad)} />

            <BOSTextField
              name="unitPrice"
              label="Unit Price"
              value={formData.unitPrice}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              required
              error={!!errors.unitPrice}
              helperText={errors.unitPrice}
              inputProps={{ id: 'meter-field-unitPrice' }}
              onKeyDown={(e) => handleKeyDown('unitPrice', e)}
              sx={errorStyle(!!errors.unitPrice)} />

            <BOSTextField
              name="startUnitKwh"
              label="Start unit(kWh)"
              value={formData.startUnitKwh}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              inputProps={{ id: 'meter-field-startUnitKwh' }}
              onKeyDown={(e) => handleKeyDown('startUnitKwh', e)}
            />

            <BOSTextField
              name="startUnitKvah"
              label="Start unit(kVAh)"
              value={formData.startUnitKvah}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()}
              disabled={isViewOnly}
              inputProps={{ id: 'meter-field-startUnitKvah' }}
              onKeyDown={(e) => handleKeyDown('startUnitKvah', e)}
            />

            <BOSDatePicker
              name="purchaseDate"
              label="Purchase Date"
              value={formData.purchaseDate}
              onChange={handleChange}
              disabled={isViewOnly}
              disablePast={false}
              inputProps={{ id: 'meter-field-purchaseDate' }}
              onKeyDown={(e) => handleKeyDown('purchaseDate', e)}
            />

            <BOSStatusField
              isCreate={!formData.id}
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
              disabled={isViewOnly}
              type="string-upper"
              label="Status"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mt: 3 }}>
            <BOSTextField
              name="additionalDetails"
              label="Additional details"
              value={formData.additionalDetails}
              onChange={handleChange}
              disabled={isViewOnly}
              required
              error={!!errors.additionalDetails}
              helperText={errors.additionalDetails}
              fullWidth
              inputProps={{ id: 'meter-field-additionalDetails' }}
              onKeyDown={(e) => handleKeyDown('additionalDetails', e)}
              sx={errorStyle(!!errors.additionalDetails)} />
          </Box>
        </BOSFormSection>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete EB Meter Details"
        message="Are you sure you want to delete this EB Meter? This action cannot be undone."
        itemName={formData.meterNo}
      />
    </>
  );
}

AddEbMeterDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};
