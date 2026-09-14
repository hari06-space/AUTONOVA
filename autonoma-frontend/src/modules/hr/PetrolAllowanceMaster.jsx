import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Stack, Chip } from '@mui/material';
import { IconGasStation } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters, BOSStatusChip } from 'ui-component/bos';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddPetrolAllowanceDialog from './AddPetrolAllowanceDialog';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { format } from 'date-fns';

const columns = [
    { id: 'index',             label: '#',                           minWidth: 50 },
    { id: 'vehicleType',       label: 'Vehicle Type',                minWidth: 140, bold: true },
    { id: 'fromRate',          label: 'From Rate',                   minWidth: 120 },
    { id: 'toRate',            label: 'To Rate',                     minWidth: 120 },
    { id: 'rateTwoWheeler',    label: 'Rate Per KM (Two Wheeler)',   minWidth: 160 },
    { id: 'rateFourWheeler',   label: 'Rate Per KM (Four Wheeler)',  minWidth: 160 },
    { id: 'isActive',          label: 'Status',                      minWidth: 110 },
    { id: 'createdBy',         label: 'Created User',                minWidth: 140 },
    { id: 'createdDate',       label: 'Created Date',                minWidth: 170 },
    { id: 'updatedBy',         label: 'Updated User',                minWidth: 140 },
    { id: 'updatedDate',       label: 'Updated Date',                minWidth: 170 },
];

const formatDateTime = (val) =>
    val ? format(new Date(val), 'dd/MM/yyyy HH:mm') : '-';

const formatVehicleType = (val) => {
    if (!val) return '-';
    if (val === 'EV' || val === 'ELECTRIC VEHICLE') return 'Electric Vehicle';
    if (val === 'CNG') return 'CNG';
    return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
};

export default function PetrolAllowanceMaster() {
    const dispatch = useDispatch();
    const perms    = usePagePermissions(PAGE_CODES.PAY_PETROL);

    const [rows,             setRows]             = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [page,             setPage]             = useState(0);
    const [size,             setSize]             = useState(10);
    const [selectedRow,      setSelectedRow]      = useState(null);
    const [dialogOpen,       setDialogOpen]       = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const globalQuery   = useSelector((s) => s.search.query);
    const globalFilters = useSelector((s) => s.search.filters);

    // ── Filter config ──────────────────────────────────────────────────────
    useEffect(() => {
        dispatch(setFilterConfig([
            {
                id: 'vehicleType',
                label: 'Vehicle Type',
                type: 'select',
                options: [
                    { value: 'All',              label: 'All' },
                    { value: 'PETROL',           label: 'Petrol' },
                    { value: 'DIESEL',           label: 'Diesel' },
                    { value: 'CNG',              label: 'CNG' },
                    { value: 'ELECTRIC VEHICLE', label: 'Electric Vehicle' },
                ],
                defaultValue: 'All',
                isStarred: true,
            },
            {
                id: 'isActive',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'All',  label: 'All' },
                    { value: 'true', label: 'Active' },
                    { value: 'false', label: 'Inactive' },
                ],
                defaultValue: 'All',
                isStarred: true,
            },
            {
                id: 'createdDate',
                label: 'Created Date',
                type: 'dateRange',
                isStarred: true
            }
        ]));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    // ── Data fetch ─────────────────────────────────────────────────────────
    const fetchAllowances = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/master/hr/payroll/petrol');
            setRows(res.data || []);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch petrol allowance master', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchAllowances(); }, [fetchAllowances]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOpenAdd  = () => { setSelectedRow(null); setDialogOpen(true); };
    const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/payroll/petrol/${selectedRow.id}`);
            dispatch(openSnackbar({ open: true, message: 'Petrol allowance deleted successfully', severity: 'success', variant: 'alert' }));
            fetchAllowances();
            setDeleteDialogOpen(false);
        } catch (err) {
            const msg = err?.response?.data?.message
                || (typeof err?.response?.data === 'string' ? err.response.data : null)
                || 'Failed to delete petrol allowance';
            dispatch(openSnackbar({ open: true, message: msg, severity: 'error', variant: 'alert' }));
        }
    };

    // ── Client-side filtering ──────────────────────────────────────────────
    const filteredRows = useMemo(() => rows
        .filter((row) => {
            if (!matchCommonDateFilters(row, globalFilters, 'createdDate', null)) return false;

            if (globalFilters?.vehicleType && globalFilters.vehicleType !== 'All') {
                const filterVal = globalFilters.vehicleType;
                const rowVal = row.vehicleType;
                const isMatch = rowVal === filterVal || 
                    ((filterVal === 'ELECTRIC VEHICLE' || filterVal === 'EV') && (rowVal === 'ELECTRIC VEHICLE' || rowVal === 'EV'));
                if (!isMatch) return false;
            }

            if (globalFilters?.isActive && globalFilters.isActive !== 'All') {
                const active = globalFilters.isActive === 'true';
                if (row.isActive !== active) return false;
            }

            const q = globalQuery?.toLowerCase() || '';
            return !q ||
                (row.vehicleType && row.vehicleType.toLowerCase().includes(q)) ||
                (row.fromRate && String(row.fromRate).includes(q)) ||
                (row.toRate && String(row.toRate).includes(q)) ||
                (row.rateTwoWheeler && String(row.rateTwoWheeler).includes(q)) ||
                (row.rateFourWheeler && String(row.rateFourWheeler).includes(q));
        })
        // Default sort: latest record
        .sort((a, b) => {
            return (b.id || 0) - (a.id || 0);
        }),
    [rows, globalQuery, globalFilters]);

    const paginatedRows = useMemo(
        () => filteredRows.slice(page * size, page * size + size),
        [filteredRows, page, size]
    );

    useKeyboardShortcuts({
        'space+n': handleOpenAdd,
        'new': handleOpenAdd,
        'escape': () => setDialogOpen(false)
    });

    const renderCell = (col, row, idx) => {
        if (col.id === 'index')             return idx + 1 + page * size;

        if (col.id === 'vehicleType') {
            return (
                <Chip
                    label={formatVehicleType(row.vehicleType)}
                    size="small"
                    color="primary"
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

        if (['fromRate', 'toRate', 'rateTwoWheeler', 'rateFourWheeler'].includes(col.id)) {
            const val = row[col.id];
            return val !== undefined && val !== null ? `₹ ${Number(val).toFixed(2)}` : '-';
        }

        return undefined;
    };

    return (
        <MainCard
            fullWidth
            icon={IconGasStation}
      title={"Petrol Allowance Details"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchAllowances}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Add Petrol Allowance')}
                    hasWritePermission={perms.write}
                    exportData={filteredRows}
                    exportColumns={[
                        { header: 'Vehicle Type', key: (r) => formatVehicleType(r.vehicleType) },
                        { header: 'From Rate', key: (r) => r.fromRate !== null && r.fromRate !== undefined ? `₹ ${Number(r.fromRate).toFixed(2)}` : '-' },
                        { header: 'To Rate', key: (r) => r.toRate !== null && r.toRate !== undefined ? `₹ ${Number(r.toRate).toFixed(2)}` : '-' },
                        { header: 'Rate Per KM (Two Wheeler)', key: (r) => r.rateTwoWheeler !== null && r.rateTwoWheeler !== undefined ? `₹ ${Number(r.rateTwoWheeler).toFixed(2)}` : '-' },
                        { header: 'Rate Per KM (Four Wheeler)', key: (r) => r.rateFourWheeler !== null && r.rateFourWheeler !== undefined ? `₹ ${Number(r.rateFourWheeler).toFixed(2)}` : '-' },
                        { header: 'Status', key: (r) => r.isActive ? 'Active' : 'Inactive' },
                        { header: 'Created User', key: 'createdBy' },
                        { header: 'Created Date', key: 'createdDate' },
                        { header: 'Updated User', key: 'updatedBy' },
                        { header: 'Updated Date', key: 'updatedDate' }
                    ]}
                    exportFilename="Petrol_Allowance_Master"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="petrol-allowance-table"
                columns={columns}
                rows={paginatedRows}
                page={page}
                size={size}
                totalCount={filteredRows.length}
                loading={loading}
                onPageChange={setPage}
                onSizeChange={(s) => { setSize(s); setPage(0); }}
                onDoubleClickRow={perms.write || perms.read ? handleOpenEdit : undefined}
                onEditRow={perms.write ? handleOpenEdit : undefined}
                onDeleteRow={perms.delete ? (row) => { setSelectedRow(row); setDeleteDialogOpen(true); } : undefined}
                renderCell={renderCell}
            />

            <AddPetrolAllowanceDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchAllowances(); }}
                initialData={selectedRow}
                existingRows={rows}
                readOnly={!perms.write}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Petrol Allowance"
                message="Are you sure you want to delete this petrol allowance entry?"
                itemName={selectedRow ? `${formatVehicleType(selectedRow.vehicleType)} allowance (₹${Number(selectedRow.fromRate).toFixed(2)} - ₹${Number(selectedRow.toRate).toFixed(2)})` : ''}
            />
        </MainCard>
    );
}
