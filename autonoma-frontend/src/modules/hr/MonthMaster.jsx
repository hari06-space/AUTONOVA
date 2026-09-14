import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip } from '@mui/material';
import { IconCalendarEvent } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddMonthMasterDialog from './AddMonthMasterDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

const columns = [
    { id: 'index',       label: '#',            minWidth: 50 },
    { id: 'monthType',   label: 'Month Type',   minWidth: 130 },
    { id: 'monthName',   label: 'Month Name',   minWidth: 180, bold: true },
    { id: 'seqNo',       label: 'Seq No',       minWidth: 100 },
    { id: 'isActive',    label: 'Status',       minWidth: 110 },
    { id: 'createdBy',   label: 'Created User', minWidth: 140 },
    { id: 'createdDate', label: 'Created Date', minWidth: 170 },
    { id: 'updatedBy',   label: 'Updated User', minWidth: 140 },
    { id: 'updatedDate', label: 'Updated Date', minWidth: 170 },
];

const formatDate = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

export default function MonthMaster() {
    const dispatch = useDispatch();
    const perms    = usePagePermissions(PAGE_CODES.PAY_MONTH);

    const [rows,            setRows]            = useState([]);
    const [loading,         setLoading]         = useState(false);
    const [page,            setPage]            = useState(0);
    const [size,            setSize]            = useState(10);
    const [selectedRow,     setSelectedRow]     = useState(null);
    const [dialogOpen,      setDialogOpen]      = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const globalQuery   = useSelector((s) => s.search.query);
    const globalFilters = useSelector((s) => s.search.filters);

    // ── Filter config ──────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(setFilterConfig([
            {
                id: 'monthType',
                label: 'Month Type',
                type: 'select',
                options: [
                    { value: 'All',     label: 'All'     },
                    { value: 'REGULAR', label: 'Regular' },
                    { value: 'HR',      label: 'HR'      },
                ],
                defaultValue: 'All',
                isStarred: true,
            },
            {
                id: 'isActive',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'All',  label: 'All'      },
                    { value: 'true', label: 'Active'   },
                    { value: 'false', label: 'Inactive' },
                ],
                defaultValue: 'true',
                isStarred: true,
            },
            {
                id: 'createdDate',
                label: 'CREATED DATE',
                type: 'dateRange',
                isStarred: true
            }
        ]));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    // ── Data fetch ─────────────────────────────────────────────────────────
    const fetchMonths = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/master/hr/payroll/months');
            setRows(res.data || []);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch month master', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchMonths(); }, [fetchMonths]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOpenAdd  = () => { setSelectedRow(null); setDialogOpen(true); };
    const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/payroll/months/${selectedRow.id}`);
            dispatch(openSnackbar({ open: true, message: 'Month deleted successfully', severity: 'success', variant: 'alert' }));
            fetchMonths();
            setDeleteDialogOpen(false);
        } catch (err) {
            const msg = err?.response?.data?.message
                || (typeof err?.response?.data === 'string' ? err.response.data : null)
                || 'Failed to delete month';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    // ── Client-side filtering ──────────────────────────────────────────────
    const filteredRows = useMemo(() => rows
        .filter((row) => {
            if (!matchCommonDateFilters(row, globalFilters, 'createdDate', null)) return false;

            if (globalFilters?.monthType && globalFilters.monthType !== 'All') {
                if (row.monthType !== globalFilters.monthType) return false;
            }

            const activeFilter = globalFilters?.isActive ?? 'true';
            if (activeFilter !== 'All') {
                const active = activeFilter === 'true';
                if (row.isActive !== active) return false;
            }

            const q = globalQuery?.toLowerCase() || '';
            return !q ||
                (row.monthName && row.monthName.toLowerCase().includes(q)) ||
                (row.monthType && row.monthType.toLowerCase().includes(q));
        })
        // Default sort: by Seq No (ascending), then by Month Name
        .sort((a, b) => {
            const seqDiff = (a.seqNo ?? 0) - (b.seqNo ?? 0);
            return seqDiff !== 0 ? seqDiff : (a.monthName || '').localeCompare(b.monthName || '');
        }),
    [rows, globalQuery, globalFilters]);

    const paginatedRows = useMemo(
        () => filteredRows.slice(page * size, page * size + size),
        [filteredRows, page, size]
    );

    useKeyboardShortcuts({ 'escape': () => setDialogOpen(false) });

    // ── Cell rendering ─────────────────────────────────────────────────────
    const renderCell = (col, row, idx) => {
        if (col.id === 'index')       return idx + 1 + page * size;

        if (col.id === 'monthType') {
            const isHR = row.monthType === 'HR';
            return (
                <Chip
                    label={isHR ? 'HR' : 'Regular'}
                    size="small"
                    color={isHR ? 'success' : 'primary'}
                    variant="outlined"
                />
            );
        }

        if (col.id === 'isActive') {
            return (
                <BOSStatusChip
                    status={row.isActive ? 'Active' : 'Inactive'}
                    showIcon={true}
                    width={110}
                />
            );
        }

        return undefined;
    };

    return (
        <MainCard
            fullWidth
            icon={IconCalendarEvent}
      title={"Month Master"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchMonths}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Add Month', 'Ctrl + N')}
                    hasWritePermission={perms.write}
                    exportData={filteredRows}
                    exportColumns={[
                        { header: 'Month Type', key: 'monthType' },
                        { header: 'Month Name', key: 'monthName' },
                        { header: 'Seq No', key: 'seqNo' },
                        { header: 'Status', key: (r) => r.isActive ? 'Active' : 'Inactive' },
                        { header: 'Created User', key: 'createdBy' },
                        { header: 'Created Date', key: 'createdDate' },
                        { header: 'Updated User', key: 'updatedBy' },
                        { header: 'Updated Date', key: 'updatedDate' }
                    ]}
                    exportFilename="Month_Master"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="month-master-table"
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

            <AddMonthMasterDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchMonths(); }}
                initialData={selectedRow}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Month"
                message="Are you sure you want to delete this month?"
                itemName={selectedRow ? `${selectedRow.monthType} — ${selectedRow.monthName}` : ''}
            />
        </MainCard>
    );
}
