import { useState, useEffect, useRef } from 'react';
import { Box, Stack, InputAdornment, MenuItem, IconButton } from '@mui/material';
import { IconBuildingBank, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSStatusField, errorStyle } from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';

const ACCOUNT_TYPES = [
    { value: 'SAVINGS',   label: 'Savings Account' },
    { value: 'CURRENT',   label: 'Current Account' },
    { value: 'SALARY',    label: 'Salary Account' },
    { value: 'OVERDRAFT', label: 'Overdraft Account' }
];

const VALIDATION_RULES = [
    { field: 'bankName',          label: 'Bank Name',           required: true },
    { field: 'accountNo',         label: 'Account Number',      required: true },
    { field: 'accountHolderName', label: 'Account Holder Name', required: true },
    { field: 'ifscCode',          label: 'IFSC Code',           required: true },
];

const EMPTY_FORM = {
    bankCode: '',
    bankName: '',
    accountNo: '',
    accountHolderName: '',
    ifscCode: '',
    branchName: '',
    branchLocation: '',
    accountType: 'CURRENT',
    swiftCode: '',
    micrCode: '',
    remarks: '',
    isActive: true
};

export default function AddBankMasterDialog({ open, handleClose, initialData, existingBanks }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();
    const isEditing = Boolean(initialData);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [listeningField, setListeningField] = useState(null);
    const activeFieldRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onstart = () => {
            setListeningField(activeFieldRef.current);
        };

        recog.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                const cleaned = transcript
                     .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, '')
                     .trim();
                setFormData((prev) => {
                    const field = activeFieldRef.current;
                    if (!field) return prev;
                    return {
                        ...prev,
                        [field]: prev[field] ? `${prev[field]} ${cleaned}` : cleaned
                    };
                });
            }
            setListeningField(null);
        };

        recog.onerror = () => { setListeningField(null); };
        recog.onend = () => { setListeningField(null); };

        recognitionRef.current = recog;

        return () => {
            recog.onstart = null;
            recog.onresult = null;
            recog.onerror = null;
            recog.onend = null;
            try { recog.abort(); } catch (_) {}
            recognitionRef.current = null;
        };
    }, []);

    const handleMicClick = (fieldName, e) => {
        if (e) { e.stopPropagation(); e.preventDefault(); }
        const recog = recognitionRef.current;
        if (listeningField === fieldName) {
            if (recog) recog.stop();
        } else {
            activeFieldRef.current = fieldName;
            setListeningField(fieldName);
            if (recog) {
                try { recog.start(); } catch (_) {}
            }
        }
    };

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({ ...initialData });
            } else {
                setFormData(EMPTY_FORM);
                fetchNextCode();
            }
            clearErrors();
        }
    }, [open, initialData, clearErrors]);

    const fetchNextCode = async () => {
        try {
            const res = await axios.get('/api/master/hr/payroll/banks/next-code');
            setFormData((prev) => ({ ...prev, bankCode: res.data }));
        } catch {
            setFormData((prev) => ({ ...prev, bankCode: '001' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalVal = value;
        if (name === 'ifscCode' || name === 'swiftCode') {
            finalVal = value.toUpperCase().trim();
        }
        setFormData((prev) => ({ ...prev, [name]: finalVal }));
    };

    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        if ((formData.ifscCode || '').trim().length !== 11) {
            dispatch(openSnackbar({ open: true, message: 'IFSC Code must be exactly 11 characters (e.g. HDFC0001234)', severity: 'warning', variant: 'alert' }));
            return;
        }

        const usedAccountNos = (existingBanks || [])
            .filter((item) => !initialData || String(item.id) !== String(initialData.id))
            .map((item) => (item.accountNo || '').trim());

        if (usedAccountNos.includes((formData.accountNo || '').trim())) {
            dispatch(openSnackbar({ open: true, message: `Account Number "${formData.accountNo}" is already in use`, severity: 'warning', variant: 'alert' }));
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`/api/master/hr/payroll/banks/${initialData.id}`, formData);
            } else {
                await axios.post('/api/master/hr/payroll/banks', formData);
            }
            dispatch(openSnackbar({
                open: true,
                message: `Bank details ${isEditing ? 'updated' : 'saved'} successfully!`,
                severity: 'success',
                variant: 'alert',
            }));
            handleClose(true);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Failed to save bank details';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const handleClear = () => {
        setFormData(EMPTY_FORM);
        if (!isEditing) fetchNextCode();
        clearErrors();
    };

    useKeyboardShortcuts({
        'space+s': handleSave,
        'save': handleSave,
        'escape': () => handleClose(false)
    }, open);

    return (
        <BOSFormDialog
            open={open}
            onClose={() => handleClose(false)}
            onSave={handleSave}
            onClear={handleClear}
            title={isEditing ? 'Edit Bank Details' : 'Add Bank Details'}
            maxWidth="md"
        >
            <Stack spacing={3}>
                <BOSFormSection icon={<IconBuildingBank size={20} />} title="Bank Information">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>

                        {/* Bank Code */}
                        <BOSTextField
                            label="Bank Code"
                            name="bankCode"
                            value={formData.bankCode}
                            disabled
                            InputProps={{ readOnly: true }}
                        />

                        {/* Bank Name */}
                        <BOSTextField
                            required
                            label="Bank Name"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            error={!!errors.bankName}
                            helperText={errors.bankName}
                            placeholder="e.g. HDFC Bank, ICICI Bank"
                            sx={errorStyle(!!errors.bankName)}
                        />

                        {/* Account Number */}
                        <BOSTextField
                            required
                            label="Account Number"
                            name="accountNo"
                            value={formData.accountNo}
                            onChange={handleChange}
                            error={!!errors.accountNo}
                            helperText={errors.accountNo}
                            placeholder="Enter bank account number"
                            sx={errorStyle(!!errors.accountNo)}
                        />

                        {/* Account Holder Name */}
                        <BOSTextField
                            required
                            label="Account Holder Name"
                            name="accountHolderName"
                            value={formData.accountHolderName}
                            onChange={handleChange}
                            error={!!errors.accountHolderName}
                            helperText={errors.accountHolderName}
                            placeholder="Account holder full name"
                            sx={errorStyle(!!errors.accountHolderName)}
                        />

                        {/* IFSC Code */}
                        <BOSTextField
                            required
                            label="IFSC Code"
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleChange}
                            error={!!errors.ifscCode}
                            helperText={errors.ifscCode}
                            placeholder="e.g. HDFC0001234"
                            inputProps={{ maxLength: 11 }}
                            sx={errorStyle(!!errors.ifscCode)}
                        />

                        {/* Account Type */}
                        <BOSTextField
                            select
                            label="Account Type"
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleChange}
                        >
                            {ACCOUNT_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </BOSTextField>

                        {/* Branch Name */}
                        <BOSTextField
                            label="Branch Name"
                            name="branchName"
                            value={formData.branchName}
                            onChange={handleChange}
                            placeholder="e.g. Main Branch"
                        />

                        {/* Branch Location */}
                        <BOSTextField
                            label="Branch Location"
                            name="branchLocation"
                            value={formData.branchLocation}
                            onChange={handleChange}
                            placeholder="e.g. Chennai"
                        />

                        {/* SWIFT Code */}
                        <BOSTextField
                            label="SWIFT Code"
                            name="swiftCode"
                            value={formData.swiftCode}
                            onChange={handleChange}
                            placeholder="Optional SWIFT code"
                        />

                        {/* MICR Code */}
                        <BOSTextField
                            label="MICR Code"
                            name="micrCode"
                            value={formData.micrCode}
                            onChange={handleChange}
                            placeholder="Optional MICR code"
                        />

                        {/* Remarks */}
                        <BOSTextField
                            fullWidth
                            label="Remarks"
                            name="remarks"
                            value={formData.remarks}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            placeholder="Optional remarks..."
                            sx={{ gridColumn: '1 / -1', position: 'relative' }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {listeningField === 'remarks' && <VoiceWaveform />}
                                            <IconButton
                                                color={listeningField === 'remarks' ? 'error' : 'primary'}
                                                onClick={(e) => handleMicClick('remarks', e)}
                                                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                                sx={{
                                                    animation: listeningField === 'remarks' ? 'pulse 1.5s infinite' : 'none',
                                                    '@keyframes pulse': {
                                                        '0%': { transform: 'scale(1)' },
                                                        '50%': { transform: 'scale(1.2)' },
                                                        '100%': { transform: 'scale(1)' }
                                                    }
                                                }}
                                            >
                                                {listeningField === 'remarks' ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                                            </IconButton>
                                        </Box>
                                    </InputAdornment>
                                )
                            }}
                        />

                        {/* Status */}
                        <BOSStatusField
                            isCreate={!isEditing}
                            type="boolean"
                            label="Status"
                            name="isActive"
                            value={formData.isActive ?? true}
                            onChange={(e) => {
                                const val = e?.target?.value !== undefined ? e.target.value : e?.target?.checked;
                                setFormData((prev) => ({ ...prev, isActive: Boolean(val) }));
                            }}
                        />
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
