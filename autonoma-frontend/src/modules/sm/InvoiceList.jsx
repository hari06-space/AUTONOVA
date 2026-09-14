import { useState, useEffect, useCallback } from 'react';
import { Typography, Button, Stack, Tooltip, IconButton } from '@mui/material';
import { IconRefresh, IconPlus, IconTrash, IconEdit } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSDataTable } from 'ui-component/bos';
import { useNavigate } from 'react-router-dom';

const columns = [
  { id: 'index', label: '#', minWidth: 50 },
  { id: 'invoiceNo', label: 'Invoice No', minWidth: 150, bold: true },
  { id: 'invoiceDate', label: 'Invoice Date', minWidth: 120 },
  { id: 'paymentTerms', label: 'Payment Terms', minWidth: 120 },
  { id: 'deliveryTerms', label: 'Delivery Terms', minWidth: 120 },
  { id: 'currencyCode', label: 'Currency', minWidth: 100 },
  { id: 'exchangeRate', label: 'Exchange Rate', minWidth: 120 },
  { id: 'customerPo', label: 'Customer PO', minWidth: 150 },
  { id: 'grandTotal', label: 'Grand Total', minWidth: 150, align: 'right' }
];

export default function InvoiceList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_PATHS.SM.INVOICES, {
        params: {
          page,
          size,
          sortBy: 'id',
          direction: 'desc'
        }
      });
      setRows(response.data.content || []);
      setTotalCount(response.data.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to load invoices.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [dispatch, page, size]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSizeChange = (newSize) => {
    setSize(newSize);
    setPage(0);
  };

  const handleOpenAdd = () => {
    navigate('/sm/sales/customer/invoices/create');
  };

  const handleOpenEdit = (row) => {
    navigate(`/sm/sales/customer/invoices/edit/${row.id}`);
  };

  const handleDeleteClick = (row) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.invoiceNo);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteDialogOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.INVOICES}/${deleteTargetId}`);
      dispatch(openSnackbar({ open: true, message: 'Invoice deleted successfully!', variant: 'alert', severity: 'success' }));
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to delete invoice.', variant: 'alert', severity: 'error' }));
    }
  };

  return (
    <MainCard
      title="Sales Invoicing"
      secondary={
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={fetchInvoices} color="primary">
            <IconRefresh size={20} />
          </IconButton>
          <Button variant="contained" color="secondary" startIcon={<IconPlus />} onClick={handleOpenAdd}>
            Create Invoice
          </Button>
        </Stack>
      }
    >
      <BOSDataTable
        id="sm_invoice_list"
        columns={columns}
        rows={rows.map((row, index) => ({
          ...row,
          index: page * size + index + 1,
          invoiceDate: row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : '',
          grandTotal: parseFloat(row.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }))}
        loading={loading}
        page={page}
        size={size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onSizeChange={handleSizeChange}
        actions={(row) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => handleOpenEdit(row)}>
                <IconEdit size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton color="error" onClick={() => handleDeleteClick(row)}>
                <IconTrash size={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        handleClose={() => setDeleteDialogOpen(false)}
        handleConfirm={handleDeleteConfirm}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteTargetName}"? This will reverse any stock changes.`}
      />
    </MainCard>
  );
}
