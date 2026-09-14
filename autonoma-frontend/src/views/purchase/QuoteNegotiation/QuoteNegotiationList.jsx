import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useQuoteNegotiationStore from '../../../store/purchase/useQuoteNegotiationStore';
import useAuth from 'hooks/useAuth';
import { IconEdit, IconEye } from '@tabler/icons-react';
import { Tooltip, Typography, Stack, IconButton } from '@mui/material';
import { Insights, Handshake } from '@mui/icons-material';
import PurchaseRequestLifecycleTimeline from '../PurchaseRequest/PurchaseRequestLifecycleTimeline';
import { openSnackbar } from 'store/slices/snackbar';

export default function QuoteNegotiationList() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { negotiations, loading, fetchNegotiations } = useQuoteNegotiationStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [trackingPrId, setTrackingPrId] = useState(null);
    const [trackingPrNo, setTrackingPrNo] = useState('');

    const fetchRows = useCallback(() => {
        if (user?.divisionId) {
            fetchNegotiations(user.divisionId);
        }
    }, [user?.divisionId, fetchNegotiations]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    useEffect(() => {
        const config = [
            { id: 'negotiationNo', label: 'Negotiation No', type: 'text', isStarred: true },
            { id: 'rfqNo', label: 'RFQ No', type: 'text', isStarred: true },
            { id: 'quotationNo', label: 'Quotation No', type: 'text', isStarred: true },
            { id: 'supplierName', label: 'Supplier', type: 'text', isStarred: true },
            {
                id: 'statusName',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'OPEN', label: 'Open' },
                    { value: 'IN DISCUSSION', label: 'In Discussion' },
                    { value: 'AGREED', label: 'Agreed' },
                    { value: 'REJECTED', label: 'Rejected' },
                    { value: 'CLOSED', label: 'Closed' }
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
                const matches = row.negotiationNo?.toLowerCase().includes(q)
                    || row.rfqNo?.toLowerCase().includes(q)
                    || row.quotationNo?.toLowerCase().includes(q)
                    || row.supplierName?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            if (filters.negotiationNo && !row.negotiationNo?.toLowerCase().includes(filters.negotiationNo.toLowerCase())) return false;
            if (filters.rfqNo && !row.rfqNo?.toLowerCase().includes(filters.rfqNo.toLowerCase())) return false;
            if (filters.quotationNo && !row.quotationNo?.toLowerCase().includes(filters.quotationNo.toLowerCase())) return false;
            if (filters.supplierName && !row.supplierName?.toLowerCase().includes(filters.supplierName.toLowerCase())) return false;
            if (filters.statusName && filters.statusName !== 'ALL' && row.statusName !== filters.statusName) return false;
            return true;
        });
    }, [searchQuery]);

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 70 },
        { id: 'negotiationNo', label: 'Negotiation No', minWidth: 140 },
        { id: 'negotiationDate', label: 'Date', minWidth: 100 },
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

        {
            id: 'quotationNo',
            label: 'Quotation No',
            minWidth: 140,
            render: (row) => row.quotationId ? (
                <span
                    style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/purchase/quotation/entry/${row.quotationId}`, { state: { from: location.pathname } }); }}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    {row.quotationNo}
                </span>
            ) : row.quotationNo
        },
        { id: 'supplierName', label: 'Supplier', minWidth: 150 },
        {
            id: 'originalAmount',
            label: 'Original Amt',
            minWidth: 120,
            align: 'right',
            render: (row) => row.originalAmount?.toFixed(2)
        },
        {
            id: 'negotiatedAmount',
            label: 'Negotiated Amt',
            minWidth: 120,
            align: 'right',
            render: (row) => row.negotiatedAmount?.toFixed(2)
        },
        {
            id: 'savings',
            label: 'Savings',
            minWidth: 110,
            align: 'right',
            render: (row) => (
                <span style={{ color: row.savings > 0 ? '#4caf50' : 'inherit', fontWeight: row.savings > 0 ? 700 : 500 }}>
                    {row.savings?.toFixed(2)}
                </span>
            )
        },
        {
            id: 'negotiationRemarks',
            label: 'Remarks',
            minWidth: 150,
            render: (row) => (
                <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px'
                }} title={row.negotiationRemarks || ''}>
                    {row.negotiationRemarks || '-'}
                </div>
            )
        },
        {
            id: 'tracking',
            label: 'Tracking',
            minWidth: 150,
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
                else if (displayStatus === 'Draft' || displayStatus === 'OPEN') statusColor = '#0891b2'; // cyan-600

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
                                            message: 'No PR associated with this Negotiation.',
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
                const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'OPEN');
                const isClosed = ['PO Issued', 'Comparison Done', 'Closed'].includes(displayStatus);
                return <BOSStatusChip status={isClosed ? displayStatus : (row.statusName || 'OPEN')} />
            }
        }
    ], [navigate]);

    const actionColumn = useMemo(() => ({
        id: 'actions',
        label: 'Actions',
        align: 'center',
        minWidth: 100,
        render: (row) => {
            const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.statusName || 'OPEN');
            const isClosed = ['PO Issued', 'Comparison Done', 'Closed'].includes(displayStatus) || row.statusName === 'CLOSED' || row.statusName === 'AGREED';
            return (
                <BOSRowActions
                    actions={[
                        {
                            label: 'View',
                            icon: <IconEye size={16} />,
                            onClick: () => navigate(`/purchase/negotiation/entry/${row.id}?mode=view`),
                            color: 'info',
                            tooltip: 'View Negotiation'
                        },
                        {
                            label: 'Edit',
                            icon: <IconEdit size={16} />,
                            onClick: () => navigate(`/purchase/negotiation/entry/${row.id}`),
                            color: 'primary',
                            tooltip: isClosed ? 'Negotiation Closed' : 'Edit Negotiation',
                            disabled: isClosed
                        }
                    ]}
                />
            );
        }
    }), [navigate]);

    return (
        <MainCard
            pageCode="PU1115"
            icon={Handshake}
            content={false}
            title="Quote Negotiations"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchRows}
                    // No new button since negotiations are initiated from Quotation page
                    exportData={negotiations || []}
                    exportFilename="Quote_Negotiation_List"
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="quote-negotiation-list-table"
                columns={columns}
                data={negotiations || []}
                loading={loading}
                onFilter={onFilter}
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => navigate(`/purchase/negotiation/entry/${row.id}`)}
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
