import { useState, useEffect } from 'react';
import { MenuItem, Box, Stack } from '@mui/material';
import { IconBriefcase, IconCoins, IconCreditCard, IconPlaneTilt } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField , errorStyle} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useMasterDataStore from 'store/useMasterDataStore';

const VALIDATION_RULES = [
    { field: 'level', label: 'Level', required: true },
    {
        field: 'basic',
        label: 'Basic',
        validate: (val) => {
            if (val !== '' && val !== null && val !== undefined && Number(val) < 0) {
                return 'Basic cannot be negative';
            }
            return null;
        }
    },
    {
        field: 'da',
        label: 'DA',
        validate: (val) => {
            if (val !== '' && val !== null && val !== undefined && Number(val) < 0) {
                return 'DA cannot be negative';
            }
            return null;
        }
    },
    {
        field: 'hra',
        label: 'HRA',
        validate: (val) => {
            if (val !== '' && val !== null && val !== undefined && Number(val) < 0) {
                return 'HRA cannot be negative';
            }
            return null;
        }
    },
    {
        field: 'minLimit',
        label: 'Minimum Limit',
        validate: (val, formData) => {
            const hasMaxConfig = (formData.maxLimit !== '' && formData.maxLimit !== null && formData.maxLimit !== undefined);
            if (hasMaxConfig && (val === '' || val === null || val === undefined)) {
                return 'Minimum Limit is required when Maximum Limit is provided';
            }
            if (val !== '' && val !== null && val !== undefined && Number(val) < 0) {
                return 'Minimum Limit cannot be negative';
            }
            return null;
        }
    },
    {
        field: 'maxLimit',
        label: 'Maximum Limit',
        validate: (val, formData) => {
            const hasMinConfig = (formData.minLimit !== '' && formData.minLimit !== null && formData.minLimit !== undefined);
            if (hasMinConfig && (val === '' || val === null || val === undefined)) {
                return 'Maximum Limit is required when Minimum Limit is provided';
            }
            if (val !== '' && val !== null && val !== undefined) {
                if (Number(val) < 0) return 'Maximum Limit cannot be negative';
                if (formData.minLimit !== '' && formData.minLimit !== null && Number(val) < Number(formData.minLimit)) {
                    return 'Maximum Limit must be greater than or equal to Minimum Limit';
                }
            }
            return null;
        }
    },
    {
        field: 'ltaLimit',
        label: 'Leave Travel Allowance Limit',
        validate: (val) => {
            if (val !== '' && val !== null && val !== undefined) {
                const num = Number(val);
                if (isNaN(num)) {
                    return 'Leave Travel Allowance Limit must be a number';
                }
                if (num < 0) {
                    return 'Leave Travel Allowance Limit cannot be negative';
                }
            }
            return null;
        }
    },
    {
        field: 'screeningLevel',
        label: 'Interview Screening Level',
        required: true,
        validate: (val) => {
            if (val === '' || val === null || val === undefined) {
                return 'Interview Screening Level is required';
            }
            const num = parseInt(val, 10);
            if (isNaN(num) || num < 1) {
                return 'Interview Screening Level must be at least 1';
            }
            return null;
        }
    }
];

const LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

export default function AddDesignationLevelDialog({ open, handleClose, initialData }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();
    const isEditing = Boolean(initialData);

    const [formData, setFormData] = useState({
        level: '',
        basic: '',
        da: '',
        hra: '',
        screeningLevel: '',
        minLimit: '',
        maxLimit: '',
        ltaLimit: ''
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    level: initialData.level || '',
                    basic: initialData.basic ?? '',
                    da: initialData.da ?? '',
                    hra: initialData.hra ?? '',
                    screeningLevel: initialData.screeningLevel != null ? String(initialData.screeningLevel) : '',
                    minLimit: initialData.minLimit ?? initialData.min_limit ?? '',
                    maxLimit: initialData.maxLimit ?? initialData.max_limit ?? '',
                    ltaLimit: initialData.ltaLimit ?? initialData.lta_limit ?? '',
                    rowId: initialData.rowId || initialData.id
                });
            } else {
                setFormData({
                    level: '',
                    basic: '',
                    da: '',
                    hra: '',
                    screeningLevel: '',
                    minLimit: '',
                    maxLimit: '',
                    ltaLimit: ''
                });
            }
            clearErrors();
        }
    }, [open, initialData, clearErrors]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        try {
            const payload = {
                ...formData,
                minLimit: formData.minLimit !== '' && formData.minLimit !== null ? Number(formData.minLimit) : null,
                maxLimit: formData.maxLimit !== '' && formData.maxLimit !== null ? Number(formData.maxLimit) : null,
                ltaLimit: formData.ltaLimit !== '' && formData.ltaLimit !== null ? Number(formData.ltaLimit) : null,
            };
            const targetId = initialData?.rowId || initialData?.id || initialData?.row_id;
            if (isEditing && (targetId || formData.level)) {
                await axios.put(`/api/master/hr/designation-levels/${targetId || 0}`, payload);
            } else {
                await axios.post('/api/master/hr/designation-levels', payload);
            }
            dispatch(openSnackbar({ open: true, message: `Designation Level ${isEditing ? 'updated' : 'saved'} successfully!`, severity: 'success', variant: 'alert' }));
            useMasterDataStore.getState().invalidate(['LEVELS', 'DESIGNATION_LEVELS']);
            handleClose(true);
        } catch (error) {
            // Extract the real backend error message (e.g. "Designation level already exists")
            const msg = error?.response?.data?.message
                || (typeof error?.response?.data === 'string' ? error.response.data : null)
                || error?.message
                || 'Failed to save designation level';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const handleClear = () => {
        setFormData({
            level: '',
            basic: '',
            da: '',
            hra: '',
            screeningLevel: '',
            minLimit: '',
            maxLimit: '',
            ltaLimit: ''
        });
        clearErrors();
    };

    return (
        <BOSFormDialog
            open={open}
            onClose={() => handleClose(false)}
            onSave={handleSave}
            onClear={handleClear}
            title={isEditing ? 'Edit Designation Level' : 'Add Designation Level'}
            maxWidth="md"
        >
            <Stack spacing={3}>
                <BOSFormSection icon={<IconBriefcase size={20} />} title="Primary Info">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                        <BOSTextField select required label="Level" name="level" value={formData.level} onChange={handleChange} error={!!errors.level} helperText={errors.level} sx={errorStyle(!!errors.level)} >
                            {LEVELS.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                        </BOSTextField>
                        <BOSTextField
                            type="number"
                            required
                            label="Interview Screening Level"
                            name="screeningLevel"
                            value={formData.screeningLevel}
                            onChange={handleChange}
                            inputProps={{ min: 1 }}
                            error={!!errors.screeningLevel}
                            helperText={errors.screeningLevel}
                            sx={errorStyle(!!errors.screeningLevel)}
                        />
                    </Box>
                </BOSFormSection>

                <BOSFormSection icon={<IconCoins size={20} />} title="Salary Component">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2.5 }}>
                        <BOSTextField type="number" label="Basic" name="basic" value={formData.basic} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.basic} helperText={errors.basic}  sx={errorStyle(!!errors.basic)} />
                        <BOSTextField type="number" label="DA" name="da" value={formData.da} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.da} helperText={errors.da}  sx={errorStyle(!!errors.da)} />
                        <BOSTextField type="number" label="HRA" name="hra" value={formData.hra} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.hra} helperText={errors.hra}  sx={errorStyle(!!errors.hra)} />
                    </Box>
                </BOSFormSection>

                <BOSFormSection icon={<IconCreditCard size={20} />} title="Loan Component">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                        <BOSTextField type="number" label="Minimum Limit" name="minLimit" value={formData.minLimit} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.minLimit} helperText={errors.minLimit}  sx={errorStyle(!!errors.minLimit)} />
                        <BOSTextField type="number" label="Maximum Limit" name="maxLimit" value={formData.maxLimit} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.maxLimit} helperText={errors.maxLimit}  sx={errorStyle(!!errors.maxLimit)} />
                    </Box>
                </BOSFormSection>

                <BOSFormSection icon={<IconPlaneTilt size={20} />} title="Leave Travel Allowance Component">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2.5 }}>
                        <BOSTextField type="number" label="Leave Travel Allowance Limit" name="ltaLimit" value={formData.ltaLimit} onChange={handleChange} inputProps={{ min: 0 }} error={!!errors.ltaLimit} helperText={errors.ltaLimit} sx={errorStyle(!!errors.ltaLimit)} />
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    )
}
