import { useState, useEffect, useCallback, useMemo } from 'react';
import { IconBuildingBank } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSStatusChip, matchCommonDateFilters } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddBankMasterDialog from './AddBankMasterDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

// ==============================|| BANK MASTER (BOS SOP STANDARD) ||============================== //

const columns = [
    { id: 'index',             label: '#',                  minWidth: 50,  align: 'center' },
    { id: 'bankCode',          label: 'Bank Code',          minWidth: 90,  bold: true, align: 'center' },
    { id: 'bankName',          label: 'Bank Name',          minWidth: 160, align: 'left' },
    { id: 'accountNo',         label: 'Account Number',     minWidth: 150, align: 'left' },
    { id: 'accountHolderName', label: 'Account Holder Name',minWidth: 180, align: 'left' },
    { id: 'ifscCode',          label: 'IFSC Code',          minWidth: 120, align: 'center' },
    { id: 'branchName',        label: 'Branch Name',        minWidth: 140, align: 'left' },
    { id: 'branchLocation',    label: 'Branch Location',    minWidth: 140, align: 'left' },
    { id: 'accountType',       label: 'Account Type',       minWidth: 130, align: 'center' },
    { id: 'remarks',           label: 'Remarks',            minWidth: 160, align: 'left' },
    { id: 'status',            label: 'Status',             minWidth: 110, align: 'center' },
    { id: 'createdBy',         label: 'Created By',         minWidth: 120, align: 'left' },
    { id: 'createdDate',       label: 'Created Date',       minWidth: 150, align: 'center' },
    { id: 'updatedBy',         label: 'Updated By',         minWidth: 120, align: 'left' },
    { id: 'updatedDate',       label: 'Updated Date',       minWidth: 150, align: 'center' },
];

const formatDate = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

export default function BankMaster() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.PAY_BANK);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const globalQuery   = useSelector((s) => s.search.query);
    const globalFilters = useSelector((s) => s.search.filters);

    const fetchBanks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/master/hr/payroll/banks');
            setRows(res.data || []);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch bank master', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchBanks(); }, [fetchBanks]);

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
        const uniqueBankNames = Array.from(new Set(resolvedRows.map((r) => r.bankName).filter(Boolean)));
        uniqueBankNames.sort();

        const options = [
            { value: 'All', label: 'All' },
            ...uniqueBankNames.map((name) => ({ value: name, label: name }))
        ];

        dispatch(setFilterConfig([
            {
                id: 'bankName',
                label: 'Bank Name',
                type: 'select',
                options: options,
                defaultValue: 'All',
                isStarred: true,
            },
            {
                id: 'accountType',
                label: 'Account Type',
                type: 'select',
                options: [
                    { value: 'All', label: 'All' },
                    { value: 'SAVINGS', label: 'Savings' },
                    { value: 'CURRENT', label: 'Current' },
                    { value: 'SALARY', label: 'Salary' },
                    { value: 'OVERDRAFT', label: 'Overdraft' }
                ],
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
            await axios.delete(`/api/master/hr/payroll/banks/${selectedRow.id}`);
            dispatch(openSnackbar({ open: true, message: 'Bank deleted successfully', severity: 'success', variant: 'alert' }));
            fetchBanks();
            setDeleteDialogOpen(false);
        } catch (err) {
            const msg = typeof err === 'string' ? err : err?.response?.data || 'Failed to delete bank';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    const filteredRows = useMemo(() => resolvedRows.filter((row) => {
        if (!matchCommonDateFilters(row, globalFilters, 'createdDate', 'updatedDate')) return false;

        if (globalFilters?.bankName && globalFilters.bankName !== 'All') {
            if (row.bankName !== globalFilters.bankName) return false;
        }

        if (globalFilters?.accountType && globalFilters.accountType !== 'All') {
            if (row.accountType !== globalFilters.accountType) return false;
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
            (row.bankCode && row.bankCode.toLowerCase().includes(q)) ||
            (row.bankName && row.bankName.toLowerCase().includes(q)) ||
            (row.accountNo && row.accountNo.toLowerCase().includes(q)) ||
            (row.accountHolderName && row.accountHolderName.toLowerCase().includes(q)) ||
            (row.ifscCode && row.ifscCode.toLowerCase().includes(q)) ||
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
            icon={IconBuildingBank}
            title={"Bank Master"}
            pageCode={PAGE_CODES.PAY_BANK}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchBanks}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Add Bank')}
                    hasWritePermission={perms.write}
                    exportData={filteredRows}
                    exportColumns={[
                        { header: 'Bank Code', key: 'bankCode' },
                        { header: 'Bank Name', key: 'bankName' },
                        { header: 'Account Number', key: 'accountNo' },
                        { header: 'Account Holder', key: 'accountHolderName' },
                        { header: 'IFSC Code', key: 'ifscCode' },
                        { header: 'Branch Name', key: 'branchName' },
                        { header: 'Branch Location', key: 'branchLocation' },
                        { header: 'Account Type', key: 'accountType' },
                        { header: 'Remarks', key: 'remarks' },
                        { header: 'Status', key: 'status' },
                        { header: 'Created By', key: 'createdByDisplay' },
                        { header: 'Created Date', key: (r) => formatDate(r.createdDate) },
                        { header: 'Updated By', key: 'updatedByDisplay' },
                        { header: 'Updated Date', key: (r) => formatDate(r.updatedDate) }
                    ]}
                    exportFilename="Bank_Master"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="bank-master-table"
                columns={columns}
                rows={filteredRows}
                loading={loading}
                page={page}
                size={size}
                onPageChange={(p) => setPage(p)}
                onSizeChange={(s) => setSize(s)}
                onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
                onEditRow={perms.write ? handleOpenEdit : undefined}
                onDeleteRow={perms.delete ? (row) => { setSelectedRow(row); setDeleteDialogOpen(true); } : undefined}
                renderCell={renderCell}
            />

            <AddBankMasterDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchBanks(); }}
                initialData={selectedRow}
                existingBanks={rows}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Bank"
                message="Are you sure you want to delete this bank entry?"
                itemName={selectedRow ? `${selectedRow.bankName} (${selectedRow.accountNo})` : ''}
            />
        </MainCard>
    );
}
