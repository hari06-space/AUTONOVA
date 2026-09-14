import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Typography, Stack, Chip, Button, Box, IconButton, Tooltip, InputAdornment } from '@mui/material';
import { IconShieldCheck, IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSFormDialog, BOSFormSection, BOSTextField, tableActionEditSx,
  BOSStatusChip} from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

const columns = [
    { id: 'index',              label: '#',                  minWidth: 50,  align: 'center' },
    { id: 'empCode',            label: 'Emp Code',           minWidth: 120 },
    { id: 'employeeName',       label: 'Emp Name',           minWidth: 150 },
    { id: 'loanCode',           label: 'Loan Type',          minWidth: 150 },
    { id: 'loanAmt',            label: 'Loan Amt',           minWidth: 120, align: 'right' },
    { id: 'repayLoanAmt',       label: 'Re Pay Loan Amt',    minWidth: 140, align: 'right' },
    { id: 'issueDate',          label: 'Issue Date',         minWidth: 120, align: 'center' },
    { id: 'noOfMonths',         label: 'No of Month',        minWidth: 110, align: 'center' },
    { id: 'installmentAmt',     label: 'Ins Amt',            minWidth: 110, align: 'right' },
    { id: 'startYear',          label: 'Start Year',         minWidth: 100, align: 'center' },
    { id: 'startMonth',         label: 'Start Month',        minWidth: 120, align: 'center' },
    { id: 'endYear',            label: 'End Year',           minWidth: 100, align: 'center' },
    { id: 'endMonth',           label: 'End Month',          minWidth: 120, align: 'center' },
    { id: 'status',             label: 'Status',             minWidth: 120, align: 'center' },
    { id: 'reason',             label: 'Reason',             minWidth: 200 },
    { id: 'shortCloseRemarks',  label: 'Short Close Reason', minWidth: 200 },
    { id: 'createdBy',          label: 'CREATED BY',         minWidth: 130 },
    { id: 'createdDate',        label: 'CREATED DATE',       minWidth: 160, align: 'center' },
    { id: 'updatedBy',          label: 'UPDATED BY',         minWidth: 130 },
    { id: 'updatedDate',        label: 'UPDATED DATE',       minWidth: 160, align: 'center' }
];

function VerifyLoanDialog({ open, row, onClose, onDone }) {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.HRA_LOAN_VERIFICATION);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

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
                setRemarks((prev) => prev ? `${prev} ${cleaned}` : cleaned);
            }
            setIsListening(false);
        };

        recog.onerror = (event) => {
            if (event.error === 'aborted') {
                setIsListening(false);
                return;
            }
            console.error('Speech recognition error in verification dialog', event.error);
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

    useEffect(() => { if (open) { setRemarks(''); setIsListening(false); } }, [open]);

    const handleAction = async (action) => {
        if (action === 'REJECT' && !remarks.trim()) {
            dispatch(openSnackbar({
                open: true,
                message: 'Remarks are required to reject the loan.',
                severity: 'error',
                variant: 'alert'
            }));
            return;
        }
        setLoading(true);
        try {
            const endpoint = row.__type === 'issue'
                ? `/api/master/hr/payroll/loan-issues/${row.id}/verify`
                : `/api/master/hr/payroll/loan-applications/${row.id}/verify`;
            await axios.patch(endpoint, { action, remarks });
            dispatch(openSnackbar({
                open: true,
                message: `Loan ${action === 'APPROVE' ? 'verified' : 'rejected'} successfully`,
                severity: action === 'APPROVE' ? 'success' : 'error',
                variant: 'alert'
            }));
            onDone();
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Verification action failed', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    };

    if (!row) return null;

    const isPending = row.status === 'PENDING FOR VERIFIED';
    const canAction = isPending && (perms.approval || perms.write);

    return (
        <BOSFormDialog
            open={open}
            onClose={onClose}
            title="Verify Loan"
            maxWidth="md"
            secondaryActions={
                canAction && (
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="contained"
                            color="error"
                            disabled={loading}
                            onClick={() => handleAction('REJECT')}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            REJECT
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            disabled={loading}
                            onClick={() => handleAction('APPROVE')}
                            sx={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            VERIFY
                        </Button>
                    </Stack>
                )
            }
        >
            <Stack spacing={3}>
                <BOSFormSection title="Loan Application Details" icon={<IconShieldCheck size={20} />}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 2.5 }}>
                        <BOSTextField label="Employee Name" value={row.employeeName || ''} disabled />
                        <BOSTextField label="Loan Type" value={row.loanCode || ''} disabled />
                        <BOSTextField label="Status" value={row.status || ''} disabled />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 2.5 }}>
                        <BOSTextField label="Loan Amount" value={formatCurrency(row.loanAmt, row.currencyCode)} disabled />
                        <BOSTextField label="Repay Loan Amount" value={formatCurrency(row.repayLoanAmt, row.currencyCode)} disabled />
                        <BOSTextField label="Installment Amount" value={formatCurrency(row.installmentAmt, row.currencyCode)} disabled />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2.5, mb: 2.5 }}>
                        <BOSTextField label="Issue Date" value={formatDateOnly(row.issueDate)} disabled />
                        <BOSTextField label="No of Months" value={row.noOfMonths || ''} disabled />
                        <BOSTextField label="Start Month/Year" value={`${row.startMonth || ''} ${row.startYear || ''}`} disabled />
                    </Box>
                    <BOSTextField
                        label="Reason"
                        value={row.reason || 'No reason provided.'}
                        multiline
                        rows={2}
                        disabled
                        fullWidth
                    />
                </BOSFormSection>

                {canAction && (
                    <BOSFormSection title="Verification Remarks" icon={<IconShieldCheck size={20} />}>
                        <BOSTextField
                            label="Remarks (required for rejection)"
                            multiline
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            fullWidth
                            placeholder="Enter reason for approval or rejection..."
                            sx={{ position: 'relative' }}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                                                sx={{
                                                    animation: isListening ? 'pulse 1.5s infinite' : 'none',
                                                    '@keyframes pulse': {
                                                        '0%': { transform: 'scale(1)' },
                                                        '50%': { transform: 'scale(1.2)' },
                                                        '100%': { transform: 'scale(1)' }
                                                    }
                                                }}
                                            >
                                                {isListening ? <IconMicrophoneOff size={20} /> : <IconMicrophone size={20} />}
                                            </IconButton>
                                        </Box>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </BOSFormSection>
                )}
            </Stack>
        </BOSFormDialog>
    );
}

const getCurrencySymbol = (code) => {
    switch (code?.toUpperCase()) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'INR': return '₹';
        default: return '₹';
    }
};

const formatCurrency = (val, currencyCode = 'INR') => {
    if (val === undefined || val === null) return '-';
    const locale = currencyCode?.toUpperCase() === 'USD' ? 'en-US' : 'en-IN';
    return `${Number(val).toLocaleString(locale)}`;
};

const formatDateOnly = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy') : '-';

const formatDate = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

export default function LoanVerificationList() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.HRA_LOAN_VERIFICATION);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState(null);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [loans, setLoans] = useState([]);

    const globalQuery   = useSelector((s) => s.search.query);
    const globalFilters = useSelector((s) => s.search.filters);

    const fetchDropdownData = useCallback(async () => {
        try {
            const res = await axios.get('/api/master/hr/payroll/loans');
            setLoans(res.data || []);
        } catch (err) {
            console.error('Failed to load loans metadata', err);
        }
    }, []);

    useEffect(() => {
        fetchDropdownData();
    }, [fetchDropdownData]);

    useEffect(() => {
        const loanOptions = [
            { value: 'All', label: 'All' },
            ...loans.map(l => ({ value: l.loanCode, label: l.loanName }))
        ];

        dispatch(setFilterConfig([
            {
                id: 'loanCode',
                label: 'Loan Type',
                type: 'select',
                options: loanOptions.length > 1 ? loanOptions : [{ value: 'All', label: 'All' }],
                defaultValue: 'All',
                isStarred: true
            },
            {
                id: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'All', label: 'All' },
                    { value: 'PENDING FOR VERIFIED', label: 'PENDING FOR VERIFIED' },
                    { value: 'OPEN', label: 'OPEN' },
                    { value: 'REJECTED', label: 'REJECTED' }
                ],
                defaultValue: 'PENDING FOR VERIFIED',
                isStarred: true
            },
            {
                id: 'createdDate',
                label: 'CREATED DATE',
                type: 'dateRange',
                isStarred: true
            }
        ]));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch, loans]);

    const fetchLoanIssues = useCallback(async () => {
        setLoading(true);
        try {
            const [applicationsRes, issuesRes] = await Promise.all([
                axios.get('/api/master/hr/payroll/loan-applications'),
                axios.get('/api/master/hr/payroll/loan-issues')
            ]);
            
            const apps = (applicationsRes.data || []).map(r => ({ ...r, __type: 'application' }));
            const issues = (issuesRes.data || [])
                .filter(r => r.status === 'PENDING FOR VERIFIED' || r.verificationStatus === 'PENDING')
                .map(r => ({ ...r, __type: 'issue' }));
            
            setRows([...apps, ...issues]);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch loan applications and issues', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchLoanIssues(); }, [fetchLoanIssues]);

    const filteredRows = useMemo(() => rows.filter((row) => {
        // Filter by status (default to PENDING FOR VERIFIED if not specified)
        const targetStatus = globalFilters?.status || 'PENDING FOR VERIFIED';
        if (targetStatus !== 'All' && row.status !== targetStatus) return false;

        if (!matchCommonDateFilters(row, globalFilters, 'createdDate', null)) return false;

        if (globalFilters?.loanCode && globalFilters.loanCode !== 'All') {
            if (row.loanCode !== globalFilters.loanCode) return false;
        }

        const q = globalQuery?.toLowerCase() || '';
        const loanName = loans.find(l => l.loanCode === row.loanCode)?.loanName || '';
        return !q ||
            (row.employeeName && row.employeeName.toLowerCase().includes(q)) ||
            (row.empCode && row.empCode.toLowerCase().includes(q)) ||
            (row.loanCode && row.loanCode.toLowerCase().includes(q)) ||
            (loanName && loanName.toLowerCase().includes(q)) ||
            (row.status && row.status.toLowerCase().includes(q));
    }), [rows, globalQuery, globalFilters, loans]);

    const paginatedRows = useMemo(
        () => filteredRows.slice(page * size, page * size + size),
        [filteredRows, page, size]
    );

    const renderCell = (col, row, idx) => {
        if (col.id === 'index')       return idx + 1 + page * size;
        if (col.id === 'loanCode') {
            return loans.find(l => l.loanCode === row.loanCode)?.loanName || row.loanCode || '-';
        }
        if (col.id === 'loanAmt')    return formatCurrency(row.loanAmt, row.currencyCode);
        if (col.id === 'repayLoanAmt') return formatCurrency(row.repayLoanAmt, row.currencyCode);
        if (col.id === 'installmentAmt') return formatCurrency(row.installmentAmt, row.currencyCode);
        if (col.id === 'issueDate') return formatDateOnly(row.issueDate);
        if (col.id === 'createdDate') return formatDate(row.createdDate || row.createdAt);
        if (col.id === 'updatedDate') return formatDate(row.updatedDate || row.updatedAt);
        if (col.id === 'createdBy')   return row.createdBy || row.createdUser || '-';
        if (col.id === 'updatedBy')   return row.updatedBy || row.updatedUser || '-';
        if (col.id === 'status') {
            const colorMap = {
                OPEN: 'success',
                CLOSE: 'default',
                'PENDING FOR VERIFIED': 'warning',
                ACTIVE: 'success',
                PENDING_VERIFICATION: 'warning',
                REJECTED: 'error',
                PAID: 'default',
                'SHORT CLOSED': 'default'
            };
            return <BOSStatusChip status={row.status || '-'} showIcon />;
        }
        const v = row[col.id];
        return v !== undefined && v !== null && v !== '' ? v : '-';
    };

    const exportData = filteredRows.map((r, i) => ({
        index: i + 1,
        empCode: r.empCode || '',
        employeeName: r.employeeName || '',
        loanCode: loans.find(l => l.loanCode === r.loanCode)?.loanName || r.loanCode || '',
        loanAmt: r.loanAmt,
        repayLoanAmt: r.repayLoanAmt,
        issueDate: formatDateOnly(r.issueDate),
        noOfMonths: r.noOfMonths,
        installmentAmt: r.installmentAmt,
        startYear: r.startYear,
        startMonth: r.startMonth,
        endYear: r.endYear,
        endMonth: r.endMonth,
        status: r.status || '',
        reason: r.reason || '',
        shortCloseRemarks: r.shortCloseRemarks || '',
        createdBy: r.createdBy || r.createdUser || '',
        createdDate: formatDate(r.createdDate || r.createdAt),
        updatedBy: r.updatedBy || r.updatedUser || '',
        updatedDate: formatDate(r.updatedDate || r.updatedAt)
    }));

    return (
        <MainCard
            contentSX={{ p: 0 }}
            
            icon={IconShieldCheck}
      title={"Loan Verification"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchLoanIssues}
                    exportData={exportData}
                    exportFilename="Loan_Verifications"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                columns={columns}
                rows={paginatedRows}
                page={page}
                size={size}
                totalCount={filteredRows.length}
                loading={loading}
                onPageChange={setPage}
                onSizeChange={(s) => { setSize(s); setPage(0); }}
                onDoubleClickRow={(perms.approval || perms.write) ? (row) => { setSelectedRow(row); setVerifyDialogOpen(true); } : undefined}
                actionColumn={{
                    render: (row) => (
                        row.status === 'PENDING FOR VERIFIED' && (perms.approval || perms.write) && (
                            <Tooltip title="Verify">
                                <IconButton
                                    onClick={() => { setSelectedRow(row); setVerifyDialogOpen(true); }}
                                    size="small"
                                    sx={tableActionEditSx}
                                >
                                    <IconShieldCheck size={18} />
                                </IconButton>
                            </Tooltip>
                        )
                    )
                }}
                renderCell={renderCell}
            />

            <VerifyLoanDialog
                open={verifyDialogOpen}
                row={selectedRow}
                onClose={() => setVerifyDialogOpen(false)}
                onDone={() => { setVerifyDialogOpen(false); fetchLoanIssues(); }}
            />
        </MainCard>
    );
}
