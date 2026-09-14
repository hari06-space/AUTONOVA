import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import {
    BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import usePurchaseOrderStore from 'store/usePurchaseOrderStore';
import useAuth from 'hooks/useAuth';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { ShoppingCart, Cancel } from '@mui/icons-material';
import { Chip, Typography, Tooltip } from '@mui/material';
import { bos, bosConfirm } from 'ui-component/bos/BOSConfirmDialog';
import PurchaseOrderSourceDialog from './PurchaseOrderSourceDialog';
import PurchaseRequestLifecycleTimeline from '../PurchaseRequest/PurchaseRequestLifecycleTimeline';
import { Stack, IconButton } from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
const SOURCE_COLORS = {
    DIRECT: 'default',
    PURCHASE_REQUEST: 'warning',
    RFQ: 'secondary',
    SUPPLIER_QUOTATION: 'info',
    NEGOTIATION: 'success',
    QUOTATION_COMPARISON: 'error',
};

export default function PurchaseOrderList() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { pos, loading, fetchAllPos, cancelPo, deletePo } = usePurchaseOrderStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [wizardOpen, setWizardOpen] = useState(false);
    
    // Tracking state
    const [trackingPrId, setTrackingPrId] = useState(null);
    const [trackingPrNo, setTrackingPrNo] = useState(null);

    const fetchRows = useCallback(() => {
        if (user?.divisionId) fetchAllPos(user.divisionId);
    }, [user?.divisionId, fetchAllPos]);

    useEffect(() => { fetchRows(); }, [fetchRows]);

    const handleDelete = async (row) => {
        const confirmed = await bosConfirm({
            title: 'Delete Purchase Order?',
            message: `Are you sure you want to delete PO ${row.poNo}?`,
            type: 'warning',
            confirmText: 'Yes, Delete PO'
        });
        if (confirmed) {
            try {
                await deletePo(row.id);
                bos.success('Deleted!', 'Purchase Order has been deleted.');
                fetchRows();
            } catch (e) {
                bos.error('Error!', e?.message || 'Failed to delete PO');
            }
        }
    };

    useEffect(() => {
        const config = [
            { id: 'poNo', label: 'PO No', type: 'text', isStarred: true },
            { id: 'supplierName', label: 'Supplier', type: 'text', isStarred: true },
            {
                id: 'statusName', label: 'Status', type: 'select', isStarred: true,
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'SUBMITTED', label: 'Submitted' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'RELEASED', label: 'Released' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                ],
                defaultValue: 'ALL'
            },
            { id: 'sourceType', label: 'Source', type: 'text', isStarred: false }
        ];
        dispatch(setFilterConfig(config));
        return () => dispatch(setFilterConfig(null));
    }, [dispatch]);

    const onFilter = useCallback((rows, filters) => {
        return rows.filter(row => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!(row.poNo?.toLowerCase().includes(q) || row.supplierName?.toLowerCase().includes(q))) return false;
            }
            if (filters.poNo && !row.poNo?.toLowerCase().includes(filters.poNo.toLowerCase())) return false;
            if (filters.supplierName && !row.supplierName?.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
            if (filters.statusName && filters.statusName !== 'ALL' && row.statusName !== filters.statusName) return false;
            if (filters.sourceType && !row.sourceType?.toLowerCase().includes(filters.sourceType.toLowerCase())) return false;
            return true;
        });
    }, [searchQuery]);

    const handleCancel = async (row) => {
        const confirmed = await bosConfirm({
            title: 'Cancel Purchase Order?',
            message: `Are you sure you want to cancel PO ${row.poNo}?`,
            type: 'danger',
            confirmText: 'Yes, Cancel PO'
        });
        if (confirmed) {
            try {
                await cancelPo(row.id, 'Cancelled by user');
                bos.success('Cancelled!', 'Purchase Order has been cancelled.');
                fetchRows();
            } catch (e) {
                bos.error('Error!', e?.message || 'Failed to cancel PO');
            }
        }
    };

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 60 },
        { id: 'poNo', label: 'PO No', minWidth: 130 },
        { id: 'poDate', label: 'Date', minWidth: 100 },
        { id: 'prNo', label: 'PR Ref.', minWidth: 130, render: (row) => (
            row.prId ? (
                <Tooltip title="Click to open PR">
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/purchase/pr/entry/${row.prId}`, { state: { from: location.pathname } }); }}
                    >
                        {row.prNo}
                    </Typography>
                </Tooltip>
            ) : <Typography variant="body2" color="text.secondary">-</Typography>
        ) },
        { id: 'rfqNo', label: 'RFQ Ref.', minWidth: 130, render: (row) => (
            row.rfqId ? (
                <Tooltip title="Click to open RFQ">
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/purchase/rfq/entry/${row.rfqId}`, { state: { from: location.pathname } }); }}
                    >
                        {row.rfqNo}
                    </Typography>
                </Tooltip>
            ) : <Typography variant="body2" color="text.secondary">-</Typography>
        ) },
        { id: 'sourceRef', label: 'Source Ref.', minWidth: 150, render: (row) => {
            if (row.sourceType === 'QUOTATION_COMPARISON' && row.comparisonId) {
                return (
                    <Tooltip title="Click to open Comparison">
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/purchase/comparison/entry/${row.comparisonId}`, { state: { from: location.pathname } }); }}>
                            {row.comparisonNo}
                        </Typography>
                    </Tooltip>
                );
            } else if (row.sourceType === 'SUPPLIER_QUOTATION' && row.quoteId) {
                return (
                    <Tooltip title="Click to open Quotation">
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/purchase/quotation/entry/${row.quoteId}`, { state: { from: location.pathname } }); }}>
                            {row.quoteNo}
                        </Typography>
                    </Tooltip>
                );
            } else if (row.sourceType === 'PURCHASE_REQUEST' && row.prId) {
                return (
                    <Tooltip title="Click to open PR">
                        <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/purchase/pr/entry/${row.prId}`, { state: { from: location.pathname } }); }}>
                            {row.prNo}
                        </Typography>
                    </Tooltip>
                );
            }
            return <Typography variant="body2" color="text.secondary">-</Typography>;
        }},
        { id: 'supplierName', label: 'Supplier', minWidth: 180 },
        {
            id: 'sourceType', label: 'Source Type', minWidth: 140,
            render: (row) => (
                <Chip
                    label={row.sourceType?.replace(/_/g, ' ') || 'DIRECT'}
                    size="small"
                    color={SOURCE_COLORS[row.sourceType] || 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
            )
        },
        { id: 'currency', label: 'Currency', minWidth: 80 },
        {
            id: 'grandTotal', label: 'Grand Total', minWidth: 130, align: 'right',
            format: (val) => val != null ? `₹ ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''
        },
        {
            id: 'statusName', label: 'Status', minWidth: 120,
            render: (row) => <BOSStatusChip status={row.statusName || 'DRAFT'} />
        },
        {
            id: 'tracking',
            label: 'PO Tracking',
            minWidth: 200,
            align: 'center',
            render: (row) => {
                const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'Draft');
                
                let statusColor = 'text.secondary';
                if (displayStatus === 'Received') statusColor = '#059669'; // emerald-600
                else if (displayStatus === 'PO Issued') statusColor = '#059669'; // emerald-600
                else if (displayStatus === 'Closed') statusColor = '#d97706'; // amber-600
                else if (displayStatus === 'Draft') statusColor = '#0891b2'; // cyan-600
                
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor }}>
                            {displayStatus}
                        </Typography>
                        <Tooltip title={row.prId ? "View Lifecycle" : "No PR Reference available"}>
                            <span>
                                <IconButton 
                                    color="secondary" 
                                    size="small" 
                                    disabled={!row.prId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (row.prId) {
                                            setTrackingPrId(row.prId);
                                            setTrackingPrNo(row.prNo || 'N/A');
                                        }
                                    }}
                                    sx={{ 
                                        bgcolor: row.prId ? 'secondary.light' : 'action.disabledBackground', 
                                        color: row.prId ? 'secondary.main' : 'action.disabled',
                                        '&:hover': { bgcolor: row.prId ? 'secondary.main' : '', color: row.prId ? '#fff' : '' }
                                    }}
                                >
                                    <TrackChangesIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                );
            }
        },
    ], [navigate]);

    const actionColumn = useMemo(() => ({
        id: 'actions', label: 'Actions', align: 'center', minWidth: 120,
        render: (row) => (
            <BOSRowActions actions={[
                {
                    label: 'View / Edit',
                    icon: <IconEdit size={16} />,
                    onClick: () => navigate(`/purchase/po/entry/${row.id}`),
                    color: 'primary',
                    tooltip: 'View / Edit Purchase Order'
                },
                {
                    label: 'Delete PO',
                    icon: <IconTrash size={16} />,
                    onClick: () => handleDelete(row),
                    color: 'error',
                    tooltip: 'Delete Purchase Order',
                    hidden: row.statusName !== 'DRAFT'
                },
                {
                    label: 'Cancel PO',
                    icon: <Cancel fontSize="small" />,
                    onClick: () => handleCancel(row),
                    color: 'error',
                    tooltip: 'Cancel Purchase Order',
                    hidden: row.statusName === 'CANCELLED' || row.statusName === 'FULLY RECEIVED' || row.statusName === 'DRAFT'
                }
            ]} />
        )
    }), [navigate]);

    return (
        <>
            <MainCard
                pageCode="PU1140"
                icon={ShoppingCart}
                content={false}
                title="Purchase Orders"
                secondary={
                    <BOSTableToolbar
                        onRefresh={fetchRows}
                        onNew={() => setWizardOpen(true)}
                        newLabel="+ Create PO"
                        exportData={pos || []}
                        exportFilename="Purchase_Orders"
                        columns={columns}
                    />
                }
            >
                <BOSDataTable
                    id="purchase-order-list-table"
                    columns={columns}
                    data={pos || []}
                    loading={loading}
                    onFilter={onFilter}
                    actionColumn={actionColumn}
                    onDoubleClickRow={(row) => navigate(`/purchase/po/entry/${row.id}`)}
                />
            </MainCard>
            <PurchaseOrderSourceDialog open={wizardOpen} onClose={() => setWizardOpen(false)} />
            <PurchaseRequestLifecycleTimeline 
                open={!!trackingPrId} 
                onClose={() => { setTrackingPrId(null); setTrackingPrNo(null); }} 
                prId={trackingPrId} 
                prNo={trackingPrNo} 
            />
        </>
    );
}
