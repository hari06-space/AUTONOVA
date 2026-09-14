import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useQuotationStore from 'store/useQuotationStore';
import { IconEdit, IconMessage2 } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';
import { Tooltip, Typography, Stack, IconButton } from '@mui/material';
import { Insights, ReceiptLong } from '@mui/icons-material';
import PurchaseRequestLifecycleTimeline from '../PurchaseRequest/PurchaseRequestLifecycleTimeline';
import { openSnackbar } from 'store/slices/snackbar';

export default function QuotationList() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { quotations, loading, fetchQuotations } = useQuotationStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    
    const [trackingPrId, setTrackingPrId] = useState(null);
    const [trackingPrNo, setTrackingPrNo] = useState(null);

    const fetchRows = useCallback(() => {
        if (typeof fetchQuotations === 'function' && user?.divisionId) {
            fetchQuotations(user.divisionId);
        }
    }, [fetchQuotations, user?.divisionId]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        const config = [
            { id: 'quotationNo', label: 'Quotation No', type: 'text', isStarred: true },
            { id: 'rfqNo', label: 'RFQ Ref.', type: 'text', isStarred: true },
            { id: 'supplierName', label: 'Supplier', type: 'text', isStarred: true },
            {
                id: 'technicalStatusName',
                label: 'Technical Status',
                type: 'select',
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Rejected', label: 'Rejected' }
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
                const matches = row.quotationNo?.toLowerCase().includes(q) || row.rfqNo?.toLowerCase().includes(q) || row.supplierName?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            if (filters.quotationNo && !row.quotationNo?.toLowerCase().includes(filters.quotationNo.toLowerCase())) return false;
            if (filters.rfqNo && !row.rfqNo?.toLowerCase().includes(filters.rfqNo.toLowerCase())) return false;
            if (filters.supplierName && !row.supplierName?.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
            if (filters.technicalStatusName && filters.technicalStatusName !== 'ALL' && row.technicalStatusName !== filters.technicalStatusName) return false;
            return true;
        });
    }, [searchQuery]);

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 70 },
        { id: 'quotationNo', label: 'Quotation No', minWidth: 140 },
        { id: 'quotationDate', label: 'Date', minWidth: 100 },
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
        ) },
        { id: 'supplierName', label: 'Supplier', minWidth: 160 },
        {
            id: 'technicalStatusName',
            label: 'Technical Status',
            minWidth: 130,
            render: (row) => <BOSStatusChip status={row.technicalStatusName || 'Pending'} />
        },
        {
            id: 'tracking',
            label: 'Quotation Tracking',
            minWidth: 200,
            align: 'center',
            render: (row) => {
                const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'Draft');
                
                let statusColor = 'text.secondary';
                if (displayStatus === 'PO Issued') statusColor = '#059669'; // emerald-600
                else if (displayStatus === 'Comparison Done') statusColor = '#db2777'; // pink-600
                else if (displayStatus === 'Under Negotiation') statusColor = '#7c3aed'; // violet-600
                else if (displayStatus === 'Closed' || displayStatus === 'Quotations Received') statusColor = '#d97706'; // amber-600
                else if (displayStatus === 'RFQ Issued' || displayStatus === 'Sent') statusColor = '#2563eb'; // blue-600
                else if (displayStatus === 'Ready for RFQ') statusColor = '#0891b2'; // cyan-600
                else if (displayStatus === 'Draft') statusColor = '#0891b2'; // cyan-600
                
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
                                            message: 'No PR associated with this Quotation.',
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
            id: 'statusName',
            label: 'Status',
            minWidth: 120,
            render: (row) => {
                const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'Draft');
                const isClosed = ['PO Issued', 'Comparison Done', 'Closed'].includes(displayStatus);
                return <BOSStatusChip status={isClosed ? displayStatus : (row.statusName || 'Draft')} />
            }
        }
    ], [dispatch]);

    const actionColumn = useMemo(() => ({
        id: 'actions',
        label: 'Actions',
        align: 'center',
        minWidth: 100,
        render: (row) => {
            const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'Draft');
            const isClosed = ['PO Issued', 'Comparison Done', 'Closed'].includes(displayStatus);
            return (
                <BOSRowActions
                    actions={[
                        {
                            label: 'Negotiate',
                            icon: <IconMessage2 size={16} />,
                            onClick: () => navigate(`/purchase/negotiation/entry?quotationId=${row.id}`),
                            color: 'secondary',
                            tooltip: isClosed ? 'Quotation Closed' : 'Negotiate Quote',
                            disabled: isClosed
                        }
                    ]}
                />
            );
        }
    }), [navigate]);

    return (
        <MainCard
            pageCode="PU1110"
            icon={ReceiptLong}
            content={false}
            title="Supplier Quotations"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchRows}
                    exportData={quotations || []}
                    exportFilename="Supplier_Quotations"
                    columns={columns}
                    onNew={() => navigate('/purchase/quotation/entry')}
                />
            }
        >
            <BOSDataTable
                id="quotation-list-table"
                columns={columns}
                data={quotations || []}
                loading={loading}
                onFilter={onFilter}
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => navigate(`/purchase/quotation/entry/${row.id}`)}
            />
            {trackingPrId && (
                <PurchaseRequestLifecycleTimeline 
                    open={Boolean(trackingPrId)} 
                    onClose={() => setTrackingPrId(null)} 
                    prId={trackingPrId} 
                    prNo={trackingPrNo} 
                />
            )}
        </MainCard>
    );
}
