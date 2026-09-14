import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, useTheme, Box, Stack } from '@mui/material';
import { IconClipboardCheck, IconBolt, IconCalculator } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSDatePicker, BOSStatusField, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSValidation from 'hooks/useBOSValidation';

const VALIDATION_RULES = [
  { field: 'meterId', label: 'Meter No', required: true },
  { field: 'shift', label: 'Shift', required: true },
  { field: 'readingDate', label: 'Consumption Date', required: true },
  { field: 'startUnitKwh', label: 'Start unit(kWh)', required: true },
  { field: 'endUnitKwh', label: 'End unit(kWh)', required: true },
  { field: 'startUnitKvah', label: 'Start unit(kVAh)', required: true },
  { field: 'endUnitKvah', label: 'End unit(kVAh)', required: true }
];

const yellowFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fffde7',
    overflow: 'hidden',
    '&.Mui-disabled': {
      bgcolor: '#fffde7'
    }
  },
  '& .MuiInputBase-input': {
    color: 'text.primary',
    WebkitTextFillColor: 'unset'
  }
};

const yellowInputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#fffde7',
    overflow: 'hidden'
  }
};

const tealFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#e0f2f1',
    overflow: 'hidden',
    '&.Mui-disabled': {
      bgcolor: '#e0f2f1'
    }
  },
  '& .MuiInputBase-input': {
    color: 'text.primary',
    WebkitTextFillColor: 'unset'
  }
};

const tealInputSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: '#e0f2f1',
    overflow: 'hidden'
  }
};

const INITIAL_STATE = {
  meterId: '',
  shift: '',
  readingDate: new Date().toISOString().split('T')[0],
  startUnitKwh: '0.0000',
  endUnitKwh: '0.0000',
  consumptionUnitKwh: '0.0000',
  multiplicationFactor: '0.00',
  actualConsumptionUnit: '0.0000',
  unitPrice: '0.00',
  cost: '0.00',
  startUnitKvah: '0.0000',
  endUnitKvah: '0.0000',
  consumptionUnitKvah: '0.0000',
  powerFactor: '0.0000',
  remarks: '',
  status: 'ACTIVE'
};

export default function AddEbPowerConsumptionDialog({ open, handleClose, initialData, readOnly = false }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [meters, setMeters] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [meterSearchText, setMeterSearchText] = useState('');

  // Load EB Meters
  useEffect(() => {
    if (open) {
      axios
        .get('/api/master/qms/eb-meter')
        .then((res) => {
          const list = res.data || [];
          const sorted = [...list].sort((a, b) => {
            if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
            if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
            return (a.meterNo || '').localeCompare(b.meterNo || '');
          });
          setMeters(sorted);
        })
        .catch((err) => {
          console.error('Failed to fetch EB meters:', err);
        });
    }
  }, [open, initialData]);

  // Load Active Shifts from Shift Master
  useEffect(() => {
    if (open) {
      axios
        .get('/api/hr/shift-master/active')
        .then((res) => {
          setShifts(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch shifts from shift master:', err);
        });
    }
  }, [open]);

  let inactiveCount = 0;
  const filteredMeters = meters.filter((meter) => {
    const query = meterSearchText.trim().toLowerCase();
    const isMatch = !query || (meter.meterNo || '').toLowerCase().includes(query);
    if (!isMatch) return false;
    if (meter.status === 'ACTIVE') return true;
    if (Number(meter.id) === Number(formData.meterId)) return true;
    if (query.length > 0) return true;
    inactiveCount++;
    return inactiveCount <= 5;
  });

  // Load initial data
  useEffect(() => {
    clearErrors();
    setMeterSearchText('');
    if (initialData) {
      setFormData({
        id: initialData.id,
        meterId: initialData.meter?.id || '',
        shift: initialData.shift || '',
        readingDate: initialData.readingDate || new Date().toISOString().split('T')[0],
        startUnitKwh: initialData.startUnitKwh ? Number(initialData.startUnitKwh).toFixed(4) : '0.0000',
        endUnitKwh: initialData.endUnitKwh ? Number(initialData.endUnitKwh).toFixed(4) : '0.0000',
        consumptionUnitKwh: initialData.consumptionUnitKwh ? Number(initialData.consumptionUnitKwh).toFixed(4) : '0.0000',
        multiplicationFactor: initialData.meter?.multiplicationFactor ? Number(initialData.meter.multiplicationFactor).toFixed(2) : '0.00',
        actualConsumptionUnit: initialData.actualConsumptionUnit ? Number(initialData.actualConsumptionUnit).toFixed(4) : '0.0000',
        unitPrice: initialData.meter?.unitPrice ? Number(initialData.meter.unitPrice).toFixed(2) : '0.00',
        cost: initialData.cost ? Number(initialData.cost).toFixed(2) : '0.00',
        startUnitKvah: initialData.startUnitKvah ? Number(initialData.startUnitKvah).toFixed(4) : '0.0000',
        endUnitKvah: initialData.endUnitKvah ? Number(initialData.endUnitKvah).toFixed(4) : '0.0000',
        consumptionUnitKvah: initialData.consumptionUnitKvah ? Number(initialData.consumptionUnitKvah).toFixed(4) : '0.0000',
        powerFactor: initialData.powerFactor ? Number(initialData.powerFactor).toFixed(4) : '0.0000',
        remarks: initialData.remarks || '',
        status: initialData.status || 'ACTIVE'
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
        'meterId',
        'readingDate',
        'shift',
        'startUnitKwh',
        'endUnitKwh',
        'startUnitKvah',
        'endUnitKvah',
        'remarks'
      ];
      const idx = FIELD_ORDER.indexOf(fieldName);
      if (idx !== -1 && idx + 1 < FIELD_ORDER.length) {
        const nextField = FIELD_ORDER[idx + 1];
        const nextEl = document.getElementById(`power-field-${nextField}`);
        if (nextEl) nextEl.focus();
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (['startUnitKwh', 'endUnitKwh', 'startUnitKvah', 'endUnitKvah'].includes(name)) {
      const num = parseFloat(value) || 0;
      setFormData((prev) => {
        const updated = { ...prev, [name]: num.toFixed(4) };
        const mf = prev.multiplicationFactor;
        const price = prev.unitPrice;

        const calcs = calculateFields(
          updated.endUnitKwh,
          updated.endUnitKvah,
          updated.startUnitKwh,
          updated.startUnitKvah,
          mf,
          price
        );

        return {
          ...updated,
          ...calcs
        };
      });
    }
  };

  const calculateFields = (endKwhVal, endKvahVal, startKwhVal, startKvahVal, mfVal, priceVal) => {
    const startKwh = parseFloat(startKwhVal) || 0;
    const endKwh = parseFloat(endKwhVal) || 0;
    const startKvah = parseFloat(startKvahVal) || 0;
    const endKvah = parseFloat(endKvahVal) || 0;
    const mf = parseFloat(mfVal) || 0;
    const price = parseFloat(priceVal) || 0;

    const consumptionKwh = Math.max(0, endKwh - startKwh);
    const consumptionKvah = Math.max(0, endKvah - startKvah);

    const actualConsumption = consumptionKwh * mf;
    const cost = actualConsumption * price;

    let pf = 0;
    if (consumptionKvah > 0) {
      pf = consumptionKwh / consumptionKvah;
      if (pf > 1) {
        pf = 1.0;
      }
    }

    return {
      consumptionUnitKwh: consumptionKwh.toFixed(4),
      actualConsumptionUnit: actualConsumption.toFixed(4),
      cost: cost.toFixed(2),
      consumptionUnitKvah: consumptionKvah.toFixed(4),
      powerFactor: pf.toFixed(4)
    };
  };

  const handleMeterChange = async (selectedOption) => {
    const meterId = selectedOption && typeof selectedOption === 'object' ? selectedOption.id : selectedOption;

    setFormData((prev) => ({
      ...prev,
      meterId: meterId || '',
      startUnitKwh: '0.0000',
      startUnitKvah: '0.0000',
      endUnitKwh: '0.0000',
      endUnitKvah: '0.0000',
      consumptionUnitKwh: '0.0000',
      multiplicationFactor: '0.00',
      actualConsumptionUnit: '0.0000',
      unitPrice: '0.00',
      cost: '0.00',
      consumptionUnitKvah: '0.0000',
      powerFactor: '0.0000'
    }));

    if (!meterId) return;

    try {
      const [unitsRes, meterRes] = await Promise.all([
        axios.get(`/api/master/qms/eb-power-consumption/latest-units?meterId=${meterId}`),
        axios.get(`/api/master/qms/eb-meter/${meterId}`)
      ]);
      const latest = unitsRes.data;
      const selectedMeter = meterRes.data;

      const mf = selectedMeter ? selectedMeter.multiplicationFactor : 0;
      const price = selectedMeter ? selectedMeter.unitPrice : 0;

      const fallbackStartKwh = selectedMeter && selectedMeter.startUnitKwh != null ? selectedMeter.startUnitKwh : 0;
      const fallbackStartKvah = selectedMeter && selectedMeter.startUnitKvah != null ? selectedMeter.startUnitKvah : 0;

      const startKwh = latest.startUnitKwh != null ? latest.startUnitKwh : fallbackStartKwh;
      const startKvah = latest.startUnitKvah != null ? latest.startUnitKvah : fallbackStartKvah;

      setFormData((prev) => {
        const startKwhStr = Number(startKwh).toFixed(4);
        const startKvahStr = Number(startKvah).toFixed(4);
        const calcs = calculateFields(
          startKwhStr,
          startKvahStr,
          startKwh,
          startKvah,
          mf,
          price
        );
        return {
          ...prev,
          startUnitKwh: startKwhStr,
          startUnitKvah: startKvahStr,
          endUnitKwh: startKwhStr,
          endUnitKvah: startKvahStr,
          multiplicationFactor: Number(mf).toFixed(2),
          unitPrice: Number(price).toFixed(2),
          ...calcs
        };
      });
    } catch (err) {
      console.error('Failed to fetch latest meter details or units:', err);
    }
  };

  const handleUnitChange = (name, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      const mf = prev.multiplicationFactor;
      const price = prev.unitPrice;

      const calcs = calculateFields(
        updated.endUnitKwh,
        updated.endUnitKvah,
        updated.startUnitKwh,
        updated.startUnitKvah,
        mf,
        price
      );

      return {
        ...updated,
        ...calcs
      };
    });
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    const endUnitKwhTrimmed = formData.endUnitKwh !== undefined && formData.endUnitKwh !== null ? formData.endUnitKwh.toString().trim() : '';
    if (endUnitKwhTrimmed === '') {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kWh) is required.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    const endUnitKvahTrimmed = formData.endUnitKvah !== undefined && formData.endUnitKvah !== null ? formData.endUnitKvah.toString().trim() : '';
    if (endUnitKvahTrimmed === '') {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kVAh) is required.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (!validate(formData, VALIDATION_RULES)) return;

    const startKwh = parseFloat(formData.startUnitKwh) || 0;
    const endKwh = parseFloat(formData.endUnitKwh) || 0;
    const startKvah = parseFloat(formData.startUnitKvah) || 0;
    const endKvah = parseFloat(formData.endUnitKvah) || 0;

    if (endKwh <= 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kWh) must be greater than 0.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (endKvah <= 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kVAh) must be greater than 0.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (endKwh <= startKwh) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kWh) must be greater than Start Unit (kWh).',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (endKvah <= startKvah) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'End Unit (kVAh) must be greater than Start Unit (kVAh).',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    if (parseFloat(formData.cost) > 99999999999999 || parseFloat(formData.actualConsumptionUnit) > 99999999999999) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Calculated Cost or Actual Consumption exceeds maximum allowable numeric limit.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'warning',
          close: false
        })
      );
      return;
    }

    try {
      const payload = {
        id: formData.id,
        meter: { id: formData.meterId },
        shift: formData.shift,
        readingDate: formData.readingDate,
        startUnitKwh: parseFloat(formData.startUnitKwh) || 0,
        endUnitKwh: parseFloat(formData.endUnitKwh) || 0,
        consumptionUnitKwh: parseFloat(formData.consumptionUnitKwh) || 0,
        actualConsumptionUnit: parseFloat(formData.actualConsumptionUnit) || 0,
        cost: parseFloat(formData.cost) || 0,
        startUnitKvah: parseFloat(formData.startUnitKvah) || 0,
        endUnitKvah: parseFloat(formData.endUnitKvah) || 0,
        consumptionUnitKvah: parseFloat(formData.consumptionUnitKvah) || 0,
        powerFactor: parseFloat(formData.powerFactor) || 0,
        remarks: formData.remarks,
        status: 'ACTIVE'
      };

      if (formData.id) {
        await axios.put(`/api/master/qms/eb-power-consumption/${formData.id}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Reading updated successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post('/api/master/qms/eb-power-consumption', payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Reading created successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      }
      handleClose(true);
    } catch (error) {
      console.error('Failed to save reading:', error);
      const errorMsg = error.response?.data || 'Failed to save reading.';
      dispatch(
        openSnackbar({
          open: true,
          message: typeof errorMsg === 'string' ? errorMsg : 'Failed to save reading.',
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
      await axios.delete(`/api/master/qms/eb-power-consumption/${formData.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Reading deleted!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      handleClose(true);
    } catch (error) {
      console.error('Failed to delete reading:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete reading.',
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
        onDelete={initialData ? () => setDeleteOpen(true) : null}
        onClear={handleClear}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? 'Edit EB Power Consumption Details' : 'EB Power Consumption Details'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="md"
      >
        <Stack spacing={3}>
          <BOSFormSection icon={<IconClipboardCheck size={20} color={theme.palette.primary.main} />} title="Primary Info">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <BOSAutocomplete
                name="meterId"
                label="Meter No"
                value={formData.meterId}
                options={filteredMeters}
                onChange={handleMeterChange}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (typeof option === 'string') return option;
                  return option.meterNo + (option.status !== 'ACTIVE' ? ' (Inactive)' : '');
                }}
                disabled={isViewOnly || !!formData.id}
                required
                error={!!errors.meterId}
                helperText={errors.meterId}
                onInputChange={(_, newInputValue) => {
                  setMeterSearchText(newInputValue);
                }}
                id="power-field-meterId"
                onKeyDown={(e) => handleKeyDown('meterId', e)}
                sx={errorStyle(!!errors.meterId)}
              />

              <BOSDatePicker
                name="readingDate"
                label="Consumption Date"
                value={formData.readingDate}
                onChange={handleChange}
                disabled={isViewOnly}
                required
                error={!!errors.readingDate}
                helperText={errors.readingDate}
                disablePast={false}
                inputProps={{ id: 'power-field-readingDate' }}
                onKeyDown={(e) => handleKeyDown('readingDate', e)}
                sx={errorStyle(!!errors.readingDate)} />
              <BOSTextField
                select
                name="shift"
                label="Shift"
                value={formData.shift}
                onChange={handleChange}
                disabled={isViewOnly}
                required
                error={!!errors.shift}
                helperText={errors.shift}
                inputProps={{ id: 'power-field-shift' }}
                onKeyDown={(e) => handleKeyDown('shift', e)}
                sx={errorStyle(!!errors.shift)} >

                {shifts.map((s) => (
                  <MenuItem key={s.id} value={s.shiftCode}>
                    {s.shiftName}
                  </MenuItem>
                ))}
                {initialData && initialData.shift && !shifts.some((s) => s.shiftCode === initialData.shift) && (
                  <MenuItem value={initialData.shift}>
                    {initialData.shift}
                  </MenuItem>
                )}
              </BOSTextField>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconBolt size={20} color={theme.palette.primary.main} />} title="Meter Details">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <BOSTextField
                name="startUnitKwh"
                label="Start unit(kWh)"
                value={formData.startUnitKwh}
                onChange={(e) => handleUnitChange('startUnitKwh', e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                disabled={isViewOnly}
                required
                error={!!errors.startUnitKwh}
                helperText={errors.startUnitKwh}
                sx={[yellowInputSx, errorStyle(!!errors.startUnitKwh)]}
                inputProps={{ id: 'power-field-startUnitKwh' }}
                onKeyDown={(e) => handleKeyDown('startUnitKwh', e)}
              />

              <BOSTextField
                name="endUnitKwh"
                label="End unit(kWh)"
                value={formData.endUnitKwh}
                onChange={(e) => handleUnitChange('endUnitKwh', e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                disabled={isViewOnly}
                required
                error={!!errors.endUnitKwh}
                helperText={errors.endUnitKwh}
                sx={[yellowInputSx, errorStyle(!!errors.endUnitKwh)]}
                inputProps={{ id: 'power-field-endUnitKwh' }}
                onKeyDown={(e) => handleKeyDown('endUnitKwh', e)}
              />

              <BOSTextField
                name="multiplicationFactor"
                label="Multiplication Factor (MF)"
                value={formData.multiplicationFactor}
                disabled
                InputProps={{ readOnly: true }}
                sx={yellowFieldSx}
              />

              <BOSTextField
                name="startUnitKvah"
                label="Start unit(kVAh)"
                value={formData.startUnitKvah}
                onChange={(e) => handleUnitChange('startUnitKvah', e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                disabled={isViewOnly}
                required
                error={!!errors.startUnitKvah}
                helperText={errors.startUnitKvah}
                sx={[tealInputSx, errorStyle(!!errors.startUnitKvah)]}
                inputProps={{ id: 'power-field-startUnitKvah' }}
                onKeyDown={(e) => handleKeyDown('startUnitKvah', e)}
              />

              <BOSTextField
                name="endUnitKvah"
                label="End unit(kVAh)"
                value={formData.endUnitKvah}
                onChange={(e) => handleUnitChange('endUnitKvah', e.target.value)}
                onBlur={handleBlur}
                onFocus={(e) => e.target.select()}
                disabled={isViewOnly}
                required
                error={!!errors.endUnitKvah}
                helperText={errors.endUnitKvah}
                sx={[tealInputSx, errorStyle(!!errors.endUnitKvah)]}
                inputProps={{ id: 'power-field-endUnitKvah' }}
                onKeyDown={(e) => handleKeyDown('endUnitKvah', e)}
              />

              <BOSTextField
                name="unitPrice"
                label="Unit Price"
                value={formData.unitPrice}
                disabled
                InputProps={{ readOnly: true }}
                sx={yellowFieldSx}
              />
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconCalculator size={20} color={theme.palette.primary.main} />} title="Power Consumption">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3 }}>
              <BOSTextField
                name="consumptionUnitKwh"
                label="Consumption Unit (kWh)"
                value={formData.consumptionUnitKwh}
                disabled
                InputProps={{ readOnly: true }}
                sx={yellowFieldSx}
              />

              <BOSTextField
                name="actualConsumptionUnit"
                label="Actual Consumption Unit (kWh × MF)"
                value={formData.actualConsumptionUnit}
                disabled
                InputProps={{ readOnly: true }}
                sx={yellowFieldSx}
              />

              <BOSTextField
                name="cost"
                label="Cost (Actual Unit × Unit Price)"
                value={formData.cost}
                disabled
                InputProps={{ readOnly: true }}
                sx={yellowFieldSx}
              />

              <BOSTextField
                name="consumptionUnitKvah"
                label="Consumption Unit (kVAh)"
                value={formData.consumptionUnitKvah}
                disabled
                InputProps={{ readOnly: true }}
                sx={tealFieldSx}
              />

              <BOSTextField
                name="powerFactor"
                label="Power Factor (kWh / kVAh)"
                value={formData.powerFactor}
                disabled
                InputProps={{ readOnly: true }}
                sx={tealFieldSx}
              />
            </Box>
          </BOSFormSection>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <BOSTextField
              name="remarks"
              label="Remarks"
              value={formData.remarks}
              onChange={handleChange}
              disabled={isViewOnly}
              maxLength={255}
              fullWidth
              inputProps={{ id: 'power-field-remarks' }}
              onKeyDown={(e) => handleKeyDown('remarks', e)}
            />
          </Box>
        </Stack>
      </BOSFormDialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete EB Power Consumption Details"
        message="Are you sure you want to delete this reading? This action cannot be undone."
        itemName={formData.remarks || `Reading on ${formData.readingDate}`}
      />
    </>
  );
}

AddEbPowerConsumptionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  readOnly: PropTypes.bool
};
