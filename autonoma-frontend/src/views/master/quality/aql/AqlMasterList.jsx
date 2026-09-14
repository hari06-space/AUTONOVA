import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { IconChecks } from '@tabler/icons-react';
import { gridSpacing } from 'store/constant';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { setFilterConfig } from 'store/slices/search';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';

const AqlMasterList = ({ onAdd, onEdit }) => {
    const dispatch = useDispatch();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/qmc/aql', {
                params: {
                    page: 0,
                    size: 1000
                }
            });
            setData(response.data.content || []);
        } catch (error) {
            console.error('Error fetching AQL Masters:', error);
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to fetch AQL Master records.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: true
                })
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const config = [
            { id: 'aqlCode', label: 'AQL Code', type: 'text', isStarred: true },
            { id: 'aqlName', label: 'AQL Name', type: 'text', isStarred: true }
        ];
        dispatch(setFilterConfig(config));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    const onFilter = useCallback((rows, filters) => {
        return rows.filter(row => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!(row.aqlCode?.toLowerCase().includes(q) || row.aqlName?.toLowerCase().includes(q))) return false;
            }
            if (filters.aqlCode && !row.aqlCode?.toLowerCase().includes(filters.aqlCode.toLowerCase())) return false;
            if (filters.aqlName && !row.aqlName?.toLowerCase().includes(filters.aqlName.toLowerCase())) return false;
            return true;
        });
    }, [searchQuery]);

    const handleStatusToggle = async (id) => {
        try {
            await axios.patch(`/api/qmc/aql/${id}/status`);
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Status updated successfully.',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: true
                })
            );
            fetchData();
        } catch (error) {
            console.error('Error toggling status:', error);
            dispatch(
                openSnackbar({
                    open: true,
                    message: 'Failed to update status.',
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: true
                })
            );
        }
    };

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 60 },
        { id: 'aqlCode', label: 'AQL Code', minWidth: 100 },
        { id: 'aqlName', label: 'AQL Name', minWidth: 150 },
        {
            id: 'itemGroups',
            label: 'Item Groups',
            minWidth: 160,
            render: (row) => (row.itemGroups && row.itemGroups.length > 0 ? row.itemGroups.join(', ') : '-')
        },
        { id: 'inspectionLevel', label: 'Inspection Level', minWidth: 120 },
        { id: 'inspectionType', label: 'Inspection Type', minWidth: 120 },
        { id: 'aqlValue', label: 'AQL Value', minWidth: 100, align: 'right' },
        {
            id: 'ruleCount',
            label: 'Rule Count',
            minWidth: 100,
            align: 'center',
            render: (row) => row.samplingRules ? row.samplingRules.length : 0
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            align: 'center',
            render: (row) => <BOSStatusChip status={row.status === 1 ? 'ACTIVE' : 'INACTIVE'} />
        }
    ], []);

    const actionColumn = useMemo(() => ({
        id: 'actions', label: 'Actions', align: 'center', minWidth: 120,
        render: (row) => (
            <BOSRowActions actions={[
                {
                    label: 'Edit',
                    icon: <IconEdit size={16} />,
                    onClick: () => onEdit(row.id),
                    color: 'primary',
                    tooltip: 'Edit AQL Master'
                },
                {
                    label: row.status === 1 ? 'Deactivate' : 'Activate',
                    icon: row.status === 1 ? <IconX size={16} /> : <IconCheck size={16} />,
                    onClick: () => handleStatusToggle(row.id),
                    color: row.status === 1 ? 'error' : 'success',
                    tooltip: row.status === 1 ? 'Deactivate' : 'Activate'
                }
            ]} />
        )
    }), [onEdit]);

    return (
        <MainCard
            title="AQL/Sampling Plan"
            icon={IconChecks}
            content={false}
            pageCode="M10100"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchData}
                    onNew={onAdd}
                    newLabel="+ Add AQL"
                    exportData={data}
                    exportFilename="AQL_Master"
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="aql-master-table"
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

export default AqlMasterList;
