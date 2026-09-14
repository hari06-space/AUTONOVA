import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions from 'hooks/usePagePermissions';
import {
  BOSDataTable,
  BOSTableToolbar,
  BOSRowActions,
  BOSStatusChip
} from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import usePurchaseRequestStore from '../../../store/usePurchaseRequestStore';
import { IconEdit, IconPrinter, IconTrash } from '@tabler/icons-react';
import { bos, bosConfirm } from 'ui-component/bos/BOSConfirmDialog';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import { RequestQuote, Insights, ShoppingCart } from '@mui/icons-material';
import { Button, Tooltip, Stack, Typography, IconButton, useTheme, Box, Paper, Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PurchaseRequestLifecycleTimeline from './PurchaseRequestLifecycleTimeline';
import PageUserManual from 'ui-component/bos/PageUserManual';
import { getPrStampText } from './purchaseRequestStatus';

export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [printRowId, setPrintRowId] = useState(null);
  const [trackingPrId, setTrackingPrId] = useState(null);
  const [trackingPrNo, setTrackingPrNo] = useState(null);
  
  // Use a generic page permission code or a specific one if provided
  const perms = usePagePermissions('PP0000'); // Or whatever the valid page code is
  
  const { list, loading, searchPurchaseRequests, currentPR, getById, deletePurchaseRequest } = usePurchaseRequestStore();
  
  // Redux search & filters state
  const globalFilters = useSelector((state) => state.search?.filters) || {};
  const searchQuery = useSelector((state) => state.search?.rawQuery || '');

  const fetchRows = useCallback(() => {
    // You could pass global filters to backend if it's server-side filtered,
    // but typically BOS search is combined with local filtering for small datasets,
    // or passed to backend. We'll fetch all and filter locally for now.
    searchPurchaseRequests({});
  }, [searchPurchaseRequests]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    const config = [
      {
        id: 'prNo',
        label: 'PR No',
        type: 'text',
        isStarred: true
      },
      {
        id: 'departmentName',
        label: 'Department',
        type: 'text',
        isStarred: true
      },
      {
        id: 'plannerName',
        label: 'Planner',
        type: 'text',
        isStarred: true
      },
      {
        id: 'workflowStatus',
        label: 'Workflow Status',
        type: 'select',
        options: [
          { value: 'ALL', label: 'ALL' },
          { value: 'Draft', label: 'Draft' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Verified', label: 'Verified' },
          { value: 'Rejected', label: 'Rejected' }
        ],
        defaultValue: 'ALL',
        isStarred: true
      }
    ];
    dispatch(setFilterConfig(config));
    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  const handleOpenAdd = () => {
    navigate('/purchase/pr/entry');
  };

  const handleOpenEdit = (row) => {
    navigate(`/purchase/pr/entry/${row.id}`);
  };

  const handlePrint = (row) => {
    setPrintRowId(row.id);
  };

  const handleDelete = async (row) => {
    const confirmed = await bosConfirm({
      title: 'Are you sure?',
      message: "You won't be able to revert this!",
      type: 'warning',
      confirmText: 'Yes, delete it!'
    });
    if (confirmed) {
      try {
        await deletePurchaseRequest(row.id);
        bos.success('Deleted!', 'Purchase Request has been deleted.');
      } catch (error) {
        let errorMsg = error?.response?.data?.message || error.message || 'Failed to delete Purchase Request';
        bos.error('Error!', errorMsg);
      }
    }
  };

  useEffect(() => {
    if (printRowId) {
      getById(printRowId);
    }
  }, [printRowId, getById]);

  const printColumns = useMemo(() => [
    { id: 'itemCode', label: 'Item Code' },
    { id: 'itemName', label: 'Item Description' },
    { id: 'uom', label: 'UOM' },
    { id: 'price', label: 'Price' },
    { id: 'reqQty', label: 'Req Qty' },
    { id: 'reqDate', label: 'Req Date' },
    { id: 'amount', label: 'Amount' },
    { id: 'statusName', label: 'Status' },
    { id: 'remarks', label: 'Remarks' },
  ], []);

  const onFilter = useCallback((rowsToFilter, filters) => {
    return rowsToFilter.filter((row) => {
      // Global search bar (rawQuery)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          row.prNo?.toLowerCase().includes(query) ||
          row.departmentName?.toLowerCase().includes(query) ||
          row.plannerName?.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      if (filters.prNo && !row.prNo?.toLowerCase().includes(filters.prNo.toLowerCase())) return false;
      if (filters.departmentName && !row.departmentName?.toLowerCase().includes(filters.departmentName.toLowerCase())) return false;
      if (filters.plannerName && !row.plannerName?.toLowerCase().includes(filters.plannerName.toLowerCase())) return false;
      
      if (filters.workflowStatus && filters.workflowStatus !== 'ALL') {
        if (row.workflowStatus !== filters.workflowStatus) return false;
      }

      return true;
    });
  }, [searchQuery]);

  const columns = useMemo(() => [
    { id: 'index', label: 'Sl.No', minWidth: 70 },
    { id: 'prNo', label: 'PR No', minWidth: 120 },
    { id: 'prDate', label: 'Date', minWidth: 100 },
    { id: 'departmentName', label: 'Department', minWidth: 150 },
    { id: 'plannerName', label: 'Planner', minWidth: 150 },
    { id: 'totalItems', label: 'Total Items', align: 'right', minWidth: 100 },
    { 
      id: 'totalAmount', 
      label: 'Total Amount', 
      align: 'right', 
      minWidth: 120,
      format: (val) => val != null ? Number(val).toFixed(4) : ''
    },
    { 
      id: 'workflowStatus', 
      label: 'Workflow Status', 
      minWidth: 120,
      disableTooltip: true,
      render: (row) => (
        <BOSStatusChip status={row.workflowStatus || 'Draft'} />
      )
    },
    {
      id: 'tracking',
      label: 'Procurement Tracking',
      minWidth: 200,
      align: 'center',
      render: (row) => {
        const displayStatus = row.trackingStatus && row.trackingStatus !== 'Pending' ? row.trackingStatus : (row.workflowStatus === 'Verified' ? 'Ready for RFQ' : 'Pending');
        let statusColor = 'text.secondary';
        if (displayStatus === 'PO Issued') statusColor = '#059669'; // emerald-600
        else if (displayStatus === 'Comparison Done') statusColor = '#db2777'; // pink-600
        else if (displayStatus === 'Under Negotiation') statusColor = '#7c3aed'; // violet-600
        else if (displayStatus === 'Quotations Received') statusColor = '#d97706'; // amber-600
        else if (displayStatus === 'RFQ Issued') statusColor = '#2563eb'; // blue-600
        else if (displayStatus === 'Ready for RFQ') statusColor = '#0891b2'; // cyan-600
        
        return (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="caption" fontWeight="700" color={statusColor}>
                    {displayStatus}
                </Typography>
                <Tooltip title="View Full Lifecycle History">
                    <IconButton 
                        color="secondary" 
                        size="small" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setTrackingPrId(row.id);
                            setTrackingPrNo(row.prNo);
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
    }
  ], [navigate, theme]);

  const handleRaiseRfq = (row) => {
    navigate(`/purchase/rfq/entry?prId=${row.id}`);
  };

  const actionColumn = useMemo(() => ({
    id: 'actions',
    label: 'Actions',
    align: 'center',
    minWidth: 120,
    render: (row) => (
      <BOSRowActions
        actions={[
          {
            label: 'Raise RFQ',
            icon: <RequestQuote size={16} />,
            onClick: () => handleRaiseRfq(row),
            color: 'warning',
            tooltip: 'Raise RFQ',
            hidden: (row.workflowStatus !== 'Verified' && row.workflowStatus !== 'Approved') || row.rfqNo != null
          },

          {
            label: 'Delete',
            icon: <IconTrash size={16} />,
            onClick: () => handleDelete(row),
            color: 'error',
            tooltip: 'Delete PR',
            hidden: row.workflowStatus !== 'Draft'
          },
          {
            label: 'Print/Export',
            icon: <IconPrinter size={16} />,
            onClick: () => handlePrint(row),
            color: 'secondary',
            tooltip: 'Preview & Export PDF'
          }
        ]}
      />
    )
  }), []);

  return (
    <MainCard
      pageCode="PP0104"
      icon={ShoppingCart}
      title="Purchase Requests"
      subtitle="Manage and track all purchase requests"
      content={false}
      secondary={
        <BOSTableToolbar
          onRefresh={fetchRows}
          onNew={handleOpenAdd}
          newLabel="+ New PR"
          exportData={list}
          exportFilename="Purchase_Requests"
          columns={columns}
        />
      }
    >
      <BOSDataTable
        id="purchase-request-table"
        columns={columns}
        data={list}
        loading={loading}
        onFilter={onFilter}
        actionColumn={actionColumn}
        onDoubleClickRow={handleOpenEdit}
      />
      <BOSExportButton
        open={Boolean(printRowId && currentPR?.id === printRowId)}
        onClose={() => setPrintRowId(null)}
        data={currentPR?.transactions || []}
        columns={printColumns}
        filename={`Purchase_Request_${currentPR?.prNo || printRowId}`}
        reportName="PURCHASE REQUEST"
        reportTitle={`DOC. No : ${currentPR?.prNo || printRowId}`}
        documentDetails={[
            { label: 'Department', value: currentPR?.departmentName || currentPR?.departmentId || '-' },
            { label: 'Planner', value: currentPR?.plannerName || currentPR?.plannerId || '-' },
            { label: 'Remarks', value: currentPR?.remarks || '-' }
        ]}
        signatures={[
            { label: 'Prepared By', name: currentPR?.plannerName || currentPR?.plannerId || '' },
            { label: 'Verified By', name: currentPR?.transactions?.find(t => t.approverName)?.approverName || '' }
        ]}
        stampText={getPrStampText(currentPR?.transactions)}
        sx={{ display: 'none' }}
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
