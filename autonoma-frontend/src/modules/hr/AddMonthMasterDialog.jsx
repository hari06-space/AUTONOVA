import { useState, useEffect } from 'react';
import { Box, Stack, MenuItem } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, errorStyle, BOSStatusField } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
const getMonthSequence = (name) => {
    if (!name) return '';
    const cleanName = name.trim().toLowerCase();
    if (cleanName.startsWith('jan')) return 1;
    if (cleanName.startsWith('feb')) return 2;
    if (cleanName.startsWith('mar')) return 3;
    if (cleanName.startsWith('apr')) return 4;
    if (cleanName.startsWith('may')) return 5;
    if (cleanName.startsWith('jun')) return 6;
    if (cleanName.startsWith('jul')) return 7;
    if (cleanName.startsWith('aug')) return 8;
    if (cleanName.startsWith('sep')) return 9;
    if (cleanName.startsWith('oct')) return 10;
    if (cleanName.startsWith('nov')) return 11;
    if (cleanName.startsWith('dec')) return 12;
    return '';
};

const VALIDATION_RULES = [
    { field: 'monthType', label: 'Month Type', required: true },
    { field: 'monthName', label: 'Month Name', required: true },
    { field: 'seqNo',     label: 'Seq No',     required: true },
];

const EMPTY_FORM = {
    monthType: '',
    monthName: '',
    seqNo:     '',
    isActive:  true,
};

export default function AddMonthMasterDialog({ open, handleClose, initialData }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();
    const isEditing = Boolean(initialData);

    const [formData, setFormData] = useState(EMPTY_FORM);

    // ── Init ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    monthType: initialData.monthType || '',
                    monthName: initialData.monthName || '',
                    seqNo:     initialData.seqNo     ?? '',
                    isActive:  initialData.isActive  ?? true,
                });
            } else {
                setFormData(EMPTY_FORM);
            }
            clearErrors();
        }
    }, [open, initialData, clearErrors]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const fetchNextSeqNo = async (type) => {
        if (!type) return;
        try {
            const res = await axios.get(`/api/master/hr/payroll/months/next-seq-no?type=${type}`);
            setFormData((prev) => ({ ...prev, seqNo: res.data }));
        } catch (e) {
            console.error('Failed to fetch next sequence number', e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'monthName' && !isEditing) {
                const autoSeq = getMonthSequence(value);
                if (autoSeq !== '') {
                    next.seqNo = autoSeq;
                }
            }
            return next;
        });
        if (name === 'monthType' && value && !isEditing) {
            fetchNextSeqNo(value);
        }
    };



    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        const seqNum = Number(formData.seqNo);
        if (!Number.isInteger(seqNum) || seqNum < 0) {
            dispatch(openSnackbar({ open: true, message: 'Seq No must be a non-negative integer', severity: 'warning', variant: 'alert' }));
            return;
        }

        try {
            const payload = {
                ...formData,
                monthType: formData.monthType.toUpperCase(),
                seqNo:     seqNum,
            };

            if (isEditing) {
                await axios.put(`/api/master/hr/payroll/months/${initialData.id}`, payload);
            } else {
                await axios.post('/api/master/hr/payroll/months', payload);
            }

            dispatch(openSnackbar({
                open:     true,
                message:  `Month ${isEditing ? 'updated' : 'saved'} successfully!`,
                severity: 'success',
                variant:  'alert',
            }));
            handleClose(true);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Failed to save month';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const handleClear = () => {
        setFormData(EMPTY_FORM);
        clearErrors();
    };



    return (
        <BOSFormDialog
            open={open}
            onClose={() => handleClose(false)}
            onSave={handleSave}
            onClear={handleClear}
            title={isEditing ? 'Edit Month' : 'Add Month'}
            maxWidth="sm"
        >
            <Stack spacing={3}>
                <BOSFormSection icon={<IconCalendarEvent size={20} />} title="Month Information">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>

                        {/* Month Type */}
                        <BOSTextField
                            select
                            required
                            label="Month Type"
                            name="monthType"
                            value={formData.monthType}
                            onChange={handleChange}
                            error={!!errors.monthType}
                            helperText={errors.monthType || 'REGULAR = calendar month; HR = dual-month span'}
                         sx={errorStyle(!!errors.monthType)} >
                            <MenuItem value="" disabled>Select Type</MenuItem>
                            <MenuItem value="REGULAR">Regular</MenuItem>
                            <MenuItem value="HR">HR</MenuItem>
                        </BOSTextField>

                        {/* Seq No */}
                        <BOSTextField
                            required
                            type="number"
                            label="Seq No"
                            name="seqNo"
                            value={formData.seqNo}
                            onChange={handleChange}
                            error={!!errors.seqNo}
                            helperText={errors.seqNo || 'Auto-generated or enter manually'}
                            inputProps={{ min: 0, step: 1 }}
                         sx={errorStyle(!!errors.seqNo)} />

                        {/* Month Name */}
                        <BOSTextField
                            required
                            label="Month Name"
                            name="monthName"
                            value={formData.monthName}
                            onChange={handleChange}
                            error={!!errors.monthName}
                            helperText={errors.monthName || 'Enter month name manually (e.g., January, Jan-Feb)'}
                            sx={[ { gridColumn: '1 / -1' }, errorStyle(!!errors.monthName) ]}
                        />

                        {/* Active toggle */}
                        <BOSStatusField
                            isCreate={!initialData}
                            type="boolean"
                            name="isActive"
                            label="Status"
                            value={formData.isActive}
                            onChange={handleChange}
                            sx={{ gridColumn: '1 / -1' }}
                        />
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
