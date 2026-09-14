import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useQuoteComparisonStore from '../../../store/purchase/useQuoteComparisonStore';
import useAuth from 'hooks/useAuth';
import { IconFileText } from '@tabler/icons-react';
import { ShoppingCart, Insights, Balance } from '@mui/icons-material';
import { Tooltip, Typography, Stack, IconButton } from '@mui/material';
import PurchaseRequestLifecycleTimeline from '../PurchaseRequest/PurchaseRequestLifecycleTimeline';
import { openSnackbar } from 'store/slices/snackbar';
import purchaseOrderService from 'api/purchaseOrderService';
import { bos } from 'ui-component/bos/BOSConfirmDialog';

export default function QuoteComparisonList() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { comparisons, loading, fetchComparisons } = useQuoteComparisonStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [trackingPrId, setTrackingPrId] = useState(null);
    const [trackingPrNo, setTrackingPrNo] = useState('');

    const fetchRows = useCallback(() => {
        if (user?.divisionId) {
            fetchComparisons(user.divisionId);
        }
    }, [user?.divisionId, fetchComparisons]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        const config = [
            { id: 'comparisonNo', label: 'Comparison No', type: 'text', isStarred: true },
            { id: 'rfqNo', label: 'RFQ No', type: 'text', isStarred: true },
            {
                id: 'statusName',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'COMPARED', label: 'Compared' },
                    { value: 'SUBMITTED', label: 'Submitted' },
                    { value: 'APPROVED', label: 'Approved' },
                    { value: 'LOCKED', label: 'Locked' }
                ],
                defaultValue: 'ALL',
                isStarred: true
            }
        ];
        dispatch(setFilterConfig(config));
        return () => { dispatch(setFilterConfig(null)); };
    }, [dispatch]);

    const onFilter = useCallback((rows, filters) => {
        return rows.filter((row) => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matches = row.comparisonNo?.toLowerCase().includes(q) 
                    || row.rfqNo?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            if (filters.comparisonNo && !row.comparisonNo?.toLowerCase().includes(filters.comparisonNo.toLowerCase())) return false;
            if (filters.rfqNo && !row.rfqNo?.toLowerCase().includes(filters.rfqNo.toLowerCase())) return false;
            if (filters.statusName && filters.statusName !== 'ALL' && row.statusName !== filters.statusName) return false;
            return true;
        });
    }, [searchQuery]);

    const handleCreatePoFromComparison = async (row) => {
        try {
            const res = await purchaseOrderService.previewFromSource({
                sourceType: 'QUOTATION_COMPARISON',
                sourceDocId: row.id,
                divisionId: user?.divisionId
            });
            navigate('/purchase/po/entry', { state: { previewData: res.data, sourceType: 'QUOTATION_COMPARISON' } });
        } catch (err) {
            bos.warning('Cannot Create PO', err?.response?.data?.message || err?.message || 'Failed to preview PO');
        }
    };

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 70 },
        { id: 'comparisonNo', label: 'Comparison No', minWidth: 140 },
        { id: 'version', label: 'Version', minWidth: 80 },
        { id: 'comparisonDate', label: 'Date', minWidth: 100 },
        { 
            id: 'rfqNo', 
            label: 'RFQ No', 
            minWidth: 130,
            render: (row) => row.rfqId ? (
                <span 
                    style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'none', fontWeight: 500 }} 
                    onClick={(e) => { e.stopPropagation(); navigate(`/purchase/rfq/entry/${row.rfqId}`, { state: { from: location.pathname } }); }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    {row.rfqNo}
                </span>
            ) : row.rfqNo
        },
        {
            id: 'prNo',
            label: 'PR Ref.',
            minWidth: 130,
            render: (row) => row.prId ? (
                <span
                    style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/purchase/pr/entry/${row.prId}`, { state: { from: location.pathname } }); }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    {row.prNo}
                </span>
            ) : (row.prNo || '-')
        },
        { id: 'selectionType', label: 'Award Type', minWidth: 100 },
        { 
            id: 'awardedSuppliers', 
            label: 'Awarded Supplier(s)', 
            minWidth: 150,
            render: (row) => row.awardedSuppliers || '-'
        },
        { 
            id: 'trackCycle', 
            label: 'Track Cycle', 
            minWidth: 150,
            align: 'center',
            render: (row) => {
                const displayStatus = row.trackCycle || '-';
                let statusColor = 'text.secondary';
                if (displayStatus === 'PO Generated') statusColor = '#059669'; // emerald-600
                else if (displayStatus === 'Pending PO') statusColor = '#db2777'; // pink-600
                else if (displayStatus === 'Locked for Approval') statusColor = '#7c3aed'; // violet-600
                else if (displayStatus === 'Draft Stage') statusColor = '#0891b2'; // cyan-600
                else if (displayStatus === 'In Progress') statusColor = '#d97706'; // amber-600
                
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor }}>
                            {displayStatus}
                        </Typography>
                        <Tooltip title="View Lifecycle">
                            <IconButton 
                                color="secondary" 
                                size="small" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (row.prId) {
                                        setTrackingPrId(row.prId);
                                        setTrackingPrNo(row.prNo || 'N/A');
                                    } else {
                                        dispatch(openSnackbar({
                                            open: true,
                                            message: 'No PR associated with this Comparison.',
                                            variant: 'alert',
                                            alert: { color: 'warning' },
                                            close: true
                                        }));
                                    }
                                }}
                            >
                                <Insights fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        },
        { 
            id: 'poNumbers', 
            label: 'PO No(s)', 
            minWidth: 120,
            render: (row) => row.poNumbers || '-'
        },
        { 
            id: 'statusName', 
            label: 'Status', 
            minWidth: 120,
            render: (row) => <BOSStatusChip status={row.statusName} />
        },
    ], [navigate]);

    const actionColumn = useMemo(() => ({
        id: 'actions',
        label: 'Actions',
        align: 'center',
        minWidth: 120,
        render: (row) => {
            const hasPo = row.poNumbers && row.poNumbers !== '-';
            return (
                <BOSRowActions
                    actions={[
                        {
                            label: 'View PO',
                            icon: <ShoppingCart fontSize="small" />,
                            onClick: () => navigate('/purchase/po'),
                            color: 'primary',
                            tooltip: `View Purchase Order (${row.poNumbers})`,
                            hidden: !hasPo
                        },
                        {
                            label: 'Create PO',
                            icon: <IconFileText size={16} />,
                            onClick: () => handleCreatePoFromComparison(row),
                            color: 'success',
                            tooltip: 'Generate Purchase Order',
                            hidden: hasPo
                        }
                    ]}
                />
            );
        }
    }), [navigate, user?.divisionId]);

    return (
        <MainCard
            pageCode="PU1120"
            icon={Balance}
            content={false}
            title="Quotation Comparison"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchRows}
                    onNew={() => navigate('/purchase/comparison/entry')}
                    newLabel="+ New Comparison"
                    exportData={comparisons || []}
                    exportFilename="Quote_Comparison_List"
                    columns={columns}
                />
            }
        >
            <BOSDataTable 
                id="quote-comparison-list-table"
                data={comparisons || []} 
                columns={columns} 
                loading={loading} 
                onFilter={onFilter} 
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => navigate(`/purchase/comparison/entry/${row.id}`)}
                defaultSortId="comparisonDate"
                defaultSortOrder="desc"
            />
            <PurchaseRequestLifecycleTimeline
                prId={trackingPrId}
                prNo={trackingPrNo}
                open={Boolean(trackingPrId)}
                onClose={() => { setTrackingPrId(null); setTrackingPrNo(''); }}
            />
        </MainCard>
    );
}
