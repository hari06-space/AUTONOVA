import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, IconButton, Tooltip, Avatar } from '@mui/material';
import { IconCircleX, IconEdit, IconTrash, IconUser } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, tableActionEditSx, tableActionDeleteSx, BOSStatusChip, getPhotoUrl } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import ShortCloseDialog from './ShortCloseDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const getLoanReceivedAndBalance = (row) => {
    const repayLoanAmt = Number(row.repayLoanAmt) || 0;
    const installmentAmt = Number(row.installmentAmt) || 0;

    if (row.status === 'PAID' || row.status === 'CLOSE') {
        return { receivedAmt: repayLoanAmt, balAmt: 0 };
    }

    let targetDate = new Date();
    if ((row.status === 'SHORT CLOSED' || row.status === 'CLOSE') && row.shortCloseDate) {
        targetDate = new Date(row.shortCloseDate);
    }

    const startYr = Number(row.startYear);
    const startMoIdx = MONTHS.indexOf((row.startMonth || '').toUpperCase());

    if (isNaN(startYr) || startMoIdx === -1) {
        return { receivedAmt: 0, balAmt: repayLoanAmt };
    }

    const targetYr = targetDate.getFullYear();
    const targetMoIdx = targetDate.getMonth();

    const diffMonths = (targetYr - startYr) * 12 + (targetMoIdx - startMoIdx);
    const elapsedMonths = Math.min(row.noOfMonths || 0, Math.max(0, diffMonths + 1));

    const receivedAmt = Math.min(repayLoanAmt, elapsedMonths * installmentAmt);
    const balAmt = Math.max(0, repayLoanAmt - receivedAmt);

    return { receivedAmt, balAmt };
};

const columns = [
    { id: 'index',             label: '#',                    minWidth: 50,  align: 'center' },
    { id: 'empCode',           label: 'Emp Code',             minWidth: 120 },
    { id: 'employeeName',      label: 'Emp Name',             minWidth: 150 },
    { id: 'loanCode',          label: 'Loan Type',            minWidth: 150 },
    { id: 'loanAmt',           label: 'Loan Amt',             minWidth: 120, align: 'right' },
    { id: 'repayLoanAmt',      label: 'Re Pay Loan Amt',      minWidth: 140, align: 'right' },
    { id: 'issueDate',         label: 'Issue Date',           minWidth: 120, align: 'center' },
    { id: 'noOfMonths',        label: 'No of Month',          minWidth: 110, align: 'center' },
    { id: 'installmentAmt',    label: 'Ins Amt',              minWidth: 110, align: 'right' },
    { id: 'startYear',         label: 'Start Year',           minWidth: 100, align: 'center' },
    { id: 'startMonth',        label: 'Start Month',          minWidth: 120, align: 'center' },
    { id: 'endYear',           label: 'End Year',             minWidth: 100, align: 'center' },
    { id: 'endMonth',          label: 'End Month',            minWidth: 120, align: 'center' },
    { id: 'receivedAmt',       label: 'Received Amt',         minWidth: 130, align: 'right' },
    { id: 'balAmt',            label: 'Bal. Amt',             minWidth: 130, align: 'right' },
    { id: 'status',            label: 'Status',               minWidth: 120, align: 'center' },
    { id: 'shortCloseDate',    label: 'Short Close Date',     minWidth: 150, align: 'center' },
    { id: 'shortCloseRemarks', label: 'Short Close Remarks',  minWidth: 200 },
    { id: 'createdBy',         label: 'CREATED BY',         minWidth: 130 },
    { id: 'createdDate',       label: 'CREATED DATE',         minWidth: 160, align: 'center' },
    { id: 'updatedBy',         label: 'UPDATED BY',         minWidth: 130 },
    { id: 'updatedDate',       label: 'UPDATED DATE',         minWidth: 160, align: 'center' }
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

const formatCurrency = (val, currencyCode = 'INR') => {
    if (val === undefined || val === null) return '-';
    const locale = currencyCode?.toUpperCase() === 'USD' ? 'en-US' : 'en-IN';
    return `${Number(val).toLocaleString(locale)}`;
};

const formatDateOnly = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy') : '-';

const formatDate = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

export default function LoanShortCloseList() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.HRA_LOAN_SHORT_CLOSE);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
                    { value: 'OPEN', label: 'OPEN' },
                    { value: 'CLOSE', label: 'CLOSE' },
                    { value: 'PENDING FOR VERIFIED', label: 'PENDING FOR VERIFIED' },
                    { value: 'SHORT CLOSED', label: 'SHORT CLOSED' },
                    { value: 'PAID', label: 'PAID' },
                    { value: 'ACTIVE', label: 'ACTIVE' }
                ],
                defaultValue: 'All',
                isStarred: true
            },
            ...getCommonDateFilters('createdDate', 'updatedDate')
        ]));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch, loans]);

    const fetchLoanIssues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/master/hr/payroll/loan-issues');
            setRows(res.data || []);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch loan issues', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchLoanIssues(); }, [fetchLoanIssues]);

    const handleOpenAdd = () => {
        setSelectedRow(null);
        setDialogOpen(true);
    };

    const handleShortCloseClick = (row) => {
        setSelectedRow(row);
        setDialogOpen(true);
    };

    const handleEditShortCloseClick = (row) => {
        setSelectedRow(row);
        setDialogOpen(true);
    };

    const handleDeleteShortCloseClick = (row) => {
        setSelectedRow(row);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/payroll/loan-issues/${selectedRow.id}/short-close`);
            dispatch(openSnackbar({
                open: true,
                message: 'Loan short close reverted successfully',
                severity: 'success',
                variant: 'alert'
            }));
            fetchLoanIssues();
            setDeleteDialogOpen(false);
        } catch (error) {
            const msg = error?.response?.data || error?.message || 'Failed to revert short close';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const filteredRows = useMemo(() => rows.filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

        if (globalFilters?.loanCode && globalFilters.loanCode !== 'All') {
            if (row.loanCode !== globalFilters.loanCode) return false;
        }

        if (globalFilters?.status && globalFilters.status !== 'All') {
            if (row.status !== globalFilters.status) return false;
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

    useKeyboardShortcuts({ 'ctrl+n': handleOpenAdd, 'escape': () => setDialogOpen(false) });

    const renderCell = (col, row, idx) => {
        if (col.id === 'index')       return idx + 1 + page * size;
        if (col.id === 'employeeName') {
            const photoPath = row.employeePhotoUpload || row.photoUpload || row.photo || row.employeePhoto || row.photoPath || row.employee?.employeePhotoUpload;
            const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;
            return (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        src={photoUrl}
                        alt={row.employeeName}
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: 'primary.lighter',
                            color: 'primary.main',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid',
                            borderColor: 'primary.light'
                        }}
                    >
                        {!photoUrl && (row.employeeName ? row.employeeName.charAt(0).toUpperCase() : <IconUser size={18} />)}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.3px' }}>
                        {row.employeeName || '-'}
                    </Typography>
                </Stack>
            );
        }
        if (col.id === 'loanCode') {
            return loans.find(l => l.loanCode === row.loanCode)?.loanName || row.loanCode || '-';
        }
        if (col.id === 'loanAmt')    return formatCurrency(row.loanAmt, row.currencyCode);
        if (col.id === 'repayLoanAmt') return formatCurrency(row.repayLoanAmt, row.currencyCode);
        if (col.id === 'installmentAmt') return formatCurrency(row.installmentAmt, row.currencyCode);
        if (col.id === 'issueDate') return formatDateOnly(row.issueDate);
        if (col.id === 'receivedAmt') {
            const { receivedAmt } = getLoanReceivedAndBalance(row);
            return formatCurrency(receivedAmt, row.currencyCode);
        }
        if (col.id === 'balAmt') {
            const { balAmt } = getLoanReceivedAndBalance(row);
            return formatCurrency(balAmt, row.currencyCode);
        }
        if (col.id === 'shortCloseDate') return row.shortCloseDate ? formatDateOnly(row.shortCloseDate) : '-';
        if (col.id === 'createdDate') return formatDate(row.createdDate || row.createdAt);
        if (col.id === 'updatedDate') return formatDate(row.updatedDate || row.updatedAt);
        if (col.id === 'createdBy') return row.createdBy || row.createdUser || '-';
        if (col.id === 'updatedBy') return row.updatedBy || row.updatedUser || '-';
        if (col.id === 'status') {
            return <BOSStatusChip status={row.status || '-'} showIcon />;
        }
        const v = row[col.id];
        return v !== undefined && v !== null && v !== '' ? v : '-';
    };

    const exportData = filteredRows.map((r, i) => {
        const { receivedAmt, balAmt } = getLoanReceivedAndBalance(r);
        const loanName = loans.find(l => l.loanCode === r.loanCode)?.loanName || r.loanCode || '';
        return {
            index: i + 1,
            empCode: r.empCode || '',
            employeeName: r.employeeName || '',
            loanCode: loanName,
            loanAmt: r.loanAmt,
            repayLoanAmt: r.repayLoanAmt,
            issueDate: formatDateOnly(r.issueDate),
            noOfMonths: r.noOfMonths,
            installmentAmt: r.installmentAmt,
            startYear: r.startYear,
            startMonth: r.startMonth,
            endYear: r.endYear,
            endMonth: r.endMonth,
            receivedAmt: receivedAmt,
            balAmt: balAmt,
            status: r.status || '',
            shortCloseDate: r.shortCloseDate ? formatDateOnly(r.shortCloseDate) : '',
            shortCloseRemarks: r.shortCloseRemarks || '',
            createdBy: r.createdBy || r.createdUser || '',
            createdDate: formatDate(r.createdDate || r.createdAt),
            updatedBy: r.updatedBy || r.updatedUser || '',
            updatedDate: formatDate(r.updatedDate || r.updatedAt)
        };
    });

    return (
        <MainCard
            contentSX={{ p: 0 }}
            
            icon={IconCircleX}
      title={"Loan Short Close"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchLoanIssues}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Short Close Loan', 'Ctrl + N')}
                    hasWritePermission={perms.write}
                    exportData={exportData}
                    exportFilename="Loan_Short_Close_List"
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
                onDoubleClickRow={perms.write ? (row) => {
                    if (row.status === 'SHORT CLOSED') handleEditShortCloseClick(row);
                    else if (row.status === 'ACTIVE' || row.status === 'OPEN' || row.status === 'PENDING FOR VERIFIED') handleShortCloseClick(row);
                } : undefined}
                actionColumn={{
                    render: (row) => {
                        const canEdit = (row.status === 'ACTIVE' || row.status === 'OPEN' || row.status === 'PENDING FOR VERIFIED' || row.status === 'SHORT CLOSED') && perms.write;
                        const canDelete = row.status === 'SHORT CLOSED' && perms.delete;
                        return (
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                {canEdit && (
                                    <Tooltip title={row.status === 'SHORT CLOSED' ? 'Edit Short Close' : 'Short Close'}>
                                        <IconButton
                                            onClick={(e) => { e.stopPropagation(); handleShortCloseClick(row); }}
                                            size="small"
                                            sx={tableActionEditSx}
                                        >
                                            <IconEdit size={18} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {canDelete && (
                                    <Tooltip title="Revert Short Close">
                                        <IconButton
                                            onClick={(e) => { e.stopPropagation(); handleDeleteShortCloseClick(row); }}
                                            size="small"
                                            sx={tableActionDeleteSx}
                                        >
                                            <IconTrash size={18} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        );
                    }
                }}
                renderCell={renderCell}
            />

            <ShortCloseDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchLoanIssues(); }}
                loanIssue={selectedRow}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Revert Short Close"
                message="Are you sure you want to revert the short close status for this loan? The loan status will be reverted to ACTIVE."
                itemName={selectedRow ? `${selectedRow.employeeName} (${loans.find(l => l.loanCode === selectedRow.loanCode)?.loanName || selectedRow.loanCode})` : ''}
            />
        </MainCard>
    );
}
