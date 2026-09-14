import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconCoin } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip, matchCommonDateFilters } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddLoanMasterDialog from './AddLoanMasterDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

// ==============================|| LOAN MASTER (BOS SOP STANDARD) ||============================== //

const columns = [
    { id: 'index',       label: '#',            minWidth: 50,  align: 'center' },
    { id: 'loanCode',    label: 'Loan Code',    minWidth: 100, bold: true, align: 'center' },
    { id: 'loanName',    label: 'Loan Type',    minWidth: 160, align: 'left' },
    { id: 'minLimit',    label: 'Min Limit',    minWidth: 120, align: 'right' },
    { id: 'maxLimit',    label: 'Max Limit',    minWidth: 120, align: 'right' },
    { id: 'remarks',     label: 'Remarks',      minWidth: 160, align: 'left' },
    { id: 'status',      label: 'Status',       minWidth: 110, align: 'center' },
    { id: 'createdBy',   label: 'Created By',   minWidth: 120, align: 'left' },
    { id: 'createdDate', label: 'Created Date', minWidth: 150, align: 'center' },
    { id: 'updatedBy',   label: 'Updated By',   minWidth: 120, align: 'left' },
    { id: 'updatedDate', label: 'Updated Date', minWidth: 150, align: 'center' },
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

const formatCurrency = (val, symbol = '₹') =>
    val !== undefined && val !== null ? `${symbol} ${Number(val).toLocaleString('en-IN')}` : '-';

const formatDate = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

export default function LoanMaster() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.PAY_LOAN);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currencySymbol, setCurrencySymbol] = useState('₹');

    const globalQuery   = useSelector((s) => s.search.query);
    const globalFilters = useSelector((s) => s.search.filters);

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/master/hr/payroll/loans');
            setRows(res.data || []);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch loan master', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);

    // Fetch company currency symbol
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

    // ── RESOLVED ROWS (Formatting database outputs cleanly) ──
    const resolvedRows = useMemo(() => {
        if (!Array.isArray(rows)) return [];
        return rows.map((row) => ({
            ...row,
            status: row.isActive !== false ? 'Active' : 'Inactive',
            createdByDisplay: row.createdBy || row.createdUser || '-',
            updatedByDisplay: row.updatedBy || row.updatedUser || '-'
        }));
    }, [rows]);

    useEffect(() => {
        const uniqueLoanNames = Array.from(new Set(resolvedRows.map((r) => r.loanName).filter(Boolean)));
        uniqueLoanNames.sort();

        const options = [
            { value: 'All', label: 'All' },
            ...uniqueLoanNames.map((name) => ({ value: name, label: name }))
        ];

        dispatch(setFilterConfig([
            {
                id: 'loanName',
                label: 'Loan Type',
                type: 'select',
                options: options,
                defaultValue: 'All',
                isStarred: true,
            },
            {
                id: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'All', label: 'All' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                ],
                defaultValue: 'All',
                isStarred: true,
            },
            { id: 'createdUser', label: 'Created By', type: 'text', isStarred: false },
            { id: 'updatedUser', label: 'Updated By', type: 'text', isStarred: false },
            { id: 'createdDate', label: 'Created Date', type: 'dateRange', isStarred: true },
            { id: 'updatedDate', label: 'Updated Date', type: 'dateRange', isStarred: false },
        ]));
    }, [dispatch, resolvedRows]);

    useEffect(() => {
        return () => {
            dispatch(setFilterConfig(null));
        };
    }, [dispatch]);

    const handleOpenAdd  = () => { setSelectedRow(null); setDialogOpen(true); };
    const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/payroll/loans/${selectedRow.id}`);
            dispatch(openSnackbar({ open: true, message: 'Loan deleted successfully', severity: 'success', variant: 'alert' }));
            fetchLoans();
            setDeleteDialogOpen(false);
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.response?.data || 'Failed to delete loan';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const filteredRows = useMemo(() => resolvedRows.filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

        if (globalFilters?.loanName && globalFilters.loanName !== 'All') {
            if (row.loanName !== globalFilters.loanName) return false;
        }

        if (globalFilters?.status && globalFilters.status !== 'All') {
            if (row.status !== globalFilters.status) return false;
        }

        if (globalFilters?.createdUser && globalFilters.createdUser.trim() !== '') {
            const filterVal = globalFilters.createdUser.toLowerCase();
            if (!row.createdByDisplay.toLowerCase().includes(filterVal)) return false;
        }

        if (globalFilters?.updatedUser && globalFilters.updatedUser.trim() !== '') {
            const filterVal = globalFilters.updatedUser.toLowerCase();
            if (!row.updatedByDisplay.toLowerCase().includes(filterVal)) return false;
        }

        const q = globalQuery?.toLowerCase() || '';
        return !q ||
            (row.loanCode && row.loanCode.toLowerCase().includes(q)) ||
            (row.loanName && row.loanName.toLowerCase().includes(q)) ||
            (row.createdByDisplay && row.createdByDisplay.toLowerCase().includes(q)) ||
            (row.updatedByDisplay && row.updatedByDisplay.toLowerCase().includes(q));
    }), [resolvedRows, globalQuery, globalFilters]);

    useKeyboardShortcuts({
        'space+n': handleOpenAdd,
        'new': handleOpenAdd,
        'escape': () => setDialogOpen(false)
    });

    const renderCell = (col, row, idx) => {
        if (col.id === 'index')       return idx + 1;
        if (col.id === 'minLimit')    return formatCurrency(row.minLimit, currencySymbol);
        if (col.id === 'maxLimit')    return formatCurrency(row.maxLimit, currencySymbol);
        if (col.id === 'status')      return <BOSStatusChip status={row.status} showIcon width={100} />;
        if (col.id === 'createdBy')   return row.createdByDisplay;
        if (col.id === 'createdDate') return formatDate(row.createdDate);
        if (col.id === 'updatedBy')   return row.updatedByDisplay;
        if (col.id === 'updatedDate') return formatDate(row.updatedDate);
        return undefined;
    };

    return (
        <MainCard
            contentSX={{ p: 0 }}
            icon={IconCoin}
            title={"Loan Master"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchLoans}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Add Loan')}
                    hasWritePermission={perms.write}
                    exportData={filteredRows}
                    exportColumns={[
                        { header: 'Loan Code', key: 'loanCode' },
                        { header: 'Loan Type', key: 'loanName' },
                        { header: 'Min Limit', key: (r) => r.minLimit !== null && r.minLimit !== undefined ? `${currencySymbol} ${Number(r.minLimit).toLocaleString('en-IN')}` : '-' },
                        { header: 'Max Limit', key: (r) => r.maxLimit !== null && r.maxLimit !== undefined ? `${currencySymbol} ${Number(r.maxLimit).toLocaleString('en-IN')}` : '-' },
                        { header: 'Remarks', key: 'remarks' },
                        { header: 'Status', key: 'status' },
                        { header: 'Created By', key: 'createdByDisplay' },
                        { header: 'Created Date', key: (r) => formatDate(r.createdDate) },
                        { header: 'Updated By', key: 'updatedByDisplay' },
                        { header: 'Updated Date', key: (r) => formatDate(r.updatedDate) }
                    ]}
                    exportFilename="Loan_Master"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="loan-master-table"
                columns={columns}
                rows={filteredRows}
                loading={loading}
                onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
                onEditRow={perms.write ? handleOpenEdit : undefined}
                onDeleteRow={perms.delete ? (row) => { setSelectedRow(row); setDeleteDialogOpen(true); } : undefined}
                renderCell={renderCell}
            />

            <AddLoanMasterDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchLoans(); }}
                initialData={selectedRow}
                existingLoans={rows}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Loan"
                message="Are you sure you want to delete this loan?"
                itemName={selectedRow ? `${selectedRow.loanCode} - ${selectedRow.loanName}` : ''}
            />
        </MainCard>
    );
}
