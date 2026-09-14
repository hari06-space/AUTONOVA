import React, { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import {
    BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip,
    getCommonDateFilters, matchCommonDateFilters
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useGateEntryStore from 'store/purchase/useGateEntryStore';
import useAuth from 'hooks/useAuth';
import { IconEdit } from '@tabler/icons-react';
import { Chip } from '@mui/material';
import { DirectionsCar } from '@mui/icons-material';

const GATE_PASS_COLORS = {
    MATERIAL_RECEIPT: 'info',
    RETURNABLE: 'warning',
    NON_RETURNABLE: 'error',
    VISITOR: 'default',
};

const ENTRY_TYPE_COLORS = {
    INWARD: 'success',
    OUTWARD: 'secondary'
};

export default function GateEntryList() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { gateEntries, loading, fetchGateEntries } = useGateEntryStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');

    const fetchRows = useCallback(() => {
        if (user?.divisionId) fetchGateEntries(user.divisionId, 0, 500); // Fetching a larger size for client-side filtering demo
    }, [user?.divisionId, fetchGateEntries]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    useEffect(() => {
        const config = [
            { id: 'gateEntryNo', label: 'GE No', type: 'text', isStarred: true },
            { id: 'supplierName', label: 'Supplier', type: 'text', isStarred: true },
            {
                id: 'statusName', label: 'Status', type: 'select', isStarred: true,
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'CLOSED', label: 'Closed' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                ],
                defaultValue: 'ALL'
            },
            {
                id: 'entryType', label: 'Entry Type', type: 'select', isStarred: false,
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'INWARD', label: 'Inward' },
                    { value: 'OUTWARD', label: 'Outward' }
                ],
                defaultValue: 'ALL'
            },
            ...getCommonDateFilters('gateEntryDate', 'gateEntryDate')
        ];
        dispatch(setFilterConfig(config));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    const onFilter = useCallback((rows, filters) => {
        return rows.filter(row => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!(row.gateEntryNo?.toLowerCase().includes(q) || row.supplierName?.toLowerCase().includes(q))) return false;
            }
            if (filters.gateEntryNo && !row.gateEntryNo?.toLowerCase().includes(filters.gateEntryNo.toLowerCase())) return false;
            if (filters.supplierName && !row.supplierName?.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
            if (filters.statusName && filters.statusName !== 'ALL' && row.statusName !== filters.statusName) return false;
            if (filters.entryType && filters.entryType !== 'ALL' && row.entryType !== filters.entryType) return false;
            if (!matchCommonDateFilters(row, filters, 'gateEntryDate', 'gateEntryDate')) return false;
            return true;
        });
    }, [searchQuery]);

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 60 },
        { id: 'gateEntryNo', label: 'Gate Entry No', minWidth: 140 },
        { id: 'gateEntryDate', label: 'Date', minWidth: 100 },
        { id: 'supplierName', label: 'Supplier/Party', minWidth: 180 },
        {
            id: 'entryType', label: 'Type', minWidth: 100,
            render: (row) => (
                <Chip
                    label={row.entryType || 'INWARD'}
                    size="small"
                    color={ENTRY_TYPE_COLORS[row.entryType] || 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
            )
        },
        {
            id: 'gatePassType', label: 'Pass Type', minWidth: 140,
            render: (row) => (
                <Chip
                    label={row.gatePassType?.replace(/_/g, ' ') || 'MATERIAL RECEIPT'}
                    size="small"
                    color={GATE_PASS_COLORS[row.gatePassType] || 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
            )
        },
        { id: 'vehicleNo', label: 'Vehicle No', minWidth: 120 },
        {
            id: 'statusName', label: 'Status', minWidth: 160,
            render: (row) => <BOSStatusChip status={row.statusName || 'OPEN'} />
        },
    ], []);

    const actionColumn = useMemo(() => ({
        id: 'actions', label: 'Actions', align: 'center', minWidth: 90,
        render: (row) => (
            <BOSRowActions actions={[
                {
                    label: 'View / Edit',
                    icon: <IconEdit size={16} />,
                    onClick: () => navigate(`/purchase/gate-entry/entry/${row.id}`),
                    color: 'primary',
                    tooltip: 'View / Edit Gate Entry'
                }
            ]} />
        )
    }), [navigate]);

    return (
        <MainCard
            pageCode="PU1145"
            icon={DirectionsCar}
            content={false}
            title="Gate Entry"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchRows}
                    onNew={() => navigate(`/purchase/gate-entry/entry/new`)}
                    newLabel="+ New Gate Entry"
                    exportData={gateEntries || []}
                    exportFilename="Gate_Entries"
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="gate-entry-list-table"
                columns={columns}
                data={gateEntries || []}
                loading={loading}
                onFilter={onFilter}
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => navigate(`/purchase/gate-entry/entry/${row.id}`)}
            />
        </MainCard>
    );
}
