import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip, Box, Typography, Chip } from '@mui/material';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSStatusChip, btnNew } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { API_PATHS } from 'utils/api-constants';

const CountBadge = ({ count, activeBg = '#e0f2fe', activeColor = '#0284c7', borderColor = '#7dd3fc' }) => {
    const num = Number(count) || 0;
    if (num > 0) {
        return (
            <Chip
                label={num}
                size="small"
                sx={{
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 22,
                    minWidth: 32,
                    bgcolor: activeBg,
                    color: activeColor,
                    borderRadius: '12px',
                    border: `1px solid ${borderColor}`,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
            />
        );
    }
    return (
        <Chip
            label="0"
            size="small"
            sx={{
                fontWeight: 700,
                fontSize: '0.72rem',
                height: 22,
                minWidth: 32,
                bgcolor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '12px',
                border: '1px solid #fca5a5',
                boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)'
            }}
        />
    );
};

export default function BOMList() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_PATHS.NPD.BOM_MASTER);
            setData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch BOM list:', error);
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch BOMs', variant: 'alert', severity: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_PATHS.NPD.BOM_MASTER}/${deleteId}`);
            dispatch(openSnackbar({ open: true, message: 'BOM deleted successfully', variant: 'alert', severity: 'success' }));
            fetchData();
        } catch (error) {
            console.error('Failed to delete BOM:', error);
            dispatch(openSnackbar({ open: true, message: 'Failed to delete BOM', variant: 'alert', severity: 'error' }));
        } finally {
            setDeleteId(null);
        }
    };

    const columns = [
        { id: 'id', label: 'ID', sortable: true },
        { id: 'product.itemNo', label: 'Parent Product No', sortable: true, format: (val, row) => row?.product?.itemNo || row?.productItemNo || val || '-' },
        { id: 'product.itemName', label: 'Parent Product Name', sortable: true, format: (val, row) => row?.product?.itemName || row?.productItemName || val || '-' },
        { id: 'bomNo', label: 'BOM No', sortable: true },
        { id: 'revNo', label: 'Revision', sortable: true },
        {
            id: 'processCount',
            label: 'Process',
            sortable: false,
            render: (row) => (
                <CountBadge
                    count={row?.processCount ?? (row?.processes?.length || 0)}
                    activeBg="#e0f2fe"
                    activeColor="#0284c7"
                    borderColor="#7dd3fc"
                />
            )
        },
        {
            id: 'materialCount',
            label: 'Materials',
            sortable: false,
            render: (row) => (
                <CountBadge
                    count={row?.materialCount ?? (row?.processes ? row.processes.reduce((acc, p) => acc + (p?.materials?.length || 0), 0) : 0)}
                    activeBg="#dcfce7"
                    activeColor="#16a34a"
                    borderColor="#86efac"
                />
            )
        },
        {
            id: 'machineCount',
            label: 'Machines',
            sortable: false,
            render: (row) => (
                <CountBadge
                    count={row?.machineCount ?? (row?.processes ? row.processes.reduce((acc, p) => acc + (p?.machines?.length || 0), 0) : 0)}
                    activeBg="#f3e8ff"
                    activeColor="#9333ea"
                    borderColor="#d8b4fe"
                />
            )
        },
        {
            id: 'toolCount',
            label: 'Tools',
            sortable: false,
            render: (row) => (
                <CountBadge
                    count={row?.toolCount ?? (row?.processes ? row.processes.reduce((acc, p) => acc + (p?.tools?.length || 0), 0) : 0)}
                    activeBg="#ffedd5"
                    activeColor="#ea580c"
                    borderColor="#fed7aa"
                />
            )
        },
        { id: 'revDate', label: 'Revision Date', sortable: true, format: (val, row) => (val || row?.revDate) ? new Date(val || row.revDate).toLocaleDateString() : '-' },
        { id: 'isActive', label: 'Status', sortable: true, render: (row) => <BOSStatusChip status={row?.isActive ? 'Active' : 'Inactive'} /> }
    ];

    return (
        <MainCard
            pageCode="DD1110"
            title="Product BOM Master"
            secondary={
                <Tooltip title="Create New BOM">
                    <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/dd/product-bom/add')} sx={btnNew}>
                        Add
                    </Button>
                </Tooltip>
            }
        >
            <BOSDataTable
                columns={columns}
                data={data}
                loading={loading}
                onDoubleClickRow={(row) => navigate(`/dd/product-bom/edit/${row.id}`)}
            />
            <ConfirmDeleteDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete BOM"
                content="Are you sure you want to delete this BOM? This action cannot be undone."
            />
        </MainCard>
    );
}
