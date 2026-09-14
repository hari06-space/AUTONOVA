import { useState, useEffect, useRef } from 'react';
import { Box, Stack, InputAdornment, MenuItem, IconButton } from '@mui/material';
import { IconCoin, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField , errorStyle} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts from 'hooks/useKeyboardShortcuts';

const LOAN_NAMES = [
    'FESTIVAL ADVANCE',
    'BANK LOAN',
    'SALARY ADVANCE',
    'EDUCATION LOAN',
    'PERSONAL LOAN',
    'MEDICAL LOAN',
    'HOUSING LOAN',
    'VEHICLE LOAN',
    'MARRIAGE LOAN',
    'FUND ADVANCE',
    'SPECIAL ADVANCE',
    'OTHERS',
];

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        case 'JPY': return '¥';
        case 'AED': return 'د.إ';
        default: return code || '₹';
    }
};

const VALIDATION_RULES = [
    { field: 'loanName', label: 'Loan Type', required: true },
];

const EMPTY_FORM = { loanCode: '', loanName: '', customLoanType: '', minLimit: '', maxLimit: '', remarks: '', isActive: true };

export default function AddLoanMasterDialog({ open, handleClose, initialData, existingLoans }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();
    const isEditing = Boolean(initialData);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [currencySymbol, setCurrencySymbol] = useState('₹');
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
                     .trim()
                     .toUpperCase();
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

        recog.onerror = (event) => {
            if (event.error === 'aborted') {
                setListeningField(null);
                return;
            }
            console.error('Speech recognition error in dialog', event.error);
            setListeningField(null);

            let errorMsg = 'Error during voice recognition. Please try again.';
            if (event.error === 'not-allowed') {
                errorMsg = 'Microphone permission denied. Please allow microphone access in your browser address bar/settings.';
            } else if (event.error === 'no-speech') {
                errorMsg = 'No speech detected. Please speak clearly into the microphone.';
            } else if (event.error === 'network') {
                errorMsg = 'Network error. Speech recognition requires an active internet connection.';
            } else if (event.error === 'audio-capture') {
                errorMsg = 'No microphone detected. Please connect a mic and try again.';
            }

            dispatch(
                openSnackbar({
                    open: true,
                    message: errorMsg,
                    variant: 'alert',
                    alert: { variant: 'filled' },
                    severity: event.error === 'no-speech' ? 'info' : 'error',
                    close: false
                })
            );
        };

        recog.onend = () => {
            setListeningField(null);
        };

        recognitionRef.current = recog;

        return () => {
            recog.onstart = null;
            recog.onresult = null;
            recog.onerror = null;
            recog.onend = null;
            try { recog.abort(); } catch (_) {}
            recognitionRef.current = null;
        };
    }, [dispatch]);

    const handleMicClick = (fieldName, e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const recog = recognitionRef.current;
        if (listeningField === fieldName) {
            if (recog) recog.stop();
        } else {
            if (listeningField) {
                if (recog) recog.stop();
            }
            activeFieldRef.current = fieldName;
            setListeningField(fieldName);
            if (recog) {
                try {
                    recog.start();
                } catch (err) {
                    console.warn('Mic start error:', err);
                }
            } else {
                dispatch(
                    openSnackbar({
                        open: true,
                        message: 'Speech Recognition is not supported by your browser.',
                        variant: 'alert',
                        alert: { variant: 'filled' },
                        severity: 'warning',
                        close: false
                    })
                );
            }
        }
    };

    useEffect(() => {
        axios.get('/api/company-profile/all', { skipGlobalAlert: true })
            .then((res) => {
                const profile = Array.isArray(res.data) ? res.data[0] : res.data;
                if (profile?.currencyCode) {
                    setCurrencySymbol(getCurrencySymbol(profile.currencyCode));
                }
            })
            .catch(() => {});
    }, []);

    const usedNames = (existingLoans || [])
        .filter((item) => !initialData || item.id !== initialData.id)
        .map((item) => item.loanName?.toUpperCase());

    const availableLoanNames = LOAN_NAMES.filter((name) => !usedNames.includes(name));

    useEffect(() => {
        if (open) {
            if (initialData) {
                const data = { ...initialData, customLoanType: '' };
                // If loanName is not in the preset list, treat as OTHERS with custom value
                if (initialData.loanName && !LOAN_NAMES.includes(initialData.loanName.toUpperCase()) && initialData.loanName.toUpperCase() !== 'OTHERS') {
                    data.customLoanType = initialData.loanName;
                    data.loanName = 'OTHERS';
                }
                setFormData(data);
            } else {
                setFormData(EMPTY_FORM);
                fetchNextCode();
            }
            clearErrors();
        }
    }, [open, initialData, clearErrors]);

    const fetchNextCode = async () => {
        try {
            const res = await axios.get('/api/master/hr/payroll/loans/next-code');
            setFormData((prev) => ({ ...prev, loanCode: res.data }));
        } catch {
            setFormData((prev) => ({ ...prev, loanCode: '001' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        // Validate custom loan type when OTHERS is selected
        if (formData.loanName === 'OTHERS' && (!formData.customLoanType || !formData.customLoanType.trim())) {
            dispatch(openSnackbar({ open: true, message: 'Please enter the Custom Loan Type', severity: 'warning', variant: 'alert' }));
            return;
        }

        if (formData.minLimit !== '' && formData.maxLimit !== '' && formData.minLimit !== null && formData.maxLimit !== null) {
            if (Number(formData.minLimit) > Number(formData.maxLimit)) {
                dispatch(openSnackbar({ open: true, message: 'Min Limit cannot be greater than Max Limit', severity: 'warning', variant: 'alert' }));
                return;
            }
        }

        // Determine the actual loan name to save
        const actualLoanName = formData.loanName === 'OTHERS' ? formData.customLoanType.trim().toUpperCase() : formData.loanName;

        if (usedNames.includes(actualLoanName?.toUpperCase())) {
            dispatch(openSnackbar({ open: true, message: `Loan Type "${actualLoanName}" already exists`, severity: 'warning', variant: 'alert' }));
            return;
        }

        try {
            const payload = {
                ...formData,
                loanName: actualLoanName,
                minLimit: formData.minLimit !== '' && formData.minLimit !== null ? Number(formData.minLimit) : null,
                maxLimit: formData.maxLimit !== '' && formData.maxLimit !== null ? Number(formData.maxLimit) : null,
            };
            delete payload.customLoanType;
            if (isEditing) {
                await axios.put(`/api/master/hr/payroll/loans/${initialData.id}`, payload);
            } else {
                await axios.post('/api/master/hr/payroll/loans', payload);
            }
            dispatch(openSnackbar({
                open: true,
                message: `Loan ${isEditing ? 'updated' : 'saved'} successfully!`,
                severity: 'success',
                variant: 'alert',
            }));
            handleClose(true);
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                (typeof error?.response?.data === 'string' ? error.response.data : null) ||
                error?.message ||
                'Failed to save loan';
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
            title={isEditing ? 'Edit Loan' : 'Add Loan'}
            maxWidth="md"
        >
            <Stack spacing={3}>
                <BOSFormSection icon={<IconCoin size={20} />} title="Loan Information">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>

                        {/* Loan Code — auto-generated, read-only */}
                        <BOSTextField
                            label="Loan Code"
                            name="loanCode"
                            value={formData.loanCode}
                            disabled
                            InputProps={{ readOnly: true }}
                        />

                        {/* Loan Name — dropdown */}
                        <BOSTextField
                            select
                            required
                            label="Loan Type"
                            name="loanName"
                            value={formData.loanName}
                            onChange={handleChange}
                            error={!!errors.loanName}
                            helperText={errors.loanName}
                         sx={errorStyle(!!errors.loanName)} >
                            <MenuItem value="" disabled>
                                Select
                            </MenuItem>
                            {availableLoanNames.map((name) => (
                                <MenuItem key={name} value={name}>
                                    {name}
                                </MenuItem>
                            ))}
                        </BOSTextField>

                        {/* Custom Loan Type — visible only when OTHERS is selected */}
                        {formData.loanName === 'OTHERS' && (
                            <BOSTextField
                                required
                                label="Custom Loan Type"
                                name="customLoanType"
                                value={formData.customLoanType}
                                onChange={handleChange}
                                error={formData.loanName === 'OTHERS' && !formData.customLoanType?.trim()}
                                helperText={formData.loanName === 'OTHERS' && !formData.customLoanType?.trim() ? 'Custom Loan Type is required' : ''}
                                sx={errorStyle(formData.loanName === 'OTHERS' && !formData.customLoanType?.trim())}
                                placeholder="Enter custom loan type..."
                            />
                        )}

                        {/* Min Limit */}
                        <BOSTextField
                            type="number"
                            label="Min Limit"
                            name="minLimit"
                            value={formData.minLimit}
                            onChange={handleChange}
                            error={!!errors.minLimit}
                            helperText={errors.minLimit}
                            inputProps={{ min: 0 }}
                          sx={errorStyle(!!errors.minLimit)} />

                        {/* Max Limit */}
                        <BOSTextField
                            type="number"
                            label="Max Limit"
                            name="maxLimit"
                            value={formData.maxLimit}
                            onChange={handleChange}
                            error={!!errors.maxLimit}
                            helperText={errors.maxLimit}
                            inputProps={{ min: 0 }}
                          sx={errorStyle(!!errors.maxLimit)} />

                        {/* Remarks — full width */}
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
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                                onPointerDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
                                                onTouchStart={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                }}
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
                        {/* Status — when editing */}
                        {isEditing && (
                            <BOSStatusField
                                label="Status"
                                name="isActive"
                                value={formData.isActive ?? true}
                                onChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
                            />
                        )}
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
