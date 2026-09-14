import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { IconClipboardList } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import { IconEdit, IconCheck, IconX } from '@tabler/icons-react';

const InspectionSpecificationList = ({ onAdd, onEdit }) => {
    const dispatch = useDispatch();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(0);
    const rowsPerPage = 20;

    const fetchData = useCallback(async (pg = 0) => {
        setLoading(true);
        try {
            const res = await axios.get('/api/qmc/inspection-specification', {
                params: { page: pg, size: rowsPerPage }
            });
            setData(res.data.content || []);
            setTotalItems(res.data.totalItems || 0);
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch Inspection Specifications.', variant: 'alert', alert: { color: 'error' }, close: true }));
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => { fetchData(page); }, [fetchData, page]);

    useEffect(() => {
        const config = [
            { id: 'specificationCode', label: 'Spec Code', type: 'text', isStarred: true },
            { id: 'specificationName', label: 'Spec Name', type: 'text', isStarred: true },
            { id: 'itemNo', label: 'Item No', type: 'text' }
        ];
        dispatch(setFilterConfig(config));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    const onFilter = useCallback((rows) => {
        if (!searchQuery) return rows;
        const q = searchQuery.toLowerCase();
        return rows.filter(row =>
            row.specificationCode?.toLowerCase().includes(q) ||
            row.specificationName?.toLowerCase().includes(q) ||
            row.itemNo?.toLowerCase().includes(q) ||
            row.itemName?.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const handleStatusToggle = async (id) => {
        try {
            await axios.patch(`/api/qmc/inspection-specification/${id}/status`);
            dispatch(openSnackbar({ open: true, message: 'Status updated.', variant: 'alert', alert: { color: 'success' }, close: true }));
            fetchData(page);
        } catch {
            dispatch(openSnackbar({ open: true, message: 'Failed to update status.', variant: 'alert', alert: { color: 'error' }, close: true }));
        }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

    const columns = useMemo(() => [
        { id: 'index', label: '#', minWidth: 50 },
        { id: 'specificationCode', label: 'Spec Code', minWidth: 100 },
        { id: 'specificationName', label: 'Specification Name', minWidth: 180 },
        { id: 'itemNo', label: 'Item', minWidth: 150, render: (row) => (
            <Box>
                <Box sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{row.itemNo}</Box>
                <Box sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{row.itemName}</Box>
            </Box>
        )},
        { id: 'itemGroup', label: 'Item Group', minWidth: 120, render: (row) => row.itemGroup || '-' },
        { id: 'aqlCode', label: 'AQL / Sampling Plan', minWidth: 140, render: (row) => row.aqlCode ? (
            <Tooltip title={`${row.aqlName || ''} (Level: ${row.inspectionLevel || '-'}, AQL: ${row.aqlValue || '-'})`} placement="top">
                <Chip label={row.aqlCode} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
            </Tooltip>
        ) : '-' },
        { id: 'versionNo', label: 'Version', minWidth: 70, align: 'center', render: (row) => `V${row.versionNo || 1}` },
        { id: 'parameterCount', label: 'Params', minWidth: 70, align: 'center', render: (row) => (
            <Chip label={row.parameterCount || 0} size="small" color="primary" variant="outlined" />
        )},
        { id: 'effectiveFrom', label: 'Eff. From', minWidth: 100, render: (row) => fmtDate(row.effectiveFrom) },
        { id: 'effectiveTo', label: 'Eff. To', minWidth: 100, render: (row) => fmtDate(row.effectiveTo) },
        { id: 'status', label: 'Status', minWidth: 90, align: 'center', render: (row) => (
            <BOSStatusChip status={row.statusName || (row.status === 1 ? 'ACTIVE' : 'INACTIVE')} />
        )}
    ], []);

    const actionColumn = useMemo(() => ({
        id: 'actions', label: 'Actions', align: 'center', minWidth: 100,
        render: (row) => (
            <BOSRowActions actions={[
                { label: 'Edit', icon: <IconEdit size={16} />, onClick: () => onEdit(row.id), color: 'primary', tooltip: 'Edit Specification' },
                { label: row.statusName === 'ACTIVE' ? 'Deactivate' : 'Activate',
                  icon: row.statusName === 'ACTIVE' ? <IconX size={16} /> : <IconCheck size={16} />,
                  onClick: () => handleStatusToggle(row.id),
                  color: row.statusName === 'ACTIVE' ? 'error' : 'success',
                  tooltip: row.statusName === 'ACTIVE' ? 'Deactivate' : 'Activate' }
            ]} />
        )
    }), [onEdit, page]);

    return (
        <MainCard
            title="Inspection Specification"
            icon={IconClipboardList}
            content={false}
            pageCode="M10200"
            secondary={
                <BOSTableToolbar
                    onRefresh={() => fetchData(page)}
                    onNew={onAdd}
                    newLabel="+ Add Specification"
                    exportData={data}
                    exportFilename="Inspection_Specifications"
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="inspection-spec-table"
                columns={columns}
                data={data}
                loading={loading}
                onFilter={onFilter}
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => onEdit(row.id)}
            />
        </MainCard>
    );
};

export default InspectionSpecificationList;
