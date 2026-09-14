import { useState, useEffect } from 'react';
import { Box, Stack, MenuItem } from '@mui/material';
import { IconGasStation } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';

const VEHICLE_TYPES = [
    { value: 'PETROL',           label: 'Petrol' },
    { value: 'DIESEL',           label: 'Diesel' },
    { value: 'CNG',              label: 'CNG' },
    { value: 'ELECTRIC VEHICLE', label: 'Electric Vehicle' },
];

const VALIDATION_RULES = [
    { field: 'vehicleType',      label: 'Vehicle Type',      required: true },
    { field: 'fromRate',         label: 'From Rate',         required: true },
    { field: 'toRate',           label: 'To Rate',           required: true },
];

const EMPTY_FORM = {
    vehicleType:     '',
    fromRate:        '',
    toRate:          '',
    rateTwoWheeler:  '',
    rateFourWheeler: '',
    isActive:        true,
};

export default function AddPetrolAllowanceDialog({ open, handleClose, initialData, existingRows = [], readOnly = false }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [isEditing, setIsEditing] = useState(false);

    // ── Init ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    id:              initialData.id,
                    vehicleType:     initialData.vehicleType || '',
                    fromRate:        initialData.fromRate ?? '',
                    toRate:          initialData.toRate ?? '',
                    rateTwoWheeler:  initialData.rateTwoWheeler ?? '',
                    rateFourWheeler: initialData.rateFourWheeler ?? '',
                    isActive:        initialData.isActive ?? true,
                });
                setIsEditing(false);
            } else {
                setFormData(EMPTY_FORM);
                setIsEditing(!readOnly);
            }
            clearErrors();
        }
    }, [open, initialData, readOnly, clearErrors]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        const fromR = Number(formData.fromRate);
        const toR = Number(formData.toRate);
        const rate2 = formData.rateTwoWheeler !== '' && formData.rateTwoWheeler !== null ? Number(formData.rateTwoWheeler) : null;
        const rate4 = formData.rateFourWheeler !== '' && formData.rateFourWheeler !== null ? Number(formData.rateFourWheeler) : null;

        if (isNaN(fromR) || fromR < 0) {
            dispatch(openSnackbar({ open: true, message: 'From Rate must be a valid non-negative number.', variant: 'alert', severity: 'error' }));
            return;
        }
        if (isNaN(toR) || toR < 0) {
            dispatch(openSnackbar({ open: true, message: 'To Rate must be a valid non-negative number.', variant: 'alert', severity: 'error' }));
            return;
        }
        if (toR < fromR) {
            dispatch(openSnackbar({
                open: true,
                message: 'To Rate must be greater than or equal to From Rate.',
                variant: 'alert',
                severity: 'error'
            }));
            return;
        }

        const hasOverlap = (existingRows || []).some((row) => {
            if (formData.id && (String(row.id) === String(formData.id))) return false;
            if ((row.vehicleType || '').trim().toUpperCase() !== (formData.vehicleType || '').trim().toUpperCase()) return false;
            const exFrom = Number(row.fromRate);
            const exTo = Number(row.toRate);
            return fromR <= exTo && toR >= exFrom;
        });

        if (hasOverlap) {
            dispatch(openSnackbar({
                open: true,
                message: `An allowance slab already exists for vehicle type '${formData.vehicleType}' overlapping with rate range ₹${fromR.toFixed(2)} to ₹${toR.toFixed(2)}.`,
                variant: 'alert',
                severity: 'error'
            }));
            return;
        }

        if (rate2 !== null && (isNaN(rate2) || rate2 < 0)) {
            dispatch(openSnackbar({ open: true, message: 'Two Wheeler Rate must be a valid non-negative number.', variant: 'alert', severity: 'error' }));
            return;
        }
        if (rate4 !== null && (isNaN(rate4) || rate4 < 0)) {
            dispatch(openSnackbar({ open: true, message: 'Four Wheeler Rate must be a valid non-negative number.', variant: 'alert', severity: 'error' }));
            return;
        }

        const payload = {
            vehicleType:     formData.vehicleType,
            fromRate:        fromR,
            toRate:          toR,
            rateTwoWheeler:  rate2,
            rateFourWheeler: rate4,
            isActive:        formData.isActive,
        };

        try {
            if (formData.id) {
                await axios.put(`/api/master/hr/payroll/petrol/${formData.id}`, payload);
                dispatch(openSnackbar({ open: true, message: 'Petrol allowance updated successfully', severity: 'success', variant: 'alert' }));
            } else {
                await axios.post('/api/master/hr/payroll/petrol', payload);
                dispatch(openSnackbar({ open: true, message: 'Petrol allowance created successfully', severity: 'success', variant: 'alert' }));
            }
            handleClose(true);
        } catch (err) {
            const data = err?.response?.data;
            const msg = (typeof data === 'string' ? data : data?.message) || 'Failed to save petrol allowance';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    useKeyboardShortcuts({
        'space+s': handleSave,
        'save': handleSave,
        'escape': () => handleClose(false)
    }, open);

    const isViewOnly = readOnly && !isEditing;

    return (
        <BOSFormDialog
            open={open}
            onClose={() => handleClose(false)}
            onSave={handleSave}
            onEditClick={() => setIsEditing(true)}
            title={initialData ? 'Edit Petrol Allowance' : 'New Petrol Allowance'}
            isViewOnly={isViewOnly}
            hasId={Boolean(formData.id)}
            maxWidth="md"
        >
            <Stack spacing={3}>
                <BOSFormSection icon={<IconGasStation size={22} />} title="Petrol Allowance Details">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                        <BOSTextField
                            name="vehicleType"
                            label="Vehicle Type"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            select
                            required
                            disabled={isViewOnly}
                            error={!!errors.vehicleType}
                            helperText={errors.vehicleType}
                         sx={errorStyle(!!errors.vehicleType)} >
                            {VEHICLE_TYPES.map((t) => (
                                <MenuItem key={t.value} value={t.value}>
                                    {t.label}
                                </MenuItem>
                            ))}
                        </BOSTextField>

                        <div />

                        <BOSTextField
                            name="fromRate"
                            label="From Rate"
                            value={formData.fromRate}
                            onChange={handleChange}
                            type="number"
                            required
                            disabled={isViewOnly}
                            error={!!errors.fromRate}
                            helperText={errors.fromRate}
                         sx={errorStyle(!!errors.fromRate)} />

                        <BOSTextField
                            name="toRate"
                            label="To Rate"
                            value={formData.toRate}
                            onChange={handleChange}
                            type="number"
                            required
                            disabled={isViewOnly}
                            error={!!errors.toRate}
                            helperText={errors.toRate}
                         sx={errorStyle(!!errors.toRate)} />

                        <BOSTextField
                            name="rateTwoWheeler"
                            label="Rate Per KM (Two Wheeler)"
                            value={formData.rateTwoWheeler}
                            onChange={handleChange}
                            type="number"
                            disabled={isViewOnly}
                            error={!!errors.rateTwoWheeler}
                            helperText={errors.rateTwoWheeler}
                         sx={errorStyle(!!errors.rateTwoWheeler)} />

                        <BOSTextField
                            name="rateFourWheeler"
                            label="Rate Per KM (Four Wheeler)"
                            value={formData.rateFourWheeler}
                            onChange={handleChange}
                            type="number"
                            disabled={isViewOnly}
                            error={!!errors.rateFourWheeler}
                            helperText={errors.rateFourWheeler}
                         sx={errorStyle(!!errors.rateFourWheeler)} />

                        {/* Status Toggle */}
                        <BOSStatusField
                            isCreate={!formData.id}
                            type="boolean"
                            name="isActive"
                            label="Status"
                            value={formData.isActive}
                            onChange={handleChange}
                            disabled={isViewOnly}
                            sx={{ gridColumn: '1 / -1' }}
                        />
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
