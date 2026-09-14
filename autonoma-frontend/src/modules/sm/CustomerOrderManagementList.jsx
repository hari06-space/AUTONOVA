import { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconFileDownload, IconRefresh, IconPackage } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import { BOSDataTable, BOSExportButton, btnNew } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { useNavigate, useLocation } from 'react-router-dom';

// ==============================|| SM - CUSTOMER ORDER MANAGEMENT ||============================== //

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'orderNo', label: 'Order No', minWidth: 130, bold: true, required: true },
  { id: 'orderDate', label: 'Order Date', minWidth: 110 },
  { id: 'customerName', label: 'Customer', minWidth: 180, required: true },
  { id: 'currencyCode', label: 'Currency', minWidth: 100 },
  { id: 'exchangeRate', label: 'Exchange Rate', minWidth: 120 },
  { id: 'modeOfDespatch', label: 'Mode Of Despatch', minWidth: 150 },
  { id: 'deliveryTerms', label: 'Delivery Terms', minWidth: 150 },
  { id: 'status', label: 'Status', minWidth: 100 },
  { id: 'createdBy', label: 'Created By', minWidth: 120 },
  { id: 'createdDate', label: 'Created Date', minWidth: 150 },
  { id: 'updatedDate', label: 'Updated Date', minWidth: 150 },
  { id: 'updatedBy', label: 'Updated By', minWidth: 120 }
];

export default function CustomerOrderManagementList() {
  const perms = usePagePermissions(PAGE_CODES.SM_ORDER_MANAGEMENT);
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const statusFilter = searchParams.get('status');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter) {
      const sf = statusFilter.toUpperCase();
      result = result.filter(row => {
        const s = (row.status || '').toUpperCase();
        return s === sf;
      });
    }
    return result;
  }, [rows, statusFilter]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.SM.CUSTOMER_ORDERS);
      setRows(response.data.content || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const navigate = useNavigate();

  const handleOpenAdd = () => { navigate('/sm/sales/customer/order-management/create'); };
  const handleOpenEdit = (row) => { navigate(`/sm/sales/customer/order-management/edit/${row.id}`); };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.orderNo || row.customerName);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.CUSTOMER_ORDERS}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Order deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete order.', variant: 'alert', severity: 'error' }));
    }
  };

  useKeyboardShortcuts({
    'ctrl+n': handleOpenAdd
  });

  return (
    <MainCard fullWidth
      icon={IconPackage}
      title={"Customer Order"}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">

          {perms.export && <BOSExportButton
            data={filteredRows}
            filename="SM_Orders"
            screenColumns={columns} />}
          {perms.write && <Tooltip title={shortcutTooltip('Create New Order', 'Ctrl + N')}>
            <Button variant="contained" color="primary" size="medium" onClick={handleOpenAdd} sx={btnNew}>
              + New
            </Button>
          </Tooltip>}
        </Stack>
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={(p) => setPage(p)}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
        onDoubleClickRow={perms.write ? handleOpenEdit : undefined}
        onEditRow={perms.write ? handleOpenEdit : undefined}
        onDeleteRow={perms.delete ? handleDeleteClick : undefined}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone."
        itemName={deleteTargetName}
      />
    </MainCard>
  );
}
