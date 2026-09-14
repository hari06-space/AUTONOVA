import { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Stack, MenuItem, InputAdornment, Chip, Alert, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, FormHelperText, IconButton, Avatar, Typography } from '@mui/material';
import { IconCoin, IconAlertTriangle, IconMicrophone, IconMicrophoneOff, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, BOSAutocomplete, BOSEmployeeAutocomplete, getPhotoUrl, errorStyle} from 'ui-component/bos';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import useBOSValidation from 'hooks/useBOSValidation';
import useAuth from 'hooks/useAuth';

const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        default: return '₹';
    }
};

const VALIDATION_RULES = [
    { field: 'empCode', label: 'Employee', required: true },
    { field: 'loanCode', label: 'Loan Type', required: true },
    { field: 'loanAmt', label: 'Loan Amount', required: true },
    { field: 'repayLoanAmt', label: 'Repay Loan Amount', required: true },
    { field: 'requestDate', label: 'Request Date', required: true },
    { field: 'issueDate', label: 'Issue Date', required: true },
    { field: 'noOfMonths', label: 'No of Installment', required: true },
    { field: 'installmentAmt', label: 'Installment Amount', required: true },
    { field: 'startYear', label: 'Start Year', required: true },
    { field: 'startMonth', label: 'Start Month', required: true },
    { field: 'endYear', label: 'End Year', required: true },
    { field: 'endMonth', label: 'End Month', required: true },
    { field: 'requestedDetails', label: 'Requested Details', required: true }
];

const EMPTY_FORM = {
    empCode: '',
    employeeName: '',
    loanCode: '',
    currencyCode: 'INR',
    loanAmt: '',
    repayLoanAmt: '',
    requestDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    noOfMonths: '',
    installmentAmt: '',
    startYear: new Date().getFullYear(),
    startMonth: '',
    endYear: new Date().getFullYear(),
    endMonth: '',
    status: 'OPEN',
    requestedDetails: '',
    reason: ''
};

export default function AddLoanIssueDialog({ open, handleClose, initialData, isApplyMode = false }) {
    const dispatch = useDispatch();
    const { user } = useAuth();
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

    const [employees, setEmployees] = useState([]);
    const [loans, setLoans] = useState([]);
    const [allMonths, setAllMonths] = useState([]);
    const [designationLevels, setDesignationLevels] = useState([]);

    const selectedEmp = employees.find(emp => emp.empCode === formData.empCode);
    const employeeOptions = useMemo(() => {
        return employees.map(emp => ({
            value: emp.empCode,
            label: `${emp.employeeName} (${emp.empCode})`
        }));
    }, [employees]);

    const isHr = selectedEmp?.department?.departmentName?.toUpperCase() === 'HUMAN RESOURCES' || 
                 selectedEmp?.department?.departmentName?.toUpperCase() === 'HR';

    const currentMonths = useMemo(() => {
        return allMonths
            .filter(m => m.monthType === 'HR' && m.isActive)
            .sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));
    }, [allMonths]);

    const getNextMonthAndYear = (issueDateStr, monthsList) => {
        if (!issueDateStr || !monthsList || monthsList.length === 0) {
            return { startMonth: '', startYear: '' };
        }
        const date = new Date(issueDateStr);
        if (isNaN(date.getTime())) {
            return { startMonth: '', startYear: '' };
        }
        
        date.setMonth(date.getMonth() + 1);
        const nextYear = date.getFullYear();
        const nextMonthIndex = date.getMonth();
        
        const calendarMonths = [
            'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
        ];
        const nextMonthName = calendarMonths[nextMonthIndex];
        
        const matchingMonth = monthsList.find(m => m.monthName.toUpperCase() === nextMonthName) ||
                              monthsList.find(m => m.monthName.toUpperCase().startsWith(nextMonthName.substring(0, 3))) ||
                              monthsList[0];
                              
        return {
            startMonth: matchingMonth ? matchingMonth.monthName : '',
            startYear: nextYear
        };
    };

    const selectedLoan = loans.find(l => l.loanCode === formData.loanCode);
    const empDesgLevel = selectedEmp && designationLevels.find(dl => dl.rowId === selectedEmp.empLevelId);

    const parseLimitVal = (val) => {
        if (val === null || val === undefined || val === '') return undefined;
        const num = Number(val);
        return isNaN(num) || num === 0 ? undefined : num;
    };

    const formatLimitVal = (limit) => {
        if (limit === null || limit === undefined || limit === '' || isNaN(limit)) {
            return '-';
        }
        const symbol = getCurrencySymbol(formData.currencyCode);
        const locale = formData.currencyCode?.toUpperCase() === 'USD' ? 'en-US' : 'en-IN';
        return `${symbol} ${Number(limit).toLocaleString(locale)}`;
    };

    const hasDesgLimits = empDesgLevel && 
        empDesgLevel.minLimit !== null && empDesgLevel.minLimit !== undefined && empDesgLevel.minLimit !== '' &&
        empDesgLevel.maxLimit !== null && empDesgLevel.maxLimit !== undefined && empDesgLevel.maxLimit !== '';

    const minLimit = hasDesgLimits ? parseLimitVal(empDesgLevel.minLimit) : (selectedLoan ? parseLimitVal(selectedLoan.minLimit) : undefined);
    const maxLimit = hasDesgLimits ? parseLimitVal(empDesgLevel.maxLimit) : (selectedLoan ? parseLimitVal(selectedLoan.maxLimit) : undefined);

    // Check if entered amount is outside the dynamic min/max limits
    const loanAmtNum = Number(formData.loanAmt);
    const amountExceedsLimits = (hasDesgLimits || selectedLoan) && formData.loanAmt !== '' && (
        (minLimit !== undefined && loanAmtNum < minLimit) ||
        (maxLimit !== undefined && loanAmtNum > maxLimit)
    );

    const hasChanges = useMemo(() => {
        if (!isEditing || !initialData) return true;
        const keysToCompare = [
            'loanAmt', 'repayLoanAmt', 'noOfMonths', 'installmentAmt', 
            'startYear', 'startMonth', 'endYear', 'endMonth', 
            'reason', 'requestedDetails', 'loanCode'
        ];
        return keysToCompare.some(key => {
            const val1 = formData[key] === undefined || formData[key] === null ? '' : String(formData[key]);
            const val2 = initialData[key] === undefined || initialData[key] === null ? '' : String(initialData[key]);
            return val1 !== val2;
        });
    }, [formData, initialData, isEditing]);

    // Validate and default startMonth to the next month of issueDate
    useEffect(() => {
        if (currentMonths.length > 0) {
            const isValid = currentMonths.some(m => m.monthName.toUpperCase() === formData.startMonth?.toUpperCase());
            if (!isValid && formData.issueDate) {
                const defaults = getNextMonthAndYear(formData.issueDate, currentMonths);
                setFormData(prev => ({
                    ...prev,
                    startMonth: defaults.startMonth,
                    startYear: defaults.startYear || prev.startYear
                }));
            }
        } else {
            if (formData.startMonth !== '' || formData.endMonth !== '') {
                setFormData(prev => ({ ...prev, startMonth: '', endMonth: '' }));
            }
        }
    }, [currentMonths, formData.startMonth, formData.issueDate]);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [empRes, loanRes, monthRes, desgRes] = await Promise.all([
                    axios.get('/api/master/hr/employees'),
                    axios.get('/api/master/hr/payroll/loans'),
                    axios.get('/api/master/hr/payroll/months'),
                    axios.get('/api/master/hr/designation-levels')
                ]);
                setEmployees(empRes.data || []);
                setLoans(loanRes.data || []);
                setAllMonths(monthRes.data || []);
                setDesignationLevels(desgRes.data || []);
            } catch {
                dispatch(openSnackbar({ open: true, message: 'Failed to load metadata', severity: 'error', variant: 'alert' }));
            }
        };

        if (open) {
            fetchMetadata();
            if (initialData) {
                setFormData({
                    ...initialData,
                    issueDate: initialData.issueDate ? initialData.issueDate.split('T')[0] : '',
                    requestDate: initialData.requestDate ? initialData.requestDate.split('T')[0] : '',
                    startMonth: initialData.startMonth ? initialData.startMonth.toUpperCase() : '',
                    endMonth: initialData.endMonth ? initialData.endMonth.toUpperCase() : ''
                });
            } else {
                setFormData({
                    ...EMPTY_FORM,
                    empCode: isApplyMode ? (user?.employeeCode || user?.empCode || '') : '',
                    employeeName: isApplyMode ? (user?.name || '') : '',
                    status: isApplyMode ? 'PENDING FOR VERIFIED' : 'OPEN'
                });
            }
            clearErrors();
        }
    }, [open, initialData, clearErrors, dispatch, isApplyMode, user]);

    // Calculate End Year/Month and Installment Amt automatically when inputs change
    useEffect(() => {
        let insAmt = '';
        const monthsCount = parseInt(formData.noOfMonths, 10);
        if (!isNaN(monthsCount) && monthsCount > 0 && formData.repayLoanAmt) {
            const repayAmt = parseFloat(formData.repayLoanAmt);
            if (!isNaN(repayAmt)) {
                insAmt = Math.round(repayAmt / monthsCount).toString();
            }
        }

        let endYr = formData.endYear;
        let endMo = formData.endMonth;

        if (formData.issueDate && formData.noOfMonths && formData.startYear && formData.startMonth && currentMonths.length > 0) {
            const startYr = parseInt(formData.startYear, 10);
            const startMoIdx = currentMonths.findIndex(m => m.monthName.toUpperCase() === formData.startMonth.toUpperCase());

            if (!isNaN(monthsCount) && !isNaN(startYr) && startMoIdx !== -1) {
                const totalMonths = startMoIdx + monthsCount - 1;
                endYr = startYr + Math.floor(totalMonths / currentMonths.length);
                endMo = currentMonths[totalMonths % currentMonths.length].monthName;
            }
        }

        setFormData(prev => {
            if (prev.installmentAmt === insAmt && prev.endYear === endYr && prev.endMonth === endMo) {
                return prev;
            }
            return {
                ...prev,
                endYear: endYr,
                endMonth: endMo,
                installmentAmt: insAmt
            };
        });
    }, [formData.noOfMonths, formData.repayLoanAmt, formData.startYear, formData.startMonth, formData.issueDate, currentMonths]);

    const handleEmployeeChange = (newValue) => {
        const code = newValue && typeof newValue === 'object' ? newValue.value : newValue;
        const selectedEmp = employees.find(emp => emp.empCode === code);
        setFormData(prev => ({
            ...prev,
            empCode: code || '',
            employeeName: selectedEmp ? selectedEmp.employeeName : ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'empCode') {
            const selectedEmp = employees.find(emp => emp.empCode === value);
            setFormData(prev => ({
                ...prev,
                empCode: value,
                employeeName: selectedEmp ? selectedEmp.employeeName : ''
            }));
        } else if (name === 'issueDate') {
            const defaults = getNextMonthAndYear(value, currentMonths);
            setFormData(prev => ({
                ...prev,
                issueDate: value,
                startMonth: defaults.startMonth || prev.startMonth,
                startYear: defaults.startYear || prev.startYear
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        if (!validate(formData, VALIDATION_RULES)) return;

        try {
            const isPendingVerification = isApplyMode || amountExceedsLimits || formData.status === 'REJECTED';
            const finalStatus = isPendingVerification ? 'PENDING FOR VERIFIED' : formData.status;
            const finalVerificationStatus = isPendingVerification ? 'PENDING' : 'APPROVED';

            const payload = {
                ...formData,
                status: finalStatus,
                verificationStatus: finalVerificationStatus,
                rejectReason: finalStatus === 'PENDING FOR VERIFIED' ? null : formData.rejectReason,
                loanAmt: Number(formData.loanAmt),
                repayLoanAmt: Number(formData.repayLoanAmt),
                noOfMonths: Number(formData.noOfMonths),
                installmentAmt: Number(formData.installmentAmt),
                startYear: Number(formData.startYear),
                endYear: Number(formData.endYear)
            };

            if (isEditing) {
                const endpoint = isApplyMode
                    ? `/api/master/hr/payroll/loan-applications/${initialData.id}`
                    : `/api/master/hr/payroll/loan-issues/${initialData.id}`;
                await axios.put(endpoint, payload);
            } else {
                const endpoint = isApplyMode
                    ? '/api/master/hr/payroll/loan-applications'
                    : '/api/master/hr/payroll/loan-issues';
                await axios.post(endpoint, payload);
            }

            const itemLabel = isApplyMode ? 'application' : 'issue';
            dispatch(openSnackbar({
                open: true,
                message: `Loan ${itemLabel} ${isEditing ? 'updated' : 'saved'} successfully!`,
                severity: 'success',
                variant: 'alert'
            }));
            handleClose(true);
        } catch (error) {
            const msg = error?.response?.data || error?.message || 'Failed to save loan issue';
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
            title={isEditing ? 'Edit Loan Issue' : 'Issue Loan'}
            maxWidth="md"
            saveButtonDisabled={formData.status === 'REJECTED' && !hasChanges}
        >
            <Stack spacing={3}>
                {/* Rejection comments banner */}
                {isEditing && formData.status === 'REJECTED' && (
                    <Alert severity="error" icon={<IconAlertTriangle size={20} />}>
                        This loan application was <strong>Rejected</strong>.
                        {formData.rejectReason && (
                            <span><br /><strong>Rejection Comments:</strong> {formData.rejectReason}</span>
                        )}
                        <br />You must make changes to the loan details or requested details before you can save and re-submit it for verification.
                    </Alert>
                )}

                {/* Verification pending warning banner */}
                {isEditing && (formData.status === 'PENDING_VERIFICATION' || formData.status === 'PENDING FOR VERIFIED') && (
                    <Alert severity="warning" icon={<IconAlertTriangle size={20} />}>
                        This loan is <strong>Pending Verification</strong> — the loan amount is outside the allowed min/max limits.
                        A manager must approve it before it becomes active.
                    </Alert>
                )}

                {/* Out-of-limit warning when typing amount */}
                {amountExceedsLimits && (
                    <Alert severity="warning" icon={<IconAlertTriangle size={20} />}>
                        ⚠️ Loan amount ₹{loanAmtNum.toLocaleString('en-IN')} is outside the allowed range
                        ({formatLimitVal(minLimit)} – {maxLimit !== undefined ? formatLimitVal(maxLimit) : 'No Limit'}).
                        This loan will be saved as <strong>Pending Verification</strong> and requires manager approval.
                    </Alert>
                )}

                {/* ── Top Horizontal Employee Profile Header Card ── */}
                {(selectedEmp || formData.employeeName || formData.empCode) && (() => {
                    const empName = selectedEmp?.employeeName || formData.employeeName || 'Employee';
                    const empCodeStr = formData.empCode || selectedEmp?.empCode || '';
                    const dept = selectedEmp?.department?.departmentName || selectedEmp?.departmentName || '—';
                    const desig = selectedEmp?.designation?.designationName || selectedEmp?.designationName || '—';
                    const rawPhoto = selectedEmp?.employeePhotoUpload || selectedEmp?.photoUpload || selectedEmp?.photo || selectedEmp?.employeePhoto || selectedEmp?.photoPath;
                    const photoUrl = rawPhoto ? getPhotoUrl(rawPhoto) : null;

                    return (
                        <Box sx={{
                            bgcolor: 'grey.100',
                            borderRadius: '14px',
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={photoUrl}
                                    alt={empName}
                                    sx={{
                                        width: 52, height: 52,
                                        border: '2px solid',
                                        borderColor: 'primary.main',
                                        fontSize: '1.3rem',
                                        fontWeight: 800,
                                        bgcolor: 'primary.lighter',
                                        color: 'primary.dark'
                                    }}
                                >
                                    {!photoUrl && (empName?.charAt(0)?.toUpperCase() || <IconUser size={26} />)}
                                </Avatar>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                            {empName}
                                        </Typography>
                                        {empCodeStr && (
                                            <Chip
                                                label={`ID: ${empCodeStr}`}
                                                size="small"
                                                sx={{ bgcolor: 'primary.main', color: '#fff', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                                            />
                                        )}
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {[dept !== '—' && dept, desig !== '—' && desig].filter(Boolean).join(' • ') || 'Employee Profile'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    );
                })()}

                <BOSFormSection icon={<IconCoin size={20} />} title="Loan Issue Details">
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                        
                        {/* Employee Name */}
                        {isApplyMode ? (
                            <BOSTextField
                                label="Employee Name"
                                name="employeeName"
                                value={formData.employeeName}
                                disabled
                                InputProps={{ readOnly: true }}
                            />
                        ) : (
                            <BOSEmployeeAutocomplete
                                required
                                label="Employee Name"
                                name="empCode"
                                value={selectedEmp || null}
                                options={employees}
                                onChange={(val) => {
                                    if (val) {
                                        handleEmployeeChange(val.empCode || val.id);
                                    } else {
                                        handleEmployeeChange('');
                                    }
                                }}
                                error={!!errors.empCode}
                                helperText={errors.empCode}
                                disabled={isEditing}
                                placeholder="Search Employee..."
                            />
                        )}

                        {/* Employee Code */}
                        <BOSTextField
                            label="Employee Code"
                            name="empCodeDisplay"
                            value={formData.empCode || ''}
                            disabled
                            InputProps={{ readOnly: true }}
                        />

                        {/* Loan Type */}
                        <BOSTextField
                            select
                            required
                            label="Loan Type"
                            name="loanCode"
                            value={formData.loanCode}
                            onChange={handleChange}
                            error={!!errors.loanCode}
                            helperText={errors.loanCode}
                         sx={errorStyle(!!errors.loanCode)} >
                            <MenuItem value="" disabled>Select Loan Type</MenuItem>
                            {loans.map(loan => (
                                <MenuItem key={loan.id} value={loan.loanCode}>
                                    {loan.loanName}
                                </MenuItem>
                            ))}
                        </BOSTextField>

                        {/* Min and Max Limits side-by-side in Column 2 */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
                            {/* Min Limit */}
                            <BOSTextField
                                label="Min Limit"
                                value={formatLimitVal(minLimit)}
                                disabled
                                InputProps={{
                                    readOnly: true
                                }}
                            />

                            {/* Max Limit */}
                            <BOSTextField
                                label="Max Limit"
                                value={formatLimitVal(maxLimit)}
                                disabled
                                InputProps={{
                                    readOnly: true
                                }}
                            />
                        </Box>

                        {/* Loan Amt */}
                        <BOSTextField
                            required
                            type="number"
                            label="Loan Amount"
                            name="loanAmt"
                            value={formData.loanAmt}
                            onChange={handleChange}
                            error={!!errors.loanAmt || amountExceedsLimits}
                            helperText={
                                errors.loanAmt
                                    ? errors.loanAmt
                                    : amountExceedsLimits
                                    ? `Outside limit — will need verification`
                                    : undefined
                            }
                            InputProps={{
                                endAdornment: amountExceedsLimits ? (
                                    <InputAdornment position="end">
                                        <Chip label="Needs Verification" color="warning" size="small" />
                                    </InputAdornment>
                                ) : undefined
                            }}
                            inputProps={{
                                min: minLimit,
                                max: maxLimit
                            }}
                         sx={errorStyle(!!errors.loanAmt || amountExceedsLimits)} />

                        {/* Repay Loan Amt */}
                        <BOSTextField
                            required
                            type="number"
                            label="Repay Loan Amount"
                            name="repayLoanAmt"
                            value={formData.repayLoanAmt}
                            onChange={handleChange}
                            error={!!errors.repayLoanAmt}
                            helperText={errors.repayLoanAmt}
                            inputProps={{ min: 0 }}
                         sx={errorStyle(!!errors.repayLoanAmt)} />

                        {/* Request Date */}
                        <BOSDatePicker
                            required
                            label="Request Date"
                            name="requestDate"
                            value={formData.requestDate}
                            onChange={handleChange}
                            error={!!errors.requestDate}
                            helperText={errors.requestDate}
                            disablePast={false}
                         sx={errorStyle(!!errors.requestDate)} />

                        {/* Issue Date */}
                        <BOSDatePicker
                            required
                            label="Issue Date"
                            name="issueDate"
                            value={formData.issueDate}
                            onChange={handleChange}
                            error={!!errors.issueDate}
                            helperText={errors.issueDate}
                            disablePast={false}
                         sx={errorStyle(!!errors.issueDate)} />

                        {/* No of Month */}
                        {/* No of Month */}
                        <BOSTextField
                            required
                            type="number"
                            label="No of Installment"
                            name="noOfMonths"
                            value={formData.noOfMonths}
                            onChange={handleChange}
                            error={!!errors.noOfMonths}
                            helperText={errors.noOfMonths}
                            inputProps={{ min: 1 }}
                         sx={errorStyle(!!errors.noOfMonths)} />

                        {/* Ins Amt */}
                        <BOSTextField
                            required
                            label="Installment Amount"
                            name="installmentAmt"
                            value={formData.installmentAmt || 'Auto-calculated'}
                            disabled
                            InputProps={{
                                readOnly: true
                            }}
                        />

                        {/* Start Month */}
                        <BOSTextField
                            select
                            required
                            label="Start Month"
                            name="startMonth"
                            value={formData.startMonth}
                            onChange={handleChange}
                            error={!!errors.startMonth}
                            helperText={errors.startMonth}
                         sx={errorStyle(!!errors.startMonth)} >
                            <MenuItem value="" disabled>Select Month</MenuItem>
                            {currentMonths.map(m => (
                                <MenuItem key={m.id} value={m.monthName}>{m.monthName}</MenuItem>
                            ))}
                        </BOSTextField>

                        {/* Start Year */}
                        <BOSTextField
                            required
                            type="number"
                            label="Start Year"
                            name="startYear"
                            value={formData.startYear}
                            onChange={handleChange}
                            error={!!errors.startYear}
                            helperText={errors.startYear}
                         sx={errorStyle(!!errors.startYear)} />

                        {/* End Month */}
                        <BOSTextField
                            required
                            label="End Month"
                            name="endMonth"
                            value={formData.endMonth}
                            disabled
                            InputProps={{ readOnly: true }}
                        />

                        {/* End Year */}
                        <BOSTextField
                            required
                            type="number"
                            label="End Year"
                            name="endYear"
                            value={formData.endYear}
                            disabled
                            InputProps={{ readOnly: true }}
                        />

                        {/* Requested Details */}
                        <BOSTextField
                            required
                            multiline
                            rows={3}
                            label="Requested Details"
                            name="requestedDetails"
                            value={formData.requestedDetails}
                            onChange={handleChange}
                            error={!!errors.requestedDetails}
                            helperText={errors.requestedDetails}
                            sx={[ { gridColumn: 'span 2', position: 'relative' }, errorStyle(!!errors.requestedDetails) ]}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {listeningField === 'requestedDetails' && <VoiceWaveform />}
                                            <IconButton
                                                color={listeningField === 'requestedDetails' ? 'error' : 'primary'}
                                                onClick={(e) => handleMicClick('requestedDetails', e)}
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
                                                    animation: listeningField === 'requestedDetails' ? 'pulse 1.5s infinite' : 'none',
                                                    '@keyframes pulse': {
                                                        '0%': { transform: 'scale(1)' },
                                                        '50%': { transform: 'scale(1.2)' },
                                                        '100%': { transform: 'scale(1)' }
                                                    }
                                                }}
                                            >
                                                {listeningField === 'requestedDetails' ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                                            </IconButton>
                                        </Box>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
