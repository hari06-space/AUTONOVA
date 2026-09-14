import { useState, useEffect, useRef } from 'react';
import { Box, Stack, MenuItem, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, FormHelperText, InputAdornment, IconButton, Avatar, Typography, Chip } from '@mui/material';
import { IconCoin, IconFileText, IconMicrophone, IconMicrophoneOff, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSDatePicker, getPhotoUrl, errorStyle} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const VALIDATION_RULES = [
    { field: 'empCode', label: 'Employee', required: true },
    { field: 'loanCode', label: 'Loan Type', required: true },
    { field: 'loanAmt', label: 'Loan Amount', required: true },
    { field: 'repayLoanAmt', label: 'Repay Loan Amount', required: true },
    { field: 'issueDate', label: 'Issue Date', required: true },
    { field: 'noOfMonths', label: 'No of Months', required: true },
    { field: 'installmentAmt', label: 'Installment Amount', required: true },
    { field: 'startYear', label: 'Start Year', required: true },
    { field: 'startMonth', label: 'Start Month', required: true },
    { field: 'endYear', label: 'End Year', required: true },
    { field: 'endMonth', label: 'End Month', required: true },
    { field: 'requestedDetails', label: 'Requested Details', required: false },
    { field: 'shortCloseRemarks', label: 'Remarks', required: true }
];

const EMPTY_FORM = {
    empCode: '',
    employeeName: '',
    loanCode: '',
    loanAmt: '',
    repayLoanAmt: '',
    issueDate: new Date().toISOString().split('T')[0],
    createdDate: new Date().toISOString().split('T')[0],
    requestDate: new Date().toISOString().split('T')[0],
    noOfMonths: '',
    installmentAmt: '',
    startYear: new Date().getFullYear(),
    startMonth: '',
    endYear: new Date().getFullYear(),
    endMonth: '',
    status: 'SHORT CLOSED',
    requestedDetails: '',
    loanIssueId: '',
    shortCloseDate: new Date().toISOString().split('T')[0],
    shortCloseRemarks: ''
};

export default function ShortCloseDialog({ open, handleClose, loanIssue }) {
    const dispatch = useDispatch();
    const { errors, validate, clearErrors } = useBOSValidation();
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [loanIssues, setLoanIssues] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loans, setLoans] = useState([]);
    const [months, setMonths] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recog = new SpeechRecognition();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-US';

        recog.onstart = () => {
            setIsListening(true);
        };

        recog.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
                const cleaned = transcript
                    .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()?"']+|[.,\/#!$%\^&\*;:{}=\-_`~()?"']+$/g, '')
                    .trim()
                    .toUpperCase();
                setFormData((prev) => ({
                    ...prev,
                    shortCloseRemarks: prev.shortCloseRemarks ? `${prev.shortCloseRemarks} ${cleaned}` : cleaned
                }));
            }
            setIsListening(false);
        };

        recog.onerror = (event) => {
            if (event.error === 'aborted') {
                setIsListening(false);
                return;
            }
            console.error('Speech recognition error in short close dialog', event.error);
            setIsListening(false);

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
            setIsListening(false);
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

    const handleMicClick = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const recog = recognitionRef.current;
        if (isListening) {
            if (recog) recog.stop();
        } else {
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

    const isEditing = Boolean(loanIssue && loanIssue.status === 'SHORT CLOSED');
    const isAdding = !loanIssue;

    // Fetch active/open loan issues, employees, and loans metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [empRes, loanRes, monthRes] = await Promise.all([
                    axios.get('/api/master/hr/employees'),
                    axios.get('/api/master/hr/payroll/loans'),
                    axios.get('/api/master/hr/payroll/months')
                ]);
                setEmployees(empRes.data || []);
                setLoans(loanRes.data || []);
                const activeMonths = (monthRes.data || [])
                    .filter(m => m.monthType === 'HR' && m.isActive)
                    .sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));
                setMonths(activeMonths);
            } catch (err) {
                console.error('Failed to load employees, loan types, or months metadata', err);
            }
        };

        const fetchActiveLoanIssues = async () => {
            try {
                const res = await axios.get('/api/master/hr/payroll/loan-issues');
                const activeIssues = (res.data || []).filter(item => item.status === 'ACTIVE' || item.status === 'OPEN' || item.status === 'PENDING FOR VERIFIED');
                setLoanIssues(activeIssues);
            } catch (err) {
                console.error('Failed to load active loan issues', err);
            }
        };

        if (open) {
            fetchMetadata();
            if (loanIssue) {
                setFormData({
                    ...loanIssue,
                    status: loanIssue.status || 'SHORT CLOSED',
                    loanIssueId: loanIssue.id || '',
                    issueDate: loanIssue.issueDate ? loanIssue.issueDate.split('T')[0] : '',
                    createdDate: loanIssue.createdDate ? loanIssue.createdDate.split('T')[0] : (loanIssue.createdAt ? loanIssue.createdAt.split('T')[0] : ''),
                    requestDate: loanIssue.requestDate ? loanIssue.requestDate.split('T')[0] : '',
                    startMonth: loanIssue.startMonth ? loanIssue.startMonth.toUpperCase() : '',
                    endMonth: loanIssue.endMonth ? loanIssue.endMonth.toUpperCase() : '',
                    requestedDetails: loanIssue.requestedDetails || '',
                    shortCloseDate: loanIssue.shortCloseDate ? loanIssue.shortCloseDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    shortCloseRemarks: loanIssue.shortCloseRemarks || ''
                });
            } else {
                setFormData(EMPTY_FORM);
                fetchActiveLoanIssues();
            }
            clearErrors();
        }
    }, [open, loanIssue, clearErrors]);

    // Calculate End Year/Month and Installment Amt automatically when inputs change
    useEffect(() => {
        if (!formData.issueDate || !formData.noOfMonths || !formData.startYear || !formData.startMonth || months.length === 0) return;

        const monthsCount = parseInt(formData.noOfMonths, 10);
        const startYr = parseInt(formData.startYear, 10);
        const startMoIdx = months.findIndex(m => m.monthName.toUpperCase() === (formData.startMonth || '').toUpperCase());

        if (isNaN(monthsCount) || isNaN(startYr) || startMoIdx === -1) return;

        // Calculate End Month and Year
        const totalMonths = startMoIdx + monthsCount - 1;
        const endYr = startYr + Math.floor(totalMonths / months.length);
        const endMo = months[totalMonths % months.length].monthName;

        // Calculate Installment Amt (Repay Loan Amt / No of Months)
        let insAmt = '';
        if (formData.repayLoanAmt) {
            const repayAmt = parseFloat(formData.repayLoanAmt);
            if (!isNaN(repayAmt) && monthsCount > 0) {
                insAmt = (repayAmt / monthsCount).toFixed(2);
            }
        }

        setFormData(prev => ({
            ...prev,
            endYear: endYr,
            endMonth: endMo,
            installmentAmt: insAmt
        }));
    }, [formData.noOfMonths, formData.repayLoanAmt, formData.startYear, formData.startMonth, formData.issueDate, months]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'empCode') {
            const selectedEmp = employees.find(emp => emp.empCode === value);
            setFormData(prev => ({
                ...prev,
                empCode: value,
                employeeName: selectedEmp ? selectedEmp.employeeName : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLoanChange = (e) => {
        const { value } = e.target;
        const selected = loanIssues.find(item => item.id === value);
        if (selected) {
            setFormData({
                ...selected,
                loanIssueId: value,
                issueDate: selected.issueDate ? selected.issueDate.split('T')[0] : '',
                createdDate: selected.createdDate ? selected.createdDate.split('T')[0] : (selected.createdAt ? selected.createdAt.split('T')[0] : ''),
                requestDate: selected.requestDate ? selected.requestDate.split('T')[0] : '',
                startMonth: selected.startMonth ? selected.startMonth.toUpperCase() : '',
                endMonth: selected.endMonth ? selected.endMonth.toUpperCase() : '',
                requestedDetails: selected.requestedDetails || '',
                shortCloseDate: new Date().toISOString().split('T')[0],
                shortCloseRemarks: ''
            });
        } else {
            setFormData(EMPTY_FORM);
        }
    };

    const handleSave = async () => {
        const rules = VALIDATION_RULES.filter(r => r.field !== 'shortCloseRemarks');
        if (formData.status === 'SHORT CLOSED') {
            rules.push({ field: 'shortCloseRemarks', label: 'Remarks', required: true });
        }
        if (isAdding) {
            rules.push({ field: 'loanIssueId', label: 'Loan Issue', required: true });
        }

        if (!validate(formData, rules)) return;

        const targetId = loanIssue ? loanIssue.id : formData.loanIssueId;

        try {
            const payload = {
                ...formData,
                status: formData.status || 'SHORT CLOSED',
                loanAmt: Number(formData.loanAmt),
                repayLoanAmt: Number(formData.repayLoanAmt),
                noOfMonths: Number(formData.noOfMonths),
                installmentAmt: Number(formData.installmentAmt),
                startYear: Number(formData.startYear),
                endYear: Number(formData.endYear),
                issueDate: new Date(formData.issueDate),
                createdDate: new Date(formData.createdDate),
                requestDate: formData.requestDate ? new Date(formData.requestDate) : new Date(),
                shortCloseDate: new Date(formData.shortCloseDate)
            };

            await axios.put(`/api/master/hr/payroll/loan-issues/${targetId}/short-close`, payload);

            dispatch(openSnackbar({
                open: true,
                message: `Loan issue updated successfully!`,
                severity: 'success',
                variant: 'alert'
            }));
            handleClose(true);
        } catch (error) {
            const msg = error?.response?.data || error?.message || 'Failed to update loan';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    return (
        <BOSFormDialog
            open={open}
            onClose={() => handleClose(false)}
            onSave={handleSave}
            title="Employee Loan Issue"
            maxWidth="md"
        >
            <Stack spacing={3.5}>
                {/* ── Top Horizontal Employee Profile Header Card ── */}
                {(formData.employeeName || formData.empCode) && (() => {
                    const empObj = employees.find(e => e.empCode === formData.empCode);
                    const empName = formData.employeeName || empObj?.employeeName || 'Employee';
                    const empCodeStr = formData.empCode || empObj?.empCode || '';
                    const dept = empObj?.department?.departmentName || empObj?.departmentName || '—';
                    const desig = empObj?.designation?.designationName || empObj?.designationName || '—';
                    const rawPhoto = empObj?.employeePhotoUpload || empObj?.photoUpload || empObj?.photo || empObj?.employeePhoto || empObj?.photoPath;
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

                {/* Section 1: Short Close details */}
                <BOSFormSection icon={<IconFileText size={20} />} title="Short Close Details">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: isAdding ? '1fr 1fr' : '1fr' }, gap: 2.5, width: '100%' }}>
                        {isAdding && (
                            <BOSTextField
                                select
                                required
                                label="Select Active Loan"
                                name="loanIssueId"
                                value={formData.loanIssueId || ''}
                                onChange={handleLoanChange}
                                error={!!errors.loanIssueId}
                                helperText={errors.loanIssueId}
                             sx={errorStyle(!!errors.loanIssueId)} >
                                <MenuItem value="" disabled>Select Loan</MenuItem>
                                {loanIssues.map(item => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {`${item.employeeName} - ${item.loanCode} (Amt: ₹${Number(item.loanAmt).toLocaleString('en-IN')})`}
                                    </MenuItem>
                                ))}
                            </BOSTextField>
                        )}
                        
                        <BOSTextField
                            label="Comments"
                            name="shortCloseRemarks"
                            value={formData.shortCloseRemarks}
                            onChange={handleChange}
                            error={!!errors.shortCloseRemarks}
                            helperText={errors.shortCloseRemarks}
                            required
                            sx={errorStyle(!!errors.shortCloseRemarks)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        {isListening && <VoiceWaveform />}
                                        <IconButton
                                            color={isListening ? 'error' : 'primary'}
                                            onClick={handleMicClick}
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
                                        >
                                            {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Box>
                </BOSFormSection>

                {/* Section 2: Full Loan details */}
                <BOSFormSection icon={<IconCoin size={20} />} title="Loan Information">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, width: '100%' }}>
                        {/* Left Column */}
                        <Stack spacing={2.5}>
                            <BOSTextField
                                select
                                required
                                label="Emp Name"
                                name="empCode"
                                value={formData.empCode || ''}
                                onChange={handleChange}
                                error={!!errors.empCode}
                                helperText={errors.empCode}
                                disabled
                             sx={errorStyle(!!errors.empCode)} >
                                <MenuItem value="" disabled>Select Employee</MenuItem>
                                {employees.map(emp => (
                                    <MenuItem key={emp.id} value={emp.empCode}>
                                        {emp.employeeName}
                                    </MenuItem>
                                ))}
                            </BOSTextField>

                            <BOSTextField
                                select
                                required
                                label="Loan Type"
                                name="loanCode"
                                value={formData.loanCode || ''}
                                onChange={handleChange}
                                error={!!errors.loanCode}
                                helperText={errors.loanCode}
                                disabled
                             sx={errorStyle(!!errors.loanCode)} >
                                <MenuItem value="" disabled>Select Loan Type</MenuItem>
                                {loans.map(loan => (
                                    <MenuItem key={loan.id} value={loan.loanCode}>
                                        {loan.loanName}
                                    </MenuItem>
                                ))}
                            </BOSTextField>

                            <BOSDatePicker
                                required
                                label="Request Date"
                                name="createdDate"
                                value={formData.createdDate || ''}
                                onChange={handleChange}
                                disabled
                                disablePast={false}
                            />

                            <BOSTextField
                                required
                                type="number"
                                label="Repayment Amt with intrest if Any"
                                name="repayLoanAmt"
                                value={formData.repayLoanAmt || ''}
                                onChange={handleChange}
                                error={!!errors.repayLoanAmt}
                                helperText={errors.repayLoanAmt}
                                disabled
                             sx={errorStyle(!!errors.repayLoanAmt)} />

                            <BOSTextField
                                required
                                type="number"
                                label="No of Month"
                                name="noOfMonths"
                                value={formData.noOfMonths || ''}
                                onChange={handleChange}
                                error={!!errors.noOfMonths}
                                helperText={errors.noOfMonths}
                                disabled
                             sx={errorStyle(!!errors.noOfMonths)} />

                            <BOSTextField
                                select
                                required
                                label="Instalment Start Year"
                                name="startYear"
                                value={formData.startYear || ''}
                                onChange={handleChange}
                                error={!!errors.startYear}
                                helperText={errors.startYear}
                                disabled
                             sx={errorStyle(!!errors.startYear)} >
                                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                                    <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                                ))}
                            </BOSTextField>

                            <BOSTextField
                                select
                                required
                                label="End Year"
                                name="endYear"
                                value={formData.endYear || ''}
                                disabled
                            >
                                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                                    <MenuItem key={yr} value={yr}>{yr}</MenuItem>
                                ))}
                            </BOSTextField>


                        </Stack>

                        {/* Right Column */}
                        <Stack spacing={2.5}>
                            <BOSTextField
                                label="Emp Id"
                                value={formData.empCode || ''}
                                disabled
                            />

                            <BOSTextField
                                label="Requested Details"
                                name="requestedDetails"
                                value={formData.requestedDetails || ''}
                                disabled
                            />

                            <BOSTextField
                                required
                                type="number"
                                label="Loan Amount"
                                name="loanAmt"
                                value={formData.loanAmt || ''}
                                onChange={handleChange}
                                error={!!errors.loanAmt}
                                helperText={errors.loanAmt}
                                disabled
                             sx={errorStyle(!!errors.loanAmt)} />

                            <BOSDatePicker
                                required
                                label="Issue Date"
                                name="issueDate"
                                value={formData.issueDate || ''}
                                onChange={handleChange}
                                error={!!errors.issueDate}
                                helperText={errors.issueDate}
                                disabled
                                disablePast={false}
                             sx={errorStyle(!!errors.issueDate)} />

                            <BOSTextField
                                label="Installment Amount"
                                name="installmentAmt"
                                value={formData.installmentAmt || ''}
                                disabled
                                helperText="Auto-calculated"
                            />

                            <BOSTextField
                                select
                                required
                                label="Installment Start Month"
                                name="startMonth"
                                value={formData.startMonth || ''}
                                onChange={handleChange}
                                error={!!errors.startMonth}
                                helperText={errors.startMonth}
                                disabled
                             sx={errorStyle(!!errors.startMonth)} >
                                {months.map(m => (
                                    <MenuItem key={m.id} value={m.monthName}>{m.monthName}</MenuItem>
                                ))}
                            </BOSTextField>

                            <BOSTextField
                                select
                                required
                                label="End of Installment Month"
                                name="endMonth"
                                value={formData.endMonth || ''}
                                disabled
                            >
                                {months.map(m => (
                                    <MenuItem key={m.id} value={m.monthName}>{m.monthName}</MenuItem>
                                ))}
                            </BOSTextField>
                        </Stack>
                    </Box>
                </BOSFormSection>
            </Stack>
        </BOSFormDialog>
    );
}
