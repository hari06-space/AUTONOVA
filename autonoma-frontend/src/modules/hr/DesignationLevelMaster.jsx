import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconBriefcase, IconFileDownload, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { exportToExcel } from 'utils/excelExport';
import { BOSDataTable, BOSTableToolbar, getCommonDateFilters, matchCommonDateFilters } from 'ui-component/bos';;
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import AddDesignationLevelDialog from './AddDesignationLevelDialog';
import { format } from 'date-fns';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';

const columns = [
    { id: 'index', label: '#', minWidth: 50 },
    { id: 'level', label: 'Level', minWidth: 120, bold: true },
    { id: 'basic', label: 'Basic', minWidth: 120, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'da', label: 'DA', minWidth: 100, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'hra', label: 'HRA', minWidth: 100, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'ltaLimit', label: 'Leave Travel Allowance Limit', minWidth: 200, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'minLimit', label: 'Minimum Limit', minWidth: 140, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'maxLimit', label: 'Maximum Limit', minWidth: 140, format: (val) => (val != null && val !== '' ? `₹${Number(val).toLocaleString('en-IN')}` : '—') },
    { id: 'screeningLevel', label: 'Interview Screening Level', minWidth: 180 },
    { id: 'createdBy', label: 'Created By', minWidth: 130 },
    { id: 'createdDate', label: 'Created Date & Time', minWidth: 180 },
    { id: 'updatedBy', label: 'Updated By', minWidth: 130 },
    { id: 'updatedDate', label: 'Updated Date & Time', minWidth: 180 }
];

export default function DesignationLevelMaster() {
    const dispatch = useDispatch();
    const perms = usePagePermissions(PAGE_CODES.EMP_LEVEL);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    useEffect(() => {
        const uniqueLevels = Array.from(new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', ...rows.map(r => r.level).filter(Boolean)]));
        const levelOptions = [
            { label: 'All', value: 'All' },
            ...uniqueLevels.map(lvl => ({ label: lvl, value: lvl }))
        ];
        dispatch(setFilterConfig([
            {
                id: 'level',
                label: 'Level',
                type: 'select',
                options: levelOptions,
                defaultValue: 'All',
                isConstant: true,
                isStarred: true
            },
            { id: 'createdDate', label: 'Created Date', type: 'dateRange', isStarred: true }
        ]));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch, rows]);

    const fetchDesignationLevels = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/master/hr/designation-levels');
            setRows(response.data || []);
        } catch (error) {
            console.error('Failed to fetch designation levels:', error);
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch designation levels', severity: 'error', variant: 'alert' }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchDesignationLevels(); }, [fetchDesignationLevels]);

    // Real-time synchronization
    useEffect(() => {
        const handleRealtimeUpdate = (e) => {
            const eventData = e.detail;
            if (eventData && eventData.entityName === 'DesignationLevelController') {
                fetchDesignationLevels();
            }
        };
        window.addEventListener('bos-realtime-update', handleRealtimeUpdate);
        return () => {
            window.removeEventListener('bos-realtime-update', handleRealtimeUpdate);
        };
    }, [fetchDesignationLevels]);

    const handleOpenAdd = () => { setSelectedRow(null); setDialogOpen(true); };
    const handleOpenEdit = (row) => { setSelectedRow(row); setDialogOpen(true); };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        try {
            await axios.delete(`/api/master/hr/designation-levels/${selectedRow.rowId}`);
            dispatch(openSnackbar({ open: true, message: 'Designation Level deleted successfully', severity: 'success', variant: 'alert' }));
            fetchDesignationLevels();
            setDeleteDialogOpen(false);
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: 'Failed to delete', severity: 'error', variant: 'alert' }));
        }
    };

    const handleExport = useCallback(() => {
        if (perms.export && rows.length > 0) {
            exportToExcel(rows, columns, 'Designation_Level');
        }
    }, [perms.export, rows]);

    useKeyboardShortcuts({
        'ctrl+n': handleOpenAdd,
        'ctrl+e': handleExport,
        'ctrl+r': fetchDesignationLevels,
        'escape': () => setDialogOpen(false)
    });

    return (
        <MainCard
            contentSX={{ p: 0 }}
            
            icon={IconBriefcase}
      title={"Designation Level Master"}
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchDesignationLevels}
                    onNew={handleOpenAdd}
                    newTooltip={shortcutTooltip('Create Designation Level', 'Ctrl + N')}
                    hasWritePermission={perms.write}
                    exportData={rows}
                    exportFilename="Designation_Level"
                    hasExportPermission={perms.export}
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="designation-level-table"
                columns={columns}
                rows={rows}
                loading={loading}
                onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
                onEditRow={perms.write ? handleOpenEdit : undefined}
                onDeleteRow={(row) => { setSelectedRow(row); setDeleteDialogOpen(true); }}
            />

            <AddDesignationLevelDialog
                open={dialogOpen}
                handleClose={(refresh) => { setDialogOpen(false); if (refresh) fetchDesignationLevels(); }}
                initialData={selectedRow}
            />

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Designation Level"
                message="Are you sure you want to delete this designation Level?"
                itemName={selectedRow?.level}
            />
        </MainCard>
    );
}
