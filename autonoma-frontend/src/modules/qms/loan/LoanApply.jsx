import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip } from '@mui/material';
import { IconFileInvoice } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters,
  BOSStatusChip} from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddLoanIssueDialog from './AddLoanIssueDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useAuth from 'hooks/useAuth';
import { format } from 'date-fns';

import { Avatar } from '@mui/material';
import { getPhotoUrl } from 'ui-component/bos';

const columns = [
    { id: 'index',            label: '#',            minWidth: 50,  align: 'center' },
    { id: 'id',               label: 'Req No',       minWidth: 100, align: 'center', bold: true },
    { id: 'empName',          label: 'Employee Name', minWidth: 170, bold: true },
    { id: 'empCode',          label: 'Emp Id',       minWidth: 110, align: 'center' },
    { id: 'loanCode',         label: 'Loan Type',    minWidth: 150 },
    { id: 'requestedDetails', label: 'Req Details',  minWidth: 200 },
    { id: 'requestDate',      label: 'Req Date',     minWidth: 120, align: 'center' },
    { id: 'createdDate',      label: 'CREATED DATE', minWidth: 160, align: 'center' },
    { id: 'loanAmt',          label: 'Loan Amt',     minWidth: 120, align: 'right' },
    { id: 'status',           label: 'Status',       minWidth: 120, align: 'center' }
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

export default function LoanApply() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.QMS_LOAN_APPLY);
    const { user } = useAuth();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [loans, setLoans] = useState([]);

    const globalQuery = useSelector((s) => s.search.query);
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
                    { value: 'ACTIVE', label: 'ACTIVE' },
                    { value: 'PENDING_VERIFICATION', label: 'PENDING VERIFICATION' },
                    { value: 'PAID', label: 'PAID' },
                    { value: 'REJECTED', label: 'REJECTED' },
                    { value: 'SHORT CLOSED', label: 'SHORT CLOSED' }
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
            const res = await axios.get('/api/master/hr/payroll/loan-applications');
            const allIssues = res.data || [];
            const userEmpCode = user?.employeeCode || user?.empCode;
            const filtered = userEmpCode
                ? allIssues.filter((row) => row.empCode === userEmpCode)
                : allIssues;
            setRows(filtered);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch loan applications', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch, user]);

    useEffect(() => { fetchLoanIssues(); }, [fetchLoanIssues]);

    const handleOpenAdd = () => { setSelectedRow(null); setDialogOpen(true); };
    const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/payroll/loan-applications/${selectedRow.id}`);
            dispatch(openSnackbar({ open: true, message: 'Loan application deleted successfully', severity: 'success', variant: 'alert' }));
            fetchLoanIssues();
            setDeleteDialogOpen(false);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to delete loan application', severity: 'error', variant: 'alert' }));
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
            (row.employeeName && String(row.employeeName).toLowerCase().includes(q)) ||
            (row.empCode && String(row.empCode).toLowerCase().includes(q)) ||
            (row.loanCode && String(row.loanCode).toLowerCase().includes(q)) ||
            (loanName && String(loanName).toLowerCase().includes(q)) ||
            (row.status && String(row.status).toLowerCase().includes(q));
    }), [rows, globalQuery, globalFilters, loans]);

    const paginatedRows = useMemo(
        () => filteredRows.slice(page * size, page * size + size),
        [filteredRows, page, size]
    );

    useKeyboardShortcuts({ 'ctrl+n': handleOpenAdd, 'escape': () => setDialogOpen(false) });

    const renderCell = (col, row, idx) => {
        if (col.id === 'index') return idx + 1 + page * size;
        if (col.id === 'id') return row.id;
        if (col.id === 'empName') {
            const name = row.employeeName || row.empName || '-';
            const photoPath = row.employeePhotoUpload || row.photoUpload || row.photo || row.employeePhoto || row.photoPath || row.employee?.employeePhotoUpload;
            const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;
            return (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                        src={photoUrl}
                        alt={name}
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
                        {!photoUrl && (name !== '-' ? name.charAt(0).toUpperCase() : '?')}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.3px' }}>
                        {name}
                    </Typography>
                </Stack>
            );
        }
        if (col.id === 'empCode') return row.empCode || '-';
        if (col.id === 'loanCode') {
            return loans.find(l => l.loanCode === row.loanCode)?.loanName || row.loanCode || '-';
        }
        if (col.id === 'loanAmt') return formatCurrency(row.loanAmt, row.currencyCode);
        if (col.id === 'requestDate') return formatDateOnly(row.requestDate);
        if (col.id === 'createdDate') return formatDate(row.createdDate || row.createdAt);
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
        id: r.id || '',
        empCode: r.empCode || '',
        loanCode: loans.find(l => l.loanCode === r.loanCode)?.loanName || r.loanCode || '',
        requestedDetails: r.requestedDetails || '',
        requestDate: formatDateOnly(r.requestDate),
        createdDate: formatDate(r.createdDate || r.createdAt),
        loanAmt: r.loanAmt,
        status: r.status || ''
    }));

    return (
        <MainCard
            contentSX={{ p: 0 }}
            
            icon={IconFileInvoice}
      title={"Loan Apply"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchLoanIssues}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Apply Loan', 'Ctrl + N')}
                    hasWritePermission={perms.write}
                    exportData={exportData}
                    exportFilename="Loan_Applications"
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
                onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
                onEditRow={perms.write ? handleOpenEdit : undefined}
                onDeleteRow={perms.delete ? (row) => { setSelectedRow(row); setDeleteDialogOpen(true); } : undefined}
                renderCell={renderCell}
            />

            <AddLoanIssueDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchLoanIssues(); }}
                initialData={selectedRow}
                isApplyMode={true}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Loan Application"
                message="Are you sure you want to delete this loan application?"
                itemName={selectedRow ? `Request #${selectedRow.id} for ${selectedRow.employeeName}` : ''}
            />
        </MainCard>
    );
}
