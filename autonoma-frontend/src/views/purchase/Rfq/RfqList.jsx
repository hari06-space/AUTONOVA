import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import { BOSDataTable, BOSTableToolbar, BOSRowActions, BOSStatusChip } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import useRfqStore from 'store/useRfqStore';
import useAuth from 'hooks/useAuth';
import { IconTrash, IconFileInvoice, IconPrinter } from '@tabler/icons-react';
import { openSnackbar } from 'store/slices/snackbar';
import { Stack, Typography, Tooltip, IconButton, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Insights, MailOutline } from '@mui/icons-material';
import PurchaseRequestLifecycleTimeline from '../PurchaseRequest/PurchaseRequestLifecycleTimeline';

export default function RfqList() {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { rfqs, loading, fetchRfqs, deleteRfq } = useRfqStore();
    const searchQuery = useSelector((state) => state.search?.rawQuery || '');
    const [trackingPrId, setTrackingPrId] = useState(null);
    const [trackingPrNo, setTrackingPrNo] = useState(null);

    const fetchRows = useCallback(() => {
        if (user?.divisionId) {
            fetchRfqs(user.divisionId);
        }
    }, [user?.divisionId, fetchRfqs]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const handleDelete = async (row) => {
        if (window.confirm("Are you sure you want to delete this RFQ? You won't be able to revert this!")) {
            try {
                await deleteRfq(row.id);
                dispatch(openSnackbar({
                    open: true,
                    message: 'RFQ has been deleted successfully.',
                    variant: 'alert',
                    alert: { color: 'success' },
                    close: true
                }));
            } catch (error) {
                let errorMsg = error?.response?.data?.message || error.message || 'Failed to delete RFQ';
                dispatch(openSnackbar({
                    open: true,
                    message: errorMsg,
                    variant: 'alert',
                    alert: { color: 'error' },
                    close: true
                }));
            }
        }
    };

    useEffect(() => {
        const config = [
            { id: 'rfqNo', label: 'RFQ No', type: 'text', isStarred: true },
            { id: 'departmentName', label: 'Department', type: 'text', isStarred: true },
            { id: 'buyerName', label: 'Buyer', type: 'text', isStarred: true },
            {
                id: 'statusName',
                label: 'Status',
                type: 'select',
                options: [
                    { value: 'ALL', label: 'ALL' },
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Sent', label: 'Sent' },
                    { value: 'Received', label: 'Received' },
                    { value: 'Awarded', label: 'Awarded' },
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
                const matches = row.rfqNo?.toLowerCase().includes(q) || row.departmentName?.toLowerCase().includes(q) || row.buyerName?.toLowerCase().includes(q);
                if (!matches) return false;
            }
            if (filters.rfqNo && !row.rfqNo?.toLowerCase().includes(filters.rfqNo.toLowerCase())) return false;
            if (filters.departmentName && !row.departmentName?.toLowerCase().includes(filters.departmentName.toLowerCase())) return false;
            if (filters.buyerName && !row.buyerName?.toLowerCase().includes(filters.buyerName.toLowerCase())) return false;
            if (filters.statusName && filters.statusName !== 'ALL' && row.statusName !== filters.statusName) return false;
            return true;
        });
    }, [searchQuery]);

    const columns = useMemo(() => [
        { id: 'index', label: 'Sl.No', minWidth: 70 },
        { id: 'rfqNo', label: 'RFQ No', minWidth: 130 },
        { id: 'rfqDate', label: 'Date', minWidth: 100 },
        { 
            id: 'prNo', 
            label: 'PR Ref.', 
            minWidth: 120,
            render: (row) => row.prNo ? (
                <span 
                    style={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'none', fontWeight: 500 }} 
                    onClick={() => navigate(`/purchase/pr/entry/${row.prId}`, { state: { from: location.pathname } })}
                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                    {row.prNo}
                </span>
            ) : '-'
        },
        { id: 'departmentName', label: 'Department', minWidth: 140 },
        { id: 'buyerName', label: 'Buyer', minWidth: 140 },
        { id: 'closingDate', label: 'Closing Date', minWidth: 110 },
        {
            id: 'tracking',
            label: 'RFQ Tracking',
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
                
                let statusText = displayStatus;
                if (row.invitedSuppliersCount > 0 && displayStatus !== 'Draft') {
                    statusText += ` ${row.receivedQuotationsCount || 0}/${row.invitedSuppliersCount}`;
                }
                
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: statusColor }}>
                            {statusText}
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
                                            message: 'No PR associated with this RFQ.',
                                            variant: 'alert',
                                            alert: { color: 'warning' },
                                            close: true
                                        }));
                                    }
                                }}
                                sx={{ 
                                    bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                                    '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) } 
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
            render: (row) => <BOSStatusChip status={row.statusName || 'Draft'} />
        }
    ], []);

    const actionColumn = useMemo(() => ({
        id: 'actions',
        label: 'Actions',
        align: 'center',
        minWidth: 100,
        render: (row) => (
            <BOSRowActions
                actions={[
                    {
                        label: 'Create Quotation',
                        icon: <IconFileInvoice size={16} />,
                        onClick: () => navigate('/purchase/quotation/entry', { state: { fromRfqId: row.id } }),
                        color: 'success',
                        tooltip: 'Create Quotation for RFQ',
                        hidden: row.statusName === 'Draft' || row.allQuotationsReceived // Hide if draft or all quotations received
                    },
                    {
                        label: 'Print',
                        icon: <IconPrinter size={16} />,
                        onClick: () => navigate(`/purchase/rfq/print/${row.id}`),
                        color: 'secondary',
                        tooltip: 'Print RFQ'
                    },
                    {
                        label: 'Delete',
                        icon: <IconTrash size={16} />,
                        onClick: () => handleDelete(row),
                        color: 'error',
                        tooltip: 'Delete RFQ',
                        hidden: row.statusName !== 'Draft'
                    }
                ]}
            />
        )
    }), [navigate]);

    return (
        <MainCard
            pageCode="PU1105"
            icon={MailOutline}
            content={false}
            title="Request For Quotation (RFQ)"
            secondary={
                <BOSTableToolbar
                    onRefresh={fetchRows}
                    onNew={() => navigate('/purchase/rfq/entry')}
                    newLabel="+ Create RFQ"
                    exportData={rfqs || []}
                    exportFilename="RFQ_List"
                    columns={columns}
                />
            }
        >
            <BOSDataTable
                id="rfq-list-table"
                columns={columns}
                data={rfqs || []}
                loading={loading}
                onFilter={onFilter}
                actionColumn={actionColumn}
                onDoubleClickRow={(row) => navigate(`/purchase/rfq/entry/${row.id}`)}
            />
            <PurchaseRequestLifecycleTimeline 
                open={Boolean(trackingPrId)} 
                onClose={() => setTrackingPrId(null)} 
                prId={trackingPrId} 
                prNo={trackingPrNo} 
            />
        </MainCard>
    );
}
